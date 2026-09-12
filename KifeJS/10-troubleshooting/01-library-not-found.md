# 原生库找不到

> **文档索引:** `10-troubleshooting/01-library-not-found.md`
>
> 解决 KossJS 原生库（kossjs.dll/.so/.dylib）加载失败的问题。

---

## 错误现象

```
[KifeJS] Failed to initialize KossJS engine: no kossjs in java.library.path
```

或者：

```
java.lang.UnsatisfiedLinkError: Unable to load library 'kossjs'
```

---

## 常见原因

| 原因 | 说明 |
|------|------|
| 原生库缺失 | 未将 `kossjs.dll` 放入搜索路径 |
| 平台不匹配 | 使用了错误操作系统的库文件 |
| 路径不正确 | 库文件不在搜索路径中 |
| 架构不匹配 | 32 位 vs 64 位不匹配 |
| 依赖缺失 | 缺少 VC++ 运行库（Windows） |

---

## 排查步骤

### 1. 确认文件存在

```
# Windows
dir .minecraft\kossjs.dll

# Linux/macOS
ls -la .minecraft/kossjs.so
```

### 2. 确认文件在搜索路径中

推荐位置：
- `.minecraft/`（游戏根目录）
- 系统 `PATH` 环境变量中的路径
- 通过 `-Dkossjs.library.path` 参数指定

### 3. 确认 Java 架构匹配

```powershell
# 检查 Java 是 32 位还是 64 位
java -version
```

确保原生库的架构与 Java 一致。

---

## 解决方案

### 方案 1：将库放在游戏根目录

```
Windows:
  .minecraft/kossjs.dll

Linux:
  ~/.minecraft/kossjs.so
```

### 方案 2：使用系统属性

```
java -Dkossjs.library.path=C:/path/to/kossjs.dll -jar fabric-server.jar
```

### 方案 3：将库所在目录加入 PATH

```
Windows (PowerShell as Admin):
  [Environment]::SetEnvironmentVariable("Path", "$env:Path;C:\path\to\native", "User")
```

---

## 下一步

- [脚本语法错误](02-script-errors.md)
- [执行超时](03-timeout.md)
