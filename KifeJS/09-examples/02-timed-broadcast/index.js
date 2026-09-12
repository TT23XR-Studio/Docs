// ============================================================
// 示例 2: 定时广播
// 文件位置: docs/09-examples/02-timed-broadcast/
//
// 演示定时任务 + 配置分离的使用方式。
// 每 60 秒广播一条消息，消息内容从配置中读取。
//
// 目录结构:
//   timed-broadcast/
//   ├── index.js      ← 入口文件
//   └── config.js     ← 配置文件
//
// 使用方法:
//   1. 将 timed-broadcast/ 整个目录放入 scripts/
//   2. 执行 /kifejs reload
//   3. 查看日志中的定时广播
// ============================================================

// === 配置定义 ===
// config.js 中的配置变量
// __timedBroadcastConfig = {
//     enabled: true,
//     messages: ["欢迎来到服务器!", "祝你游戏愉快!", "KifeJS 正在运行"],
//     intervalSeconds: 60
// };

// === 配置加载 ===
var config = {
    enabled: true,
    messages: ["这是一条默认的定时广播"],
    intervalSeconds: 60
};

var configVarName = "__" + __kife_current_script + "Config";
if (typeof globalThis[configVarName] !== "undefined") {
    var userConfig = globalThis[configVarName];
    if (typeof userConfig.enabled !== "undefined") config.enabled = userConfig.enabled;
    if (typeof userConfig.messages !== "undefined") config.messages = userConfig.messages;
    if (typeof userConfig.intervalSeconds !== "undefined") config.intervalSeconds = userConfig.intervalSeconds;
    KifeJS.log("[" + __kife_current_script + "] 已加载自定义配置");
} else {
    KifeJS.log("[" + __kife_current_script + "] 使用默认配置");
}

// === 主逻辑 ===
var messageIndex = 0;

function broadcastMessage() {
    if (!config.enabled) return;

    var msg = config.messages[messageIndex % config.messages.length];
    KifeJS.broadcast(msg);
    KifeJS.log("[定时广播] 已发送: " + msg);
    messageIndex++;
}

// 立即发送第一条
broadcastMessage();

// 定时发送
var intervalMs = config.intervalSeconds * 1000;
KifeJS.log("[" + __kife_current_script + "] 定时器已设置，间隔: " + config.intervalSeconds + " 秒");

var timerId = setInterval(broadcastMessage, intervalMs);

// 记录 timerId 以便在 reload 时清理（但 reload 会自动清理）
KifeJS.log("[" + __kife_current_script + "] 初始化完成");
