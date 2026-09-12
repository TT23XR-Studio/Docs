// ============================================================
// 示例 6: 完整事件系统 — Admin Alert 监听器
// 文件位置: docs/09-examples/06-full-event-system/listeners/admin-alert.js
//
// 模拟管理员告警：当关键事件发生时发送告警。
// ============================================================

(function() {
    if (typeof EnterpriseBus === "undefined") {
        KifeJS.log("[admin-alert] EnterpriseBus 不可用");
        return;
    }

    // 高优先级：服务器关闭告警
    EnterpriseBus.on("shutdown", function(e) {
        KifeJS.log("[admin-alert] ⚠ 服务器即将关闭!");
        KifeJS.broadcast("管理员请注意：服务器关闭中");
    }, 10);

    // 中优先级：玩家异常行为
    EnterpriseBus.on("player:abuse", function(e) {
        KifeJS.log("[admin-alert] ⚠ 玩家异常: " + e.data.player
            + " - " + (e.data.reason || "未知原因"));
    }, 50);

    // 低优先级：服务器状态
    EnterpriseBus.on("server:status", function(e) {
        if (e.data.critical) {
            KifeJS.log("[admin-alert] 严重: " + e.data.message);
        }
    }, 100);

    KifeJS.log("[admin-alert] 告警监听器已注册");
})();
