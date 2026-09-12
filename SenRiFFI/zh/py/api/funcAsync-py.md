# funcAsync — 异步函数绑定（Python）

`lib.funcAsync(name, retType, argTypes)` 绑定一个 C 函数为**异步调用**，返回一个 Python async 函数。每次调用该函数返回协程。

## 语法

```python
async_fn = lib.funcAsync(name, retType, argTypes)
result = await async_fn(*args)
```

### 参数

| 参数       | 类型           | 必须 | 说明         |
| ---------- | -------------- | ---- | ------------ |
| `name`     | `str`          | 是   | C 函数名称   |
| `retType`  | 类型描述符     | 是   | 返回值类型   |
| `argTypes` | 类型描述符列表 | 是   | 参数类型列表 |

### 返回值

返回一个 **async 函数** `async_fn(*args) → Awaitable`。

## 实现方式

Python 的 `funcAsync` 通过 `asyncio.to_thread()` 将同步 FFI 调用放到线程池执行，避免阻塞事件循环。

底层的 C 函数绑定（`bind_function`）是同步完成的，只有实际调用时才在线程池中异步执行。

> [!NOTE]
> 由于 GIL 的存在，Python 的异步调用并非真正的并行执行，但可以避免阻塞事件循环，适合 I/O 密集型应用中夹带 FFI 调用的场景。

## 使用示例

### 基础异步调用

```python
import asyncio
from senri_ffi import Library, types

lib = Library.load(
    "msvcrt.dll" if __import__("platform").system() == "Windows" else "libc.so.6"
)

# 绑定异步函数
sleep = lib.funcAsync("sleep", types.uint32, [types.uint32])

async def main():
    # 调用 — 不阻塞事件循环
    print("Sleep started...")
    await sleep(3)
    print("Sleep done")

asyncio.run(main())
```

### 并行异步调用

```python
import asyncio
from senri_ffi import Library, types

lib = Library.load("mylib.dll")

heavy = lib.funcAsync("heavy_work", types.int32, [types.int32])

async def main():
    # 并行调用多个 FFI 函数
    results = await asyncio.gather(
        heavy(10),
        heavy(20),
        heavy(30),
    )
    print(results)  # (result1, result2, result3)

asyncio.run(main())
```

### 带错误处理

```python
import asyncio
from senri_ffi import Library, FFIError, types

lib = Library.load("mylib.dll")
read_file = lib.funcAsync("read_file", types.int32, [types.cstring])

async def main():
    try:
        fd = await read_file(b"/etc/passwd")
        print("File descriptor:", fd)
    except FFIError as e:
        print("FFI call failed:", e)

asyncio.run(main())
```

### 与 closeAsync 配合

```python
import asyncio
from senri_ffi import Library, types

lib = Library.load("mylib.dll")

async def main():
    add = lib.funcAsync("add_int", types.int32, [types.int32, types.int32])
    result = await add(10, 20)
    print(result)  # 30
    await lib.closeAsync()

asyncio.run(main())
```

## 与 `func()` 的区别

|          | `func()`      | `funcAsync()`                  |
| -------- | ------------- | ------------------------------ |
| 返回值   | 同步函数      | async 函数（协程）             |
| 阻塞行为 | 阻塞当前线程  | 不阻塞事件循环（在线程池执行） |
| 缓存     | `_func_cache` | `_async_cache`（独立缓存）     |
| 绑定速度 | 同步          | 同步（绑定本身不耗时）         |

## 限制

| 限制                      | 说明                                               |
| ------------------------- | -------------------------------------------------- |
| C 函数必须线程安全        | `asyncio.to_thread` 在线程池中执行，需保证线程安全 |
| struct 参数需转为指针传递 | 结构体实例需通过 `to_pointer()` 转换为内存指针     |
| GIL 限制                  | CPU 密集型 FFI 调用无法真正并行                    |

---

**相关文档**:
- [func() — 同步函数绑定](func)
- [closeAsync() — 异步关闭库](closeAsync-py)
- [Library.load()](library)
