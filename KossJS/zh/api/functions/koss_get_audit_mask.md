# koss_get_audit_mask 函数

**功能描述**：获取当前审核掩码。  
**返回值**：`uint32_t` — 当前审核掩码。

## 函数签名

```c
uint32_t koss_get_audit_mask(KossInstance* inst);
```

## 参数

| 参数 | 类型 | 说明 |
|------|------|------|
| ***inst*** | ***KossInstance**** | JS 实例指针 |

## 说明

返回当前实例的审核掩码。审核掩码控制哪些 API 需要经过审核回调。默认值为 `0`（不审核任何 API）。

详见 [安全与沙箱指南 - 审核掩码](/zh/security-sandbox/security-sandbox#三审核掩码)。

## 使用示例

### C

```c
// 设置审核掩码
koss_set_audit_mask(inst, FS_READ | NET_FETCH);

// 获取当前审核掩码
uint32_t mask = koss_get_audit_mask(inst);
printf("Audit mask: 0x%08x\n", mask);

// 检查是否审核特定操作
if (mask & FS_READ) {
    printf("fs.readFile will be audited\n");
}
```

### Python

```python
from kossjs_interface import KossJS

koss = KossJS()
koss.set_audit_mask(KossJS.FS_READ | KossJS.NET_FETCH)

mask = koss.get_audit_mask()
print(f"Audit mask: {mask:#010x}")
```

## 相关 API

- [koss_set_audit_mask](/zh/api/functions/koss_set_audit_mask)
- [koss_check_sandbox](/zh/api/functions/koss_check_sandbox)
- [koss_get_capabilities](/zh/api/functions/koss_get_capabilities)
