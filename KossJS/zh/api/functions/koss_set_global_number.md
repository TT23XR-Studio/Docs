# koss_set_global_number 函数

**功能描述**：在 JS 上下文中设置全局数字变量。  
**返回值**：***KossResult*** 结构体。

## 函数签名

```c
KossResult koss_set_global_number(KossInstance* inst, const char* name, double value);
```

## 参数

| 参数 | 类型 | 说明 |
|------|------|------|
| ***inst*** | ***KossInstance**** | JS 实例指针 |
| ***name*** | ***const char**** | 变量名 |
| ***value*** | ***double*** | 数字值 |

## 使用示例

```c
KossInstance* inst = koss_create();

koss_set_global_number(inst, "count", 100.0);
KossResult result = koss_eval(inst, "count * 2");
printf("%s\n", result.value);  // 输出: 200
koss_free_result(result);

koss_destroy(inst);
```

```python
from kossjs_interface import KossJS

koss = KossJS()
koss.set_global("count", 100)
result = koss.eval("count * 2")
print(result)  # 输出: 200
koss.destroy()
```
