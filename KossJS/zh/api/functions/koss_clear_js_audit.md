# koss_clear_js_audit 函数

> **v0.1.0-dev.10 新增**

**功能描述**：清除 JS 层审核回调（由 `KossJS.set_audit_callback` 注册）。  
**返回值**：`KossResult` — 成功返回 `code=0`。

## 函数签名

```c
KossResult koss_clear_js_audit(KossInstance* inst);
```

## 参数

| 参数 | 类型 | 说明 |
|------|------|------|
| ***inst*** | ***KossInstance**** | JS 实例指针 |

## 说明

清除后，匹配审核掩码的操作由宿主审核回调单独决策。若审核掩码 ≠ 0 且宿主回调也为 `NULL`，则掩码覆盖的操作会抛 `KossConfigError`（`Audit mask is set but no callback is registered`）。

JS 侧等效调用：

```javascript
KossJS.set_audit_callback(null);
```

关于 JS 层审核回调的完整语义（参数、返回值、安全边界），见 **[KossJS.set_audit_callback](/zh/api/globals/kossjs-set-audit-callback)** 与 [安全与沙箱指南 - JS 层审核回调](/zh/security-sandbox/security-sandbox#五js-层审核回调两级审核链)。

## 使用示例

### Python

```python
from kossjs_interface import KossJS

koss = KossJS(capabilities=KossJS.KOSS_CAP_ALL_FS)

# JS 侧注册审核回调（拒绝所有 fs 操作）
koss.eval("KossJS.set_audit_callback(function(t, a, p) { return false; })")

# 宿主清除 JS 层审核回调
koss.clear_js_audit()
```

### TypeScript

```typescript
import { KossJS } from './kossjs_interface';

const koss = new KossJS({ caps: KossJS.KOSS_CAP_ALL_FS });

koss.eval(`KossJS.set_audit_callback(function(t, a, p) { return false; })`);
koss.clearJsAudit();
```

## 相关 API

- [koss_check_sandbox](/zh/api/functions/koss_check_sandbox)
- [koss_set_audit_mask](/zh/api/functions/koss_set_audit_mask)
- [koss_get_audit_mask](/zh/api/functions/koss_get_audit_mask)
- [安全与沙箱指南](/zh/security-sandbox/security-sandbox)
