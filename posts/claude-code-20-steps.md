---
title: "Claude Code 架构深度解析：20 步从零构建工业级 Agent Harness"
date: "2026-04-07"
description: "从启动序列到自主智能体集群，全方位拆解 Claude Code 的 20 层核心架构。"
series: "Claude Code 源码系列"
---

# 🏗️ Claude Code 架构深度解析：20 步从零构建工业级 Agent Harness

在大模型的圈子里，人们常说“模型是灵魂，Harness 是肉体”。没有 Harness（支架/工程层），AI 只是一个被困在输入框里的灵魂，看不见源代码，更写不出可运行的系统。

今天，我们将根据最新的“归档”资料，深度拆解 **Claude Code** 的 20 层核心架构。这是一条从简单的“启动流程”到复杂的“自主智能体集群”的完整进化之路。

---

## 🗺️ 架构全局地图

我们将这 20 个步骤分为四个进化阶段：

1.  **基础设施层 (s01-s06)**：地基与感官。
2.  **智能内核层 (s07-s09)**：记忆、上下文与扩展。
3.  **任务规划层 (s10-s12)**：把目标拆解为可执行的步骤。
4.  **高级生态层 (s13-s20)**：多 Agent 协作、沙箱隔离与自主运行。

---

## 🛠️ 第一阶段：基础设施 (s01 - s06)

这是 Claude Code 的“地基”。如果这层不稳，Agent 就会出现权限混乱、启动缓慢或由于配置冲突而崩溃。

### s01: 启动流程 (Bootstrap)
**核心点：并行的极致优化。**
Claude Code 为了极致的启动速度（~500ms），在 `import` 阶段就异步启动了 macOS Keychain 读取和 MDM 策略检查。这种“副作用前置”虽然违反了常规，但换来了用户感知的“零时延”。

### s04: 智能体循环 (Agent Loop)
那是 `query.ts` 里的一个 `while(true)`。
```typescript
while (true) {
  // 1. 调用模型 -> 2. 解析 stop_reason -> 3. 执行工具 -> 4. 将结果喂回模型
  // 直到 stop_reason === 'end_turn'
}
```
这是 Agent 的心脏，所有的思考和行动都发生在这个循环里。

---

## 🧠 第二阶段：智能内核 (s07 - s09)

如何让 Agent 在长对话中不“失忆”，并且能够高效处理成千上万行的代码？

### s08: 上下文压缩 (Context Compacting)
当对话快塞满 200k 窗口时，Agent 会自动触发压缩：
- 剔除冗余的工具调用过程。
- 只保留最新的文件快照和关键决策。
- **Auto-Compact** 机制确保了 Agent 能在持续几天的会话中依然保持清醒。

### s09: Hooks 系统
Claude Code 提供了 20+ 个生命周期钩子（`pre_tool_use`, `file_changed` 等）。
> [!TIP]
> 你可以通过配置 Hook，在 Agent 修改关键文件前自动运行 Python 脚本进行安全审计。

---

## 📅 第三阶段：任务规划 (s10 - s12)

Agent 不能“拍脑门”就写代码，它需要计划。

### s10: TodoWrite (待办写入)
这是一个强约束工具。Agent 必须先列出步骤，且同时只能有一个任务处于 `in_progress`。这种“强制顺序聚焦”极大地减少了模型在复杂重构任务中的跑偏概率。

### s12: 任务系统 (Task System)
从简单的 Todo 升级到支持依赖关系的 DAG（有向无环图）：
- `task_A` blocks `task_B`。
- 多 Agent 协作时，任务系统可以作为共享的“看板”，确保步调一致。

---

## 🚀 第四阶段：高级生态 (s13 - s20)

真正的“工业级”体现在这些看似边缘但至关重要的能力上。

### s13: 子智能体 (SubAgent)
递归的力量。父 Agent 感到上下文太重时，可以派生出一个专门负责“重构 CSS”或“编写单元测试”的子 Agent，拥有完全独立的系统提示和工具池。

### s19: Worktree 隔离
**安全隔离的巅峰。**
在处理不信任的分支或高风险操作时，Agent 会利用 `git worktree` 开辟一个干净的临时工作区，修改完并验证通过后才合回主分支。即使 Agent 搞砸了，主目录依然是安全的。

### s20: 自主智能体 (Autonomous Agents)
Claude Code 进化到了“无人机”模式。通过 `CronCreateTool` 注册定时任务，加上 `--autonomous` 标志，即使你关掉电脑，Agent 也能在云端或后台静默工作，结果通过 Slack 或邮件推送到你的桌面。

---

## 📊 架构全景表 (s01-s20)

| 阶段 | 关键模块 | 核心职责 |
| :--- | :--- | :--- |
| **基础** | Bootstrap (s01) | 并行加载、性能分析、快如闪电。 |
| | Auth (s03) | OAuth / API Key / AWS / GCP 多渠道认证。 |
| | Tool Dispatch (s05) | 动态工具池，支持 Bash, FS, Grep 等。 |
| **内核** | Memory (s07) | 长期记忆与 CLAUDE.md 军规。 |
| | Compacting (s08) | 200k 上下文窗口的智能垃圾回收。 |
| **规划** | Plan Mode (s11) | 只看不改，先出方案再施工。 |
| | Task Sys (s12) | 跨 Agent 共享的任务调度中心。 |
| **进阶** | Skill Loading (s14) | 动态加载外部 JavaScript 编写的技能。 |
| | Agent Teams (s16) | 多智能体集群协议（Leader / Follower）。 |
| | **Autonomous** | 脱离 TTY，后台自主运行。 |

---

## 💡 总结：工程化的深度决定 AI 的高度

从 `s01` 到 `s20`，Claude Code 证明了：做一个好用的 AI 助手，不仅仅是 Prompt Engineering，更是庞大的、精密的软件架构。

当你运行 `claude` 时，这 20 个系统正在后台高速运转，它们各司其职，共同护航着每一次代码的生成与修改。

---

> [!IMPORTANT]
> **下一步建议**：如果你想深入学习其中的某一层，建议从 [s04: 智能体循环](./s04-agent-loop.md) 开始，那是理解 Agent 行为的第一步。

> **本文系列**：[Day 01 - 项目概览](./claude-code-architecture.md) | [Day 02 - 启动流程](./day02-startup-flow.md) | **20 步架构全景图**（本篇）
