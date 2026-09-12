# closeAsync — 异步关闭库（Python）

`await lib.closeAsync()` 异步关闭库句柄，通过线程池执行同步关闭操作，避免阻塞事件循环。

## 语法

```python
await lib.closeAsync()
```

### 返回值

`None` — 无返回值。

## 实现方式

`closeAsync()` 内部调用 `asyncio.to_thread(self.close)`，将同步的 `close()` 方法放到线程池中执行。

关闭操作包括：
1. 释放库句柄（`adapter.close_library()`）
2. 清除函数缓存（`_func_cache` 和 `_async_cache`）
3. 标记库为已关闭状态

## 使用示例

### 基础用法

```python
import asyncio
from senri_ffi import Library, types

lib = Library.load("mylib.dll")

async def main():
    # 使用异步函数
    add = lib.funcAsync("add_int", types.int32, [types.int32, types.int32])
    result = await add(10, 20)
    print(result)

    # 异步关闭 — 不阻塞事件循环
    await lib.closeAsync()
    print("Library fully closed")

asyncio.run(main())
```

### 与 close() 的对比

```python
import asyncio
from senri_ffi import Library, types

async def main():
    lib = Library.load("mylib.dll")
    add = lib.funcAsync("add_int", types.int32, [types.int32, types.int32])
    await add(1, 2)

    # 方式一：同步关闭（会阻塞事件循环）
    lib.close()

    # 方式二：异步关闭（推荐，不阻塞事件循环）
    lib2 = Library.load("mylib.dll")
    await lib2.closeAsync()

asyncio.run(main())
```

## 与 `close()` 的区别

|          | `close()`                           | `closeAsync()`                 |
| -------- | ----------------------------------- | ------------------------------ |
| 调用方式 | 同步                                | `await` 异步                   |
| 阻塞行为 | 阻塞当前线程                        | 不阻塞事件循环（在线程池执行） |
| 幂等     | 是                                  | 是                             |
| 缓存清理 | 清除 `_func_cache` + `_async_cache` | 同左                           |

> [!WARNING]
> 如果你使用了 `funcAsync()`，**必须**使用 `closeAsync()` 而非 `close()`。直接调用 `close()` 可能导致线程池中仍有任务在执行时释放资源。

## 注意事项

- `closeAsync()` 可以安全地多次调用（幂等），第二次调用会直接返回
- 调用 `closeAsync()` 后，库实例将不可再用于绑定或调用函数
- 重复调用不会抛出异常

---

**相关文档**:
- [funcAsync() — 异步函数绑定](funcAsync-py)
- [close() — 同步关闭库](close)
- [Library.load()](library)
