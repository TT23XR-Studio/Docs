# 配置文件系统

> **文档索引:** `03-script-fundamentals/02-script-config.md`
>
> KifeJS 支持两层配置：全局配置和包级配置。本文详细说明其机制和使用方式。

---

## 一、配置层次

```
KifeJS/
├── config.js                 ← 全局配置（预留）
└── scripts/
    └── my-package/
        ├── index.js          ← 包脚本入口
        └── config.js         ← 包级配置文件
```

| 层级 | 路径 | 状态 |
|------|------|------|
| **全局配置** | `KifeJS/config.js` | 路径已定义，未自动加载到运行时 |
| **包级配置** | `包目录/config.js` | 已支持，通过 `scriptConfigPath` 暴露 |

---

## 二、包级配置详解

### 工作原理

当 `ScriptScanner` 扫描到包脚本时，会检查包目录下是否存在 `config.js`：

```java
// 如存在 config.js，将其路径记录到 DiscoveredScript.configFile
scripts.add(new DiscoveredScript(
    "my-package",
    path/to/my-package/index.js,      // 入口
    path/to/my-package/config.js,     // 配置文件（或 null）
    lastModified
));
```

执行时，`ScriptRuntime` 将配置文件路径设为全局变量：

```java
// ScriptRuntime.execute()
if (script.configFile() != null && Files.isRegularFile(script.configFile())) {
    koss.setGlobal("scriptConfigPath",
        script.configFile().toAbsolutePath().normalize().toString());
}
```

### 在脚本中读取配置

**config.js:**
```javascript
// my-package/config.js
var config = {
    greeting: "你好",
    interval: 60,
    enabled: true,
    targets: ["all"]
};
```

**index.js:**
```javascript
// my-package/index.js
KifeJS.log("配置文件路径: " + scriptConfigPath);

// 注意：config.js 不会自动执行
// 您需要读取 content 或要求配置也定义全局变量
//
// 推荐方案：config.js 中也定义全局变量
```

### 推荐方案：配置与脚本协作

**config.js:**
```javascript
// my-package/config.js
__packageConfig = {
    greeting: "你好",
    interval: 60,
    enabled: true,
    targets: ["all"]
};
```

> 使用 `__packageConfig`（而非 `var`）定义在全局作用域，这样 `index.js` 可以访问。

**index.js:**
```javascript
// my-package/index.js
// 此时 config.js 不会被自动执行
// 需要采用下面两种方式之一

// 方式 A：在 index.js 手动导入配置
// （配置写在 index.js 顶部）

// 方式 B：使用全局变量协议
if (typeof __packageConfig !== "undefined") {
    var cfg = __packageConfig;
    KifeJS.log("问候语: " + cfg.greeting);
    KifeJS.log("间隔: " + cfg.interval + "秒");
} else {
    KifeJS.log("未找到配置，使用默认值");
    var cfg = { greeting: "你好", interval: 30 };
}
```

> **已知限制:** 当前版本（0.1.0）中，config.js **不会自动执行**。它仅通过 `scriptConfigPath` 变量暴露路径，您需要自行实现配置加载。这将在未来版本中改进。

---

## 三、全局配置

### 预留路径

`KifeJSPaths` 定义了全局配置路径：

```java
// KifeJSPaths.fromGameDirectory()
public static KifeJSPaths fromGameDirectory(Path gameRoot) {
    Path globalRoot = gameRoot.resolve("KifeJS").normalize();
    return new KifeJSPaths(
        gameRoot,
        globalRoot,
        globalRoot.resolve("scripts").normalize(),
        globalRoot.resolve("config.js").normalize()  // 全局配置
    );
}
```

### 当前状态

全局配置的路径已定义，但目前 **未在运行时自动加载**。这是未来版本的计划功能。

### 手动使用全局配置

您可以在自己的脚本中自行读取全局配置文件：

```javascript
// 任何脚本中
// 当前版本无法直接读取文件系统（沙箱限制）
// 但可以在 globalThis 上共享配置

// 在 core.js 中设置全局配置
globalThis.__appConfig = {
    serverName: "我的服务器",
    maxPlayers: 100,
    motd: "欢迎!"
};

// 在其他脚本中读取
var config = globalThis.__appConfig;
KifeJS.log("服务器: " + config.serverName);
```

---

## 四、配置文件最佳实践

### 推荐结构

```
scripts/
├── config.js                ← 全局配置（手动加载）
├── core.js                  ← 读取 config.js
└── my-feature/
    ├── index.js
    └── config.js            ← 特性专属配置
```

### 配置命名约定

| 作用域 | 建议的全局变量名 | 示例 |
|--------|----------------|------|
| 全局应用配置 | `__appConfig` | `__appConfig.serverName` |
| 包级配置 | `__pkg_包名` | `__pkg_myFeature` |
| 功能模块配置 | `__cfg_模块名` | `__cfg_logger` |

### 配置验证模式

```javascript
// 安全读取配置的通用模式
function getConfig(defaults, source) {
    if (typeof source === "undefined" || source === null) {
        return defaults;
    }
    var config = {};
    for (var key in defaults) {
        config[key] = (key in source) ? source[key] : defaults[key];
    }
    return config;
}

// 使用
var defaults = {
    enabled: true,
    interval: 30,
    greeting: "你好"
};

var runtimeConfig = getConfig(defaults, typeof __packageConfig !== "undefined" ? __packageConfig : null);
KifeJS.log("配置: enabled=" + runtimeConfig.enabled + ", interval=" + runtimeConfig.interval);
```

---

## 五、已知限制与未来规划

| 限制 | 说明 | 未来版本计划 |
|------|------|-------------|
| config.js 不自动执行 | 仅暴露路径，需手动处理 | 预计 v0.2.0 自动加载 |
| 全局配置未使用 | `KifeJS/config.js` 仅为预留路径 | 预计 v0.2.0 自动合并 |
| 无 JSON 原生读支持 | 无法直接 `require('./config.json')` | 视需求添加 |
| 无环境变量 | 没有 `.env` 类支持 | 可通过全局变量模拟 |

---

## 下一步

- 了解 [执行模型](03-execution-model.md)
- 查看 [内置变量](../04-api-reference/05-script-variables.md)
