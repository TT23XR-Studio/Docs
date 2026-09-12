# 命令参考

> **文档索引:** `02-getting-started/03-commands.md`
>
> KifeJS 注册的 Minecraft 命令完整说明。

---

## 命令总览

KifeJS 通过 Fabric API 的 `CommandRegistrationCallback` 注册了根命令 `/kifejs`，包含两个子命令：

```
/kifejs reload   重载所有脚本
/kifejs version  显示 KossJS 引擎版本
```

---

## `/kifejs reload`

### 功能

销毁当前 KossJS 引擎实例，重新扫描 `scripts/` 目录并执行所有脚本。

### 执行流程

```
/kifejs reload
    │
    ├─ 1. LOG: "KifeJS reloading..."
    │
    ├─ 2. ScriptManager.reloadGlobalScripts()
    │       │
    │       ├─ ScriptRuntime.close()
    │       │   └─ koss.close()          ← 释放原生引擎资源
    │       │
    │       └─ loadGlobalScripts()
    │           ├─ ensureDirectories()   ← 确保目录存在
    │           ├─ new ScriptRuntime()   ← 创建全新引擎
    │           ├─ scanner.scan(path)    ← 扫描脚本
    │           └─ executeAll(scripts)   ← 逐个执行
    │
    ├─ 3. 发送成功消息
    │   └─ "KifeJS reloaded"
    │
    └─ 4. 返回 1（命令成功）
```

### 重要特性

| 特性 | 说明 |
|------|------|
| **完全重载** | 旧引擎实例被完全销毁，所有全局状态丢失 |
| **目录重新扫描** | 会检测新增/删除/修改的脚本文件 |
| **执行顺序** | 按文件名**字母序**执行 |
| **错误隔离** | 单脚本失败不影响其他脚本加载 |

### 使用场景

- 修改脚本后应用更改
- 添加新脚本后加载
- 修复脚本错误后重试
- 重置所有全局状态

---

## `/kifejs version`

### 功能

返回 KossJS 引擎的版本号。

### 执行流程

```
/kifejs version
    │
    ├─ ScriptRuntime.version()
    │   └─ koss.version()              ← 调用原生引擎
    │
    └─ 发送: "KossJS <版本号>"
```

### 输出示例

```
KossJS 1.0.0
```

### 使用场景

- 验证 KifeJS 是否正确加载
- 排查版本兼容性问题
- 确认 KossJS 引擎可用

---

## 权限要求

| 命令 | 权限等级 | 说明 |
|------|---------|------|
| `/kifejs reload` | OP 级别（2+） | 需要管理员权限 |
| `/kifejs version` | 任意 | 所有玩家可执行 |

> 在单人模式中，您始终拥有执行这些命令的权限。

---

## 命令实现源码参考

```java
// KifeJSMod.java - 命令注册
dispatcher.register(literal("kifejs")
    .then(literal("reload").executes(context -> {
        LOGGER.info("KifeJS reloading...");
        scriptManager.reloadGlobalScripts();
        context.getSource().sendSuccess(
            () -> Component.literal("KifeJS reloaded"), false
        );
        return 1;
    }))
    .then(literal("version").executes(context -> {
        String version = scriptManager.runtimeVersion();
        context.getSource().sendSuccess(
            () -> Component.literal("KossJS " + version), false
        );
        return 1;
    }))
);
```

---

## 最佳实践

1. **修改脚本后务必执行 `/kifejs reload`**，否则更改不会生效
2. **执行 `version` 命令确认模组可用**，再开始编写复杂脚本
3. **注意 `reload` 会清空全局状态**，确保您的脚本设计了状态恢复机制
4. **避免频繁 reload**，每次 reload 都会创建新的引擎实例

---

## 下一步

- 深入了解 [脚本类型](../03-script-fundamentals/01-script-types.md)
- 学习 [API 参考](../04-api-reference/01-KifeJS-log.md)
