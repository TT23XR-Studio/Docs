# 模块化组织

> **文档索引:** `07-advanced-patterns/02-module-organization.md`
>
> 将脚本组织为模块化结构，提高可维护性和复用性。

---

## 一、模块化原则

1. **单一职责** — 每个模块只做一件事
2. **显式依赖** — 明确声明依赖其他模块
3. **接口稳定** — 公开的 API 保持一致
4. **内部封装** — 实现细节不暴露到全局

---

## 二、模块模式

### 模式 1：IIFE 模块（推荐）

```javascript
// 文件: modules/logger.js
globalThis.__logger = (function() {
    // 私有变量
    var logLevel = "INFO";
    var logCount = 0;

    // 私有函数
    function formatMessage(level, msg) {
        return "[" + level + "][" + __kife_current_script + "] " + msg;
    }

    // 公开 API
    return {
        info: function(msg) {
            KifeJS.log(formatMessage("INFO", msg));
            logCount++;
        },

        warn: function(msg) {
            KifeJS.log(formatMessage("WARN", msg));
            logCount++;
        },

        error: function(msg) {
            KifeJS.log(formatMessage("ERROR", msg));
            logCount++;
        },

        setLevel: function(level) {
            logLevel = level;
        },

        getStats: function() {
            return { logCount: logCount, level: logLevel };
        }
    };
})();

KifeJS.log("[logger] 模块已加载");
```

### 模式 2：命名空间聚合

```javascript
// 文件: modules/core.js
globalThis.__core = globalThis.__core || {};
globalThis.__core.utils = {};

// 工具函数
globalThis.__core.utils.formatTime = function(ms) {
    var s = Math.floor(ms / 1000);
    var m = Math.floor(s / 60);
    var h = Math.floor(m / 60);
    return h + "h " + (m % 60) + "m " + (s % 60) + "s";
};

globalThis.__core.utils.randomInt = function(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

globalThis.__core.utils.mergeConfig = function(defaults, overrides) {
    var result = {};
    for (var key in defaults) {
        result[key] = defaults[key];
    }
    if (overrides) {
        for (var key in overrides) {
            result[key] = overrides[key];
        }
    }
    return result;
};
```

### 模式 3：包脚本（文件夹模块）

```javascript
// 目录结构:
// scripts/
// └── my-system/
//     ├── index.js       ← 入口：组合子模块
//     ├── config.js      ← 配置
//     ├── handler.js     ← 子模块 1
//     └── service.js     ← 子模块 2

// index.js — 组合子模块
globalThis.__mySystem = globalThis.__mySystem || {};
globalThis.__mySystem.config = { enabled: true };
KifeJS.log("[my-system] 加载中...");

// handler.js
(function() {
    if (typeof globalThis.__mySystem === "undefined") {
        KifeJS.log("[handler] 错误: 依赖 __mySystem 未加载");
        return;
    }
    globalThis.__mySystem.handler = {
        process: function(data) {
            KifeJS.log("[handler] 处理数据");
        }
    };
})();

// service.js
(function() {
    if (typeof globalThis.__mySystem === "undefined") {
        return;
    }
    globalThis.__mySystem.service = {
        start: function() { KifeJS.log("[service] 启动"); },
        stop: function() { KifeJS.log("[service] 停止"); }
    };
})();
```

---

## 三、依赖管理

### 显式声明依赖

```javascript
// 在模块开头声明依赖
var DEPENDENCIES = ["__core", "__store", "EventBus"];
var missing = [];

for (var i = 0; i < DEPENDENCIES.length; i++) {
    if (typeof globalThis[DEPENDENCIES[i]] === "undefined") {
        missing.push(DEPENDENCIES[i]);
    }
}

if (missing.length > 0) {
    KifeJS.log("[" + __kife_current_script + "] 缺少依赖: " + missing.join(", "));
    // 可以选择不执行，或使用降级模式
    // return;
}

// 继续执行模块逻辑
KifeJS.log("[" + __kife_current_script + "] 依赖检查通过");
```

### 延迟初始化

```javascript
// 如果依赖可能尚未就绪，使用延迟初始化
globalThis.__delayedModule = {
    _ready: false,
    _queue: [],

    init: function() {
        if (this._ready) return;

        // 检查所有依赖
        if (typeof EventBus === "undefined") {
            KifeJS.log("[delayed] 等待 EventBus...");
            return;  // 稍后重试
        }

        this._ready = true;
        KifeJS.log("[delayed] 初始化完成");

        // 执行队列中的操作
        for (var i = 0; i < this._queue.length; i++) {
            this._queue[i]();
        }
        this._queue = [];
    },

    doWhenReady: function(fn) {
        if (this._ready) {
            fn();
        } else {
            this._queue.push(fn);
            // 延迟 1 秒重试
            setTimeout(function() { globalThis.__delayedModule.init(); }, 1000);
        }
    }
};

// 使用
globalThis.__delayedModule.doWhenReady(function() {
    EventBus.on("player:join", function(e) {
        KifeJS.log("[delayed] 玩家加入: " + e.data.player);
    });
});

// 尝试初始化
globalThis.__delayedModule.init();
```

---

## 四、模块通信

### 通过事件总线

```javascript
// 模块 A：发布事件
EventBus.emit("moduleA:data-ready", {
    data: [1, 2, 3]
});

// 模块 B：订阅事件
EventBus.on("moduleA:data-ready", function(e) {
    KifeJS.log("模块 B 收到模块 A 的数据: " + JSON.stringify(e.data));
});
```

### 通过数据仓库

```javascript
// 模块 A：写入数据
globalThis.__store.set("moduleA", "status", "ready");
globalThis.__store.set("moduleA", "data", { items: [] });

// 模块 B：读取数据
var status = globalThis.__store.get("moduleA", "status");
if (status === "ready") {
    var data = globalThis.__store.get("moduleA", "data");
    KifeJS.log("模块 A 已就绪，数据长度: " + data.items.length);
}
```

---

## 五、大型项目的推荐结构

```
scripts/
├── 0-core/                  ← 核心模块（最先加载）
│   ├── index.js             ← 组合所有核心功能
│   ├── event-bus.js         ← 事件总线
│   ├── store.js             ← 数据仓库
│   └── config.js            ← 全局配置
│
├── 1-utils/                 ← 工具模块
│   ├── index.js
│   ├── timer.js             ← 定时器管理
│   └── format.js            ← 格式化工具
│
├── features/                ← 业务功能模块
│   ├── player-system/
│   │   ├── index.js
│   │   └── config.js
│   └── economy/
│       ├── index.js
│       └── config.js
│
├── tools/                   ← 工具脚本
│   ├── debug.js
│   └── test.js
│
└── legacy/                  ← 旧版脚本（待迁移）
    └── old-script.js
```

---

## 下一步

- [生命周期钩子](03-lifecycle-hooks.md)
- [状态持久化](04-persistence.md)
