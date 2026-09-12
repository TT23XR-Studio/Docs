# 全局作用域共享机制

> **文档索引:** `06-cross-script/01-global-scope.md`
>
> KifeJS 的所有脚本共享同一个 KossJS 引擎实例（runtime），这意味着它们共享全局作用域 `globalThis`。这是跨脚本通信的基础。

---

## 一、共享作用域原理

```
┌─────────────────────────────────────────────┐
│          KossJS 引擎 (单个 Runtime)          │
│                                              │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐ │
│  │ 脚本 A    │  │ 脚本 B    │  │ 脚本 C    │ │
│  │ hello.js  │  │ logger.js │  │ core.js   │ │
│  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘ │
│        │              │              │        │
│        ▼              ▼              ▼        │
│  ┌─────────────────────────────────────────┐ │
│  │           globalThis                    │ │
│  │  (共享的全局作用域)                      │ │
│  │                                         │ │
│  │  KifeJS.log()     ←─ Java 桥接 API     │ │
│  │  KifeJS.broadcast()                     │ │
│  │  KifeJSConfig     ←─ 全局配置           │ │
│  │  KifeEvent        ←─ 事件类             │ │
│  │  __appConfig      ←─ 用户全局配置      │ │
│  │  __sharedData     ←─ 跨脚本共享数据    │ │
│  │  EventBus         ←─ 共享事件总线      │ │
│  └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

### 关键事实

```javascript
// 脚本 A 设置的值
var x = 42;

// 脚本 B 可以读取
KifeJS.log(x);  // 42

// 但是！
// 如果脚本 A 用 var x = 42，这个 x 可能只在顶层作用域
// 不同引擎处理方式不同
```

> **注意:** `var` 声明的全局变量在不同 JS 引擎中的行为可能不同。推荐使用 `globalThis` 或显式赋值。

---

## 二、推荐的共享方式

### 方式 1：显式使用 globalThis（最安全）

```javascript
// ✅ 明确赋值到全局
globalThis.myVar = 42;

// ✅ 明确从全局读取
var value = globalThis.myVar;
```

### 方式 2：省略 var 直接赋值

```javascript
// ✅ 直接给未声明的变量赋值
sharedCounter = 0;  // 自动成为全局变量

// 读
KifeJS.log(sharedCounter);  // 0
```

### 方式 3：使用对象作为命名空间

```javascript
// ✅ 将相关数据放在一个全局对象中
globalThis.__myModule = {
    counter: 0,
    items: [],
    config: {}
};
```

---

## 三、实际工作方式

### 写操作（所有方式都可靠）

```javascript
// 脚本 A: config.js
// 以下所有方式都会在全局作用域创建变量
globalThis.appName = "MyServer";
globalThis["appVersion"] = "1.0.0";
appDescription = "A Minecraft server";  // 隐式全局
```

### 读操作

```javascript
// 脚本 B: main.js

// ✅ 推荐：使用 globalThis
var name = globalThis.appName;

// ✅ 也安全
var desc = appDescription;

// ⚠️ 存在风险：如果变量不存在会报 ReferenceError
// 安全做法：
var version = (typeof globalThis.appVersion !== "undefined")
    ? globalThis.appVersion
    : "unknown";
```

---

## 四、跨脚本通信的基础模式

### 数据共享

```javascript
// 脚本: 0-config.js
// 在所有脚本之前执行
globalThis.__app = {
    serverName: "我的生存服",
    version: "1.0",
    debug: true,
    startTime: Date.now()
};

// 脚本: a-module.js
// 读取配置
var app = globalThis.__app;
KifeJS.log("服务器: " + app.serverName + " 已运行 " + (Date.now() - app.startTime) + "ms");
```

### 函数共享

```javascript
// 脚本: b-utils.js
globalThis.__utils = {
    formatTime: function(ms) {
        var s = Math.floor(ms / 1000);
        var m = Math.floor(s / 60);
        s = s % 60;
        return m + "m" + s + "s";
    },

    logError: function(msg) {
        KifeJS.log("[ERROR] " + msg);
    },

    isEnabled: function(feature) {
        return KifeJSConfig && KifeJSConfig.enabled !== false;
    }
};

// 脚本: c-feature.js
if (globalThis.__utils.isEnabled("broadcast")) {
    var uptime = globalThis.__utils.formatTime(Date.now() - globalThis.__app.startTime);
    KifeJS.log("当前运行时间: " + uptime);
}
```

### 状态共享

```javascript
// 脚本: a-counter.js
globalThis.__state = {
    playerCount: 0,
    totalJoins: 0,
    onlinePlayers: []
};

// 更新状态
globalThis.__state.totalJoins++;

// 脚本: b-monitor.js
// 读取状态
var state = globalThis.__state;
KifeJS.log("在线玩家: " + state.playerCount + ", 总加入: " + state.totalJoins);
```

---

## 五、安全共享原则

### DO ✅

```javascript
// 1. 使用带有前缀的命名空间
globalThis.__myModule_data = {};
globalThis.__myModule_config = {};

// 2. 使用前检查存在性
if (typeof globalThis.__myModule !== "undefined") {
    // 安全使用
}

// 3. 提供默认值
var config = globalThis.__myConfig || { enabled: true };

// 4. 初始化时检查
if (!globalThis.__initialized) {
    globalThis.__initialized = true;
    // 执行一次性的初始化
}
```

### DON'T ❌

```javascript
// 1. 使用过于通用的名称（容易冲突）
count = 0;      // ❌ 太通用
data = {};      // ❌ 太通用

// 2. 不做存在性检查
var x = someGlobalVar;  // ❌ 可能 ReferenceError

// 3. 直接修改原始 API
KifeJSConfig = null;     // ❌ 不要删除 API
KifeJS.log = function(){};  // ❌ 不要覆盖 API
```

---

## 六、执行顺序与依赖管理

由于脚本按字母序执行，可以利用执行顺序管理依赖：

```javascript
// 文件名: 0-config.js        ← 第 1 执行 — 配置/全局设置
// 文件名: 1-utils.js          ← 第 2 执行 — 工具函数
// 文件名: a-feature-one.js    ← 第 3 执行 — 功能 1
// 文件名: b-feature-two.js    ← 第 4 执行 — 功能 2
// 文件名: z-cleanup.js        ← 最后执行 — 清理/日志
```

### 依赖检查模式

```javascript
// 在任何需要依赖的脚本开头
function checkDependencies(required) {
    var missing = [];
    for (var i = 0; i < required.length; i++) {
        var parts = required[i].split(".");
        var obj = globalThis;
        var found = true;
        for (var p = 0; p < parts.length; p++) {
            if (typeof obj[parts[p]] === "undefined") {
                found = false;
                break;
            }
            obj = obj[parts[p]];
        }
        if (!found) missing.push(required[i]);
    }
    return missing;
}

// 使用
var missing = checkDependencies(["__app", "__utils", "EventBus"]);
if (missing.length > 0) {
    KifeJS.log("[" + __kife_current_script + "] 缺少依赖: " + missing.join(", "));
} else {
    // 安全使用
}
```

---

## 七、重载的影响

**每次 `/kifejs reload` 会完全销毁并重建引擎，所有全局变量丢失。**

```javascript
// 重载前
globalThis.__myData = { value: 42 };

// === /kifejs reload ===

// 重载后
// globalThis.__myData → undefined（已丢失）
```

> 重载后需要重新执行所有脚本，所有初始化逻辑再次运行。

---

## 八、最佳实践总结

| 原则 | 说明 |
|------|------|
| 显式使用 `globalThis` | 避免作用域歧义 |
| 使用命名空间前缀 | `__模块名_变量名` |
| 读取时检查存在性 | `typeof` 或 `||` 默认值 |
| 利用执行顺序 | 依赖的脚本命名靠前 |
| 不覆盖 KifeJS API | 不要修改 `KifeJS.*` |
| 注意重载影响 | 所有全局状态重置 |

---

## 下一步

- [直接 API 调用](02-direct-api.md) — 脚本间函数调用
- [事件驱动通信](03-event-driven.md)
