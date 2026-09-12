# koss_register_module_loader 函数

**功能描述**：注册模块加载器函数，用于 ***require()*** 加载模块。  
**返回值**：***KossResult*** 结构体。

## 函数签名

```c
KossResult koss_register_module_loader(KossInstance* inst, KossNativeFn loader_fn);
```

## 参数

| 参数 | 类型 | 说明 |
|------|------|------|
| ***inst*** | ***KossInstance**** | JS 实例指针 |
| ***loader_fn*** | ***KossNativeFn*** | 模块加载函数 |

## 说明

注册自定义模块加载器。当 JS 中调用 ***require()*** 时，会调用此函数加载模块。

加载函数应返回 JSON 格式：
```json
{"type": "module", "code": "..."}
```
或直接返回模块代码字符串。

## 使用示例

```c
char* module_loader(int argc, const char** argv) {
    if (argc < 1) return NULL;
    
    const char* module_path = argv[0];
    // 根据 module_path 加载模块代码
    const char* code = "module.exports = { hello: () => 'world' };";
    
    return strdup(code);
}

KossInstance* inst = koss_create();
koss_register_module_loader(inst, module_loader);

KossResult result = koss_eval(inst, "require('./myModule').hello()");
printf("%s\n", result.value);  // 输出: world
koss_free_result(result);

koss_destroy(inst);
```
