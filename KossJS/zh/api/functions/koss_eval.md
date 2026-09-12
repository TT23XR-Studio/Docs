# koss_eval 函数

**功能描述**：执行 JavaScript 代码并返回结果。  
**返回值**：***KossResult*** 结构体。

## 函数签名

```c
KossResult koss_eval(KossInstance* inst, const char* code);
```

## 参数

| 参数 | 类型 | 说明 |
|------|------|------|
| ***inst*** | ***KossInstance**** | JS 实例指针 |
| ***code*** | ***const char**** | JavaScript 代码字符串 |

## KossResult 结构体

```c
typedef struct {
    int code;       /* 0=ok, 1=js error, 2=bad argument */
    char *value;   /* heap string — free with koss_free_string */
} KossResult;
```

| code | 含义 |
|------|------|
| 0 | 成功，结果在 value 中 |
| 1 | JavaScript 执行错误，错误信息在 value 中 |
| 2 | 无效参数 |

## 使用示例

### C

```c
KossInstance* inst = koss_create();

KossResult result = koss_eval(inst, "1 + 2");
if (result.code == 0) {
    printf("Result: %s\n", result.value);  // 输出: 3
    koss_free_result(result);
} else if (result.code == 1) {
    fprintf(stderr, "JS Error: %s\n", result.value);
    koss_free_result(result);
}

koss_destroy(inst);
```

### Python

```python
from kossjs_interface import KossJS

koss = KossJS()
result = koss.eval("1 + 2")
print(result)  # 输出: 3
koss.destroy()
```
