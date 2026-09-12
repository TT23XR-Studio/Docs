# close — 关闭库（Python）

`lib.close()` 关闭库句柄并释放资源。

## 语法

```python
lib.close()
```

### 返回值

`None` — 无返回值。

## 行为

- 清空函数缓存（`_func_cache.clear()`）
- 释放库句柄（取决于后端实现）
- 设置 `_closed = True`
- 重复调用不报错（幂等）

## 各后端实现

| 后端 | 实现 |
|------|------|
| cffi | 无显式关闭（cffi 自动管理） |
| ctypes (Windows) | `ctypes.windll.kernel32.FreeLibrary(handle)` |
| ctypes (其他) | 无显式关闭 |

## 使用示例

```python
from senri_ffi import Library, types
import platform

lib = Library.load(
    "libSystem.B.dylib" if platform.system() == "Darwin" else "libm.so.6"
)

sqrt = lib.func("sqrt", types.float64, [types.float64])
print(sqrt(4.0))  # 2.0

lib.close()

# 关闭后调用 func() 会抛出 FFIError
# lib.func("abs", types.int32, [types.int32])  # → "Library is closed"
```

## 检查是否已关闭

```python
try:
    lib.func("abs", types.int32, [types.int32])
except FFIError:
    print("Library is closed")
```

---

**相关文档**:
- [Library.load()](/zh/py/api/library-py)
- [func() — 同步函数绑定](/zh/py/api/func-py)
