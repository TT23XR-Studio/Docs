# 直接 API 调用

> **文档索引:** `06-cross-script/02-direct-api.md`
>
> 一个脚本直接调用另一个脚本定义的函数或方法。这是最直接、最高效的跨脚本通信方式。

---

## 一、基础模式

通过全局作用域暴露函数，其他脚本直接调用。

### 提供者脚本

```javascript
// 脚本: 1-calculator.js
globalThis.__calc = {
    add: function(a, b) {
        return a + b;
    },

    multiply: function(a, b) {
        return a * b;
    },

    formatNumber: function(n) {
        return n.toFixed(2);
    }
};

KifeJS.log("[calculator] API 已注册");
```

### 消费者脚本

```javascript
// 脚本: a-report.js
function generateReport(count, price) {
    // 直接调用 calculator 提供的 API
    var total = globalThis.__calc.multiply(count, price);
    var formatted = globalThis.__calc.formatNumber(total);
    KifeJS.log("总价: " + formatted);
}

generateReport(10, 29.99);
```

---

## 二、服务注册模式

### 注册中心

```javascript
// 脚本: 0-service-registry.js
globalThis.__services = {
    _registry: {},

    // 注册服务
    register: function(name, implementation) {
        if (this._registry[name]) {
            KifeJS.log("[服务注册] 警告: 服务已存在: " + name);
        }
        this._registry[name] = implementation;
        KifeJS.log("[服务注册] 注册: " + name);
    },

    // 获取服务
    get: function(name) {
        var svc = this._registry[name];
        if (!svc) {
            KifeJS.log("[服务注册] 服务不存在: " + name);
            return null;
        }
        return svc;
    },

    // 检查服务是否可用
    has: function(name) {
        return !!this._registry[name];
    },

    // 列出所有服务
    list: function() {
        var names = [];
        for (var key in this._registry) {
            if (this._registry.hasOwnProperty(key)) {
                names.push(key);
            }
        }
        return names;
    }
};

KifeJS.log("[服务注册] 已初始化");
```

### 服务提供者

```javascript
// 脚本: b-logger-service.js
var LoggerService = {
    level: "INFO",
    log: function(msg) {
        KifeJS.log("[Logger] " + msg);
    },
    warn: function(msg) {
        KifeJS.log("[WARN] " + msg);
    },
    error: function(msg) {
        KifeJS.log("[ERROR] " + msg);
    },
    setLevel: function(level) {
        this.level = level;
    }
};

globalThis.__services.register("logger", LoggerService);
```

### 服务消费者

```javascript
// 脚本: c-feature.js
function doWork() {
    var logger = globalThis.__services.get("logger");
    if (logger) {
        logger.log("功能开始执行");
        logger.warn("请注意：测试模式");
    } else {
        KifeJS.log("未找到日志服务");
    }
}

doWork();
```

---

## 三、回调模式

一个脚本向另一个脚本注册回调函数。

```javascript
// 脚本: 1-event-source.js
globalThis.__source = {
    _callbacks: [],

    onUpdate: function(callback) {
        if (typeof callback === "function") {
            this._callbacks.push(callback);
            KifeJS.log("[source] 注册回调");
        }
    },

    _notify: function(data) {
        KifeJS.log("[source] 通知 " + this._callbacks.length + " 个监听器");
        for (var i = 0; i < this._callbacks.length; i++) {
            try {
                this._callbacks[i](data);
            } catch (e) {
                KifeJS.log("[source] 回调错误: " + e.message);
            }
        }
    }
};

// 模拟更新
globalThis.__source._notify({ event: "update", value: 42 });

// 脚本: a-listener.js
globalThis.__source.onUpdate(function(data) {
    KifeJS.log("[listener] 收到更新: " + JSON.stringify(data));
});
```

---

## 四、工厂模式

一个脚本提供工厂函数，其他脚本创建实例。

```javascript
// 脚本: 1-timer-factory.js
globalThis.__timerFactory = {
    createTimer: function(name, interval, callback) {
        if (!name || typeof callback !== "function") {
            KifeJS.log("[timerFactory] 参数无效");
            return null;
        }

        var timer = {
            name: name,
            interval: interval || 60,
            callback: callback,
            _id: null,

            start: function() {
                var self = this;
                KifeJS.log("[timer] 启动: " + this.name + " (间隔: " + this.interval + "s)");
                this._id = setInterval(function() {
                    self.callback(self);
                }, this.interval * 1000);
            },

            stop: function() {
                if (this._id) {
                    clearInterval(this._id);
                    this._id = null;
                    KifeJS.log("[timer] 停止: " + this.name);
                }
            }
        };

        return timer;
    }
};

// 脚本: b-announcer.js
var announcer = globalThis.__timerFactory.createTimer(
    "announcer",
    120,
    function(timer) {
        KifeJS.broadcast("这是来自 " + timer.name + " 定时器");
    }
);

announcer.start();
```

---

## 五、依赖注入模式

自动将依赖注入到脚本函数中。

```javascript
// 脚本: 0-di-container.js
globalThis.__di = {
    _dependencies: {},

    register: function(name, dep) {
        this._dependencies[name] = dep;
    },

    resolve: function(fn) {
        // 从函数参数名解析依赖
        var fnStr = fn.toString();
        var argMatch = fnStr.match(/function\s*\(([^)]*)\)/);
        if (!argMatch) return fn();

        var argNames = argMatch[1].split(",").map(function(a) { return a.trim(); });
        var args = [];

        for (var i = 0; i < argNames.length; i++) {
            var dep = this._dependencies[argNames[i]];
            if (dep) {
                args.push(dep);
            } else {
                KifeJS.log("[DI] 警告: 无法解析 " + argNames[i]);
                args.push(null);
            }
        }

        return fn.apply(null, args);
    }
};

// 注册依赖
globalThis.__di.register("logger", {
    info: function(msg) { KifeJS.log("[INFO] " + msg); }
});
globalThis.__di.register("config", { serverName: "MyServer" });

// 脚本: b-feature.js
globalThis.__di.resolve(function(logger, config) {
    if (logger) {
        logger.info("服务器: " + (config ? config.serverName : "unknown"));
    }
});
```

---

## 六、API 版本管理

当 API 可能变化时，使用版本管理确保兼容性：

```javascript
// 脚本: b-api-v1.js
globalThis.__api = {
    version: "1.0.0",

    // v1 API
    greet: function(name) {
        return "你好, " + name;
    },

    // 兼容性检查
    getVersion: function() {
        return this.version;
    }
};

// 消费者
var api = globalThis.__api;
if (api && typeof api.greet === "function") {
    var msg = api.greet("Steve");
    KifeJS.log(msg);
} else {
    KifeJS.log("[错误] API 版本不兼容");
}
```

---

## 七、错误处理

```javascript
// 消费者脚本中的安全调用模式
function safeCall(serviceName, methodName) {
    var service = globalThis.__services
        ? globalThis.__services.get(serviceName)
        : null;

    if (!service) {
        KifeJS.log("[安全调用] 服务不可用: " + serviceName);
        return null;
    }

    var fn = service[methodName];
    if (typeof fn !== "function") {
        KifeJS.log("[安全调用] 方法不可用: " + serviceName + "." + methodName);
        return null;
    }

    try {
        var args = Array.prototype.slice.call(arguments, 2);
        return fn.apply(service, args);
    } catch (e) {
        KifeJS.log("[安全调用] 错误: " + serviceName + "." + methodName + " - " + e.message);
        return null;
    }
}

// 使用
var result = safeCall("logger", "log", "安全调用测试");
```

---

## 八、直接 API 调用 vs 事件驱动

| 维度 | 直接 API 调用 | 事件驱动 |
|------|--------------|---------|
| **耦合度** | 高（调用方需知道接口） | 低（通过事件总线） |
| **性能** | 高（直接函数调用） | 稍低（事件对象创建） |
| **返回值** | 支持（获取结果） | 不支持（单向通知） |
| **调试** | 简单（直接调用链） | 较难（追踪事件流） |
| **扩展性** | 新增调用方需修改代码 | 新增监听器无需修改 |
| **适用场景** | 明确的服务调用 | 解耦的通知/广播 |

---

## 下一步

- [事件驱动通信](03-event-driven.md) — 通过事件总线解耦
- [数据仓库模式](04-data-repository.md)
