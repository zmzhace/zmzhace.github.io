---
title: "Day 02 — 启动流程：从冷启动到第一个光标"
date: "2026-04-01"
description: "逐帧拆解 Claude Code 的启动过程——从进程起点到 REPL 光标就绪，这 200ms 里究竟发生了什么？"
series: "Claude Code 源码系列"
---

# ⚙️ Day 02 — 启动流程：从冷启动到第一个光标

> **系列说明**：[Day 01](./claude-code-architecture.md) 已给出整体地图。今天我们钻进 `main.tsx`，逐层还原从 `node main.tsx` 到用户看见光标这段时间里发生的每一件事。

---

## 先看全局时间线

```
T+0ms    进程启动，Node.js/Bun 开始加载 main.tsx
T+0ms    ├── profileCheckpoint('main_tsx_entry')       ← 最早的时间戳
T+0ms    ├── startMdmRawRead()                          ← 后台子进程：读取 MDM 策略
T+0ms    └── startKeychainPrefetch()                   ← 后台任务：预读 macOS 钥匙串

T+135ms  main_tsx_imports_loaded                       ← ~135个模块全部加载完毕
T+135ms  main() 函数开始执行

         ├── argv 预处理（cc:// / ssh / assistant …）
         ├── 检测 interactive vs non-interactive
         ├── eagerLoadSettings()                        ← 解析 --settings / --setting-sources
         └── run() ──────────────────────────────────→

                 ├── Commander.js 注册命令树
                 └── preAction 钩子触发:
                         ├── await MDM 设置 + Keychain 完成
                         ├── init()                    ← 真正的初始化
                         └── 进入具体命令 action

                                 └── 交互模式 action:
                                         ├── Auth 检查
                                         ├── MCP 配置加载
                                         ├── showSetupScreens()  ← 信任/登录/引导对话框
                                         ├── launchRepl()        ← 渲染 <App><REPL/>
                                         └── startDeferredPrefetches()  ← 背景预热
```

---

## 第一层：模块加载时的"副作用"

绝大多数语言/框架要求等 `main()` 函数被调用后才能做任何事。
Claude Code 偏不——它在 **import 阶段就已经启动了三个后台任务**：

```typescript
// main.tsx 第 9-20 行（已简化）
import { profileCheckpoint } from './utils/startupProfiler.js'
profileCheckpoint('main_tsx_entry')          // ① 记录最早时间戳

import { startMdmRawRead } from '...'
startMdmRawRead()                            // ② 立刻启动 MDM 子进程

import { startKeychainPrefetch } from '...'
startKeychainPrefetch()                      // ③ 立刻预读钥匙串
```

**为什么不等 main() 再做？**

这三件事分别需要：
- 启动外部子进程（`plutil` / `reg query`）
- 发起系统 keychain 调用（macOS `security` 命令）

它们都有几十毫秒的冷启动时延。放在 import 阶段，它们与后续 **~135ms 的模块加载** 并发进行——等 `main()` 被调用时，数据往往已经准备好了，整个流程"白嫖"了并发时间。

> 代码注释里写明了收益：*"~65ms on every macOS startup"*
> 这不是优化，这是**架构**。

---

## 第二层：startupProfiler —— Anthropic 的性能显微镜

Claude Code 内置了一套启动性能分析器（`utils/startupProfiler.ts`）。
每个关键阶段都有 `profileCheckpoint(name)` 埋点，例如：

```
main_tsx_entry
main_tsx_imports_loaded
init_function_start
eagerLoadSettings_start / end
preAction_start
run_function_start
main_after_run
...
```

**采样策略**：

| 用户类型 | 采样率 |
|---------|--------|
| Anthropic 内部员工（ant） | **100%** |
| 外部用户 | **0.5%** |

采样结果上报到 Statsig，追踪四个核心阶段：

```typescript
const PHASE_DEFINITIONS = {
  import_time:   ['cli_entry', 'main_tsx_imports_loaded'],  // 模块加载耗时
  init_time:     ['init_function_start', 'init_function_end'], // 初始化耗时
  settings_time: ['eagerLoadSettings_start', 'eagerLoadSettings_end'],
  total_time:    ['cli_entry', 'main_after_run'],             // 总启动时间
}
```

如果你想在本地看完整报告：
```bash
CLAUDE_CODE_PROFILE_STARTUP=1 claude
# 报告会写入 ~/.claude/startup-perf/<session-id>.txt
```

---

## 第三层：main() —— 主函数做的 10 件事

```typescript
export async function main() {
  // 1. Windows 安全补丁
  process.env.NoDefaultCurrentDirectoryInExePath = '1'

  // 2. 初始化警告处理器 & 信号处理
  initializeWarningHandler()
  process.on('SIGINT', () => { ... })

  // 3. 特殊 argv 预处理（cc:// / deep link / ssh / assistant）
  if (feature('DIRECT_CONNECT')) { /* 重写 argv */ }
  if (feature('SSH_REMOTE'))     { /* 重写 argv */ }
  if (feature('KAIROS'))         { /* 重写 argv */ }

  // 4. 检测运行模式
  const isNonInteractive = hasPrintFlag || !process.stdout.isTTY

  // 5. 设置 client type
  setClientType(...)  // 'cli' / 'sdk-cli' / 'github-action' / 'remote' / ...

  // 6. 解析早期 CLI flag
  eagerLoadSettings()   // --settings / --setting-sources

  // 7. 进入 Commander 主命令树
  await run()
}
```

**洞察：为什么要"提前"解析 `--settings` 和 `--setting-sources`？**

Commander.js 解析 flag 是在命令 action 执行时才发生的——但 `init()` 里需要读取 settings 文件。
如果等 Commander 解析，`init()` 会先用默认路径的 settings，之后 flag 才生效，造成双重读取。
`eagerParseCliFlag()` 绕过 Commander，直接扫描 `process.argv`，提前拿到值。

---

## 第四层：run() —— Commander.js 命令树

```typescript
async function run() {
  const program = new CommanderCommand()
    .configureHelp(createSortedHelpConfig())
    .enablePositionalOptions()

  // 全局 preAction 钩子：在任何子命令执行前调用
  program.hook('preAction', async (thisCommand) => {
    await Promise.all([
      ensureMdmSettingsLoaded(),      // ← 等 MDM 子进程完成
      ensureKeychainPrefetchCompleted() // ← 等 Keychain 读取完成
    ])
    await init()                       // ← 真正的初始化
    initSinks()                        // ← 挂载日志/分析 sink
  })

  // 注册 88+ 个子命令 ...
  program.addCommand(...)

  // 注册默认命令（交互模式入口）
  program.action(async (options) => {
    // 这就是你直接运行 `claude` 时走的路径
    // ... 见第五层
  })
}
```

`preAction` 的意义：无论你运行 `claude`、`claude mcp add`、`claude doctor`，
init() 都会先被执行一次，且由于 **memoize**，多次调用只实际执行一次。

---

## 第五层：init() —— 15 步初始化流水线

`init()` 定义在 `entrypoints/init.ts`，被 `memoize` 包裹，整个进程只运行一次：

```typescript
export const init = memoize(async (): Promise<void> => {
  enableConfigs()                      // 1. 验证并启用配置系统
  applySafeConfigEnvironmentVariables() // 2. 注入"安全"环境变量（trust 前的子集）
  applyExtraCACertsFromConfig()         // 3. 注入自定义 CA 证书（TLS 最早要用）
  setupGracefulShutdown()              // 4. 注册退出清理钩子

  // 5. 懒加载 1P 事件日志（defer ~400KB OpenTelemetry 模块）
  void import('.../firstPartyEventLogger.js').then(...)

  void populateOAuthAccountInfoIfNeeded() // 6. 填充 OAuth 账号缓存
  void initJetBrainsDetection()           // 7. 检测 JetBrains IDE
  void detectCurrentRepository()          // 8. 检测 GitHub 仓库

  // 9. 初始化远程托管设置（企业版）
  if (isEligibleForRemoteManagedSettings()) initializeRemoteManagedSettingsLoadingPromise()
  if (isPolicyLimitsEligible())             initializePolicyLimitsLoadingPromise()

  recordFirstStartTime()              // 10. 记录首次启动时间
  configureGlobalMTLS()               // 11. 配置 mTLS（双向 TLS）
  configureGlobalAgents()             // 12. 配置 HTTP 代理 agent

  preconnectAnthropicApi()            // 13. TCP+TLS 预热（不等结果）
  setShellIfWindows()                 // 14. Windows: 设置 Git Bash 路径
  registerCleanup(shutdownLspServerManager) // 15. 注册 LSP 服务器清理
})
```

**重点：`preconnectAnthropicApi()`**

这行代码在后台悄悄建立一条到 `api.anthropic.com` 的 TCP+TLS 连接。
一次 TLS 握手通常需要 **100–200ms**。
用户在 REPL 里打完第一条消息、按下回车——这段时间里，连接已经建好了。
第一次 API 请求因此**接近零延迟**地复用这条连接。

---

## 第六层：信任门 & 安全考量

`init()` 故意**不**预取 git 状态（`getSystemContext()`）。
原因在 `prefetchSystemContextIfSafe()` 里说得很清楚：

```typescript
function prefetchSystemContextIfSafe(): void {
  // git 命令会执行 hooks 和 config（core.fsmonitor, diff.external）
  // 这些可能是任意代码——必须等用户信任对话框确认后才能运行
  const hasTrust = checkHasTrustDialogAccepted()
  if (hasTrust) {
    void getSystemContext()   // ← 已建立信任，安全地预取
  }
  // 否则：什么都不做，等 showSetupScreens() 完成后再预取
}
```

这是个细节，但很重要：**Claude Code 运行 git 命令前，必须先取得用户同意。**
不只是 UI 流程的礼貌——这是防止恶意 `.git/config` 中的 hooks 在未授权情况下执行代码。

---

## 第七层：showSetupScreens() —— 对话框序列

在真正启动 REPL 之前，会依次展示（按需）：

```
showSetupScreens()
  ├── 1. 信任对话框（Trust Dialog）        ← 首次运行 / 新目录
  ├── 2. OAuth / API Key 认证              ← 未登录时
  ├── 3. 新功能引导（Onboarding）          ← 首次使用
  ├── 4. 会话恢复选择器（Resume Chooser）  ← --continue 模式
  └── 5. Agent 快照更新对话框             ← Agent 内存功能（内部版）
```

**值得注意的性能设计：**

```typescript
// 启动计时在 showSetupScreens 之前打点
logEvent('tengu_timer', {
  event: 'startup',
  durationMs: Math.round(process.uptime() * 1000)
})
// 然后才展示对话框
const onboardingShown = await showSetupScreens(...)
```

为什么先打点再展示对话框？
因为如果在对话框之后打点，用户在登录页停留 60 秒，`p99` 启动时间就会变成 60 秒——**这不是代码的问题，是用户行为**。
把计时放在 UI 对话框前，才能真实反映"代码路径的启动速度"。

---

## 第八层：launchRepl() —— React 上场

```typescript
// replLauncher.tsx
export async function launchRepl(root, appProps, replProps, renderAndRun) {
  const { App }  = await import('./components/App.js')   // 懒加载
  const { REPL } = await import('./screens/REPL.js')      // 懒加载

  await renderAndRun(root,
    <App {...appProps}>
      <REPL {...replProps} />
    </App>
  )
}
```

`App` 和 `REPL` 是**动态 import**——它们包含了大量 React 组件，在启动的关键路径上不需要。
只有到了真正要渲染 REPL 时，才触发这两个模块的加载。

`renderAndRun` 是 Ink 的入口函数（Ink = 在终端里跑的 React 渲染器）。
从这行代码开始，终端里的每一帧刷新，都是一次 React 重新渲染。

---

## 第九层：startDeferredPrefetches() —— REPL 渲染后的背景预热

REPL 第一帧渲染完成后，才触发一批"用户正在打字时，悄悄做的事"：

```typescript
export function startDeferredPrefetches(): void {
  void initUser()                   // 获取用户账号信息
  void getUserContext()             // 加载 Claude.md 文件
  prefetchSystemContextIfSafe()     // 预取 git status（信任确认后）
  void getRelevantTips()            // 加载启动提示
  void countFilesRoundedRg(getCwd()) // 统计项目文件数量
  void initializeAnalyticsGates()   // 初始化 GrowthBook feature flags
  void prefetchOfficialMcpUrls()    // 预取官方 MCP 注册表
  void refreshModelCapabilities()   // 获取模型能力表
  void settingsChangeDetector.initialize() // 监听 settings.json 变更
  void skillChangeDetector.initialize()    // 监听 skills 目录变更
}
```

这些工作如果放在启动主路径上，会让"首次渲染"变慢。
放在第一帧之后，用户感知到"Claude Code 已经启动了"——实际上后台还在继续干活。
这是**感知性能优化**的经典手法：先让用户看到 UI，再补齐数据。

---

## 完整流程图（精简版）

```
Node.js 进程启动
    │
    ├── [import 阶段] startMdmRawRead() ┐
    ├── [import 阶段] startKeychainPrefetch() ┤  ← 并发运行
    └── [import 阶段] 加载 ~135 个模块  ┘

main()
    ├── Windows 安全设置
    ├── argv 预处理（cc:// ssh assistant）
    ├── 检测 interactive / non-interactive
    ├── eagerLoadSettings()
    └── run()
          └── Commander preAction 钩子
                ├── await MDM + Keychain
                ├── init()
                │     ├── enableConfigs
                │     ├── 安全环境变量
                │     ├── CA 证书
                │     ├── 代理 & mTLS
                │     └── preconnectAnthropicApi() ← TCP/TLS 预热
                │
                └── 交互模式 action
                      ├── Auth 检查
                      ├── MCP 加载
                      ├── showSetupScreens()
                      │     ├── Trust Dialog
                      │     ├── OAuth/Login
                      │     └── Onboarding
                      │
                      ├── launchRepl()
                      │     └── <App><REPL/></App>  ← Ink 渲染
                      │
                      └── startDeferredPrefetches()  ← 背景预热
```

---

## 本期 3 个设计洞察

### 洞察 1：副作用前置，换取并发收益

Claude Code 故意在 import 阶段触发子进程。这违反了"无副作用模块"的惯例——
但换来了 **65ms 的免费并发**。工程上的权衡，而非疏忽。

### 洞察 2：安全边界 = 信任对话框

`git` 命令可能执行 `core.fsmonitor` 等 hook。在用户明确同意前，
Claude Code **拒绝运行任何 git 命令**。信任机制不只是 UX，更是安全设计。

### 洞察 3：感知性能 > 实际性能

先渲染 REPL，再做背景预热——这让用户**感觉**启动很快，
即使实际上很多数据还没准备好。这是所有优秀 CLI/GUI 工具的共同秘诀。

---

## 下期预告：Day 03 — 查询引擎

用户在 REPL 里按下回车后，消息进入 `QueryEngine.ts`——
一个 **46KB** 的文件，里面住着 Claude Code 的"心跳"。

```typescript
// 用户输入 → Claude API → 工具调用 → 工具结果 → 再次调用 → ...
while (stopReason !== 'end_turn') {
  const response = await callClaudeAPI(messages)
  const toolCalls = extractToolCalls(response)
  const toolResults = await Promise.all(toolCalls.map(executeToolConcurrently))
  messages.push(toolResults)
}
```

这个循环是整个 Agent 的灵魂。下期见。

---

> **系列目录**：[Day 01 - 项目概览](./claude-code-architecture.md) | **Day 02 - 启动流程**（本篇）| Day 03 - 查询引擎（即将更新）
