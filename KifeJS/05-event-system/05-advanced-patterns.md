# 高级事件模式

> **文档索引:** `05-event-system/05-advanced-patterns.md`
>
> 事件系统的高级使用模式：优先级队列、事件过滤、异步事件、链式事件等。

---

## 一、优先级队列（Priority Queue）

当监听器数量很大时，使用高效的优先级队列而非每次排序：

```javascript
var PriorityQueueBus = (function() {
    // 每个事件类型的优先队列
    var queues = {};

    // 最小堆实现（按 priority 排序）
    function PriorityQueue() {
        this._heap = [];
    }

    PriorityQueue.prototype.push = function(item) {
        this._heap.push(item);
        this._bubbleUp(this._heap.length - 1);
    };

    PriorityQueue.prototype.pop = function() {
        if (this._heap.length === 0) return null;
        var top = this._heap[0];
        var bottom = this._heap.pop();
        if (this._heap.length > 0) {
            this._heap[0] = bottom;
            this._sinkDown(0);
        }
        return top;
    };

    PriorityQueue.prototype.peek = function() {
        return this._heap.length > 0 ? this._heap[0] : null;
    };

    PriorityQueue.prototype.size = function() {
        return this._heap.length;
    };

    PriorityQueue.prototype._bubbleUp = function(idx) {
        while (idx > 0) {
            var parent = Math.floor((idx - 1) / 2);
            if (this._heap[parent].priority <= this._heap[idx].priority) break;
            var tmp = this._heap[parent];
            this._heap[parent] = this._heap[idx];
            this._heap[idx] = tmp;
            idx = parent;
        }
    };

    PriorityQueue.prototype._sinkDown = function(idx) {
        var length = this._heap.length;
        while (true) {
            var left = 2 * idx + 1;
            var right = 2 * idx + 2;
            var smallest = idx;

            if (left < length && this._heap[left].priority < this._heap[smallest].priority)
                smallest = left;
            if (right < length && this._heap[right].priority < this._heap[smallest].priority)
                smallest = right;
            if (smallest === idx) break;

            var tmp = this._heap[smallest];
            this._heap[smallest] = this._heap[idx];
            this._heap[idx] = tmp;
            idx = smallest;
        }
    };

    return {
        on: function(type, handler, priority) {
            if (!queues[type]) queues[type] = new PriorityQueue();
            queues[type].push({
                handler: handler,
                priority: typeof priority === "number" ? priority : 100
            });
        },

        emit: function(type, data) {
            var queue = queues[type];
            if (!queue || queue.size() === 0) return true;

            var event = createBusEvent(type, data);

            // 复制队列以允许在 emit 中添加新的监听器
            var snapshot = [];
            while (queue.size() > 0) {
                snapshot.push(queue.pop());
            }

            for (var i = 0; i < snapshot.length; i++) {
                if (event.isCancelled()) break;
                try { snapshot[i].handler(event); } catch(e) {
                    KifeJS.log("[PQBus] 错误: " + e.message);
                }
                // 重新入队（保持监听器持久）
                queue.push(snapshot[i]);
            }

            return !event.isCancelled();
        }
    };
})();
```

---

## 二、事件过滤（Event Filtering）

在事件到达监听器之前或之后进行过滤。

### 前置过滤器

```javascript
var FilteredBus = (function() {
    var listeners = {};
    var filters = [];

    function addFilter(filterFn) {
        filters.push(filterFn);
    }

    function emit(type, data) {
        var event = createBusEvent(type, data);

        // 通过所有过滤器
        for (var i = 0; i < filters.length; i++) {
            var result = filters[i](event);
            if (result === false) {
                KifeJS.log("[FilteredBus] 过滤器 " + i + " 阻止了事件: " + type);
                return false;
            }
            if (event.isCancelled()) return false;
        }

        // 派发给监听器
        var entries = listeners[type] || [];
        for (var i = 0; i < entries.length; i++) {
            if (event.isCancelled()) break;
            try { entries[i].handler(event); } catch(e) {
                KifeJS.log("[FilteredBus] 错误: " + e.message);
            }
        }

        return !event.isCancelled();
    }

    return {
        on: function(type, handler, priority) {
            if (!listeners[type]) listeners[type] = [];
            listeners[type].push({ handler: handler, priority: priority || 100 });
            listeners[type].sort(function(a, b) { return a.priority - b.priority; });
        },

        emit: emit,

        // 过滤器类型
        addFilter: addFilter,

        // 命名空间过滤器：只放行特定命名空间的事件
        addNamespaceFilter: function(namespace) {
            addFilter(function(event) {
                if (event.type.indexOf(namespace) !== 0) {
                    KifeJS.log("[Filter] 命名空间不匹配: " + event.type + " != " + namespace);
                    return false;
                }
                return true;
            });
        },

        // 频率过滤器：限制事件频率
        addRateLimitFilter: function(maxPerSecond) {
            var timestamps = [];
            addFilter(function(event) {
                var now = Date.now();
                timestamps.push(now);
                timestamps = timestamps.filter(function(t) { return now - t < 1000; });
                if (timestamps.length > maxPerSecond) {
                    KifeJS.log("[Filter] 频率限制: " + event.type);
                    event.cancel("频率超限");
                }
                return true;
            });
        },

        // 白名单过滤器
        addWhitelistFilter: function(allowedTypes) {
            addFilter(function(event) {
                var allowed = false;
                for (var i = 0; i < allowedTypes.length; i++) {
                    if (event.type === allowedTypes[i]) {
                        allowed = true;
                        break;
                    }
                }
                if (!allowed) {
                    KifeJS.log("[Filter] 白名单拒绝: " + event.type);
                    return false;
                }
                return true;
            });
        }
    };
})();

// 使用过滤器
FilteredBus.addNamespaceFilter("player:");
FilteredBus.addRateLimitFilter(5);  // 每秒最多 5 个事件
FilteredBus.addWhitelistFilter(["player:join", "player:leave", "player:chat"]);
```

---

## 三、异步事件

当事件处理器需要执行耗时操作时：

```javascript
var AsyncBus = (function() {
    var listeners = {};
    var pendingPromises = [];

    return {
        on: function(type, handler, priority) {
            if (!listeners[type]) listeners[type] = [];
            listeners[type].push({ handler: handler, priority: priority || 100 });
            listeners[type].sort(function(a, b) { return a.priority - b.priority; });
        },

        // 异步派发：不阻塞 emit，在后台执行监听器
        emitAsync: function(type, data) {
            var self = this;
            var event = createBusEvent(type, data);
            var entries = listeners[type] || [];

            KifeJS.log("[AsyncBus] 异步派发: " + type + " (" + entries.length + " 监听器)");

            // 使用 setTimeout 模拟异步执行
            for (var i = 0; i < entries.length; i++) {
                (function(handler, evt) {
                    var id = setTimeout(function() {
                        try {
                            if (!evt.isCancelled()) {
                                handler(evt);
                                KifeJS.log("[AsyncBus] 异步完成: " + type);
                            }
                        } catch (e) {
                            KifeJS.log("[AsyncBus] 异步错误: " + e.message);
                        }
                    }, 0);

                    pendingPromises.push(id);
                })(entries[i].handler, event);
            }

            return true;
        },

        // 同步派发（保留）
        emit: function(type, data) {
            // ... 同步派发逻辑
        },

        // 等待所有异步事件完成
        drain: function() {
            // 注意：setTimeout 无法真正等待，这里只是记录
            KifeJS.log("[AsyncBus] 待处理异步事件: " + pendingPromises.length);
            return pendingPromises.length;
        }
    };
})();
```

---

## 四、链式事件

一个事件处理完后自动触发另一个事件：

```javascript
var ChainedBus = (function() {
    var listeners = {};
    var chainRules = [];

    // 定义链式规则
    function addChain(sourceType, targetType, dataTransform) {
        chainRules.push({
            source: sourceType,
            target: targetType,
            transform: dataTransform || function(data) { return data; }
        });
    }

    function emit(type, data) {
        var entries = listeners[type];
        var event = createBusEvent(type, data);

        // 派发当前事件
        if (entries) {
            for (var i = 0; i < entries.length; i++) {
                if (event.isCancelled()) break;
                try { entries[i].handler(event); } catch(e) {
                    KifeJS.log("[ChainedBus] 错误: " + e.message);
                }
            }
        }

        // 检查链式规则
        if (!event.isCancelled()) {
            for (var r = 0; r < chainRules.length; r++) {
                if (chainRules[r].source === type) {
                    var newData = chainRules[r].transform(data);
                    KifeJS.log("[ChainedBus] 链式触发: " + type + " → " + chainRules[r].target);
                    emit(chainRules[r].target, newData);
                }
            }
        }

        return !event.isCancelled();
    }

    return {
        on: function(type, handler) {
            if (!listeners[type]) listeners[type] = [];
            listeners[type].push(handler);
        },

        emit: emit,
        addChain: addChain
    };
})();

// 定义事件链
ChainedBus.addChain("player:join", "player:login-complete", function(data) {
    data.joinedAt = Date.now();
    return data;
});

ChainedBus.addChain("player:login-complete", "server:player-count-update", function(data) {
    data.action = "increment";
    return data;
});

// 使用：派发 player:join 会自动触发 player:login-complete 和 server:player-count-update
ChainedBus.emit("player:join", { player: "Steve" });
```

---

## 五、通配符事件监听

监听一类事件而非特定类型：

```javascript
var WildcardBus = (function() {
    var listeners = {};

    function matchEventType(pattern, eventType) {
        if (pattern === eventType) return true;
        if (pattern === "*") return true;

        // 支持 player:* 模式
        var parts = pattern.split("*");
        if (parts.length === 2) {
            return eventType.indexOf(parts[0]) === 0
                && eventType.indexOf(parts[1]) === eventType.length - parts[1].length;
        }

        return false;
    }

    function emit(type, data) {
        var event = createBusEvent(type, data);

        // 遍历所有注册的模式
        for (var pattern in listeners) {
            if (listeners.hasOwnProperty(pattern)) {
                if (matchEventType(pattern, type)) {
                    var handlers = listeners[pattern];
                    for (var i = 0; i < handlers.length; i++) {
                        if (event.isCancelled()) break;
                        try { handlers[i](event); } catch(e) {
                            KifeJS.log("[WildcardBus] 错误: " + e.message);
                        }
                    }
                }
            }
        }

        return !event.isCancelled();
    }

    return {
        on: function(pattern, handler) {
            if (!listeners[pattern]) listeners[pattern] = [];
            listeners[pattern].push(handler);
            KifeJS.log("[WildcardBus] 注册模式: " + pattern);
        },

        emit: emit
    };
})();

// 使用通配符
WildcardBus.on("player:*", function(e) {
    KifeJS.log("[玩家事件] " + e.type);
});

WildcardBus.on("player:join", function(e) {
    KifeJS.log("玩家加入: " + e.data.player);
});

WildcardBus.on("player:leave", function(e) {
    KifeJS.log("玩家离开: " + e.data.player);
});

// 派发
WildcardBus.emit("player:join", { player: "Alex" });
// 两个监听器都会被触发
```

---

## 六、装饰器模式的事件总线

为现有总线动态添加功能：

```javascript
// 基础总线
function createBaseBus() {
    var listeners = {};
    return {
        on: function(type, handler) {
            if (!listeners[type]) listeners[type] = [];
            listeners[type].push(handler);
        },
        emit: function(type, data) {
            var entries = listeners[type];
            if (!entries) return true;
            var evt = createBusEvent(type, data);
            for (var i = 0; i < entries.length; i++) {
                if (evt.isCancelled()) break;
                try { entries[i](evt); } catch(e) {
                    KifeJS.log("[Bus] 错误: " + e.message);
                }
            }
            return !evt.isCancelled();
        }
    };
}

// 日志装饰器
function withLogging(bus) {
    var originalEmit = bus.emit;
    bus.emit = function(type, data) {
        KifeJS.log("[日志] 派发事件: " + type);
        var result = originalEmit.call(bus, type, data);
        KifeJS.log("[日志] 事件完成: " + type + " (结果: " + result + ")");
        return result;
    };
    return bus;
}

// 监控装饰器
function withMetrics(bus) {
    var originalEmit = bus.emit;
    var metrics = {};

    bus.emit = function(type, data) {
        var start = Date.now();
        var result = originalEmit.call(bus, type, data);
        var duration = Date.now() - start;

        if (!metrics[type]) metrics[type] = { count: 0, totalTime: 0 };
        metrics[type].count++;
        metrics[type].totalTime += duration;

        return result;
    };

    bus.getMetrics = function() {
        var report = {};
        for (var type in metrics) {
            if (metrics.hasOwnProperty(type)) {
                var m = metrics[type];
                report[type] = {
                    count: m.count,
                    avgTime: (m.totalTime / m.count).toFixed(2) + "ms"
                };
            }
        }
        return report;
    };

    return bus;
}

// 使用装饰器
var bus = withMetrics(withLogging(createBaseBus()));

bus.on("test", function(e) { KifeJS.log("处理: " + e.type); });
bus.emit("test", {});

KifeJS.log("监控: " + JSON.stringify(bus.getMetrics()));
```

---

## 七、模式选择指南

| 需求 | 推荐模式 |
|------|---------|
| 大量监听器需要排序 | 优先级队列 |
| 限制事件的接收 | 事件过滤 |
| 避免阻塞主流程 | 异步事件 |
| 自动触发的多个步骤 | 链式事件 |
| 监听多种相关事件 | 通配符 |
| 为现有总线添加能力 | 装饰器 |
| 关心事件谁取消的 | 取消追踪 |
| 每个监听器只执行一次 | once |

---

## 下一步

- 开始学习 [跨脚本通信](../06-cross-script/01-global-scope.md)
- 查看 [完整示例](../09-examples/06-full-event-system/)
