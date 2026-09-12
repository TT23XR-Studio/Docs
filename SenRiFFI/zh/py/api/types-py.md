# 类型系统（Python）

SenRi FFI Python 版提供了一套统一的 C 类型系统，在所有支持的后端上使用相同的类型名称。

## 导入

```python
from senri_ffi import types, pointer, array
```

## 类型常量概览

| 类型 | C 等价 | 大小 | Python 对应类型 |
|------|--------|------|----------------|
| `types.void` | `void` | 0 | `None` |
| `types.int8` | `int8_t` | 1 | `int` |
| `types.uint8` | `uint8_t` | 1 | `int` |
| `types.int16` | `int16_t` | 2 | `int` |
| `types.uint16` | `uint16_t` | 2 | `int` |
| `types.int32` | `int32_t` | 4 | `int` |
| `types.uint32` | `uint32_t` | 4 | `int` |
| `types.int64` | `int64_t` | 8 | `int` |
| `types.uint64` | `uint64_t` | 8 | `int` |
| `types.float32` | `float` | 4 | `float` |
| `types.float64` | `double` | 8 | `float` |
| `types.pointer` | `void*` | 8 | `int` |
| `types.cstring` | `char*` | 8 | `bytes` |

## 类型构造器

### `pointer(type?)` — 指针类型

```python
from senri_ffi import pointer, types

Int32Ptr = pointer(types.int32)     # int32_t*
VoidPtr = pointer()                  # void*
```

### `array(type, length)` — 数组类型

```python
from senri_ffi import array, types

Buffer256 = array(types.uint8, 256)  # uint8_t[256]
IntArr10 = array(types.int32, 10)    # int32_t[10]
```

## 类型标准化流程

```
用户类型描述符
    ↓
normalize_type()  →  NormalizedType
    ├─ 原始类型 ('int32') → adapter.map_type() → 后端类型
    ├─ pointer 描述符     → adapter.create_pointer_type()
    ├─ array 描述符       → adapter.create_array_type()
    └─ struct 描述符      → adapter.create_struct_type()
    ↓
后端原生类型
    ↓
缓存（避免重复转换）
```

## 各后端类型映射

| 统一类型 | ctypes | cffi |
|---------|--------|------|
| `void` | `None` | `"void"` |
| `int8` | `ctypes.c_int8` | `"int8_t"` |
| `uint8` | `ctypes.c_uint8` | `"uint8_t"` |
| `int16` | `ctypes.c_int16` | `"int16_t"` |
| `uint16` | `ctypes.c_uint16` | `"uint16_t"` |
| `int32` | `ctypes.c_int32` | `"int32_t"` |
| `uint32` | `ctypes.c_uint32` | `"uint32_t"` |
| `int64` | `ctypes.c_int64` | `"int64_t"` |
| `uint64` | `ctypes.c_uint64` | `"uint64_t"` |
| `float32` | `ctypes.c_float` | `"float"` |
| `float64` | `ctypes.c_double` | `"double"` |
| `pointer` | `ctypes.c_void_p` | `"void *" |
| `cstring` | `ctypes.c_char_p` | `"char *" |

## 与 JavaScript 版的对照

Python 版和 JavaScript 版使用相同的类型常量名称，但底层映射不同：

| 统一类型 | JS (KossJS) | JS (koffi) | Python (ctypes) | Python (cffi) |
|---------|-------------|------------|-----------------|---------------|
| `int32` | `'int32'` | `'int32'` | `c_int32` | `"int32_t"` |
| `float64` | `'float64'` | `'float64'` | `c_double` | `"double"` |
| `pointer` | `'pointer'` | `'void *'` | `c_void_p` | `"void *"` |
| `cstring` | `'cstring'` | `'string'` | `c_char_p` | `"char *"` |
