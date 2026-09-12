# koss_run_module 函数

**功能描述**：以 ES Module 方式执行 JavaScript 文件。  
**返回值**：***KossResult*** 结构体。

## 函数签名

```c
KossResult koss_run_module(KossInstance* inst, const char* path);
```

## 参数

| 参数 | 类型 | 说明 |
|------|------|------|
| ***inst*** | ***KossInstance**** | JS 实例指针 |
| ***path*** | ***const char**** | ES Module 文件路径 |

## 说明

以 ES Module 方式执行 JavaScript 文件，支持 ***import***/***export*** 语法。

实例应使用 ***koss_create_with_modules*** 创建。

## 使用示例

```c
KossInstance* inst = koss_create_with_modules(".");

KossResult result = koss_run_module(inst, "./module.mjs");
if (result.code == 0) {
    printf("Result: %s\n", result.value);
    koss_free_result(result);
}
koss_destroy(inst);
```
