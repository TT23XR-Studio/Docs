# closeAsync — 异步关闭库

异步关闭库句柄，等待所有异步任务和 Worker 完成后释放资源。

## 签名

```ts
await lib.closeAsync();  // JavaScript/Typescript
```

```python
lib.close()      # Python
```


## 与 close() 的区别 (JavaScript)

| | `close()` | `closeAsync()` |
|--|----------|---------------|
| 调用方式 | 同步 | `await` 异步 |
| 等待异步任务 | 否 | 是 |
| Worker 清理 | 否 | 是 |

## 注意事项 (JavaScript)

- `closeAsync()` 可以安全地多次调用（幂等），第二次调用会直接返回
- 调用 `closeAsync()` 后，库实例将不可再用于绑定或调用函数
- 重复调用不会抛出异常

## 与 `close()` 的区别 (Python)

|          | `close()`                           | `closeAsync()`                 |
| -------- | ----------------------------------- | ------------------------------ |
| 调用方式 | 同步                                | `await` 异步                   |
| 阻塞行为 | 阻塞当前线程                        | 不阻塞事件循环（在线程池执行） |
| 幂等     | 是                                  | 是                             |
| 缓存清理 | 清除 `_func_cache` + `_async_cache` | 同左                           |

## 注意事项 (Python)

- `closeAsync()` 可以安全地多次调用（幂等），第二次调用会直接返回

- 调用 `closeAsync()` 后，库实例将不可再用于绑定或调用函数

- 重复调用不会抛出异常

---

**详细文档**:
- [closeAsync() (JavaScript)](/zh/js/api/closeAsync-js)
- [closeAsync() (Python)](/zh/py/api/closeAsync-py)
