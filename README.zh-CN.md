# dsh-skill-experts

[English](README.md) | 中文

社区维护的 DeepSeek Harness（DSH）插件：管理**技能专家**（人格 + 磁盘技能），并通过 `summon_skill_expert` 以 spawn 子 Agent 召唤。非 DeepSeek AI 官方产品。

专家数据在 `$DSH_HOME/skill-experts/`。侧栏 **技能专家** 面板可编辑；主 Agent 在任务匹配已列专家时使用 `list_skill_experts` / `summon_skill_expert`（不要用通用 subagent 工具）。首次启动会种子两套示例：**代码审阅**、**技术写作**。

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![DSH plugin](https://img.shields.io/badge/DSH-plugin-0f766e.svg)](https://github.com/ownduck/dsh-skill-experts)

## 功能

- 侧栏 **技能专家**：新建 / 编辑 / 删除专家（名称、头像、人格）
- 每名专家的技能落盘（`SKILL.md` 与可选文件）；可新增或 **导入 zip**
- 将每名专家注册为 Agent Preset，spawn 时继承人格与隔离技能
- 模型工具：`list_skill_experts`、`summon_skill_expert`（agency 风格；禁止嵌套召唤）
- 目录为空时种子 **代码审阅**、**技术写作**

## 前置条件

- 已安装可用的 DeepSeek Harness，且终端里能运行 `dsh`（CLI 或 Desktop 自带 CLI）
- 选择 profile：`desktop`（Electron）或 `web`（浏览器）。下文两种都有。

## 安装

已发布到 npm：`@woosau/dsh-skill-experts`。不发 npm 也可从 GitHub 安装。

### Desktop（推荐）

若 `plugin` 报 profile `package.json` 的 `EPERM`，先退出 Desktop / VertaxWork。

```powershell
dsh plugin --profile desktop add @woosau/dsh-skill-experts
```

GitHub 安装：`dsh plugin --profile desktop add github:ownduck/dsh-skill-experts`

重启 Desktop。打开侧栏 **技能专家**，再开一个**新的标准模式**会话，召唤工具才会可用。

### Web

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
dsh plugin --profile web add @woosau/dsh-skill-experts
dsh --profile web --dump-config
```

GitHub：`dsh plugin --profile web add github:ownduck/dsh-skill-experts`

配置输出中应出现 `# == dsh-skill-experts` / `@woosau/dsh-skill-experts` 层和 `skill-experts` 插件行。然后重启 DSH Web，浏览器硬刷新，并开新的标准会话。

### 让 Agent 帮你安装

```text
请将 DSH 插件 @woosau/dsh-skill-experts 安装到本机 desktop profile，执行：dsh plugin --profile desktop add @woosau/dsh-skill-experts。重启 Desktop 后确认侧栏「技能专家」可用，并在新的标准会话中确认 list_skill_experts 可用。
```

### 从本地克隆安装（`file:` / `.`）

```powershell
git clone https://github.com/ownduck/dsh-skill-experts.git
cd dsh-skill-experts
dsh plugin --profile desktop add .
# 或：dsh plugin --profile web add .
dsh --profile web --dump-config
```

### 从 npm 安装（指定 registry）

```powershell
dsh plugin --profile desktop add @woosau/dsh-skill-experts@latest --registry=https://registry.npmjs.org/
```

## 卸载 / 重装

```powershell
dsh plugin --profile desktop remove @woosau/dsh-skill-experts
dsh plugin --profile desktop add @woosau/dsh-skill-experts
```

若以前用未带 scope 的键 `dsh-skill-experts` 安装过，先 `remove dsh-skill-experts`，再 `add @woosau/dsh-skill-experts`。

本地 `file:` 开发：改 `src` 后重建 `lib/`，再重启 DSH。只有改了 `package.json` / `cordis.patch.yml` 才需要重新 `plugin add`。

## 使用

1. 打开侧栏 **技能专家**
2. 新建或编辑专家：名称、头像、人格；添加技能或 **导入 zip**
3. 在**新的标准模式**会话中，让主 Agent 使用已列专家（或按名调用工具）
4. 子 Agent 使用该专家的 Agent Preset；结束后由父 Agent 汇总给你

冒烟话术：

```text
请立刻调用 list_skill_experts，再对「代码审阅」调用 summon_skill_expert。
任务：用一句话说明你是谁、能用哪些 skill 名称。不要用 subagent 工具。
等子专家完成后，把原话回报给我。
```

### 存储

| 路径 | 作用 |
| --- | --- |
| `$DSH_HOME/skill-experts/catalog.json` | 名册 |
| `$DSH_HOME/skill-experts/<id>/meta.json` | id、名称、头像、人格 |
| `$DSH_HOME/skill-experts/<id>/skills/<name>/` | 技能文件（`SKILL.md` 等） |

卸载插件**不会**删除该目录。

## 开发

```powershell
cd dsh-skill-experts
npm install --omit=peer
npm run build
dsh plugin --profile desktop add .
```

仓库提交 `lib/`，便于 GitHub / link 安装时无需本机构建链。发新版本前请先重建。文档即本 README 中英双语。

## GitHub 与 npmjs

| 渠道 | 够不够用 | 安装命令 |
| --- | --- | --- |
| **只推 GitHub** | 够 | `dsh plugin add github:ownduck/dsh-skill-experts` |
| **npmjs** | 推荐 | `dsh plugin add @woosau/dsh-skill-experts` |

推到 GitHub 即可分享与安装。发 npmjs 只是可选便利（带 scope 包名、版本号、徽章）。

## 许可证

MIT
