import type MarkdownIt from 'markdown-it'

function getTopDir(filePath: string): string | null {
  const match = filePath.match(/^([^/]+)\//)
  return match ? '/' + match[1] : null
}

export function linkPrefixPlugin(md: MarkdownIt) {
  md.core.ruler.push('link_prefix', (state) => {
    const env = state.env
    const filePath = env?.relativePath || ''
    if (!filePath) return

    const topDir = getTopDir(filePath)
    if (!topDir) return

    for (const token of state.tokens) {
      if (token.type !== 'inline') continue
      for (const child of token.children || []) {
        if (child.type !== 'link_open') continue
        const href = child.attrGet('href')
        
        if (!href) continue

        // 相对路径不处理
        if (!href.startsWith('/')) continue

        // /back → /
        if (href === '/back' || href === '/back/') {
          child.attrSet('href', '/')
          continue
        }
        // /back/xxx → /xxx
        if (href.startsWith('/back/')) {
          child.attrSet('href', href.slice(5))
          continue
        }

        // 已有当前目录前缀则跳过
        if (href.startsWith(topDir + '/') || href === topDir) continue

        // 其他所有 / 开头的链接加前缀
        child.attrSet('href', topDir + href)
      }
    }
  })
}

export function linkPrefixTransformPageData(pageData: { relativePath: string; frontmatter: Record<string, any> }) {
  const match = pageData.relativePath.match(/^([^/]+)\//)
  if (!match) return
  const topDir = '/' + match[1]

  // 处理 hero.actions 中的 link
  const hero = pageData.frontmatter?.hero
  if (hero?.actions) {
    for (const action of hero.actions) {
      if (typeof action.link !== 'string') continue
      if (!action.link.startsWith('/')) continue
      if (action.link === '/back' || action.link === '/back/') {
        action.link = '/'
        continue
      }
      if (action.link.startsWith('/back/')) {
        action.link = action.link.slice(5)
        continue
      }
      if (action.link.startsWith(topDir + '/') || action.link === topDir) continue
      action.link = topDir + action.link
    }
  }
}
