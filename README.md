# dsh-skill-experts

English | [中文](README.zh-CN.md)

Community DeepSeek Harness plugin: manage **skill experts** (persona + skills) in the sidebar and summon them from the composer / `@` menu. Not an official DeepSeek AI product.

First launch seeds two examples: **代码审阅** and **技术写作**.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![DSH plugin](https://img.shields.io/badge/DSH-plugin-0f766e.svg)](https://github.com/ownduck/dsh-skill-experts)

## Features

- Sidebar **Skill experts**: create / edit / delete, enable/disable, search and filters
- Per-expert skills (`SKILL.md` and optional files); import a skill zip
- Expert package import / export (including batch export in manage mode)
- Composer **Skill experts** button and `@` group **Skill experts** insert the same reference chip; send to summon
- Enabled experts can also be chosen as the session Agent preset (independent of `@` summon)

## Install

Requires a working DSH install with the `dsh` CLI. Use profile `desktop` or `web`. Close Desktop first if `plugin` hits `EPERM` on the profile `package.json`.

```powershell
dsh plugin --profile desktop add @woosau/dsh-skill-experts
```

```powershell
dsh plugin --profile web add @woosau/dsh-skill-experts
```

GitHub: `dsh plugin --profile desktop add github:ownduck/dsh-skill-experts`

Restart DSH, open the **Skill experts** sidebar, then start a new Standard session.

## Uninstall

```powershell
dsh plugin --profile desktop remove @woosau/dsh-skill-experts
```

## Usage

1. Open the **Skill experts** sidebar; create or edit experts and enable them
2. In the composer, click **Skill experts**, or type `@` and pick from the **Skill experts** group
3. Write the task and send; the main session summons that expert and synthesizes the result
4. Optionally choose an expert as the session Agent preset (separate from `@` summon)

### Expert package format

```
{pinyin-slug}.zip
├── meta.json
└── skills/
    └── {skill-kebab}/
        ├── SKILL.md
        └── …

skill-experts.zip          # batch export
├── {pinyin-slug}/
│   ├── meta.json
│   └── skills/…
└── …
```

Import accepts either layout and always creates new custom experts.

## License

MIT
