# 构建事件总线

> **文档索引:** `05-event-system/02-building-event-bus.md`
>
> 从零开始构建一个完整的事件总线，包含注册、派发、取消、优先级等核心功能。

---

## 一、最小事件总线

最基本的实现：注册 + 派发。

```javascript
// 最小事件总线
var EventBus = {
    _listeners: {},

    // 注册监听器
    on: function(eventType, handler) {
        if (typeof handler !== "function") {
            KifeJS.log("[EventBus] 错误: handler 必须是函数");
            return;
        }
        if (!this._listeners[eventType]) {
            this._listeners[eventType] = [];
        }
        this._listeners[eventType].push(handler);
        KifeJS.log("[EventBus] 注册监听: " + eventType);
    },

    // 派发事件
    emit: function(eventType, data) {
        var handlers = this._listeners[eventType];
        if (!handlers || handlers.length === 0) {
            return true;  // 无监听器，事件处理成功
        }

        KifeJS.log("[EventBus] 派发事件: " + eventType);

        for (var i = 0; i < handlers.length; i++) {
            try {
                handlers[i]({ type: eventType, data: data || {} });
            } catch (e) {
                KifeJS.log("[EventBus] 监听器错误: " + e.message);
            }
        }

        return true;
    }
};
```

---

## 二、带取消支持的事件总线

引入 `KifeEvent` 的取消机制。

```javascript
// 事件辅助函数：创建带取消功能的增强事件
function createBusEvent(type, data) {
    var _cancelled = false;
    var _base = new KifeEvent();

    return {
        type: type,
        data: data || {},

        cancel: function() {
            _cancelled = true;
            _base.cancel();
            KifeJS.log("[EventBus] 事件已取消: " + type);
        },

        isCancelled: function() {
            return _cancelled;
        }
    };
}

var EventBus = {
    _listeners: {},

    on: function(eventType, handler) {
        if (!this._listeners[eventType]) {
            this._listeners[eventType] = [];
        }
        this._listeners[eventType].push(handler);
    },

    on: function(eventType, handler) {
        if (!this._listeners[eventType]) {
            this._listeners[eventType] = [];
        }
        this._listeners[eventType].push(handler);
    },

    off: function(eventType, handler) {
        var handlers = this._listeners[eventType];
        if (!handlers) return;

        if (handler) {
            // 移除特定监听器
            this._listeners[eventType] = handlers.filter(function(h) {
                return h !== handler;
            });
        } else {
            // 移除该类型的所有监听器
            delete this._listeners[eventType];
        }
    },

    emit: function(eventType, data) {
        var handlers = this._listeners[eventType];
        if (!handlers || handlers.length === 0) return true;

        var event = createBusEvent(eventType, data);
        KifeJS.log("[EventBus] 派发: " + eventType);

        for (var i = 0; i < handlers.length; i++) {
            if (event.isCancelled()) {
                KifeJS.log("[EventBus] 事件已取消，停止派发: " + eventType);
                break;
            }
            try {
                handlers[i](event);
            } catch (e) {
                KifeJS.log("[EventBus] 监听器异常: " + e.message);
            }
        }

        return !event.isCancelled();
    },

    // 一次性监听
    once: function(eventType, handler) {
        var self = this;
        var wrapper = function(event) {
            self.off(eventType, wrapper);
            handler(event);
        };
        this.on(eventType, wrapper);
    },

    // 移除所有监听器
    clear: function() {
        this._listeners = {};
        KifeJS.log("[EventBus] 已清除所有监听器");
    }
};
```

---

## 三、带优先级的事件总线

监听器按优先级排序执行。

```javascript
var PriorityEventBus = {
    _listeners: {},

    // priority: 数字，越小越先执行（默认 100）
    on: function(eventType, handler, priority) {
        priority = (typeof priority === "number") ? priority : 100;

        var entry = {
            handler: handler,
            priority: priority
        };

        if (!this._listeners[eventType]) {
            this._listeners[eventType] = [];
        }

        this._listeners[eventType].push(entry);
        // 按优先级排序（升序）
        this._listeners[eventType].sort(function(a, b) {
            return a.priority - b.priority;
        });

        KifeJS.log("[PriorityBus] 注册监听: " + eventType + " (优先级: " + priority + ")");
    },

    off: function(eventType, handler) {
        var entries = this._listeners[eventType];
        if (!entries) return;

        this._listeners[eventType] = entries.filter(function(entry) {
            return entry.handler !== handler;
        });
    },

    emit: function(eventType, data) {
        var entries = this._listeners[eventType];
        if (!entries || entries.length === 0) return true;

        var event = createBusEvent(eventType, data);

        for (var i = 0; i < entries.length; i++) {
            if (event.isCancelled()) break;
            try {
                entries[i].handler(event);
            } catch (e) {
                KifeJS.log("[PriorityBus] 错误: " + e.message);
            }
        }

        return !event.isCancelled();
    },

    // 查看某个事件类型的监听器顺序
    getListeners: function(eventType) {
        var entries = this._listeners[eventType] || [];
        var info = [];
        for (var i = 0; i < entries.length; i++) {
            var name = entries[i].handler.name || "(匿名)";
            info.push(name + " (优先级:" + entries[i].priority + ")");
        }
        return info;
    }
};
```

**使用示例：**

```javascript
// 优先级 10：最先执行（安全检查）
PriorityEventBus.on("player:chat", function(e) {
    KifeJS.log("[安全] 检查消息: " + e.data.message);
    if (e.data.message.indexOf("坏词") >= 0) {
        KifeJS.log("[安全] 消息包含违规内容，取消事件");
        e.cancel();
    }
}, 10);

// 优先级 100：日志记录
PriorityEventBus.on("player:chat", function(e) {
    KifeJS.log("[日志] " + e.data.player + ": " + e.data.message);
}, 100);

// 优先级 200：广播（优先级最低）
PriorityEventBus.on("player:chat", function(e) {
    KifeJS.broadcast(e.data.player + " 说: " + e.data.message);
}, 200);

// 查看顺序
KifeJS.log("监听器顺序: " + JSON.stringify(PriorityEventBus.getListeners("player:chat")));
// ["安全检查(优先级:10)", "日志(优先级:100)", "广播(优先级:200)"]
```

---

## 四、完整功能事件总线

结合以上所有功能，提供完整的实现：

```javascript
var CompleteEventBus = (function() {
    // 私有状态
    var listeners = {};
    var maxListeners = 20;  // 每个事件类型最大监听数

    // 创建事件对象
    function createEvent(type, data) {
        var cancelled = false;
        var propagationStopped = false;

        return {
            type: type,
            data: data || {},
            timestamp: Date.now(),

            cancel: function() {
                cancelled = true;
                try { new KifeEvent().cancel(); } catch(e) {}
            },

            isCancelled: function() {
                return cancelled;
            },

            stopPropagation: function() {
                propagationStopped = true;
            },

            isPropagationStopped: function() {
                return propagationStopped;
            }
        };
    }

    // 公开 API
    return {
        on: function(eventType, handler, priority) {
            if (typeof handler !== "function") {
                KifeJS.log("[EventBus] 错误: handler 不是函数");
                return;
            }

            if (!listeners[eventType]) {
                listeners[eventType] = [];
            }

            if (listeners[eventType].length >= maxListeners) {
                KifeJS.log("[EventBus] 警告: " + eventType + " 监听器超过上限 (" + maxListeners + ")");
                return;
            }

            listeners[eventType].push({
                handler: handler,
                priority: priority || 100,
                once: false
            });

            listeners[eventType].sort(function(a, b) {
                return a.priority - b.priority;
            });
        },

        once: function(eventType, handler, priority) {
            var self = this;
            var wrapper = function(event) {
                self.off(eventType, wrapper);
                handler(event);
            };
            this.on(eventType, wrapper, priority);
            // 标记为一次性
            var entries = listeners[eventType];
            if (entries) {
                for (var i = 0; i < entries.length; i++) {
                    if (entries[i].handler === wrapper) {
                        entries[i].once = true;
                    }
                }
            }
        },

        off: function(eventType, handler) {
            if (!listeners[eventType]) return;

            if (handler) {
                listeners[eventType] = listeners[eventType].filter(function(entry) {
                    return entry.handler !== handler;
                });
            } else {
                delete listeners[eventType];
            }
        },

        emit: function(eventType, data) {
            var entries = listeners[eventType];
            if (!entries || entries.length === 0) return true;

            var event = createEvent(eventType, data);
            KifeJS.log("[EventBus] → " + eventType + " (监听器: " + entries.length + " 个)");

            // 清理一次性监听器
            var toRemove = [];

            for (var i = 0; i < entries.length; i++) {
                if (event.isCancelled()) {
                    KifeJS.log("[EventBus] 事件已取消，停止派发");
                    break;
                }

                if (event.isPropagationStopped()) {
                    KifeJS.log("[EventBus] 传播已停止");
                    break;
                }

                try {
                    entries[i].handler(event);
                } catch (e) {
                    KifeJS.log("[EventBus] 监听器错误: " + e.message);
                }

                if (entries[i].once) {
                    toRemove.push(entries[i].handler);
                }
            }

            // 移除一次性监听器
            for (var r = 0; r < toRemove.length; r++) {
                this.off(eventType, toRemove[r]);
            }

            return !event.isCancelled();
        },

        // 获取监听器统计
        stats: function() {
            var count = 0;
            var types = [];
            for (var type in listeners) {
                if (listeners.hasOwnProperty(type)) {
                    types.push(type + "(" + listeners[type].length + ")");
                    count += listeners[type].length;
                }
            }
            return {
                totalListeners: count,
                eventTypes: types
            };
        },

        clear: function() {
            listeners = {};
            KifeJS.log("[EventBus] 已全部清除");
        }
    };
})();
```

---

## 五、各版本事件总线对比

| 功能 | 最小版 | 取消版 | 优先级版 | 完整版 |
|------|--------|--------|---------|--------|
| on/emit | ✅ | ✅ | ✅ | ✅ |
| off | ❌ | ✅ | ✅ | ✅ |
| once | ❌ | ✅ | ❌ | ✅ |
| 取消支持 | ❌ | ✅ | ✅ | ✅ |
| 优先级 | ❌ | ❌ | ✅ | ✅ |
| 传播停止 | ❌ | ❌ | ❌ | ✅ |
| 最大监听数 | ❌ | ❌ | ❌ | ✅ |
| 错误隔离 | ✅ | ✅ | ✅ | ✅ |
| 统计 | ❌ | ❌ | ❌ | ✅ |

---

## 下一步

- 了解 [事件生命周期](03-event-lifecycle.md)
- 学习 [取消机制](04-cancellation-deep.md)
