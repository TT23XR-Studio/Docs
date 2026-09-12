# koss_register_function 函数

**功能描述**：注册一个可从 JavaScript 调用的原生函数。  
**返回值**：***KossResult*** 结构体。

## 函数签名

```c
typedef char* (*KossNativeFn)(int argc, const char **argv);

KossResult koss_register_function(KossInstance* inst, const char* name, KossNativeFn func);
```

## 参数

| 参数 | 类型 | 说明 |
|------|------|------|
| ***inst*** | ***KossInstance**** | JS 实例指针 |
| ***name*** | ***const char**** | 函数名 |
| ***func*** | ***KossNativeFn*** | 原生函数指针 |

## KossNativeFn 回调类型

```c
typedef char* (*KossNativeFn)(int argc, const char **argv);
```

- ***argc***: 参数数量
- ***argv***: 参数数组（ C 字符串）
- 返回值: 堆分配的 C 字符串（返回 NULL 表示 undefined）

## 使用示例

### C

```c
char* my_add(int argc, const char** argv) {
    if (argc < 2) return strdup("0");
    int a = atoi(argv[0]);
    int b = atoi(argv[1]);
    char* result = malloc(16);
    sprintf(result, "%d", a + b);
    return result;
}

KossInstance* inst = koss_create();
koss_register_function(inst, "add", my_add);

KossResult result = koss_eval(inst, "add(10, 20)");
printf("%s\n", result.value);  // 输出: 30
koss_free_result(result);

koss_destroy(inst);
```

### Python

```python
from kossjs_interface import KossJS

def add(a, b):
    return str(int(a) + int(b))

koss = KossJS()
koss.register_function("add", add)
result = koss.eval("add(10, 20)")
print(result)  # 输出: 30
koss.destroy()
```
