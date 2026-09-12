# koss_check_sandbox 函数

**功能描述**：注册或清除同步审核回调。  
**返回值**：`KossResult` — 成功返回 `code=0`。

## 函数签名

```c
KossResult koss_check_sandbox(KossInstance* inst, AuditCallback callback, void* userdata);
```

## 参数

| 参数 | 类型 | 说明 |
|------|------|------|
| ***inst*** | ***KossInstance**** | JS 实例指针 |
| ***callback*** | ***AuditCallback*** | 审核回调函数指针。传入 `NULL` 表示清除回调 |
| ***userdata*** | ***void***\* | 用户数据，会传递给回调函数 |

## AuditCallback 类型

```c
typedef bool (*AuditCallback)(
    const char* target,      // API 名称，如 "fs.readFile"
    const char** args,       // 参数字符串数组
    int argc,                // 参数个数
    const char* pwd,         // 当前模块目录（绝对路径），eval 时为 NULL
    void* userdata           // 注册时传入的用户数据
);
// 返回 true = 允许，false = 拒绝
```

## 说明

注册审核回调后，所有匹配审核掩码的 API 调用都会触发回调。回调返回 `true` 允许操作，返回 `false` 拒绝操作（抛出 `KossSecurityError`）。

**决策流程**（两级审核链）：
1. 能力位掩码检查 → 未设置则拒绝（`KossCapabilityError`）
2. 审核掩码检查 → 未设置则直接放行
3. 宿主审核回调检查：
   - 未注册（`NULL`）→ 拒绝（`KossConfigError`）
   - 返回 `false` → 拒绝（`KossSecurityError`），**不调用 JS 层**
   - 返回 `true` → 若已注册 JS 层审核回调，交给其进一步限制
4. JS 层审核回调（可选，`KossJS.set_audit_callback` 注册）：
   - 返回 `false` / 抛异常 / 回调重入 → 拒绝（`KossSecurityError`）
   - 返回 `true` → 放行

> 注意：`Audit Mask ≠ 0` 但宿主回调为 `NULL` 时，即使已注册 JS 层回调也会抛 `KossConfigError`。

详见 [安全与沙箱指南 - 审核回调](/zh/security-sandbox/security-sandbox#四审核回调) 与 [JS 层审核回调](/zh/security-sandbox/security-sandbox#五js-层审核回调两级审核链)。

## 使用示例

### C

```c
// 定义审核回调
bool my_audit(const char* target, const char** args, int argc, const char* pwd, void* userdata) {
    if (strcmp(target, "fs.readFile") == 0) {
        // 只允许读取 /tmp/sandbox/ 目录下的文件
        return args[0] && strncmp(args[0], "/tmp/sandbox/", 13) == 0;
    }
    return true;  // 其他操作放行
}

// 设置审核掩码
koss_set_audit_mask(inst, FS_READ);

// 注册回调
koss_check_sandbox(inst, my_audit, NULL);

// 执行代码 — 触发审核
koss_eval(inst, "require('fs').readFileSync('/tmp/sandbox/test.txt')");  // 允许
koss_eval(inst, "require('fs').readFileSync('/etc/passwd')");  // 拒绝

// 清除回调
koss_check_sandbox(inst, NULL, NULL);
```

### Python

```python
from kossjs_interface import KossJS, JsError

def my_audit(target: str, args: list[str], pwd: str | None) -> bool:
    if target == "fs.readFile":
        return args[0].startswith("/tmp/sandbox/")
    return True

koss = KossJS(capabilities=KossJS.KOSS_CAP_ALL_FS)
koss.set_audit_mask(KossJS.FS_READ)

# 注册回调
koss.check_sandbox(my_audit)

# 执行代码 — 触发审核
try:
    koss.eval("require('fs').readFileSync('/etc/passwd')")
except JsError as e:
    print(f"Blocked: {e}")  # KossSecurityError

# 清除回调
koss.check_sandbox(None)
```

## 相关 API

- [koss_set_audit_mask](/zh/api/functions/koss_set_audit_mask)
- [koss_get_audit_mask](/zh/api/functions/koss_get_audit_mask)
- [koss_enable_audit_debug](/zh/api/functions/koss_enable_audit_debug)
- [koss_get_capabilities](/zh/api/functions/koss_get_capabilities)
