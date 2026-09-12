# koss_create 函数

**功能描述**：创建一个新的 JavaScript 实例（默认能力 `KOSS_CAP_SANDBOX`，stable=true）。  
**返回值**：成功返回实例指针，失败返回 NULL。

## 函数签名

```c
static inline KossInstance* koss_create(void);
```

## 参数

无

## 说明

创建一个新的完全隔离的 JavaScript 虚拟机实例。该实例拥有自己的全局环境，不与其他实例共享。

> **v0.1.0-dev.10 行为变更**：默认能力由 `KOSS_CAP_ALL` 改为 `KOSS_CAP_SANDBOX`（纯计算沙箱），不再自动授予文件系统/网络等系统能力。

此函数等价于 `koss_create_with_builtins(KOSS_CAP_SANDBOX, KOSS_BUILTIN_ALL, true)`：
- 能力位：`KOSS_CAP_SANDBOX`（0，无任何系统能力）
- 启用稳定模式（禁用 FFI）

如需授予能力，请使用 [koss_create_with_caps](/zh/api/functions/koss_create_with_caps) 显式传入 `KOSS_CAP_ALL`（或所需能力位）。

## 向后兼容性

此函数定义为 `static inline` 包装器，不占用动态库符号。旧版宿主代码无需重新编译即可使用。

## 使用示例

### C

```c
KossInstance* inst = koss_create();
if (!inst) {
    fprintf(stderr, "Failed to create instance\n");
    return 1;
}

KossResult result = koss_eval(inst, "1 + 2");
if (result.code == 0) {
    printf("Result: %s\n", result.value);
    koss_free_result(result);
}

koss_destroy(inst);
```

### Python

```python
from kossjs_interface import KossJS

koss = KossJS()  # 等价于 KossJS(capabilities=KossJS.KOSS_CAP_SANDBOX, stable=True)
print(koss.is_stable)  # True
koss.destroy()
```

## 相关 API

- [koss_create_with_caps](/zh/api/functions/koss_create_with_caps)
- [koss_create_with_modules](/zh/api/functions/koss_create_with_modules)
- [koss_destroy](/zh/api/functions/koss_destroy)
- [koss_is_stable](/zh/api/functions/koss_is_stable)
