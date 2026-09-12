# KifeJS.broadcast() — 广播

> **文档索引:** `04-api-reference/02-KifeJS-broadcast.md`
>
> 请求广播一条消息。当前版本记录为日志，预留为游戏内聊天/控制台广播接口。

---

## 签名

```javascript
KifeJS.broadcast(message)
```

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `message` | `any` | 否 | 要广播的消息。未提供时广播空字符串 |

| 返回值 | 类型 | 说明 |
|--------|------|------|
| `"queued"` | `string` | 表示广播请求已入队 |

---

## 底层实现

```java
// KifeApi.java
public String broadcast(String message) {
    KifeJSMod.LOGGER.info("[broadcast requested] {}", message);
    return "queued";
}
```

日志输出格式：
```
[broadcast requested] <message>
```

当前版本中，broadcast **仅记录日志**，不会真正向游戏内玩家发送消息。`"queued"` 返回值暗示未来版本将实现异步广播队列。

---

## 基础用法

### 简单广播

```javascript
KifeJS.broadcast("服务器即将重启，请做好准备！");
// 日志: [broadcast requested] 服务器即将重启，请做好准备！
```

### 带变量的广播

```javascript
var minutes = 5;
KifeJS.broadcast("服务器将在 " + minutes + " 分钟后重启");
// 日志: [broadcast requested] 服务器将在 5 分钟后重启
```

---

## 进阶用法

### 条件广播

```javascript
// 仅在特定条件下广播
var playerCount = 0;
if (playerCount > 0) {
    KifeJS.broadcast("欢迎新玩家加入！");
} else {
    KifeJS.log("无玩家在线，跳过广播");
}
```

### 定时广播

```javascript
// 使用 setInterval 定时广播（如引擎支持）
if (typeof setInterval !== "undefined") {
    var intervalId = setInterval(function() {
        KifeJS.broadcast("这是一条定时广播消息");
    }, 60000);  // 每 60 秒广播一次

    // 记录 intervalId 以便后续清除
    globalThis.__intervals = globalThis.__intervals || [];
    globalThis.__intervals.push(intervalId);
}
```

### 广播封装

```javascript
// 封装广播函数，增加控制逻辑
var broadcast = {
    lastTime: 0,
    minInterval: 5000,  // 最小间隔 5 秒

    send: function(message) {
        var now = Date.now();
        if (now - this.lastTime >= this.minInterval) {
            KifeJS.broadcast(message);
            this.lastTime = now;
            return true;
        }
        KifeJS.log("广播节流: " + message);
        return false;
    },

    sendImportant: function(message) {
        KifeJS.broadcast("[重要] " + message);
        this.lastTime = Date.now();
    }
};

// 使用
broadcast.send("欢迎！");           // 发送广播
broadcast.send("欢迎！");           // 被节流，仅记录日志
broadcast.sendImportant("紧急通知"); // 跳过节流，强制广播
```

---

## 边界情况

| 输入 | 日志输出 | 说明 |
|------|---------|------|
| `KifeJS.broadcast()` | `[broadcast requested] ` | 空参数 |
| `KifeJS.broadcast("")` | `[broadcast requested] ` | 空字符串 |
| `KifeJS.broadcast(0)` | `[broadcast requested] 0` | 数字 |
| `KifeJS.broadcast(true)` | `[broadcast requested] true` | 布尔 |
| `KifeJS.broadcast(null)` | `[broadcast requested] null` | null |

---

## 与 log 的对比

| 维度 | `KifeJS.log()` | `KifeJS.broadcast()` |
|------|----------------|----------------------|
| **目的** | 调试/记录 | 向玩家发送消息 |
| **当前行为** | 写 `[script]` 日志 | 写 `[broadcast requested]` 日志 |
| **未来行为** | 不变 | 向所有在线玩家发送聊天消息 |
| **返回值** | `"ok"` | `"queued"` |
| **频率控制** | 建议自行控制 | 建议自行控制 |

---

## 与 KifeJSConfig 配合

```javascript
// 使用全局配置控制广播行为
if (KifeJSConfig && KifeJSConfig.enabled) {
    KifeJS.broadcast("服务器公告：欢迎游玩！");
} else {
    KifeJS.log("广播功能已禁用（KifeJSConfig.enabled = false）");
}
```

---

## 最佳实践

1. **不要过于频繁广播** — 会刷屏。建议最小间隔 5 秒以上
2. **结合实际场景** — 仅在有意义时广播（玩家加入、服务器事件等）
3. **预留节流** — 即使未来版本实现了真正的广播，高频率调用仍可能被限制
4. **配合 log 使用** — 将广播和日志结合，保留完整记录

---

## 未来展望

`"queued"` 返回值暗示 `KifeJS.broadcast()` 在后续版本中可能：

- 将消息推送到消息队列
- 异步发送给所有在线玩家
- 支持格式化（颜色、点击事件等）
- 支持广播类型（聊天栏、标题、操作栏）

---

## 下一步

- 了解 [KifeJSConfig](03-KifeJSConfig.md)
- 学习 [KifeEvent](04-KifeEvent.md)
