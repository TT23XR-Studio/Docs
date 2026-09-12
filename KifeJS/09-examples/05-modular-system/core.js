// ============================================================
// 示例 5: 模块化系统
// 文件位置: docs/09-examples/05-modular-system/
//
// 演示完整的模块化组织方式：
//   - 核心模块 (core.js)
//   - 子模块 (modules/greeter.js, modules/announcer.js)
//   - 配置文件 (config.js)
//
// 目录结构:
//   modular-system/
//   ├── core.js
//   ├── config.js
//   └── modules/
//       ├── greeter.js
//       └── announcer.js
//
// 使用方法:
//   将 modular-system/ 整个目录放入 scripts/
//   执行 /kifejs reload
// ============================================================

// === core.js — 核心模块 ===

(function() {
    KifeJS.log("[" + __kife_current_script + "] 核心模块加载中...");

    // 加载配置
    var cfgName = "__" + __kife_current_script + "Config";
    var config = (typeof globalThis[cfgName] !== "undefined")
        ? globalThis[cfgName]
        : {};

    // 创建核心命名空间
    globalThis.__core = {
        name: "CoreSystem",
        version: "1.0.0",
        config: config,
        startTime: Date.now(),
        modules: {},

        // 注册子模块
        registerModule: function(name, module) {
            this.modules[name] = module;
            KifeJS.log("[core] 注册模块: " + name);
        },

        // 获取模块
        getModule: function(name) {
            return this.modules[name] || null;
        },

        // 日志工具
        log: function(msg) {
            KifeJS.log("[Core] " + msg);
        },

        // 获取运行时间
        getUptime: function() {
            return Date.now() - this.startTime;
        }
    };

    KifeJS.log("[core] 核心模块已加载");
})();
