<template>
	<div class="app-container"></div>
	  <div class="radar-system">
		<div class="canvas-container">
		  <RadarCanvas />
		</div>
		<div class="spacer" @click="toggleToolbar">
		  <span class="toggle-icon">{{ isToolbarOpen ? '》' : '《' }}</span>
		</div>
		<div class="toolbar-container" :class="{ 'toolbar-closed': !isToolbarOpen }">
		  <RadarToolbar />
		</div>
	  </div>
	</div>
  </template>
  


<script setup lang="ts">
import { ref } from 'vue'
import RadarCanvas from './components/RadarCanvas.vue'
import RadarToolbar from './components/RadarToolbar.vue'


const isToolbarOpen = ref(true)

const toggleToolbar = () => {
  isToolbarOpen.value = !isToolbarOpen.value
}
</script>

 
  <style lang="scss">
  .app-container {
	padding: 5px;
	background-color: #f0f0f0;
  }
  
  .radar-system {
	display: flex;
	height: 520px;
	border-radius: 2px;
	overflow: hidden;
  }
  
  .canvas-container {
	width: 620px;
	height: 520px;
	border: 1px solid #ccc;
	background-color: white;
  }
  
  .spacer {
	width: 10px;
	height: 520px;
	background-color: #e0e0e0;
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: center;
	border-top: 1px solid #ccc;
	border-bottom: 1px solid #ccc;
  
	&:hover {
	  background-color: #d0d0d0;
	}
  
	.toggle-icon {
	  color: #666;
	  user-select: none;
	}
  }
  
  .toolbar-container {
	width: 170px;
	height: 520px;
	background-color: #f8f8f8;
	transition: width 0.3s ease;
	border: 1px solid #ccc;
	border-left: none;
  
	&.toolbar-closed {
	  width: 0;
	  overflow: hidden;
	}
  }
  
  * {
	box-sizing: border-box;
	margin: 0;
	padding: 0;
  }
  </style>

<userStyle>Normal</userStyle>