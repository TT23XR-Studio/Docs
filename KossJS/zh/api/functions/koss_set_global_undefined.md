# koss_set_global_undefined 函数

**功能描述**：在 JS 上下文中设置全局 `undefined` 变量。  
**返回值**：***KossResult*** 结构体。

## 函数签名

```c
KossResult koss_set_global_undefined(KossInstance* inst, const char* name);
```

## 参数

| 参数 | 类型 | 说明 |
|------|------|------|
| ***inst*** | ***KossInstance**** | JS 实例指针 |
| ***name*** | ***const char**** | 变量名 |

## 使用示例

### C

```c
KossInstance* inst = koss_create();

koss_set_global_undefined(inst, "notSet");
KossResult result = koss_eval(inst, "typeof notSet");
printf("%s\n", result.value);  // 输出: undefined
koss_free_result(result);

koss_destroy(inst);
```

### Python

```python
from kossjs_interface import KossJS

koss = KossJS()
koss.set_global("notSet", "__undefined__")
result = koss.eval("typeof notSet")
print(result)  # 输出: undefined
```
