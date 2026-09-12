// ============================================================
// 示例 3: 简单事件总线 — 监听器 A
// 文件位置: docs/09-examples/03-simple-event-bus/listener-a.js
//
// 监听 "player:join" 事件，记录日志并触发广播。
// ============================================================

(function() {
    // 等待 EventBus 就绪
    if (typeof globalThis.EventBus === "undefined") {
        KifeJS.log("[listener-a] EventBus 未就绪");
        return;
    }

    // 注册监听器
    EventBus.on("player:join", function(e) {
        KifeJS.log("[listener-a] 玩家 " + e.data.player + " 加入了游戏");
        KifeJS.log("[listener-a] 当前在线: " + e.data.onlineCount);
    }, 50);

    // 也监听系统事件
    EventBus.on("server:start", function(e) {
        KifeJS.log("[listener-a] 服务器已启动");
    });

    KifeJS.log("[listener-a] 已注册");
})();
