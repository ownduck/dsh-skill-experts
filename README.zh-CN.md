# @woosau/dsh-skill-experts

管理技能专家（头像、人格、磁盘技能），并通过 `summon_skill_expert` 以 spawn 子 Agent 召唤。

## 安装

```powershell
cd F:\data\dev\ai\lianchuan\vertax-new\work\dsh-skill-experts
pnpm install
pnpm run build
dsh plugin --profile desktop add .
```

重启 Desktop（或等 HMR），再开一个**新的标准模式**会话。

## 测试召唤

```text
请立刻调用 list_skill_experts，再对「代码审阅」调用 summon_skill_expert。
任务：用一句话说明你是谁、能用哪些 skill 名称。不要用 subagent 工具。
等子专家完成后，把原话回报给我。
```

## 存储

`$DSH_HOME/skill-experts/` — catalog 与各专家的 `meta.json`、`skills/`。
