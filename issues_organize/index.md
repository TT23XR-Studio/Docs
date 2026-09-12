---
title: Issues 组织
---

<script setup>
import { ref, computed, onMounted } from 'vue'

const REPO = 'TT23XR-Studio/Docs'
const GITHUB_API = `https://api.github.com/repos/${REPO}`
const GITHUB_BLOB = `https://github.com/${REPO}/blob/main`
const GITHUB_RAW = `https://raw.githubusercontent.com/${REPO}/main`
const GITHUB_ISSUES_NEW = `https://github.com/${REPO}/issues/new`

// 表单数据
const pagePath = ref('')
const incorrect = ref('')
const phenomenon = ref('')
const fixSuggestion = ref('')

// 验证状态
const validating = ref(false)
const valid = ref(null) // null=未验证, true=有效, false=无效
const validMessage = ref('')

// 解析出来的 GitHub 仓库内文件路径
const ghPath = ref('')

// issues 列表
const issues = ref([])
const issuesLoading = ref(false)
const issuesError = ref('')

// 复制状态
const copiedMarkdown = ref(false)
const copiedForm = ref(false)

// 验证页面路径
let validateTimer = null
let validateToken = 0

function debounceValidate() {
  clearTimeout(validateTimer)
  validateTimer = setTimeout(() => validatePage(), 500)
}

async function testPageExists(url) {
  try {
    const resp = await fetch(url)
    return [resp.ok, resp]
  } catch (e) {
    return [false, null]
  }
}

async function fileExists(url) {
  try {
    const resp = await fetch(url, { method: 'HEAD' })
    return resp.ok
  } catch {
    return false
  }
}

// 路径转 GitHub 文件路径：/TLD → /TLD/index.md, /TLD/zh/getting-started → /TLD/zh/getting-started.md
async function resolveGitHubPath(path) {
  let clean = path.trim().replace(/\/+$/, '')
  if (!clean) return '/index.md'

  // 已经带扩展名
  if (/\.\w+$/.test(clean)) {
    if (clean.endsWith('.md')) return clean
    return `${clean}.md`
  }

  // 目录形式：优先 index.md，其次同名 .md
  if (await fileExists(`${GITHUB_RAW}${clean}/index.md`)) return `${clean}/index.md`
  if (await fileExists(`${GITHUB_RAW}${clean}.md`)) return `${clean}.md`
  return `${clean}/index.md`
}

async function validatePage() {
  const token = ++validateToken
  const path = pagePath.value.trim()

  valid.value = null
  validMessage.value = ''
  ghPath.value = ''

  if (!path) {
    validating.value = false
    return
  }

  // 拦截自身页面
  if (path === '/issues_organize' || path === '/issues_organize/') {
    valid.value = false
    validMessage.value = '不能填写本页面'
    return
  }

  // 检查路径格式
  if (!path.startsWith('/')) {
    valid.value = false
    validMessage.value = '路径需要以 / 开头'
    return
  }

  validating.value = true
  validMessage.value = '验证中...'

  try {
    const [ok, resp] = await testPageExists(window.location.origin + path)
    if (token !== validateToken) return

    if (ok) {
      valid.value = true
      validMessage.value = '页面存在 ✓'

      const resolved = await resolveGitHubPath(path)
      if (token !== validateToken) return
      ghPath.value = resolved
    } else {
      valid.value = false
      validMessage.value = `页面不存在${resp ? ` (${resp.status})` : ''}`
    }
  } catch (e) {
    if (token !== validateToken) return
    valid.value = false
    validMessage.value = '无法访问该页面'
  } finally {
    if (token === validateToken) validating.value = false
  }
}

// 确保 GitHub 路径已解析（用户可能没等验证完成就操作）
async function ensureGitHubPath() {
  const path = pagePath.value.trim()
  if (!path || ghPath.value) return
  ghPath.value = await resolveGitHubPath(path)
}

// 生成 issue markdown
const issueMarkdown = computed(() => {
  const path = pagePath.value.trim()
  const githubLink = ghPath.value ? `${GITHUB_BLOB}${ghPath.value}` : ''
  let md = `## 页面路径\n\n`
  if (path) {
    md += githubLink ? `[${path}](${githubLink})\n\n` : `${path}\n\n`
  } else {
    md += `（未填写）\n\n`
  }
  md += `## 你觉得哪里不正确\n\n${incorrect.value || '（未填写）'}\n\n`
  md += `## 你观察到的现象\n\n${phenomenon.value || '（未填写）'}\n`
  if (fixSuggestion.value) {
    md += `\n## 大概怎么修改\n\n${fixSuggestion.value}\n`
  }
  return md
})

// issue 标题
const issueTitle = computed(() => {
  return `[文档问题] ${pagePath.value.trim() || '未知页面'}`
})

// 复制 markdown
async function copyMarkdown() {
  await ensureGitHubPath()
  try {
    await navigator.clipboard.writeText(issueMarkdown.value)
    copiedMarkdown.value = true
    setTimeout(() => (copiedMarkdown.value = false), 2000)
  } catch (e) {
    alert('复制失败，请手动复制')
  }
}

// 复制表单
async function copyForm() {
  const data = {
    pagePath: pagePath.value,
    incorrect: incorrect.value,
    phenomenon: phenomenon.value,
    fixSuggestion: fixSuggestion.value
  }
  try {
    await navigator.clipboard.writeText(JSON.stringify(data, null, 2))
    copiedForm.value = true
    setTimeout(() => (copiedForm.value = false), 2000)
  } catch (e) {
    alert('复制失败，请手动复制')
  }
}

// 粘贴表单
async function pasteForm() {
  try {
    const text = await navigator.clipboard.readText()
    const data = JSON.parse(text)
    if (data.pagePath !== undefined) pagePath.value = data.pagePath
    if (data.incorrect !== undefined) incorrect.value = data.incorrect
    if (data.phenomenon !== undefined) phenomenon.value = data.phenomenon
    if (data.fixSuggestion !== undefined) fixSuggestion.value = data.fixSuggestion
    validatePage()
  } catch (e) {
    alert('粘贴失败，请确保剪贴板中是复制的表单 JSON')
  }
}

// 创建 issue
async function createIssue() {
  await ensureGitHubPath()
  const title = issueTitle.value
  const body = issueMarkdown.value
  const url = `${GITHUB_ISSUES_NEW}?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`
  window.open(url, '_blank')
}

// 拉取 issues 列表
async function fetchIssues() {
  issuesLoading.value = true
  issuesError.value = ''
  try {
    const resp = await fetch(`${GITHUB_API}/issues?state=all&per_page=20`)
    if (resp.status === 403 || resp.status === 429) {
      issuesError.value = '因为 API 限制，暂时无法读取 Issues 列表。'
      return
    }
    if (!resp.ok) {
      issuesError.value = '读取 Issues 列表失败'
      return
    }
    const data = await resp.json()
    // GitHub 的 issues 接口会同时返回 PR，需要过滤掉
    issues.value = data.filter((item) => !item.pull_request)
  } catch (e) {
    issuesError.value = '网络错误，无法读取 Issues 列表'
  } finally {
    issuesLoading.value = false
  }
}

// 格式化时间
function formatDate(dateStr) {
  const d = new Date(dateStr)
  return isNaN(d.getTime()) ? dateStr : d.toLocaleString('zh-CN', { hour12: false })
}

onMounted(() => {
  // 从 URL 参数自动填充路径
  const params = new URLSearchParams(window.location.search)
  const presetPath = params.get('path')
  if (presetPath) {
    pagePath.value = presetPath
  }
  validatePage()
  fetchIssues()
})
</script>

# Issues 组织

## 提交新 Issue

<div class="issues-form">

### 页面路径

<div class="input-group">
  <input
    v-model="pagePath"
    @input="debounceValidate"
    type="text"
    placeholder="例如 /TLD/zh/guide/getting-started"
    class="path-input"
  />
  <span v-if="validating" class="status validating">验证中...</span>
  <span v-else-if="valid === true" class="status valid">{{ validMessage }}</span>
  <span v-else-if="valid === false" class="status invalid">{{ validMessage }}</span>
</div>
<p class="hint">请输入页面路径，不需要填写域名和 https://，例如 <code>/TLD/zh/guide/getting-started</code></p>

### 你觉得哪里不正确

<textarea v-model="incorrect" rows="3" placeholder="描述文档中不正确的内容..."></textarea>

### 你观察到的现象

<textarea v-model="phenomenon" rows="3" placeholder="描述你观察到的现象..."></textarea>

### 大概怎么修改（可选）

<textarea v-model="fixSuggestion" rows="3" placeholder="建议的修改方式..."></textarea>

<div class="actions">
  <button @click="copyMarkdown" class="btn" :disabled="!pagePath.trim()">
    {{ copiedMarkdown ? '已复制 ✓' : '复制 Markdown' }}
  </button>
  <button @click="copyForm" class="btn" :disabled="!pagePath.trim()">
    {{ copiedForm ? '已复制 ✓' : '复制表单' }}
  </button>
  <button @click="pasteForm" class="btn">粘贴表单</button>
  <button @click="createIssue" class="btn primary" :disabled="!pagePath.trim() || !incorrect.trim() || !phenomenon.trim() || valid === false">
    创建 Issue
  </button>
</div>

### 预览

<details>
<summary>点击展开 Issue 预览</summary>

**标题：** {{ issueTitle }}

---

<pre class="issue-preview">{{ issueMarkdown }}</pre>

</details>

</div>

## 已提交的 Issues

<div v-if="issuesLoading" class="loading">加载中...</div>
<div v-else-if="issuesError" class="error">{{ issuesError }}</div>
<div v-else-if="issues.length === 0" class="empty">暂无 Issues</div>
<div v-else class="issues-list">
  <div v-for="issue in issues" :key="issue.id" class="issue-item">
    <div class="issue-header">
      <a :href="issue.html_url" target="_blank">{{ issue.title }}</a>
      <span class="issue-state" :class="issue.state">{{ issue.state === 'open' ? '开放' : '已关闭' }}</span>
    </div>
    <div class="issue-meta">
      #{{ issue.number }} · {{ formatDate(issue.created_at) }}
    </div>
  </div>
</div>

<style scoped>
.issues-form {
  max-width: 700px;
}

.issues-form h3 {
  margin-top: 1.5rem;
  margin-bottom: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
}

.input-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.path-input {
  flex: 1;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--vp-c-border);
  border-radius: 6px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-family: monospace;
  font-size: 0.9rem;
}

.path-input:focus {
  border-color: var(--vp-c-brand);
  outline: none;
}

.status {
  font-size: 0.85rem;
  white-space: nowrap;
}

.status.validating {
  color: var(--vp-c-text-3);
}

.status.valid {
  color: #10b981;
}

.status.invalid {
  color: #ef4444;
}

.hint {
  font-size: 0.8rem;
  color: var(--vp-c-text-3);
  margin-top: 0.25rem;
}

textarea {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--vp-c-border);
  border-radius: 6px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-family: inherit;
  font-size: 0.9rem;
  resize: vertical;
  box-sizing: border-box;
}

textarea:focus {
  border-color: var(--vp-c-brand);
  outline: none;
}

.actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-top: 1rem;
}

.btn {
  padding: 0.5rem 1rem;
  border: 1px solid var(--vp-c-border);
  border-radius: 6px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s;
}

.btn:hover:not(:disabled) {
  border-color: var(--vp-c-brand);
  color: var(--vp-c-brand);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn.primary {
  background: var(--vp-c-brand);
  color: white;
  border-color: var(--vp-c-brand);
}

.btn.primary:hover:not(:disabled) {
  background: var(--vp-c-brand-light);
  border-color: var(--vp-c-brand-light);
  color: white;
}

.issue-preview {
  background: var(--vp-c-bg-soft);
  padding: 1rem;
  border-radius: 6px;
  font-size: 0.85rem;
  white-space: pre-wrap;
  overflow-x: auto;
}

.loading, .error, .empty {
  padding: 1rem;
  text-align: center;
  color: var(--vp-c-text-3);
  font-size: 0.9rem;
}

.error {
  color: #ef4444;
}

.issues-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.issue-item {
  padding: 0.75rem 1rem;
  border: 1px solid var(--vp-c-border);
  border-radius: 6px;
  background: var(--vp-c-bg);
}

.issue-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.issue-header a {
  color: var(--vp-c-brand);
  text-decoration: none;
  font-weight: 500;
}

.issue-header a:hover {
  text-decoration: underline;
}

.issue-state {
  font-size: 0.75rem;
  padding: 0.1rem 0.5rem;
  border-radius: 999px;
  font-weight: 500;
}

.issue-state.open {
  background: #d1fae5;
  color: #065f46;
}

.issue-state.closed {
  background: #fee2e2;
  color: #991b1b;
}

.issue-meta {
  font-size: 0.8rem;
  color: var(--vp-c-text-3);
  margin-top: 0.25rem;
}
</style>
