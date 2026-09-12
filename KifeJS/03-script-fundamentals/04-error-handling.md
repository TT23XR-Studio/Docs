# 错误处理机制

> **文档索引:** `03-script-fundamentals/04-error-handling.md`
>
> 理解 KifeJS 的错误边界、异常传播和处理策略。

---

## 一、错误处理层次

KifeJS 的错误处理分为三个层次：

```
┌──────────────────────────────────────┐
│ Layer 1: Java 层异常捕获             │  ← ScriptManager.executeAll()
│   捕获 RuntimeException              │     记录错误，继续执行
├──────────────────────────────────────┤
│ Layer 2: KossJS 引擎层              │  ← ScriptRuntime.execute()
│   处理 JS 语法错误、执行错误          │     向 Java 层传播异常
├──────────────────────────────────────┤
│ Layer 3: JavaScript 脚本层           │  ← 用户代码
│   try/catch 处理自身异常             │     主动错误处理
└──────────────────────────────────────┘
```

---

## 二、Java 层错误捕获（Layer 1）

`ScriptManager.executeAll()` 对每个脚本应用 try-catch：

```java
private void executeAll(List<DiscoveredScript> scripts) {
    for (DiscoveredScript script : scripts) {
        try {
            runtime.execute(script);
            LOGGER.info("Loaded KifeJS script {}", script.name());
        } catch (RuntimeException e) {
            LOGGER.error("Failed to load KifeJS script {}", script.name(), e);
        }
    }
}
```

### 行为

| 场景 | 结果 |
|------|------|
| 脚本 A 正常 | 日志 `Loaded KifeJS script A` |
| 脚本 B 抛出异常 | 日志 `Failed to load KifeJS script B` + 详细堆栈 |
| 脚本 C 正常 | 日志 `Loaded KifeJS script C`（不受 B 影响） |

### 日志示例

```
[KifeJS] Loaded KifeJS script 0-config
[KifeJS] Failed to load KifeJS script broken-script
java.lang.RuntimeException: SyntaxError: Unexpected token ;
    at com.kifejs.script.ScriptRuntime.execute(ScriptRuntime.java:33)
    ...
[KifeJS] Loaded KifeJS script z-cleanup
```

---

## 三、JS 层错误处理（Layer 3）

### 使用 try/catch

```javascript
// ✅ 推荐的防御性编程
try {
    // 可能出错的代码
    var result = riskyOperation();
    KifeJS.log("操作成功: " + result);
} catch (e) {
    KifeJS.log("操作失败: " + e.message);
}
```

### 错误类型

```javascript
// 语法错误 - 在脚本加载时立即暴露
// function { return 1; }   // SyntaxError

// 引用错误 - 访问未定义变量
try {
    console.log(someUndefinedVar);
} catch (e) {
    KifeJS.log("引用错误: " + e.message);  // someUndefinedVar is not defined
}

// 类型错误 - 调用非函数
var notAFunction = 42;
try {
    notAFunction();
} catch (e) {
    KifeJS.log("类型错误: " + e.message);  // notAFunction is not a function
}

// 范围错误 - 超出有效范围
try {
    var arr = [1, 2, 3];
    arr.length = -1;
} catch (e) {
    KifeJS.log("范围错误: " + e.message);
}
```

---

## 四、常见错误场景与处理

### 场景 1：语法错误

```javascript
// ❌ 错误的语法
// function sayHello() {   // 注意: KossJS 引擎可能不支持某些 ES6+ 语法
//   KifeJS.log("hello");
// }

// ✅ 兼容写法
function sayHello() {
    KifeJS.log("hello");
}
```

### 场景 2：未捕获的异步错误

```javascript
// ⚠️ 注意：setTimeout 中的错误不会被外层 try-catch 捕获
try {
    setTimeout(function() {
        throw new Error("异步错误");  // 这个错误无法被外层捕获
    }, 1000);
} catch (e) {
    // 不会执行到这里
    KifeJS.log("捕获到: " + e.message);
}

// ✅ 在异步回调内部处理
setTimeout(function() {
    try {
        doSomethingRisky();
    } catch (e) {
        KifeJS.log("异步错误已处理: " + e.message);
    }
}, 1000);
```

### 场景 3：配置缺失

```javascript
// ❌ 直接访问可能导致 ReferenceError
// var config = __packageConfig;  // 如果 config.js 未定义变量则报错

// ✅ 安全访问
var config = (typeof __packageConfig !== "undefined") ? __packageConfig : {};
```

### 场景 4：API 调用错误

```javascript
// KifeJS API 本身是容错的
KifeJS.log();              // ✅ 空参数，输出空字符串
KifeJS.log(null);          // ✅ 输出 "null"
KifeJS.log(undefined);     // ✅ 输出 "undefined"
KifeJS.log(42);            // ✅ 自动转为字符串 "42"
KifeJS.log({a:1});         // ✅ 输出 "[object Object]"
```

---

## 五、防御性编程模式

### 安全变量访问

```javascript
// 安全读取全局变量的通用函数
function safeGet(name, defaultValue) {
    return (typeof globalThis[name] !== "undefined") ? globalThis[name] : defaultValue;
}

// 使用
var config = safeGet("__appConfig", {});
var enabled = safeGet("KifeJSConfig", {}).enabled;
```

### 安全的函数调用

```javascript
// 确保函数存在再调用
function safeCall(fn, context) {
    if (typeof fn === "function") {
        try {
            return fn(context);
        } catch (e) {
            KifeJS.log("函数调用失败: " + e.message);
        }
    }
}

// 使用
var handlers = safeGet("__eventHandlers", []);
for (var i = 0; i < handlers.length; i++) {
    safeCall(handlers[i], eventData);
}
```

### 初始化守卫

```javascript
// 防止重复初始化
if (globalThis.__initialized) {
    KifeJS.log("脚本已初始化，跳过");
} else {
    globalThis.__initialized = true;
    // 初始化逻辑
    KifeJS.log("脚本初始化完成");
}
```

---

## 六、错误日志解读

```
[KifeJS] Failed to load KifeJS script myscript
java.lang.RuntimeException: ...
    at com.kifejs.script.ScriptRuntime.execute(ScriptRuntime.java:32)
    at com.kifejs.script.ScriptManager.executeAll(ScriptManager.java:44)
    at com.kifejs.script.ScriptManager.loadGlobalScripts(ScriptManager.java:23)
    at com.kifejs.script.ScriptManager.reloadGlobalScripts(ScriptManager.java:27)
```

| 堆栈元素 | 说明 |
|---------|------|
| `ScriptRuntime.execute:32` | 执行脚本时发生错误 |
| `ScriptManager.executeAll:44` | 遍历到出错的脚本 |
| `ScriptManager.loadGlobalScripts:23` | 加载流程 |
| `ScriptManager.reloadGlobalScripts:27` | 由 reload 命令触发 |

---

## 七、错误处理最佳实践

1. **始终使用 `try/catch`** 包裹可能出错的代码
2. **使用防御性读取** 访问全局变量和配置
3. **避免顶层副作用** — 将主要逻辑放在函数内，在已知安全时调用
4. **正确处理异步错误** — 在异步回调内部而非外部捕获
5. **利用执行顺序** — 将初始化脚本排在最前，确保依赖先就绪
6. **查看日志** — 错误信息提供了精确的失败原因和位置

---

## 下一步

- 学习 [KifeJS.log() API](../04-api-reference/01-KifeJS-log.md)
- 掌握 [跨脚本通信模式](../06-cross-script/01-global-scope.md)
