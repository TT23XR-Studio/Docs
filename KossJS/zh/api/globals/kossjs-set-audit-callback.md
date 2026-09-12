# KossJS.set_audit_callback 函数

> **v0.1.0-dev.10 新增。** `KossJS` 全局对象方法，用于注册/清除 **JS 层审核回调**（两级审核链的 JS 侧）。

## 概述

KossJS 的沙箱审核采用**两级审核链**：

1. **宿主审核回调**（`koss_check_sandbox` 注册）— 主闸门，由宿主（C/Python/TS）提供
2. **JS 层审核回调**（`KossJS.set_audit_callback` 注册）— 可选，在宿主放行后做**进一步限制**

JS 层审核回调让 JS 代码也能参与安全策略决策。它接收操作信息 `(target, args, pwd)` 并返回布尔值决定是否放行。

## 函数签名

```javascript
KossJS.set_audit_callback(fn);
```

## 参数

| 参数 | 类型 | 说明 |
|------|------|------|
| ***fn*** | `function \| null \| undefined` | JS 层审核回调函数，签名见下。传 `null` / `undefined` 清除已注册的回调 |

**回调函数签名：**

```javascript
function (target, args, pwd) {
    // 返回 true 放行，返回 false 拒绝
    return boolean;
}
```

## 返回值

| 场景 | 返回值 |
|------|--------|
| 成功注册或清除 | `true` |
| `fn` 非函数且非 `null`/`undefined` | 抛 `TypeError`（`KossJS.set_audit_callback: expected a function or null`） |

## 回调参数详解

| 参数 | 类型 | 说明 |
|------|------|------|
| `target` | `string` | 被审核操作的名称。细粒度操作为 `net.tcpConnect`、`ffi.func` 等；模块级操作（`internalBinding`）为模块名，如 `fs`、`net`、`crypto` |
| `args` | `string[]` | 操作的参数字符串数组 |
| `pwd` | `string \| null` | 当前执行模块的目录；`eval` / `run_string` 场景下为 `null` |

## 回调返回值语义

| 返回值 / 行为 | 结果 |
|---------------|------|
| `true` | 放行操作 |
| `false` | 拒绝操作，抛 `KossSecurityError` |
| 抛异常 | 拒绝操作（异常传播给调用方） |
| 回调重入（回调执行期间再次触发审核） | 直接拒绝，抛 `KossSecurityError`（防止死循环/绕过） |

## 安全语义

- **宿主回调是主闸门**：宿主返回 `false` → 直接拒绝，**JS 层不会被调用**
- **JS 层只能进一步收紧**：JS 回调无法放行宿主已拒绝的操作，也无法绕过能力位
- **宿主回调为 `NULL` 时**：即使已注册 JS 回调，掩码覆盖的操作仍抛 `KossConfigError`（`Audit mask is set but no callback is registered`）
- **重入保护**：JS 回调执行期间若再调用受保护 API，会触发重入检测并拒绝

## 完整决策流程

```
JS 调用受保护 API（例如 fs.readFile）
    │
    ▼
能力位掩码检查 ── 未设置 → 拒绝（KossCapabilityError）
    │ 已设置
    ▼
审核掩码检查 ── 未设置 → 放行（不触发审核）
    │ 已设置
    ▼
宿主回调是否注册？
    ├── 否 → 拒绝（KossConfigError）
    ▼ 是
宿主回调
    ├── false → 拒绝（KossSecurityError）【不调用 JS 层】
    ▼ true
JS 回调是否注册（KossJS.set_audit_callback）？
    ├── 否 → 放行
    ▼ 是
JS 回调 (target, args[], pwd) => bool
    ├── false / 异常 / 重入 → 拒绝（KossSecurityError）
    ├── true → 放行
```

## 使用示例

### 基本用法

```javascript
// 注册：仅允许读取 /tmp/sandbox/ 目录下的文件
KossJS.set_audit_callback(function (target, args, pwd) {
    if (target === 'fs.readFile') {
        return args[0].startsWith('/tmp/sandbox/');
    }
    return true;
});
```

### 清除回调

```javascript
// JS 侧清除
KossJS.set_audit_callback(null);

// 宿主侧清除（C ABI）
// koss_clear_js_audit(inst);
```

### 与宿主回调配合

```python
from kossjs_interface import KossJS

koss = KossJS(capabilities=KossJS.KOSS_CAP_ALL_FS)
koss.set_audit_mask(KossJS.FS_READ)

# 宿主回调：放行所有操作
koss.check_sandbox(lambda target, args, pwd: True)

# JS 层回调：进一步限制只读 ./allowed.txt
koss.eval("""
KossJS.set_audit_callback(function (target, args, pwd) {
    return args[0] === './allowed.txt';
});
""")
```

## 常见问题

**Q：为什么宿主回调为 NULL 时，即使注册了 JS 回调也抛 KossConfigError？**

A：宿主回调是审核链的主闸门和信任边界。若允许 JS 回调单独存在，恶意脚本可以注册"全放行"回调自我授权，审核机制将失去意义。JS 回调只能作为宿主的**补充限制**，不能独立存在。

**Q：JS 回调内部能调用受保护 API 吗？**

A：不能。回调执行期间再次触发审核会被重入检测直接拒绝，以防止死循环。

## 相关 API

- [koss_clear_js_audit](/zh/api/functions/koss_clear_js_audit) — 宿主清除 JS 层审核回调
- [koss_check_sandbox](/zh/api/functions/koss_check_sandbox) — 注册/清除宿主审核回调
- [koss_set_audit_mask](/zh/api/functions/koss_set_audit_mask) — 设置审核掩码
- [koss_get_audit_mask](/zh/api/functions/koss_get_audit_mask) — 获取审核掩码
- [安全与沙箱指南 - JS 层审核回调](/zh/security-sandbox/security-sandbox#五js-层审核回调两级审核链)
