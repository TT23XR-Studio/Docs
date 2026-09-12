# koss_free_string 函数

**功能描述**：释放由 KossJS 分配的字符串内存。  
**返回值**：无

## 函数签名

```c
void koss_free_string(char* s);
```

## 参数

| 参数 | 类型 | 说明 |
|------|------|------|
| ***s*** | ***char**** | 字符串指针 |

## 说明

释放 ***koss_result.value*** 或原生函数返回的字符串。注意：此函数使用 ***free()*** 释放内存。

## 使用示例

```c
KossInstance* inst = koss_create();
KossResult result = koss_eval(inst, "1 + 2");
printf("Result: %s\n", result.value);
koss_free_string(result.value);  // 单独释放 value

koss_destroy(inst);
```
