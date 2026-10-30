# dsh-skill-experts

[English](README.md) | 中文

在侧栏管理**技能专家**，在对话里召唤他们帮你完成专项工作。社区 DeepSeek Harness 插件，非 DeepSeek AI 官方产品。

首次使用会带上四位内置专家：Frontend Developer、Product Manager、UI Designer、Copywriter。

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## 能做什么

- 在侧栏新建、编辑、启用或停用专家
- 为每位专家设置简介、人格与技能；可导入 / 导出专家包
- 在输入栏点 **技能专家**，或用 `@` 点名，发送后即可召唤
- **续聊**（默认开启）：同一会话里再次召唤同一专家时，接着上次继续聊；关掉则重新开一轮。每个会话各自记住开关状态
- 也可把某位已启用专家直接选为当前会话的 Agent

## 安装

```powershell
dsh plugin --profile desktop add @woosau/dsh-skill-experts
```

```powershell
dsh plugin --profile web add @woosau/dsh-skill-experts
```

或从 GitHub 安装最新版：

```powershell
dsh plugin --profile desktop add github:ownduck/dsh-skill-experts
```

安装后重启应用，打开侧栏 **技能专家** 即可使用。

## 卸载

```powershell
dsh plugin --profile desktop remove @woosau/dsh-skill-experts
```

## 怎么用

1. 在侧栏创建或启用专家，写好**简介**（什么时候该找 TA）
2. 对话时点 **技能专家** 或 `@` 选择；也可以只描述任务，让简介匹配后自动召唤
3. 发送后，主会话会召唤专家并汇总结果
4. 需要接着聊就保持 **续聊** 开启；想让专家从零开始就关掉
5. 需要整段对话都由某位专家主导时，可在会话里把它选为 Agent

## 许可证

MIT。内置技能正文来源见 [`assets/seed/UPSTREAM.md`](assets/seed/UPSTREAM.md)。
