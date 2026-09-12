# 命名空间约定

> **文档索引:** `06-cross-script/05-namespace-conventions.md`
>
> 在共享全局作用域中，使用一致的命名空间约定来避免冲突，是大型脚本项目的基础。

---

## 一、为什么需要命名空间？

所有脚本共享 `globalThis`，没有隔离机制：

```javascript
// 脚本 A 定义的变量
var counter = 0;

// 脚本 B 也定义了同名变量
var counter = "hello";  // 覆盖了 A 的值！
```

命名空间通过**层级对象**来隔离不同脚本的变量：

```javascript
// 脚本 A
globalThis.__myScript = {};
globalThis.__myScript.counter = 0;

// 脚本 B
globalThis.__otherScript = {};
globalThis.__otherScript.counter = "hello";
// 不会冲突！
```

---

## 二、推荐的命名规范

### 2.1 全局对象命名

```
格式: <前缀><脚本名称><后缀>

前缀约定:
  __           — 双下划线开头，表示"内部/私有"（推荐）
  $            — 美元符号开头（可选）
  (无前缀)     — 极度不推荐（冲突风险高）

层级约定:
  __模块名_子模块     — 下划线连接
  __模块名.子模块     — 点连接（JS 语法）
  __模块名/子模块     — 不推荐（斜杠在 JS 中无效）
```

### 2.2 推荐方案

```javascript
// ✅ 推荐：__ + 脚本名
globalThis.__config = { ... };
globalThis.__playerTracker = { ... };
globalThis.__eventBus = { ... };
globalThis.__logger = { ... };

// ✅ 嵌套命名空间
globalThis.__app = {
    config: {},
    modules: {},
    utils: {}
};
```

---

## 三、命名空间前缀约定表

| 前缀 | 用途 | 示例 |
|------|------|------|
| `__` | KifeJS 脚本定义的全局变量 | `__config`, `__playerTracker` |
| `_` | 内部/不稳定的 API | `_temp`, `_cache` |
| `KifeJS` | 内置 API（保留） | `KifeJS.log`, `KifeJSConfig` |
| `$` | 工具库 | `$utils`, `$time` |

---

## 四、脚本文件名与命名空间的对应

建议脚本文件名与全局命名空间名保持一致：

```javascript
// 文件: config-loader.js
// 命名空间: __configLoader
globalThis.__configLoader = { ... };

// 文件: player-tracker.js
// 命名空间: __playerTracker
globalThis.__playerTracker = { ... };

// 文件: event-bus.js
// 命名空间: __eventBus
globalThis.__eventBus = { ... };
```

### 包脚本的命名空间

包脚本的目录名应作为命名空间名：

```
scripts/
├── 0-config/                      → 命名空间: __config
│   └── index.js
├── player-system/                 → 命名空间: __playerSystem
│   ├── index.js
│   ├── tracker.js
│   └── config.js
└── event-system/                  → 命名空间: __eventSystem
    ├── index.js
    └── config.js
```

```javascript
// player-system/index.js
globalThis.__playerSystem = {
    tracker: {},
    data: {},
    // ...
};
```

---

## 五、子命名空间模式

当脚本功能复杂时，使用多级命名空间：

```javascript
// 一级命名空间
globalThis.__myModule = globalThis.__myModule || {};

// 子命名空间
globalThis.__myModule.config = {
    enabled: true,
    debug: false
};

globalThis.__myModule.data = {
    count: 0,
    items: []
};

globalThis.__myModule.utils = {
    log: function(msg) {
        KifeJS.log("[MyModule] " + msg);
    }
};
```

---

## 六、命名空间注册表

维护一个命名空间注册表，避免冲突：

```javascript
// 脚本: 0-namespace-registry.js
globalThis.__namespaceRegistry = {
    _namespaces: {},

    // 注册命名空间
    register: function(name, version, description) {
        if (this._namespaces[name]) {
            KifeJS.log("[注册表] 警告: 命名空间已存在: " + name
                + " (已有版本: " + this._namespaces[name].version + ")");
            return false;
        }
        this._namespaces[name] = {
            name: name,
            version: version || "1.0.0",
            description: description || "",
            registeredAt: Date.now()
        };
        KifeJS.log("[注册表] 注册命名空间: " + name + " v" + version);
        return true;
    },

    // 列出所有命名空间
    list: function() {
        return this._namespaces;
    },

    // 检查命名空间是否存在
    exists: function(name) {
        return !!this._namespaces[name];
    },

    // 获取命名空间信息
    get: function(name) {
        return this._namespaces[name] || null;
    }
};

// 在其他脚本中注册
globalThis.__namespaceRegistry.register("__eventBus", "1.0.0", "事件总线");
globalThis.__namespaceRegistry.register("__store", "1.0.0", "数据仓库");
globalThis.__namespaceRegistry.register("__playerTracker", "1.0.0", "玩家追踪");

// 使用
var nsList = globalThis.__namespaceRegistry.list();
for (var name in nsList) {
    if (nsList.hasOwnProperty(name)) {
        KifeJS.log("已注册: " + name + " v" + nsList[name].version);
    }
}
```

---

## 七、完整的命名约定

```
命名              说明                         示例
────────────────────────────────────────────────────
__命名空间        顶层全局对象                  __app
__命名空间_子     下划线嵌套                    __app_config
__命名空间.子     点语法嵌套                    __app.config

_私有变量         不稳定/内部使用               _tempData
$库名             工具库                       $stringFormat

KifeJS*           保留（KifeJS API）           KifeJS.log
EventBus/Store    约定的全局服务名              EventBus

onEvent           回调函数前缀                  onPlayerJoin
handleEvent       事件处理器前缀                handleMessage
is*               布尔值查询                    isEnabled
get*              取值方法                      getConfig
set*              设值方法                      setConfig
```

---

## 八、避免冲突的检查模式

在注册命名空间前检查是否已存在：

```javascript
// 安全注册模式
function registerNamespace(name, impl) {
    // 检查命名空间
    if (typeof globalThis[name] !== "undefined") {
        KifeJS.log("[命名空间] 冲突: " + name + " 已被占用");
        if (typeof EventBus !== "undefined") {
            EventBus.emit("namespace:conflict", { name: name });
        }
        return false;
    }

    // 注册到注册表
    if (typeof globalThis.__namespaceRegistry !== "undefined") {
        globalThis.__namespaceRegistry.register(name, "1.0.0");
    }

    // 设置命名空间
    globalThis[name] = impl;
    KifeJS.log("[命名空间] 注册成功: " + name);
    return true;
}

// 使用
registerNamespace("__myModule", {
    version: "1.0.0",
    doSomething: function() { KifeJS.log("工作"); }
});
```

---

## 九、最佳实践总结

| 原则 | 说明 |
|------|------|
| **使用双下划线前缀** | `__脚本名` 是推荐的命名空间格式 |
| **保持一致性** | 文件名与命名空间名对齐 |
| **注册表管理** | 在一个中心位置注册所有命名空间 |
| **避免全局变量泛滥** | 宁可少暴露，多使用 `EventBus` |
| **重载时重新注册** | 每次 reload 后重新设置全局变量 |
| **及时清理** | reload 时自动清理，无需手动注销 |

---

## 下一步

- [状态管理与重载策略](06-state-lifecycle.md) — 处理 reload 时的状态保持
