# @woosau/dsh-skill-experts

Manage skill experts (avatar, persona, skills on disk) and summon them as spawn subagents via `summon_skill_expert`.

## Install

```powershell
cd F:\data\dev\ai\lianchuan\vertax-new\work\dsh-skill-experts
pnpm install
pnpm run build
dsh plugin --profile desktop add .
```

Restart Desktop (or wait for HMR), then open a **new Standard** session.

## Test summon

```text
请立刻调用 list_skill_experts，再对「代码审阅」调用 summon_skill_expert。
任务：用一句话说明你是谁、能用哪些 skill 名称。不要用 subagent 工具。
等子专家完成后，把原话回报给我。
```

## Storage

`$DSH_HOME/skill-experts/` — catalog + per-expert `meta.json` and `skills/`.
