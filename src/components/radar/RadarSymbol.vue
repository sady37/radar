# components/radar/RadarSymbol.vue
<template>
  <g :transform="`translate(${position.x}, ${position.y}) rotate(${rotation})`">
    <!-- 雷达主体 -->
    <circle r="15" :fill="colors.outer" :stroke="colors.outerStroke" stroke-width="0.5"/>
    <circle r="10" :fill="colors.middle" :stroke="colors.middleStroke" stroke-width="0.5"/>
    <circle r="5" :fill="colors.inner" :stroke="colors.innerStroke" stroke-width="0.5"/>
    
    <!-- 十字线 -->
    <line x1="-15" y1="0" x2="15" y2="0" stroke="#718096" stroke-width="0.2"/>
    <line x1="0" y1="-15" x2="0" y2="15" stroke="#718096" stroke-width="0.2"/>
    
    <!-- LED指示器 - 位置根据模式变化 -->
    <g :transform="`translate(0, ${mode === 'ceiling' ? 17 : -17})`">
      <rect 
        x="-15" 
        y="-3" 
        width="30" 
        height="6" 
        fill="#48bb78" 
        stroke="#2f855a" 
        stroke-width="0.5"
      />
      <text 
        x="0" 
        :y="mode === 'ceiling' ? 15 : -8"
        font-size="14" 
        fill="#1a202c" 
        text-anchor="middle" 
        font-weight="bold"
      >
        {{ mode === 'ceiling' ? 'C' : 'W' }}
      </text>
    </g>
  </g>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Point } from '../../stores/types'

interface Props {
  mode: 'ceiling' | 'wall'
  position: Point
  rotation: number
  selected?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  selected: false
})

// 颜色配置
const colors = computed(() => ({
  outer: '#bee3f8',
  outerStroke: '#90cdf4',
  middle: '#63b3ed',
  middleStroke: '#4299e1',
  inner: '#3182ce',
  innerStroke: '#2b6cb0'
}))
</script>
