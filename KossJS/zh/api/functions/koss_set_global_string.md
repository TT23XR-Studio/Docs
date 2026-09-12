# koss_set_global_string 函数

**功能描述**：在 JS 上下文中设置全局字符串变量。  
**返回值**：***KossResult*** 结构体。

## 函数签名

```c
KossResult koss_set_global_string(KossInstance* inst, const char* name, const char* value);
```

## 参数

| 参数 | 类型 | 说明 |
|------|------|------|
| ***inst*** | ***KossInstance**** | JS 实例指针 |
| ***name*** | ***const char**** | 变量名 |
| ***value*** | ***const char**** | 字符串值 |

## 使用示例

```c
KossInstance* inst = koss_create();

koss_set_global_string(inst, "myVar", "Hello World");
KossResult result = koss_eval(inst, "myVar");
printf("%s\n", result.value);  // 输出: Hello World
koss_free_result(result);

koss_destroy(inst);
```

```python
from kossjs_interface import KossJS

koss = KossJS()
koss.set_global("myVar", "Hello World")
result = koss.eval("myVar")
print(result)  # 输出: Hello World
koss.destroy()
```
