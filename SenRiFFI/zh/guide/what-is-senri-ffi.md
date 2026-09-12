# 什么是 SenRi FFI？

## 概述

**SenRi FFI**（千里 FFI）是一个**跨语言 FFI（外部函数接口）统一抽象库**，让你用同一套 API 在 **JavaScript/TypeScript**（KossJS、Node.js、Bun、Deno）和 **Python**（ctypes/cffi）上调用原生 C 动态库。

> [!TIP]
> 不同语言/运行时各自提供了不同的 FFI API（KossJS 的 `_senri_ffi`、Bun 的 `Bun.FFI`、Deno 的 `Deno.dlopen`、Node.js 依赖 `koffi`、Python 的 `ctypes`/`cffi`）。SenRi FFI 在这些底层 API 之上提供一个统一的抽象层，使得编写一次 FFI 代码即可在多个语言/运行时上运行。

## 开源协议

本项目采用 [Apache 2.0](https://www.apache.org/licenses/LICENSE-2.0) 协议开源发布。

## 问题背景

在不同语言/运行时中调用原生 C 库，做法完全不同：

| 语言/运行时 | FFI 方式 | 类型名称示例 |
|------------|---------|-------------|
| KossJS | `globalThis._senri_ffi`（内置） | `int32` |
| Bun | `Bun.FFI`（内置，v1.3+） | `i32` |
| Deno | `Deno.dlopen`（内置） | `i32` |
| Node.js | `koffi`（需安装） | `'int32'` (v3 字符串类型) |
| Python (ctypes) | `ctypes.CDLL`（内置） | `ctypes.c_int32` |
| Python (cffi) | `ffi.dlopen`（需安装） | `"int32_t"` |

直接在代码中使用语言/运行时的原生 API 会锁死你的代码到某个特定语言/运行时。SenRi FFI 解决了这个问题。

## 技术架构

```
            您的应用程序
        ┌────────┴────────┐
        ↓                 ↓
  JavaScript/TypeScript   Python
        ↓                 ↓
  SenRi FFI (统一 API 层)
        ↓                 ↓
  ┌─────┼─────┐     ┌────┼────┐
  ↓     ↓     ↓     ↓    ↓    ↓
KossJS Bun  Deno  Node ctypes cffi
  ↓     ↓     ↓     ↓    ↓    ↓
senri  Bun.FFI Deno.dlopen koffi ctypes cffi
```

### 适配器模式

SenRi FFI 使用**适配器模式**，通过 `FFIAdapter` 接口统一各语言/运行时：

**JavaScript/TypeScript 版**（4 个适配器）：
- `KossJSAdapter` — 包装 `globalThis._senri_ffi`
- `BunAdapter` — 包装 `Bun.FFI`（Bun 1.3+ 重命名）
- `DenoAdapter` — 包装 `Deno.dlopen`，自动转换 pointer/string 类型
- `NodeAdapter` — 包装 `koffi v3`（字符串类型映射）

**Python 版**（2 个适配器）：
- `CtypesAdapter` — 包装 `ctypes`（Python 标准库）
- `CffiAdapter` — 包装 `cffi`（可选安装）

### 自定义后端

两个语言版本均允许你注入**完全自定义的 FFI 后端**，替换内置的语言/运行时自动检测。只需实现 `LibraryLike` 接口，SenRi 通过适配器包装器将其接入现有架构，上层 API（类型系统、Pointer、struct、alloc/free 等）保持不变。

## 核心特性

### 统一类型系统

使用 `types.int32`、`types.cstring` 等统一名称，各适配器自动映射为语言/运行时原生类型：

```ts
// JavaScript/TypeScript — 在所有语言/运行时上都一样
types.int32   // KossJS/Bun/Deno/String: 'int32', Bun: 'i32'
types.float64 // KossJS: 'float64', Bun: 'f64', Deno: 'f64', Node: 'float64'
```

```python
# Python — 在所有后端上都一样
types.int32   # ctypes: c_int32, cffi: "int32_t"
types.float64 # ctypes: c_double, cffi: "double"
```

### 结构体 / 指针 / 数组

支持复合类型描述符：

```ts
// JavaScript/TypeScript
pointer(types.int32);    // 指向 int32 的指针
array(types.uint8, 256); // uint8[256]
```

```python
# Python
pointer(types.int32)    # 指向 int32 的指针
array(types.uint8, 256) # uint8[256]
```

### 回调函数

将宿主语言函数封装为 C 函数指针：

```ts
// JavaScript/TypeScript
const compare = callback(
  types.int32,
  [pointer(types.int32), pointer(types.int32)],
  (a, b) => a.readInt32(0) - b.readInt32(0)
);
```

```python
# Python
compare = callback(
    types.int32,
    [pointer(types.int32), pointer(types.int32)],
    lambda a, b: a.read_int32(0) - b.read_int32(0)
)
```

### 统一错误类型

所有语言/运行时抛出统一的 `FFIError` / `FFITypeError`，便于统一处理。

## 支持的语言/运行时

### JavaScript / TypeScript

| 运行时 | 版本要求 | FFI 后端 | 同步 | 异步 |
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

---

**下一步**:
- [快速开始](/zh/guide/getting-started) - 立即开始使用 SenRi FFI
- [API 概览](/zh/api/API-overview) - 了解所有可用 API
