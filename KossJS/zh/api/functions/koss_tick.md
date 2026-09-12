# koss_tick 函数

**功能描述**：运行事件循环的单次迭代，处理已完成的异步 I/O 操作。  
**返回值**：***KossResult*** 结构体。`value` 为 `"1"` 表示有未完成的异步操作，`"0"` 表示空闲。

## 函数签名

```c
KossResult koss_tick(KossInstance* inst);
```

## 参数

| 参数 | 类型 | 说明 |
|------|------|------|
| ***inst*** | ***KossInstance**** | JS 实例指针 |

## 说明

适用于需要手动控制事件循环的场景。每次调用处理一批已完成的 I/O 结果并执行微任务队列。通常配合 `koss_run_async` 或自定义事件循环使用。

## 使用示例

### C

```c
KossInstance* inst = koss_create();

// 发起异步请求
koss_eval(inst, "fetch('https://example.com/api').then(r => r.json())");

// 手动驱动事件循环
int max_ticks = 100;
for (int i = 0; i < max_ticks; i++) {
    KossResult result = koss_tick(inst);
    if (strcmp(result.value, "0") == 0) break;  // 空闲，退出
    koss_free_result(result);
    usleep(1000);
}

koss_destroy(inst);
```

### Python

```python
from kossjs_interface import KossJS

koss = KossJS()
koss.eval("fetch('https://example.com/api').then(r => r.json())")

# 手动驱动事件循环
while koss.tick():
    pass  # 持续处理直到空闲
```
