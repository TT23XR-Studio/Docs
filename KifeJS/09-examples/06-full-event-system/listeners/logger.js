// ============================================================
// 示例 6: 完整事件系统 — Logger 监听器
// 文件位置: docs/09-examples/06-full-event-system/listeners/logger.js
// ============================================================

(function() {
    if (typeof EnterpriseBus === "undefined") {
        KifeJS.log("[logger] EnterpriseBus 不可用");
        return;
    }

    // 监听所有系统事件
    EnterpriseBus.on("system:*", function(e) {
        KifeJS.log("[logger] 系统事件: " + e.type + " -> " + JSON.stringify(e.data));
    }, 200);

    // 监听所有玩家事件
    EnterpriseBus.on("player:*", function(e) {
        KifeJS.log("[logger] 玩家事件: " + e.type + " 玩家=" + (e.data.player || "unknown"));
    }, 200);

    // 监听错误事件
    EnterpriseBus.on("system:error", function(e) {
        KifeJS.log("[logger] 错误: " + e.data.message);
    }, 100);

    KifeJS.log("[logger] 监听器已注册");
})();
