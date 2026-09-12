# 事件系统核心概念

> **文档索引:** `05-event-system/01-concepts.md`
>
> 理解事件驱动编程模型以及 KifeJS 中事件系统的设计哲学。

---

## 一、什么是事件系统？

事件系统是一种编程模式，核心思想是：**当某件事发生时，通知对此感兴趣的其他代码**。

```
┌──────────┐      事件派发      ┌──────────────┐
│ 事件源    │ ─────────────────→ │  事件总线     │
│ (Event    │                    │  (Event Bus)  │
│  Source)  │                    └──────┬───────┘
└──────────┘                            │
                                        │ 通知所有监听器
                                        ▼
                               ┌──────────────────┐
                               │  Listener A       │
                               │  "收到事件"       │
                               ├──────────────────┤
                               │  Listener B       │
                               │  "收到事件"       │
                               └──────────────────┘
```

### 核心角色

| 角色 | 说明 | 类比 |
|------|------|------|
| **事件 (Event)** | 发生的事情，包含类型和数据 | 邮件 |
| **事件源 (Source)** | 触发事件的代码 | 发件人 |
| **事件总线 (Event Bus)** | 管理注册和派发的中介 | 邮局 |
| **监听器 (Listener)** | 对事件感兴趣的代码 | 收件人 |

---

## 二、为什么需要事件系统？

### 没有事件系统的问题

```javascript
// 脚本 A：核心逻辑
function onPlayerJoin(name) {
    // ❸ 需要直接调用其他脚本的函数
    ScriptB.notify(name);
    ScriptC.logPlayer(name);
    ScriptD.checkBan(name);
    // 问题：A 必须知道 B/C/D 的存在
    // 添加 E 时需要修改 A
}
```

### 使用事件系统后

```javascript
// 脚本 A：只负责通知"玩家加入"这件事
function onPlayerJoin(name) {
    EventBus.emit("player:join", { player: name });
    // A 不需要知道谁在处理
}

// 脚本 B：注册监听，独立关注
EventBus.on("player:join", function(e) {
    notify(e.data.player);
});

// 脚本 C：注册监听，独立关注
EventBus.on("player:join", function(e) {
    logPlayer(e.data.player);
});

// 脚本 D：注册监听，独立关注
EventBus.on("player:join", function(e) {
    checkBan(e.data.player);
});
```

**解耦 — 这是事件系统最核心的价值。**

---

## 三、KifeJS 中的事件系统架构

KifeJS 提供了事件系统的"基础砖块"——`KifeEvent` 类。完整的事件总线需要您在 JS 中构建。

```
                    KifeJS 提供
                    ┌──────────┐
                    │ KifeEvent│  ← 基础事件类（含 cancel）
                    └──────────┘
                          │
                  用户 JS 构建
                    ┌──────────┐
                    │ EventBus │  ← 事件总线
                    ├──────────┤
                    │ Listener │  ← 监听器管理
                    ├──────────┤
                    │ 优先级   │  ← 执行顺序控制
                    ├──────────┤
                    │ 拦截器   │  ← 事件过滤
                    └──────────┘
```

---

## 四、事件的生命周期（核心模型）

```
                    事件生命周期
                         │
                   ① 创建事件
                    createEvent(type, data)
                         │
                         ▼
                   ② 派发到总线
                    EventBus.emit(event)
                         │
                         ▼
                   ③ 总线检查
                    ┌───┴───┐
                    │ 是否有 │──否──→ 事件结束（无监听器）
                    │ 监听器 │
                    └───┬───┘
                        │ 是
                        ▼
                   ④ 遍历监听器
                    ┌───┴───┐
                    │ 排序   │  ← 按优先级排序
                    └───┬───┘
                        ▼
                   ⑤ 逐个调用监听器
                    ┌─────────────┐
                    │ Listener A  │────→ 可取消事件
                    ├─────────────┤
                    │ Listener B  │────→ 可取消事件
                    ├─────────────┤
                    │ Listener C  │────→ 可取消事件
                    └─────────────┘
                        │
                        ▼
                   ⑥ 事件结束
                    return cancelled? 
```

---

## 五、事件类型命名约定

建议使用 **冒号分隔的层级命名**：

```javascript
// 通用格式: <域>:<动作>:<细节>

"player:join"           // 玩家加入
"player:leave"          // 玩家离开
"player:chat:before"    // 玩家发言前（可取消）
"player:chat:after"     // 玩家发言后

"server:tick"           // 服务端 tick
"server:start"          // 服务器启动

"system:reload"         // 脚本重载
"system:error"          // 系统错误

"custom:my-event"       // 自定义事件
```

### 命名规则

| 规则 | 示例 |
|------|------|
| 全小写 | `player:join` |
| 冒号分层 | `player:chat:before` |
| 动词在后 | `server:start` |
| 避免空格 | 使用 `-` 或 `:` |

---

## 六、事件数据规范

事件携带的数据应使用 `data` 对象：

```javascript
// ✅ 推荐：数据在 event.data 中
EventBus.emit("player:join", {
    player: "Steve",
    uuid: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    timestamp: Date.now()
});

// ❌ 避免：直接在事件上设置数据
// EventBus.emit("player:join", "Steve");  // 太简单
```

---

## 七、内置 KifeEvent vs 构建的事件系统

| 维度 | `KifeEvent`（内置） | `EventBus`（JS 构建） |
|------|-------------------|---------------------|
| 提供者 | KifeJS | 用户代码 |
| 功能 | `cancel()` 方法 | on/emit/off/once |
| 状态跟踪 | 不自动跟踪 | 完整生命周期 |
| 优先级 | 不支持 | 可支持 |
| 灵活性 | 低（基础砖块） | 高 |

---

## 八、设计原则

1. **解耦** — 事件源不需要知道谁在监听
2. **可取消** — 监听器可以阻止后续处理
3. **顺序保证** — 监听器按优先级依次执行
4. **数据隔离** — 事件数据通过 `data` 对象传递
5. **错误隔离** — 单个监听器失败不影响其他监听器

---

## 九、在 KifeJS 中使用事件系统的价值

| 场景 | 不使用事件系统 | 使用事件系统 |
|------|--------------|-------------|
| 添加新功能 | 修改已有脚本 | 注册新监听器 |
| 禁用功能 | 删除/注释代码 | 取消注册监听器 |
| 功能间通信 | 直接调用函数 | 通过事件总线 |
| 插件化 | 不支持 | 天然支持 |
| 调试 | 困难 | 可以通过事件日志追踪 |

---

## 下一步

- [构建事件总线](02-building-event-bus.md) — 从零实现
- 了解 [事件生命周期](03-event-lifecycle.md)
