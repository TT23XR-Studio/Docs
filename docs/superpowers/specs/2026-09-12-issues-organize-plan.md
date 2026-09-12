# 实现计划：Issues 组织页面

## 目标

在 `/issues_organize` 创建一个 Vue 驱动的 issue 组织界面，支持表单填写、URL 验证、markdown 复制、表单复制、GitHub Issue 创建跳转，以及实时 issues 列表展示。

## 步骤

### 步骤 1：创建页面文件

创建 `F:\Docs\issues_organize\index.md`，包含：

- 页面 frontmatter（标题、布局）
- Vue `<script setup>` 逻辑部分
- 表单模板
- 样式

### 步骤 2：实现表单

- 4 个输入字段：页面路径、哪里不正确、观察到的现象、怎么修改
- 页面路径输入框带 placeholder 提示
- 防抖验证：输入后延迟 500ms 自动验证页面是否存在

### 步骤 3：实现 URL 验证

- fetch `window.location.origin + path` 检查状态码
- 拦截 `/issues_organize` 路径
- 显示验证状态（存在/不存在/验证中）

### 步骤 4：实现 Issue 模板生成

- 根据表单内容生成 markdown
- 链接指向 GitHub 源文件：`https://github.com/TT23XR-Studio/Docs/blob/main{path}.md`
- 标题格式：`[文档问题] {path}`

### 步骤 5：实现操作按钮

- 复制 Markdown：`navigator.clipboard.writeText(markdown)`
- 复制表单：`navigator.clipboard.writeText(JSON.stringify(formData))`
- 创建 Issue：`window.open(githubIssueUrl)`

### 步骤 6：实现 Issues 列表

- fetch GitHub API：`https://api.github.com/repos/TT23XR-Studio/Docs/issues?state=all&per_page=20`
- 处理速率限制：检测 403 响应，显示错误提示
- 列表显示：标题、状态、创建时间、链接

### 步骤 7：测试验证

- 运行 `npm run docs:dev` 启动本地开发服务器
- 访问 `/issues_organize` 验证页面功能
- 测试表单验证、复制、跳转等功能

## 依赖

- 无额外 npm 依赖
- 使用 VitePress 内置的 Vue 能力
- 使用浏览器 Clipboard API
- 使用 GitHub REST API（公开，无需 token）

## 验证命令

```bash
cd F:\Docs
npm run docs:dev
```

访问 `http://localhost:5173/issues_organize` 测试所有功能。
