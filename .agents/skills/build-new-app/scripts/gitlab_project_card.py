#!/usr/bin/env python3
"""Set GitLab project description (Adham card line) + avatar from ic_launcher."""
from __future__ import annotations

import argparse
import re
import subprocess
import sys
import tempfile
import urllib.parse
from pathlib import Path
from urllib.parse import urlparse, urlunparse

LAUNCHER = "android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png"


def admin_login(url: str) -> str:
    if not url:
        return ""
    p = urlparse(url.strip())
    if not p.scheme:
        p = urlparse("https://" + url.strip())
    return urlunparse((p.scheme or "https", p.netloc, "/admin/login", "", "", ""))


def md_link(label: str, url: str | None) -> str:
    return f"[{label}]({(url or '').strip()})"


def build_description(code: str, figma: str, admin: str, postman: str) -> str:
    return (
        f"{code} - {md_link('Design', figma)} - {md_link('Admin', admin)} - "
        f"{md_link('Collection', postman)} - {md_link('app store', '')} - {md_link('google play', '')}"
    )


def git_password() -> str:
    proc = subprocess.run(
        ["git", "credential", "fill"],
        input="protocol=https\nhost=git.aait.cloud\n\n",
        capture_output=True,
        text=True,
        check=False,
    )
    for line in proc.stdout.splitlines():
        if line.startswith("password="):
            return line.split("=", 1)[1]
    raise SystemExit("Could not read git.aait.cloud password from git credential")


def login_session(cookie_jar: Path) -> None:
    password = git_password()
    subprocess.run(
        [
            "curl", "-sS", "-c", str(cookie_jar), "-b", str(cookie_jar),
            "-o", str(cookie_jar.with_suffix(".html")),
            "https://git.aait.cloud/users/sign_in",
        ],
        check=True,
    )
    html = cookie_jar.with_suffix(".html").read_text(encoding="utf-8", errors="replace")
    m = re.search(r'name="authenticity_token" value="([^"]+)"', html)
    if not m:
        raise SystemExit("GitLab sign-in page missing authenticity_token")
    token = m.group(1)
    subprocess.run(
        [
            "curl", "-sS", "-c", str(cookie_jar), "-b", str(cookie_jar),
            "-o", "/dev/null", "-X", "POST", "https://git.aait.cloud/users/sign_in",
            "--data-urlencode", f"authenticity_token={token}",
            "--data-urlencode", "user[login]=sayedashraf",
            "--data-urlencode", f"user[password]={password}",
            "--data-urlencode", "user[remember_me]=0",
        ],
        check=True,
    )


def repo_path_from_url(repo_url: str) -> str:
    u = repo_url.strip().rstrip("/")
    if u.endswith(".git"):
        u = u[:-4]
    p = urlparse(u)
    path = p.path.lstrip("/")
    if not path:
        raise SystemExit(f"Invalid repo URL: {repo_url}")
    return path


def parse_edit_form(html: str) -> tuple[str, str]:
    token_m = re.search(
        r'class="edit-project js-general-settings-form".*?name="authenticity_token" value="([^"]+)"',
        html,
        re.S,
    )
    name_m = re.search(r'id="project_name_edit"[^>]*value="([^"]*)"', html)
    if not token_m or not name_m:
        raise SystemExit("Could not parse GitLab project edit form")
    return token_m.group(1), name_m.group(1)


def main() -> int:
    ap = argparse.ArgumentParser(description="Update GitLab project card")
    ap.add_argument("--repo-url", required=True, help="GitLab project URL or .git remote")
    ap.add_argument("--code", required=True, help="Project ticket code e.g. CS54497")
    ap.add_argument("--admin", required=True, help="Admin base or full /admin/login URL")
    ap.add_argument("--figma", default="", help="Figma prototype URL")
    ap.add_argument("--postman", default="", help="Postman documenter or collection URL")
    ap.add_argument("--project-dir", required=True, help="Local Flutter project root")
    args = ap.parse_args()

    project_dir = Path(args.project_dir).expanduser()
    icon = project_dir / LAUNCHER
    if not icon.is_file():
        print(f"error: missing launcher {icon}", file=sys.stderr)
        return 1

    ns = repo_path_from_url(args.repo_url)
    admin = args.admin if "/admin/login" in args.admin else admin_login(args.admin)
    desc = build_description(args.code.strip(), args.figma, admin, args.postman)

    with tempfile.TemporaryDirectory() as tmp:
        cookie = Path(tmp) / "cookies.txt"
        login_session(cookie)

        edit_url = f"https://git.aait.cloud/{ns}/edit"
        post_url = f"https://git.aait.cloud/{ns}"
        edit_html = Path(tmp) / "edit.html"
        subprocess.run(
            ["curl", "-sS", "-b", str(cookie), "-c", str(cookie), "-o", str(edit_html), edit_url],
            check=True,
        )
        csrf, name = parse_edit_form(edit_html.read_text(encoding="utf-8", errors="replace"))

        out_html = Path(tmp) / "post.html"
        proc = subprocess.run(
            [
                "curl", "-sS", "-b", str(cookie), "-c", str(cookie),
                "-X", "POST", "-o", str(out_html), "-w", "%{http_code}",
                "-F", "_method=patch",
                "-F", f"authenticity_token={csrf}",
                "-F", "update_section=js-general-settings",
                "-F", f"project[name]={name}",
                "-F", f"project[description]={desc}",
                "-F", f"project[avatar]=@{icon};type=image/png",
                post_url,
            ],
            capture_output=True,
            text=True,
        )
        code = (proc.stdout or "").strip()
        ok = code in {"200", "302"}
        print(f"repo={ns}")
        print(f"description={desc[:120]}...")
        print(f"post_http={code} ok={ok}")
        return 0 if ok else 2


if __name__ == "__main__":
    sys.exit(main())
