// ============================================================
// 示例 4: 跨脚本计数器 — 显示服务
// 文件位置: docs/09-examples/04-cross-script-counter/display.js
//
// 从 counter.js 读取计数并显示。
// 演示跨脚本通过数据仓库通信。
// ============================================================

(function() {
    // 依赖检查
    if (typeof globalThis.__counterService === "undefined") {
        KifeJS.log("[" + __kife_current_script + "] 错误: counterService 不可用");
        return;
    }

    // 添加更多计数
    globalThis.__counterService.increment("displayLoads");
    globalThis.__counterService.increment("events");

    // 读取并显示所有计数
    KifeJS.log("=== 跨脚本计数器报告 ===");
    var allCounters = globalThis.__counterService.getAll();
    for (var key in allCounters) {
        if (allCounters.hasOwnProperty(key)) {
            KifeJS.log("  " + key + ": " + allCounters[key]);
        }
    }
    KifeJS.log("=========================");

    // 定时更新计数
    setInterval(function() {
        globalThis.__counterService.increment("heartbeats");
        var count = globalThis.__counterService.get("heartbeats");
        KifeJS.log("[display] 心跳 #" + count + " (总事件: " + globalThis.__counterService.get("events") + ")");
    }, 30000);

    KifeJS.log("[" + __kife_current_script + "] 显示服务已启动");
})();
