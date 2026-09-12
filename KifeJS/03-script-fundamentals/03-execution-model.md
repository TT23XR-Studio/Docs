# 执行模型与顺序

> **文档索引:** `03-script-fundamentals/03-execution-model.md`
>
> 理解脚本的加载时机、执行顺序和生命周期。

---

## 一、执行时机

KifeJS 脚本在两种情况下执行：

| 时机 | 触发方式 | 引擎状态 |
|------|---------|---------|
| **模组初始化** | Minecraft 启动时 | 创建新引擎 |
| **手动重载** | `/kifejs reload` | 销毁旧引擎 → 创建新引擎 |

---

## 二、执行顺序

脚本按 **发现路径的字母序** 执行。

### 排序规则

```java
// ScriptScanner 使用以下排序
entries.sorted(Comparator.comparing(Path::toString))
```

这是一个**字符串排序**，规则如下：

```
// 排序结果示例
1-a.js
A-core.js
b-package/
core.js
Z-logger.js
z-utils.js
```

> **注意:** 字符串排序区分大小写。大写字母（A-Z, ASCII 65-90）在小写字母（a-z, ASCII 97-122）**之前**。

### 完整排序示例

```
scripts/
├── 0-init.js             ← 第 1（数字 0 排在最前）
├── 1-config.js           ← 第 2
├── A-core.js             ← 第 3（大写 A）
├── Z-logger.js           ← 第 4（大写 Z）
├── a-utils.js            ← 第 5（小写 a）
├── b-feature/
│   └── index.js          ← 第 6
└── z-last.js             ← 第 7
```

### 排序影响

| 需求 | 方案 |
|------|------|
| 脚本 A 必须在 B 之前执行 | 命名 `a-xxx.js` 和 `b-yyy.js` |
| 初始化脚本最先执行 | 命名 `0-init.js`、`1-setup.js` |
| 工具类靠后执行 | 命名 `z-utils.js` |

---

## 三、执行流程（完整时序）

```
Minecraft 启动
    │
    ▼
KifeJSMod.onInitialize()
    │
    ├─ KifeJSPaths.fromGameDirectory()     ← 确定路径
    ├─ ScriptManager(paths)                ← 创建管理器
    ├─ registerCommands()                  ← 注册 /kifejs
    └─ scriptManager.loadGlobalScripts()   ← 开始加载
            │
            ├─ ensureDirectories()         ← 创建 scripts/ 目录
            │
            ├─ new ScriptRuntime()         ← 创建 KossJS 引擎
            │   └─ registerApi()           ← 注册 KifeJS API
            │       ├─ KifeJS.log
            │       ├─ KifeJS.broadcast
            │       ├─ KifeJSConfig
            │       └─ KifeEvent
            │
            └─ executeAll(discovered)      ← 执行所有脚本
                │
                ├─ [脚本 1] runtime.execute(script_1)
                │   ├─ set "scriptConfigPath" (如有配置)
                │   ├─ set "__kife_current_script"
                │   ├─ runFile(entryPoint) ← 执行 JS 代码
                │   └─ LOG "Loaded KifeJS script {name}"
                │
                ├─ [脚本 2] runtime.execute(script_2)
                │   └─ ...
                │
                └─ [脚本 N] runtime.execute(script_N)
                    └─ ...
```

---

## 四、单脚本执行细节

当 `ScriptRuntime.execute(DiscoveredScript)` 被调用时：

```java
// ScriptRuntime.java（简化）
public void execute(DiscoveredScript script) {
    // 1. 设置配置文件路径（如有）
    if (script.configFile() != null && Files.isRegularFile(script.configFile())) {
        koss.setGlobal("scriptConfigPath", configFilePath);
    }

    // 2. 设置当前脚本名称
    //    异步执行以确保 JS 引擎就绪
    koss.runAsync(
        "globalThis.__kife_current_script = \"" + script.name() + "\";",
        sandbox.asyncTimeout().toMillis()
    );

    // 3. 执行脚本文件
    koss.runFile(script.entryPoint());
}
```

脚本执行时的全局环境状态：

```javascript
// 在脚本运行前，以下内容已在 globalThis 上可用：
globalThis.KifeJS           // 日志和广播 API
globalThis.KifeJSConfig     // { enabled: true }
globalThis.KifeEvent         // 事件类
globalThis.__kife_current_script  // 当前脚本名称（如 "hello"）
// scriptConfigPath          // 仅包脚本有值
```

---

## 五、失败容忍机制

单脚本执行失败不会阻止其他脚本加载：

```java
// ScriptManager.executeAll()
for (DiscoveredScript script : scripts) {
    try {
        runtime.execute(script);
        LOGGER.info("Loaded KifeJS script {}", script.name());
    } catch (RuntimeException e) {
        // 捕获异常，记录错误，继续下一个脚本
        LOGGER.error("Failed to load KifeJS script {}", script.name(), e);
    }
}
```

**影响：**

- 脚本 A 的语法错误 → 脚本 B、C 仍可正常加载
- 脚本 B 的运行时错误 → 不影响后续脚本
- **避免**：不要在脚本顶层执行可能抛出的操作

---

## 六、重载生命周期

```
/kifejs reload
    │
    ├─ (1) 关闭引擎 → 所有全局状态消失
    │
    ├─ (2) 创建新引擎 → 重新注册 API
    │
    └─ (3) 重新执行所有脚本 → 脚本从零开始
```

| 阶段 | 事件 |
|------|------|
| 关闭引擎 | 所有 `setTimeout`、`setInterval` 被清除 |
| 创建引擎 | API 重新注册，`KifeJSConfig` 重置为 `{enabled: true}` |
| 执行脚本 | 所有脚本重新按序执行 |

---

## 七、设计考量

```javascript
// 利用执行顺序的典型模式

// 文件: 0-config.js（第 1 个执行）
globalThis.__app = {
    greeting: "欢迎使用 KifeJS!",
    broadcastInterval: 120
};
KifeJS.log("配置已加载");

// 文件: a-greeter.js（第 2 个执行）
var app = globalThis.__app;
KifeJS.log(app.greeting);

// 文件: b-announcer.js（第 3 个执行）
var app = globalThis.__app;
KifeJS.log("广播间隔: " + app.broadcastInterval + "秒");
```

---

## 下一步

- 了解 [错误处理](04-error-handling.md)
- 学习 [跨脚本通信](../06-cross-script/01-global-scope.md)
