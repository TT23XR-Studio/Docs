import { defineConfig } from 'vitepress'
import type { LanguageRegistration } from 'shiki'
import bonGrammar from './theme/bon/bon.tmLanguage.json'

const bonLang = {
  ...bonGrammar,
  name: 'bon',
  scopeName: 'source.bon'
} as LanguageRegistration


// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "TT23XR Studio 的文档站点",
  description: "这是 TT23XR Studio 搭建的文档站点",
  lang: 'zh-CN',
  lastUpdated: true,
  ignoreDeadLinks: true,
  vite: {
    server: {
      allowedHosts: ['p.ceroxe.fun']
    }
  },
  markdown:{
    languages: [bonLang]
  },
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    logo: 'https://images-sxxyrry.pages.dev/LOGO_Bigger.png',
    outline: {
      label: '在本页面'
    },
    docFooter: {
      prev: '上一页',
      next: '下一页'
    },
    lastUpdated: {
      text: '最后更新于',
      formatOptions: {
        dateStyle: 'full',
        timeStyle: 'medium'
      }
    },
    externalLinkIcon: true,
    editLink: {
      pattern: 'https://github.com/TT23XR-Studio/Docs/edit/main/:path',
      text: '在 Github 上编辑此页'
    },
    sidebarMenuLabel: '菜单',
    returnToTopLabel: '回到顶部',
    notFound: {
      code: '404',
      title: '页面不存在',
      quote: '如果你不改变方向，继续寻找，可能会到达你要去的地方。',
      linkText: '回到主页',
      linkLabel: '回到主页'
    },
    search: {
      provider: 'local',
      options: {
        locales: {
          root: {
            translations: {
              button: {
                buttonText: '搜索文档',
                buttonAriaLabel: '搜索'
              },
              modal: {
                displayDetails: '显示详细列表',
                resetButtonTitle: '重置查询',
                backButtonTitle: '关闭',
                noResultsText: '没有找到结果',
                footer: {
                  selectText: '选择',
                  selectKeyAriaLabel: '输入',
                  navigateText: '导航',
                  navigateUpKeyAriaLabel: '上箭头',
                  navigateDownKeyAriaLabel: '下箭头',
                  closeText: '关闭',
                  closeKeyAriaLabel: 'esc'
                }
              }
            }
          }
        }
      }
    },
    nav: [
      { text: '文档汇总', link: '/' },
      // { text: '公告栏', link: '/Bulletin/' },
      // { text: 'KifeJS', link: '/KifeJS/' },
      { text: 'KossJS', link: '/KossJS/' },
      { text: 'TaiLerDownloader Core', link: '/TLD/' },
      { text: 'BON', link: '/BON/' },
      { text: 'SenRi FFI', link: '/SenRiFFI/' },
      { text: 'TTP', link: '/TTP/' },
      { text: '异常世界 （小说）', link: 'https://anomaly-world-xr.pages.dev/' },
      { text: '组织 issues', link: '/issues_organize' },
    ],

    sidebar: [
      { text: '主页', link: '/' },
      // { text: 'Bulletin', link: '/Bulletin/' },
      // { text: 'KifeJS', link: '/KifeJS/' },
      { text: 'KossJS', link: '/KossJS/' },
      { text: 'TaiLerDownloader Core', link: '/TLD/' },
      { text: 'BON', link: '/BON/' },
      { text: 'SenRi FFI', link: '/SenRiFFI/' },
      { text: 'TTP', link: '/TTP/' },
      { text: '异常世界 （小说）', link: 'https://anomaly-world-xr.pages.dev/' },
      { text: '组织 issues', link: '/issues_organize' },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/TT23XR-Studio/Docs' }
    ]
  },
  head: [
    ['script', {}, `
var func = () => {setTimeout(() => {
try{
var links = document.querySelectorAll('a');
for(var i=0;i<links.length;i++){
var el = links[i];
if(el.href && el.href.includes('/back')){
el.href = location.origin + el.href.substring(window.location.origin.length + ('/' + window.location.pathname.split('/').slice(1)[0]).length + 5);
el.target = '_self';
}}}catch(e){};setTimeout(func, 100);}, 1000);}
document.addEventListener('DOMContentLoaded', func)
setTimeout(func, 1000)
`],
    ['script', {}, `const htmlElement = document.documentElement;htmlElement.setAttribute('class', 'dark');`],
    ['script', { src: `https://footerjs-sxxyrry.pages.dev/footer.js?autorun=false` }, ],
  ]
})
