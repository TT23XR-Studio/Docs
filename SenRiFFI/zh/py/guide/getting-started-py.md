# 快速开始（Python）

## 简介

SenRi FFI Python 版是一个统一 FFI 库，让您在 Python 中使用统一的 API 调用原生 C 动态库。

本文档将指导您如何安装和使用 SenRi FFI Python 版。

## 安装

```bash
pip install senri-ffi
```

### 使用 cffi 后端（可选）

```bash
pip install "senri-ffi[cffi]"
```

### 系统要求

- Python ≥ 3.13

## 第一个 FFI 调用

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

## 跨平台示例

### Windows — 调用 MessageBoxW

```python
from senri_ffi import Library, types

user32 = Library.load("user32.dll")
MessageBoxW = user32.func("MessageBoxW", types.int32, [
    types.pointer, types.cstring, types.cstring, types.uint32
])

MessageBoxW(None, b"Hello from SenRi FFI!", b"Title", 0)
```

### Linux/macOS — 数学函数

```python
from senri_ffi import Library, types
import platform

libm = Library.load(
    "libSystem.B.dylib" if platform.system() == "Darwin" else "libm.so.6"
)

sqrt = libm.func("sqrt", types.float64, [types.float64])
pow = libm.func("pow", types.float64, [types.float64, types.float64])

print(sqrt(16))    # 4.0
print(pow(2, 10))  # 1024.0
```

## 基本类型系统

```python
from senri_ffi import types

# 13 种基本 C 类型
types.int32    # C: int32_t
types.float64  # C: double
types.cstring  # C: const char*
types.pointer  # C: void*
types.void     # C: void
```

## 复合类型构造

```python
from senri_ffi import pointer, array

pointer(types.int32)    # int32_t*
array(types.uint8, 256) # uint8_t[256]
```

## 内存管理

```python
from senri_ffi import alloc, free

# 分配 64 字节
ptr = alloc(64)
ptr.write_int32(0, 42)
print(ptr.read_int32(0))  # 42

# 释放
free(ptr)
```

## 后端确认

你可以通过以下代码确认当前使用的后端：

```python
from senri_ffi.globals import get_global_adapter

adapter = get_global_adapter()
print(type(adapter).__name__)  # CtypesAdapter 或 CffiAdapter
```

SenRi FFI 会在首次加载库时自动检测并选择正确的后端。

---

**下一步**:
- [API 概览 (Python)](/zh/py/api/API-overview-py) - 浏览所有 API
- [Library 详解 (Python)](/zh/py/api/library-py) - 深入了解库加载和函数绑定
