# API 概览（Python）

SenRi FFI Python 版导出的公共 API 一览。

## 模块导出

```python
from senri_ffi import (
    # 核心
    Library,
    types,

    # 类型构造器
    pointer,
    array,
    struct,

    # 指针操作
    Pointer,
    callback,

    # 内存管理
    alloc,
    free,
    address_of,
    errno,
    strerror,

    # 错误
    FFIError,
    FFITypeError,
    FFIBackendError,
)
```

## API 分类

### Library — 库加载与函数绑定

| 导出 | 说明 | 文档 |
|------|------|------|
| `Library.load(path)` | 加载原生共享库 (.dll/.so/.dylib) | [Library.load()](/zh/py/api/library-py) |
| `lib.func(name, retType, argTypes)` | 绑定 C 函数 — 同步调用（带缓存） | [func()](/zh/py/api/func-py) |
| `lib.close()` | 关闭库并释放资源 | [close()](/zh/py/api/close-py) |

详见 [Library](/zh/py/api/library-py)

> [!NOTE]
> Python 版本不支持 `funcAsync`（异步函数绑定），因为 `ctypes` 和 `cffi` 均不提供原生异步 FFI 调用能力。

### types — 统一类型系统

| 类型 | C 等价 | 大小 |
|------|--------|------|
| `types.void` | `void` | 0 |
| `types.int8` | `int8_t` | 1 |
| `types.uint8` | `uint8_t` | 1 |
| `types.int16` | `int16_t` | 2 |
| `types.uint16` | `uint16_t` | 2 |
| `types.int32` | `int32_t` | 4 |
| `types.uint32` | `uint32_t` | 4 |
| `types.int64` | `int64_t` | 8 |
| `types.uint64` | `uint64_t` | 8 |
| `types.float32` | `float` | 4 |
| `types.float64` | `double` | 8 |
| `types.pointer` | `void*` | 8 |
| `types.cstring` | `char*` | 8 |

详见 [类型系统](/zh/py/api/types-py)

### pointer / array — 复合类型构造器

| 函数 | 说明 |
|------|------|
| `pointer(type?)` | 创建指针类型描述符 |
| `array(type, length)` | 创建数组类型描述符 |

详见 [类型系统](/zh/py/api/types-py)

### struct — 结构体定义

| 函数 | 说明 |
|------|------|
| `struct(fields, options?)` | 定义 C 结构体类型 |

详见 [struct](/zh/py/api/struct-py)

### Pointer — 原始内存读写

| 方法 | 读/写 |
|------|-------|
| `read_int8` / `write_int8` | `int8` |
| `read_uint8` / `write_uint8` | `uint8` |
| `read_int16` / `write_int16` | `int16` |
| `read_uint16` / `write_uint16` | `uint16` |
| `read_int32` / `write_int32` | `int32` |
| `read_uint32` / `write_uint32` | `uint32` |
| `read_int64` / `write_int64` | `int64` |
| `read_uint64` / `write_uint64` | `uint64` |
| `read_float32` / `write_float32` | `float32` |
| `read_float64` / `write_float64` | `float64` |
| `read_pointer` / `write_pointer` | `pointer` |
| `read_cstring` / `write_cstring` | C 字符串 |
| `add(offset)` | 指针偏移 → 新 Pointer |
| `to_int()` | 转为 int |
| `address` (property) | 获取地址（返回 `int`） |
| `is_null()` | 检查是否为空指针 |

详见 [Pointer](/zh/py/api/pointer-py)

### callback — 回调函数

| 函数 | 说明 |
|------|------|
| `callback(retType, argTypes, fn)` | 将 Python 函数封装为 C 函数指针 |

详见 [callback](/zh/py/api/callback-py)

### 内存管理

| 函数 | 说明 |
|------|------|
| `alloc(size)` | 分配指定大小的内存 |
| `free(ptr)` | 释放内存 |
| `address_of(buffer)` | 获取 bytes/bytearray/memoryview 的指针地址 |
| `errno()` | 获取最后一次系统调用的错误码 |
| `strerror(code?)` | 获取错误码对应的描述字符串 |

详见 [内存管理](/zh/py/api/memory-py)

### 错误类型

| 类 | 说明 |
|----|------|
| `FFIError` | 通用 FFI 错误 |
| `FFITypeError` | 类型相关错误（继承自 FFIError） |
| `FFIBackendError` | 自定义后端相关错误（继承自 FFIError） |

详见 [错误处理](/zh/py/api/errors-py)

---

**详细文档**:
- [Library](/zh/py/api/library-py) - 库加载和函数绑定
- [类型系统](/zh/py/api/types-py) - 类型定义和使用
- [Pointer](/zh/py/api/pointer-py) - 指针读写操作
- [struct](/zh/py/api/struct-py) - 结构体定义
- [callback](/zh/py/api/callback-py) - 回调函数
- [内存管理](/zh/py/api/memory-py) - 内存分配和释放
- [错误处理](/zh/py/api/errors-py) - 错误类型
- [自定义后端](/zh/py/api/custom-backend-py) - 注入自定义 FFI 实现
