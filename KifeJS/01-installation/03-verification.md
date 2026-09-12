# 验证安装

> **文档索引:** `01-installation/03-verification.md`
>
> 安装完成后，通过以下步骤确认 KifeJS 正常运行。

---

## 1. 检查启动日志

启动 Minecraft 或服务端后，查看日志输出。查找以下关键日志行：

```
[KifeJS] Loading KifeJS scripts from <path>/KifeJS/scripts/
```

如果 KossJS 引擎初始化成功，会继续加载脚本。如果原生库缺失，日志会显示类似：

```
[KifeJS] Failed to load native library: kossjs.dll not found in search path
```

> 日志文件位置：
> - **客户端:** `.minecraft/logs/latest.log`
> - **服务端:** `logs/latest.log`

---

## 2. 测试命令

进入游戏（或以 OP 身份登录服务端），执行：

```
/kifejs version
```

预期输出（在聊天栏）：
```
KossJS <版本号>
```

如果命令可用且返回版本号，说明模组加载成功。

---

## 3. 检查目录结构

启动后，检查脚本目录是否自动创建：

```
.minecraft/
└── KifeJS/
    └── scripts/         ← 应已自动创建
```

> `scripts/` 目录在模组首次初始化时自动创建。如果不存在，请检查日志中是否有权限相关错误。

---

## 4. 运行测试脚本

在 `scripts/` 目录下创建一个测试脚本：

**.minecraft/KifeJS/scripts/test.js:**
```javascript
KifeJS.log("KifeJS is working!");
```

然后执行：

```
/kifejs reload
```

查看日志文件，应看到：

```
[script] KifeJS is working!
[KifeJS] Loaded KifeJS script test
```

---

## 验证清单

- [ ] 启动日志显示 `Loading KifeJS scripts from...` 且无错误
- [ ] `/kifejs version` 返回版本号
- [ ] `KifeJS/scripts/` 目录已自动创建
- [ ] 测试脚本通过 `/kifejs reload` 成功加载并输出日志

---

## 常见安装问题

| 现象 | 可能原因 | 解决方案 |
|------|---------|---------|
| 找不到原生库 | kossjs.dll 缺失或路径错误 | 将原生库放入 `.minecraft/` 目录 |
| Java 版本错误 | JDK 版本低于 25 | 安装 GraalVM JDK 25+ |
| Fabric API 错误 | 缺少 Fabric API | 安装对应版本的 Fabric API |
| 命令无响应 | 权限不足 | 确保拥有 OP 权限 |

---

## 下一步

验证通过后，前往 [快速入门](../02-getting-started/01-first-script.md) 了解如何编写脚本。
