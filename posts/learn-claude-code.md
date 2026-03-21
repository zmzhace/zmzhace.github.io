---
title: "Learn Claude Code 全系列总结"
date: "2025-03-21"
description: "从一个只会聊天的 AI，到一个能自主运作的数字员工团队——这就是 Agent 的进化之路。"
---
# 🧠 Learn Claude Code 全系列总结

> 从一个只会聊天的 AI，到一个能自主运作的"数字员工团队"——这就是 Agent 的进化之路。

---

## 📋 总览表

| 课程 | 主题 | 核心概念 | 一句话总结 |
|------|------|----------|-----------|
| **s01** | Agent Loop | 思考→行动→观察→反馈 | Agent 学会了"干活" |
| **s02** | Tool Use | 工具扩展 + 分发机制 | Agent 学会了"用工具" |
| **s03** | TodoWrite | 任务清单 + 催单提醒 | Agent 学会了"列计划" |
| **s04** | Subagent | 子代理 + 上下文隔离 | Agent 学会了"派分身" |
| **s05** | Skill Loading | 按需加载知识 | Agent 学会了"查字典" |
| **s06** | Context Compact | 上下文压缩 + 摘要 | Agent 学会了"整理记忆" |
| **s07** | Task System | 持久化任务 + 依赖图 | Agent 学会了"跨天记事" |
| **s08** | Background Tasks | 多线程 + 通知队列 | Agent 学会了"一心多用" |
| **s09** | Agent Teams | 多代理 + 信箱通信 | Agent 学会了"组建团队" |
| **s10** | Team Protocols | 审批协议 + 优雅关机 | Agent 学会了"制度管理" |
| **s11** | Autonomous Agents | 自主巡逻 + 自动领任务 | Agent 学会了"自己找活干" |
| **s12** | Worktree Isolation | Git Worktree + 物理隔离 | Agent 学会了"分隔施工" |
| **s_full** | Full Reference | s01-s11 大合集 | Agent 的"完全体" |

---

## 🏗️ 四大进化阶段

### 阶段一：单兵作战（s01 - s03）

> **核心主题**：让 AI 从"聊天"变成"干活"

#### s01 — Agent Loop（代理循环）
```
用户提问 → LLM 思考 → 调用工具 → 获取结果 → 反馈给 LLM → 继续思考...
```
- **关键机制**：`while True` 循环 + `stop_reason == "tool_use"` 判断
- **唯一工具**：[bash](file:///E:/fast-code/learn-claude-code/my_ali_agent.py#35-47)（执行 Shell 命令）
- **核心价值**：这是所有后续 Agent 的骨架

#### s02 — Tool Use（工具扩展）
- **新增工具**：`read_file`、`write_file`、`edit_file`
- **设计模式**：`TOOL_HANDLERS` 字典分发（策略模式）
- **安全机制**：[safe_path()](file:///e:/fast-code/learn-claude-code/agents/s12_worktree_task_isolation.py#478-483) 防止路径逃逸
- **核心价值**：让 Agent 不仅能跑命令，还能直接操作文件

#### s03 — TodoWrite（任务清单）
- **新增组件**：[TodoManager](file:///e:/fast-code/learn-claude-code/agents/s_full.py#123-157) 类
- **设计亮点**：
  - 模型可以自己创建和更新任务列表
  - "催单提醒"机制：连续 3 轮不更新 Todo，自动注入 `<reminder>`
- **核心价值**：Agent 从"被动执行"进化为"主动规划"
- **设计模式**：Plan and Execute

---

### 阶段二：脑力管理（s04 - s06）

> **核心主题**：解决 LLM 的"记忆瓶颈"

#### s04 — Subagent（子代理）
```
主代理 ──派任务──→ 子代理（全新 messages=[]）
主代理 ←──摘要──── 子代理（完工后销毁）
```
- **核心机制**：上下文隔离（Context Isolation）
- **设计限制**：子代理没有 [task](file:///e:/fast-code/learn-claude-code/agents/s11_autonomous_agents.py#139-149) 工具（防止递归生成）
- **核心价值**：主代理的"大脑"始终保持清醒

#### s05 — Skill Loading（技能加载）
- **两层设计**：
  - **Layer 1**（系统提示词）：只放技能名称 + 简短描述（~100 tokens/技能）
  - **Layer 2**（工具调用后）：Agent 需要时才加载完整指令
- **文件格式**：`skills/<name>/SKILL.md`（YAML frontmatter + markdown body）
- **核心价值**：无限扩展 Agent 的知识，而不膨胀系统提示词

#### s06 — Context Compact（上下文压缩）
- **Microcompact**：清除旧的 `tool_result` 内容（只保留最近 3 条）
- **Auto-compact**：当 Token 数超过阈值时，调用 LLM 生成对话摘要，替换整个历史
- **Transcript 备份**：压缩前的原始对话存入 `.transcripts/` 目录
- **核心价值**：让 Agent 理论上可以无限运行

---

### 阶段三：时间与状态管理（s07 - s08）

> **核心主题**：让 Agent 的记忆"活"过对话、"活"过重启

#### s07 — Task System（持久化任务系统）
- **存储方式**：每个任务一个 JSON 文件（`.tasks/task_N.json`）
- **依赖图**：`blockedBy` / `blocks` 字段实现任务间的阻塞关系
- **自动解锁**：完成一个任务时，自动从其他任务的 `blockedBy` 中移除
- **核心价值**：任务状态不依赖对话历史，重启后仍然存在

#### s08 — Background Tasks（后台任务）
- **非阻塞执行**：`background_run` 立即返回 `task_id`
- **通知队列**：后台线程完成后，将结果推入队列
- **消息注入**：每次 LLM 调用前，检查并注入 `<background-results>`
- **核心价值**：Agent 可以一边等测试跑完，一边继续写代码

---

### 阶段四：团队化与自主化（s09 - s12）

> **核心主题**：从单体 Agent 进化为多代理协作网络

#### s09 — Agent Teams（代理团队）
- **持久化成员**：每个 Teammate 在独立线程中持续运行
- **信箱通信**：`.team/inbox/<name>.jsonl` 作为异步通信通道
- **广播机制**：Lead 可以一键通知所有成员
- **核心价值**：多个 Agent 可以并行工作

#### s10 — Team Protocols（团队协议）
- **Shutdown Protocol（关机协议）**：
  - Lead 发 [shutdown_request](file:///e:/fast-code/learn-claude-code/agents/s_full.py#561-566) → Teammate 回 `shutdown_response`（同意/拒绝）
- **Plan Approval Protocol（方案审批协议）**：
  - Teammate 提交 `plan_approval` → Lead 审核 → 批准/驳回
- **request_id 关联模式**：所有请求和响应通过唯一 ID 配对
- **核心价值**：防止 Agent 失控，重大操作需要审批

#### s11 — Autonomous Agents（自主代理）
- **空闲轮询**：Agent 完工后每 5 秒检查一次信箱和任务板
- **自动领任务**：发现未认领的 Pending 任务 → 自动 Claim
- **身份重注入**：上下文压缩后，强制注入 `<identity>` 块
- **自动下班**：60 秒没活干 → 自动 Shutdown 释放资源
- **核心价值**：Agent 不再需要人类指挥，它能自己找活干

#### s12 — Worktree Task Isolation（工作树任务隔离）
- **Git Worktree**：每个任务分配一个独立的 Git 分支 + 独立的文件目录
- **Task-Worktree 绑定**：任务 JSON 中的 [worktree](file:///e:/fast-code/learn-claude-code/agents/s12_worktree_task_isolation.py#183-193) 字段关联到物理路径
- **`worktree_run`**：在指定的隔离目录中执行命令
- **EventBus**：所有生命周期事件记录在 `.worktrees/events.jsonl`
- **核心价值**：彻底解决多代理并行时的文件冲突问题

---

## 🔗 核心设计模式总结

### 1. Agent Loop 模式
```python
while True:
    response = llm.call(messages, tools)
    if response.stop_reason != "tool_use":
        break  # 任务完成
    result = execute_tool(response)
    messages.append(result)  # 反馈循环
```

### 2. 工具分发模式（Strategy Pattern）
```python
TOOL_HANDLERS = {
    "bash":      lambda **kw: run_bash(kw["command"]),
    "read_file": lambda **kw: run_read(kw["path"]),
    # ...
}
handler = TOOL_HANDLERS.get(tool_name)
output = handler(**tool_input)
```

### 3. 消息注入模式（Pre-call Injection）
```python
# 每次调用 LLM 之前，检查并注入外部状态
notifications = queue.drain()
if notifications:
    messages.append({"role": "user", "content": format(notifications)})
    messages.append({"role": "assistant", "content": "Noted."})
```

### 4. 文件持久化模式（File-based State）
```python
# 状态存在文件里，不依赖内存
task = json.loads(Path(".tasks/task_1.json").read_text())
task["status"] = "completed"
Path(".tasks/task_1.json").write_text(json.dumps(task))
```

---

## 🗺️ 架构全景图

```
┌─────────────────────────────────────────────────────────────┐
│                    用户 (Human / REPL)                       │
│                  /compact  /tasks  /team  /inbox             │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   Lead Agent (主代理)                        │
│                                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐  │
│  │ 压缩引擎 │ │ 后台队列 │ │ 技能库   │ │ 任务板(.tasks)│  │
│  │ (s06)    │ │ (s08)    │ │ (s05)    │ │ (s07)         │  │
│  └──────────┘ └──────────┘ └──────────┘ └───────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              工具分发 (TOOL_HANDLERS)                 │   │
│  │  bash | read | write | edit | todo | task | bg_run   │   │
│  │  spawn | send_msg | shutdown | plan_approval | ...   │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────┬───────────────────────────┬───────────────────┘
              │                           │
    ┌─────────▼─────────┐     ┌───────────▼──────────┐
    │  Subagent (s04)   │     │  Teammate (s09-s11)  │
    │  一次性、用完即毁  │     │  持久化、自主巡逻    │
    │  只返回摘要       │     │  信箱通信、自动领任务 │
    └───────────────────┘     └──────────────────────┘
                                        │
                              ┌─────────▼──────────┐
                              │  Worktree (s12)    │
                              │  物理目录隔离       │
                              │  每任务一个 Git 分支│
                              └────────────────────┘
```

---

## 💡 核心洞察（Key Insights）

| 课程 | 金句 |
|------|------|
| s01 | "循环是 Agent 的心跳" |
| s04 | "进程隔离免费带来上下文隔离" |
| s05 | "不要把百科全书塞进系统提示词，按需加载" |
| s06 | "压缩不是丢东西，而是提炼" |
| s07 | "状态活在对话之外，就能活过压缩" |
| s08 | "发射后不管——Agent 不必等命令跑完" |
| s09 | "队友之间能互相说话" |
| s11 | "Agent 自己找活干" |
| s12 | "目录隔离 + 任务 ID 协调" |

---

## 🚀 学完之后你能做什么？

1. **理解 Claude Code / Cursor / Devin 的底层架构**
   - 它们本质上就是这 12 个机制的工业级实现

2. **自己动手构建 Agent**
   - 用 [s_full.py](file:///e:/fast-code/learn-claude-code/agents/s_full.py) 作为起点，接入你的 LLM API

3. **设计多代理系统**
   - 用 s09-s12 的模式构建"AI 开发团队"

4. **优化现有 Agent 的性能**
   - 用 s05 的按需加载减少 Token 消耗
   - 用 s06 的压缩机制延长对话寿命
   - 用 s08 的后台任务提升并发效率

---

> **最终总结**：这 12 个脚本展示了如何将一个简单的 LLM API 调用，逐步进化为一个具有规划能力、团队协作能力、自主决策能力的完整 Agent 系统。这不仅是 Claude Code 的实现原理，更是当前 AI Agent 工程的核心方法论。
