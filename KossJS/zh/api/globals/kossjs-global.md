# KossJS 全局对象

`KossJS` 是一个只读的全局对象，在 KossJS 运行时初始化时自动注入到 JavaScript 环境中，提供运行时的基本信息。

## 对象结构

```javascript
KossJS = {
    version: "0.1.0-dev.10",  // 当前 KossJS 版本号
    runtime: "KossJS",        // 运行时名称（固定值）
    isStable: true,           // 是否为稳定模式
    set_audit_callback,       // 注册/清除 JS 层审核回调（v0.1.0-dev.10）
}
```

## 属性说明

| 属性 | 类型 | 说明 |
|------|------|------|
| `version` | `string` | 当前 KossJS 版本号，从 `src/version.rs` 动态获取 |
| `runtime` | `string` | 运行时标识，固定为 `"KossJS"` |
| `isStable` | `boolean` | `true` 表示稳定模式（默认），`false` 表示不稳定模式（启用 FFI） |
| `set_audit_callback` | `function` | 注册/清除 JS 层审核回调。详见 [KossJS.set_audit_callback](/zh/api/globals/kossjs-set-audit-callback) |

## 使用示例

```javascript
// 获取版本信息
console.log(KossJS.version);   // "0.1.0-dev.10"
console.log(KossJS.runtime);   // "KossJS"

// 检测当前模式
if (KossJS.isStable) {
    console.log("稳定模式：FFI 已禁用");
} else {
    console.log("不稳定模式：FFI 可用");
}
```

## 安全保护机制

`KossJS` 对象采用双层保护，防止被恶意篡改：

### Rust 层保护

`version`、`runtime`、`isStable` 均设置为 `READONLY | ENUMERABLE | PERMANENT`；`set_audit_callback` 为 `WRITABLE | CONFIGURABLE`（需允许 JS 层重复注册/清除回调），其最终不可变由 JS 层 `Object.freeze` 保证。

| 攻击向量 | 防护措施 |
|----------|----------|
| `KossJS = {}` | READONLY 阻止重新赋值（最终由 JS 层 defineProperty 加固） |
| `KossJS.version = "x"` | READONLY 阻止属性修改 |
| `delete KossJS.version` | PERMANENT 阻止删除属性 |
| `Object.defineProperty(...)` | PERMANENT 阻止重新定义属性 |

### JS 层加固

Rust 层注册后，立即执行 JS 加固代码：

1. 创建一个 `Object.create(null)` 的无原型对象
2. 复制所有属性到新对象
3. `Object.freeze()` 冻结新对象
4. 用 `Object.defineProperty` 替换 `globalThis.KossJS`，设置为 `writable: false, configurable: false`

这确保了即使绕过 Rust 层保护，JS 层也无法修改该对象。

## 稳定模式检测

除了直接读取 `KossJS.isStable`，也可以通过检测原生函数是否存在来间接判断：

```javascript
// 方式 1：直接读取（推荐）
if (KossJS.isStable) { /* 稳定模式 */ }

// 方式 2：间接检测（备选）
const isStable = typeof _senri_ffi === 'undefined';
```

> [!TIP]
> 推荐使用 `KossJS.isStable`，语义更清晰，且不依赖内部实现细节。

## JS 层审核回调（`KossJS.set_audit_callback`）

**v0.1.0-dev.10 新增。** `KossJS.set_audit_callback(fn)` 是 `KossJS` 全局对象的方法，用于注册/清除 JS 层审核回调（两级审核链的 JS 侧）：

```javascript
// 注册：fn(target, args[], pwd) => boolean
KossJS.set_audit_callback(function (target, args, pwd) {
    if (target === 'fs') {
        return false;  // 拒绝 fs 相关操作（宿主放行之后）
    }
    return true;
});

// 清除
KossJS.set_audit_callback(null);
```

- 仅在宿主审核回调放行后被调用（宿主回调是主闸门）
- 只能进一步拒绝，不能放行宿主已拒绝的操作或绕过能力位
- 回调内再次触发审核（重入）会被直接拒绝

> 完整参数、返回值与行为说明，见 **[KossJS.set_audit_callback 函数参考](/zh/api/globals/kossjs-set-audit-callback)**。
> 另见 [安全与沙箱指南 - JS 层审核回调](/zh/security-sandbox/security-sandbox#五js-层审核回调两级审核链)。
