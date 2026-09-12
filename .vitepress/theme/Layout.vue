<script setup>
import DefaultTheme from 'vitepress/theme'
import TIP from './TIP.vue'
import { useData } from 'vitepress'
import { computed } from 'vue'

const { Layout } = DefaultTheme
const { page } = useData()

// 是否首页（在 issues 链接中隐藏）
const isShow = computed(() =>
  page.value.relativePath === 'index.md' || page.value.relativePath === '' 
  || page.value.relativePath === 'index.html' || page.value.relativePath === 'issues_organize/index.md' 
  || page.value.relativePath === 'issues_organize/index.html'
)

// 当前页面的 issues 链接，自动带上 path 参数
const issuesLink = computed(() => {
  const rel = page.value.relativePath || ''
  // 去掉 .md / .html 后缀，转为 /xxx 形式的路径
  const clean = rel
    .replace(/\.md$/, '')
    .replace(/\.html$/, '')
    .replace(/index$/, '')
    .replace(/\/$/, '')
  const pagePath = clean ? '/' + clean : '/'
  return '/issues_organize?path=' + encodeURIComponent(pagePath)
})

function findNav() {
  const nav = document.querySelector('.VPNav')
  if (nav && getComputedStyle(nav).position !== 'relative') return nav
  const localNav = document.querySelector('.VPLocalNav')
  if (localNav && getComputedStyle(localNav).display !== 'none') return localNav
  return null
}
</script>

<template>
  <Layout>
    <!-- 首页：Hero 之前 -->
    <template #home-hero-before>
      <div class="doc-notice hero">
        <TIP type="warning" sticky :headerFunc="findNav" :offset="0" :z-index="999">
          本文档可能不准确，一切按照源代码为最终准则。若您发现了不准确的地方，请提交 issues。
          <a :href="issuesLink" style="text-decoration: underline #C8C8C8;">[点这里组织 issues]</a>
        </TIP>
      </div>
    </template>

    <!-- 非首页文档：doc-top -->
    <template #doc-top>
      <div class="doc-notice" v-if="!isShow">
        <TIP type="warning" sticky :headerFunc="findNav" :offset="0" :z-index="999">
          本文档可能不准确，一切按照源代码为最终准则。若您发现了不准确的地方，请提交 issues。
          <a :href="issuesLink" style="text-decoration: underline #C8C8C8;">[点这里组织 issues]</a>
        </TIP>
      </div>
    </template>
  </Layout>
</template>

<style scoped>
.doc-notice {
  max-width: var(--vp-doc-content-width, 800px);
  padding: 0 0 5rem 0;
}
.doc-notice.hero {
  margin: 0 auto;
}
</style>
