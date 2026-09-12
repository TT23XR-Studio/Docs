# KifeJSConfig — 全局配置对象

> **文档索引:** `04-api-reference/03-KifeJSConfig.md`
>
> KifeJS 在全局作用域中提供的配置对象。所有脚本均可访问。

---

## 定义

```javascript
// 引擎初始化时设置
globalThis.KifeJSConfig = { enabled: true };
```

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `enabled` | `boolean` | `true` | 全局启用/禁用开关 |

---

## 底层实现

```java
// ScriptRuntime.registerApi()
koss.setGlobalJson("KifeJSConfig", "{\"enabled\":true}");
```

使用 `setGlobalJson` 方法将 JSON 字符串解析为 JavaScript 对象并设为全局变量。

---

## 基础用法

### 读取配置

```javascript
// 检查系统是否启用
if (KifeJSConfig.enabled) {
    KifeJS.log("KifeJS 已启用");
} else {
    KifeJS.log("KifeJS 已禁用");
}
```

### 修改配置

```javascript
// 运行时修改
KifeJSConfig.enabled = false;
KifeJS.log("全局已禁用");  // 仍然会执行，因为 log 独立于 enabled

// 再次启用
KifeJSConfig.enabled = true;
```

---

## 进阶用法

### 功能开关

```javascript
// 使用 KifeJSConfig 控制功能模块
function runFeature(featureName, featureFn) {
    if (KifeJSConfig && KifeJSConfig.enabled) {
        KifeJS.log("执行功能: " + featureName);
        featureFn();
    } else {
        KifeJS.log("功能已禁用: " + featureName);
    }
}

// 定义功能
function broadcastAnnouncement() {
    KifeJS.broadcast("系统运行正常");
}

// 通过开关控制
runFeature("广播通知", broadcastAnnouncement);
```

### 扩展配置属性

```javascript
// KifeJSConfig 是普通对象，可以扩展
KifeJSConfig.debugMode = true;
KifeJSConfig.serverName = "我的生存服";
KifeJSConfig.maxPlayers = 100;

KifeJS.log("服务器: " + KifeJSConfig.serverName + ", 调试模式: " + KifeJSConfig.debugMode);
```

### 配置守卫

```javascript
// 安全访问，防止配置未定义
function isEnabled() {
    return typeof KifeJSConfig !== "undefined" && KifeJSConfig.enabled === true;
}

if (isEnabled()) {
    // 执行主逻辑
}
```

### 多级配置扩展

```javascript
// 在 KifeJSConfig 上构建分层配置
KifeJSConfig.features = {
    broadcast: {
        enabled: true,
        interval: 120
    },
    logging: {
        level: "INFO",
        verbose: false
    },
    events: {
        enabled: true,
        maxListeners: 10
    }
};

// 使用
if (KifeJSConfig.features.broadcast.enabled) {
    KifeJS.log("广播功能已启用，间隔: " + KifeJSConfig.features.broadcast.interval + "秒");
}
```

---

## 与重载的关系

**每次 `/kifejs reload` 后 `KifeJSConfig` 重置为 `{enabled: true}`。**

```javascript
// reload 前的状态
KifeJSConfig.enabled = false;
KifeJSConfig.customProp = "test";

// === 执行 /kifejs reload ===

// reload 后的状态
// KifeJSConfig → { enabled: true }
// KifeJSConfig.customProp → undefined（已丢失）
```

> 如需要在重载后保持配置，请使用 [持久化模式](../07-advanced-patterns/04-persistence.md)。

---

## 与脚本配置配合

```javascript
// 结合 KifeJSConfig 和包级配置
var packageDefaults = {
    interval: 60,
    verbose: false
};

// 使用包配置的 var
var pkgConfig = (typeof __packageConfig !== "undefined") ? __packageConfig : {};

// 合并：全局禁用优先，其次包配置，最后默认值
var enabled = (KifeJSConfig && KifeJSConfig.enabled === false)
    ? false
    : (pkgConfig.enabled !== undefined ? pkgConfig.enabled : packageDefaults.enabled);

var interval = pkgConfig.interval || packageDefaults.interval;
```

---

## 边界情况

| 场景 | 行为 |
|------|------|
| `KifeJSConfig.enabled = false` 时调用 log | log 仍正常工作（独立于 enabled） |
| 修改不存在的属性 | 自动创建该属性 |
| 删除属性 | `delete KifeJSConfig.enabled` → 读取为 `undefined` |
| reolad 后自定义属性 | 全部丢失，恢复到 `{enabled: true}` |

---

## 最佳实践

1. **不要依赖 `KifeJSConfig` 控制 `KifeJS.log()`** — log 不受 enabled 影响
2. **将 `KifeJSConfig` 作为全局特性开关** — 控制脚本行为而非 API 本身
3. **扩展时使用命名空间** — 如 `KifeJSConfig.features.xxx` 避免冲突
4. **读取时做防御性检查** — `typeof KifeJSConfig !== "undefined"`
5. **配合 `__appConfig` 使用** — 在 `0-config.js` 中建立完整的配置体系

---

## 下一步

- 学习 [KifeEvent](04-KifeEvent.md)
- 了解 [内置变量](05-script-variables.md)
