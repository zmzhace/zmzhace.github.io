---
title: "Claude Code 源码解析：工业级 AI Coding Agent 的架构全景"
date: "2026-03-31"
description: "逐层拆解 Claude Code 的架构与模块——从入口到工具系统，从状态管理到 MCP 协议，带你看懂一个真正工业级 AI Agent 的「骨与肉」。"
series: "Claude Code 源码系列"
---

# 🔬 Claude Code 源码解析：工业级 AI Coding Agent 的架构全景

> 这是一个系列解析。我们将逐层拆解 Claude Code 的每一块代码，理解 Anthropic 工程师是如何把一个"聊天框"打造成一个能自主开发软件的 AI Agent 的。

---

## 📋 系列目录（每日一节）

| Day | 主题 | 核心问题 |
|-----|------|----------|
| **Day 01** | 项目概览 & 技术栈 | 这是什么？用了什么技术？ |
| **Day 02** | 入口与启动流程 | 从 `main.tsx` 到 REPL，发生了什么？ |
| **Day 03** | 查询引擎 `QueryEngine.ts` | 用户输入如何变成工具调用？ |
| **Day 04** | 工具系统（44 个工具） | 工具是怎么定义和执行的？ |
| **Day 05** | 命令系统（88+ 命令） | `/commit`、`/review` 是如何注册的？ |
| **Day 06** | 状态管理 `AppState` | Zustand 风格的状态是怎么设计的？ |
| **Day 07** | 终端 UI 渲染 `ink/` | 为什么 CLI 也能有如此丰富的 UI？ |
| **Day 08** | Anthropic API 层 | 如何处理流式输出、重试、限速？ |
| **Day 09** | MCP 协议实现 | 什么是 Model Context Protocol？ |
| **Day 10** | 权限系统 | 危险操作是如何被拦截和审批的？ |
| **Day 11** | 插件 & 技能系统 | 如何动态扩展 Agent 的能力？ |
| **Day 12** | 任务系统 & Agent 群组 | Swarm 和多 Agent 协作是怎么做的？ |

---

## 🗺️ Day 01 — 项目概览：这是什么？

### 一句话定义

**Claude Code** 是 Anthropic 官方出品的 CLI（命令行工具），它让 Claude AI 能够在本地终端中直接操作文件、执行命令、调用外部服务——本质上是一个**在终端里跑的 AI 程序员**。

它不是一个"把 API 包一层"的套壳工具。它拥有：

- **44 个工具**（文件读写、Bash 执行、Web 搜索、子 Agent 派发……）
- **88+ 个斜杠命令**（`/commit`、`/review`、`/mcp`、`/agents`……）
- **完整的权限系统**（哪些操作要审批、哪些自动放行）
- **插件 + 技能的动态扩展机制**
- **MCP（Model Context Protocol）**：连接第三方工具服务器

---

### 🛠️ 技术栈一览

```
语言        TypeScript（含 TSX React 组件）
运行时      Node.js 18+
构建器      Bun（支持 feature flag 死代码消除）
UI 框架     React + 自定义 Ink（终端 React 渲染器）
API 客户端  @anthropic-ai/sdk
协议支持    MCP（@modelcontextprotocol/sdk）
状态管理    类 Zustand 自研 AppStateStore
数据校验    Zod
特性开关    GrowthBook
```

---

### 📂 顶层目录结构

```
src/
├── main.tsx              # 🚪 CLI 总入口（Commander.js 参数解析 + 路由）
├── setup.ts              # 🔧 初始化：版本检查、目录、消息服务器
├── context.ts            # 🧠 上下文生成：git 状态 + Claude.md 注入系统提示
├── QueryEngine.ts        # ⚙️  核心查询引擎（46KB）
├── query.ts              # 🔄 底层查询执行（68KB）
├── Tool.ts               # 🧰 工具类型定义与接口
├── tools.ts              # 📦 工具注册表
├── commands.ts           # 📜 命令注册与路由
├── Task.ts               # 📋 任务类型定义
│
├── commands/             # 88 个命令实现
├── tools/                # 44 个工具实现
├── components/           # 33 个终端 UI 组件
├── hooks/                # 70+ 自定义 React Hooks
├── state/                # 状态管理层
├── services/             # 外部服务集成（API、MCP、插件、分析）
├── utils/                # 60+ 工具函数模块
├── ink/                  # 自定义终端渲染引擎（40+ 模块）
├── skills/               # AI 技能系统
├── plugins/              # 插件系统
├── tasks/                # 任务执行层
└── types/                # 全局类型定义
```

---

### 🏗️ 架构总览图

```
┌──────────────────────────────────────────────────────────────┐
│                    main.tsx（CLI 入口）                        │
│   解析命令行参数 → 初始化 → 路由到 REPL 或命令处理器          │
└─────────────────────────┬────────────────────────────────────┘
                          │
          ┌───────────────┴───────────────┐
          │                               │
    ┌─────▼──────┐                 ┌──────▼──────┐
    │  setup.ts  │                 │ commands.ts │
    │ （初始化）  │                 │ （88 条命令）│
    └─────┬──────┘                 └──────┬──────┘
          │                               │
          └────────────┬──────────────────┘
                       │
    ┌──────────────────▼────────────────────────┐
    │       entrypoints/cli.tsx（主界面）         │
    │  ┌─────────────────────────────────────┐  │
    │  │      AppStateProvider（状态中心）    │  │
    │  │  ┌───────────────────────────────┐  │  │
    │  │  │      App.tsx（REPL 主循环）    │  │  │
    │  │  │  用户输入 → QueryEngine        │  │  │
    │  │  │  工具执行 → 流式 API 响应      │  │  │
    │  │  └───────────────────────────────┘  │  │
    │  └─────────────────────────────────────┘  │
    └──────────────┬────────────────────────────┘
                   │
      ┌────────────┼──────────────┐
      │            │              │
 ┌────▼───┐  ┌────▼────┐  ┌──────▼────────┐
 │ tools/ │  │ state/  │  │  services/    │
 │ 44工具  │  │ 状态管理 │  │ API/MCP/插件  │
 └────────┘  └─────────┘  └──────────────┘
                                 │
                    ┌────────────┼────────────┐
                    │            │             │
               ┌────▼──┐  ┌─────▼──┐  ┌──────▼──┐
               │Claude │  │  MCP   │  │ Local   │
               │  API  │  │Servers │  │  Bash   │
               └───────┘  └────────┘  └─────────┘
```

---

## ⚙️ Day 02（预告）— 启动流程：从 0 到 REPL

**下期解析重点：**

```typescript
// main.tsx 节选（伪代码）
async function main() {
  const args = parseArgs()          // Commander.js 解析参数
  await setup()                     // 初始化目录、版本检查
  await loadPlugins()               // 加载插件
  await loadSkills()                // 加载技能
  await initTelemetry()             // 启动遥测
  await checkAuth()                 // 检查 API Key / OAuth
  launchRepl(args)                  // 启动 REPL 主界面
}
```

我们将重点回答：**Node.js 冷启动到用户看见光标，这 200ms 里发生了什么？**

---

## 🔄 Day 03（预告）— 查询引擎：用户输入的旅程

用户按下回车后，消息经历了这样的旅程：

```
用户输入 "帮我重构这个函数"
    │
    ▼
QueryEngine.processQuery()
    │
    ├─ 注入系统上下文（git status + Claude.md）
    ├─ 发送到 Claude API（流式）
    ▼
Claude 返回 tool_use: { name: "bash", input: { command: "cat file.ts" } }
    │
    ▼
工具执行器 → 调用 BashTool
    │
    ▼
将工具结果追加到 messages
    │
    ▼
再次发送到 Claude API ← 循环直到 stop_reason = "end_turn"
    │
    ▼
渲染最终回复
```

这个循环是 **Claude Code 最核心的心跳**。

---

## 🧰 Day 04（预告）— 44 个工具：Agent 的手脚

工具分为五大类：

| 类别 | 工具举例 | 作用 |
|------|---------|------|
| **文件操作** | FileRead, FileEdit, FileWrite, Glob, Grep | 看、改、创建文件 |
| **系统执行** | Bash | 跑任何 Shell 命令 |
| **网络** | WebSearch, WebFetch | 查文档、搜索 |
| **Agent 协作** | Agent, Task系列, Skill | 派子代理、管任务 |
| **工作流** | PlanMode, Worktree, MCP | 计划执行、环境隔离 |

每个工具遵循统一接口：

```typescript
interface Tool {
  name: string
  description: string           // 告诉 Claude 这个工具能干什么
  inputSchema: ZodSchema        // 参数校验
  canUse: CanUseToolFn          // 权限检查（放行/拦截/询问）
  call(input, context): Result  // 实际执行逻辑
}
```

---

## 🛡️ Day 10（预告）— 权限系统：危险操作如何被拦截

Claude Code 有三种权限模式：

```
Auto（自动放行）  →  适合受信任的操作（git status, cat 文件）
Ask（询问用户）   →  适合有副作用的操作（npm install, 写文件）
Deny（直接拒绝）  →  危险操作黑名单（rm -rf, curl | bash）
```

每次工具调用前，`canUse()` 函数会检查：
1. 是否在用户配置的白名单中？
2. 是否命中危险模式？
3. 用户之前是否批准过同类操作？

---

## 🔌 Day 09（预告）— MCP 协议：第三方工具的接入标准

**MCP（Model Context Protocol）** 是 Anthropic 提出的开放协议，允许任何人写一个"工具服务器"，让 Claude 调用。

```
Claude Code ←──── MCP Client ────→ MCP Server（第三方）
                  （119KB 实现）     （如：数据库、浏览器、Git）
```

`services/mcp/client.ts` 实现了完整的 MCP 客户端，包括：
- 工具服务器的生命周期管理（启动、心跳、重启）
- OAuth 认证流程
- 工具结果的协议转换

---

## 💡 核心设计洞察

在逐日解析之前，先给出几个贯穿全系列的设计智慧：

### 洞察 1：Feature Flag 控制发布边界

```typescript
// Bun 构建时消除不同目标的代码
const assistantModule = feature('KAIROS')
  ? require('./assistant/index.js')
  : null

const REPLTool = process.env.USER_TYPE === 'ant'
  ? require('./tools/REPLTool.js').REPLTool
  : null
```

**为什么这样做？** 内部版（ant）和外部版（公开发布）用同一套代码库，通过 feature flag 分叉——这是大型工程项目控制发布边界的标准做法。

---

### 洞察 2：Memoized 上下文，每次会话只算一次

```typescript
// context.ts
export const getSystemContext = memoize(async () => ({
  gitStatus: await getGitStatus(),
  cacheBreaker: Date.now()
}))

export const getUserContext = memoize(async () => ({
  claudeMd: await loadClaudeMdFiles(),
  currentDate: new Date().toISOString()
}))
```

**为什么这样做？** git status 和 Claude.md 文件在一次会话中不会变，没必要每次查询都重新读磁盘。Memoize 是一个小优化，但在高频场景下节省了大量 I/O。

---

### 洞察 3：懒加载破解循环依赖

```typescript
// 不能直接 import，会导致循环依赖
const getTeammateUtils = () => require('./utils/teammate.js')
const getSendMessageTool = () => require('./tools/SendMessageTool.js').SendMessageTool
```

**为什么这样做？** 大型项目中循环依赖几乎无法避免。用"返回函数的函数"延迟 require() 到首次使用时，是 Node.js 中破解循环依赖的经典手法。

---

### 洞察 4：流式处理 + 并发工具执行

```
Stream 一边流入 token
    └─ 发现 tool_use block → 立即派发执行（不等流结束）
    └─ 继续收剩余 token
    └─ 等所有工具执行完毕
    └─ 汇总结果 → 下一轮 API 调用
```

**为什么这样做？** 如果 Claude 一次调用了 3 个工具，串行执行会浪费时间。并发执行让延迟从"工具1 + 工具2 + 工具3"变成"max(工具1, 工具2, 工具3)"。

---

## 📈 规模感受

| 维度 | 数字 |
|------|------|
| 工具数量 | 44 个 |
| 命令数量 | 88+ 个 |
| React 组件 | 33 个 |
| React Hooks | 70+ 个 |
| 服务模块 | 22+ 个 |
| 工具函数目录 | 33+ 个子目录 |
| Ink 渲染器 | 40+ 模块，核心文件 251KB |
| Anthropic API 客户端 | 125KB |
| MCP 客户端 | 119KB |
| OAuth/认证模块 | 65KB |

这不是一个可以"周末读完"的代码库。但正因如此，系列解析才有意义。

---

## 🗓️ 更新计划

本系列将从 **2026-04-01** 开始，每日更新一节。

- Google Drive 备份（含源码标注版）：[开放链接](https://drive.google.com/drive/folders/1bqkP-lQ-5xUN2oPsen_phfDlelIovIFi)
- GitHub 原始博客：[zmzhace/zmzhace.github.io](https://github.com/zmzhace/zmzhace.github.io/tree/main/posts)

---

> **写在最后**：Claude Code 的源码是目前公开的最成熟的 AI Agent 工程实现之一。读懂它，不只是读懂了一个工具——而是读懂了"AI + 工程化"的当前最高水位线。

---

*— 系列持续更新中，欢迎关注 —*
