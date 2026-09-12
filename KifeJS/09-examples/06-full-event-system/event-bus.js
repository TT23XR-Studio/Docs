// ============================================================
// 示例 6: 完整事件系统
// 文件位置: docs/09-examples/06-full-event-system/
//
// 企业级事件系统，包含：
//   - 优先级队列
//   - 事件取消链
//   - 中间件支持
//   - 通配符事件
//   - 完整的事件生命周期
//
// 目录结构:
//   full-event-system/
//   ├── event-bus.js          ← 事件总线核心
//   ├── config.js             ← 配置
//   └── listeners/
//       ├── logger.js         ← 日志监听器
//       └── admin-alert.js    ← 管理员告警
//
// 使用方法:
//   将 full-event-system/ 整个目录放入 scripts/
//   执行 /kifejs reload
// ============================================================

// === event-bus.js — 企业级事件总线 ===

(function() {
    // 避免重复创建
    if (typeof globalThis.EnterpriseBus !== "undefined") {
        KifeJS.log("[EnterpriseBus] 已存在，跳过");
        return;
    }

    // --- 事件创建工厂 ---
    function createEvent(type, data) {
        var cancelled = false;
        var propagationStopped = false;
        var cancelStack = [];

        return {
            type: type,
            data: JSON.parse(JSON.stringify(data || {})),
            timestamp: Date.now(),
            metadata: {},

            cancel: function(reason) {
                if (!cancelled) {
                    cancelled = true;
                    cancelStack.push({
                        script: typeof __kife_current_script !== "undefined" ? __kife_current_script : "unknown",
                        reason: reason || "无原因",
                        time: Date.now()
                    });
                    try { new KifeEvent().cancel(); } catch(e) {}
                }
            },

            isCancelled: function() { return cancelled; },
            getCancelStack: function() { return cancelStack; },

            stopPropagation: function() {
                propagationStopped = true;
            },

            isPropagationStopped: function() {
                return propagationStopped;
            }
        };
    }

    // --- 事件总线 ---
    globalThis.EnterpriseBus = {
        _listeners: {},
        _middlewares: [],
        _maxListeners: 30,
        _stats: { emitted: 0, cancelled: 0, errors: 0 },

        // --- 注册监听器 ---
        on: function(pattern, handler, priority) {
            priority = typeof priority === "number" ? priority : 100;

            if (!this._listeners[pattern]) {
                this._listeners[pattern] = [];
            }

            if (this._listeners[pattern].length >= this._maxListeners) {
                KifeJS.log("[EnterpriseBus] 警告: " + pattern + " 监听器超限");
                return;
            }

            this._listeners[pattern].push({
                handler: handler,
                priority: priority,
                pattern: pattern
            });

            this._listeners[pattern].sort(function(a, b) {
                return a.priority - b.priority;
            });
        },

        // --- 一次性监听 ---
        once: function(pattern, handler, priority) {
            var self = this;
            var wrapper = function(event) {
                self.off(pattern, wrapper);
                handler(event);
            };
            this.on(pattern, wrapper, priority);
        },

        // --- 移除监听器 ---
        off: function(pattern, handler) {
            if (!this._listeners[pattern]) return;
            if (handler) {
                this._listeners[pattern] = this._listeners[pattern].filter(function(e) {
                    return e.handler !== handler;
                });
            } else {
                delete this._listeners[pattern];
            }
        },

        // --- 添加中间件 ---
        use: function(middleware) {
            if (typeof middleware === "function") {
                this._middlewares.push(middleware);
            }
        },

        // --- 通配符匹配 ---
        _matches: function(pattern, eventType) {
            if (pattern === eventType) return true;
            if (pattern === "*") return true;

            // 支持 player:* 模式
            var starIdx = pattern.indexOf("*");
            if (starIdx >= 0) {
                var prefix = pattern.substring(0, starIdx);
                var suffix = pattern.substring(starIdx + 1);
                if (eventType.indexOf(prefix) === 0) {
                    if (suffix.length === 0) return true;
                    return eventType.indexOf(suffix) === eventType.length - suffix.length;
                }
            }

            return false;
        },

        // --- 派发事件 ---
        emit: function(type, data) {
            var event = createEvent(type, data);
            this._stats.emitted++;

            // 1. 执行中间件
            for (var i = 0; i < this._middlewares.length; i++) {
                try {
                    this._middlewares[i](event);
                } catch (e) {
                    KifeJS.log("[EnterpriseBus] 中间件错误: " + e.message);
                }
                if (event.isCancelled()) break;
            }

            // 2. 查找匹配的监听器
            var matchedHandlers = [];
            for (var pattern in this._listeners) {
                if (this._listeners.hasOwnProperty(pattern)) {
                    if (this._matches(pattern, type)) {
                        var entries = this._listeners[pattern];
                        for (var e = 0; e < entries.length; e++) {
                            matchedHandlers.push(entries[e]);
                        }
                    }
                }
            }

            // 3. 按优先级排序
            matchedHandlers.sort(function(a, b) {
                return a.priority - b.priority;
            });

            // 4. 执行监听器
            for (var i = 0; i < matchedHandlers.length; i++) {
                if (event.isCancelled() || event.isPropagationStopped()) break;
                try {
                    matchedHandlers[i].handler(event);
                } catch (e) {
                    this._stats.errors++;
                    KifeJS.log("[EnterpriseBus] 错误 (" + type + "): " + e.message);
                }
            }

            // 5. 统计
            if (event.isCancelled()) {
                this._stats.cancelled++;
            }

            return !event.isCancelled();
        },

        // --- 统计信息 ---
        getStats: function() {
            var listenerCount = 0;
            var patterns = [];
            for (var p in this._listeners) {
                if (this._listeners.hasOwnProperty(p)) {
                    patterns.push(p + "(" + this._listeners[p].length + ")");
                    listenerCount += this._listeners[p].length;
                }
            }

            return {
                patterns: patterns,
                totalListeners: listenerCount,
                emitted: this._stats.emitted,
                cancelled: this._stats.cancelled,
                errors: this._stats.errors,
                middlewares: this._middlewares.length
            };
        },

        // --- 清除所有 ---
        clear: function() {
            this._listeners = {};
            this._middlewares = [];
            KifeJS.log("[EnterpriseBus] 已清除所有监听器和中间件");
        }
    };

    // --- 添加全局中间件 ---

    // 中间件 1: 注入元数据
    EnterpriseBus.use(function(event) {
        event.metadata.sourceScript = typeof __kife_current_script !== "undefined"
            ? __kife_current_script : "unknown";
        event.metadata.serverTime = Date.now();
    });

    // 中间件 2: 日志所有事件
    EnterpriseBus.use(function(event) {
        KifeJS.log("[EventLog] " + event.type + " -> "
            + JSON.stringify(event.data).substring(0, 100));
    });

    // 中间件 3: 频率控制
    (function() {
        var recentEvents = {};
        EnterpriseBus.use(function(event) {
            var key = event.type;
            var now = Date.now();
            if (!recentEvents[key]) recentEvents[key] = [];
            recentEvents[key] = recentEvents[key].filter(function(t) {
                return now - t < 1000;
            });
            if (recentEvents[key].length > 10) {
                KifeJS.log("[EnterpriseBus] 频率限制: " + key);
                event.cancel("事件频率过高");
            }
            recentEvents[key].push(now);
        });
    })();

    KifeJS.log("[EnterpriseBus] 企业级事件总线已启动");

    // --- 测试事件派发 ---
    KifeJS.log("[EnterpriseBus] 测试: 派发测试事件");
    EnterpriseBus.emit("system:ready", { version: "1.0.0" });

    var stats = EnterpriseBus.getStats();
    KifeJS.log("[EnterpriseBus] 统计: " + JSON.stringify(stats));
})();
