<template>
  <img
    src="https://images-sxxyrry.pages.dev/LOGO_Bigger.png"
    alt="Logo"
    :width="width"
    :height="height"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'

/** 基准尺寸：size = 1 时对应 192 x 108 */
const BASE_WIDTH = 192
const BASE_HEIGHT = 108

const props = withDefaults(defineProps<{ size?: number }>(), {
  size: 1
})

const isNumberString = (v: string) => !isNaN(Number(v)) && v.trim() !== ''

let size

if (typeof props.size !== 'number' || isNumberString(String(props.size))) {
  size = Number(props.size)
} else if (typeof props.size === 'number') {
  size = props.size
} else {
  throw new Error(`[LOGO] size 必须是数字或数字字符串，当前值为: ${props.size}`)
}

if (typeof size !== 'number' || size <= 0) {
  throw new Error(`[LOGO] size 必须是正数，当前值为: ${size}`)
}

/** 仅允许 0.25 或任意正整数 */
const isValidSize = (v: number) => v === 0.25 || v === 0.5 || v === 0.75 || (Number.isInteger(v) && v > 0)

if (import.meta.env.DEV && !isValidSize(size)) {
  console.warn(
    `[LOGO] 无效的 size: ${size}。仅支持 0.25, 0.5, 0.75 或任意正整数。`
  )
}

const width = computed(() => BASE_WIDTH * size)
const height = computed(() => BASE_HEIGHT * size)
</script>

<style scoped>
img {
  display: block;
}
</style>