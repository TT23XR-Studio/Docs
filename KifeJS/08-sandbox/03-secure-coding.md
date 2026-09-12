# 安全编码最佳实践

> **文档索引:** `08-sandbox/03-secure-coding.md`
>
> 在 KifeJS 沙箱环境中编写安全、可靠的脚本。

---

## 一、沙箱安全特性

KifeJS 提供的基本安全保护：

| 特性 | 状态 | 说明 |
|------|------|------|
| 执行超时 | ✅ 30 秒 | 防止死循环 |
| 文件系统隔离 | ✅ 禁用 | 防止文件读写 |
| API 隔离 | ✅ 有限 | 只有 KifeJS API 可用 |
| 错误隔离 | ✅ 单个脚本异常不影响其他 | 防止连锁故障 |

---

## 二、安全编码指南

### 1. 不要覆盖 KifeJS API

```javascript
// ❌ 不要覆盖 API
KifeJS.log = function() {};  // 其他脚本的 log 会失效
KifeJSConfig.enabled = false;  // 影响其他脚本

// ✅ 扩展而非覆盖
KifeJS.myCustomMethod = function(msg) {
    KifeJS.log("[自定义] " + msg);
};
```

### 2. 防御性全局变量访问

```javascript
// ❌ 直接访问
// var value = someGlobalVar;  // 可能 ReferenceError

// ✅ 安全访问
var value = (typeof someGlobalVar !== "undefined") ? someGlobalVar : defaultValue;
// 或
var value = globalThis.someGlobalVar || defaultValue;
```

### 3. 不要依赖全局变量持久性

```javascript
// ❌ 假设全局变量跨重载存在
// reload 后丢失！

// ✅ 每次重载重新初始化
globalThis.__myModule = globalThis.__myModule || {};
globalThis.__myModule.initTime = Date.now();
```

### 4. 限制定时器数量

```javascript
// ❌ 创建过多定时器
for (var i = 0; i < 100; i++) {
    setInterval(function() { /* ... */ }, 1000);
}

// ✅ 使用集中管理
var timerIds = [];
for (var i = 0; i < 5; i++) {
    timerIds.push(setInterval(function() { /* ... */ }, 1000));
}
```

### 5. try-catch 包装

```javascript
// 在所有可能出错的代码周围使用 try-catch
try {
    // 可能出错的代码
    var result = riskyOperation();
} catch (e) {
    KifeJS.log("[安全] 错误已处理: " + e.message);
}
```

### 6. 避免命名冲突

```javascript
// ❌ 通用名称（可能冲突）
var config = {};
var data = [];

// ✅ 命名空间前缀
globalThis.__myModule = {};
globalThis.__myModule.config = {};
globalThis.__myModule.data = [];
```

### 7. 不记录敏感信息

```javascript
// ❌ 不要记录密码或密钥
KifeJS.log("密码: " + password);

// ✅ 记录脱敏信息
KifeJS.log("用户登录: " + username);
```

---

## 三、安全自动化检查

```javascript
globalThis.__securityCheck = {
    checks: [],

    addCheck: function(name, checkFn) {
        this.checks.push({ name: name, fn: checkFn });
    },

    runAll: function() {
        var passed = 0;
        var failed = [];

        for (var i = 0; i < this.checks.length; i++) {
            try {
                var result = this.checks[i].fn();
                if (result === true) {
                    passed++;
                } else {
                    failed.push({ name: this.checks[i].name, reason: result });
                }
            } catch (e) {
                failed.push({ name: this.checks[i].name, reason: e.message });
            }
        }

        return { passed: passed, failed: failed, total: this.checks.length };
    }
};

// 注册安全检查
globalThis.__securityCheck.addCheck("API 完整性", function() {
    if (typeof KifeJS.log !== "function") return "KifeJS.log 不可用";
    if (typeof KifeJS.broadcast !== "function") return "KifeJS.broadcast 不可用";
    return true;
});

globalThis.__securityCheck.addCheck("无全局变量污染", function() {
    // 检查是否有意外的全局变量
    var expected = ["KifeJS", "KifeJSConfig", "KifeEvent", "__kife_current_script"];
    var unexpected = [];
    for (var key in globalThis) {
        if (expected.indexOf(key) === -1 && key.indexOf("__") === -1) {
            // 记录非标准全局变量
        }
    }
    return true;
});

// 运行安全检查
setTimeout(function() {
    var result = globalThis.__securityCheck.runAll();
    KifeJS.log("[安全] 检查: " + result.passed + "/" + result.total + " 通过");
    if (result.failed.length > 0) {
        for (var i = 0; i < result.failed.length; i++) {
            KifeJS.log("[安全] 失败: " + result.failed[i].name + " - " + result.failed[i].reason);
        }
    }
}, 2000);
```

---

## 四、安全编码清单

- [ ] 不覆盖 KifeJS API
- [ ] 使用防御性变量访问
- [ ] 不假设全局变量持久性
- [ ] 限制定时器数量
- [ ] 使用 try-catch 包装
- [ ] 使用命名空间避免冲突
- [ ] 不记录敏感信息
- [ ] 每个脚本定位仅在其自身执行

---

## 五、故障隔离

```javascript
// 每个脚本应该独立运行，不依赖其他脚本的正常执行
// 单个脚本的失败不应该传播到全局

// ✅ 正确的错误处理模式
(function() {
    "use strict";
    try {
        // 脚本主体
        KifeJS.log("[" + __kife_current_script + "] 执行中");
    } catch (e) {
        KifeJS.log("[" + __kife_current_script + "] 错误: " + e.message);
        // 即使出错，也不影响其他脚本
    }
})();
```

---

## 下一步

- [示例集](../09-examples/01-hello-world/index.js)
- [故障排除](../10-troubleshooting/01-library-not-found.md)
