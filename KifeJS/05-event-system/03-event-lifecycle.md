# 事件生命周期

> **文档索引:** `05-event-system/03-event-lifecycle.md`
>
> 一个事件从创建到完成经历的完整阶段，以及每个阶段的关键行为。

---

## 一、生命周期的五阶段模型

```
 ① 创建 ──→ ② 派发 ──→ ③ 前置处理 ──→ ④ 监听器执行 ──→ ⑤ 后置处理
                 │             │                │               │
                 │             ▼                ▼               ▼
                 │        ● 格式化数据      ● 按序执行        ● 结果处理
                 │        ● 注入元数据      ● 取消检查        ● 清理
                 │        ● 安全检查        ● 优先级排序      ● 日志
```

---

## 二、阶段详解

### 阶段 1：事件创建

事件由 `createBusEvent(type, data)` 创建：

```javascript
function createBusEvent(type, data) {
    return {
        type: type,           // 事件类型
        data: data || {},     // 携带数据
        timestamp: Date.now(), // 创建时间
        _cancelled: false,    // 取消状态
        _propagationStopped: false,  // 传播状态

        cancel: function() {
            this._cancelled = true;
            KifeJS.log("[EventBus] 事件已取消: " + this.type);
        },

        isCancelled: function() {
            return this._cancelled;
        },

        stopPropagation: function() {
            this._propagationStopped = true;
            KifeJS.log("[EventBus] 传播已停止: " + this.type);
        }
    };
}
```

**创建时发生的行为：**

- 确定事件类型（`player:join`）
- 绑定数据到 `event.data`
- 记录时间戳
- 取消和传播状态初始化为 `false`
- `KifeEvent.cancel()` 被调用（但仅用于触发 Java 端逻辑）

---

### 阶段 2：事件派发

事件源调用 `EventBus.emit(type, data)`：

```javascript
// 事件源代码
function onPlayerJoin(playerName) {
    EventBus.emit("player:join", {
        player: playerName,
        time: Date.now()
    });
}
```

**派发时发生的行为：**

| 步骤 | 动作 | 说明 |
|------|------|------|
| 2.1 | 查找监听器 | 从 `_listeners` 中按 `eventType` 检索 |
| 2.2 | 空检查 | 无监听器 → 直接返回 `true` |
| 2.3 | 创建事件对象 | 调用 `createEvent` |
| 2.4 | 排序（如有优先级） | 按优先级升序排列监听器 |
| 2.5 | 开始遍历 | 进入监听器执行阶段 |

---

### 阶段 3：前置处理（事件调整）

在监听器执行前，可以在事件总线上添加 "中间件" 进行前置处理：

```javascript
var EventBusWithMiddleware = (function() {
    var listeners = {};
    var middlewares = [];

    function addMiddleware(fn) {
        middlewares.push(fn);
    }

    function emit(eventType, data) {
        var event = createBusEvent(eventType, data);

        // 执行中间件
        for (var i = 0; i < middlewares.length; i++) {
            middlewares[i](event);
            if (event.isCancelled()) break;
        }

        // 中间件取消后不再派发
        if (event.isCancelled()) {
            KifeJS.log("[EventBus] 中间件取消了事件");
            return false;
        }

        // 派发给监听器
        var entries = listeners[eventType] || [];
        for (var i = 0; i < entries.length; i++) {
            if (event.isCancelled() || event.isPropagationStopped()) break;
            try { entries[i].handler(event); } catch (e) {
                KifeJS.log("[EventBus] 错误: " + e.message);
            }
        }

        return !event.isCancelled();
    }

    return {
        on: function(type, handler, priority) {
            if (!listeners[type]) listeners[type] = [];
            listeners[type].push({
                handler: handler,
                priority: priority || 100
            });
            listeners[type].sort(function(a, b) { return a.priority - b.priority; });
        },
        emit: emit,
        use: addMiddleware  // 注册中间件
    };
})();

// 使用中间件
EventBusWithMiddleware.use(function(event) {
    // 为所有事件注入元数据
    event.metadata = {
        serverUptime: Date.now() - globalThis.__startTime,
        sourceScript: __kife_current_script
    };
});

EventBusWithMiddleware.use(function(event) {
    // 安全检查：禁用事件类型
    if (event.type === "admin:dangerous" && KifeJSConfig.enabled === false) {
        KifeJS.log("[安全] 系统禁用，阻止危险事件");
        event.cancel();
    }
});
```

---

### 阶段 4：监听器执行

监听器按优先级顺序执行。每个监听器有机会：

1. **读取事件数据** — 通过 `event.data`
2. **修改事件数据** — 直接修改 `event.data` 对象
3. **取消事件** — 调用 `event.cancel()` 阻止后续监听器
4. **停止传播** — 调用 `event.stopPropagation()` 阻止后续监听器但不标记为取消
5. **什么都不做** — 事件继续传播

```javascript
// 监听器执行时的决策树
//
// 接收到事件 event
//   │
//   ├─ 读取 event.data ──→ 获取信息
//   ├─ 修改 event.data ──→ 为后续监听器提供加工后的数据
//   ├─ event.cancel()  ──→ 取消整个事件
//   └─ event.stopPropagation() ──→ 停止传播（但不标记取消）

// 示例：责任链模式
EventBus.on("player:login", function(e) {
    // 1. 安全检查：添加验证状态
    e.data.verified = (e.data.player !== "steve_banned");
}, 10);

EventBus.on("player:login", function(e) {
    // 2. 如果未通过验证，取消事件
    if (e.data.verified === false) {
        KifeJS.log("玩家 " + e.data.player + " 验证失败");
        e.cancel();
    }
}, 20);

EventBus.on("player:login", function(e) {
    // 3. 只有在验证通过后才会执行到这里
    KifeJS.log("玩家 " + e.data.player + " 登录成功");
}, 100);
```

---

### 阶段 5：后置处理

监听器全部执行完成后：

```javascript
emit: function(eventType, data) {
    var entries = listeners[eventType];
    if (!entries || entries.length === 0) return true;

    var event = createBusEvent(eventType, data);

    // === 监听器执行 ===
    for (var i = 0; i < entries.length; i++) {
        if (event.isCancelled() || event.isPropagationStopped()) break;
        try { entries[i].handler(event); } catch (e) {
            KifeJS.log("[EventBus] 错误: " + e.message);
        }
    }

    // === 后置处理 ===
    // 1. 记录执行结果
    KifeJS.log("[EventBus] 事件 " + eventType
        + " 完成 (" + (event.isCancelled() ? "已取消" : "成功") + ")");

    // 2. 触发完成事件（事件总线自身的事件）
    if (!event.isCancelled()) {
        this._onComplete && this._onComplete(event);
    }

    // 3. 清理一次性监听器

    return !event.isCancelled();
}
```

---

## 三、取消与传播停止的区别

| 维度 | `cancel()` | `stopPropagation()` |
|------|-----------|-------------------|
| **阻止后续监听器** | ✅ 是 | ✅ 是 |
| **标记事件"已取消"** | ✅ 是 | ❌ 否 |
| **`emit()` 返回值** | `false` | `true` |
| **语义** | "这件事不应该发生" | "我已经处理完了" |
| **使用场景** | 验证失败、权限不足 | 只需要一个处理器响应 |

```javascript
// cancel 示例：消息审核
EventBus.on("chat:message", function(e) {
    if (isBlocked(e.data.message)) {
        e.cancel();  // 消息被阻止，后续监听器不会收到
    }
}, 10);

EventBus.on("chat:message", function(e) {
    // 如果 cancel 在上一步被调用，这里不会执行
    broadcastMessage(e.data);
}, 100);

// stopPropagation 示例：缓存命中
EventBus.on("data:request", function(e) {
    var cached = cache.get(e.data.key);
    if (cached !== null) {
        e.data.result = cached;
        e.stopPropagation();  // 不需要去数据库查找了
    }
}, 10);

EventBus.on("data:request", function(e) {
    // 如果缓存命中，这里不会执行
    e.data.result = database.query(e.data.key);
}, 100);
```

---

## 四、事件传递模式

### 数据修改链

```javascript
EventBus.on("order:create", function(e) {
    // 监听器 A：添加时间戳
    e.data.createdAt = Date.now();
});

EventBus.on("order:create", function(e) {
    // 监听器 B：使用 A 设置的时间戳
    e.data.orderId = "ORD-" + e.data.createdAt;
});

EventBus.on("order:create", function(e) {
    // 监听器 C：记录完整的订单信息
    KifeJS.log("订单创建: " + JSON.stringify(e.data));
});
```

### 条件链

```javascript
EventBus.on("payment:process", function(e) {
    // 只有 VIP 才需要走特殊流程
    if (e.data.vip) {
        e.data.specialProcess = true;
    }
});

EventBus.on("payment:process", function(e) {
    if (e.data.specialProcess) {
        // VIP 处理逻辑
    }
});
```

---

## 五、事件生命周期监控

```javascript
// 添加生命周期钩子到事件总线
var MonitoredBus = (function() {
    var listeners = {};

    return {
        on: function(type, handler, priority) {
            // ...
        },

        emit: function(type, data) {
            KifeJS.log("[监控] 事件开始: " + type);

            var startTime = Date.now();
            var result = this._emit(type, data);
            var duration = Date.now() - startTime;

            KifeJS.log("[监控] 事件结束: " + type
                + " | 耗时: " + duration + "ms"
                + " | 结果: " + (result ? "成功" : "取消"));

            return result;
        },

        _emit: function(type, data) {
            // 实际的派发逻辑
        }
    };
})();
```

---

## 六、生命周期状态图

```
                  +-----------+
                  |   创建    |
                  +-----+-----+
                        |
                        v
                  +-----+-----+
         +--------+   派发    +--------+
         |        +-----+-----+        |
         |              |              |
         v              v              v
   +-----+----+   +----+------+  +----+------+
   | 无监听器  |   | 前置处理  |  | 中间件过滤 |
   +----------+   +----+------+  +-----------+
                        |
                        v
                  +-----+------+
         +--------+ 监听器执行  +--------+
         |        +-----+------+        |
         v              v              v
   +-----+----+   +----+------+  +----+------+
   | 取消事件  |   | 继续传播  |  | 停止传播  |
   +----------+   +----+------+  +-----------+
                        |
                        v
                  +-----+------+
                  | 后置处理    |
                  +------------+
```

---

## 下一步

- 深入 [取消机制](04-cancellation-deep.md)
- 学习 [高级事件模式](05-advanced-patterns.md)
