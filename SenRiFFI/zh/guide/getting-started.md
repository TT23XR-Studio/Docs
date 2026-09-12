# 快速开始

## 简介

SenRi FFI 是一个统一 FFI 库，让您在 JavaScript/TypeScript 和 Python 中使用同一套 API 调用原生 C 动态库。

本文档将指导您如何安装和使用 SenRi FFI。

---

## JavaScript / TypeScript

### 安装

```bash
npm install @tt23xrstudio/senri_ffi
```

**Node.js 额外步骤** — 还需要安装 `koffi`：

```bash
npm install koffi
```

**Deno** — 无需额外安装，内置 `Deno.dlopen` 支持。

### 第一个 FFI 调用

```ts
import { Library, types } from '@tt23xrstudio/senri_ffi';

// 加载 C 标准库
const lib = Library.load(
  process.platform === 'win32' ? 'msvcrt.dll' : 'libc.so.6'
);

// 绑定 C 函数
const abs = lib.func('abs', types.int32, [types.int32]);

// 调用 C 函数
console.log(abs(-42)); // 输出: 42

// 关闭库释放资源
lib.close();
```

### 跨平台示例

```ts
import { Library, types } from '@tt23xrstudio/senri_ffi';

const libm = Library.load(
  process.platform === 'win32' ? 'msvcrt.dll'
    : process.platform === 'darwin' ? 'libSystem.B.dylib'
    : 'libm.so.6'
);

const sqrt = libm.func('sqrt', types.float64, [types.float64]);
console.log(sqrt(16)); // 4

libm.close();
```

---

## Python

### 安装

```bash
pip install senri-ffi
```

使用 cffi 后端（可选）：

```bash
pip install "senri-ffi[cffi]"
```

系统要求：Python ≥ 3.13

### 第一个 FFI 调用

```python
from senri_ffi import Library, types
import platform

# 加载 C 标准库
if platform.system() == "Windows":
    lib = Library.load("msvcrt.dll")
elif platform.system() == "Darwin":
    lib = Library.load("libSystem.B.dylib")
else:
    lib = Library.load("libc.so.6")

# 绑定 C 函数
abs_fn = lib.func("abs", types.int32, [types.int32])

# 调用 C 函数
print(abs_fn(-42))  # 输出: 42

# 关闭库释放资源
lib.close()
```

### 跨平台示例

```python
from senri_ffi import Library, types
import platform

libm = Library.load(
    "libSystem.B.dylib" if platform.system() == "Darwin" else "libm.so.6"
)

sqrt = libm.func("sqrt", types.float64, [types.float64])
print(sqrt(16))  # 4.0

libm.close()
```

---

## 基本类型系统

```ts
// JavaScript/TypeScript
import { types } from '@tt23xrstudio/senri_ffi';

types.int32    // C: int32_t
types.float64  // C: double
types.cstring  // C: const char*
types.pointer  // C: void*
types.void     // C: void
```

```python
# Python
from senri_ffi import types

types.int32    # C: int32_t
types.float64  # C: double
types.cstring  # C: const char*
types.pointer  # C: void*
types.void     # C: void
```

## 复合类型构造

```ts
// JavaScript/TypeScript
import { pointer, array } from '@tt23xrstudio/senri_ffi';

pointer(types.int32);      // int32_t*
array(types.uint8, 256);   // uint8_t[256]
```

```python
# Python
from senri_ffi import pointer, array

pointer(types.int32)    # int32_t*
array(types.uint8, 256) # uint8_t[256]
```

## 内存管理

```ts
// JavaScript/TypeScript
import { alloc, free } from '@tt23xrstudio/senri_ffi';

const ptr = alloc(64);
ptr.writeInt32(0, 42);
console.log(ptr.readInt32(0)); // 42
free(ptr);
```

```python
# Python
from senri_ffi import alloc, free

ptr = alloc(64)
ptr.write_int32(0, 42)
print(ptr.read_int32(0))  # 42
free(ptr)
```

---

## 下一步

### JavaScript / TypeScript

- [JS 运行时检测](/zh/js/guide/runtime-detection) - 了解自动检测机制
- [JS API 概览](/zh/js/api/API-overview) - 浏览所有 JS API
- [JS Library 详解](/zh/js/api/library) - 深入了解库加载和函数绑定

### Python

- [Python 快速开始](/zh/py/guide/getting-started-py) - Python 版详细指南
- [Python API 概览](/zh/py/api/API-overview-py) - 浏览所有 Python API
- [Python Library 详解](/zh/py/api/library-py) - 深入了解库加载和函数绑定
