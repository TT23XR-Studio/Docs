# KifeJS.log() — 日志记录

> **文档索引:** `04-api-reference/01-KifeJS-log.md`
>
> 将消息写入 Minecraft 日志，后缀为 `[script]`。

---

## 签名

```javascript
KifeJS.log(message)
```

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `message` | `any` | 否 | 要记录的消息。未提供时记录空字符串 |

| 返回值 | 类型 | 说明 |
|--------|------|------|
| `"ok"` | `string` | 固定返回字符串 "ok" |

---

## 底层实现

```java
// KifeApi.java
public String log(String message) {
    KifeJSMod.LOGGER.info("[script] {}", message);
    return "ok";
}

// ScriptRuntime.java - 注册为 JS 函数
koss.registerFunction("KifeJS.log", args -> api.log(args.length == 0 ? "" : args[0]));
```

日志输出格式：
```
[script] <message>
```

---

## 基础用法

### 简单消息

```javascript
KifeJS.log("Hello World");
// 日志输出: [script] Hello World
```

### 记录变量值

```javascript
var playerCount = 12;
var serverName = "生存服";
KifeJS.log("服务器 " + serverName + " 当前在线: " + playerCount + " 人");
// 日志输出: [script] 服务器 生存服 当前在线: 12 人
```

### 记录数字

```javascript
KifeJS.log(42);
// 日志输出: [script] 42

KifeJS.log(3.14159);
// 日志输出: [script] 3.14159
```

### 记录布尔值

```javascript
KifeJS.log(true);
// 日志输出: [script] true

KifeJS.log(false);
// 日志输出: [script] false
```

### 记录对象

```javascript
// 对象会被转为字符串
KifeJS.log({name: "KifeJS", version: 1});
// 日志输出: [script] [object Object]
```

> 如需查看对象结构，手动格式化：
> ```javascript
> var obj = {name: "KifeJS", version: 1};
> KifeJS.log("对象: " + obj.name + ", v" + obj.version);
> // 日志输出: [script] 对象: KifeJS, v1
> ```

---

## 进阶用法

### 条件日志

```javascript
var debugMode = true;

if (debugMode) {
    KifeJS.log("[DEBUG] 正在初始化模块...");
}

// 或者使用三元表达式
KifeJS.log("状态: " + (debugMode ? "调试模式" : "生产模式"));
```

### 格式化日志函数

```javascript
// 创建自定义日志函数
function logInfo(tag, msg) {
    KifeJS.log("[" + tag + "] " + msg);
}

function logError(msg) {
    KifeJS.log("[ERROR] " + msg);
}

function logDebug(msg) {
    if (globalThis.__appConfig && globalThis.__appConfig.debug) {
        KifeJS.log("[DEBUG] " + msg);
    }
}

// 使用
logInfo("系统", "服务已启动");
logError("连接超时");
logDebug("加载配置耗时 15ms");
```

### 使用 JSON 序列化

```javascript
function logJSON(obj, label) {
    var prefix = label ? label + ": " : "";
    KifeJS.log(prefix + JSON.stringify(obj));
}

var stats = {
    uptime: 3600,
    scripts: 5,
    memory: "64MB"
};

logJSON(stats, "运行时状态");
// 日志输出: [script] 运行时状态: {"uptime":3600,"scripts":5,"memory":"64MB"}
```

### 日志计数器

```javascript
// 带计数器的日志，避免重复消息刷屏
var logCounter = {};

function logOnce(key, message) {
    if (!logCounter[key]) {
        KifeJS.log(message);
        logCounter[key] = true;
    }
}

// 每秒调用多次，但只记录一次
logOnce("init", "系统初始化完成");  // 记录
logOnce("init", "系统初始化完成");  // 不记录（已存在）
```

### 分层日志级别

```javascript
var LOG_LEVELS = {
    NONE: 0,
    ERROR: 1,
    WARN: 2,
    INFO: 3,
    DEBUG: 4,
    TRACE: 5
};

var currentLogLevel = (typeof __appConfig !== "undefined" && __appConfig.logLevel)
    ? __appConfig.logLevel : LOG_LEVELS.INFO;

function log(level, levelName, msg) {
    if (level <= currentLogLevel) {
        KifeJS.log("[" + levelName + "] " + msg);
    }
}

function logError(msg)   { log(LOG_LEVELS.ERROR, "ERROR",   msg); }
function logWarn(msg)    { log(LOG_LEVELS.WARN,  "WARN",    msg); }
function logInfo(msg)    { log(LOG_LEVELS.INFO,  "INFO",    msg); }
function logDebug(msg)   { log(LOG_LEVELS.DEBUG, "DEBUG",   msg); }
function logTrace(msg)   { log(LOG_LEVELS.TRACE, "TRACE",   msg); }

// 使用
logInfo("服务正常");
logDebug("缓冲池命中率: 98.5%");  // 仅当 logLevel >= DEBUG 时输出
```

---

## 边界情况

| 输入 | 输出 | 说明 |
|------|------|------|
| `KifeJS.log()` | `[script] ` | 空参数 → 空字符串 |
| `KifeJS.log("")` | `[script] ` | 空字符串 |
| `KifeJS.log(null)` | `[script] null` | null → 字符串 "null" |
| `KifeJS.log(undefined)` | `[script] undefined` | undefined → "undefined" |
| `KifeJS.log(0)` | `[script] 0` | 数字 0 |
| `KifeJS.log(false)` | `[script] false` | 布尔值 |
| `KifeJS.log(NaN)` | `[script] NaN` | 非数字 |
| `KifeJS.log(Infinity)` | `[script] Infinity` | 无穷大 |
| `KifeJS.log(function(){})` | `[script] function (){}` | 函数 → 源码字符串 |

---

## 返回值的用途

```javascript
var result = KifeJS.log("测试");
KifeJS.log("log 返回值: " + result);
// 日志输出: [script] 测试
// 日志输出: [script] log 返回值: ok
```

`"ok"` 返回值目前无实际语义用途，仅供确认调用成功。

---

## 最佳实践

| 场景 | 建议 |
|------|------|
| 调试 | 使用条件日志（`debugMode` 开关） |
| 生产 | 仅记录关键信息和错误 |
| 大量日志 | 使用节流/计数器避免日志泛滥 |
| 多脚本 | 使用标签/前缀区分来源 |
| 敏感信息 | 不要记录密码、令牌 |

---

## 常见问题

**Q: 日志输出在哪里？**
A: 服务端日志 `logs/latest.log`，客户端日志 `.minecraft/logs/latest.log`

**Q: 如何区分不同脚本的日志？**
A: 使用 `__kife_current_script` 变量或自定义前缀

```javascript
KifeJS.log("[" + __kife_current_script + "] 初始化完成");
```

**Q: 日志有大小限制吗？**
A: 没有单条限制。但大量日志会影响性能，建议合理控制。

---

## 下一步

- 学习 [KifeJS.broadcast()](02-KifeJS-broadcast.md)
- 了解 [KifeJSConfig](03-KifeJSConfig.md)
