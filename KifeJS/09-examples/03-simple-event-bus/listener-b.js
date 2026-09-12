// ============================================================
// 示例 3: 简单事件总线 — 监听器 B
// 文件位置: docs/09-examples/03-simple-event-bus/listener-b.js
//
// 监听 "player:join" 事件和 "server:start" 事件。
// 事件取消演示。
// ============================================================

(function() {
    if (typeof globalThis.EventBus === "undefined") {
        KifeJS.log("[listener-b] EventBus 未就绪");
        return;
    }

    // 高优先级：做安全检查
    EventBus.on("player:join", function(e) {
        // 模拟：阻止特定玩家
        if (e.data.player === "Notch") {
            KifeJS.log("[listener-b] 阻止玩家 " + e.data.player + " 加入");
            e.cancel();
        }
    }, 10);  // 高优先级

    // 普通优先级：记录日志
    EventBus.on("player:join", function(e) {
        if (e.isCancelled()) {
            KifeJS.log("[listener-b] 玩家加入被取消");
            return;
        }
        KifeJS.log("[listener-b] 记录: " + e.data.player + " 上线");
    }, 100);

    // 测试：模拟派发事件
    KifeJS.log("[listener-b] 测试事件系统...");
    EventBus.emit("server:start", { time: Date.now() });
    EventBus.emit("player:join", { player: "Alex", onlineCount: 1 });
    EventBus.emit("player:join", { player: "Notch", onlineCount: 2 });

    KifeJS.log("[listener-b] 已注册");
})();
