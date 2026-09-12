# 什么是 SenRi FFI？（JavaScript）

## 概述

**SenRi FFI**（千里 FFI）是一个**跨语言 FFI（外部函数接口）统一抽象库**，让你用同一套 API 在 **KossJS**、**Node.js**、**Bun**、**Deno** 四个 JavaScript 运行时以及 **Python**（ctypes/cffi）上调用原生 C 动态库。

> [!TIP]
> 不同语言/运行时各自提供了不同的 FFI API（KossJS 的 `_senri_ffi`、Bun 的 `Bun.FFI`、Deno 的 `Deno.dlopen`、Node.js 依赖 `koffi`、Python 的 `ctypes`/`cffi`）。SenRi FFI 在这些底层 API 之上提供一个统一的抽象层，使得编写一次 FFI 代码即可在多个语言/运行时上运行，同时为同步和异步调用提供一致的 API。

## 开源协议

本项目采用 [Apache 2.0](https://www.apache.org/licenses/LICENSE-2.0) 协议开源发布。

## 问题背景

在 JavaScript/Python 生态中调用原生 C 库，不同语言/运行时的做法完全不同：

| 语言/运行时 | FFI 方式 | 类型名称示例 |
|--------|---------|-------------|
| KossJS | `globalThis._senri_ffi`（内置） | `int32` |
| Bun | `Bun.FFI`（内置，v1.3+） | `i32` |
| Deno | `Deno.dlopen`（内置） | `i32` |
| Node.js | `koffi`（需安装） | `'int32'` (v3 字符串类型) |

直接在代码中使用语言/运行时的原生 API 会锁死你的代码到某个特定语言/运行时。SenRi FFI 解决了这个问题。

## 技术架构

```
        您的应用程序 (JavaScript / TypeScript)
                      ↓
            SenRi FFI (统一 API 层)
                      ↓
    ┌─────────┬─────────┬─────────┬─────────┐
    ↓         ↓         ↓         ↓         ↓
KossJSAdapter BunAdapter DenoAdapter NodeAdapter
    ↓         ↓         ↓         ↓
_senri_ffi   Bun.FFI  Deno.dlopen  koffi v3
(内置)      (内置)    (内置)     (可选安装)
```

### 适配器模式

SenRi FFI 使用**适配器模式**，通过 `FFIAdapter` 接口统一各语言/运行时：

1. 定义统一的 `FFIAdapter` 接口（14 个方法）
2. 四个语言/运行时各自实现适配器：
   - `KossJSAdapter` — 包装 `globalThis._senri_ffi`
   - `BunAdapter` — 包装 `Bun.FFI`（Bun 1.3+ 重命名）
   - `DenoAdapter` — 包装 `Deno.dlopen`，自动转换 pointer/string 类型
   - `NodeAdapter` — 包装 `koffi v3`（字符串类型映射）
3. 启动时通过 `detectRuntime()` 自动选择合适的适配器

### 自定义后端

SenRi FFI 允许你注入**完全自定义的 FFI 后端**，替换内置的语言/运行时自动检测。只需实现 `LibraryLike` 接口（10 个强制方法 + 3 个可选方法），SenRi 通过适配器包装器将其接入现有架构，上层 API（类型系统、Pointer、struct、alloc/free 等）保持不变。

```ts
import { Library, types, LibraryLike } from '@tt23xrstudio/senri_ffi';

const myBackend: LibraryLike = {
  // ... 实现所有强制方法 ...
};

const lib = Library.load('/path/to/lib.so', myBackend);
const abs = lib.func('abs', types.int32, [types.int32]);
```

详见 [自定义后端](/zh/api/custom-backend)。

## 核心特性

### 统一类型系统

使用 `types.int32`、`types.cstring` 等统一名称，各适配器自动映射为语言/运行时原生类型：

```ts
import { types } from '@tt23xrstudio/senri_ffi';

// 在所有语言/运行时上都一样
types.int32   // KossJS/Bun/Deno/String: 'int32', Bun: 'i32'
types.float64 // KossJS: 'float64', Bun: 'f64', Deno: 'f64', Node: 'float64'
```

内部使用 `NormalizedType` 标准化类型描述符（primitive/pointer/array/struct），用 `serializeType()` 生成稳定的缓存键，解决以往 `JSON.stringify` 对象属性顺序不确定的问题。

### 结构体 / 指针 / 数组

支持复合类型描述符：

```ts
import { pointer, array } from '@tt23xrstudio/senri_ffi';

pointer(types.int32);    // 指向 int32 的指针
array(types.uint8, 256); // uint8[256]
```

### 跨平台异步 FFI（`funcAsync`）

所有语言/运行时提供统一的异步 API：

```ts
const fn = lib.funcAsync('heavy_work', types.int32, [types.int32]);
const result = await fn(42); // 返回 Promise，不阻塞主线程
```

| 语言/运行时 | 异步实现 |
|--------|---------|
| KossJS | 真实系统线程 (`std::thread`)，支持回调 + AbortController |
| Deno | 原生 `nonblocking: true` |
| Node.js | 单 Worker 模拟（`worker_threads`） |
| Bun | 单 Worker 模拟（Bun 的 `worker_threads` polyfill） |

### `Pointer.address` 现在是 `bigint`

为支持 64 位地址（特别是 Deno 的 `UnsafePointer`），`Pointer.address` 返回类型从 `number` 改为 `bigint`：

```ts
const ptr = alloc(64);
ptr.address;    // → bigint（如 140732311111111n）
ptr.isNull();   // 新增辅助方法
ptr.numberAddress;  // 兼容旧代码（超过安全整数抛 RangeError）
```

### 回调自动管理

通过 `FinalizationRegistry` 自动释放 C 回调，防止内存泄漏。

### 统一错误类型

所有语言/运行时抛出统一的 `FFIError` / `FFITypeError`，便于统一处理。

## 支持的语言/运行时

### JavaScript / TypeScript

| 语言/运行时 | 版本要求 | FFI 后端 | 同步 | 异步 |
|--------|---------|---------|------|------|
| KossJS | ≥ 0.1.0-dev.6 | `_senri_ffi`（内置） | ✅ | ✅ 原生 |
| Deno | ≥ 2.0 | `Deno.dlopen`（内置） | ✅ | ✅ 原生 |
| Bun | ≥ 1.3 | `Bun.FFI`（内置） | ✅ | ✅ 模拟 |
| Node.js | ≥ 18 | `koffi v3`（需安装） | ✅ | ✅ 模拟 |

### Python

| 后端 | 是否需要安装 | 说明 |
|------|-------------|------|
| `ctypes` | ❌ 内置 | Python 标准库，所有平台可用 |
| `cffi` | ✅ `pip install cffi` | 更灵活的 FFI 支持 |

> [!NOTE]
> Python 版本不支持异步 FFI 调用（`funcAsync`），因为 `ctypes` 和 `cffi` 均不提供原生异步能力。如需异步执行 C 函数，可使用 Python 的 `threading` 或 `asyncio` 模块自行封装。

## 语言/运行时检测优先级

SenRi FFI 按以下优先级自动检测语言/运行时：

1. **KossJS** — 如果 `globalThis._senri_ffi` 为真值
2. **Bun** — 如果 `Bun.FFI` 可用
3. **Deno** — 如果 `Deno.dlopen` 可用
4. **Node.js** — 如果 `process.versions.node` 存在

检测发生在模块首次加载时，之后使用缓存的适配器实例。

---

**下一步**:
- [快速开始](/zh/guide/getting-started) - 立即开始使用 SenRi FFI
- [API 概览](/zh/api/API-overview) - 了解所有可用 API
