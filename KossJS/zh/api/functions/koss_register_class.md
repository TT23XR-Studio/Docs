# koss_register_class 函数

**功能描述**：注册一个支持 `new` 关键字的 JavaScript 类，方法由原生函数回调实现。  
**返回值**：***KossResult*** 结构体。

## 函数签名

```c
KossResult koss_register_class(KossInstance* inst, const char* class_name,
                                const char* methods_json, KossNativeFn callback);
```

## 参数

| 参数 | 类型 | 说明 |
|------|------|------|
| ***inst*** | ***KossInstance**** | JS 实例指针 |
| ***class_name*** | ***const char**** | JS 类名 |
| ***methods_json*** | ***const char**** | 方法名 JSON 数组，如 `["method1","method2"]` |
| ***callback*** | ***KossNativeFn*** | 方法分发回调函数 |

## 回调参数

回调函数接收 `(method_name, ...args)`：
- 第一个参数始终是方法名字符串
- 后续参数是调用时传入的参数

## 使用示例

### C

```c
char* class_callback(int argc, const char** argv) {
    if (argc < 1) return NULL;
    
    const char* method = argv[0];
    if (strcmp(method, "greet") == 0) {
        const char* name = argc > 1 ? argv[1] : "World";
        char* result = malloc(64);
        sprintf(result, "Hello, %s!", name);
        return result;
    }
    return NULL;
}

KossInstance* inst = koss_create();
koss_register_class(inst, "Greeter", "[\"greet\"]", class_callback);

KossResult result = koss_eval(inst, "const g = new Greeter(); g.greet('KossJS')");
printf("%s\n", result.value);  // 输出: Hello, KossJS!
koss_free_result(result);
koss_destroy(inst);
```

### Python

```python
from kossjs_interface import KossJS

def greet(name="World"):
    return f"Hello, {name}!"

koss = KossJS()
koss.register_class("Greeter", {"greet": greet})
result = koss.eval("const g = new Greeter(); g.greet('KossJS')")
print(result)  # 输出: Hello, KossJS!
```
