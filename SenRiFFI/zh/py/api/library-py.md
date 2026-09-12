# Library（Python）

`Library` 类用于加载原生共享库，是 SenRi FFI 的入口。加载后可通过 `func()` 方法绑定 C 函数。

## 导入

```python
from senri_ffi import Library
```

---

## `Library.load(path, backend=None)` — 加载共享库

加载指定路径的原生共享库，返回一个 `Library` 实例。

```python
# 使用内置后端检测（默认）
lib = Library.load(
    "user32.dll" if platform.system() == "Windows" else "libm.so.6"
)

# 使用自定义后端
lib = Library.load("/path/to/lib.so", my_custom_backend)
```

### 参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `path` | `str` | 共享库的文件路径。Windows: `.dll`、Linux: `.so`、macOS: `.dylib` |
| `backend` | `LibraryLike \| type` | 可选。自定义 FFI 后端实现或构造函数 |

`backend` 参数支持两种形式：

- **对象实例** — 直接传入实现了 `LibraryLike` 接口的对象
- **构造函数** — 传入一个类，调用 `Backend(path)` 构造实例

不传 `backend` 时，SenRi 使用内置后端自动检测（cffi → ctypes）。

### 返回值

`Library` 实例。

### 各后端实现（使用内置后端时）

| 后端 | 实现 |
|------|------|
| cffi | `ffi.dlopen(path)` |
| ctypes | `ctypes.CDLL(path)` / `ctypes.WinDLL(path)` |

### 错误处理

加载失败时抛出 `FFIError`:

```python
from senri_ffi import Library

try:
    lib = Library.load("/path/to/nonexistent.so")
except Exception as e:
    print(e.message)  # "Failed to load library..."
```

### 使用自定义后端

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
        return ctypes.addressof(buffer)

    def register_callback(self, func, ret_type, arg_types):
        return myffi.create_callback(func, ret_type, arg_types)

    def unregister_callback(self, ptr):
        pass

    def get_errno(self):
        return 0

    def get_strerror(self, errno):
        return ""

lib = Library.load("/path/to/lib.so", MyBackend())
abs_fn = lib.func("abs", types.int32, [types.int32])
```

详见 [自定义后端](/zh/py/api/custom-backend-py)。

---

**下一步**:
- [func() — 同步函数绑定](/zh/py/api/func-py)
- [close() — 关闭库](/zh/py/api/close-py)
- [自定义后端 — 注入自定义 FFI 实现](/zh/py/api/custom-backend-py)
