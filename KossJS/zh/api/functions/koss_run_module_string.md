# koss_run_module_string 函数

**功能描述**：以 ES Module 方式执行 JavaScript 代码字符串。  
**返回值**：***KossResult*** 结构体。

## 函数签名

```c
KossResult koss_run_module_string(KossInstance* inst, const char* code);
```

## 参数

| 参数 | 类型 | 说明 |
|------|------|------|
| ***inst*** | ***KossInstance**** | JS 实例指针 |
| ***code*** | ***const char**** | ES Module 代码字符串 |

## 说明

以 ES Module 方式执行 JavaScript 代码字符串，支持 ***import***/***export*** 语法。

## 使用示例

```c
KossInstance* inst = koss_create_with_modules(".");
KossResult result = koss_run_module_string(inst, "export const a = 1;");
koss_free_result(result);
koss_destroy(inst);
```
