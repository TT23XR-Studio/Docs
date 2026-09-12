# 什么是 SenRi FFI（Python）？

## 概述

**SenRi FFI**（千里 FFI）是一个**跨语言 FFI（外部函数接口）统一抽象库**，让你用同一套 API 在 **Python** 上调用原生 C 动态库。SenRi FFI 同时提供 JavaScript/TypeScript 和 Python 两个语言版本，共享统一的类型系统和 API 设计理念。

> [!TIP]
> Python 版本通过 `ctypes`（内置）和 `cffi`（可选）双后端支持，自动检测可用后端并选择最优方案。SenRi FFI 在这些底层 API 之上提供一个统一的抽象层，使得编写一次 FFI 代码即可在不同后端上运行。

## 开源协议

本项目采用 [Apache 2.0](https://www.apache.org/licenses/LICENSE-2.0) 协议开源发布。

## 问题背景

在 Python 中调用原生 C 库，有多种方式：

| 后端 | 说明 | 是否内置 |
|------|------|---------|
| `ctypes` | Python 标准库，C 兼容类型 | ✅ 内置 |
| `cffi` | C Foreign Function Interface，更灵活 | ❌ 需安装 |

直接使用这些后端的 API 会导致代码与特定后端绑定。SenRi FFI 解决了这个问题，提供统一的抽象层。

## 技术架构

```
        您的应用程序 (Python)
                ↓
        SenRi FFI (统一 API 层)
                ↓
    ┌───────────┬───────────┐
    ↓           ↓           ↓
ctypes_adapter cffi_adapter custom_wrapper
  (内置)       (可选)      (自定义)
    ↓           ↓           ↓
  ctypes       cffi     用户自定义实现
```

### 适配器模式

SenRi FFI Python 版使用**适配器模式**，通过 `FFIAdapter` 接口统一各后端：

1. 定义统一的 `FFIAdapter` 接口（11 个方法）
2. 两个后端各自实现适配器：
   - `CtypesAdapter` — 包装 `ctypes`（Python 标准库）
   - `CffiAdapter` — 包装 `cffi`（可选安装）
3. 启动时通过 `_detect_adapter()` 自动选择合适的后端

### 自定义后端

SenRi FFI 允许你注入**完全自定义的 FFI 后端**，替换内置的后端检测。只需实现 `LibraryLike` 接口（10 个强制方法），SenRi 通过适配器包装器将其接入现有架构，上层 API（类型系统、Pointer、struct、alloc/free 等）保持不变。

```python
from senri_ffi import Library, types

class MyBackend:
    def load_library(self, path): ...
    def bind_function(self, handle, name, ret_type, arg_types, options=None): ...
    # ... 实现所有强制方法 ...

lib = Library.load("/path/to/lib.so", MyBackend())
abs_fn = lib.func("abs", types.int32, [types.int32])
```

详见 [自定义后端](/zh/py/api/custom-backend-py)。

## 核心特性

### 统一类型系统

使用 `types.int32`、`types.cstring` 等统一名称，各适配器自动映射为后端原生类型：

```python
from senri_ffi import types

# 在所有后端上都一样
types.int32   # ctypes: c_int32, cffi: "int"
types.float64 # ctypes: c_double, cffi: "double"
```

### 结构体 / 指针 / 数组

支持复合类型描述符：

```python
from senri_ffi import pointer, array

pointer(types.int32)    # 指向 int32 的指针
array(types.uint8, 256) # uint8[256]
```

### Pointer — 原始内存读写

```python
from senri_ffi import alloc

ptr = alloc(64)
ptr.write_int32(0, 42)
print(ptr.read_int32(0))  # 42
```

### 回调函数

将 Python 函数封装为 C 函数指针：

```python
from senri_ffi import callback, types

compare = callback(
    types.int32,
    [pointer(types.int32), pointer(types.int32)],
    lambda a, b: a.read_int32(0) - b.read_int32(0)
)
```

### 统一错误类型

所有后端抛出统一的 `FFIError` / `FFITypeError`，便于统一处理。

## 支持的后端

| 后端 | 是否需要安装 | 说明 |
|------|-------------|------|
| `ctypes` | ❌ 内置 | Python 标准库，所有平台可用 |
| `cffi` | ✅ `pip install cffi` | 更灵活的 FFI 支持 |

## 后端检测优先级

SenRi FFI Python 版按以下优先级自动检测后端：

1. **cffi** — 如果 `import cffi` 成功
2. **ctypes** — 默认回退（始终可用）

检测发生在 `Library.load()` 首次调用时。

## JavaScript / Python 对照

SenRi FFI 的 JS 版和 Python 版共享相同的设计理念：

| 特性 | JavaScript 版 | Python 版 |
|------|--------------|-----------|
| 库加载 | `Library.load(path)` | `Library.load(path)` |
| 函数绑定 | `lib.func(name, ret, args)` | `lib.func(name, ret, args)` |
| 异步调用 | `lib.funcAsync(name, ret, args)` | ❌ 不支持（Python 无内置异步 FFI） |
| 指针 | `Pointer` 类 | `Pointer` 类 |
| 结构体 | `struct(fields)` | `struct(fields)` |
| 回调 | `callback(ret, args, fn)` | `callback(ret, args, fn)` |
| 内存管理 | `alloc/free/addressOf` | `alloc/free/address_of` |
| 错误 | `FFIError/FFITypeError` | `FFIError/FFITypeError` |
| 自定义后端 | `LibraryLike` 接口 | `LibraryLike` 接口 |

> [!NOTE]
> Python 版本不支持 `funcAsync`（异步函数绑定），因为 Python 的 `ctypes` 和 `cffi` 均不提供原生异步 FFI 调用能力。如需异步执行 C 函数，可使用 Python 的 `threading` 或 `asyncio` 模块自行封装。

---

**下一步**:
- [快速开始 (Python)](/zh/py/guide/getting-started-py) - 立即开始使用 SenRi FFI Python 版
- [API 概览 (Python)](/zh/py/api/API-overview-py) - 了解所有可用 API
