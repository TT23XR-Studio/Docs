# koss_enable_audit_debug 函数

**功能描述**：启用或禁用审核调试模式。  
**返回值**：无

## 函数签名

```c
void koss_enable_audit_debug(KossInstance* inst, bool enable);
```

## 参数

| 参数 | 类型 | 说明 |
|------|------|------|
| ***inst*** | ***KossInstance**** | JS 实例指针 |
| ***enable*** | ***bool*** | `true` 开启调试模式，`false` 关闭调试模式 |

## 说明

调试模式开启后，错误消息包含详细的拒绝原因和回调失败详情。生产环境应关闭调试模式，避免信息泄露。

> **注意（v0.1.0-dev.10）：** 审核链为同步执行，不存在"异步审核超时/取消"错误；`KossTimeoutError`/`KossCancelError` 仅作为内部占位辅助函数存在，实际运行时不会产生。

**调试模式效果**：

| 场景 | 调试模式关闭 | 调试模式开启 |
|------|-------------|-------------|
| 能力位拒绝 | `KossCapabilityError: Access denied` | `KossCapabilityError: capability denied for fs.readFile` |
| 审核回调拒绝 | `KossSecurityError: Access denied` | `KossSecurityError: sandbox audit denied for fs.readFile` |

## 使用示例

### C

```c
// 开启调试模式
koss_enable_audit_debug(inst, true);

// 执行代码 — 错误消息包含详细信息
koss_eval(inst, "require('fs').readFileSync('/etc/passwd')");

// 关闭调试模式（生产环境）
koss_enable_audit_debug(inst, false);
```

### Python

```python
from kossjs_interface import KossJS, JsError

koss = KossJS(capabilities=KossJS.KOSS_CAP_SANDBOX)

# 开启调试模式
koss.enable_audit_debug(True)

try:
    koss.eval("require('fs').readFileSync('/etc/passwd')")
except JsError as e:
    print(f"Error: {e}")  # 包含详细信息

# 关闭调试模式
koss.enable_audit_debug(False)
```

## 安全建议

- **生产环境**：始终关闭调试模式，避免敏感信息泄露
- **开发环境**：开启调试模式，便于排查问题
- **调试模式不影响安全性**：无论是否开启，API 调用都会被正确拒绝

## 相关 API

- [koss_set_audit_mask](/zh/api/functions/koss_set_audit_mask)
- [koss_get_audit_mask](/zh/api/functions/koss_get_audit_mask)
- [koss_check_sandbox](/zh/api/functions/koss_check_sandbox)
- [koss_get_capabilities](/zh/api/functions/koss_get_capabilities)
