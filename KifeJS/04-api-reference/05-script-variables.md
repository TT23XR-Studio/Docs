# 内置变量

> **文档索引:** `04-api-reference/05-script-variables.md`
>
> KifeJS 在脚本执行前设置的全局变量。

---

## 变量总览

| 变量名 | 类型 | 设置时机 | 作用域 |
|--------|------|---------|--------|
| `__kife_current_script` | `string` | 每个脚本执行前 | 全局 |
| `scriptConfigPath` | `string` 或 `undefined` | 包脚本执行前 | 全局 |

---

## `__kife_current_script` — 当前脚本名称

### 定义

```javascript
// 由 ScriptRuntime 在执行每个脚本前设置
globalThis.__kife_current_script = "脚本名称";
```

脚本名称来源：

| 脚本类型 | 名称来源 | 示例 |
|---------|---------|------|
| 单文件脚本 | 文件名（不含 `.js`） | `hello.js` → `"hello"` |
| 包脚本 | 目录名 | `greeting/index.js` → `"greeting"` |

### 基础用法

```javascript
// 在脚本中获取自身名称
KifeJS.log("当前脚本: " + __kife_current_script);
// 输出: [script] 当前脚本: hello
```

### 进阶用法

#### 自感知日志

```javascript
function log(msg) {
    KifeJS.log("[" + __kife_current_script + "] " + msg);
}

log("初始化完成");
// 输出: [script] [hello] 初始化完成
log("状态检查通过");
// 输出: [script] [hello] 状态检查通过
```

#### 防止重复初始化

```javascript
// 利用脚本名创建命名空间
globalThis["__mod_" + __kife_current_script] = {
    initialized: true,
    startTime: Date.now()
};

KifeJS.log(__kife_current_script + " 已注册到全局");
```

#### 脚本间标识

```javascript
// 脚本 A: config-loader.js
globalThis.__loadedScripts = globalThis.__loadedScripts || [];
globalThis.__loadedScripts.push(__kife_current_script);
KifeJS.log("已加载: " + __kife_current_script);

// 脚本 B: main.js
KifeJS.log("已加载的脚本列表: " + JSON.stringify(globalThis.__loadedScripts));
```

#### 动态行为控制

```javascript
// 根据脚本名决定行为
switch (__kife_current_script) {
    case "0-config":
        // 加载配置
        break;
    case "a-core":
        // 核心功能
        break;
    case "z-cleanup":
        // 清理任务
        break;
    default:
        KifeJS.log("未知脚本: " + __kife_current_script);
}
```

---

## `scriptConfigPath` — 包脚本配置文件路径

### 定义

```javascript
// 仅当包脚本包含 config.js 时设置
globalThis.scriptConfigPath = "/absolute/path/to/config.js"
```

| 脚本类型 | 值 |
|---------|-----|
| 包脚本（有 config.js） | 配置文件的绝对路径（字符串） |
| 包脚本（无 config.js） | `undefined`（未设置） |
| 单文件脚本 | `undefined`（未设置） |

### 基础用法

```javascript
// 检查是否有配置文件
if (typeof scriptConfigPath !== "undefined") {
    KifeJS.log("配置文件路径: " + scriptConfigPath);
} else {
    KifeJS.log("无配置文件");
}
```

### 进阶用法

#### 配置路径验证

```javascript
// 验证配置文件路径
function validateConfigPath() {
    if (typeof scriptConfigPath === "undefined") {
        KifeJS.log("[" + __kife_current_script + "] 警告: 无配置文件，使用默认配置");
        return false;
    }
    if (scriptConfigPath === "" || typeof scriptConfigPath !== "string") {
        KifeJS.log("[" + __kife_current_script + "] 错误: 配置路径无效");
        return false;
    }
    KifeJS.log("[" + __kife_current_script + "] 配置路径: " + scriptConfigPath);
    return true;
}
```

#### 与配置协同

```javascript
// 包脚本推荐的配置模式
var PKG_CONFIG = {};

// 方式 1: 配置在同级目录，被 index.js 引用
// greeting/config.js:
//   __greetingConfig = { message: "你好", interval: 60 };

// greeting/index.js:
(function() {
    var pkgName = __kife_current_script;

    // 尝试读取配置
    var config = globalThis["__" + pkgName + "Config"];
    if (!config) {
        KifeJS.log("[" + pkgName + "] 未找到配置，使用默认值");
        config = { message: "你好", interval: 60 };
    }

    KifeJS.log("[" + pkgName + "] 配置加载完成");
    KifeJS.log("[" + pkgName + "] 消息: " + config.message);
})();
```

#### 完整配置加载器

```javascript
// 通用的包配置加载模式
function loadPackageConfig(defaults) {
    var config = {};

    // 尝试从全局变量读取配置
    var configVarName = "__" + __kife_current_script + "Config";
    if (typeof globalThis[configVarName] !== "undefined") {
        config = globalThis[configVarName];
        KifeJS.log("[" + __kife_current_script + "] 已加载自定义配置");
    } else {
        config = defaults;
        KifeJS.log("[" + __kife_current_script + "] 使用默认配置");
    }

    // 补充缺失的默认值
    for (var key in defaults) {
        if (typeof config[key] === "undefined") {
            config[key] = defaults[key];
        }
    }

    return config;
}

// 使用
var config = loadPackageConfig({
    enabled: true,
    interval: 120,
    greetings: ["你好"]
});

KifeJS.log("配置: " + JSON.stringify(config));
```

---

## 边界情况

| 场景 | `__kife_current_script` | `scriptConfigPath` |
|------|------------------------|-------------------|
| 脚本名为 `0-config` | `"0-config"` | `undefined` |
| 脚本名为 `my-pkg`（有 config.js） | `"my-pkg"` | 绝对路径字符串 |
| 脚本名为 `my-pkg`（无 config.js） | `"my-pkg"` | `undefined` |
| 在 `reload` 后 | 重新设置 | 重新设置 |
| 在 JS 中修改 | 可修改（但不推荐） | 可修改（但不推荐） |

---

## 最佳实践

1. **将 `__kife_current_script` 视为只读** — 不要修改它
2. **使用 `__kife_current_script` 作为命名空间前缀** — 避免全局变量冲突
3. **对 `scriptConfigPath` 做存在性检查** — 它可能为 `undefined`
4. **配置优先使用全局变量协议** — 而不是依赖文件路径读取（当前限制）
5. **日志时始终包含脚本名** — 便于调试

---

## 下一步

- 学习 [API 组合使用](06-combined-usage.md)
- 开始 [事件系统](../05-event-system/01-concepts.md)
