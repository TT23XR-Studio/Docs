# 取消机制深度剖析

> **文档索引:** `05-event-system/04-cancellation-deep.md`
>
> 深入理解 KifeEvent.cancel() 的机制，以及如何在事件系统中有效使用事件取消。

---

## 一、KifeEvent.cancel() 的底层机制

### Java 层实现

```java
// ScriptRuntime.java - 注册 KifeEvent 类
koss.registerClass("KifeEvent", Map.of("cancel", args -> "cancelled"));
```

- `KifeEvent` 是一个注册到 JS 引擎的**Java 类**
- 它只有一个方法 `cancel()`，固定返回字符串 `"cancelled"`
- 该方法**不会自动设置任何取消状态** —— 它只是一个信号发送器

### JavaScript 层调用

```javascript
var event = new KifeEvent();
var result = event.cancel();
// result === "cancelled"

// 注意: event.cancelled 是 undefined！
// KifeEvent 不会自动跟踪取消状态
```

### 为什么这样设计？

这种"最小功能"设计遵循了**桥接模式**的原则：

1. Java 端的 `cancel()` 仅负责向 Java 层发送"已取消"信号（预留未来扩展）
2. 取消状态的跟踪委托给 JS 层，由用户代码管理
3. 保持跨语言调用的简单性和可预测性

---

## 二、取消状态的跟踪方式

### 方式 1：外部变量跟踪（基础）

```javascript
function createCancellableEvent(type, data) {
    var _cancelled = false;

    return {
        type: type,
        data: data || {},
        cancel: function() {
            _cancelled = true;
            new KifeEvent().cancel();  // 调用 Java 端（预留）
            KifeJS.log("[事件] 已取消: " + type);
        },
        isCancelled: function() {
            return _cancelled;
        }
    };
}
```

### 方式 2：闭包属性（推荐）

```javascript
function BusEvent(type, data) {
    var cancelled = false;

    this.type = type;
    this.data = data || {};
    this.timestamp = Date.now();

    this.cancel = function() {
        if (!cancelled) {
            cancelled = true;
            try { new KifeEvent().cancel(); } catch(e) {}
            KifeJS.log("[BusEvent] 取消: " + type);
        }
    };

    this.isCancelled = function() {
        return cancelled;
    };
}

// 使用
var evt = new BusEvent("test", { value: 42 });
evt.cancel();
KifeJS.log("取消状态: " + evt.isCancelled());  // true
```

### 方式 3：原型链（性能优化）

```javascript
function CancellableEvent(type, data) {
    this.type = type;
    this.data = data || {};
    this.timestamp = Date.now();
    this._cancelled = false;
}

CancellableEvent.prototype.cancel = function() {
    if (!this._cancelled) {
        this._cancelled = true;
        try { new KifeEvent().cancel(); } catch(e) {}
    }
};

CancellableEvent.prototype.isCancelled = function() {
    return this._cancelled;
};

// 使用
var evt = new CancellableEvent("test", { value: 42 });
evt.cancel();
```

---

## 三、取消传播模式

### 模式 1：冒泡取消

事件被取消后，沿监听器链反向通知：

```javascript
var BubbleBus = (function() {
    var listeners = {};

    return {
        on: function(type, handler, priority) {
            if (!listeners[type]) listeners[type] = [];
            listeners[type].push({ handler: handler, priority: priority || 100 });
            listeners[type].sort(function(a, b) { return a.priority - b.priority; });
        },

        emit: function(type, data) {
            var entries = listeners[type];
            if (!entries) return true;

            var event = {
                type: type,
                data: data || {},
                _cancelled: false,
                _cancelStack: [],

                cancel: function(reason) {
                    if (!this._cancelled) {
                        this._cancelled = true;
                        this._cancelStack.push({
                            listener: __kife_current_script,
                            reason: reason || "无原因",
                            time: Date.now()
                        });
                        try { new KifeEvent().cancel(); } catch(e) {}
                    }
                },

                isCancelled: function() { return this._cancelled; },
                getCancelStack: function() { return this._cancelStack; }
            };

            for (var i = 0; i < entries.length; i++) {
                if (event._cancelled) break;
                try {
                    entries[i].handler(event);
                } catch (e) {
                    KifeJS.log("[BubbleBus] 错误: " + e.message);
                }
            }

            // 如果取消，记录取消链
            if (event._cancelled) {
                KifeJS.log("[BubbleBus] 取消链: " + JSON.stringify(event._cancelStack));
            }

            return !event._cancelled;
        }
    };
})();

// 使用
BubbleBus.on("action:delete", function(e) {
    if (e.data.file === "important.txt") {
        e.cancel("文件受保护");
    }
}, 50);

var success = BubbleBus.emit("action:delete", { file: "important.txt" });
// 日志: [BubbleBus] 取消链: [{"listener":"core","reason":"文件受保护","time":...}]
```

### 模式 2：级联取消

一个事件的取消触发另一个事件的取消：

```javascript
var CascadeBus = (function() {
    // ...（基本同 BubbleBus）

    return {
        // ...
        emit: function(type, data) {
            // 派发前检查依赖
            if (this._isBlocked(type)) {
                KifeJS.log("[CascadeBus] 事件被阻塞: " + type);
                return false;
            }

            var event = createCancellableEvent(type, data);
            // ... 派发逻辑 ...

            // 如果取消，触发取消事件
            if (event.isCancelled()) {
                this.emit("system:event-cancelled", {
                    originalEvent: type,
                    data: data
                });
            }

            return !event.isCancelled();
        },

        _isBlocked: function(type) {
            // 如果 parent 取消，child 也被阻塞
            var blockMap = {
                "order:ship": "order:create",  // 如果订单未创建，不能发货
                "payment:refund": "payment:process"  // 如果未处理付款，不能退款
            };
            var dependency = blockMap[type];
            if (dependency) {
                // 检查依赖事件状态
            }
            return false;
        }
    };
})();
```

---

## 四、取消链追踪

对于复杂的事件系统，追踪谁取消了事件以及原因非常有用：

```javascript
var TracingBus = (function() {
    var listeners = {};
    var eventLog = [];

    return {
        on: function(type, handler) {
            // ...
        },

        emit: function(type, data) {
            var entries = listeners[type];
            if (!entries) return true;

            var event = {
                type: type,
                data: data || {},
                _cancelled: false,
                _cancelledBy: null,
                _cancelReason: null,

                cancel: function(reason) {
                    if (!this._cancelled) {
                        this._cancelled = true;
                        this._cancelledBy = __kife_current_script;
                        this._cancelReason = reason || "未指定原因";
                        try { new KifeEvent().cancel(); } catch(e) {}
                    }
                },

                isCancelled: function() { return this._cancelled; }
            };

            for (var i = 0; i < entries.length; i++) {
                if (event._cancelled) break;
                try { entries[i].handler(event); } catch(e) {
                    KifeJS.log("[TracingBus] 错误: " + e.message);
                }
            }

            // 记录事件日志
            eventLog.push({
                type: type,
                timestamp: Date.now(),
                cancelled: event._cancelled,
                cancelledBy: event._cancelledBy,
                cancelReason: event._cancelReason
            });

            // 保留最近 100 条记录
            if (eventLog.length > 100) {
                eventLog.shift();
            }

            return !event._cancelled;
        },

        getLog: function() {
            return eventLog;
        },

        printLog: function() {
            for (var i = 0; i < eventLog.length; i++) {
                var entry = eventLog[i];
                var status = entry.cancelled
                    ? "[取消] 由 " + entry.cancelledBy + " 取消: " + entry.cancelReason
                    : "[成功]";
                KifeJS.log("[事件日志] " + entry.type + " " + status);
            }
        }
    };
})();
```

---

## 五、取消的取消（逆转取消）

在某些场景下，可能需要"取消取消"：

```javascript
var RevocableBus = (function() {
    var listeners = {};

    function RevocableEvent(type, data) {
        this.type = type;
        this.data = data || {};
        this._cancelled = false;
        this._cancellations = [];  // 取消记录栈
    }

    RevocableEvent.prototype.cancel = function(reason) {
        this._cancelled = true;
        this._cancellations.push({
            cancelledAt: Date.now(),
            reason: reason || "未指定",
            script: __kife_current_script
        });
        try { new KifeEvent().cancel(); } catch(e) {}
    };

    RevocableEvent.prototype.uncancel = function() {
        if (this._cancellations.length > 0) {
            this._cancellations.pop();
            this._cancelled = this._cancellations.length > 0;
            KifeJS.log("[RevocableBus] 取消已撤销，剩余取消: " + this._cancellations.length);
        }
    };

    RevocableEvent.prototype.isCancelled = function() {
        return this._cancelled;
    };

    return {
        on: function(type, handler) {
            // ...
        },
        emit: function(type, data) {
            // ...
        }
    };
})();
```

---

## 六、取消最佳实践

### 1. 尽早取消

```javascript
// ✅ 好：在优先级最高的监听器中做取消决策
EventBus.on("payment:process", function(e) {
    if (e.data.amount <= 0) {
        e.cancel("金额无效");
    }
}, 10);

// ❌ 差：在最后才取消，浪费了中间监听器的处理
EventBus.on("payment:process", function(e) {
    if (e.data.amount <= 0) {
        e.cancel("金额无效");
    }
}, 200);
```

### 2. 携带取消原因

```javascript
// ✅ 好：提供取消原因
event.cancel("余额不足");
// 或
event.cancel("权限不足: 需要 OP 级别");

// ❌ 差：无历史取原因
event.cancel();
```

### 3. 幂等性检查

```javascript
// ✅ 好：确保 cancel 只生效一次
cancel: function() {
    if (!this._cancelled) {
        this._cancelled = true;
        // 实际的取消逻辑
    }
}
```

### 4. 取消后不要继续处理

```javascript
// ✅ 好：检查状态后决定行为
EventBus.on("player:chat", function(e) {
    if (e.isCancelled()) {
        return;  // 已取消，不做任何事
    }
    // 处理消息...
});
```

### 5. 日志记录

```javascript
// ✅ 好：记录取消决策
EventBus.on("player:join", function(e) {
    if (isBanned(e.data.player)) {
        KifeJS.log("[安全] 阻止封禁玩家 " + e.data.player + " 加入");
        e.cancel("玩家已被封禁");
    }
});
```

---

## 七、取消模式决策表

| 场景 | 使用方式 | 优先级 |
|------|---------|--------|
| 安全检查/验证 | `cancel()` | 10（最高） |
| 权限检查 | `cancel()` | 20 |
| 限流/节流 | `cancel()` | 30 |
| 数据处理 | 修改 `event.data` | 50-100 |
| 日志记录 | 只读操作 | 200（最低） |
| 缓存命中 | `stopPropagation()` | 10 |
| 日志记录（不应被阻止） | 不检查 `isCancelled()` | — |

---

## 下一步

- 学习 [高级事件模式](05-advanced-patterns.md)
- 了解 [跨脚本通信](../06-cross-script/01-global-scope.md)
