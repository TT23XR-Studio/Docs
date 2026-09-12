# 回调用法示例（Python）

本页展示如何使用 SenRi FFI Python 版创建 C 回调函数。

---

## 1. 基本回调创建

```python
from senri_ffi import callback, types

# 创建回调：int32 (int32, int32)
add = callback(
    types.int32,
    [types.int32, types.int32],
    lambda a, b: a + b
)

# add 是一个 Pointer 实例
print(add.address)  # 回调函数的地址
```

---

## 2. 传递给 C 函数 — qsort 排序

```python
from senri_ffi import Library, callback, types, alloc, pointer
import platform

libc = Library.load(
    "msvcrt.dll" if platform.system() == "Windows" else "libc.so.6"
)

# qsort 比较回调：int compare(const void*, const void*)
compare = callback(
    types.int32,
    [pointer(types.int32), pointer(types.int32)],
    lambda a, b: a.read_int32(0) - b.read_int32(0)
)

# 准备未排序的数组
arr = alloc(20)  # 5 个 int32
arr.write_int32(0, 42)
arr.write_int32(4, 7)
arr.write_int32(8, 99)
arr.write_int32(12, 1)
arr.write_int32(16, 33)

# 绑定 qsort
qsort = libc.func("qsort", types.void, [
    types.pointer,  # void* base
    types.uint64,   # size_t count
    types.uint64,   # size_t size
    types.pointer,  # 比较函数指针
])

# 调用 qsort（传入回调地址）
qsort(arr.address, 5, 4, compare.address)

# 验证排序结果
print(arr.read_int32(0))   # 1
print(arr.read_int32(4))   # 7
print(arr.read_int32(8))   # 33
print(arr.read_int32(12))  # 42
print(arr.read_int32(16))  # 99
```

---

## 3. 事件/通知回调

```python
from senri_ffi import callback, types, Library
import gc

# 模拟注册一个事件库
lib = Library.load("my_event_lib.so")

# 回调: void onEvent(int32 eventType, const char* message)
event_handler = callback(
    types.void,
    [types.int32, types.cstring],
    lambda event_type, message: print(f"[Event {event_type}]: {message}")
)

# 注册回调到 C 库
register = lib.func("register_callback", types.void, [types.pointer])
register(event_handler.address)

# 保持引用防止 GC
gc.keep_alive(event_handler)

# 稍后取消注册...
# unregister = lib.func("unregister_callback", types.void, [])
# unregister()
```

---

## 4. 回调链

```python
from senri_ffi import callback, types, alloc

# 创建多个回调
cb1 = callback(
    types.int32,
    [types.int32],
    lambda x: x + 1
)

cb2 = callback(
    types.int32,
    [types.int32],
    lambda x: x * 2
)

# 在内存中构建回调指针数组
callback_array = alloc(16)  # 两个指针
callback_array.write_pointer(0, cb1)
callback_array.write_pointer(8, cb2)

# callback_array 可以传给接受函数指针数组的 C 函数
```

---

## 5. 保持回调存活 — GC 注意事项

```python
from senri_ffi import callback, types
import gc

# SenRi FFI 使用 weakref 自动释放回调
# 如果你的回调需要长期存活，必须保持 Python 引用

# 方式一：gc.keep_alive
persistent_cb = callback(
    types.int32,
    [types.int32, types.int32],
    lambda a, b: a * b
)
gc.keep_alive(persistent_cb)

# 方式二：模块级变量
_timer_callback = None

def start_timer(interval_ms):
    global _timer_callback
    _timer_callback = callback(
        types.void,
        [types.pointer],
        lambda data: print("Timer tick")
    )
    # 注册到 C 定时器库...

def stop_timer():
    global _timer_callback
    _timer_callback = None  # 允许 GC 回收
```

---

## 6. 错误处理

```python
from senri_ffi import callback, types, FFIError

try:
    # 正确的回调创建
    cb = callback(
        types.int32,
        [types.int32, types.int32],
        lambda a, b: a + b
    )
    print("回调创建成功")
except FFIError as e:
    print(f"创建回调失败: {e}")

try:
    # 错误：传入不可调用对象
    callback(types.void, [], "not a function")
except FFIError as e:
    print(e)  # "callback requires a callable"
```
