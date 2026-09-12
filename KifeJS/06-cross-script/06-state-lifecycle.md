# 状态管理与重载策略

> **文档索引:** `06-cross-script/06-state-lifecycle.md`
>
> 每次 `/kifejs reload` 会完全销毁引擎，所有全局状态丢失。本文介绍如何在重载后恢复和管理状态。

---

## 一、重载的影响

```
重载前                                    重载后
┌────────────────────┐                  ┌────────────────────┐
│ 全局作用域          │     /kifejs      │ 全局作用域（全新）  │
│                    │     reload       │                    │
│ __appConfig        │ ──────────────→  │ __appConfig        │
│   server: "生存服"  │   全部丢失!       │   undefined        │
│ __counter: 42      │                  │ __counter          │
│ EventBus           │                  │   undefined        │
│   listeners: [...] │                  │ EventBus           │
│ __store: {...}     │                  │   listeners: []    │
└────────────────────┘                  │ __store            │
                                        │   undefined        │
                                        └────────────────────┘
```

**重要:** 重载后所有脚本重新执行，之前的全局状态完全不可用。

---

## 二、状态持久化策略

由于 KifeJS 当前版本不支持文件系统写入，状态持久化有几种模式：

### 策略 1：重载时重新初始化（默认）

```javascript
// 脚本: 0-config.js
// 每次重载都重新设置初始状态
globalThis.__appConfig = {
    serverName: "我的生存服",
    version: "1.0.0",
    debug: true
};

if (typeof globalThis.__stats === "undefined") {
    globalThis.__stats = {
        startTime: Date.now(),
        reloadCount: 0
    };
}
globalThis.__stats.reloadCount++;
KifeJS.log("[配置] 重载 #" + globalThis.__stats.reloadCount);
```

### 策略 2：事件总线重新注册

```javascript
// 脚本: 0-event-bus.js
if (typeof globalThis.EventBus !== "undefined") {
    KifeJS.log("[EventBus] 已存在，重新注册");
}
// 无论是否已存在，都重新创建
globalThis.EventBus = (function() {
    var listeners = {};
    // ... 事件总线实现
})();

KifeJS.log("[EventBus] 已初始化");

// 脚本: a-module.js
// 每次重载都重新注册监听器
EventBus.on("player:join", function(e) {
    KifeJS.log("玩家加入: " + e.data.player);
});
```

### 策略 3：模块状态恢复钩子

```javascript
// 脚本: 0-module-loader.js
globalThis.__moduleLoader = {
    _modules: [],

    // 注册模块（提供初始化函数）
    register: function(name, initFn) {
        this._modules.push({
            name: name,
            init: initFn,
            loaded: false
        });
    },

    // 执行所有模块初始化
    loadAll: function() {
        for (var i = 0; i < this._modules.length; i++) {
            try {
                this._modules[i].init();
                this._modules[i].loaded = true;
                KifeJS.log("[加载器] 模块已加载: " + this._modules[i].name);
            } catch (e) {
                KifeJS.log("[加载器] 模块加载失败: " + this._modules[i].name + " - " + e.message);
            }
        }
    },

    // 获取模块加载状态
    getStatus: function() {
        var loaded = 0;
        var failed = 0;
        for (var i = 0; i < this._modules.length; i++) {
            if (this._modules[i].loaded) loaded++;
            else failed++;
        }
        return { total: this._modules.length, loaded: loaded, failed: failed };
    }
};

// 注册模块
globalThis.__moduleLoader.register("config", function() {
    globalThis.__config = { server: "生存服" };
});

globalThis.__moduleLoader.register("eventBus", function() {
    globalThis.EventBus = { /* ... */ };
});

globalThis.__moduleLoader.register("playerTracker", function() {
    globalThis.__playerTracker = { players: [] };
});

// 加载所有模块
globalThis.__moduleLoader.loadAll();
```

---

## 三、版本化状态恢复

跟踪重载版本号，执行增量恢复：

```javascript
// 脚本: 0-state-manager.js
globalThis.__stateManager = {
    // 当前版本（每次重载递增）
    currentVersion: 0,

    // 存储状态快照的兼容方案
    // 由于无法写文件，使用变量传递（在 reload 时丢失）

    init: function() {
        // 读取持久化的版本号
        // 当前版本无法跨 reload 保留
        // 但可以在全局 JS 作用域中维护
        this.currentVersion = 1;

        KifeJS.log("[状态管理] 初始化 v" + this.currentVersion);
    },

    // 保存状态（在 reload 前调用）
    save: function() {
        // 注意：无法真正持久化到磁盘
        // 但可以将关键状态保存到变量
        // reload 时这些变量会丢失！
        KifeJS.log("[状态管理] 保存状态 (版本 " + this.currentVersion + ")");
    },

    // 恢复状态
    restore: function() {
        // 从初始值开始
        this.currentVersion++;
        KifeJS.log("[状态管理] 状态已重置为版本 " + this.currentVersion);
    }
};

// 初始化
globalThis.__stateManager.init();
```

---

## 四、数据初始化模式

每次重载后，所有脚本都需要重新初始化其数据。以下是推荐的结构：

### 脚本结构模板

```javascript
// 通用脚本模板
(function() {
    "use strict";

    var MODULE_NAME = __kife_current_script;

    // === 配置默认值 ===
    var DEFAULTS = {
        enabled: true,
        debug: false
    };

    // === 配置加载 ===
    var config = {};
    var configVar = "__" + MODULE_NAME + "Config";
    if (typeof globalThis[configVar] !== "undefined") {
        for (var key in DEFAULTS) {
            config[key] = (key in globalThis[configVar])
                ? globalThis[configVar][key]
                : DEFAULTS[key];
        }
    } else {
        config = JSON.parse(JSON.stringify(DEFAULTS));
    }

    // === 模块状态 ===
    var state = {
        initialized: true,
        initTime: Date.now(),
        config: config
    };

    // === 注册到全局 ===
    globalThis["__" + MODULE_NAME] = state;

    // === 监听器注册 ===
    if (typeof EventBus !== "undefined") {
        EventBus.on(MODULE_NAME + ":event", function(e) {
            KifeJS.log("[" + MODULE_NAME + "] 收到事件");
        });
    }

    // === 初始化日志 ===
    KifeJS.log("[" + MODULE_NAME + "] 已初始化"
        + " (配置: " + JSON.stringify(config) + ")");
})();
```

---

## 五、重载生命周期事件

利用事件总线通知各脚本重载事件：

```javascript
// 脚本: 0-reload-handler.js
// 这个脚本在 reload 时最先执行

// 首次加载时创建 EventBus
globalThis.EventBus = globalThis.EventBus || (function() {
    // ... 事件总线实现
})();

// 派发 reload 事件
EventBus.emit("system:before-reload", {
    timestamp: Date.now()
});

// 注意：实际 reload 会销毁所有状态
// 因此 "before-reload" 事件只能在同一个运行时中触发

// 在 reload 后执行
EventBus.emit("system:after-reload", {
    timestamp: Date.now(),
    version: (globalThis.__reloadVersion || 0) + 1
});

globalThis.__reloadVersion = (globalThis.__reloadVersion || 0) + 1;

// 脚本: a-module.js
EventBus.on("system:after-reload", function(e) {
    KifeJS.log("[模块] reload v" + e.data.version + " 完成");
    KifeJS.log("[模块] 重新初始化...");
    // 重新初始化逻辑
});
```

---

## 六、状态管理设计原则

### 幂等性

每次 reload 后，脚本应该能够重新初始化到一致的状态：

```javascript
// ✅ 幂等：多次执行结果相同
globalThis.__counter = globalThis.__counter || 0;
globalThis.__counter++;

// ❌ 非幂等：每次结果不同
// globalThis.__counter = Math.random();
```

### 无状态设计

尽量将脚本设计为无状态的，将状态集中于数据仓库：

```javascript
// ✅ 无状态：处理函数不依赖内部状态
function processPlayer(name) {
    // 从仓库读取
    var data = globalThis.__store.get("players", name) || { count: 0 };
    data.count++;
    // 写回仓库
    globalThis.__store.set("players", name, data);
}

// ❌ 有状态：依赖内部变量
// var playerCounts = {};
// function processPlayer(name) {
//     playerCounts[name] = (playerCounts[name] || 0) + 1;
// }
```

---

## 七、重载模式总结

| 模式 | 说明 | 适用场景 |
|------|------|---------|
| **完全重新初始化** | 每次重载从默认值开始 | 简单脚本、无状态模块 |
| **事件总线模式** | 重载后重新注册所有监听器 | 事件驱动的系统 |
| **模块加载器** | 集中管理模块的初始化 | 大型多模块项目 |
| **数据仓库** | 状态集中在仓库中管理 | 需要中心化数据 |
| **版本化恢复** | 跟踪重载次数，做增量恢复 | 需要知道重载历史的场景 |

---

## 下一步

- [进阶模式 — 定时任务](../07-advanced-patterns/01-timers.md)
- [进阶模式 — 生命周期钩子](../07-advanced-patterns/03-lifecycle-hooks.md)
