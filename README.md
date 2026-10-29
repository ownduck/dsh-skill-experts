# dsh-skill-experts

English | [中文](README.zh-CN.md)

Community DeepSeek Harness plugin: manage **skill experts** (persona + skills) in the sidebar and summon them from the composer / `@` menu. Not an official DeepSeek AI product.

First launch seeds four built-ins: **Frontend Developer**, **Product Manager**, **UI Designer**, and **Copywriter** (full upstream skill bodies; see [`assets/seed/UPSTREAM.md`](assets/seed/UPSTREAM.md)).

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![DSH plugin](https://img.shields.io/badge/DSH-plugin-0f766e.svg)](https://github.com/ownduck/dsh-skill-experts)

## Features

- Sidebar **Skill experts**: create / edit / delete customs, enable/disable, search and filters
- Per-expert skills (`SKILL.md` and optional files); import a skill zip on **custom** experts
- Built-in experts: edit persona/skills content; cannot delete the expert, or add / import / rename / delete its skills
- Expert package import / export (including batch export in manage mode)
- Composer **Skill experts** button and `@` group **Skill experts** insert the same reference chip; send to summon
- Optional **Continue** in the composer: reuse the same expert child session within the parent chat
- Enabled experts can also be chosen as the session Agent preset (independent of `@` summon)

## Install

Requires a working DSH install with the `dsh` CLI. Use profile `desktop` or `web`. Close Desktop first if `plugin` hits `EPERM` on the profile `package.json`.

```powershell
dsh plugin --profile desktop add @woosau/dsh-skill-experts
```

```powershell
dsh plugin --profile web add @woosau/dsh-skill-experts
```

From GitHub (latest `main`):

```powershell
dsh plugin --profile desktop add github:ownduck/dsh-skill-experts
```

Restart DSH, open the **Skill experts** sidebar, then start a new Standard session.

## Uninstall

```powershell
dsh plugin --profile desktop remove @woosau/dsh-skill-experts
```

## Usage

1. Open the **Skill experts** sidebar; create or edit experts and enable them
2. Write a clear **description** (when to use this expert) — the main agent sees name + description like a skill catalog
3. In the composer, click **Skill experts**, or type `@` and pick from the **Skill experts** group; or just describe the task so it matches a description
4. Send; the main session summons that expert and synthesizes the result
5. Turn on **Continue** if you want the next summon of the same expert to resume that child session
6. Optionally choose an expert as the session Agent preset (separate from `@` summon)

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

MIT. Seed skill text adapts MIT-licensed upstream agents/skills listed in [`assets/seed/UPSTREAM.md`](assets/seed/UPSTREAM.md).
