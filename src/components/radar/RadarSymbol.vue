<template>
	<g :transform="`translate(${transformPosition.h}, ${transformPosition.v}) rotate(${rotation})`">
	  <!-- 雷达主体 -->
	  <circle r="15" :fill="colors.outer" :stroke="colors.outerStroke" stroke-width="0.5"/>
	  <circle r="10" :fill="colors.middle" :stroke="colors.middleStroke" stroke-width="0.5"/>
	  <circle r="5" :fill="colors.inner" :stroke="colors.innerStroke" stroke-width="0.5"/>

	  <!-- HV坐标轴 -->
	  <line x1="15" y1="0" x2="-15" y2="0" stroke="#718096" stroke-width="0.2"/> <!-- H轴，左正右负 -->
      <line x1="0" y1="-15" x2="0" y2="15" stroke="#718096" stroke-width="0.2"/> <!-- V轴 -->
    
      <!-- H+/H-标签 -->
      <text x="-16" y="4" font-size="8" text-anchor="end">H+</text>
      <text x="16" y="4" font-size="8" text-anchor="start">H-</text>
    
      <!-- V+/V-标签 (根据模式显示) -->
      <line x1="0" y1="-15" x2="0" y2="15" stroke="#718096" stroke-width="0.2"/>
      <text x="4" y="-16" font-size="6">-V</text>
      <!-- 只显示-V，+V由LED指示器指明方向 -->
	  <!-- text x="4" y="16" font-size="6">+V</text-->


	  <!-- LED指示器,，Wall模式在+V方向 -->
	  <g :transform="`translate(0, ${mode === 'ceiling' ? 17 : -17})`">
		<rect 
		  x="-10" 
		  y="-3" 
		  width="20" 
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
	position: Point      // 接收房间坐标系的位置
	rotation: number
	selected?: boolean
  }
  
  const props = withDefaults(defineProps<Props>(), {
	selected: false
  })
  
  // 转换房间坐标系到雷达坐标系
  const transformPosition = computed(() => {
	const h = -props.position.x  // H轴与X轴相反
	let v = props.position.y     // V轴根据模式处理
	
	if (props.mode === 'wall') {
	  // Wall模式：V只有+值(输入时>0)，且受旋转影响
	  const rotationRad = (props.rotation * Math.PI) / 180
	  v = props.position.y * Math.cos(rotationRad)
	}
	// Ceiling模式：v = y (保持不变)
	
	return { h, v }
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