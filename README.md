# dsh-skill-experts

English | [中文](README.zh-CN.md)

Manage **skill experts** in the sidebar and summon them in chat for specialized work. Community DeepSeek Harness plugin — not an official DeepSeek AI product.

First launch includes four built-ins: Frontend Developer, Product Manager, UI Designer, and Copywriter.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## What it does

- Create, edit, enable, or disable experts in the sidebar
- Give each expert a description, persona, and skills; import / export expert packages
- Summon from the composer **Skill experts** button or `@` mention
- **Continue** (on by default): summoning the same expert again in this chat picks up where you left off; turn it off for a fresh start. Each chat remembers its own setting
- Or set an enabled expert as the session Agent when you want that expert to lead the whole conversation

## Install

```powershell
dsh plugin --profile desktop add @woosau/dsh-skill-experts
```

```powershell
dsh plugin --profile web add @woosau/dsh-skill-experts
```

Or install the latest from GitHub:

```powershell
dsh plugin --profile desktop add github:ownduck/dsh-skill-experts
```

Restart the app, then open the **Skill experts** sidebar.

## Uninstall

```powershell
dsh plugin --profile desktop remove @woosau/dsh-skill-experts
```

## How to use

1. Create or enable experts in the sidebar; write a clear **description** (when to use them)
2. In chat, click **Skill experts** or `@` pick one — or just describe the task so a matching description can auto-summon
3. Send; the main chat summons the expert and summarizes the result
4. Leave **Continue** on to keep talking with the same expert; turn it off for a clean slate
5. To let one expert lead the whole session, choose them as the session Agent

## License

MIT. Built-in skill text sources: [`assets/seed/UPSTREAM.md`](assets/seed/UPSTREAM.md).
