import { defineConfig } from 'vitepress'
import baseConfig from './_config.mts'
import { loadBonConfigs } from './bon-loader.ts'
import { linkPrefixPlugin, linkPrefixTransformPageData } from './link-prefix-plugin.ts'


const bonData = loadBonConfigs()
const themeConfig = (baseConfig as any).themeConfig || {}

const baseNav = (themeConfig.nav || []).map(item => ({ ...item, _base: true }))
const baseSidebar = themeConfig.sidebar || []

const baseSidebarObj: Record<string, any[]> = {}
if (Array.isArray(baseSidebar)) {
  baseSidebarObj['/'] = baseSidebar
} else {
  Object.assign(baseSidebarObj, baseSidebar)
}

export default defineConfig({
  ...baseConfig,
  markdown: {
    ...(baseConfig as any).markdown,
    config: (md) => {
      md.use(linkPrefixPlugin)
    },
  },
  themeConfig: {
    ...themeConfig,
    nav: [...baseNav, ...bonData.nav],
    sidebar: { ...baseSidebarObj, ...bonData.sidebar },
  },
  transformPageData: linkPrefixTransformPageData,
})
