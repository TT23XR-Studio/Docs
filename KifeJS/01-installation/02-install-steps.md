# 安装步骤

> **文档索引:** `01-installation/02-install-steps.md`
>
> 详细说明如何安装 KifeJS 模组。

---

## 方式一：使用预构建 JAR（推荐）

### 步骤 1：获取 KifeJS JAR

从发布页面下载 `KifeJS-0.1.0.jar`，或自行从源码构建。

### 步骤 2：放入 mods 文件夹

将 JAR 文件复制到 Fabric 服务端或客户端的 `mods/` 目录：

```
.minecraft/
└── mods/
    └── KifeJS-0.1.0.jar
```

### 步骤 3：放置 KossJS 原生库

将对应平台的原生库放入 Minecraft 工作目录：

```
Windows:
  .minecraft/
  └── kossjs.dll

Linux:
  .minecraft/
  └── kossjs.so

macOS:
  .minecraft/
  └── kossjs.dylib
```

> 如果使用服务端专属目录（如 `paper/` 或自定义服务端根目录），原生库应放在服务端根目录下。

### 步骤 4：启动游戏

启动 Minecraft（客户端或服务端）。KifeJS 会在启动时自动完成以下操作：

- 初始化 KossJS 引擎
- 创建 `KifeJS/scripts/` 目录（如不存在）
- 扫描并执行所有发现的脚本
- 注册 `/kifejs` 命令

---

## 方式二：从源码构建

### 步骤 1：克隆仓库

```powershell
git clone <仓库地址> KossJS_API
cd KossJS_API
```

### 步骤 2：使用 Gradle 构建

```powershell
# Windows
gradlew.bat build -PincludeKifeJS=true

# Linux / macOS
./gradlew build -PincludeKifeJS=true
```

> **注意:** `-PincludeKifeJS=true` 是必需的，因为 KifeJS 在默认构建中是被排除的。

### 步骤 3：获取输出 JAR

构建完成后，JAR 位于：

```
kifejs-fabric/build/libs/KifeJS-0.1.0.jar
```

### 步骤 4：同方式一的步骤 2–4

将构建好的 JAR 放入 `mods/`，放置原生库，启动游戏。

---

## Linux/macOS 特殊说明

### Native library on Linux

```bash
# Option 1: Place in server root
cp kossjs.so /opt/minecraft/server/

# Option 2: Use system property
java -Dkossjs.library.path=/usr/local/lib/kossjs.so -jar fabric-server.jar
```

### Native library on macOS

```bash
# macOS uses .dylib
cp kossjs.dylib ~/Library/Application\ Support/minecraft/
```

---

## 验证安装

安装完成后，请参阅 [验证安装](03-verification.md) 确认模组正常运行。
