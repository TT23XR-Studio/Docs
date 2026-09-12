# KifeJS 使用文档

> **版本:** 0.1.0 | **模组 ID:** `kifejs` | **许可:** AGPL-3.0-or-later
>
> Fabric 脚本模组 — 基于 KossJS_API，在 Minecraft 中运行 JavaScript 脚本。

---

## 什么是 KifeJS？

KifeJS 是一个 **轻量级 JavaScript 脚本框架**，它将 KossJS JavaScript 引擎嵌入到 Minecraft Fabric 服务端中。您无需编写 Java 代码或重新编译模组，只需将 `.js` 文件放入指定目录即可扩展游戏行为。

**核心能力：**

- 在 Minecraft 中直接执行 JavaScript 脚本
- 通过 `KifeJS` Java-到-JS 桥接 API 与游戏交互
- 支持单文件脚本和包脚本（文件夹 + `index.js`）
- 提供 `/kifejs reload` 运行时热重载
- 所有脚本运行在共享全局作用域中，天然支持跨脚本通信

---

## 文档目录

### 一、[安装指南](01-installation/01-requirements.md)

| 文档 | 内容 |
|------|------|
| [01-requirements.md](01-installation/01-requirements.md) | 环境要求（MC / Fabric / Java / 原生库） |
| [02-install-steps.md](01-installation/02-install-steps.md) | 安装步骤详解 |
| [03-verification.md](01-installation/03-verification.md) | 验证安装是否成功 |

### 二、[快速入门](02-getting-started/01-first-script.md)

| 文档 | 内容 |
|------|------|
| [01-first-script.md](02-getting-started/01-first-script.md) | 编写并运行第一个脚本 |
| [02-directory-structure.md](02-getting-started/02-directory-structure.md) | 目录结构全解 |
| [03-commands.md](02-getting-started/03-commands.md) | 命令详解 |

### 三、[脚本基础](03-script-fundamentals/01-script-types.md)

| 文档 | 内容 |
|------|------|
| [01-script-types.md](03-script-fundamentals/01-script-types.md) | 单文件 vs 包脚本 |
| [02-script-config.md](03-script-fundamentals/02-script-config.md) | 配置文件系统 |
| [03-execution-model.md](03-script-fundamentals/03-execution-model.md) | 执行模型与顺序 |
| [04-error-handling.md](03-script-fundamentals/04-error-handling.md) | 错误处理机制 |

### 四、[API 参考](04-api-reference/01-KifeJS-log.md)

| 文档 | 内容 |
|------|------|
| [01-KifeJS-log.md](04-api-reference/01-KifeJS-log.md) | `KifeJS.log()` — 日志记录 |
| [02-KifeJS-broadcast.md](04-api-reference/02-KifeJS-broadcast.md) | `KifeJS.broadcast()` — 广播 |
| [03-KifeJSConfig.md](04-api-reference/03-KifeJSConfig.md) | `KifeJSConfig` 全局配置对象 |
| [04-KifeEvent.md](04-api-reference/04-KifeEvent.md) | `KifeEvent` 事件类 |
| [05-script-variables.md](04-api-reference/05-script-variables.md) | 内置变量 |
| [06-combined-usage.md](04-api-reference/06-combined-usage.md) | API 组合使用模式 |

### 五、[事件系统深度指南](05-event-system/01-concepts.md)

| 文档 | 内容 |
|------|------|
| [01-concepts.md](05-event-system/01-concepts.md) | 事件系统核心概念 |
| [02-building-event-bus.md](05-event-system/02-building-event-bus.md) | 从零构建事件总线 |
| [03-event-lifecycle.md](05-event-system/03-event-lifecycle.md) | 事件生命周期 |
| [04-cancellation-deep.md](05-event-system/04-cancellation-deep.md) | 取消机制深度剖析 |
| [05-advanced-patterns.md](05-event-system/05-advanced-patterns.md) | 高级模式（优先级/过滤/链式/异步） |

### 六、[跨脚本通信](06-cross-script/01-global-scope.md)

| 文档 | 内容 |
|------|------|
| [01-global-scope.md](06-cross-script/01-global-scope.md) | 全局作用域共享机制 |
| [02-direct-api.md](06-cross-script/02-direct-api.md) | 直接 API 调用 |
| [03-event-driven.md](06-cross-script/03-event-driven.md) | 事件驱动通信 |
| [04-data-repository.md](06-cross-script/04-data-repository.md) | 数据仓库模式 |
| [05-namespace-conventions.md](06-cross-script/05-namespace-conventions.md) | 命名空间约定 |
| [06-state-lifecycle.md](06-cross-script/06-state-lifecycle.md) | 状态管理与重载策略 |

### 七、[进阶模式](07-advanced-patterns/01-timers.md)

| 文档 | 内容 |
|------|------|
| [01-timers.md](07-advanced-patterns/01-timers.md) | 定时任务与调度 |
| [02-module-organization.md](07-advanced-patterns/02-module-organization.md) | 模块化组织 |
| [03-lifecycle-hooks.md](07-advanced-patterns/03-lifecycle-hooks.md) | 生命周期钩子 |
| [04-persistence.md](07-advanced-patterns/04-persistence.md) | 状态持久化 |
| [05-performance.md](07-advanced-patterns/05-performance.md) | 性能优化 |

### 八、[沙箱与安全](08-sandbox/01-timeout.md)

| 文档 | 内容 |
|------|------|
| [01-timeout.md](08-sandbox/01-timeout.md) | 超时机制详解 |
| [02-filesystem.md](08-sandbox/02-filesystem.md) | 文件系统策略 |
| [03-secure-coding.md](08-sandbox/03-secure-coding.md) | 安全编码最佳实践 |

### 九、[完整示例集](09-examples/01-hello-world/index.js)

| 项目 | 内容 |
|------|------|
| [01-hello-world](09-examples/01-hello-world/index.js) | 最简入门脚本 |
| [02-timed-broadcast](09-examples/02-timed-broadcast/index.js) | 定时广播 + 配置分离 |
| [03-simple-event-bus](09-examples/03-simple-event-bus/bus.js) | 多文件事件总线 |
| [04-cross-script-counter](09-examples/04-cross-script-counter/counter.js) | 跨脚本计数器 |
| [05-modular-system](09-examples/05-modular-system/core.js) | 完整模块化系统 |
| [06-full-event-system](09-examples/06-full-event-system/event-bus.js) | 企业级事件系统 |

### 十、[故障排除](10-troubleshooting/01-library-not-found.md)

| 文档 | 内容 |
|------|------|
| [01-library-not-found.md](10-troubleshooting/01-library-not-found.md) | 原生库找不到 |
| [02-script-errors.md](10-troubleshooting/02-script-errors.md) | 脚本语法/运行时错误 |
| [03-timeout.md](10-troubleshooting/03-timeout.md) | 执行超时 |
| [04-reload-issues.md](10-troubleshooting/04-reload-issues.md) | 重载相关问题 |
| [05-logs-and-debug.md](10-troubleshooting/05-logs-and-debug.md) | 日志与调试 |

---

## 快速链接

- **脚本目录:** `.minecraft/KifeJS/scripts/`
- **全局配置:** `.minecraft/KifeJS/config.js`
- **重载命令:** `/kifejs reload`
- **版本查看:** `/kifejs version`
- **日志前缀:** `[KifeJS]` / `[script]`
