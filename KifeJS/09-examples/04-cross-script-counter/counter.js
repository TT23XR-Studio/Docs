// ============================================================
// 示例 4: 跨脚本计数器
// 文件位置: docs/09-examples/04-cross-script-counter/
//
// 演示两个脚本通过数据仓库跨脚本通信。
//
// 目录结构:
//   cross-script-counter/
//   ├── counter.js     ← 计数器服务
//   └── display.js     ← 显示服务
//
// 使用方法:
//   将 cross-script-counter/ 整个目录放入 scripts/
//   执行 /kifejs reload
// ============================================================

// === counter.js — 计数器服务 ===

(function() {
    // 创建数据仓库（如果不存在）
    if (typeof globalThis.__store === "undefined") {
        globalThis.__store = {
            _data: {},

            set: function(namespace, key, value) {
                if (!this._data[namespace]) this._data[namespace] = {};
                this._data[namespace][key] = value;
            },

            get: function(namespace, key) {
                if (this._data[namespace]) {
                    return this._data[namespace][key];
                }
                return undefined;
            },

            update: function(namespace, key, updater) {
                var current = this.get(namespace, key);
                var newValue = updater(current);
                this.set(namespace, key, newValue);
                return newValue;
            },

            getNamespace: function(namespace) {
                return this._data[namespace] || {};
            }
        };
        KifeJS.log("[store] 数据仓库已创建");
    }

    // 计数器 API
    globalThis.__counterService = {
        // 递增计数器
        increment: function(name) {
            return globalThis.__store.update("counters", name, function(c) {
                return (c || 0) + 1;
            });
        },

        // 获取计数器值
        get: function(name) {
            return globalThis.__store.get("counters", name) || 0;
        },

        // 重置计数器
        reset: function(name) {
            globalThis.__store.set("counters", name, 0);
        },

        // 获取所有计数
        getAll: function() {
            return globalThis.__store.getNamespace("counters");
        }
    };

    // 初始化一些计数器
    globalThis.__counterService.increment("scriptLoads");
    globalThis.__counterService.increment("scriptLoads");
    globalThis.__counterService.increment("events");

    KifeJS.log("[" + __kife_current_script + "] 计数器服务已启动");
    KifeJS.log("[" + __kife_current_script + "] 脚本加载计数: " + globalThis.__counterService.get("scriptLoads"));
})();
