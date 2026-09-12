# 事件驱动通信

> **文档索引:** `06-cross-script/03-event-driven.md`
>
> 通过事件总线实现脚本间的松耦合通信。

---

## 一、基本模式

所有脚本共享同一个事件总线，通过"发布-订阅"模式通信。

```
 脚本 A (发布者)               脚本 B (订阅者)
      │                            │
      │  EventBus.emit(            │
      │    "player:join",          │  EventBus.on(
      │    { player: "Steve" })    │    "player:join",
      │       │                    │    handler)
      │       ▼                    │       │
      │   ┌────────────┐           │       │
      │   │  事件总线   │───────────│───────┘
      │   │            │───────────│───────┐
      │   └────────────┘           │       │
      │                            │ 脚本 C (订阅者)
      │                            │      │
      │                            │      ▼
      │                            │ EventBus.on(
      │                            │   "player:join",
      │                            │   handler)
```

---

## 二、完整通信示例

### 事件总线定义（在 `0-event-bus.js` 中）

```javascript
// 脚本: 0-event-bus.js
globalThis.EventBus = (function() {
    var listeners = {};

    return {
        on: function(type, handler, priority) {
            if (!listeners[type]) listeners[type] = [];
            listeners[type].push({
                handler: handler,
                priority: typeof priority === "number" ? priority : 100
            });
            listeners[type].sort(function(a, b) {
                return a.priority - b.priority;
            });
        },

        off: function(type, handler) {
            if (!listeners[type]) return;
            if (handler) {
                listeners[type] = listeners[type].filter(function(e) {
                    return e.handler !== handler;
                });
            } else {
                delete listeners[type];
            }
        },

        emit: function(type, data) {
            var entries = listeners[type];
            if (!entries || entries.length === 0) return true;

            var cancelled = false;
            var event = {
                type: type,
                data: data || {},
                _cancelled: false,
                cancel: function() {
                    this._cancelled = true;
                    cancelled = true;
                    try { new KifeEvent().cancel(); } catch(e) {}
                },
                isCancelled: function() { return this._cancelled; }
            };

            for (var i = 0; i < entries.length; i++) {
                if (cancelled) break;
                try {
                    entries[i].handler(event);
                } catch (e) {
                    KifeJS.log("[EventBus] 错误 (" + type + "): " + e.message);
                }
            }

            return !cancelled;
        },

        // 获取监听器数量
        listenerCount: function(type) {
            return (listeners[type] || []).length;
        }
    };
})();

KifeJS.log("[EventBus] 事件总线已初始化");
```

### 发布者脚本

```javascript
// 脚本: a-player-tracker.js
globalThis.__playerTracker = {
    players: [],

    join: function(playerName) {
        this.players.push(playerName);
        KifeJS.log("[追踪] 玩家加入: " + playerName);

        // 发布事件
        EventBus.emit("player:join", {
            player: playerName,
            time: Date.now(),
            onlineCount: this.players.length
        });
    },

    leave: function(playerName) {
        this.players = this.players.filter(function(p) { return p !== playerName; });

        EventBus.emit("player:leave", {
            player: playerName,
            time: Date.now(),
            onlineCount: this.players.length
        });
    },

    getPlayers: function() {
        return this.players;
    }
};
```

### 订阅者脚本

```javascript
// 脚本: b-welcome.js
// 监听玩家加入事件
EventBus.on("player:join", function(e) {
    KifeJS.log("[欢迎] " + e.data.player + " 加入游戏！当前在线: " + e.data.onlineCount);
    KifeJS.broadcast("欢迎 " + e.data.player + " 来到服务器！");
}, 50);

// 脚本: c-logger.js
EventBus.on("player:join", function(e) {
    KifeJS.log("[日志] 玩家 " + e.data.player + " 于 " + new Date(e.data.time).toLocaleString() + " 加入");
}, 100);

EventBus.on("player:leave", function(e) {
    KifeJS.log("[日志] 玩家 " + e.data.player + " 离开，剩余: " + e.data.onlineCount);
}, 100);

// 脚本: d-monitor.js
EventBus.on("player:join", function(e) {
    var count = e.data.onlineCount;
    if (count > globalThis.__monitor_max || typeof globalThis.__monitor_max === "undefined") {
        globalThis.__monitor_max = count;
        KifeJS.log("[监控] 最高在线更新: " + count);
    }
}, 200);
```

---

## 三、请求-响应模式

通过事件实现类似请求-响应的模式：

```javascript
// 请求者
EventBus.on("response:data-query", function(e) {
    if (e.data.requestId === currentRequestId) {
        KifeJS.log("收到响应: " + JSON.stringify(e.data.result));
    }
});

// 使用唯一 ID 发送请求
var requestId = "req_" + Date.now() + "_" + Math.random();
EventBus.emit("request:data-query", {
    requestId: requestId,
    query: "player_stats",
    params: { player: "Steve" }
});

// 响应者
EventBus.on("request:data-query", function(e) {
    // 处理查询
    var result = { kills: 42, deaths: 10, playtime: "10h" };

    // 发送响应
    EventBus.emit("response:data-query", {
        requestId: e.data.requestId,
        result: result
    });
});
```

---

## 四、事件通道模式

为不同通信场景创建专用事件通道：

```javascript
// 系统事件（高优先级）
EventBus.on("system:shutdown", function(e) {
    KifeJS.log("[系统] 关闭中...");
    // 清理资源
}, 10);

// 玩家事件
EventBus.on("player:chat", function(e) {
    KifeJS.log("[聊天] " + e.data.player + ": " + e.data.message);
});

// 服务端事件
EventBus.on("server:tick", function(e) {
    // 每 tick 执行（注意性能）
}, 100);

// 自定义业务事件
EventBus.on("economy:purchase", function(e) {
    KifeJS.log("[经济] " + e.data.player + " 购买了 " + e.data.item + " 花费 " + e.data.cost);
});

// 错误事件
EventBus.on("system:error", function(e) {
    KifeJS.log("[错误] " + e.data.message + " 来自 " + e.data.source);
    KifeJS.broadcast("系统出现错误，请通知管理员");
});
```

---

## 五、节流与防抖

高频事件的通信控制：

```javascript
// 节流装饰器
function throttle(fn, delayMs) {
    var last = 0;
    return function() {
        var now = Date.now();
        if (now - last >= delayMs) {
            last = now;
            return fn.apply(this, arguments);
        }
    };
}

// 防抖装饰器
function debounce(fn, delayMs) {
    var timer = null;
    return function() {
        var self = this;
        var args = arguments;
        if (timer) clearTimeout(timer);
        timer = setTimeout(function() {
            fn.apply(self, args);
            timer = null;
        }, delayMs);
    };
}

// 使用节流避免高频事件
EventBus.on("server:tick", throttle(function(e) {
    // 每秒最多处理一次
    KifeJS.log("[Tick] " + e.data.tickNumber);
}, 1000));

// 使用防抖合并连续事件
EventBus.on("player:move", debounce(function(e) {
    // 玩家停止移动后 500ms 执行
    KifeJS.log("[移动] " + e.data.player + " 在 " + JSON.stringify(e.data.position));
}, 500));
```

---

## 六、事件桥接模式

将一种事件类型桥接到另一种：

```javascript
// 脚本: bridge.js — 自动生成派生事件
(function() {
    // 当 player:join 发生时，自动触发多个派生子事件
    EventBus.on("player:join", function(e) {
        // 子事件 1：检查是否是新手
        var isNewPlayer = !e.data.player || e.data.player.length < 5;
        EventBus.emit("player:join:" + (isNewPlayer ? "new" : "returning"), {
            player: e.data.player,
            isNew: isNewPlayer
        });

        // 子事件 2：更新计数
        EventBus.emit("stats:update", {
            type: "join",
            player: e.data.player,
            timestamp: e.data.time
        });

        // 子事件 3：如果在线数达到阈值
        if (e.data.onlineCount % 10 === 0) {
            EventBus.emit("server:milestone", {
                type: "player_count",
                value: e.data.onlineCount
            });
        }
    });

    KifeJS.log("[桥接] 事件桥接已初始化");
})();
```

---

## 七、事件驱动通信指南

| 场景 | 推荐的事件类型 | 数据内容 |
|------|---------------|---------|
| 玩家加入 | `player:join` | player, time, onlineCount |
| 玩家离开 | `player:leave` | player, time, onlineCount |
| 玩家聊天 | `player:chat` | player, message, time |
| 服务器启动 | `server:start` | time |
| 执行动作 | `action:xxx` | actor, action, target |
| 状态变化 | `state:change` | key, oldValue, newValue |
| 错误通知 | `system:error` | source, message, stack |
| 自定义事件 | `custom:名称` | 按需定义 |

---

## 下一步

- [数据仓库模式](04-data-repository.md) — 共享数据中心
- [命名空间约定](05-namespace-conventions.md)
