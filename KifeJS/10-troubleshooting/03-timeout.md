# 执行超时

> **文档索引:** `10-troubleshooting/03-timeout.md`
>
> 解决脚本执行超时（默认 30 秒）的问题。

---

## 错误现象

```
[KifeJS] Failed to load KifeJS script myscript
java.lang.RuntimeException: Script execution timed out after 30000ms
```

---

## 常见原因

| 原因 | 示例 |
|------|------|
| 死循环 | `while (true) {}` |
| 无限递归 | `function f() { f(); }` |
| 超长循环 | `for (var i = 0; i < 10000000000; i++) {}` |
| 阻塞操作 | 同步等待网络/文件操作 |

---

## 解决方案

### 1. 检查是否有无限循环

```javascript
// ❌ 问题代码
while (true) {
    // 永远不会结束
}

// ✅ 修复：添加终止条件
var count = 0;
while (count < 100) {
    count++;
    // 有限处理
}
```

### 2. 分块处理大量数据

```javascript
// ✅ 分块处理
function processLargeArray(arr, chunkSize, callback) {
    var index = 0;
    function nextChunk() {
        var end = Math.min(index + chunkSize, arr.length);
        for (; index < end; index++) {
            process(arr[index]);
        }
        if (index < arr.length) {
            setTimeout(nextChunk, 0);
        } else {
            callback();
        }
    }
    nextChunk();
}
```

### 3. 减少单次循环次数

```javascript
// ❌ 一次性处理太多
for (var i = 0; i < 1000000; i++) {
    heavyProcessing(i);
}

// ✅ 分批进行
var BATCH_SIZE = 1000;
var total = 1000000;
var processed = 0;

function processBatch() {
    var end = Math.min(processed + BATCH_SIZE, total);
    for (; processed < end; processed++) {
        heavyProcessing(processed);
    }
    if (processed < total) {
        setTimeout(processBatch, 0);
    }
}
processBatch();
```

---

## 预防措施

1. **始终为循环设置上限**
2. **使用 `setTimeout` 分割长时间任务**
3. **利用 30 秒超时作为安全网**
4. **先在小数据集上测试**

---

## 下一步

- [重载问题](04-reload-issues.md)
- [日志与调试](05-logs-and-debug.md)
