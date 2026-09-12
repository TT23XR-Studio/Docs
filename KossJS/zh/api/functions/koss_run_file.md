# koss_run_file 函数

**功能描述**：执行 JavaScript 文件。  
**返回值**：***KossResult*** 结构体。

## 函数签名

```c
KossResult koss_run_file(KossInstance* inst, const char* path);
```

## 参数

| 参数 | 类型 | 说明 |
|------|------|------|
| ***inst*** | ***KossInstance**** | JS 实例指针 |
| ***path*** | ***const char**** | JavaScript 文件路径 |

## 说明

读取并执行指定的 JavaScript 文件，返回最后一个表达式的结果。

## 使用示例

```c
KossInstance* inst = koss_create();
KossResult result = koss_run_file(inst, "./script.js");
if (result.code == 0) {
    printf("Result: %s\n", result.value);
    koss_free_result(result);
}
koss_destroy(inst);
```
