// ============================================================
// 示例 5: 模块化系统 — Greeter 模块
// 文件位置: docs/09-examples/05-modular-system/modules/greeter.js
//
// 演示子模块如何注册到核心系统。
// ============================================================

(function() {
    // 检查核心系统是否可用
    if (typeof globalThis.__core === "undefined") {
        KifeJS.log("[greeter] 错误: 核心系统未加载");
        return;
    }

    if (typeof globalThis.__core.getModule !== "function") {
        KifeJS.log("[greeter] 错误: 核心系统版本不兼容");
        return;
    }

    // 定义 Greeter 模块
    var greeter = {
        name: "greeter",
        greeting: "你好！",

        sayHello: function(target) {
            var msg = this.greeting + " " + (target || "世界");
            KifeJS.log("[greeter] " + msg);
            return msg;
        },

        setGreeting: function(newGreeting) {
            this.greeting = newGreeting;
            KifeJS.log("[greeter] 问候语已更新: " + newGreeting);
        }
    };

    // 注册到核心系统
    globalThis.__core.registerModule("greeter", greeter);

    // 使用模块
    greeter.sayHello("KifeJS");
    greeter.sayHello();

    KifeJS.log("[greeter] 子模块已加载");
})();
