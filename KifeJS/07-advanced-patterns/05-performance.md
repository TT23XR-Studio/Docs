# 性能优化

> **文档索引:** `07-advanced-patterns/05-performance.md`
>
> KifeJS 脚本性能注意事项和优化建议。

---

## 一、性能影响因素

| 因素 | 影响 | 说明 |
|------|------|------|
| 脚本数量 | 中 | 每个脚本一个文件操作 |
| 脚本大小 | 低 | 解析成本一次性 |
| 定时器数量 | 高 | 过多定时器消耗 CPU |
| 事件监听器 | 中 | 大量监听器影响派发速度 |
| 计算密集操作 | 高 | 长时间计算阻塞引擎 |
| 日志频率 | 低 | 日志本身轻量，但大量日志影响 I/O |

---

## 二、关键优化原则

### 1. 避免阻塞引擎

KossJS 引擎在同一时间只能执行一个 JavaScript 任务。长时间计算会阻塞其他操作。

```javascript
// ❌ 阻塞：长时间循环
function heavyComputation() {
    var result = 0;
    for (var i = 0; i < 100000000; i++) {
        result += Math.sqrt(i);
    }
    return result;
}

// ✅ 非阻塞：分块处理
function heavyComputationChunked(callback) {
    var result = 0;
    var i = 0;
    var CHUNK_SIZE = 100000;

    function processChunk() {
        var end = Math.min(i + CHUNK_SIZE, 100000000);
        for (; i < end; i++) {
            result += Math.sqrt(i);
        }
        if (i < 100000000) {
            setTimeout(processChunk, 0);  // 让出控制权
        } else {
            callback(result);
        }
    }

    processChunk();
}
```

### 2. 控制定时器数量

```javascript
// ❌ 多个独立定时器
setInterval(task1, 1000);
setInterval(task2, 1000);
setInterval(task3, 1000);

// ✅ 合并为一个定时器
setInterval(function() {
    task1();
    task2();
    task3();
}, 1000);
```

### 3. 控制事件频率

```javascript
// 节流高频事件
function throttle(fn, minInterval) {
    var last = 0;
    return function() {
        var now = Date.now();
        if (now - last >= minInterval) {
            last = now;
            fn.apply(this, arguments);
        }
    };
}

// 使用
EventBus.on("high-frequency-event", throttle(function(e) {
    // 每秒最多处理一次
}, 1000));
```

---

## 三、脚本加载优化

### 减少脚本数量

```javascript
// ❌ 多个小脚本
// 10 个文件 = 10 次文件 I/O

// ✅ 合并为一个文件
// 1 个文件 = 1 次文件 I/O
```

### 延迟非关键初始化

```javascript
// 关键初始化（立即执行）
globalThis.__core = { version: "1.0" };

// 非关键初始化（延迟执行）
setTimeout(function() {
    // 非关键功能延迟加载
    KifeJS.log("[性能] 延迟初始化完成");
}, 5000);
```

---

## 四、内存管理

### 及时清理

```javascript
// 不再需要的全局变量
globalThis.__tempLargeData = null;  // 允许 GC 回收

// 清理事件监听器
EventBus.off("unused-event");

// 停止不再需要的定时器
clearInterval(unusedTimerId);
```

### 避免内存泄漏

```javascript
// ❌ 泄漏：闭包持有大对象
var largeData = new Array(1000000);
function leak() {
    KifeJS.log(largeData.length);  // 一直持有 largeData
}

// ✅ 按需传递
function notLeak(data) {
    KifeJS.log(data.length);
}
```

---

## 五、日志优化

```javascript
// ❌ 高频日志
setInterval(function() {
    KifeJS.log("心跳");
}, 1000);  // 每分钟 60 条日志

// ✅ 低频日志
setInterval(function() {
    KifeJS.log("心跳");
}, 60000);  // 每分钟 1 条日志

// ✅ 调试模式日志
if (globalThis.__appConfig && globalThis.__appConfig.debug) {
    KifeJS.log("[DEBUG] 详细信息");
}
```

---

## 六、性能监控

```javascript
globalThis.__perfMonitor = {
    _measures: {},

    start: function(name) {
        this._measures[name] = Date.now();
    },

    end: function(name) {
        var start = this._measures[name];
        if (start) {
            var duration = Date.now() - start;
            delete this._measures[name];

            // 记录到数据仓库
            if (typeof globalThis.__store !== "undefined") {
                globalThis.__store.update("perf", name, function(prev) {
                    var p = prev || { count: 0, total: 0 };
                    p.count++;
                    p.total += duration;
                    return p;
                });
            }

            if (duration > 100) {
                KifeJS.log("[性能] " + name + " 耗时: " + duration + "ms (警告: 超过 100ms)");
            }

            return duration;
        }
        return -1;
    },

    report: function() {
        var perf = globalThis.__store ? globalThis.__store.getNamespace("perf") : {};
        for (var key in perf) {
            if (perf.hasOwnProperty(key)) {
                var p = perf[key];
                KifeJS.log("[性能报告] " + key + ": avg " + (p.total / p.count).toFixed(2) + "ms (共 " + p.count + " 次)");
            }
        }
    }
};

// 使用
globalThis.__perfMonitor.start("processData");
// ... 处理数据 ...
globalThis.__perfMonitor.end("processData");
```

---

## 七、性能基准

```javascript
// 简单的基准测试
globalThis.__benchmark = {
    run: function(name, fn, iterations) {
        iterations = iterations || 1000;

        var start = Date.now();
        for (var i = 0; i < iterations; i++) {
            fn(i);
        }
        var total = Date.now() - start;

        KifeJS.log("[基准] " + name + ": "
            + iterations + " 次迭代, "
            + total + "ms 总用时, "
            + (total / iterations).toFixed(3) + "ms/次");
    }
};

// 测试不同操作的性能
globalThis.__benchmark.run("空循环", function(i) {}, 100000);
globalThis.__benchmark.run("KifeJS.log", function(i) {
    KifeJS.log(i);
}, 100);  // 测试 100 次就够了
globalThis.__benchmark.run("对象访问", function(i) {
    var x = { a: 1, b: 2, c: 3 };
    var y = x.a + x.b + x.c;
}, 10000);
```

---

## 八、优化清单

- [ ] 合并多个小脚本
- [ ] 合并多个短间隔定时器
- [ ] 使用节流控制高频事件
- [ ] 延迟非关键初始化
- [ ] 及时清理无用对象和监听器
- [ ] 控制日志频率
- [ ] 避免长时间同步计算
- [ ] 使用性能监控发现瓶颈

---

## 下一步

- [沙箱与安全](../08-sandbox/01-timeout.md)
- [故障排除](../10-troubleshooting/01-library-not-found.md)
