# koss_worker_post_message 函数（已移除）

> [!IMPORTANT]
> **此 API 已在 v0.1.0-dev.10 移除。**

## 移除说明

Worker 线程池自 **v0.1.0-dev.10** 起被整体移除：

- 删除 `src/worker.rs`、`src/js_shims/koss_shim/worker.js`
- 清理 `__koss_worker_*` 等 C ABI 函数及 Python/TypeScript 绑定
- 移除 `KOSS_CAP_WORKER` 能力位与 `koss:worker` 模块

该函数不再存在于动态库符号表中，调用会失败。

## 替代方案

需要并行执行 JS 任务时，请使用：

| 场景 | 方案 |
|------|------|
| 并行执行多个独立任务 | **多实例隔离**：宿主侧创建多个 KossJS 实例 |
| 异步 I/O（网络/文件） | **`koss_run_async`**：单实例内 async/await |
| CPU 密集并行 | **宿主线程池 + 多实例** |

详见 [stable 模式替代方案 - 并行执行](/zh/reference/stable-alternatives#二并行执行替代方案) 与 [版本变更日志 (dev.9 → dev.10)](/zh/version/changelog-dev.9-to-dev.10)。

## 相关 API

- [koss_run_async](/zh/api/functions/koss_run_async)
