// ============================================================
// 示例 6: 完整事件系统 — 配置
// 文件位置: docs/09-examples/06-full-event-system/config.js
// ============================================================

__enterpriseBusConfig = {
    debug: true,
    maxListenersPerEvent: 30,
    enableRateLimit: true,
    rateLimitPerSecond: 10
};
