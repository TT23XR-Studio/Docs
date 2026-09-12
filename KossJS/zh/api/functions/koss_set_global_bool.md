# koss_set_global_bool 函数

**功能描述**：在 JS 上下文中设置全局布尔变量。  
**返回值**：***KossResult*** 结构体。

## 函数签名

```c
KossResult koss_set_global_bool(KossInstance* inst, const char* name, bool value);
```

## 参数

| 参数 | 类型 | 说明 |
|------|------|------|
| ***inst*** | ***KossInstance**** | JS 实例指针 |
| ***name*** | ***const char**** | 变量名 |
| ***value*** | ***bool*** | 布尔值 |

## 使用示例

```c
KossInstance* inst = koss_create();

koss_set_global_bool(inst, "isReady", true);
KossResult result = koss_eval(inst, "isReady ? 'Ready!' : 'Loading...'");
printf("%s\n", result.value);  // 输出: Ready!
koss_free_result(result);

koss_destroy(inst);
```

```python
from kossjs_interface import KossJS

koss = KossJS()
koss.set_global("isReady", True)
result = koss.eval("isReady ? 'Ready!' : 'Loading...'")
print(result)  # 输出: Ready!
koss.destroy()
```
