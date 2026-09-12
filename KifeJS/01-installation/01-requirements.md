# 环境要求

> **文档索引:** `01-installation/01-requirements.md`
>
> 在安装 KifeJS 之前，请确保您的环境满足以下所有要求。

---

## 1. Minecraft 版本

| 要求 | 值 |
|------|-----|
| **最低版本** | Minecraft 26.1.2 |
| **兼容性** | 需要对应版本的 Fabric Loader 和 Fabric API |

KifeJS 使用 Fabric Loom 构建，目前针对 Minecraft 26.1.2+。使用其他版本可能导致不兼容。

---

## 2. Fabric 环境

| 组件 | 最低版本 | 说明 |
|------|---------|------|
| **Fabric Loader** | `>= 0.15.0` | 模组加载器 |
| **Fabric API** | `*`（任意版本） | 提供命令注册等 API |
| **Java** | `>= 25`（推荐 GraalVM JDK 25） | 运行环境 |

### 关于 Java 版本

KifeJS 需要 **Java 25 或更高版本**。推荐使用 **GraalVM JDK 25**，因为 KossJS 引擎在 GraalVM 上经过充分测试。

```powershell
# 检查 Java 版本
java -version
```

输出应显示类似：
```
openjdk version "25.0.1" 2025-04-15
Java HotSpot(TM) 64-Bit Server VM (build 25.0.1+8-1, mixed mode)
```

---

## 3. 原生库依赖 (kossjs)

KifeJS 依赖 **KossJS 原生库**来运行 JavaScript 引擎。该库是以 C ABI 编译的动态链接库。

### 各平台文件名

| 操作系统 | 文件名 |
|---------|--------|
| **Windows** | `kossjs.dll` |
| **Linux** | `kossjs.so` |
| **macOS** | `kossjs.dylib` |

### 库搜索顺序

KifeJS 按以下顺序查找原生库：

1. `KossOptions` 中显式指定的路径
2. 系统属性 `-Dkossjs.library.path=<路径>`
3. 当前工作目录
4. 资源目录 `native/`
5. JNA 默认名称 `kossjs`

### 放置建议

最简单的做法是将 `kossjs.dll`（或对应平台的版本）放在 **Minecraft 工作目录**（即 `.minecraft` 文件夹）下。

也可以通过 JVM 参数指定：
```
-Dkossjs.library.path=C:/path/to/kossjs.dll
```

---

## 4. 构建时要求（如需自行编译）

如果您需要从源码构建 KifeJS，还需要：

| 工具 | 版本要求 |
|------|---------|
| **JDK** | `>= 25` |
| **Gradle** | 由 Gradle Wrapper 自动提供 |
| **Fabric Loom** | 由 Gradle 插件自动管理 |

**重要:** KifeJS 是 `KossJS_API` 多项目工作区的一部分，构建时需要传递 `-PincludeKifeJS=true` 参数。

---

## 环境检查清单

- [ ] Minecraft 26.1.2+
- [ ] Fabric Loader 0.15.0+
- [ ] Fabric API 已安装
- [ ] Java 25+
- [ ] `kossjs.dll`（或对应平台）已放置在正确位置
- [ ] KifeJS JAR 文件已放入 `mods/` 文件夹

---

## 下一步

确认环境满足要求后，请前往 [安装步骤](02-install-steps.md) 进行安装。
