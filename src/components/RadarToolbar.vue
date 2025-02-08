# src/components/RadarToolbar.vue
###########////1 完整的template部分
<template>
	<div class="radar-toolbar">
	  <!-- 对象模板区 -->
	  <div class="template-area">
		<div class="template-buttons">
		  <button
			v-for="obj in objectTypes"
			:key="obj.typeName"
			:class="[
			  'template-btn',
			  obj.typeName.toLowerCase(),
			  { active: selectedType === obj.typeName },
			]"
			@click="selectObjectType(obj.typeName)"
			:title="obj.typeName"
			:aria-label="obj.typeName"
		  >
			<template v-if="obj.typeName === 'Radar'">
			  <div class="radar-icon" aria-hidden="true">
				<div class="radar-circle"></div>
				<div class="direction-point"></div>
			  </div>
			  <span class="visually-hidden">Radar</span>
			</template>
			<template v-else-if="obj.typeName === 'Moving'">
			  <div class="m-icon">Moving</div>
			</template>
			<template v-else>
			  {{ obj.label }}   
			</template>
		  </button>
		</div>
  
		<div class="action-buttons">
		  <button class="action-btn create-btn" @click="createObject" :disabled="editMode !== 'template'">Create</button>
		  <button class="action-btn delete-btn" @click="deleteObject" :disabled="editMode !== 'object'">Delete</button>
		  <button class="action-btn test-btn" :class="{ 'active': isTesting }" @click="toggleTest">Test</button>
		  <button class="layout-btn saveRoom-btn" @click="saveRoom">saveRm</button>
		  <button class="layout-btn loadRoom-btn" type="button" @click="loadRoom($event)">loadRm</button>
		</div>
	  </div>
  
	  <!-- 对象属性区 -->
	  <div class="property-area">
		<div class="name-row">
		  <span>Name</span>
		  <input type="text" v-model="objectName" placeholder="Name" class="name-input" />
		</div>
  
		<div
		  class="size-row"
		  v-if="['Door', 'Bed', 'Exclude', 'Other', 'Wall', 'TV'].includes(selectedType)"
		>
		  <div class="input-group">
			<span>L:</span>
			<input
			  type="number"
			  v-model.number="properties.length"
			  min="10"
			  max="700"
			  step="10"
			  @change="validateLength"
			  @blur="validateLength"
			  aria-label="Length"
			/>
		  </div>
		  <div class="input-group">
			<span>W:</span>
			<input
			  type="number"
			  v-model.number="properties.width"
			  min="10"
			  max="700"
			  step="10"
			  @change="validateWidth"
			  @blur="validateWidth"
			  aria-label="Width"
			/>
		  </div>
		</div>
  
		<div class="specific-props" v-if="selectedType === 'Radar'">
		  <div class="mode-select">
			<label>
			  <input type="radio" v-model="properties.mode" value="ceiling" />
			  Ceiling
			</label>
			<label>
			  <input type="radio" v-model="properties.mode" value="wall" />
			  Wall
			</label>
		  </div>
  
		  <div class="height-input">
			<div class="input-group">
			  <span>H:</span>
			  <input
				type="number"
				v-model.number="currentModeConfig.height.default"
				min="0"
				max="330"
				step="10"
				@change="validateHeight"
				@blur="validateHeight"
				aria-label="Height"
			  />
			  <span class="accuracy">150~330cm</span>
			</div>
		  </div>
  
		  <div class="boundary-settings">
			<div class="boundary-row">
			  <div class="input-group">
				<span>Le:</span>
				<input
				  type="number"
				  v-model="currentModeConfig.boundary.leftH"
				  min="0"
				  max="300"
				  step="10"
				  @change="validateBoundary"
				  @blur="validateBoundary"
				  aria-label="Left boundary"
				/>
			  </div>
			  <div class="input-group">
				<span>Ri:</span>
				<input
				  type="number"
				  v-model="currentModeConfig.boundary.rightH"
				  min="0"
				  max="300"
				  step="10"
				  @change="validateBoundary"
				  @blur="validateBoundary"
				  aria-label="Right boundary"
				/>
			  </div>
			</div>
			<div class="boundary-row">
			  <div class="input-group">
				<span>Fr:</span>
				<input
				  type="number"
				  v-model="currentModeConfig.boundary.frontV"
				  :min="properties.mode === 'wall' ? 0 : 0"
				  :max="properties.mode === 'wall' ? 400 : 200"
				  step="10"
				  @change="validateBoundary"
				  @blur="validateBoundary"
				  aria-label="Front boundary"
				/>
			  </div>
			  <div class="input-group">
				<span>Ba:</span>
				<input
				  type="number"
				  v-model="currentModeConfig.boundary.rearV"
				  :min="properties.mode === 'wall' ? 0 : 0"
				  :max="properties.mode === 'wall' ? 0 : 200"
				  step="10"
				  @change="validateBoundary"
				  @blur="validateBoundary"
				  aria-label="Rear boundary"
				/>
			  </div>
			</div>
		  </div>
  
		  <div class="show-controls">
			<label>
			  <span>Show:</span>
			  <input type="checkbox" v-model="properties.showBoundary" aria-label="Show boundary">
			  <span>Boundary</span>
			  <input type="checkbox" v-model="properties.showSignal" aria-label="Show signal">
			  <span>Signal</span>
			</label>
		  </div>
		</div>
  
		<div class="specific-props" v-if="selectedType === 'Bed'">
		  <div class="toggle-item">
			<label>
			  <input type="checkbox" v-model="properties.isMonitored" />
			  Monitor Mode
			</label>
		  </div>
		</div>
  
		<div class="specific-props" v-if="selectedType === 'Other'">
		  <div class="toggle-item">
			<label>
			  <input type="checkbox" v-model="properties.borderOnly" />
			  Border Only
			</label>
		  </div>
		</div>
	  </div>
  
	  <!-- 控制区 -->
	  <div class="control-area">
		<div class="coordinates">
		  <div class="coord-item">
			<span aria-hidden="true">X:</span>
			<span class="coord-value" aria-label="X coordinate">{{ displayPosition.x }}</span>
		  </div>
		  <div class="coord-item">
			<span aria-hidden="true">Y:</span>
			<span class="coord-value" aria-label="Y coordinate">{{ displayPosition.y }}</span>
		  </div>
		</div>
  
		<div class="direction-control">
		  <div class="left-controls">
			<div>
			  <label class="control-item" title="Lock">
				<input type="checkbox" v-model="isLocked" />
				🔒
			  </label>
			</div>
			<div>
			  <label class="control-item" title="Scale">
				<input type="checkbox" v-model="canvasStore.showScale" />
				📏
			  </label>
			</div>
			<div>
			  <label class="control-item" title="Grid">
				<input type="checkbox" v-model="canvasStore.showGrid" />
				#️⃣
			  </label>
			</div>
		  </div>
		  <div class="right-controls">
			<button class="dir-btn up" @click="move('up')" :disabled="isLocked">↑</button>
			<div class="middle-row">
			  <button class="dir-btn left" @click="move('left')" :disabled="isLocked">←</button>
			  <button class="dir-btn right" @click="move('right')" :disabled="isLocked">→</button>
			</div>
			<button class="dir-btn down" @click="move('down')" :disabled="isLocked">↓</button>
		  </div>
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
  


  ###########//2 script部分代码
<script setup lang="ts">
// 1. 导入
import { ref, reactive, watch, computed, onMounted } from "vue";
import { useObjectsStore } from "../stores/objects";
import { useMouseStore } from "../stores/mouse";
import { useCanvasStore } from "../stores/canvas";
import type { ObjectProperties, RoomLayout } from "../stores/types";
import { useRadarDataStore } from '../stores/radarData';



// 2. store 初始化
const objectsStore = useObjectsStore();
const mouseStore = useMouseStore();
const canvasStore = useCanvasStore();

// mock test  
const radarDataStore = useRadarDataStore();
const isTesting = ref(false);


//触发测试
const toggleTest = () => {
  isTesting.value = !isTesting.value;
  if (isTesting.value) {
	//radarDataStore.initAlarms(); // 添加这行 - 先初始化警报
    radarDataStore.startDataStream();
  } else {
    radarDataStore.stopDataStream();
  }
};





// 3. 接口定义

// 4. 状态定义

const objectTypes = [
  {typeValue:2,typeName: "Bed", label: "Bed", defaultLength: 190, defaultWidth: 140 }, //twin:190*90,full:190*140, queen:200*150, 
  {typeValue:3,typeName: "Exclude", label: "Exclude", defaultLength: 50, defaultWidth: 50 },
  {typeValue:4,typeName: "Door", label: "Door", defaultLength: 90, defaultWidth: 30 },
  {typeValue:1,typeName: "Other", label: "Other", defaultLength: 50, defaultWidth: 50 },
  {typeValue:1,typeName: "Wall", label: "Wall", defaultLength: 200, defaultWidth: 5 },   
  {typeValue:3,typeName: "TV", label: "TV", defaultLength: 100, defaultWidth: 20 },        
  {typeValue:20,typeName: "Radar", label: "", defaultLength: 20, defaultWidth: 20 },
  {typeValue:10, typeName: "Moving", label: "Moving", defaultLength: 43, defaultWidth: 43 },
];

const selectedType = ref("");
const objectName = ref("");
const isLocked = ref(false);
const hasSelectedObject = ref(false);
// 状态控制
const editMode = ref<"template" | "object" | null>(null);

const properties = reactive<ObjectProperties>({
 // 基础属性
 typeValue: 0,    // 初始值会在选择模板时设置
 typeName: "",    // 初始值会在选择模板时设置
 id: "",
 name: "",
 position: { x: 0, y: 250 },
 isLocked: false,

 // 雷达特有属性
 HFOV: 140,        // 水平视场角
 VFOV: 120,        // 垂直视场角
 rotation: 0,
 mode: "ceiling" as "ceiling" | "wall",  // 类型断言
 // 按模式分组的属性
 ceiling: {
   height: {
     min: 150,
     max: 330,
     default: 280,
     step: 10
   },
   boundary: {
     leftH: 300,
     rightH: 300,
     frontV: 200,
     rearV: 200
   }
 },
 wall: {
   height: {
     min: 150,
     max: 330,
     default: 150,
     step: 10
   },
   boundary: {
     leftH: 300,
     rightH: 300,
     frontV: 400,
     rearV: 0
   }
 },
 showBoundary: false,
 showSignal: false,

 // 其他对象特有属性
 length: 50,
 width: 50,
 isMonitored: false,
 borderOnly: false
});

const currentModeConfig = computed(() => 
  properties[properties.mode as "ceiling" | "wall"]
);


// 修改 validateLength 和 validateWidth
const validateLength = () => {
  const validatedLength = Math.min(700, Math.max(10, Math.round(properties.length / 10) * 10));
  if (objectsStore.selectedId) {
    objectsStore.updateObject(objectsStore.selectedId, {
      ...objectsStore.selectedObject,
      length: validatedLength
    });
  }
};

const validateWidth = () => {
  const validatedWidth = Math.min(700, Math.max(10, Math.round(properties.width / 10) * 10));
  if (objectsStore.selectedId) {
    objectsStore.updateObject(objectsStore.selectedId, {
      ...objectsStore.selectedObject,
      width: validatedWidth
    });
  }
};

const validateHeight = () => {
  const currentMode = properties.mode || 'ceiling';
  const heightConfig = currentMode === 'ceiling' ? 
    properties.ceiling.height : 
    properties.wall.height;

  heightConfig.default = Math.min(
    heightConfig.max,
    Math.max(
      heightConfig.min,
      Math.round(heightConfig.default / heightConfig.step) * 10
    )
  );
};

const validateBoundary = () => {
  const currentMode = properties.mode;
  const boundary = currentModeConfig.value.boundary;
  
  boundary.leftH = Math.min(300, Math.max(0, Math.round(boundary.leftH / 10) * 10));
  boundary.rightH = Math.min(300, Math.max(0, Math.round(boundary.rightH / 10) * 10));
  
  if (currentMode === "wall") {
    boundary.frontV = Math.min(400, Math.max(0, Math.round(boundary.frontV / 10) * 10));
    boundary.rearV = 0;  // wall模式rear固定为0
  } else {
    boundary.frontV = Math.min(200, Math.max(0, Math.round(boundary.frontV / 10) * 10));
    boundary.rearV = Math.min(200, Math.max(0, Math.round(boundary.rearV / 10) * 10));
  }
};

//4. 监听 canvasStore 的 selectedId 变化，同步到 UI
watch(
 () => objectsStore.selectedId,
 (newId) => {
   if (newId) {
     editMode.value = "object";
     selectedType.value = "";
     const obj = objectsStore.objects.find((o: ObjectProperties) => o.id === newId);
     if (obj) {
       hasSelectedObject.value = true;
       selectedType.value = obj.typeName;
	   objectName.value = obj.name;
       properties.name = obj.name;
       properties.position = obj.position;
       properties.rotation = obj.rotation;
       properties.isLocked = obj.isLocked;
	   isLocked.value = obj.isLocked; // 根据选中对象的isLocked属性设置isLocked.value

       // 同步固定物体属性
       properties.length = obj.length;
       properties.width = obj.width;

        // 如果是雷达，同步雷达特有属性
        if (obj.typeName === 'Radar') {
          properties.mode = obj.mode;
          properties.HFOV = obj.HFOV;
          properties.VFOV = obj.VFOV;
          properties.ceiling = obj.ceiling;
          properties.wall = obj.wall;
          properties.showBoundary = obj.showBoundary;
          properties.showSignal = obj.showSignal;
        }

       // 同步其他特有属性
       properties.isMonitored = obj.isMonitored || false;
       properties.borderOnly = obj.borderOnly || false;
     }
   }else {
      // 由 Canvas 点击空白处触发的取消选中，在这里处理 UI 重置
      editMode.value =  null; //"template";
      selectedType.value = "";
      objectName.value = "";
      isLocked.value = false;
    }
  }
);


// 监听Name、isLocked、mode、borderOnly、isMonitored,showBoundary,showSignal的变化，同步到选中对象的属性
watch(
  [
    objectName,
    () => isLocked.value,
    () => properties.mode,
    () => properties.borderOnly,
    () => properties.isMonitored,
    () => properties.showBoundary,
    () => properties.showSignal
  ],
  ([newName, newIsLocked, newMode, newBorderOnly, newIsMonitored, newShowBoundary, newShowSignal]) => {
    if (objectsStore.selectedId) {
      const obj = objectsStore.objects.find((o) => o.id === objectsStore.selectedId);
      if (obj) {
        const updates: Partial<ObjectProperties> = {};

        // 处理 name 变化
        if (newName !== undefined) {
          updates.name = newName;
        }

        // 处理 isLocked 变化
        if (newIsLocked !== undefined) {
          updates.isLocked = newIsLocked;
        }

        // 处理 mode 变化
        if (newMode !== undefined && obj.typeName === 'Radar') {
          updates.mode = newMode;
        }

        // 处理 borderOnly 变化
        if (newBorderOnly !== undefined) {
          updates.borderOnly = newBorderOnly;
        }

        // 处理 isMonitored 变化
        if (newIsMonitored !== undefined) {
          updates.isMonitored = newIsMonitored;
        }

        // 处理 showBoundary 变化
        if (newShowBoundary !== undefined && obj.typeName === 'Radar') {
          updates.showBoundary = newShowBoundary;
        }

        // 处理 showSignal 变化
        if (newShowSignal !== undefined && obj.typeName === 'Radar') {
          updates.showSignal = newShowSignal;
        }

        // 有更新则调用 updateObject
        if (Object.keys(updates).length > 0) {
          objectsStore.updateObject(objectsStore.selectedId, {
            ...obj,
            ...updates
          });
        }
      }
    }
  }
);






// 5. 函数定义 (确保每个函数只定义一次)
//选取模板时，取消活动对象，重置属情、objectName和isLocked的UI
const selectObjectType = (typeName: string) => {
  editMode.value = "template";
  objectsStore.selectObject(null); // 点击模板时，取消画布区的选中,避免同时编辑活动对象
  selectedType.value = typeName;
  objectName.value = typeName;  //  设置默认名称为模板类型
  isLocked.value =false;
  const objType = objectTypes.find((t) => t.typeName === typeName);
  if (objType) {
    properties.length = objType.defaultLength;
    properties.width = objType.defaultWidth;
    properties.rotation = 0;
    properties.isLocked = false;
	properties.isMonitored = false;
    properties.borderOnly = false;

    if (typeName === "Radar") {
     /*	  	
	  currentModeConfig.value.height.default = 
        properties.mode === "ceiling" ? properties.ceiling.height.default : properties.wall.height.default;
	  currentModeConfig.value.boundary.leftH=
	    properties.mode === "ceiling" ? properties.ceiling.boundary.leftH : properties.wall.boundary.leftH;
	  currentModeConfig.value.boundary.rightH=
	    properties.mode === "ceiling" ? properties.ceiling.boundary.rightH : properties.wall.boundary.rightH;
	  currentModeConfig.value.boundary.frontV=
	    properties.mode === "ceiling" ? properties.ceiling.boundary.frontV : properties.wall.boundary.frontV;
	  currentModeConfig.value.boundary.rearV=
	    properties.mode === "ceiling" ? properties.ceiling.boundary.rearV : properties.wall.boundary.rearV;	
	*/
	  properties.mode = "ceiling";
      properties.ceiling = {
        height: { min: 150, max: 330, default: 280, step: 10 },
        boundary: { leftH: 300, rightH: 300, frontV: 200, rearV: 200 },
      };
      properties.wall = {
        height: { min: 150, max: 330, default: 150, step: 10 },
        boundary: { leftH: 300, rightH: 300, frontV: 400, rearV: 0 },
      };
      properties.showBoundary = false;
      properties.showSignal = false;
	
    }
  }
};


const createObject = () => {
  const selectedObj = objectTypes.find((t) => t.typeName === selectedType.value);
  const objectData: Omit<ObjectProperties, "id"> = {
      typeValue: selectedObj?.typeValue || 0,  // 从 objectTypes 中获取对应的 typeValue
	  typeName: selectedType.value,
	  name: objectName.value ,
	  position: {
		  x: objectsStore.objects.length * 20,
		  y: canvasStore.height / 2 + objectsStore.objects.length * 20,
	  },
	  length: properties.length,
	  width: properties.width,
	  rotation: 0,
	  isLocked: isLocked.value, // 根据UI的选择设置isLocked属性
	  mode: properties.mode,
	  ceiling: properties.ceiling, // 直接使用具体的模式数据
	  wall: properties.wall, // 直接使用具体的模式数据
	  showBoundary: properties.showBoundary,
	  showSignal: properties.showSignal,
	  isMonitored: properties.isMonitored,
	  borderOnly: properties.borderOnly,
  };

  objectsStore.createObject(objectData);
  
    // 重置 toolbar 区的属性值
	  selectedType.value = "";
	  objectName.value = "";
	  properties.length = 50;
	  properties.width = 50;
	  properties.rotation = 0;
	  properties.isLocked = false;
	  isLocked.value = false; // UI修改 isLocked.value
	  properties.mode = "ceiling";
	  properties.ceiling = {
	    height: { min: 150, max: 330, default: 280, step: 10 },
	    boundary: { leftH: 300, rightH: 300, frontV: 200, rearV: 200 },
	  };
	  properties.wall = {
	    height: { min: 150, max: 330, default: 150, step: 10 },
	    boundary: { leftH: 300, rightH: 300, frontV: 400, rearV: 0 },
	  };
	  properties.showBoundary = false;
	  properties.showSignal = false;
	  properties.isMonitored = false;
	  properties.borderOnly = false;
	  editMode.value = null;
};

const updateObject = () => {
  if (objectsStore.selectedId) {
    const  objectData: Partial<ObjectProperties> = {
      typeName: selectedType.value,
      name: objectName.value,
      length: properties.length,
      width: properties.width,
      mode: properties.mode,
	  ceiling: properties.ceiling,   // 直接使用具体的模式数据
	  wall: properties.wall,         // 直接使用具体的模式数据
      showBoundary: properties.showBoundary,
      showSignal: properties.showSignal,
      isMonitored: properties.isMonitored,
      borderOnly: properties.borderOnly,
    };
    objectsStore.updateObject(objectsStore.selectedId, objectData);
	objectsStore.selectObject(null);  // 设置完后，取消选中对象
  }
};

const deleteObject = () => {
  if (objectsStore.selectedId) {
    objectsStore.deleteObject(objectsStore.selectedId);
    objectsStore.selectObject(null);
    console.log("Delete current object");
  }
};

const move = (direction: "up" | "down" | "left" | "right") => {
  if (!objectsStore.selectedId) return;

  const obj = objectsStore.objects.find((o: ObjectProperties) => o.id === objectsStore.selectedId);
  if (!obj || obj.isLocked) return;

  let { x, y } = obj.position;
  const step = 10;

  switch (direction) {
    case "up":
      y -= step;
      break;
    case "down":
      y += step;
      break;
    case "left":
      x -= step;
      break;
    case "right":
      x += step;
      break;
  }

  objectsStore.updateObject(obj.id, {
    ...obj,
    position: { x, y },
  });
};

const rotate = (angle: number) => {
  if (!objectsStore.selectedId) return;

  const obj = objectsStore.objects.find((o: ObjectProperties) => o.id === objectsStore.selectedId);
  if (!obj || obj.isLocked) return;

  const newRotation = (obj.rotation + angle + 360) % 360;
  objectsStore.updateObject(obj.id, {
    ...obj,
    rotation: newRotation,
  });
};


const displayPosition = computed(() => {
  const roundToTen = (num: number) => Math.round(num / 10) * 10;

  if (objectsStore.selectedId) {
    const obj = objectsStore.objects.find((o: ObjectProperties) => o.id === objectsStore.selectedId);
    if (obj) {
      // 直接返回取整后的坐标
      return { 
        x: roundToTen(obj.position.x), 
        y: roundToTen(obj.position.y) 
      };
    }
  }
  // 当没有选中对象时，对鼠标坐标也进行取整
  return {
    x: roundToTen(mouseStore.position.x),
    y: roundToTen(mouseStore.position.y)
  };
});

//房间布局及radar导入导出
interface SavedRoom {
  objects: ObjectProperties[];  // 包含所有固定物体（包括雷达）
}

// 保存按钮处理函数
const saveRoom = () => {
 const data = JSON.stringify({ objects: objectsStore.objects ,
	compilerOptions: {
      resolveJsonModule: true,
      esModuleInterop: true
    }
 });
 const blob = new Blob([data], { type: 'application/json' });
 const url = URL.createObjectURL(blob);
 const a = document.createElement('a');
 a.href = url;
 a.download = 'room_layout.json';
 a.click();
 URL.revokeObjectURL(url);
};

// 加载按钮处理函数 
const loadRoom = (event: MouseEvent) => {
 const input = document.createElement('input');
 input.type = 'file';
 input.accept = '.json';
 input.onchange = async (e: Event) => {
   const file = (e.target as HTMLInputElement).files?.[0];
   if (file) {
     const text = await file.text();
     try {
       objectsStore.objects = [];  // 清空现有对象
       const room = JSON.parse(text) as SavedRoom;
       room.objects.forEach(obj => {
         const { id: _, ...objWithoutId } = obj;
		 const newId = `${obj.typeName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
         objectsStore.createObject(objWithoutId);
       });
     } catch(error) {
       console.error('Failed to load room:', error);
     }
   }
 };
 input.click();
};

defineExpose({
  toggleTest
});

</script>


###########//3 样式部分scss

<style lang="scss" scoped>
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.radar-toolbar {
  position: relative;
  padding: 8px;
  height: 100%;

  .template-area {
    .template-buttons {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 4px;
      margin-bottom: 6px;

      .template-btn {
        padding: 6px;
        border: 1px solid #ccc;
        font-size: 12px;
        cursor: pointer;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;

        &.door {
          background: #a0eda0;
        }
        &.bed {
          background: #F5F5DC;  //RGB: (245, 245, 220)
        }
        &.exclude {
          background: #EFFFA2; // rgb(240, 230, 140)
        }
        &.other {
          background: #d3d3d3;
        }

        .radar-icon {
          width: 20px;
          height: 20px;
          position: relative;

          .radar-circle {
            width: 100%;
            height: 100%;
            border-radius: 50%;
            background: linear-gradient(
              to bottom,
              #fff 0%,
              #0cade3 50%,
              #fff 100%
            );
          }

          .direction-point {
            position: absolute;
            bottom: -2px;
            left: 50%;
            transform: translateX(-50%);
            width: 4px;
            height: 4px;
            border-radius: 50%;
            background: #fff;
            box-shadow: 0 0 2px rgba(0, 0, 0, 0.2);
          }
        }

        .m-icon {
          font-weight: bold;
          color: #1890ff;
        }

        &:hover {
          opacity: 0.8;
        }
        &.active {
          border-color: #1890ff;
          opacity: 1;
        }
      }
    }

    .action-buttons {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 4px;

      .action-btn {
        height: 28px;
        border: 1px solid #ccc;
        border-radius: 2px;
        font-size: 12px;
        cursor: pointer;

        &.create-btn {
          background: #1890ff;
          color: white;
          &:hover {
            background: #40a9ff;
          }
        }

        &.delete-btn {
          background: #ff4d4f;
          color: white;
          &:hover {
            background: #ff7875;
          }
        }

        &:disabled {
          background: #ccc;
          cursor: not-allowed;
        }
        &.test-btn {
          background: #e6eff8;
        }
      }

      .layout-btn {
        height: 28px;
        border: 1px solid #ccc;
        border-radius: 2px;
        font-size: 12px;
        cursor: pointer;
        &.saveRoom-btn {
          background: #f9f1f1;
        }
        &.loadRoom-btn {
          background: #f9f1f1;
        }
        &:hover {
          background: #a5cff2;
        }
      }
    }
  }

  .property-area {
    background: #f9f9f9;
    padding-top: 4px;  //  调整上边距 10->4
    border-radius: 4px;
    margin-top: 6px;
    margin-bottom: 110px;  //少了一行24px, 120->110

    > div {
      margin-bottom: 10px;
    }

    .name-row {
      margin-bottom: 1px;
	  margin-top: 2px

      span {
        font-size: 12px;
        color: #666;
      }

      .name-input {
        width: 100px;
        padding: 4px;
        font-size: 12px;
        border: 1px solid #ccc;
        border-radius: 2px;
        margin-right: 6px;
      }

      .test-btn {
        width: 46px;
        height: 23px;
        border: 1px solid #ccc;
        border-radius: 2px;
        font-size: 12px;
        cursor: pointer;
        &:hover {
          background: #b3d7f5;
        }
      }
    }

    .size-row {
      display: flex;
      gap: 10px;
      margin-bottom: 8px;

      .input-group {
        display: flex;
        align-items: center;

        span {
          font-size: 12px;
          margin-right: 4px;
        }

        input {
          width: 50px;
          padding: 2px 4px;
          text-align: right;
          font-size: 12px;
          border: 1px solid #ccc;
          border-radius: 2px;
        }
      }
    }

    .specific-props {
      font-size: 12px;

      .mode-select {
        display: flex;
        gap: 20px;
        margin-bottom: 10px;

        label {
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;

          input[type="radio"] {
            margin: 0;
          }
        }
      }

      .height-input {
        margin-bottom: 8px;

        .input-group {
          display: flex;
          align-items: center;

          span {
            font-size: 12px;
            margin-right: 4px;

            &.accuracy {
              margin-left: 12px;
              color: #666;
              font-size: 11px;
            }
          }

          input {
            width: 50px;
            padding: 2px 4px;
            text-align: right;
            font-size: 12px;
            border: 1px solid #ccc;
            border-radius: 2px;
          }
        }
      }

      .boundary-settings {
        margin: 8px 0;

        .boundary-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;

          span {
            font-size: 12px;
            color: #666;
          }

          .input-group {
            flex: 1;
            input {
              width: 50px;
              padding: 2px 4px;
              text-align: right;
              font-size: 12px;
              border: 1px solid #ccc;
              border-radius: 2px;
            }
          }
        }
      }

      .show-controls {
        display: flex;
        align-items: flex-start;
        margin-top: 8px;
        padding: 4px 0;
        
        label {
          display: flex;
          gap: 6px;
          font-size: 12px;

          input[type="checkbox"] {
            margin: 0;
            cursor: pointer;
          }

          span {
			-webkit-user-select: none;  // Safari 3+
		    -moz-user-select: none;     // Firefox
		    -ms-user-select: none;      // IE 10+
		    user-select: none;          // Standard syntax
            margin-right: 0px;
          }
        }
      }
    }
  }

  .control-area {
    position: absolute;
    bottom: 4px;  // 调整底部边距 2->4
    left: 8px;
    right: 8px;
    background: #f9f9f9;
    padding: 8px;		// 调整上边距 10
    border-top: 1px solid #eee;

    .coordinates {
      display: flex;
      justify-content:  flex-start;
      margin-bottom: 10px;

      .coord-item {
        display: flex;
        align-items: center;
        gap: 4px;
		margin-right: 20px;  /* Add this line to create smaller controlled spacing */
        
		span {
          font-size: 12px;
        }

        input {
          width: 50px;
          text-align: right;
          font-size: 12px;
          border: none;
          background: transparent;
          padding: 2px;

          &:focus {
            outline: none;
          }
        }
      }
    }

    .direction-control {
      display: flex;
      flex-direction: row;
      align-items: center;
      margin-bottom: 10px;
      width: 100%;
      justify-content: space-between;

      .left-controls {
        width: 50px;
      }

      .right-controls {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }

      .middle-row {
        display: flex;
        gap: 20px;
        margin: 4px 0;
      }

      .dir-btn {
        width: 24px;
        height: 24px;
        padding: 0;
        border: 1px solid #ccc;
        background: white;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;

        &:hover {
          background: #f0f0f0;
        }
        &:disabled {
          background: #f5f5f5;
          cursor: not-allowed;
          color: #ccc;
        }
      }
    }

    .rotation-control {
      margin-top: 10px;
      display: flex;
      justify-content: space-between;

      .rot-btn {
        padding: 2px 4px;
        border: 1px solid #ccc;
        background: white;
        cursor: pointer;
        font-size: 11px;

        &:hover {
          background: #f0f0f0;
        }
        &:disabled {
          background: #f5f5f5;
          cursor: not-allowed;
          color: #ccc;
        }
      }
    }
  }
}

input[type="number"] {
  appearance: textfield;
  -moz-appearance: textfield;
  -webkit-appearance: textfield;
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    appearance: none;
    -webkit-appearance: none;
    margin: 0;
  }
}
</style>