# 自定义后端（Python）

允许用户注入完全自定义的 FFI 后端实现，替换 SenRi 内置的后端自动检测机制。

## 概述

默认情况下 SenRi FFI 自动检测当前后端（cffi / ctypes）并选用对应的内置适配器。但某些场景下你可能需要：

- 使用不同于内置支持的 FFI 引擎（如 `python-ctypeslink` 等）
- 对底层 FFI 调用进行拦截、日志或 mock 测试
- 需要特殊的内存管理或回调处理逻辑

自定义后端功能允许你实现 `LibraryLike` 接口，SenRi 通过适配器包装器将其接入现有架构。**你负责底层 FFI 引擎的所有细节（加载、绑定、内存分配、回调、错误信息），SenRi 继续提供上层统一 API（类型系统、Pointer、struct、alloc/free 等）**。

## 导入

```python
from senri_ffi import Library, types
from senri_ffi.types.library_like import is_library_like, get_missing_methods
```

## LibraryLike 接口

```python
class LibraryLike:
    # ---------- 库操作（强制） ----------
    def load_library(self, path: str) -> Any: ...
    def bind_function(self, handle: Any, name: str, ret_type: Any, arg_types: list[Any], options: Any = None) -> Any: ...
    def close_library(self, handle: Any) -> None: ...

    # ---------- 内存管理（强制） ----------
    def alloc(self, size: int) -> dict: ...  # 返回 {"__ptr": int, "__buf": Any, "__size": int}
    def free(self, ptr: Any) -> None: ...
    def address_of(self, buffer: Any) -> int: ...

    # ---------- 回调管理（强制） ----------
    def register_callback(self, func: Any, ret_type: Any, arg_types: list[Any]) -> dict: ...  # 返回 {"__ptr": int, "__cb": Any}
    def unregister_callback(self, ptr: Any) -> None: ...

    # ---------- 错误信息（强制） ----------
    def get_errno(self) -> int: ...
    def get_strerror(self, errno: int) -> str: ...
```

### 方法说明

#### 库操作（强制）

| 方法 | 说明 |
|------|------|
| `load_library(path)` | 打开动态库。返回不透明句柄（任意类型），后续原样传给 `bind_function`/`close_library` |
| `bind_function(handle, name, ret_type, arg_types, options)` | 绑定同步 C 函数。返回可调用的 Python 函数 |
| `close_library(handle)` | 关闭库释放资源。静默处理，不可抛出异常 |

#### 内存管理（强制）

| 方法 | 说明 |
|------|------|
| `alloc(size)` | 分配原生内存。返回字典必须包含 `__ptr`（int）、`__buf`（任何）、`__size`（int） |
| `free(ptr)` | 释放由 `alloc` 分配的内存。静默处理，不可抛出异常 |
| `address_of(buffer)` | 获取 bytes/bytearray/memoryview 的原生起始地址，返回 int |

`__buf` 必须能被 Python `struct` 模块操作（即 `bytearray`、`bytes` 或 `memoryview`），因为 `Pointer` 类的读写操作依赖它。

#### 回调管理（强制）

| 方法 | 说明 |
|------|------|
| `register_callback(func, ret_type, arg_types)` | 将 Python 函数注册为 C 回调。返回字典必须包含 `__ptr`（int 函数指针地址）和 `__cb`（引擎侧回调句柄） |
| `unregister_callback(ptr)` | 释放先前注册的回调。静默处理，不可抛出异常 |

#### 错误信息（强制）

| 方法 | 说明 |
|------|------|
| `get_errno()` | 获取最后一次系统调用的错误码。返回 int |
| `get_strerror(errno)` | 根据错误码获取可读的错误描述字符串 |

## 类型守卫

### `is_library_like(obj)`

检查对象是否实现了 `LibraryLike` 接口的所有强制方法。

```python
if is_library_like(my_backend):
    # 可以安全地传入 Library.load()
    pass
```

### `get_missing_methods(obj)`

返回缺失的强制方法名列表（全部实现则返回空列表）。

```python
missing = get_missing_methods(my_backend)
if missing:
    print(f"缺失方法: {', '.join(missing)}")
```

## Library.load 使用自定义后端

### 传入对象实例

```python
from senri_ffi import Library, types

class MyBackend:
    def load_library(self, path):
        return myffi.load(path)

    def bind_function(self, handle, name, ret_type, arg_types, options=None):
        return lambda *args: myffi.call(handle, name, args)

    def close_library(self, handle):
        myffi.unload(handle)

    def alloc(self, size):
        import ctypes
        buf = (ctypes.c_uint8 * size)()
        return {"__ptr": ctypes.addressof(buf), "__buf": buf, "__size": size}

    def free(self, ptr):
        pass

    def address_of(self, buffer):
        import ctypes
        return ctypes.addressof(ctypes.c_char.from_buffer(buffer))

    def register_callback(self, func, ret_type, arg_types):
        return myffi.create_callback(func, ret_type, arg_types)

    def unregister_callback(self, ptr):
        pass

    def get_errno(self):
        return 0

    def get_strerror(self, errno):
        return "Error: " + str(errno)

lib = Library.load("/path/to/lib.so", MyBackend())
abs_fn = lib.func("abs", types.int32, [types.int32])
print(abs_fn(-42))  # 42
lib.close()
```

### 传入构造函数

```python
class MyFFI:
    def __init__(self, path):
        self._handle = myffi.load(path)

    def load_library(self, path):
        return myffi.load(path)

    def bind_function(self, handle, name, ret_type, arg_types, options=None):
        return lambda *args: myffi.call(handle, name, args)

    def close_library(self, handle):
        myffi.unload(handle)

    def alloc(self, size):
        import ctypes
        buf = (ctypes.c_uint8 * size)()
        return {"__ptr": ctypes.addressof(buf), "__buf": buf, "__size": size}

    def free(self, ptr):
        pass

    def address_of(self, buffer):
        import ctypes
        return ctypes.addressof(ctypes.c_char.from_buffer(buffer))

    def register_callback(self, func, ret_type, arg_types):
        return myffi.create_callback(func, ret_type, arg_types)

    def unregister_callback(self, ptr):
        pass

    def get_errno(self):
        return 0

    def get_strerror(self, errno):
        return "Error: " + str(errno)

lib = Library.load("/path/to/lib.so", MyFFI)
```

构造函数会在调用时接收 `path` 参数：`MyFFI(path)`。

## 烟雾测试

`Library.load` 在加载自定义后端时会自动执行烟雾测试：

1. 调用 `alloc(1)` 验证返回值包含 `__ptr`（int）、`__buf`（非空）、`__size`（int）
2. 调用 `free` 释放
3. 调用 `get_errno()` 验证返回类型为 `int`

任何验证失败均抛出 `FFITypeError`。

可通过环境变量跳过烟雾测试：

```bash
SENRI_FFI_SKIP_SMOKE_TEST=1 python app.py
```

## 安全切换机制

### 版本戳（僵尸句柄防御）

每次切换全局适配器时，内部版本号递增。`Library` 实例在创建时记录当前版本号，每次调用 `func()` 时比对全局版本。若不一致，立即抛出 `FFIError`：

```text
Library instance has expired: the global FFI backend has been replaced.
Please reload the library via Library.load().
```

这避免了因全局适配器被替换后，旧 `Library` 实例调用已销毁后端的崩溃。

## 错误处理

| 场景 | 错误类型 | 说明 |
|------|---------|------|
| 传入的 backend 非对象/类 | `FFITypeError` | `Invalid backend: expected a LibraryLike object or a constructor` |
| 后端缺少强制方法 | `FFITypeError` | `Invalid backend: missing mandatory methods: alloc, free, ...` |
| 烟雾测试失败 | `FFITypeError` | `Smoke test failed: alloc(1) returned object with invalid __ptr` |
| 后端 bind 抛出异常 | `FFIError` | `Failed to bind function "xxx": 原始错误信息` |

## 与 JavaScript 版的对照

| 特性 | JavaScript 版 | Python 版 |
|------|--------------|-----------|
| 接口 | `LibraryLike` | `LibraryLike`（鸭子类型） |
| 检查 | `isLibraryLike(obj)` | `is_library_like(obj)` |
| 缺失方法 | `getMissingMethods(obj)` | `get_missing_methods(obj)` |
| 部分实现 | `createBackendWithFallback()` | ❌ 不支持（需自行实现回退） |
| 异步绑定 | `bindAsync()` (可选) | ❌ 不支持 |
| 烟雾测试 | ✅ | ✅ |
| 跳过测试 | `SENRI_FFI_SKIP_SMOKE_TEST=1` | `SENRI_FFI_SKIP_SMOKE_TEST=1` |
