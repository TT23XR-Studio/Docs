# koss_create_with_modules_and_caps 函数

**功能描述**：创建支持模块加载、能力掩码和稳定模式的 JS 实例。  
**返回值**：成功返回实例指针，失败返回 NULL。

## 函数签名

```c
KossInstance* koss_create_with_modules_and_caps(const char* root_dir, uint32_t caps, bool stable);
```

## 参数

| 参数 | 类型 | 说明 |
|------|------|------|
| ***root_dir*** | ***const char**** | 模块解析的根目录 |
| ***caps*** | ***uint32_t*** | 能力位掩码（见 KossCapability） |
| ***stable*** | ***bool*** | 稳定模式。`true`（默认）禁用 FFI；`false` 启用 FFI |

## 说明

组合了模块加载、能力位掩码和稳定模式的功能。既启用 ES Module 解析，又支持能力位掩码精确控制沙箱权限。

`stable` 参数控制是否启用 FFI 等不稳定功能：
- `stable=true`（推荐）：自动剥离 FFI 能力位，生产环境使用
- `stable=false`：启用 FFI，开发/调试用

详见 [安全与沙箱指南](/zh/security-sandbox/security-sandbox)。

## 使用示例

### C

```c
// 模块 + 沙箱：允许 require() 内嵌模块但禁止 FS/NET
KossInstance* inst = koss_create_with_modules_and_caps(".", KOSS_CAP_SANDBOX, true);
koss_run_module(inst, "./app.mjs");
koss_destroy(inst);

// 模块 + 网络 + 加密
KossInstance* inst2 = koss_create_with_modules_and_caps(
    ".", KOSS_CAP_ALL_NET | KOSS_CAP_ALL_CRYPTO, true);

// 模块 + 全部能力 + 开发模式
KossInstance* inst3 = koss_create_with_modules_and_caps(".", KOSS_CAP_ALL, false);
```

### Python

```python
from kossjs_interface import KossJS

# 沙箱模式
koss = KossJS(
    with_modules=True,
    root_dir="./modules",
    capabilities=KossJS.KOSS_CAP_ALL_NET
)

# 开发模式（启用 FFI）
koss2 = KossJS(
    with_modules=True,
    root_dir="./modules",
    capabilities=KossJS.KOSS_CAP_ALL,
    stable=False
)
```

## 相关 API

- [koss_create_with_caps](/zh/api/functions/koss_create_with_caps)
- [koss_create_with_modules](/zh/api/functions/koss_create_with_modules)
- [koss_is_stable](/zh/api/functions/koss_is_stable)
- [koss_get_capabilities](/zh/api/functions/koss_get_capabilities)
