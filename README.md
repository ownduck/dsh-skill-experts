# dsh-skill-experts

English | [中文](README.zh-CN.md)

Community DeepSeek Harness (DSH) plugin for managing **skill experts** (persona + on-disk skills) and summoning them as spawn subagents via `summon_skill_expert`. Not an official DeepSeek AI product.

Experts live under `$DSH_HOME/skill-experts/`. The sidebar **Skill experts** panel edits them; the main agent uses `list_skill_experts` / `summon_skill_expert` (not the generic subagent tool) when a listed expert fits the task. First launch seeds two examples: **代码审阅** and **技术写作**.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![DSH plugin](https://img.shields.io/badge/DSH-plugin-0f766e.svg)](https://github.com/ownduck/dsh-skill-experts)

## Features

- Sidebar **Skill experts** panel: create / edit / delete experts (name, avatar, persona)
- Per-expert skills on disk (`SKILL.md` + optional files); add skills or import a zip
- Registers each expert as an Agent Preset so spawn inherits persona and isolated skills
- Model tools: `list_skill_experts`, `summon_skill_expert` (agency-style; no nested summon)
- Seeds **代码审阅** and **技术写作** when the catalog is empty

## Prerequisites

- A working DeepSeek Harness install with `dsh` on your PATH (CLI or Desktop-bundled CLI)
- Pick a profile: `desktop` (Electron app) or `web` (browser UI). Examples below show both.

## Installation

Published on npm as `@woosau/dsh-skill-experts`. GitHub install still works without npm.

### Desktop (recommended)

Close Desktop / VertaxWork first if `plugin` fails with `EPERM` on the profile `package.json`.

```powershell
dsh plugin --profile desktop add @woosau/dsh-skill-experts
```

From GitHub instead: `dsh plugin --profile desktop add github:ownduck/dsh-skill-experts`

Restart Desktop. Open the **Skill experts** sidebar, then start a **new Standard** session so the summon tools are available.

### Web

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
dsh plugin --profile web add @woosau/dsh-skill-experts
dsh --profile web --dump-config
```

GitHub: `dsh plugin --profile web add github:ownduck/dsh-skill-experts`

The dump should contain a `# == dsh-skill-experts` / `@woosau/dsh-skill-experts` layer and a `skill-experts` plugin row. Restart DSH Web, hard-refresh the browser, and open a new Standard session.

### Ask an agent to install it

```text
Install the DSH plugin @woosau/dsh-skill-experts into my local desktop profile by running: dsh plugin --profile desktop add @woosau/dsh-skill-experts. Then confirm the Skill experts sidebar appears after restarting Desktop, and that list_skill_experts works in a new Standard session.
```

### From a local clone (`file:` / `.`)

```powershell
git clone https://github.com/ownduck/dsh-skill-experts.git
cd dsh-skill-experts
dsh plugin --profile desktop add .
# or: dsh plugin --profile web add .
dsh --profile web --dump-config
```

### From npm (explicit registry)

```powershell
dsh plugin --profile desktop add @woosau/dsh-skill-experts@latest --registry=https://registry.npmjs.org/
```

## Uninstall / reinstall

```powershell
dsh plugin --profile desktop remove @woosau/dsh-skill-experts
dsh plugin --profile desktop add @woosau/dsh-skill-experts
```

Older installs that used the unscoped key `dsh-skill-experts` should `remove dsh-skill-experts` first, then `add @woosau/dsh-skill-experts`.

For a `file:` / local checkout, rebuild `lib/` after source changes, then restart DSH. Re-run `plugin add` only when `package.json` or `cordis.patch.yml` changed.

## Usage

1. Open the **Skill experts** sidebar
2. Create or edit an expert: name, avatar, persona; add skills or **Import zip**
3. In a **new Standard** session, ask the main agent to use a listed expert (or call the tools by name)
4. The child runs with that expert’s Agent Preset; after it finishes, the parent synthesizes for you

Smoke prompt:

```text
Please call list_skill_experts, then summon_skill_expert for 「代码审阅」.
Task: in one sentence, say who you are and which skill names you can use. Do not use the generic subagent tool.
When the expert finishes, report its reply verbatim.
```

### Storage

| Path | Role |
| --- | --- |
| `$DSH_HOME/skill-experts/catalog.json` | Roster |
| `$DSH_HOME/skill-experts/<id>/meta.json` | id, name, avatar, persona |
| `$DSH_HOME/skill-experts/<id>/skills/<name>/` | Skill files (`SKILL.md`, …) |

Deleting the plugin does **not** remove this directory.

## Development

```powershell
cd dsh-skill-experts
npm install --omit=peer
npm run build
dsh plugin --profile desktop add .
```

`lib/` is committed so GitHub / link installs work without a local build toolchain. Rebuild before publishing a new version. Docs are this README pair only.

## GitHub vs npmjs

| Channel | Enough for users? | Install command |
| --- | --- | --- |
| **GitHub only** | Yes | `dsh plugin add github:ownduck/dsh-skill-experts` |
| **npmjs** | Recommended | `dsh plugin add @woosau/dsh-skill-experts` |

Pushing to GitHub is enough to share and install. Publishing to npmjs is optional convenience (scoped name, version tags, npm badges).

## License

MIT
