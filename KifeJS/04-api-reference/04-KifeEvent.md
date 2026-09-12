# KifeEvent — 事件类

> **文档索引:** `04-api-reference/04-KifeEvent.md`
>
> KifeJS 内置的事件类。提供一个 `cancel()` 方法来标记事件为"已取消"，是构建事件系统的基础单元。

---

## 签名

```javascript
new KifeEvent()
```

| 构造函数 | 返回值 |
|----------|--------|
| `new KifeEvent()` | 事件实例 |

| 方法 | 返回值 | 说明 |
|------|--------|------|
| `event.cancel()` | `"cancelled"` | 标记事件为已取消 |
| `event.cancelled` | `boolean` | 检查事件是否已取消 |

---

## 底层实现

```java
// ScriptRuntime.registerApi()
koss.registerClass("KifeEvent", Map.of("cancel", args -> "cancelled"));
```

`KifeEvent` 是注册到 JS 引擎的 Java 类，包含一个 `cancel` 方法，该方法始终返回字符串 `"cancelled"`。

> **注意:** `cancel()` 方法的返回值是字符串 `"cancelled"`，但该方法**不会自动设置 `cancelled` 属性**。您需要手动跟踪取消状态。

---

## 基础用法

### 创建和取消事件

```javascript
// 创建事件
var event = new KifeEvent();
KifeJS.log("事件已创建");

// 取消事件
var result = event.cancel();
KifeJS.log("取消结果: " + result);  // 取消结果: cancelled

// 注意：KifeEvent 没有内置的 cancelled 属性
// 需要在外部维护取消状态
```

### 带状态跟踪的事件

```javascript
function createEvent(type, data) {
    return {
        type: type,
        data: data || {},
        _cancelled: false,
        cancel: function() {
            this._cancelled = true;
            return "cancelled";
        },
        isCancelled: function() {
            return this._cancelled === true;
        }
    };
}

var evt = createEvent("playerJoin", { name: "Steve" });
KifeJS.log("事件创建: " + evt.type + ", 已取消: " + evt.isCancelled());

evt.cancel();
KifeJS.log("事件已取消: " + evt.isCancelled());  // true
```

---

## 进阶用法

### 包装 KifeEvent 的增强事件

```javascript
// 将 KifeEvent 与自定义数据结构结合
function KifeEventEx(type, data) {
    // 使用内置 KifeEvent
    var base = new KifeEvent();

    return {
        // 内置属性
        type: type || "generic",
        data: data || {},
        timestamp: Date.now(),

        // 取消状态
        _cancelled: false,

        // 取消方法（调用内置 + 跟踪状态）
        cancel: function() {
            this._cancelled = true;
            return base.cancel();  // 返回 "cancelled"
        },

        isCancelled: function() {
            return this._cancelled;
        }
    };
}

// 使用
var evt = KifeEventEx("chat", { message: "你好", player: "Steve" });
KifeJS.log("事件类型: " + evt.type + ", 时间戳: " + evt.timestamp);
KifeJS.log("消息: " + evt.data.message);

// 取消
evt.cancel();
KifeJS.log("已取消: " + evt.isCancelled());
```

### 事件预定义类型

```javascript
// 定义常用事件类型的工厂
var Events = {
    create: function(type, data) {
        return KifeEventEx(type, data);
    },

    // 预设事件类型
    playerJoin: function(playerName) {
        return KifeEventEx("player:join", { player: playerName });
    },

    playerLeave: function(playerName) {
        return KifeEventEx("player:leave", { player: playerName });
    },

    serverTick: function(tickNumber) {
        return KifeEventEx("server:tick", { tick: tickNumber });
    },

    custom: function(name, payload) {
        return KifeEventEx("custom:" + name, payload);
    }
};

// 使用预设
var joinEvent = Events.playerJoin("Steve");
KifeJS.log("玩家加入事件: " + joinEvent.data.player);
```

---

## 在实际脚本中的使用模式

### 与事件总线集成

```javascript
// 在事件总线中使用 KifeEvent
var EventBus = {
    listeners: {},

    on: function(eventType, handler) {
        if (!this.listeners[eventType]) {
            this.listeners[eventType] = [];
        }
        this.listeners[eventType].push(handler);
    },

    emit: function(eventType, data) {
        // 创建 KifeEvent 实例
        var event = KifeEventEx(eventType, data);

        var handlers = this.listeners[eventType] || [];
        for (var i = 0; i < handlers.length; i++) {
            if (!event.isCancelled()) {
                handlers[i](event);
            }
        }

        return !event.isCancelled();
    }
};

// 注册监听器
EventBus.on("player:join", function(e) {
    KifeJS.log("玩家 " + e.data.player + " 加入了游戏");

    // 在某些条件下取消事件
    if (e.data.player === "Steve") {
        // Steve 总是被取消
        e.cancel();
    }
});

// 派发事件
var result = EventBus.emit("player:join", { player: "Alex" });
KifeJS.log("事件处理完成: " + (result ? "正常" : "已取消"));
```

---

## 边界情况

| 场景 | 行为 |
|------|------|
| 多次调用 `cancel()` | 每次都返回 `"cancelled"`，无副作用 |
| 未调用 `cancel()` | KifeEvent 实例无 `cancelled` 属性 |
| 在引擎重载后 | KifeEvent 类重新注册，旧实例失效 |

---

## 设计思路

`KifeEvent` 的设计非常精简（仅含 `cancel` 方法），原因：

1. **基础构建块** — 提供最小的取消原语，事件系统的其余部分由 JS 构建
2. **跨语言桥接** — Java 对象的 `cancel()` 只需返回固定值，避免复杂的双向同步
3. **灵活性** — 用户可以在 JS 中按需扩展事件对象

---

## 最佳实践

1. **始终包装 KifeEvent** — 直接使用有限制，建议加一层包装（如 `KifeEventEx`）
2. **跟踪取消状态** — 内置 `cancel()` 不维护状态，需自行跟踪
3. **在事件总线中使用** — KifeEvent 的真正价值在于与 EventBus 配合
4. **传递 `data` 对象** — 通过 `data` 传递事件负载

---

## 下一步

- 深入 [事件系统](../05-event-system/01-concepts.md) 完整教程
- 学习 [内置变量](05-script-variables.md)
