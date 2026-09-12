# koss_run_async 函数

**功能描述**：执行 JavaScript 代码并驱动异步事件循环，直到 Promise 完成或超时。  
**返回值**：***KossResult*** 结构体。

## 函数签名

```c
KossResult koss_run_async(KossInstance* inst, const char* code, uint64_t timeout_ms);
```

## 参数

| 参数 | 类型 | 说明 |
|------|------|------|
| ***inst*** | ***KossInstance**** | JS 实例指针 |
| ***code*** | ***const char**** | JavaScript 代码字符串 |
| ***timeout_ms*** | ***uint64_t*** | 超时时间（毫秒） |

## 说明

与 `koss_eval` 不同，`koss_run_async` 会驱动 tokio 事件循环直到代码中的 Promise 完成。适合执行包含 `await`/`async` 的代码（如 `fetch()`）。

## 使用示例

### C

```c
KossInstance* inst = koss_create();

const char* code = 
    "(async () => {"
    "  const r = await fetch('https://api.github.com/users/github');"
    "  const d = await r.json();"
    "  return d.login;"
    "})();";

KossResult result = koss_run_async(inst, code, 30000);
if (result.code == 0) {
    printf("Result: %s\n", result.value);
}
koss_free_result(result);
koss_destroy(inst);
```

### Python

```python
from kossjs_interface import KossJS

koss = KossJS()
result = koss.run_async("""
(async () => {
    const r = await fetch('https://api.github.com/users/github');
    const d = await r.json();
    return d.login;
})();
""", timeout_ms=30000)
print(result)
```
