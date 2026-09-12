# 日志与调试

> **文档索引:** `10-troubleshooting/05-logs-and-debug.md`
>
> 如何使用日志调试 KifeJS 脚本。

---

## 一、日志位置

| 环境 | 日志文件路径 |
|------|-------------|
| **服务端** | `logs/latest.log` |
| **客户端** | `.minecraft/logs/latest.log` |

---

## 二、日志前缀说明

| 前缀 | 来源 | 示例 |
|------|------|------|
| `[KifeJS]` | 模组自身日志 | `[KifeJS] Loading KifeJS scripts from...` |
| `[KifeJS]` | 脚本加载结果 | `[KifeJS] Loaded KifeJS script hello` |
| `[KifeJS]` | 脚本加载失败 | `[KifeJS] Failed to load KifeJS script myscript` |
| `[script]` | `KifeJS.log()` 输出 | `[script] 你好，KifeJS！` |
| `[broadcast requested]` | `KifeJS.broadcast()` | `[broadcast requested] 公告消息` |

---

## 三、调试技巧

### 使用详细日志

```javascript
// 在关键位置添加日志
KifeJS.log("[DEBUG] 函数开始: processData");
KifeJS.log("[DEBUG] 输入参数: " + JSON.stringify(inputData));
KifeJS.log("[DEBUG] 处理结果: " + JSON.stringify(result));
KifeJS.log("[DEBUG] 函数结束: processData");
```

### 使用条件调试日志

```javascript
// 仅在调试模式输出详细日志
var DEBUG = true;  // 或从配置读取

function debug(msg) {
    if (DEBUG) {
        KifeJS.log("[DEBUG] " + msg);
    }
}

debug("这条日志只在调试模式输出");
```

### 测量执行时间

```javascript
var start = Date.now();
// ... 执行操作 ...
var elapsed = Date.now() - start;
KifeJS.log("[性能] 操作耗时: " + elapsed + "ms");
```

### 使用性能监控

参考 [性能监控模式](../07-advanced-patterns/05-performance.md) 中的 `__perfMonitor` 实现。

---

## 四、常见日志解读

### 成功加载

```
[KifeJS] Loading KifeJS scripts from .../KifeJS/scripts/
[KifeJS] Loaded KifeJS script hello
```

### 脚本错误（语法错误）

```
[KifeJS] Failed to load KifeJS script myscript
java.lang.RuntimeException: SyntaxError: Unexpected token ;
    at com.kifejs.script.ScriptRuntime.execute(ScriptRuntime.java:32)
    at com.kifejs.script.ScriptManager.executeAll(ScriptManager.java:44)
```

### 原生库缺失

```
[KifeJS] Failed to initialize KossJS engine
java.lang.UnsatisfiedLinkError: Unable to load library 'kossjs'
    ...
```

---

## 五、创建调试脚本

```javascript
// debug.js — 调试辅助脚本
(function() {
    var DEBUG_CONFIG = {
        enabled: true,
        logLevel: "DEBUG"  // DEBUG | INFO | WARN | ERROR
    };

    var LOG_LEVELS = {
        DEBUG: 0,
        INFO: 1,
        WARN: 2,
        ERROR: 3
    };

    var currentLevel = LOG_LEVELS[DEBUG_CONFIG.logLevel] || LOG_LEVELS.INFO;

    globalThis.__debug = {
        log: function(msg, level) {
            level = level || "DEBUG";
            if (LOG_LEVELS[level] >= currentLevel) {
                KifeJS.log("[" + level + "] " + msg);
            }
        },

        info: function(msg) { this.log(msg, "INFO"); },
        warn: function(msg) { this.log(msg, "WARN"); },
        error: function(msg) { this.log(msg, "ERROR"); },
        debug: function(msg) { this.log(msg, "DEBUG"); },

        // 打印全局变量概览
        dumpGlobals: function() {
            KifeJS.log("=== 全局变量概览 ===");
            for (var key in globalThis) {
                if (key.indexOf("__") === 0 || key.indexOf("KifeJS") === 0) {
                    var val = globalThis[key];
                    var type = typeof val;
                    var summary = type === "object" ? JSON.stringify(val).substring(0, 80) : String(val);
                    KifeJS.log("  " + key + " (" + type + "): " + summary);
                }
            }
            KifeJS.log("====================");
        }
    };

    // 延迟 2 秒后输出全局概览
    setTimeout(function() {
        globalThis.__debug.info("调试系统已启动");
        if (DEBUG_CONFIG.enabled) {
            globalThis.__debug.dumpGlobals();
        }
    }, 2000);
})();
```

---

## 六、调试清单

- [ ] 确认日志文件位置
- [ ] 检查日志中的错误信息
- [ ] 使用 `KifeJS.log()` 添加关键调试信息
- [ ] 使用条件日志避免信息过载
- [ ] 查看完整的错误堆栈
- [ ] 使用调试脚本辅助分析
