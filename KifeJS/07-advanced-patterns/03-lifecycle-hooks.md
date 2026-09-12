# 生命周期钩子

> **文档索引:** `07-advanced-patterns/03-lifecycle-hooks.md`
>
> 在脚本的不同生命周期阶段执行特定代码。

---

## 一、KifeJS 脚本生命周期

```
  模组初始化 (Minecraft 启动)
       │
       ▼
  ① 引擎创建 (ScriptRuntime 初始化)
       │  └─ registerApi() — 注册 KifeJS API
       ▼
  ② 脚本发现 (ScriptScanner 扫描目录)
       │
       ▼
  ③ 脚本执行 (逐个执行)
       │  ├─ 设置 __kife_current_script
       │  ├─ 设置 scriptConfigPath
       │  └─ runFile(entryPoint)
       ▼
  ④ 运行时 (脚本主动运行)
       │
       ▼
  ⑤ 重载触发
       │  └─ "/kifejs reload"
       ▼
  ⑥ 引擎销毁 (closeRuntime)
       │  └─ koss.close()
       ▼
  回到步骤 ①
```

---

## 二、钩子系统

### 注册钩子

```javascript
// 脚本: 0-lifecycle.js
globalThis.__lifecycle = {
    _hooks: {},

    // 注册生命周期钩子
    on: function(phase, handler) {
        if (!this._hooks[phase]) {
            this._hooks[phase] = [];
        }
        this._hooks[phase].push(handler);
        KifeJS.log("[生命周期] 注册钩子: " + phase + " (总计: " + this._hooks[phase].length + ")");
    },

    // 触发钩子
    trigger: function(phase, data) {
        var handlers = this._hooks[phase] || [];
        KifeJS.log("[生命周期] 触发: " + phase + " (" + handlers.length + " 个钩子)");

        for (var i = 0; i < handlers.length; i++) {
            try {
                handlers[i](data || {});
            } catch (e) {
                KifeJS.log("[生命周期] 钩子错误 (" + phase + "): " + e.message);
            }
        }
    }
};

// 可用的生命周期阶段
var PHASES = {
    ENGINE_START: "engine:start",       // 引擎启动
    SCRIPTS_LOADED: "scripts:loaded",    // 所有脚本加载完成
    BEFORE_RELOAD: "before:reload",      // 重载前
    AFTER_RELOAD: "after:reload",        // 重载后
    SHUTDOWN: "system:shutdown"          // 关闭
};
```

### 使用钩子

```javascript
// 脚本: a-module.js

// 1. 在所有脚本加载完成后执行
globalThis.__lifecycle.on("scripts:loaded", function() {
    KifeJS.log("[模块] 所有脚本已加载，开始初始化");
    // 执行需要跨脚本依赖的操作
});

// 2. 在重载前保存状态
globalThis.__lifecycle.on("before:reload", function() {
    KifeJS.log("[模块] 准备重载，保存状态");
    // 保存需要持久化的状态
});

// 3. 在重载后恢复状态
globalThis.__lifecycle.on("after:reload", function() {
    KifeJS.log("[模块] 重载完成，恢复状态");
    // 从保存的位置恢复状态
});
```

---

## 三、模块钩子

### 模块级别的 init/start/stop

```javascript
// 为模块注册标准生命周期方法
globalThis.__moduleSystem = {
    _modules: {},

    register: function(name, module) {
        this._modules[name] = module;
        KifeJS.log("[模块系统] 注册: " + name);

        // 如果提供了 init 方法，立即调用
        if (typeof module.init === "function") {
            try {
                module.init();
            } catch (e) {
                KifeJS.log("[模块系统] " + name + " init 错误: " + e.message);
            }
        }
    },

    startAll: function() {
        for (var name in this._modules) {
            if (this._modules.hasOwnProperty(name)) {
                var mod = this._modules[name];
                if (typeof mod.start === "function") {
                    try {
                        mod.start();
                        KifeJS.log("[模块系统] 启动: " + name);
                    } catch (e) {
                        KifeJS.log("[模块系统] " + name + " start 错误: " + e.message);
                    }
                }
            }
        }
    },

    stopAll: function() {
        for (var name in this._modules) {
            if (this._modules.hasOwnProperty(name)) {
                var mod = this._modules[name];
                if (typeof mod.stop === "function") {
                    try {
                        mod.stop();
                        KifeJS.log("[模块系统] 停止: " + name);
                    } catch (e) {
                        KifeJS.log("[模块系统] " + name + " stop 错误: " + e.message);
                    }
                }
            }
        }
    }
};

// 模块定义
var loggerModule = {
    name: "logger",

    init: function() {
        this.logs = [];
        KifeJS.log("[logger] 初始化");
    },

    start: function() {
        this._timer = setInterval(function() {
            KifeJS.log("[logger] 心跳");
        }, 60000);
        KifeJS.log("[logger] 已启动");
    },

    stop: function() {
        if (this._timer) {
            clearInterval(this._timer);
            this._timer = null;
        }
        KifeJS.log("[logger] 已停止");
    },

    log: function(msg) {
        this.logs.push(msg);
        KifeJS.log(msg);
    }
};

// 注册模块
globalThis.__moduleSystem.register("logger", loggerModule);

// 加载完成后启动所有模块
setTimeout(function() {
    globalThis.__moduleSystem.startAll();
}, 1000);
```

---

## 四、初始化完成通知

```javascript
// 使用 setTimeout 确保在所有脚本执行完成后通知
(function() {
    // 延迟 0 让当前执行栈清空（所有同步脚本执行完毕）
    setTimeout(function() {
        KifeJS.log("[系统] 所有脚本执行完毕");

        if (typeof globalThis.__lifecycle !== "undefined") {
            globalThis.__lifecycle.trigger("scripts:loaded", {
                timestamp: Date.now()
            });
        }

        if (typeof EventBus !== "undefined") {
            EventBus.emit("system:initialized", {
                timestamp: Date.now()
            });
        }
    }, 0);
})();
```

---

## 下一步

- [状态持久化](04-persistence.md)
- [性能优化](05-performance.md)
