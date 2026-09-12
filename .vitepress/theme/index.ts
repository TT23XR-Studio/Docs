// https://vitepress.dev/guide/custom-theme
import { h, onMounted } from 'vue'
import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import './style.css'
import { translate2 } from './tools.ts'
import LOGO from './LOGO.vue'
import TIP from './TIP.vue'
import Layout from './Layout.vue'


const NAV_LINK_SELECTOR = 'a.VPNavBarMenuLink'
const NAV_GROUP_SELECTOR = 'div.VPFlyout.VPNavMenuGroup.VPNavBarMenuGroup'
const MENU_LINK_SELECTOR = 'li.VPMenuLink'
const LINK_IN_MENU_SELECTOR = 'a.VPLink.link'
const PREFIX_REGEX = /^\/([^/]+)\//

function isHomePage(pathname: string): boolean {
  return pathname === '/' || pathname === '/index.html'
}

function getPrefix(href: string): string | null {
  const match = href.match(PREFIX_REGEX)
  return match ? `/${match[1]}/` : null
}

function filterNavLinks(pathname: string): void {
  const links = document.querySelectorAll<HTMLElement>(NAV_LINK_SELECTOR)
  const home = isHomePage(pathname)

  for (const link of links) {
    const li = link.closest('li')
    if (!li) continue

    const href = link.getAttribute('href') || ''
    const prefix = getPrefix(href)
    if (!prefix) continue

    // const text = link.querySelector('span')?.textContent || ''
    const isHeaderLink = (href === prefix)

    if (home) {
      li.style.display = isHeaderLink ? '' : 'none'
    } else {
      const matchesPrefix = pathname.startsWith(prefix)
      
      li.style.display = matchesPrefix && !isHeaderLink ? '' : 'none'
    }
  }
}

function filterNavGroups(pathname: string): void {
  const divs = document.querySelectorAll<HTMLElement>(NAV_GROUP_SELECTOR)
  const home = isHomePage(pathname)

  for (const div of divs) {
    if (home) {
      div.style.display = 'none'
      continue
    }

    const lis = div.querySelectorAll(MENU_LINK_SELECTOR)
    let matches = false

    for (const li of lis) {
      const link = li.querySelector<HTMLElement>(LINK_IN_MENU_SELECTOR)
      if (!link) continue
      const href = link.getAttribute('href') || ''
      const prefix = getPrefix(href)
      if (prefix && pathname.includes(prefix)) {
        matches = true
        break
      }
    }

    div.style.display = matches ? '' : 'none'
  }
}

function filterNavByPath(): void {
  try {
    const pathname = window.location.pathname
    filterNavLinks(pathname)
    filterNavGroups(pathname)
  } catch (e) {
    console.error(e)
  }
}

let navObserver: MutationObserver | null = null

function startNavObserver(): void {
  navObserver?.disconnect()
  filterNavByPath()
  navObserver = new MutationObserver(() => filterNavByPath())
  navObserver.observe(document.body, { childList: true, subtree: true })
}

export default {
  extends: DefaultTheme,
  // Layout() {
  //   return h(DefaultTheme.Layout, null, {
  //     // https://vitepress.dev/guide/extending-default-theme#layout-slots
  //   })
  // },
  Layout,
  setup() {
    onMounted(() => {
      function tranText2CN(){
        try {
          const spans1 = document.querySelectorAll('span.text');
          for (const span1 of spans1) {
            if (span1.textContent === 'Search') {
              span1.textContent = '搜索';
            }
          }
        } catch(e) {
          console.error(e);
        }
        setTimeout( () => {
          tranText2CN();
        }, 1000)
      };
      if (window.location.pathname.startsWith('/TTHSD/zh/')) {
        tranText2CN();
      };

      startNavObserver();
    });
  },
  enhanceApp({ app, router, siteData }) {
    app.component('TIP', TIP)
    app.component('LOGO', LOGO)
    setTimeout(() => {
      let footerInstance: any = null;

      const initFooter = () => {
        if (typeof window !== 'undefined' && window.Footer) {
          footerInstance = new window.Footer({
            name: 'TT23XR Studio 的文档汇总网站',
            description: '这是 TT23XR Studio 的文档汇总网站。',
            quicks: []
          }, 'https://footerjs-sxxyrry.pages.dev/');
        } else {
          if (typeof window !== 'undefined') {
            setTimeout(initFooter, 200)
          }
        }
      }

      initFooter();

      const setFooter = () => {
          if (typeof document === 'undefined') return;
          const footerE = document.querySelector('.sxxyrry-footer');
          if (footerE) {
            footerInstance.getAndSetFooterPosition(footerE);
          } else {
            setTimeout(setFooter, 200)
          }
      }

      router.onAfterPageLoad = (to: string) => {
        setTimeout(() => {
          startNavObserver();
          setFooter();
        }, 200);
      };
    }, 1000);
  }
} satisfies Theme
