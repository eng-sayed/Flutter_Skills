#!/usr/bin/env python3
"""Resolve a project name to a GitLab slug under icraftsa/flutter/sayed-ashraf.

Usage:
  resolve_repo.py <name> [user|provider|auto]

Prints one slug on success.
Exit 2 and two labeled lines when role is auto and both user and provider exist.
Exit 1 when nothing matches.
"""

from __future__ import annotations

import os
import re
import subprocess
import sys
from pathlib import Path

GROUP = "https://git.aait.cloud/icraftsa/flutter/sayed-ashraf"
ALIASES = Path(__file__).resolve().parent.parent / "aliases.tsv"
SLUG = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._-]*$")
URL = re.compile(
    r"https?://git\.aait\.cloud/icraftsa/flutter/sayed-ashraf/([A-Za-z0-9._-]+?)(?:\.git)?/?$"
)


def probe(slug: str) -> bool:
    env = os.environ.copy()
    env["GIT_TERMINAL_PROMPT"] = "0"
    result = subprocess.run(
        ["git", "ls-remote", "--heads", f"{GROUP}/{slug}.git"],
        env=env,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    return result.returncode == 0


def load_aliases() -> list[tuple[str, str, str]]:
    rows: list[tuple[str, str, str]] = []
    if not ALIASES.exists():
        return rows
    for line in ALIASES.read_text(encoding="utf-8").splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue
        parts = stripped.split("\t")
        if len(parts) != 3:
            continue
        rows.append((parts[0], parts[1], parts[2]))
    return rows


def from_alias(name: str) -> tuple[str, str] | None:
    key = name.strip().casefold()
    for query, user_slug, provider_slug in load_aliases():
        if query.casefold() == key:
            return user_slug, provider_slug
    return None


def candidates(name: str) -> list[str]:
    raw = name.strip().strip("/")
    match = URL.match(raw)
    if match:
        return [match.group(1)]
    token = raw.replace(" ", "-")
    out: list[str] = []
    if SLUG.match(token):
        out.append(token)
        lower = token.lower()
        if lower != token:
            out.append(lower)
        for suffix in ("-user", "-provider"):
            if not lower.endswith(suffix):
                out.append(lower + suffix)
    # de-dupe, keep order
    seen: set[str] = set()
    unique: list[str] = []
    for slug in out:
        if slug not in seen:
            seen.add(slug)
            unique.append(slug)
    return unique


def pick(user_slug: str, provider_slug: str, role: str) -> int:
    user_ok = user_slug != "-" and probe(user_slug)
    provider_ok = provider_slug != "-" and probe(provider_slug)
    if role == "user":
        if user_ok:
            print(user_slug)
            return 0
        return 1
    if role == "provider":
        if provider_ok:
            print(provider_slug)
            return 0
        return 1
    if user_ok and provider_ok:
        print(f"user\t{user_slug}")
        print(f"provider\t{provider_slug}")
        return 2
    if user_ok:
        print(user_slug)
        return 0
    if provider_ok:
        print(provider_slug)
        return 0
    return 1


def main() -> int:
    if len(sys.argv) < 2:
        print("usage: resolve_repo.py <name> [user|provider|auto]", file=sys.stderr)
        return 1
    name = sys.argv[1]
    role = sys.argv[2] if len(sys.argv) > 2 else "auto"
    if role not in {"user", "provider", "auto"}:
        print("role must be user, provider, or auto", file=sys.stderr)
        return 1

    aliased = from_alias(name)
    if aliased:
        code = pick(aliased[0], aliased[1], role)
        if code != 1:
            return code

    found_user = ""
    found_provider = ""
    found_other: list[str] = []
    for slug in candidates(name):
        if not probe(slug):
            continue
        if slug.endswith("-user"):
            found_user = slug
        elif slug.endswith("-provider"):
            found_provider = slug
        else:
            found_other.append(slug)

    if role == "user" and found_user:
        print(found_user)
        return 0
    if role == "provider" and found_provider:
        print(found_provider)
        return 0
    if role == "auto" and found_user and found_provider:
        print(f"user\t{found_user}")
        print(f"provider\t{found_provider}")
        return 2
    if found_user and role != "provider":
        print(found_user)
        return 0
    if found_provider and role != "user":
        print(found_provider)
        return 0
    if found_other:
        print(found_other[0])
        return 0
    return 1


if __name__ == "__main__":
    sys.exit(main())
