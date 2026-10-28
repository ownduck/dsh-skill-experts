# dsh-skill-experts

[English](README.md) | 中文

社区 DeepSeek Harness 插件：在侧栏管理**技能专家**（人格 + 技能），并通过输入栏 / `@` 召唤。非 DeepSeek AI 官方产品。

首次启动会种子示例：**代码审阅**、**技术写作**。

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![DSH plugin](https://img.shields.io/badge/DSH-plugin-0f766e.svg)](https://github.com/ownduck/dsh-skill-experts)

## 功能

- 侧栏 **技能专家**：新建 / 编辑 / 删除，启用停用，搜索筛选
- 为每位专家管理技能（`SKILL.md` 等）；支持导入技能 zip
- 专家包导入 / 导出（含管理模式批量导出）
- 输入栏 **技能专家** 按钮与 `@` 分组「技能专家」插入同一引用标签；发送即可召唤
- 已启用专家也可选为会话的 Agent 预设（与 `@` 召唤相互独立）

## 安装

需已安装 DSH 且可用 `dsh` CLI。profile 选 `desktop` 或 `web`。若 `plugin` 报 profile `package.json` 的 `EPERM`，先退出 Desktop。

```powershell
dsh plugin --profile desktop add @woosau/dsh-skill-experts
```

```powershell
dsh plugin --profile web add @woosau/dsh-skill-experts
```

GitHub：`dsh plugin --profile desktop add github:ownduck/dsh-skill-experts`

重启 DSH，打开侧栏 **技能专家**，再开一个新的标准会话即可使用。

## 卸载

```powershell
dsh plugin --profile desktop remove @woosau/dsh-skill-experts
```

## 使用

1. 打开侧栏 **技能专家**，新建或编辑专家并启用
2. 在对话输入栏点 **技能专家**，或输入 `@` 选择「技能专家」分组中的专家
3. 写好任务后发送；主会话会召唤对应专家并汇总结果
4. 需要时也可在会话设置里把某位专家选为当前 Agent 预设

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

MIT
