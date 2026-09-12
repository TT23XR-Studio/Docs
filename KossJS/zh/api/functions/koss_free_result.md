# koss_free_result 函数

**功能描述**：释放 KossResult 结构体中的字符串内存。  
**返回值**：无

## 函数签名

```c
void koss_free_result(KossResult result);
```

## 参数

| 参数 | 类型 | 说明 |
|------|------|------|
| ***result*** | ***KossResult*** | KossResult 结构体 |

## 说明

释放 KossResult 中的 value 字段。调用后 result.value 不再有效。

## 使用示例

```c
KossInstance* inst = koss_create();
KossResult result = koss_eval(inst, "1 + 2");
if (result.code == 0) {
    printf("Result: %s\n", result.value);
}
koss_free_result(result);  // 释放结果

koss_destroy(inst);
```
