<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

export type TipType = 'tip' | 'info' | 'warning' | 'success' | 'error'

const props = withDefaults(defineProps<{
  type?: TipType
  title?: string
  /** 是否开启吸顶 */
  sticky?: boolean
  /**
   * 头部元素选择器（CSS 选择器）。
   * 组件会吸附在该元素的底部；如果元素已滚出视口，就退化为吸附到视口顶部。
   * 不传则退化为吸附到视口顶部 + offset。
   * 支持逗号分隔的多个选择器，依次查找第一个可见元素。
   */
  headerSelector?: string
  /**
   * 自定义 header 查找函数。
   * 返回一个 Element 作为吸附锚点，或 null 退化为视口顶部。
   * 不传则使用 headerSelector 选择器查找。
   */
  headerFunc?: () => Element | null
  /** 额外偏移，加在 header 底部（或视口顶部）之上，支持数字或任意 CSS 长度 */
  offset?: number | string
  zIndex?: number
  closable?: boolean
  bordered?: boolean
}>(), {
  type: 'info',
  sticky: false,
  headerSelector: '',
  headerFunc: undefined,
  offset: 0,
  zIndex: 100,
  closable: false,
  bordered: true,
})

const emit = defineEmits<{ (e: 'close'): void }>()

const ICONS: Record<TipType, string> = {
  tip: 'M12 2a7 7 0 0 0-4 12.74V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.26A7 7 0 0 0 12 2Zm-3 18h6v1a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-1Z',
  info: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1 15h-2v-6h2v6Zm0-8h-2V7h2v2Z',
  warning: 'M12 2.5 1.5 21h21L12 2.5Zm1 15h-2v-5h2v5Zm0-7h-2V8h2v2.5Z',
  success: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm-1.2 14.6-4-4L8.2 11l2.6 2.6L17.4 7l1.4 1.4-8 8.2Z',
  error: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm4 12.6L14.6 16 12 13.4 9.4 16 8 14.6 10.6 12 8 9.4 9.4 8 12 10.6 14.6 8 16 9.4 13.4 12 16 14.6Z',
}

const visible = ref(true)
const wrapperRef = ref<HTMLElement | null>(null)
const tipRef = ref<HTMLElement | null>(null)

/** 是否已经吸附 */
const isStuck = ref(false)
/** 吸附时距视口顶部的像素值（header 底部 + offset） */
const stickyTopPx = ref(0)
/** 占位高度，等于 tip 自身高度 */
const spacerHeight = ref(0)
/** fixed 时需要复刻的水平位置与宽度 */
const tipLeft = ref(0)
const tipWidth = ref(0)

let offsetPx = 0
let headerEl: Element | null = null
let ro: ResizeObserver | null = null
let rafId = 0

/** 把任意 CSS 长度（rem / var() 等）解析为像素 */
function resolveCssLenToPx(len: string, el: HTMLElement): number {
  const probe = document.createElement('div')
  probe.style.cssText = `position:absolute;visibility:hidden;pointer-events:none;height:${len};`
  el.appendChild(probe)
  const h = probe.offsetHeight
  el.removeChild(probe)
  return h
}

/** 按逗号分隔的选择器依次查找第一个可见元素（跳过 display:none） */
function findHeaderElement(selectors: string): Element | null {
  for (const sel of selectors.split(',')) {
    const el = document.querySelector(sel.trim())
    if (el && getComputedStyle(el).display !== 'none') return el
  }
  return null
}

/** header 底部距视口顶部的距离；找不到或已滚出视口时返回 0 */
function computeHeaderBottom(): number {
  if (props.headerFunc) {
    const el = props.headerFunc()
    if (!el) return 0
    headerEl = el
    return Math.max(0, el.getBoundingClientRect().bottom)
  }
  if (!props.headerSelector) return 0
  if (!headerEl || !headerEl.isConnected) {
    headerEl = findHeaderElement(props.headerSelector)
  }
  if (!headerEl) return 0
  const rect = headerEl.getBoundingClientRect()
  return Math.max(0, rect.bottom)
}

/** 吸附位置 */
function computeStickyTop(): number {
  return computeHeaderBottom() + offsetPx
}

/** 尺寸测量：只在初始化、resize、ResizeObserver 触发时调用 */
function measure() {
  if (!props.sticky) return
  const wrapper = wrapperRef.value
  const tip = tipRef.value
  if (!wrapper || !tip) return

  spacerHeight.value = tip.offsetHeight
  offsetPx =
    typeof props.offset === 'number'
      ? props.offset
      : resolveCssLenToPx(props.offset, wrapper)

  const rect = wrapper.getBoundingClientRect()
  tipLeft.value = rect.left
  tipWidth.value = rect.width

  updateStuck()
}

/** 滚动时更新吸附状态与位置 */
function updateStuck() {
  if (!props.sticky || !wrapperRef.value) return
  stickyTopPx.value = computeStickyTop()
  const rect = wrapperRef.value.getBoundingClientRect()
  isStuck.value = rect.top <= stickyTopPx.value
}

function onScroll() {
  cancelAnimationFrame(rafId)
  rafId = requestAnimationFrame(updateStuck)
}

function onResize() {
  cancelAnimationFrame(rafId)
  rafId = requestAnimationFrame(measure)
}

onMounted(() => {
  if (!props.sticky) return

  if (props.headerFunc) {
    headerEl = props.headerFunc()
  } else if (props.headerSelector) {
    headerEl = findHeaderElement(props.headerSelector)
  }

  measure()
  window.addEventListener('scroll', onScroll, true)
  window.addEventListener('resize', onResize)

  if (typeof ResizeObserver !== 'undefined') {
    ro = new ResizeObserver(onResize)
    if (wrapperRef.value) ro.observe(wrapperRef.value)
    if (tipRef.value) ro.observe(tipRef.value)
    if (headerEl) ro.observe(headerEl)
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll, true)
  window.removeEventListener('resize', onResize)
  ro?.disconnect()
  cancelAnimationFrame(rafId)
})

const wrapperStyle = computed(() => {
  if (!props.sticky || !visible.value || !spacerHeight.value) return undefined
  return { height: `${spacerHeight.value}px` }
})

const tipStyle = computed(() => {
  if (!props.sticky) return undefined
  if (!isStuck.value) return { zIndex: props.zIndex }
  return {
    position: 'fixed' as const,
    top: `${stickyTopPx.value}px`,
    left: `${tipLeft.value}px`,
    width: `${tipWidth.value}px`,
    zIndex: props.zIndex,
  }
})

function handleClose() {
  visible.value = false
  emit('close')
}
</script>

<template>
  <div ref="wrapperRef" class="tip-wrapper" :style="wrapperStyle">
    <Transition name="tip-fade">
      <div
        v-if="visible"
        ref="tipRef"
        class="tip"
        :class="[
          `tip--${type}`,
          { 'tip--plain': !bordered, 'tip--stuck': isStuck },
        ]"
        :style="tipStyle"
        :role="type === 'error' ? 'alert' : 'status'"
      >
        <span class="tip__icon" aria-hidden="true">
          <slot name="icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path :d="ICONS[type]" />
            </svg>
          </slot>
        </span>

        <div class="tip__main">
          <div v-if="title || $slots.title" class="tip__title">
            <slot name="title">{{ title }}</slot>
          </div>
          <div class="tip__content">
            <slot />
          </div>
        </div>

        <button
          v-if="closable"
          type="button"
          class="tip__close"
          aria-label="关闭"
          @click="handleClose"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M6.4 5 5 6.4 10.6 12 5 17.6 6.4 19 12 13.4 17.6 19 19 17.6 13.4 12 19 6.4 17.6 5 12 10.6z" />
          </svg>
        </button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.tip {
  --tip-accent: #60a5fa;
  --tip-bg: rgba(96, 165, 250, 0.1);
  --tip-border: rgba(96, 165, 250, 0.28);
  --tip-title: #93c5fd;

  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  box-sizing: border-box;
  width: 100%;
  padding: 10px 14px;
  border: 1px solid var(--tip-border);
  border-radius: 8px;
  background: var(--tip-bg);
  color: #e2e8f0;
  font-size: 14px;
  line-height: 1.6;
  word-break: break-word;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  transition: box-shadow 0.2s ease, background 0.2s ease;
}

.tip--plain {
  border-color: transparent;
}

.tip--stuck {
  background: color-mix(in srgb, var(--tip-bg) 100%, #000 12%);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.45);
}

.tip__icon {
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 1.6em;
  color: var(--tip-accent);
}

.tip__icon svg {
  width: 16px;
  height: 16px;
}

.tip__main {
  flex: 1 1 auto;
  min-width: 0;
}

.tip__title {
  margin-bottom: 2px;
  font-weight: 600;
  color: var(--tip-title);
}

.tip__close {
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 1.6em;
  padding: 0;
  border: 0;
  background: transparent;
  color: currentColor;
  opacity: 0.55;
  cursor: pointer;
  transition: opacity 0.15s;
}

.tip__close:hover {
  opacity: 1;
}

.tip__close svg {
  width: 14px;
  height: 14px;
}

.tip--tip,
.tip--success {
  --tip-accent: #4ade80;
  --tip-bg: rgba(74, 222, 128, 0.1);
  --tip-border: rgba(74, 222, 128, 0.28);
  --tip-title: #86efac;
}

.tip--warning {
  --tip-accent: #fbbf24;
  --tip-bg: rgba(251, 191, 36, 0.1);
  --tip-border: rgba(251, 191, 36, 0.28);
  --tip-title: #fcd34d;
}

.tip--error {
  --tip-accent: #f87171;
  --tip-bg: rgba(248, 113, 113, 0.1);
  --tip-border: rgba(248, 113, 113, 0.28);
  --tip-title: #fca5a5;
}

.tip-fade-enter-active,
.tip-fade-leave-active {
  transition: opacity 0.2s ease;
}

.tip-fade-enter-from,
.tip-fade-leave-to {
  opacity: 0;
}
</style>