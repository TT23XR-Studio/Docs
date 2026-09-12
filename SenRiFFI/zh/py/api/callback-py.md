# callback（Python）

`callback()` 函数将 Python 函数封装为 C 函数指针，可以传递给 C 库作为回调。

## 导入

```python
from senri_ffi import callback, types
```

## 签名

```python
def callback(
    ret_type: Any,        # 返回值类型
    arg_types: list[Any], # 参数类型列表
    fn: Callable,         # Python 回调函数
    options: Any = None,  # 可选配置（后端特定）
) -> Pointer
```

### 参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `ret_type` | 类型描述符 | 回调的返回值类型 |
| `arg_types` | 类型描述符列表 | 回调的参数类型列表 |
| `fn` | `Callable` | Python 函数 |
| `options` | `Any` | 可选配置（后端特定） |

### 返回值

返回 `Pointer` 实例，其 `address` 属性指向 C 回调的函数指针。

## 自动垃圾回收

SenRi FFI 使用 `weakref.WeakValueDictionary` 自动管理回调生命周期：

```python
cb = callback(
    types.int32,
    [types.int32, types.int32],
    lambda a, b: a + b
)

# 当 cb 被垃圾回收时，自动调用 adapter.unregister_callback()
# 无需手动释放
```

**各后端实现**:

| 后端 | 回调创建 | 回调释放 |
|------|---------|---------|
| ctypes | `ctypes.CFUNCTYPE(ret, *args)(func)` | GC 时自动释放 |
| cffi | `ffi.callback(ret_type, arg_types, func)` | GC 时自动释放 |

## 示例

### qsort 排序

```python
from senri_ffi import Library, callback, types, alloc, pointer
import platform

libc = Library.load(
    "msvcrt.dll" if platform.system() == "Windows" else "libc.so.6"
)

# 定义比较回调
compare = callback(
    types.int32,
    [pointer(types.int32), pointer(types.int32)],
    lambda a, b: a.read_int32(0) - b.read_int32(0)
)

# 准备数据
arr = alloc(16)
arr.write_int32(0, 3)
arr.write_int32(4, 1)
arr.write_int32(8, 4)
arr.write_int32(12, 2)

# 调用 qsort
qsort = libc.func("qsort", types.void, [
    types.pointer, types.uint64, types.uint64, types.pointer
])

qsort(arr.address, 4, 4, compare.address)

# 读取排序结果
print(arr.read_int32(0))   # 1
print(arr.read_int32(4))   # 2
print(arr.read_int32(8))   # 3
print(arr.read_int32(12))  # 4
```

### 事件回调

```python
from senri_ffi import callback, types, Library

lib = Library.load("my_event_lib.so")

# 创建事件处理回调
handler = callback(
    types.void,
    [types.int32, types.cstring],
    lambda event_id, message: print(f"Event {event_id}: {message}")
)

# 注册回调到 C 库
register = lib.func("register_handler", types.void, [types.pointer])
register(handler.address)

# 保持引用防止 GC
import gc
gc.keep_alive(handler)
```

## 注意事项

### 保持引用

由于回调在 GC 时自动释放，**如果你的回调需要长期存活，务必保持对其的引用**：

```python
import gc

# 正确：保持引用
persistent_cb = callback(
    types.void, [types.int32],
    lambda x: print(x)
)
gc.keep_alive(persistent_cb)

# 错误：回调可能随时被 GC
some_lib.register_callback(
    callback(types.void, [types.int32], lambda x: print(x)).address
)
```

### 错误处理

| 场景 | 错误类型 | 消息 |
|------|---------|------|
| 后端未初始化 | `FFIError` | `'Adapter not initialized'` |
| `fn` 不可调用 | `FFIError` | `'callback requires a callable'` |

### 回调中的异常

Python 回调函数中抛出的异常会向上传播到 C 层，行为可能不同。建议在回调中自行捕获异常。

## 与 JavaScript 版的对照

| 特性 | JavaScript 版 | Python 版 |
|------|--------------|-----------|
| 创建 | `callback(ret, args, fn)` | `callback(ret, args, fn)` |
| 获取地址 | `cb.address` | `cb.address` |
| 自动释放 | `FinalizationRegistry` | `weakref.WeakValueDictionary` |
| 保持引用 | 赋值给变量/全局 | `gc.keep_alive(cb)` |
