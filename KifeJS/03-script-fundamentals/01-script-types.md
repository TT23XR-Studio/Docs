# 脚本类型

> **文档索引:** `03-script-fundamentals/01-script-types.md`
>
> KifeJS 支持两种脚本格式：单文件脚本和包脚本。本文详细说明其差异、发现规则和适用场景。

---

## 一、单文件脚本

### 定义

任何直接放在 `scripts/` 目录下的 `.js` 文件。

### 示例结构

```
scripts/
├── hello.js
├── logger.js
└── timer.js
```

### 发现规则

`ScriptScanner` 的检测逻辑（伪代码）：

```java
// 对于 scripts/ 目录下的每个条目
// 1. 跳过目录
// 2. 跳过非 .js 文件
// 3. 保留以 .js 结尾的常规文件
if (Files.isRegularFile(entry) && fileName.endsWith(".js")) {
    addScript(name, entry, null, lastModified);
}
```

### 命名规则

| 规则 | 示例 | 脚本名 |
|------|------|--------|
| 直接使用文件名 | `hello.js` | `hello` |
| 去除 `.js` 后缀 | `my-timer.js` | `my-timer` |
| 保持原始大小写 | `Logger.js` | `Logger` |

### 优缺点

| 优点 | 缺点 |
|------|------|
| 创建简单、直接 | 无法附带配置文件 |
| 适合短小脚本 | 文件一多容易混乱 |

---

## 二、包脚本

### 定义

包含 `index.js` 文件的子目录。

### 示例结构

```
scripts/
└── my-feature/
    ├── index.js         ← 必需：包入口
    ├── config.js        ← 可选：包配置
    ├── helper.js        ← 可选：辅助模块（被 index.js 引用）
    └── data.json        ← 可选：数据文件
```

### 发现规则

```java
// 对于 scripts/ 目录下的每个条目
// 1. 只处理子目录
// 2. 检查子目录中是否存在 index.js
// 3. 如果存在，检查是否存在 config.js
if (Files.isDirectory(entry)) {
    Path index = entry.resolve("index.js");
    if (Files.isRegularFile(index)) {
        addScript(
            entry.getFileName().toString(),  // 脚本名 = 目录名
            index,                           // 入口 = index.js
            optionalConfig(entry),           // 配置（可选）
            lastModified(index)
        );
    }
}
```

### 包脚本名称

包脚本的名称**取自目录名**，而非文件名：

```
scripts/
├── greeting/          → 脚本名: "greeting"
│   └── index.js
└── admin-tools/       → 脚本名: "admin-tools"
    └── index.js
```

### 优缺点

| 优点 | 缺点 |
|------|------|
| 自带配置文件 | 创建步骤稍多 |
| 可组织多个相关文件 | 层级较深 |
| 适合复杂功能 | — |

---

## 三、对比总览

| 维度 | 单文件脚本 | 包脚本 |
|------|-----------|--------|
| **文件结构** | 独立 `.js` 文件 | `dir/index.js` 形式 |
| **脚本名称** | 去除 `.js` 后的文件名 | 目录名 |
| **配置文件** | 不支持 | 支持（可选 `config.js`） |
| **适用场景** | 简单逻辑、测试、小工具 | 复杂功能、多模块、需配置 |
| **发现性能** | 直接扫描 | 需检查子目录内容 |
| **组织能力** | 无（文件散落） | 强（自包含目录） |

---

## 四、命名约定建议

虽然没有强制要求，但建议遵循以下约定：

```javascript
// ✅ 推荐命名
hello.js                // 小写 + 连字符
my-timer.js
event-system/

// ⚠️ 避免
123.js                  // 数字开头 - 排序不可预测
test script.js          // 包含空格 - 路径处理风险
@weird/naming.js        // 特殊字符 - 跨平台兼容性
.Hidden/                // 点开头 - 可能被某些系统忽略
```

---

## 五、执行顺序

所有脚本（无论类型）按 **文件/目录路径的字母序** 执行：

```
scripts/
├── a-first.js          ← 第 1 个执行
├── b-package/          ← 第 2 个执行
│   └── index.js
├── c-logger.js         ← 第 3 个执行
└── z-last.js           ← 第 4 个执行
```

> 包脚本和单文件脚本在同级别按字符串排序，不区分类型。

---

## 六、混合使用

单文件脚本和包脚本可以自由混合：

```
scripts/
├── core.js             ← 核心逻辑（单文件）
├── commands/
│   └── index.js        ← 命令系统（包脚本）
├── events/
│   └── index.js        ← 事件处理（包脚本）
└── test.js             ← 测试脚本（单文件）
```

---

## 七、脚本扫描源码参考

```java
// ScriptScanner.java - 核心扫描逻辑
for (Path entry : entries.sorted(Comparator.comparing(Path::toString)).toList()) {
    if (Files.isDirectory(entry)) {
        // 处理包脚本
        Path index = entry.resolve("index.js");
        if (Files.isRegularFile(index)) {
            scripts.add(new DiscoveredScript(
                entry.getFileName().toString(),
                index,
                optionalRegularFile(entry.resolve("config.js")),
                lastModified(index)
            ));
        }
    } else if (Files.isRegularFile(entry) && entry.getFileName().toString().endsWith(".js")) {
        // 处理单文件脚本
        scripts.add(new DiscoveredScript(
            stripExtension(entry.getFileName().toString()),
            entry,
            null,
            lastModified(entry)
        ));
    }
}
```

---

## 下一步

- 学习 [配置文件系统](02-script-config.md)
- 了解 [执行模型](03-execution-model.md)
