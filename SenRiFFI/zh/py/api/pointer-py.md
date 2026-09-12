# Pointer（Python）

`Pointer` 类提供对原始内存的读写操作，支持所有基本 C 类型的读写以及 C 字符串和指针操作。

## 导入

```python
from senri_ffi import Pointer
```

## 创建 Pointer

Pointer 通常不直接使用构造函数创建，而是通过以下方式获得：

### `alloc(size)` — 分配新内存

```python
from senri_ffi import alloc

ptr = alloc(64)  # 分配 64 字节
```

### `address_of(buffer)` — 从 bytes/bytearray 获取指针

```python
from senri_ffi import address_of

buf = bytearray(16)
ptr = address_of(buf)
```

### `callback()` — 从回调函数获取指针

```python
from senri_ffi import callback, types

cb = callback(types.int32, [types.pointer, types.pointer], lambda a, b: 0)
```

### 手动创建

```python
ptr = Pointer(12345)  # 从整数地址创建
ptr2 = Pointer(bytearray(16))  # 从 bytearray 创建
```

---

## 读方法

所有读取方法接受一个可选的 `offset` 参数（默认 0），从该偏移处读取对应类型的值。

| 方法 | 返回类型 | 说明 |
|------|---------|------|
| `read_int8(offset=0)` | `int` | 读取 int8 |
| `read_uint8(offset=0)` | `int` | 读取 uint8 |
| `read_int16(offset=0)` | `int` | 读取 int16（小端） |
| `read_uint16(offset=0)` | `int` | 读取 uint16（小端） |
| `read_int32(offset=0)` | `int` | 读取 int32（小端） |
| `read_uint32(offset=0)` | `int` | 读取 uint32（小端） |
| `read_int64(offset=0)` | `int` | 读取 int64（小端） |
| `read_uint64(offset=0)` | `int` | 读取 uint64（小端） |
| `read_float32(offset=0)` | `float` | 读取 float32（小端） |
| `read_float64(offset=0)` | `float` | 读取 float64（小端） |
| `read_pointer(offset=0)` | `Pointer` | 读取指针值（uint64 → new Pointer） |
| `read_cstring(offset=0)` | `str` | 读取以 null 结尾的 UTF-8 字符串 |

## 写方法

| 方法 | 参数 | 说明 |
|------|------|------|
| `write_int8(offset, value)` | `int` | 写入 int8 |
| `write_uint8(offset, value)` | `int` | 写入 uint8 |
| `write_int16(offset, value)` | `int` | 写入 int16（小端） |
| `write_uint16(offset, value)` | `int` | 写入 uint16（小端） |
| `write_int32(offset, value)` | `int` | 写入 int32（小端） |
| `write_uint32(offset, value)` | `int` | 写入 uint32（小端） |
| `write_int64(offset, value)` | `int` | 写入 int64（小端） |
| `write_uint64(offset, value)` | `int` | 写入 uint64（小端） |
| `write_float32(offset, value)` | `float` | 写入 float32（小端） |
| `write_float64(offset, value)` | `float` | 写入 float64（小端） |
| `write_pointer(offset, value)` | `Pointer \| int` | 写入指针值 |
| `write_cstring(offset, s)` | `str` | 写入以 null 结尾的 UTF-8 字符串 |

---

## 指针操作

### `add(offset)` — 指针偏移

```python
ptr.add(offset: int) -> Pointer
```

返回一个新的 Pointer，地址偏移 `offset` 字节。

```python
head = alloc(64)
tail = head.add(32)  # tail 指向 head 的中间位置
```

### `to_int()` — 转为 int

```python
ptr.to_int() -> int
```

返回指针地址的 int 表示。

### `address` — 获取地址

```python
ptr.address: int
```

只读 property，返回指针的地址值。

```python
ptr = alloc(64)
print(ptr.address)   # → 140732311111111 (int)
print(ptr.is_null()) # → False
```

### `is_null()` — 检查空指针

```python
ptr.is_null() -> bool
```

返回 `self.address == 0`。比手动比较更清晰。

```python
ptr = alloc(64)
print(ptr.is_null())  # False

null_ptr = Pointer(0)
print(null_ptr.is_null())  # True
```

---

## 完整示例

```python
from senri_ffi import alloc

# 分配 64 字节
ptr = alloc(64)

# 写入数据
ptr.write_int32(0, 42)           # 偏移 0: int32 = 42
ptr.write_float64(4, 3.14159)   # 偏移 4: float64 = 3.14159
ptr.write_cstring(12, "hello")  # 偏移 12: "hello\0"

# 读取数据
print(ptr.read_int32(0))     # 42
print(ptr.read_float64(4))   # 3.14159
print(ptr.read_cstring(12))  # "hello"

# 指针操作
print(ptr.address)           # → 140732311111111 (int)
print(ptr.is_null())         # → False
offset_ptr = ptr.add(12)
print(offset_ptr.read_cstring(0))  # "hello"
```

## 内部结构

Pointer 内部使用 `_data` 字典存储底层引用：

```python
{
    "__ptr": int,       # 指针地址
    "__buf": Any,       # 后备缓冲区（可选）
    "__size": int,      # 缓冲区大小
}
```

读写操作通过 Python 的 `struct` 模块访问后备缓冲区。如果没有后备缓冲区，读写会抛出 `FFIError`（C 字符串读取会安全返回空字符串）。
