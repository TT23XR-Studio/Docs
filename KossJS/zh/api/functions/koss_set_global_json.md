# koss_set_global_json 函数

**功能描述**：在 JS 上下文中设置全局 JSON 对象或数组。  
**返回值**：***KossResult*** 结构体。

## 函数签名

```c
KossResult koss_set_global_json(KossInstance* inst, const char* name, const char* json_str);
```

## 参数

| 参数 | 类型 | 说明 |
|------|------|------|
| ***inst*** | ***KossInstance**** | JS 实例指针 |
| ***name*** | ***const char**** | 变量名 |
| ***json_str*** | ***const char**** | JSON 字符串 |

## 说明

将 JSON 字符串解析为 JavaScript 对象或数组后注入到全局作用域。支持嵌套对象和数组。

## 使用示例

### C

```c
KossInstance* inst = koss_create();

koss_set_global_json(inst, "config", "{\"debug\":true,\"port\":8080}");
KossResult result = koss_eval(inst, "config.port");
printf("%s\n", result.value);  // 输出: 8080
koss_free_result(result);

// 数组
koss_set_global_json(inst, "items", "[1, 2, 3, 4]");
result = koss_eval(inst, "items.length");
printf("%s\n", result.value);  // 输出: 4
koss_free_result(result);

koss_destroy(inst);
```

### Python

```python
from kossjs_interface import KossJS

koss = KossJS()
koss.set_global("config", {"debug": True, "port": 8080})
result = koss.eval("config.port")
print(result)  # 输出: 8080

koss.set_global("items", [1, 2, 3, 4])
result = koss.eval("items.length")
print(result)  # 输出: 4
```
