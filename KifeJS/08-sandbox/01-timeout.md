# 超时机制详解

> **文档索引:** `08-sandbox/01-timeout.md`
>
> KifeJS 的异步超时保护机制。

---

## 一、配置值

```java
// ScriptSandbox.java
public static ScriptSandbox defaults() {
    return new ScriptSandbox(
        Duration.ofSeconds(30),  // 异步超时：30 秒
        false                    // 文件系统访问：关闭
    );
}
```

**默认超时时间: 30 秒**

这个超时应用于 `koss.runAsync()` 调用：

```java
koss.runAsync(
    "globalThis.__kife_current_script = \"" + quote(script.name()) + "\";",
    sandbox.asyncTimeout().toMillis()  // 30000ms
);
```

---

## 二、超时的作用

超时机制防止以下情况导致引擎挂起：

| 场景 | 风险 | 超时保护 |
|------|------|---------|
| 死循环 | 引擎挂起 | ✅ 30 秒后中断 |
| 无限递归 | 堆栈溢出 | ✅ 30 秒后中断 |
| 长时间计算 | 服务器卡顿 | ✅ 30 秒后中断 |
| 等待外部资源 | 永久阻塞 | ✅ 30 秒后中断 |

---

## 三、可能触发超时的代码

```javascript
// ❌ 死循环
while (true) {
    // 30 秒后超时
}

// ❌ 无限递归
function infinite() {
    infinite();
}
infinite();

// ❌ 超长循环
for (var i = 0; i < 10000000000; i++) {
    // 如果超过 30 秒，超时
}

// ✅ 安全的分块处理
function processInChunks(total, chunkSize) {
    var processed = 0;
    function nextChunk() {
        var end = Math.min(processed + chunkSize, total);
        for (; processed < end; processed++) {
            // 处理
        }
        if (processed < total) {
            setTimeout(nextChunk, 0);  // 让出控制权
        }
    }
    nextChunk();
}
```

---

## 四、超时日志示例

当脚本触发超时时，日志会显示：

```
[KifeJS] Failed to load KifeJS script myscript
java.lang.RuntimeException: Script execution timed out after 30000ms
    at com.kifejs.script.ScriptRuntime.execute(ScriptRuntime.java:32)
    ...
```

---

## 五、避免超时的最佳实践

1. **避免长时间同步循环** — 使用分块处理
2. **使用 `setTimeout` 分解任务** — 让引擎有时间处理其他任务
3. **控制循环上限** — 始终为循环设置最大迭代次数
4. **监控执行时间** — 使用性能监控工具

---

## 下一步

- [文件系统策略](02-filesystem.md)
- [安全编码](03-secure-coding.md)
