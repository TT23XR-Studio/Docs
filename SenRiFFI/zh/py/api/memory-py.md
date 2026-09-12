# 内存管理（Python）

SenRi FFI Python 版提供了一组内存管理函数：`alloc`、`free`、`address_of`、`errno`、`strerror`。

## 导入

```python
from senri_ffi import alloc, free, address_of, errno, strerror
```

---

## `alloc(size)` — 分配内存

```python
def alloc(size: int) -> Pointer
```

分配指定大小的内存，返回指向该内存的 `Pointer` 实例。

```python
mem = alloc(128)  # 分配 128 字节
mem.write_int32(0, 42)
```

**各后端实现**:

| 后端 | 实现 |
|------|------|
| ctypes | `(ctypes.c_uint8 * size)()` + `ctypes.addressof(buf)` |
| cffi | `ffi.new("char[]", size)` |

**错误**:

| 条件 | 抛出 |
|------|------|
| `size` 不是整数 | `FFIError('alloc requires a positive size')` |
| `size <= 0` | `FFIError('alloc requires a positive size')` |
| 后端未初始化 | `FFIError('Adapter not initialized')` |

---

## `free(ptr)` — 释放内存

```python
def free(ptr: Pointer | Any) -> None
```

释放之前分配的内存。接受 `Pointer` 实例或原始的底层数据结构。

```python
mem = alloc(128)
# ... 使用 mem ...
free(mem)
```

**注意**: `ctypes` 后端的 `free` 为静默操作（依赖 Python GC 释放）。

---

## `address_of(buffer)` — 获取指针地址

```python
def address_of(buffer: bytes | bytearray | memoryview) -> Pointer
```

获取 `bytes`、`bytearray` 或 `memoryview` 的指针地址。

```python
buf = bytearray(16)
buf[0] = 42

ptr = address_of(buf)
print(ptr.read_uint8(0))  # 42
```

**错误**: 如果 `buffer` 不是支持的类型，抛出 `FFIError('address_of requires bytes, bytearray, or memoryview')`

---

## `errno()` — 获取系统错误码

```python
def errno() -> int
```

获取最后一次系统调用的错误码（`errno`）。

```python
code = errno()
if code != 0:
    print(f"系统错误: {strerror(code)}")
```

**各后端支持**:

| 后端 | 支持 | 说明 |
|------|------|------|
| ctypes | 支持 | `ctypes.get_errno()` |
| cffi | 支持 | `ffi.get_errno()` |

---

## `strerror(code)` — 获取错误描述

```python
def strerror(code: int = 0) -> str
```

将错误码转换为人类可读的描述字符串。

```python
print(strerror(2))  # "No such file or directory"
```

**各后端支持**:

| 后端 | 支持 | 说明 |
|------|------|------|
| ctypes | 支持 | 调用 libc `strerror()` |
| cffi | 支持 | 调用 libc `strerror()` |

---

## 完整示例

```python
from senri_ffi import alloc, free, address_of, errno, strerror

# 分配和释放
mem = alloc(256)
mem.write_cstring(0, "Hello from SenRi FFI!")
print(mem.read_cstring(0))
free(mem)

# 从现有 bytearray 获取指针
buf = bytearray(8)
import struct
struct.pack_into("<i", buf, 0, 12345)

ptr = address_of(buf)
print(ptr.read_int32(0))  # 12345

# 系统错误检测
code = errno()
if code != 0:
    print(f"系统错误 ({code}): {strerror(code)}")
```

## 与 JavaScript 版的对照

| 函数 | JavaScript 版 | Python 版 |
|------|--------------|-----------|
| 分配 | `alloc(size)` | `alloc(size)` |
| 释放 | `free(ptr)` | `free(ptr)` |
| 地址 | `addressOf(buffer)` | `address_of(buffer)` |
| 错误码 | `errno()` | `errno()` |
| 错误描述 | `strerror(code)` | `strerror(code)` |
