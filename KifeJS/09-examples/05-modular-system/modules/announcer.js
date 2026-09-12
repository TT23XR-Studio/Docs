// ============================================================
// 示例 5: 模块化系统 — Announcer 模块
// 文件位置: docs/09-examples/05-modular-system/modules/announcer.js
//
// 展示模块间的协作：Announcer 依赖 Greeter 发送问候。
// 如果 Greeter 未加载，使用备用逻辑。
// ============================================================

(function() {
    if (typeof globalThis.__core === "undefined") {
        KifeJS.log("[announcer] 错误: 核心系统未加载");
        return;
    }

    var announcer = {
        name: "announcer",

        announce: function(message) {
            KifeJS.broadcast("【公告】" + message);
            KifeJS.log("[announcer] 公告: " + message);
        },

        greet: function(target) {
            // 尝试使用 greeter 模块
            var greeter = globalThis.__core.getModule("greeter");
            if (greeter && typeof greeter.sayHello === "function") {
                var msg = greeter.sayHello(target);
                KifeJS.log("[announcer] 通过 greeter 模块发送问候");
            } else {
                // 备用方案
                KifeJS.log("[announcer] greeter 模块不可用，使用备用问候");
                KifeJS.broadcast("欢迎 " + (target || "玩家") + "！");
            }
        },

        startTimer: function() {
            var self = this;
            setInterval(function() {
                self.announce("服务器运行中... 已运行 "
                    + Math.floor(globalThis.__core.getUptime() / 1000) + " 秒");
            }, 120000);
        }
    };

    // 注册到核心系统
    globalThis.__core.registerModule("announcer", announcer);

    // 测试
    announcer.greet("Steve");
    announcer.announce("模块化系统演示");
    announcer.startTimer();

    KifeJS.log("[announcer] 子模块已加载");
})();
