# 状态持久化

> **文档索引:** `07-advanced-patterns/04-persistence.md`
>
> 在 KifeJS 沙箱限制下实现状态持久化的策略。

---

## 一、限制说明

当前版本（0.1.0）的沙箱配置：

```java
public static ScriptSandbox defaults() {
    return new ScriptSandbox(
        Duration.ofSeconds(30),  // 超时 30 秒
        false                    // 文件系统访问：禁用
    );
}
```

**文件系统访问默认禁用**，因此无法直接写文件来持久化状态。以下策略在限制内实现最佳效果。

---

## 二、内存级持久化策略

### 策略 1：全局变量初始化

每次重载后重新设置初始值（最常用）：

```javascript
// 脚本: 0-config.js
// 每次重载都重新设置已知的初始值
globalThis.__appConfig = {
    serverName: "我的生存服",
    version: "1.0.0",
    startTime: Date.now()
};
```

### 策略 2：计数器通过重载递增

```javascript
// 脚本: 0-reload-counter.js
globalThis.__reloadCount = (typeof globalThis.__reloadCount === "undefined")
    ? 0
    : globalThis.__reloadCount + 1;

KifeJS.log("[系统] 第 " + globalThis.__reloadCount + " 次加载");
```

### 策略 3：使用全局状态对象

```javascript
// 脚本: 0-state.js
globalThis.__persistent = globalThis.__persistent || {
    // 这些值会跨重载被保留... 等一下，不会！
    // 每次 reload 是全新的引擎，所有全局变量都丢失
};

// 正确的理解：每次 reload 后都是全新开始
globalThis.__session = {
    startTime: Date.now(),
    reloadCount: (typeof globalThis.__session !== "undefined"
        ? globalThis.__session.reloadCount + 1
        : 1)
};
```

---

## 三、"假"持久化模式

### 通过重载次数推断状态

```javascript
// 脚本: 0-uptime.js
globalThis.__sessionInfo = {
    loadTime: Date.now(),
    loadNumber: (typeof globalThis.__sessionInfo !== "undefined"
        ? globalThis.__sessionInfo.loadNumber + 1
        : 1)
};

KifeJS.log("[系统] 第 " + globalThis.__sessionInfo.loadNumber + " 次运行");
```

### 通过初始化函数恢复状态

```javascript
// 脚本: a-module.js
(function() {
    var moduleState = {
        initialized: false,
        data: {},
        counters: {}
    };

    // 初始化函数
    function init() {
        moduleState.initialized = true;
        moduleState.data = {};
        moduleState.counters = {
            initTime: Date.now()
        };
    }

    // 计数器递增
    function increment(name) {
        if (!moduleState.counters[name]) {
            moduleState.counters[name] = 0;
        }
        moduleState.counters[name]++;
    }

    // 初始化
    init();

    // 公开 API
    globalThis.__myModule = {
        increment: increment,
        getCount: function(name) {
            return moduleState.counters[name] || 0;
        },
        reset: function() {
            init();
            KifeJS.log("[模块] 状态已重置");
        }
    };
})();
```

---

## 四、未来展望

当沙箱配置允许文件系统访问时（`exposeFileSystem: true`），可以：

```javascript
// 未来版本可能的持久化方式
// 需要沙箱启用文件系统访问

// 保存状态到文件
function saveState(filename, data) {
    // 需要文件系统 API 支持
    // writeToFile(filename, JSON.stringify(data));
    KifeJS.log("[持久化] 保存: " + filename);
}

// 从文件加载状态
function loadState(filename) {
    // 需要文件系统 API 支持
    // return JSON.parse(readFromFile(filename));
    KifeJS.log("[持久化] 加载: " + filename);
    return null;
}
```

---

## 下一步

- [性能优化](05-performance.md)
- [沙箱与安全](../08-sandbox/01-timeout.md)
