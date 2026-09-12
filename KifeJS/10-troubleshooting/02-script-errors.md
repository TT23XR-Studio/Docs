# 脚本语法/运行时错误

> **文档索引:** `10-troubleshooting/02-script-errors.md`
>
> 处理 KifeJS 脚本中的语法错误和运行时异常。

---

## 一、语法错误

### 错误现象

```
[KifeJS] Failed to load KifeJS script myscript
java.lang.RuntimeException: SyntaxError: Unexpected token ;
```

### 常见语法错误

| 错误 | 示例 | 修复 |
|------|------|------|
| 缺少分号 | `var x = 5` | `var x = 5;` |
| 括号不匹配 | `if (true {` | `if (true) {` |
| 未闭合字符串 | `var s = 'hello;` | `var s = 'hello';` |
| 错误的逗号 | `var a = [1,2,];` | `var a = [1,2];` |
| 保留字作为变量 | `var class = 1;` | `var className = 1;` |

---

## 二、运行时错误

### 错误现象

```
[KifeJS] Failed to load KifeJS script myscript
java.lang.RuntimeException: ReferenceError: x is not defined
    at ...
```

### 常见运行时错误

| 错误 | 说明 | 修复 |
|------|------|------|
| `xxx is not defined` | 变量未定义 | 先声明再使用 |
| `xxx is not a function` | 将非函数当函数调用 | 检查类型 |
| `Cannot read property of undefined` | 访问 undefined 属性 | 做存在性检查 |
| `xxx is not a constructor` | 错误地使用 new | 检查构造函数 |

---

## 三、调试技巧

### 添加详细日志

```javascript
// 在可疑位置添加日志
KifeJS.log("[DEBUG] 变量 x = " + JSON.stringify(x));
KifeJS.log("[DEBUG] 执行到第 N 步");
```

### 使用 try-catch

```javascript
try {
    // 可疑代码
    riskyOperation();
} catch (e) {
    KifeJS.log("[错误] " + e.message);
    KifeJS.log("[错误] 堆栈: " + e.stack);
}
```

### 隔离测试

```javascript
// 创建一个最小的测试脚本
// test.js
KifeJS.log("测试: 基础功能正常");

// 逐步添加功能，确定问题范围
```

---

## 四、错误预防

1. **使用严格模式** — 在脚本开头添加 `"use strict";`
2. **做防御性检查** — 访问变量前检查是否存在
3. **使用小步调试** — 每次只添加少量代码，reload 测试
4. **查看完整日志** — 错误堆栈包含文件路径和行号信息

---

## 下一步

- [执行超时](03-timeout.md)
- [日志与调试](05-logs-and-debug.md)
