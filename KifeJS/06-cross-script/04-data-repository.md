# 数据仓库模式

> **文档索引:** `06-cross-script/04-data-repository.md`
>
> 通过一个中心化的数据仓库实现跨脚本数据共享。

---

## 一、什么是数据仓库？

数据仓库是一个全局对象，所有脚本通过它读写共享数据，类似一个"内存数据库"。

```
┌─────────────────────────────────────┐
│            DataRepository           │
│  ┌──────────┐  ┌──────────┐       │
│  │ players  │  │ stats    │  ...  │
│  ├──────────┤  ├──────────┤       │
│  │ count: 5 │  │ joins: 42│       │
│  │ list:[ ] │  │ kills:100│       │
│  └──────────┘  └──────────┘       │
└─────────────────────────────────────┘
     ▲          ▲          ▲
     │          │          │
 脚本 A    脚本 B     脚本 C
```

---

## 二、基础数据仓库

```javascript
// 脚本: 0-repository.js
globalThis.__store = {
    // 命名空间容器
    _data: {},

    // 设置值
    set: function(namespace, key, value) {
        if (!this._data[namespace]) {
            this._data[namespace] = {};
        }
        var old = this._data[namespace][key];
        this._data[namespace][key] = value;

        // 通知变化
        if (typeof EventBus !== "undefined") {
            EventBus.emit("store:change", {
                namespace: namespace,
                key: key,
                oldValue: old,
                newValue: value
            });
        }
    },

    // 获取值
    get: function(namespace, key) {
        if (this._data[namespace]) {
            return this._data[namespace][key];
        }
        return undefined;
    },

    // 获取整个命名空间
    getNamespace: function(namespace) {
        return this._data[namespace] || {};
    },

    // 删除值
    remove: function(namespace, key) {
        if (this._data[namespace]) {
            delete this._data[namespace][key];
        }
    },

    // 删除整个命名空间
    removeNamespace: function(namespace) {
        delete this._data[namespace];
    },

    // 列出所有命名空间
    listNamespaces: function() {
        var names = [];
        for (var key in this._data) {
            if (this._data.hasOwnProperty(key)) {
                names.push(key);
            }
        }
        return names;
    },

    // 原子更新（读取-修改-写入）
    update: function(namespace, key, updater) {
        var current = this.get(namespace, key);
        var newValue = updater(current);
        this.set(namespace, key, newValue);
        return newValue;
    },

    // 检查是否存在
    has: function(namespace, key) {
        return this._data[namespace] && (key in this._data[namespace]);
    },

    // 导出所有数据
    exportAll: function() {
        return JSON.parse(JSON.stringify(this._data));
    },

    // 获取统计
    stats: function() {
        var count = 0;
        for (var ns in this._data) {
            if (this._data.hasOwnProperty(ns)) {
                for (var key in this._data[ns]) {
                    if (this._data[ns].hasOwnProperty(key)) {
                        count++;
                    }
                }
            }
        }
        return {
            namespaces: this.listNamespaces().length,
            entries: count
        };
    }
};

KifeJS.log("[Store] 数据仓库已初始化");
```

---

## 三、使用数据仓库

### 基本读写

```javascript
// 脚本: a-session.js
// 写入数据
globalThis.__store.set("session", "startTime", Date.now());
globalThis.__store.set("session", "serverName", "生存服");

// 读取数据
var startTime = globalThis.__store.get("session", "startTime");
KifeJS.log("启动时间: " + startTime);

// 原子更新
globalThis.__store.update("stats", "playerJoins", function(current) {
    return (current || 0) + 1;
});
```

### 玩家数据管理

```javascript
// 脚本: b-player-data.js
globalThis.__playerData = {
    // 初始化玩家数据
    initPlayer: function(name) {
        if (!globalThis.__store.has("players", name)) {
            globalThis.__store.set("players", name, {
                name: name,
                firstJoin: Date.now(),
                lastJoin: Date.now(),
                joinCount: 1,
                playTime: 0
            });
            return true;  // 新玩家
        }
        return false;  // 老玩家
    },

    // 玩家加入
    onJoin: function(name) {
        var isNew = this.initPlayer(name);
        var player = globalThis.__store.get("players", name);
        player.lastJoin = Date.now();
        player.joinCount++;
        globalThis.__store.set("players", name, player);

        globalThis.__store.update("stats", "totalJoins", function(c) { return (c || 0) + 1; });

        return isNew;
    },

    // 获取所有玩家数据
    getAllPlayers: function() {
        return globalThis.__store.getNamespace("players");
    },

    // 获取指定玩家数据
    getPlayer: function(name) {
        return globalThis.__store.get("players", name);
    }
};
```

### 配置管理

```javascript
// 脚本: c-config.js
// 从数据仓库管理配置
globalThis.__store.set("config", "debug", true);
globalThis.__store.set("config", "broadcastInterval", 120);
globalThis.__store.set("config", "motd", "欢迎来到 KifeJS 服务器");

// 读取配置的通用函数
function getConfig(key, defaultValue) {
    var value = globalThis.__store.get("config", key);
    return (typeof value !== "undefined") ? value : defaultValue;
}

// 使用
KifeJS.log("MOTD: " + getConfig("motd", "默认欢迎信息"));
```

---

## 四、观察者模式 — 响应数据变化

当仓库数据发生变化时，通过事件通知：

```javascript
// 脚本: d-observer.js
// 监听所有 store 变更
EventBus.on("store:change", function(e) {
    KifeJS.log("[Store] 变更: " + e.data.namespace + "." + e.data.key
        + " = " + JSON.stringify(e.data.newValue)
        + " (原值: " + JSON.stringify(e.data.oldValue) + ")");
});

// 监听特定命名空间的变更
EventBus.on("store:change", function(e) {
    if (e.data.namespace === "players" && e.data.key === "count") {
        KifeJS.log("[玩家] 人数变更: " + e.data.newValue);
        if (e.data.newValue >= 50) {
            KifeJS.broadcast("服务器人数已达 " + e.data.newValue + "！");
        }
    }
});

// 使用仓库时自动触发通知
globalThis.__store.set("players", "count", 10);
// → store:change 事件触发
// → 监听器收到通知
```

---

## 五、计数器与统计

```javascript
// 脚本: e-stats.js
globalThis.__stats = {
    // 递增计数器
    increment: function(name) {
        return globalThis.__store.update("counters", name, function(c) {
            return (c || 0) + 1;
        });
    },

    // 获取计数器
    get: function(name) {
        return globalThis.__store.get("counters", name) || 0;
    },

    // 记录耗时
    recordTiming: function(name, duration) {
        globalThis.__store.update("timings", name + "_count", function(c) { return (c || 0) + 1; });
        globalThis.__store.update("timings", name + "_total", function(t) { return (t || 0) + duration; });
    },

    // 获取平均耗时
    avgTiming: function(name) {
        var count = globalThis.__store.get("timings", name + "_count") || 0;
        var total = globalThis.__store.get("timings", name + "_total") || 0;
        return count > 0 ? (total / count).toFixed(2) : 0;
    },

    // 打印统计报告
    printReport: function() {
        KifeJS.log("=== 统计报告 ===");
        var counters = globalThis.__store.getNamespace("counters");
        for (var key in counters) {
            if (counters.hasOwnProperty(key)) {
                KifeJS.log("  计数器 " + key + ": " + counters[key]);
            }
        }
        KifeJS.log("================");
    }
};

// 使用
globalThis.__stats.increment("playerJoins");
globalThis.__stats.increment("playerJoins");
globalThis.__stats.recordTiming("eventProcessing", 15);
KifeJS.log("平均事件处理时间: " + globalThis.__stats.avgTiming("eventProcessing") + "ms");
globalThis.__stats.printReport();
```

---

## 六、数据验证

确保写入仓库的数据格式正确：

```javascript
// 脚本: f-validator.js
globalThis.__dataValidator = {
    _rules: {},

    // 注册验证规则
    addRule: function(namespace, key, validator) {
        if (!this._rules[namespace]) this._rules[namespace] = {};
        this._rules[namespace][key] = validator;
    },

    // 验证数据
    validate: function(namespace, key, value) {
        var rules = this._rules[namespace];
        if (!rules) return null;

        var validator = rules[key];
        if (!validator) return null;

        return validator(value);
    }
};

// 注册验证规则
globalThis.__dataValidator.addRule("players", "name", function(v) {
    if (typeof v !== "string") return "名称必须是字符串";
    if (v.length < 1 || v.length > 16) return "名称长度必须在 1-16 之间";
    return null;  // 验证通过
});

globalThis.__dataValidator.addRule("config", "broadcastInterval", function(v) {
    if (typeof v !== "number") return "间隔必须是数字";
    if (v < 10 || v > 3600) return "间隔必须在 10-3600 秒之间";
    return null;
});

// 扩展仓库以支持验证
var originalSet = globalThis.__store.set;
globalThis.__store.set = function(namespace, key, value) {
    var error = globalThis.__dataValidator.validate(namespace, key, value);
    if (error) {
        KifeJS.log("[验证] 拒绝写入 " + namespace + "." + key + ": " + error);
        return false;
    }
    return originalSet.call(this, namespace, key, value);
};

// 测试
globalThis.__store.set("config", "broadcastInterval", 5);    // 被拒绝（小于 10）
globalThis.__store.set("config", "broadcastInterval", 120);  // 通过
```

---

## 七、数据仓库通信模式

```
┌─────────────────────────────────────────────────────┐
│                   数据仓库                            │
│  ┌──────────────────────────────────────────────┐   │
│  │  config  │  players  │  stats  │  session    │   │
│  └──────────────────────────────────────────────┘   │
│         ▲          ▲          ▲          ▲          │
│         │          │          │          │          │
│    ┌────┴────┐ ┌──┴───┐ ┌───┴───┐ ┌───┴────┐     │
│    │ config  │ │track │ │ stats │ │ session │     │
│    │ loader  │ │  er  │ │ logger│ │ manager │     │
│    └─────────┘ └──────┘ └───────┘ └────────┘     │
│        脚本 A    脚本 B   脚本 C    脚本 D          │
└─────────────────────────────────────────────────────┘
```

---

## 下一步

- [命名空间约定](05-namespace-conventions.md)
- [状态管理与重载策略](06-state-lifecycle.md)
