# Issues 组织页面设计文档

## 概述

在 `/issues_organize` 页面创建一个 issue 组织界面，帮助用户快速填写并提交文档问题到 GitHub Issues。

## 页面结构

### 1. 输入表单

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| 页面路径 | text input | 是 | 输入如 `/TLD/zh/guide/getting-started`，提示用户不带域名和 `https://` |
| 你觉得哪里不正确 | textarea | 是 | 描述文档中不正确的内容 |
| 你观察到的现象 | textarea | 是 | 描述用户观察到的现象 |
| 大概怎么修改 | textarea | 否 | 建议的修改方式 |

### 2. URL 验证逻辑

- 用户输入路径后，前端 fetch `当前站点域名 + 路径`，检查返回状态
- 返回 200 → 有效，显示绿色提示
- 返回 404 或网络错误 → 提示"该页面不存在"
- `/issues_organize` 自身路径需要特殊拦截，直接提示不可用

### 3. Issue 模板格式

生成的 issue 内容：

```markdown
## 页面路径

[/path/to/page](https://github.com/TT23XR-Studio/Docs/blob/main/path/to/page.md)

## 你觉得哪里不正确

{用户输入的内容}

## 你观察到的现象

{用户输入的内容}

## 大概怎么修改

{用户输入的内容，可选}
```

标题自动生成：`[文档问题] /path/to/page`

### 4. 操作按钮

- **复制 Markdown** — 将 issue markdown 内容复制到剪贴板
- **复制表单** — 将当前表单内容以 JSON 格式复制到剪贴板，方便下次粘贴恢复
- **创建 Issue** — 跳转到 `https://github.com/TT23XR-Studio/Docs/issues/new?title=...&body=...`（URL 编码后拼接）

### 5. 已提交 Issues 列表

页面下方实时从 GitHub API 拉取 issues 列表：

```
GET https://api.github.com/repos/TT23XR-Studio/Docs/issues?state=all&per_page=20
```

- 无需 token，公开 API
- 速率限制 60 次/小时
- 如果触发速率限制，显示："因为 API 限制，暂时无法读取 Issues 列表。"

## 技术实现

### 文件结构

```
F:\Docs\issues_organize\index.md
```

### 技术方案

- 使用 VitePress 的 Vue 组件能力
- 在 `index.md` 中嵌入 Vue `<script setup>` 和模板
- 所有逻辑（表单、验证、复制、API 调用）在单文件内完成
- 不需要额外依赖

### 样式

- 使用 VitePress 默认主题的样式变量
- 表单区域使用 `vp-doc` 容器宽度
- 按钮使用 VitePress 默认按钮样式
