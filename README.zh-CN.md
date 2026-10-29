# dsh-skill-experts

[English](README.md) | 中文

社区 DeepSeek Harness 插件：在侧栏管理**技能专家**（人格 + 技能），并通过输入栏 / `@` 召唤。非 DeepSeek AI 官方产品。

首次启动会种子四个内置专家：**Frontend Developer**、**Product Manager**、**UI Designer**、**Copywriter**（下属 skill 为上游全文；说明见 [`assets/seed/UPSTREAM.md`](assets/seed/UPSTREAM.md)）。

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![DSH plugin](https://img.shields.io/badge/DSH-plugin-0f766e.svg)](https://github.com/ownduck/dsh-skill-experts)

## 功能

- 侧栏 **技能专家**：新建 / 编辑 / 删除自定义专家，启用停用，搜索筛选
- 为每位专家管理技能（`SKILL.md` 等）；**自定义**专家支持导入技能 zip
- **内置**专家：可改人格与技能正文；不可删除专家，也不可新增 / 导入 / 重命名 / 删除其技能
- 专家包导入 / 导出（含管理模式批量导出）
- 输入栏 **技能专家** 按钮与 `@` 分组「技能专家」插入同一引用标签；发送即可召唤
- 输入栏可选 **续聊**：同一主会话内再次召唤同一专家时复用子会话
- 已启用专家也可选为会话的 Agent 预设（与 `@` 召唤相互独立）

## 安装

需已安装 DSH 且可用 `dsh` CLI。profile 选 `desktop` 或 `web`。若 `plugin` 报 profile `package.json` 的 `EPERM`，先退出 Desktop。

```powershell
dsh plugin --profile desktop add @woosau/dsh-skill-experts
```

```powershell
dsh plugin --profile web add @woosau/dsh-skill-experts
```

从 GitHub 安装（`main` 最新）：

```powershell
dsh plugin --profile desktop add github:ownduck/dsh-skill-experts
```

重启 DSH，打开侧栏 **技能专家**，再开一个新的标准会话即可使用。

## 卸载

```powershell
dsh plugin --profile desktop remove @woosau/dsh-skill-experts
```

## 使用

1. 打开侧栏 **技能专家**，新建或编辑专家并启用
2. 写好专家 **简介**（何时该用 TA）——主会话会像 skill 目录一样看到 name + description
3. 在输入栏点 **技能专家**，或 `@` 选择专家；也可以只描述任务，让简介匹配后自动召唤
4. 发送后主会话会召唤专家并汇总结果
5. 需要接着聊时打开 **续聊**，再次召唤同一专家会复用原子会话
6. 需要时也可在会话设置里把某位专家选为当前 Agent 预设

### 专家包格式

```
{专家名全拼}.zip
├── meta.json
└── skills/
    └── {skill-kebab}/
        ├── SKILL.md
        └── …

skill-experts.zip          # 批量导出
├── {专家名全拼}/
│   ├── meta.json
│   └── skills/…
└── …
```

导入支持以上两种布局，并始终新建自定义专家。

## 许可证

MIT。种子 skill 正文改编自上游 MIT 内容，见 [`assets/seed/UPSTREAM.md`](assets/seed/UPSTREAM.md)。
