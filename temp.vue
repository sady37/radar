<template>
	<div class="radar-toolbar">
	  <!-- 对象模板区 -->
	  <div class="template-area">
		<div class="template-buttons">
		  <button 
			v-for="obj in objectTypes" 
			:key="obj.type"
			:class="['template-btn', obj.type.toLowerCase(), { active: selectedType === obj.type }]"
			@click="selectObjectType(obj.type)"
		  >
			<template v-if="obj.type === 'Radar'">
			  <div class="radar-icon">
				<div class="radar-circle"></div>
				<div class="direction-point"></div>
			  </div>
			</template>
			<template v-else-if="obj.type === 'M'">
			  <div class="m-icon">M</div>
			</template>
			<template v-else>
			  {{ obj.label }}
			</template>
		  </button>
		</div>
		
		<div class="action-buttons">
		  <button 
			class="action-btn set-btn" 
			@click="createObject"
			:disabled="!selectedType"
		  >
			Set
		  </button>
		  <button 
			class="action-btn delete-btn"
			:disabled="!hasSelectedObject"
			@click="deleteObject"
		  >
			Delete
		  </button>
		</div>
	  </div>
   
	  <!-- 对象属性区 -->
	  <div class="property-area">
		<div class="header-row">
		  <label class="lock-toggle">
			<input 
			  type="checkbox" 
			  v-model="isLocked"
			  :disabled="!hasSelectedObject"
			>
			Lock
		  </label>
		  <span class="type-label">{{ selectedType }}</span>
		</div>
   
		<div class="name-row">
		  <input 
			type="text" 
			v-model="objectName"
			placeholder="Name"
			class="name-input"
		  >
		</div>
   
		<div class="size-row">
		  <div class="input-group">
			<span>L:</span>
			<input 
			  type="number" 
			  v-model="properties.length"
			  @input="e => properties.length = validateLength(Number((e.target as HTMLInputElement).value))"
			>
		  </div>
		  <div class="input-group">
			<span>W:</span>
			<input 
			  type="number" 
			  v-model="properties.width"
			  @input="e => properties.width = validateWidth(Number((e.target as HTMLInputElement).value))"
			>
		  </div>
		</div>
   
		<div class="specific-props" v-if="selectedType === 'Radar'">
		  <div class="mode-select">
			<label>
			  <input 
				type="radio" 
				v-model="properties.mode" 
				value="ceiling"
			  >
			  Ceiling default H280cm
			</label>
			<label>
			  <input 
				type="radio" 
				v-model="properties.mode" 
				value="wall"
			  >
			  Wall default H150cm
			</label>
		  </div>
		  <div class="height-input">
			<div class="input-group">
			  <span>H:</span>
			  <input 
				type="number" 
				v-model="properties.height"
				@input="e => properties.height = validateHeight(Number((e.target as HTMLInputElement).value))"
			  >
			  <span class="accuracy">150~330,Acc10</span>
			</div>
		  </div>
		  <div class="toggle-item">
			<label>
			  <input type="checkbox" v-model="properties.showBoundary">
			  Show Boundary
			</label>
		  </div>
		  <div class="toggle-item">
			<label>
			  <input type="checkbox" v-model="properties.showSignal">
			  Show Signal
			</label>
		  </div>
		</div>
   
		<div class="specific-props" v-if="selectedType === 'Bed'">
		  <div class="toggle-item">
			<label>
			  <input type="checkbox" v-model="properties.isMonitored">
			  Monitor Mode
			</label>
		  </div>
		</div>
   
		<div class="specific-props" v-if="selectedType === 'Other'">
		  <div class="toggle-item">
			<label>
			  <input type="checkbox" v-model="properties.borderOnly">
			  Border Only
			</label>
		  </div>
		</div>
	  </div>
   
	  <!-- 控制区 -->
	  <div class="control-area">
		<div class="coordinates">
		  <div class="coord-item">
			<span>X:</span>
			<input type="number" v-model="position.x" readonly>
		  </div>
		  <div class="coord-item">
			<span>Y:</span>
			<input type="number" v-model="position.y" readonly>
		  </div>
		</div>
   
		<div class="direction-control">
		  <button class="dir-btn up" @click="move('up')" :disabled="isLocked">↑</button>
		  <div class="middle-row">
			<button class="dir-btn left" @click="move('left')" :disabled="isLocked">←</button>
			<button class="dir-btn right" @click="move('right')" :disabled="isLocked">→</button>
		  </div>
		  <button class="dir-btn down" @click="move('down')" :disabled="isLocked">↓</button>
		</div>
   
		<div class="rotation-control">
		  <button class="rot-btn" @click="rotate(-90)" :disabled="isLocked">-90°</button>
		  <button class="rot-btn" @click="rotate(-15)" :disabled="isLocked">-15°</button>
		  <button class="rot-btn" @click="rotate(15)" :disabled="isLocked">+15°</button>
		  <button class="rot-btn" @click="rotate(90)" :disabled="isLocked">+90°</button>
		</div>
	  </div>
	</div>
   </template>
  

  <script setup lang="ts">
  import { ref, reactive } from 'vue'
  
  interface Properties {
   length: number;
   width: number;
   height: number;
   mode: 'ceiling' | 'wall';
   isMonitored: boolean;
   showBoundary: boolean;
   showSignal: boolean;
   borderOnly: boolean;
  }
  
  const objectTypes = [
   { type: 'Door', label: 'Door', defaultLength: 90, defaultWidth: 30 },
   { type: 'Bed', label: 'Bed', defaultLength: 190, defaultWidth: 90 },
   { type: 'Exclude', label: 'Exclude', defaultLength: 100, defaultWidth: 50 },
   { type: 'Other', label: 'Other', defaultLength: 50, defaultWidth: 50 },
   { type: 'Radar', label: '', defaultLength: 20, defaultWidth: 20 },
   { type: 'M', label: 'M', defaultLength: 30, defaultWidth: 30 }
  ]
  
  const selectedType = ref('')
  const objectName = ref('')
  const position = reactive({ x: 0, y: 0 })
  const rotation = ref(0)
  const isLocked = ref(false)
  const hasSelectedObject = ref(false)
  
  const properties = reactive<Properties>({
   length: 100,
   width: 100,
   height: 200,
   mode: 'ceiling',
   isMonitored: false,
   showBoundary: false,
   showSignal: false,
   borderOnly: false
  })
  
  const validateLength = (value: number): number => {
   return Math.min(700, Math.max(0, Math.round(value / 10) * 10))
  }
  
  const validateWidth = (value: number): number => {
   return Math.min(700, Math.max(0, Math.round(value / 10) * 10))
  }
  
  const validateHeight = (value: number): number => {
   return Math.min(330, Math.max(150, Math.round(value / 10) * 10))
  }
  
  const selectObjectType = (type: string) => {
   selectedType.value = type
   const objType = objectTypes.find(t => t.type === type)
   if (objType) {
	 properties.length = objType.defaultLength
	 properties.width = objType.defaultWidth
	 
	 if (type === 'Radar') {
	   properties.height = properties.mode === 'ceiling' ? 280 : 150
	 }
   }
  }
  
  const createObject = () => {
   console.log('Create object:', {
	 type: selectedType.value,
	 name: objectName.value,
	 properties: { ...properties }
   })
  }
  
  const deleteObject = () => {
   if (!hasSelectedObject.value) return
   console.log('Delete current object')
  }
  
  const move = (direction: 'up' | 'down' | 'left' | 'right') => {
   if (isLocked.value) return
   const step = 10
   switch (direction) {
	 case 'up': position.y -= step; break
	 case 'down': position.y += step; break
	 case 'left': position.x -= step; break
	 case 'right': position.x += step; break
   }
  }
  
  const rotate = (angle: number) => {
   if (isLocked.value) return
   rotation.value = (rotation.value + angle) % 360
  }
  </script>


