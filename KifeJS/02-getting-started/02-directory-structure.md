# 目录结构

> **文档索引:** `02-getting-started/02-directory-structure.md`
>
> KifeJS 的完整目录布局说明。

---

## 顶级目录

KifeJS 在 Minecraft 游戏根目录下管理文件：

```
.minecraft/                          ← 游戏根目录 (gameRoot)
├── KifeJS/                          ← 全局根目录 (globalRoot)
│   ├── config.js                    ← 全局配置文件 (globalConfig) [预留]
│   └── scripts/                     ← 脚本目录 (globalScripts)
│       ├── hello.js                 ← 单文件脚本
│       ├── my-timer.js              ← 单文件脚本
│       └── my-package/              ← 包脚本目录
│           ├── index.js             ← 包脚本入口（必需）
│           └── config.js            ← 包脚本配置（可选）
├── mods/
│   └── KifeJS-0.1.0.jar
├── kossjs.dll                       ← 原生库（平台相关）
└── logs/
    └── latest.log                   ← 日志文件（查看脚本输出）
```

---

## 目录详解

### `KifeJS/` — 全局根目录

模组的根工作目录。由 `KifeJSPaths` 类定义为 `<gameRoot>/KifeJS`。

### `KifeJS/scripts/` — 脚本目录

存放所有用户脚本。**自动创建**（模组首次初始化时如不存在则自动生成）。

支持两种脚本格式：

| 格式 | 示例 | 说明 |
|------|------|------|
| **单文件脚本** | `hello.js` | 直接将 `.js` 文件放在此目录 |
| **包脚本** | `my-package/index.js` | 子目录 + `index.js` 入口 |

### `KifeJS/config.js` — 全局配置文件

预留的全局配置点。`KifeJSPaths` 已为此文件定义了路径，但目前未自动加载到运行时。

### `kossjs.dll` — 原生库

KossJS JavaScript 引擎的原生实现。必须放置在引擎可搜索到的位置（通常与 `KifeJS/` 同级）。

---

## 目录生成时机

模组初始化时的目录创建流程：

```javascript
// 伪代码：ScriptManager.ensureDirectories()
// 1. 调用 Files.createDirectories(paths.globalScripts())
// 2. 即创建 .minecraft/KifeJS/scripts/
// 3. 如果父目录 KifeJS/ 不存在，也会一并创建
```

---

## 路径配置（面向开发者）

`KifeJSPaths` 记录结构：

```java
public record KifeJSPaths(
    Path gameRoot,       // 游戏根目录
    Path globalRoot,     // KifeJS/
    Path globalScripts,  // KifeJS/scripts/
    Path globalConfig    // KifeJS/config.js
)
```

工厂方法：

```java
KifeJSPaths.fromGameDirectory(
    FabricLoader.getInstance().getGameDir()
)
// 返回:
//   gameRoot = .minecraft/
//   globalRoot = .minecraft/KifeJS/
//   globalScripts = .minecraft/KifeJS/scripts/
//   globalConfig = .minecraft/KifeJS/config.js
```

---

## 权限说明

- **读取:** 模组需要读取 `scripts/` 目录和 `.js` 文件
- **写入:** 模组只会创建 `scripts/` 目录（仅初始化时）
- **用户职责:** 创建和编辑 `.js` 文件

---

## 下一步

- 了解 [命令参考](03-commands.md)
- 深入学习 [脚本类型](../03-script-fundamentals/01-script-types.md)
