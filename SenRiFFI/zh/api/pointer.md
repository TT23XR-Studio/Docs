# Pointer

`Pointer` 类提供对原始内存的读写操作，支持所有基本 C 类型的读写以及 C 字符串和指针操作。

## 导入

```ts
// JavaScript/TypeScript
import { Pointer } from '@tt23xrstudio/senri_ffi';
```

```python
# Python
from senri_ffi import Pointer
```

## 创建 Pointer

通常通过 `alloc()`、`address_of()`、`callback()` 获得，也可手动创建。

## 读写方法

| 方法 (JS → Python) | 说明 |
|---------------------|------|
| `readInt8` / `read_int8` | 读取 int8 |
| `readUint8` / `read_uint8` | 读取 uint8 |
| `readInt16` / `read_int16` | 读取 int16 |
| `readUint16` / `read_uint16` | 读取 uint16 |
| `readInt32` / `read_int32` | 读取 int32 |
| `readUint32` / `read_uint32` | 读取 uint32 |
| `readInt64` / `read_int64` | 读取 int64 |
| `readUint64` / `read_uint64` | 读取 uint64 |
| `readFloat32` / `read_float32` | 读取 float32 |
| `readFloat64` / `read_float64` | 读取 float64 |
| `readPointer` / `read_pointer` | 读取指针 |
| `readCString` / `read_cstring` | 读取 C 字符串 |
| `writeXxx` / `write_xxx` | 对应的写方法 |

## 指针操作

| 操作 | JavaScript | Python |
|------|-----------|--------|
| 偏移 | `ptr.add(offset)` | `ptr.add(offset)` |
| 地址 | `ptr.address` (bigint) | `ptr.address` (int) |
| 空检查 | `ptr.isNull()` | `ptr.is_null()` |

---

**详细文档**:
- [Pointer (JavaScript)](/zh/js/api/pointer-js)
- [Pointer (Python)](/zh/py/api/pointer-py)
