// ============================================================
// 示例 3: 简单事件总线
// 文件位置: docs/09-examples/03-simple-event-bus/
//
// 演示多文件协作：事件总线 + 多个监听器。
//
// 目录结构:
//   simple-event-bus/
//   ├── bus.js          ← 事件总线定义
//   ├── listener-a.js   ← 监听器 A
//   └── listener-b.js   ← 监听器 B
//
// 使用方法:
//   将 simple-event-bus/ 整个目录放入 scripts/
//   执行 /kifejs reload
// ============================================================

// === bus.js — 事件总线 ===

(function() {
    // 确保只注册一次
    if (typeof globalThis.EventBus !== "undefined") {
        KifeJS.log("[EventBus] 已存在，跳过注册");
        return;
    }

    var listeners = {};

    globalThis.EventBus = {
        // 注册监听器
        on: function(type, handler, priority) {
            if (typeof handler !== "function") return;
            if (!listeners[type]) listeners[type] = [];
            listeners[type].push({
                handler: handler,
                priority: typeof priority === "number" ? priority : 100
            });
            listeners[type].sort(function(a, b) {
                return a.priority - b.priority;
            });
            KifeJS.log("[EventBus] 注册监听: " + type);
        },

        // 取消监听
        off: function(type, handler) {
            if (!listeners[type]) return;
            if (handler) {
                listeners[type] = listeners[type].filter(function(e) {
                    return e.handler !== handler;
                });
            } else {
                delete listeners[type];
            }
        },

        // 派发事件
        emit: function(type, data) {
            var entries = listeners[type];
            if (!entries || entries.length === 0) return true;

            var cancelled = false;
            var event = {
                type: type,
                data: data || {},
                _cancelled: false,
                cancel: function() { this._cancelled = true; cancelled = true; },
                isCancelled: function() { return this._cancelled; }
            };

            KifeJS.log("[EventBus] 派发: " + type + " -> " + entries.length + " 个监听器");

            for (var i = 0; i < entries.length; i++) {
                if (cancelled) break;
                try {
                    entries[i].handler(event);
                } catch (e) {
                    KifeJS.log("[EventBus] 错误: " + e.message);
                }
            }

            return !cancelled;
        },

        // 一次性监听
        once: function(type, handler) {
            var self = this;
            var wrapper = function(event) {
                self.off(type, wrapper);
                handler(event);
            };
            this.on(type, wrapper);
        }
    };

    KifeJS.log("[EventBus] 事件总线已创建");
})();
