# koss_set_audit_mask 函数

**功能描述**：设置审核掩码，控制哪些 API 需要经过审核回调。  
**返回值**：`KossResult` — 成功返回 `code=0`。

## 函数签名

```c
KossResult koss_set_audit_mask(KossInstance* inst, uint32_t mask);
```

## 参数

| 参数 | 类型 | 说明 |
|------|------|------|
| ***inst*** | ***KossInstance**** | JS 实例指针 |
| ***mask*** | ***uint32_t*** | 审核掩码（使用与能力位相同的位定义） |

## 说明

审核掩码是 **动态审核策略声明**，与能力位掩码使用相同的位定义，但语义不同：

- **能力位掩码**：控制"是否允许"（静态权限）
- **审核掩码**：控制"是否需要审核"（动态策略）

**默认审核掩码**：`0`（不审核任何 API）。宿主必须显式设置审核掩码，才能启用审核回调。

审核掩码只能设置在能力位掩码已授予的位上。若审核掩码包含了能力位掩码未授予的位，这些位将被视为无效（忽略，不会报错）。

详见 [安全与沙箱指南 - 审核掩码](/zh/security-sandbox/security-sandbox#三审核掩码)。

## 使用示例

### C

```c
// 只审核文件系统读取操作
koss_set_audit_mask(inst, FS_READ);

// 审核所有文件系统操作
koss_set_audit_mask(inst, KOSS_CAP_ALL_FS);

// 审核高风险 API（FFI + 动态代码）
koss_set_audit_mask(inst, FFI_OPEN | FFI_CALL | DYNAMIC_CODE);

// 审核所有已启用的 API
koss_set_audit_mask(inst, KOSS_CAP_ALL);

// 不审核任何 API（直接放行）
koss_set_audit_mask(inst, 0);
```

### Python

```python
from kossjs_interface import KossJS

koss = KossJS(capabilities=KossJS.KOSS_CAP_ALL_FS | KossJS.KOSS_CAP_ALL_NET)

# 设置审核掩码
koss.set_audit_mask(KossJS.FS_READ | KossJS.NET_FETCH)

# 审核所有文件系统操作
koss.set_audit_mask(KossJS.KOSS_CAP_ALL_FS)

# 不审核任何 API
koss.set_audit_mask(0)
```

## 相关 API

- [koss_get_audit_mask](/zh/api/functions/koss_get_audit_mask)
- [koss_check_sandbox](/zh/api/functions/koss_check_sandbox)
- [koss_enable_audit_debug](/zh/api/functions/koss_enable_audit_debug)
- [koss_get_capabilities](/zh/api/functions/koss_get_capabilities)
