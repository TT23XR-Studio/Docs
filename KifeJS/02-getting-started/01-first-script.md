# 第一个脚本

> **文档索引:** `02-getting-started/01-first-script.md`
>
> 从零开始编写并运行您的第一个 KifeJS 脚本。

---

## 前提条件

- KifeJS 已安装并验证通过（参见 [验证安装](../01-installation/03-verification.md)）
- `KifeJS/scripts/` 目录已存在
- 拥有游戏内 OP 权限（执行 `/kifejs reload`）

---

## 步骤 1：创建脚本文件

在脚本目录下创建一个 `.js` 文件：

```
.minecraft/KifeJS/scripts/
└── hello.js
```

**hello.js:**
```javascript
KifeJS.log("你好，KifeJS！");
```

---

## 步骤 2：加载脚本

在游戏内执行：

```
/kifejs reload
```

---

## 步骤 3：查看输出

打开日志文件（`logs/latest.log`），应看到：

```
[KifeJS] Loading KifeJS scripts from .../KifeJS/scripts/
[script] 你好，KifeJS！
[KifeJS] Loaded KifeJS script hello
```

---

## 脚本执行过程详解

当您执行 `/kifejs reload` 时，实际发生了：

```
┌─────────────────────────────┐
│  /kifejs reload             │
│       │                     │
│       ▼                     │
│  ScriptManager              │
│  .closeRuntime()            │  ← 销毁旧引擎实例
│       │                     │
│       ▼                     │
│  ScriptManager              │
│  .loadGlobalScripts()       │  ← 创建新引擎 + 扫描目录
│       │                     │
│       ▼                     │
│  ScriptScanner              │
│  .scan(scripts/)            │  ← 发现 hello.js
│       │                     │
│       ▼                     │
│  ScriptRuntime              │
│  .execute(hello)            │  ← 设置 __kife_current_script
│       │                     │  ← 执行脚本代码
│       ▼                     │
│  KifeJS.log("你好...")      │  ← 调用 Java API 写日志
└─────────────────────────────┘
```

---

## 扩展：加入更多逻辑

**hello.js:**
```javascript
var greetings = ["你好", "Hello", "こんにちは", "Hola"];
for (var i = 0; i < greetings.length; i++) {
    KifeJS.log("问候语 " + (i + 1) + ": " + greetings[i]);
}
```

重载后日志输出：
```
[script] 问候语 1: 你好
[script] 问候语 2: Hello
[script] 问候语 3: こんにちは
[script] 问候语 4: Hola
```

---

## 注意

- 脚本在服务端执行（即使连接客户端，也是服务端在运行 JS）
- 每次 `/kifejs reload` 会销毁所有全局状态（见 [重载行为](../03-script-fundamentals/03-execution-model.md)）
- 日志输出以 `[script]` 前缀标识，来自 `KifeJS.log()`

---

## 下一步

- 了解 [目录结构](02-directory-structure.md) 的完整布局
- 探索 [脚本类型](../03-script-fundamentals/01-script-types.md) 的更多可能
- 学习 [KifeJS.log() API](../04-api-reference/01-KifeJS-log.md) 的更多用法
