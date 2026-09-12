# 定时任务与调度

> **文档索引:** `07-advanced-patterns/01-timers.md`
>
> 使用 JavaScript 原生定时器在 KifeJS 中执行定时任务。

---

## 一、支持的定时器

KossJS 引擎支持标准 JavaScript 定时器（基于引擎实现）：

| 函数 | 用途 | 说明 |
|------|------|------|
| `setTimeout(fn, ms)` | 延迟执行 | 指定毫秒后执行一次 |
| `setInterval(fn, ms)` | 间隔执行 | 每隔指定毫秒执行一次 |
| `clearTimeout(id)` | 取消延迟 | 取消已创建的 setTimeout |
| `clearInterval(id)` | 取消间隔 | 取消已创建的 setInterval |

---

## 二、基础用法

### setTimeout — 延迟执行

```javascript
// 5 秒后执行
setTimeout(function() {
    KifeJS.log("5 秒已过");
}, 5000);

// 带参数的延迟
setTimeout(function(name) {
    KifeJS.log("你好, " + name);
}, 2000, "Steve");
```

### setInterval — 间隔执行

```javascript
// 每 10 秒执行一次
var intervalId = setInterval(function() {
    KifeJS.log("定时任务执行");
}, 10000);

// 30 秒后停止
setTimeout(function() {
    clearInterval(intervalId);
    KifeJS.log("定时任务已停止");
}, 30000);
```

---

## 三、定时器管理模式

### 集中管理

```javascript
// 集中管理所有定时器
globalThis.__timerManager = {
    _timers: [],

    setTimeout: function(fn, delay) {
        var id = setTimeout(fn, delay);
        this._timers.push({
            id: id,
            type: "timeout",
            created: Date.now()
        });
        return id;
    },

    setInterval: function(fn, interval) {
        var id = setInterval(fn, interval);
        this._timers.push({
            id: id,
            type: "interval",
            created: Date.now(),
            interval: interval
        });
        return id;
    },

    clearAll: function() {
        for (var i = 0; i < this._timers.length; i++) {
            var t = this._timers[i];
            if (t.type === "timeout") {
                clearTimeout(t.id);
            } else {
                clearInterval(t.id);
            }
        }
        this._timers = [];
        KifeJS.log("[定时器] 已清除 " + this._timers.length + " 个定时器");
    },

    count: function() {
        return this._timers.length;
    }
};

// 使用管理器
globalThis.__timerManager.setTimeout(function() {
    KifeJS.log("一次性任务");
}, 5000);

globalThis.__timerManager.setInterval(function() {
    KifeJS.log("循环任务");
}, 30000);
```

### 命名的定时任务

```javascript
globalThis.__namedTimers = {
    _tasks: {},

    create: function(name, fn, intervalMs) {
        if (this._tasks[name]) {
            KifeJS.log("[定时器] 任务已存在: " + name + "，先停止旧任务");
            this.stop(name);
        }

        var id = setInterval(fn, intervalMs);
        this._tasks[name] = {
            id: id,
            interval: intervalMs,
            startTime: Date.now(),
            runCount: 0
        };

        KifeJS.log("[定时器] 创建任务: " + name + " (间隔: " + intervalMs + "ms)");
        return id;
    },

    stop: function(name) {
        var task = this._tasks[name];
        if (task) {
            clearInterval(task.id);
            delete this._tasks[name];
            KifeJS.log("[定时器] 停止任务: " + name
                + " (运行 " + task.runCount + " 次, 持续 "
                + (Date.now() - task.startTime) + "ms)");
        }
    },

    stopAll: function() {
        var names = [];
        for (var name in this._tasks) {
            if (this._tasks.hasOwnProperty(name)) {
                names.push(name);
            }
        }
        for (var i = 0; i < names.length; i++) {
            this.stop(names[i]);
        }
    },

    list: function() {
        var result = {};
        for (var name in this._tasks) {
            if (this._tasks.hasOwnProperty(name)) {
                var t = this._tasks[name];
                result[name] = {
                    interval: t.interval,
                    runCount: t.runCount,
                    uptime: Date.now() - t.startTime
                };
            }
        }
        return result;
    }
};

// 使用命名定时器
globalThis.__namedTimers.create("announcer", function() {
    KifeJS.broadcast("这是一条定时广播");
}, 120000);  // 每 2 分钟

globalThis.__namedTimers.create("checker", function() {
    KifeJS.log("状态检查...");
}, 60000);

// 停止特定任务
setTimeout(function() {
    globalThis.__namedTimers.stop("checker");
}, 300000);  // 5 分钟后停止检查

// 查看所有任务
KifeJS.log("活动任务: " + JSON.stringify(globalThis.__namedTimers.list()));
```

---

## 四、计时器模式

### 模式 1：固定间隔广播

```javascript
// 每 60 秒广播一次服务器信息
globalThis.__namedTimers.create("server-announce", function() {
    var uptime = Math.floor((Date.now() - globalThis.__startTime) / 1000);
    var mins = Math.floor(uptime / 60);
    var secs = uptime % 60;
    KifeJS.broadcast("服务器已运行 " + mins + " 分 " + secs + " 秒");
}, 60000);
```

### 模式 2：延迟启动（等待依赖就绪）

```javascript
// 延迟 3 秒后启动，确保其他脚本已加载
setTimeout(function() {
    if (typeof EventBus !== "undefined") {
        EventBus.emit("system:delayed-start", { delay: 3000 });
    } else {
        KifeJS.log("[启动] EventBus 不可用");
    }
}, 3000);
```

### 模式 3：限速执行（throttle）

```javascript
// 即使 setInterval 设置很短，实际执行也不超过限制
globalThis.__namedTimers.create("throttled-task", function() {
    var now = Date.now();
    if (globalThis.__lastRun && (now - globalThis.__lastRun < 5000)) {
        return;  // 最少间隔 5 秒
    }
    globalThis.__lastRun = now;
    KifeJS.log("限速任务执行");
}, 1000);  // 虽然每秒触发，但实际每 5 秒执行一次
```

### 模式 4：指数退避重试

```javascript
// 任务失败后递增重试间隔
function retryWithBackoff(fn, maxRetries) {
    var attempt = 0;

    function tryIt() {
        try {
            fn(attempt);
            KifeJS.log("[重试] 第 " + (attempt + 1) + " 次尝试成功");
        } catch (e) {
            attempt++;
            if (attempt < maxRetries) {
                var delay = Math.min(1000 * Math.pow(2, attempt), 30000);
                KifeJS.log("[重试] 失败 (" + e.message + "), " + delay + "ms 后重试 (" + attempt + "/" + maxRetries + ")");
                setTimeout(tryIt, delay);
            } else {
                KifeJS.log("[重试] 已达最大重试次数 (" + maxRetries + ")，放弃");
            }
        }
    }

    tryIt();
}

// 使用
retryWithBackoff(function(attempt) {
    // 模拟可能失败的操作
    if (Math.random() < 0.7) {
        throw new Error("随机失败");
    }
    KifeJS.log("操作成功 (尝试 " + (attempt + 1) + ")");
}, 5);
```

### 模式 5：周期性健康检查

```javascript
globalThis.__healthCheck = {
    checks: {},

    register: function(name, checkFn, intervalMs) {
        this.checks[name] = {
            fn: checkFn,
            lastOk: null,
            lastFail: null,
            failCount: 0
        };

        setInterval(function() {
            try {
                checkFn();
                this.checks[name].lastOk = Date.now();
                this.checks[name].failCount = 0;
            } catch (e) {
                this.checks[name].lastFail = Date.now();
                this.checks[name].failCount++;
                KifeJS.log("[健康] 检查失败: " + name + " - " + e.message);

                if (this.checks[name].failCount >= 3) {
                    KifeJS.log("[健康] 严重: " + name + " 连续失败 " + this.checks[name].failCount + " 次");
                }
            }
        }.bind(this), intervalMs);
    },

    report: function() {
        var result = {};
        for (var name in this.checks) {
            if (this.checks.hasOwnProperty(name)) {
                var c = this.checks[name];
                result[name] = {
                    healthy: c.lastFail === null || (c.lastOk > c.lastFail),
                    lastOk: c.lastOk,
                    failures: c.failCount
                };
            }
        }
        return result;
    }
};

// 注册健康检查
globalThis.__healthCheck.register("eventBus", function() {
    if (typeof EventBus === "undefined" || typeof EventBus.emit !== "function") {
        throw new Error("EventBus 不可用");
    }
}, 30000);

globalThis.__healthCheck.register("store", function() {
    if (typeof globalThis.__store === "undefined") {
        throw new Error("数据仓库不可用");
    }
    var stats = globalThis.__store.stats();
    if (stats.entries < 0) {
        throw new Error("数据异常");
    }
}, 60000);
```

---

## 五、性能和注意事项

### 最小间隔

```javascript
// 不建议使用太短的间隔
setInterval(function() {
    // 避免 < 1000ms 的间隔
}, 100);  // ❌ 太频繁

setInterval(function() {
    // 建议 >= 1000ms
}, 1000); // ✅ 合理
```

### CPU 占用

频繁的定时器会影响服务器性能：

| 间隔 | 每秒执行 | 影响 |
|------|---------|------|
| 50ms | 20 次 | 高 — 不推荐 |
| 100ms | 10 次 | 中 — 谨慎使用 |
| 1000ms | 1 次 | 低 — 安全 |
| 5000ms+ | 0.2 次 | 极低 — 推荐 |

### 定时器生命周期

```javascript
// 建议的完整定时器模式
function createSafeInterval(fn, intervalMs, name) {
    var id = setInterval(function() {
        try {
            fn();
        } catch (e) {
            KifeJS.log("[定时器] " + name + " 错误: " + e.message);
        }
    }, intervalMs);

    // 注册以便重载时清理
    globalThis.__timerManager._timers.push({
        id: id,
        type: "interval",
        name: name || "unnamed"
    });

    KifeJS.log("[定时器] 已创建: " + (name || "unnamed") + " (" + intervalMs + "ms)");
    return id;
}
```

---

## 六、重载与定时器

**重要:** 每次 `/kifejs reload` 会销毁旧引擎，**所有定时器自动失效**。新引擎中需要重新创建定时器。

```javascript
// 在重载后自动重启定时器
(function() {
    "use strict";

    // 延迟 1 秒确保所有脚本加载完成
    setTimeout(function() {
        globalThis.__namedTimers.create("post-reload-task", function() {
            KifeJS.log("重载后的定时任务");
        }, 60000);
    }, 1000);
})();
```

---

## 下一步

- [模块化组织](02-module-organization.md)
- [生命周期钩子](03-lifecycle-hooks.md)
