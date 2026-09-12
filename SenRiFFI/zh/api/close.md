# close — 同步关闭库

同步关闭库句柄并释放资源。

## 签名

```ts
lib.close();     // JavaScript/TypeScript
```

```python
lib.close()      # Python
```

## 行为

- 清空函数缓存
- 释放库句柄（取决于语言/运行时实现）
- 设置库为已关闭状态
- 重复调用不报错（幂等）

> [!WARNING]
> `close()` **不等待**异步任务完成。如果存在进行中的 `funcAsync` 任务，调用 `close()` 后这些任务可能继续访问已释放的内存。此时应使用 `closeAsync()`。

---

**详细文档**:
- [close() (JavaScript)](/zh/js/api/close-js)
- [close() (Python)](/zh/py/api/close-py)
