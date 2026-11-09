---
name: codex-plan
description: >-
  Codex يخطط (read-only) ثم أنت تنفّذ في Cursor. استخدمها عندما يذكر المستخدم
  @codex-plan، أو cp:، أو /cp، أو بلان+، أو codex-plan، أو يطلب مسار «كودكس يخطط».
disable-model-invocation: true
---

# codex-plan — كودكس يخطط، Cursor ينفّذ

## استدعاء سريع (للمستخدم)

| الطريقة | مثال |
|--------|------|
| **Skill** | `@codex-plan` ثم المطلوب |
| **اختصار `cp:`** | `cp: أضف شاشة OTP في washio` |
| **موديل مخصص** | `cp@gpt-5.4: refactor auth cubit` |
| **سلاش** | `/cp fix pagination في elsaidy` |

بعد الاختصار اكتب المهمة فقط — لا حاجة لذكر «خلي كودكس يخطط» كل مرة.

## نفّذ فور تحميل هذه Skill أو عند أي trigger أعلاه

### 1. استخرج من رسالة المستخدم

- **الموديل:** إن وُجد `cp@MODEL:` أو `model MODEL` أو `بموديل MODEL` → `-m MODEL`. وإلا `gpt-5.6-luna`.
- **المهمة:** النص بعد `cp:` / `/cp` / `@codex-plan` (بدون بادئة الموديل).
- **المجلد:** `-C` = جذر الوركسبيس أو المسار الذي حدده المستخدم.

### 2. Codex (تخطيط فقط)

```bash
/Applications/ChatGPT.app/Contents/Resources/codex-cli/CodexCLI.app/Contents/MacOS/codex exec \
  --sandbox read-only \
  -m "<model>" \
  -C "<repo>" \
  -
```

البرومبت عبر stdin: خطة تنفيذ (خطوات، ملفات، gates، مخاطر، ما لا يُغيّر). **لا تعديل ملفات من Codex.**

### 3. Cursor (تنفيذ)

راجع الخطة → نفّذ هنا → gates → ملخص قصير.

### فشل Codex

اشرح السبب؛ اقترح `codex login`. لا تستبدل الخطة بخطة منك إلا إذا طلب المستخدم ذلك.

### MCP

مزامنة Cursor → Codex: `python3 ~/.codex/scripts/mirror-cursor-mcp.py`
