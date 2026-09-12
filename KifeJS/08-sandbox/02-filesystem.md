# 文件系统策略

> **文档索引:** `08-sandbox/02-filesystem.md`
>
> KifeJS 的文件系统访问策略。

---

## 一、默认配置

```java
// ScriptSandbox 默认值
public static ScriptSandbox defaults() {
    return new ScriptSandbox(
        Duration.ofSeconds(30),  // 异步超时
        false                    // 文件系统访问：false（禁用）
    );
}
```

**当前版本（0.1.0）: `exposeFileSystem = false`**

---

## 二、影响

文件系统禁用意味着：

| 操作 | 可能性 | 说明 |
|------|--------|------|
| 读取脚本文件 | ✅ 可用 | 引擎自动加载 `.js` 文件 |
| 写入文件 | ❌ 不可用 | Java 端的 write API 未暴露 |
| 读取其他文件 | ❌ 不可用 | 无法读取 JSON/配置文件 |
| 列出目录 | ❌ 不可用 | 只能通过 ScriptScanner |

---

## 三、未来版本

当 `exposeFileSystem` 设置为 `true` 时（未来版本的计划），脚本可能能够：

```javascript
// 未来可能支持的 API（非当前版本可用）
// readFile("config.json")
// writeFile("data.json", content)
// listDirectory("./")
```

---

## 四、当前版本的替代方案

```javascript
// 使用全局变量传递配置
globalThis.__appConfig = {
    debug: false,
    serverName: "MyServer"
};

// 使用数据仓库管理运行时数据
globalThis.__store.set("runtime", "status", "running");
```

---

## 五、安全影响

禁用文件系统访问是一种安全措施：

- 防止恶意脚本读取服务器文件
- 防止脚本写入恶意内容
- 保持沙箱隔离性

---

## 下一步

- [安全编码最佳实践](03-secure-coding.md)
