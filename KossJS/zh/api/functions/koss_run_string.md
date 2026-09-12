# koss_run_string 函数

**功能描述**：执行 JavaScript 代码字符串（与 ***koss_eval*** 相同）。  
**返回值**：***KossResult*** 结构体。

## 函数签名

```c
KossResult koss_run_string(KossInstance* inst, const char* code);
```

## 参数

| 参数 | 类型 | 说明 |
|------|------|------|
| ***inst*** | ***KossInstance**** | JS 实例指针 |
| ***code*** | ***const char**** | JavaScript 代码字符串 |

## 说明

与 ***koss_eval*** 功能相同，都是执行 JavaScript 代码。

## 使用示例

```c
KossInstance* inst = koss_create();
KossResult result = koss_run_string(inst, "console.log('Hello')");
koss_free_result(result);
koss_destroy(inst);
```
