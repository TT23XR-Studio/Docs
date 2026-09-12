# API 组合使用模式

> **文档索引:** `04-api-reference/06-combined-usage.md`
>
> 将 KifeJS 的 API 组合起来，构建完整的脚本行为。

---

## 一、API 回顾

| API | 核心作用 |
|-----|---------|
| `KifeJS.log(msg)` | 记录日志 |
| `KifeJS.broadcast(msg)` | 广播消息 |
| `KifeJSConfig` | 全局配置开关 |
| `KifeEvent` | 事件基础单元 |
| `__kife_current_script` | 当前脚本标识 |
| `scriptConfigPath` | 配置路径指示 |

---

## 二、组合模式

### 模式 1：日志 + 广播 — 公告系统

```javascript
// announcer.js：公告系统
function announce(message, important) {
    // 记录日志
    KifeJS.log("[公告] " + message);

    // 广播
    KifeJS.broadcast(message);

    // 如果重要，额外标记
    if (important) {
        KifeJS.log("[重要] " + message);
    }
}

// 使用
announce("服务器已启动", true);
announce("在线玩家: 10 人");
```

### 模式 2：配置 + 日志 — 条件执行

```javascript
// feature-control.js：特性开关
function runIfEnabled(featureName, fn) {
    // 从 KifeJSConfig 读取特性配置
    var feature = KifeJSConfig && KifeJSConfig.features
        ? KifeJSConfig.features[featureName]
        : null;

    if (feature && feature.enabled === false) {
        KifeJS.log("[" + __kife_current_script + "] 特性已禁用: " + featureName);
        return;
    }

    KifeJS.log("[" + __kife_current_script + "] 执行特性: " + featureName);
    fn(feature || {});
}

// 先设置配置
KifeJSConfig.features = KifeJSConfig.features || {};
KifeJSConfig.features.greeter = { enabled: true, message: "欢迎" };
KifeJSConfig.features.broadcaster = { enabled: false };

// 使用
runIfEnabled("greeter", function(cfg) {
    KifeJS.log(cfg.message);
});

runIfEnabled("broadcaster", function(cfg) {
    KifeJS.broadcast("这条不会被执行");
});
```

### 模式 3：事件 + 配置 + 日志 — 完整模块

```javascript
// event-module.js：基于事件的模块系统
function createModule(name, defaultConfig) {
    // 读取配置
    var config = defaultConfig || {};
    if (KifeJSConfig && KifeJSConfig.modules && KifeJSConfig.modules[name]) {
        for (var k in KifeJSConfig.modules[name]) {
            config[k] = KifeJSConfig.modules[name][k];
        }
    }

    KifeJS.log("[" + name + "] 模块初始化完成");
    KifeJS.log("[" + name + "] 配置: " + JSON.stringify(config));

    return {
        name: name,
        config: config,

        handleEvent: function(eventType, data) {
            var event = new KifeEvent();
            KifeJS.log("[" + name + "] 收到事件: " + eventType);

            // 事件处理逻辑
            if (config.enabled === false) {
                event.cancel();
                KifeJS.log("[" + name + "] 模块已禁用，事件取消");
            }

            return event;
        }
    };
}

// 设置配置
KifeJSConfig.modules = {
    chatLogger: { enabled: true },
    adminNotifier: { enabled: false }
};

// 创建模块
var chatLogger = createModule("chatLogger", { enabled: false });
var adminNotifier = createModule("adminNotifier", { enabled: true });
```

### 模式 4：脚本变量 + 日志 — 自感知模块

```javascript
// 通用模块模式：每个脚本自注册到全局
(function() {
    var name = __kife_current_script;
    var configVar = "__" + name + "Config";
    var config = typeof globalThis[configVar] !== "undefined" ? globalThis[configVar] : {};

    // 注册到全局模块系统
    globalThis.__modules = globalThis.__modules || {};
    globalThis.__modules[name] = {
        name: name,
        config: config,
        startTime: Date.now(),
        log: function(msg) {
            KifeJS.log("[" + name + "] " + msg);
        },
        broadcast: function(msg) {
            KifeJS.broadcast("[" + name + "] " + msg);
        }
    };

    globalThis.__modules[name].log("已注册");
})();
```

### 模式 5：完整的多 API 协作

```javascript
// system.js：综合系统
var System = {
    initialized: false,

    init: function() {
        if (this.initialized) return;

        // 1. 检查全局配置
        if (KifeJSConfig && KifeJSConfig.enabled === false) {
            KifeJS.log("系统禁用");
            return;
        }

        // 2. 注册脚本
        var scriptName = typeof __kife_current_script !== "undefined"
            ? __kife_current_script : "unknown";

        // 3. 加载配置
        var config = this.loadConfig();

        // 4. 初始化
        this.initialized = true;
        KifeJS.log("[" + scriptName + "] 系统初始化完成");
        KifeJS.log("[" + scriptName + "] 配置: " + JSON.stringify(config));

        // 5. 广播
        KifeJS.broadcast("系统已启动");

        return this;
    },

    loadConfig: function() {
        var config = {
            debug: false,
            interval: 120
        };

        if (typeof __appConfig !== "undefined") {
            for (var k in __appConfig) {
                config[k] = __appConfig[k];
            }
        }

        return config;
    },

    emit: function(eventType, data) {
        var event = KifeEventEx(eventType, data);
        KifeJS.log("[事件] " + eventType + ": " + JSON.stringify(data));
        return event;
    }
};

// 初始化
System.init();
```

---

## 三、API 调用链

```javascript
// 一个典型的调用链示例
(function() {
    var name = __kife_current_script;           // 1. 获取脚本名

    KifeJS.log("[" + name + "] 开始执行");       // 2. 记录日志

    if (KifeJSConfig && KifeJSConfig.enabled) {  // 3. 检查配置
        KifeJS.broadcast("[" + name + "] 运行"); // 4. 广播
        var evt = new KifeEvent();               // 5. 创建事件
        KifeJS.log("[" + name + "] 完成");       // 6. 日志结束
    }
})();
```

---

## 四、组合使用注意事项

| 组合 | 注意点 |
|------|--------|
| log + broadcast | broadcast 当前仅记录日志，但未来可能真正广播 |
| KifeJSConfig + 其他 API | 每次 reload 后 KifeJSConfig 重置 |
| KifeEvent + 其他 API | 需手动跟踪取消状态 |
| __kife_current_script + 任何 API | 确保在顶层作用域读取 |
| scriptConfigPath + 配置 | 当前版本需配合全局变量使用配置 |

---

## 下一步

- 深入 [事件系统](../05-event-system/01-concepts.md)
- 学习 [跨脚本通信](../06-cross-script/01-global-scope.md)
