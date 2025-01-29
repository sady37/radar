<template>
	<g :transform="`translate(${position.x}, ${position.y}) rotate(${rotation})`">
	  <!-- SVG图标显示 -->
	  <template v-if="config.type === 'svg' && config.iconPath">
		<image 
		  :href="config.iconPath"
		  :width="config.size" 
		  :height="config.size" 
		  :x="-config.size/2"
		  :y="-config.size/2"
		/>
	  </template>
	  
	  <!-- 默认椭圆形人体（当SVG加载失败或未找到时显示） -->
	  <template v-else>
		<!-- 椭圆主体 -->
		<ellipse 
		  rx="20" 
		  ry="5" 
		  fill="#ADABA1"
		  stroke="#666666"
		  stroke-width="0.5"
		/>
		<!-- 头部标记（红点） -->
		<circle 
		  r="2" 
		  cy="-5"
		  fill="red" 
		/>
	  </template>
  
	  <!-- 状态文本 - 对于默认椭圆或showLabel为true的情况显示 -->
	  <text 
		v-if="config.type === 'default' || config.showLabel"
		x="0" 
		y="-10"
		font-size="8" 
		fill="#1a202c" 
		text-anchor="middle"
		font-weight="bold"
	  >
		{{ POSTURE_LABELS[posture] }}
	  </text>
    
	  <!-- 警告状态指示 -->
	  <circle
      v-if="isWarningState"
      r="25"
      fill="none"
      stroke="#ff4d4f"
      stroke-width="1"
      stroke-dasharray="4,4"
      />

	  <!-- 选中状态显示 -->
	  <circle
		v-if="selected"
		r="25"
		fill="none"
		stroke="#1890ff"
		stroke-width="1"
		stroke-dasharray="4,4"
	  />
	</g>
  </template>
  
  <script setup lang="ts">
  import { computed } from 'vue'
  import type { Point } from '../../stores/types'
  import { POSTURE_CONFIGS, POSTURE_LABELS } from '../../utils/postureIcons'
  import { PersonPosture } from '../../utils/postureIcons' 

  interface Props {
	position: Point
	rotation: number
	posture: number
	selected?: boolean
  }
  
  const props = withDefaults(defineProps<Props>(), {
	selected: false
  })
  
  const config = computed(() => 
	POSTURE_CONFIGS[props.posture] || {
	  type: 'default',
	  size: 43,
	  showLabel: true
	}
  )

  // 根据姿态决定是否显示标签
const showLabel = computed(() => {
  if (config.value.type === 'svg') {
    return config.value.showLabel
  }
  return true
})

// 根据姿态获取颜色
const getPostureColor = computed(() => {
  switch (props.posture) {
    case PersonPosture.FallSuspect:
    case PersonPosture.FallConfirm:
      return '#ff4d4f'  // 红色警告
    case PersonPosture.SitGroundSuspect:
    case PersonPosture.SitUpBedSuspect:
      return '#faad14'  // 黄色警告
    case PersonPosture.Lying:
    case PersonPosture.SitUpBed:
    case PersonPosture.SitUpBedConfirm:
      return '#91caff'  // 浅蓝色（床相关）
    default:
      return '#ADABA1'  // 默认灰色
  }
})

// 头部标记颜色
const getHeadColor = computed(() => {
  return isWarningState.value ? '#ff4d4f' : 'red'
})

// 标签颜色
const getLabelColor = computed(() => {
  return isWarningState.value ? '#ff4d4f' : '#1a202c'
})

// 标签Y轴位置
const getLabelYPosition = computed(() => {
  return isWarningState.value ? -15 : -10
})

// 是否为警告状态
const isWarningState = computed(() => {
  return [
    PersonPosture.FallSuspect,
    PersonPosture.FallConfirm,
    PersonPosture.SitGroundSuspect,
    PersonPosture.SitUpBedSuspect
  ].includes(props.posture)
})

  </script>
  
  <style scoped>
  text {
	user-select: none;
	-webkit-user-select: none;
  }
  </style>