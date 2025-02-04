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
        >
          <template v-if="obj.typeName === 'Radar'">
            <div class="radar-icon">
              <div class="radar-circle"></div>
              <div class="direction-point"></div>
            </div>
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
  		<!--<button class="action-btn set-btn" @click="updateObject" :disabled="editMode !== 'object'">Set</button> -->
  		<button class="action-btn delete-btn" @click="deleteObject" :disabled="editMode !== 'object'">Delete</button>
		<!-- 新增 layout 按钮行 -->
		<button class="layout-btn" @click="saveRoomLayout">SaveRm</button>
  		<button class="layout-btn" @click="loadRoomLayout">LoadRm</button>
		<button class="layout-btn" @click="saveRadarConfig">SaveRd</button>
		<button class="layout-btn" @click="loadRadarConfig">LoadRd</button> 
	 </div>
    </div>

    <!-- 对象属性区 -->
	<div class="property-area">
	    <div class="name-row">
			<span>Name:</span>
	        <input type="text" v-model="objectName" placeholder="Name" class="name-input"  />
			<!-- <button class="layout-btn" @click="loadRadarConfig">LoadRd</button>  -->
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
	            />
	        </div>
	    </div>

	    <div class="specific-props" v-if="selectedType === 'Radar'">
	        <!-- 模式选择 -->
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

	        <!-- 高度输入 -->
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
	                />
	                <span class="accuracy">150~330cm</span>
	            </div>
	        </div>

	        <!-- 边界设置 -->
	        <div class="boundary-settings">
	            <div class="boundary-row">
	                <div class="input-group">
	                    <span>Le:</span>
	                    <input
	                        type="number"
	                        v-model="currentModeConfig.boundary.leftH"
	                        min="10"
	                        max="300"
	                        step="10"
	                        @change="validateBoundary"
	                        @blur="validateBoundary"
	                    />
	                </div>
	                <div class="input-group">
	                    <span>Ri:</span>
	                    <input
	                        type="number"
	                        v-model="currentModeConfig.boundary.rightH"
	                        min="10"
	                        max="300"
	                        step="10"
	                        @change="validateBoundary"
	                        @blur="validateBoundary"
	                    />
	                </div>
	            </div>
	            <div class="boundary-row">
	                <div class="input-group">
	                    <span>Fr:</span>
	                    <input
	                        type="number"
	                        v-model="currentModeConfig.boundary.frontV"
	                        :min="properties.mode === 'wall' ? 30 : 10"
	                        :max="properties.mode === 'wall' ? 400 : 200"
	                        step="10"
	                        @change="validateBoundary"
	                        @blur="validateBoundary"
	                    />
	                </div>
	                <div class="input-group">
	                    <span>Ba:</span>
	                    <input
	                        type="number"
	                        v-model="currentModeConfig.boundary.rearV"
	                        :min="properties.mode === 'wall' ? 0 : 10"
	                        :max="properties.mode === 'wall' ? 0 : 200"
	                        step="10"
	                        @change="validateBoundary"
	                        @blur="validateBoundary"
	                    />
	                    <!-- 后边界输入 -->
	                </div>
	            </div>
	        </div>

	        <!-- 开关选项 -->
	        <div class="show-controls">
	            <label>
	                <span>Show:</span>
	                <input type="checkbox" v-model="properties.showBoundary">
	                <span>Boundary</span>
	                <input type="checkbox" v-model="properties.showSignal">
	                <span>Signal</span>
	            </label>
	            <!-- 边界显示开关 -->
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
          <span>X:</span>
          <input type="number" v-model="displayPosition.x" readonly />
        </div>
        <div class="coord-item">
          <span>Y:</span>
          <input type="number" v-model="displayPosition.y" readonly />
        </div>
      </div>

      <div class="direction-control">
        <!-- 左列：开关控制 -->
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
        <!-- 右列：方向控制 -->
        <div class="right-controls">
          <button class="dir-btn up" @click="move('up')" :disabled="isLocked">
            ↑
          </button>
          <div class="middle-row">
            <button
              class="dir-btn left"
              @click="move('left')"
              :disabled="isLocked"
            >
              ←
            </button>
            <button
              class="dir-btn right"
              @click="move('right')"
              :disabled="isLocked"
            >
              →
            </button>
          </div>
          <button
            class="dir-btn down"
            @click="move('down')"
            :disabled="isLocked"
          >
            ↓
          </button>
        </div>
      </div>

      <div class="rotation-control">
        <button class="rot-btn" @click="rotate(-90)" :disabled="isLocked">
          -90°
        </button>
        <button class="rot-btn" @click="rotate(-15)" :disabled="isLocked">
          -15°
        </button>
        <button class="rot-btn" @click="rotate(15)" :disabled="isLocked">
          +15°
        </button>
        <button class="rot-btn" @click="rotate(90)" :disabled="isLocked">
          +90°
        </button>
      </div>
    </div>
  </div>
</template>

###########//2 script部分代码
<script setup lang="ts">
// 1. 导入
import { ref, reactive, watch, computed } from "vue";
import { useObjectsStore } from "../stores/objects";
import { useMouseStore } from "../stores/mouse";
import { useCanvasStore } from "../stores/canvas";
import type { ObjectProperties, RoomLayout } from "../stores/types";



// 2. store 初始化
const objectsStore = useObjectsStore();
const mouseStore = useMouseStore();
const canvasStore = useCanvasStore();


// 3. 接口定义

// 4. 状态定义

const objectTypes = [
  {typeValue:2,typeName: "Bed", label: "Bed", defaultLength: 190, defaultWidth: 90 },
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
      Math.round(heightConfig.default / heightConfig.step) * heightConfig.step
    )
  );
};

const validateBoundary = () => {
  const currentMode = properties.mode;
  const boundary = currentModeConfig.value.boundary;
  
  boundary.leftH = Math.min(300, Math.max(10, Math.round(boundary.leftH / 10) * 10));
  boundary.rightH = Math.min(300, Math.max(10, Math.round(boundary.rightH / 10) * 10));
  
  if (currentMode === "wall") {
    boundary.frontV = Math.min(400, Math.max(30, Math.round(boundary.frontV / 10) * 10));
    boundary.rearV = 0;  // wall模式rear固定为0
  } else {
    boundary.frontV = Math.min(200, Math.max(10, Math.round(boundary.frontV / 10) * 10));
    boundary.rearV = Math.min(200, Math.max(10, Math.round(boundary.rearV / 10) * 10));
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

/* 使用watch 单独监听属性变化，同步到选中对象的属性
//监听objectName.value的变化，同步到选中对象的name属性
watch(objectName, (newName) => {
  if (objectsStore.selectedId) {
    objectsStore.updateObject(objectsStore.selectedId, {
      ...objectsStore.selectedObject,
      name: newName
    });
  }
});

//监听isLocked.value的变化，同步到选中对象的isLocked属性
watch(  () => isLocked.value,  (newValue) => {
    if (objectsStore.selectedId) {
      const obj = objectsStore.objects.find((o) => o.id === objectsStore.selectedId);
      if (obj) {
        objectsStore.updateObject(objectsStore.selectedId, {
          ...obj,
          isLocked: newValue,
        });
      }
    }
  },
);



//监听radar model的变化，同步到选中对象的mode属性
watch(
  () => properties.mode,
  (newMode) => {
    if (objectsStore.selectedId) {
      const obj = objectsStore.objects.find((o) => o.id === objectsStore.selectedId);
      if (obj && obj.typeName === 'Radar') {
        objectsStore.updateObject(objectsStore.selectedId, {
          ...obj,
          mode: newMode,
        });
      }
    }
  }
);

watch(
  () => properties.showBoundary,
  (newValue) => {
    if (objectsStore.selectedId) {
      const obj = objectsStore.objects.find((o) => o.id === objectsStore.selectedId);
      if (obj && obj.typeName === 'Radar') {
        objectsStore.updateObject(objectsStore.selectedId, {
          ...obj,
          showBoundary: newValue,
        });
      }
    }
  }
);

watch(
  () => properties.showSignal,
  (newValue) => {
    if (objectsStore.selectedId) {
      const obj = objectsStore.objects.find((o) => o.id === objectsStore.selectedId);
      if (obj && obj.typeName === 'Radar') {
        objectsStore.updateObject(objectsStore.selectedId, {
          ...obj,
          showSignal: newValue,
        });
      }
    }
  }
);


watch(
  () => properties.isMonitored,
  (newValue) => {
    if (objectsStore.selectedId) {
      const obj = objectsStore.objects.find((o) => o.id === objectsStore.selectedId);
      if (obj && obj.typeName === 'Bed') {
        objectsStore.updateObject(objectsStore.selectedId, {
          ...obj,
          isMonitored: newValue,
        });
      }
    }
  }
);


//监听properties.borderOnly的变化，同步到选中对象的borderOnly属性
watch(
  () => properties.borderOnly,
  (newValue) => {
    if (objectsStore.selectedId) {
      const obj = objectsStore.objects.find((o) => o.id === objectsStore.selectedId);
      if (obj && obj.typeName === 'Other') {
        objectsStore.updateObject(objectsStore.selectedId, {
          ...obj,
          borderOnly: newValue,
        });
      }
    }
  }
);
*/

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
// 导出功能
const saveRoomLayout = () => {
  const layout: RoomLayout = {
    objects: objectsStore.objects.filter(obj => obj.typeName !== 'Radar')
  };

  const blob = new Blob([JSON.stringify(layout, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'room_layout.json';
  a.click();
  URL.revokeObjectURL(url);
};

const saveRadarConfig = () => {
  // 获取所有雷达配置
  const radars = objectsStore.objects
    .filter(obj => obj.typeName === 'Radar')
    .map(radar => ({
      typeValue: radar.typeValue,
      typeName: radar.typeName,
      name: radar.name,
      position: radar.position,
      rotation: radar.rotation,
      mode: radar.mode,
      ceiling: radar.ceiling,
      wall: radar.wall,
      isLocked: radar.isLocked
    }));

  if (radars.length > 0) {
    radars.forEach(radar => {
      const blob = new Blob([JSON.stringify(radar, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      // 使用雷达名称作为文件名
      a.download = `${radar.name}_config.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }
};

// 导入功能
const loadRoomLayout = () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = async (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
      const text = await file.text();
      const layout: RoomLayout = JSON.parse(text);
      
      // 保留现有雷达
      const radars = objectsStore.objects.filter(obj => obj.typeName === 'Radar');
      // 清除非雷达对象
      objectsStore.objects = radars;
      // 加载新的固定物体
      layout.objects.forEach(obj => {
        objectsStore.createObject(obj);
      });
    }
  };
  input.click();
};

const loadRadarConfig = () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.multiple = true;  // 允许选择多个文件
  input.accept = '.json';
  input.onchange = async (e: Event) => {
    const files = (e.target as HTMLInputElement).files;
    if (files) {
      for (let i = 0; i < files.length; i++) {
        const text = await files[i].text();
        const radarConfig = JSON.parse(text);
        if (radarConfig.typeName === 'Radar') {
          // 检查是否已存在同名雷达
          const existingRadar = objectsStore.objects.find(
            obj => obj.typeName === 'Radar' && obj.name === radarConfig.name
          );
          if (existingRadar) {
            // 更新现有雷达配置
            objectsStore.updateObject(existingRadar.id, radarConfig);
          } else {
            // 创建新雷达
            objectsStore.createObject(radarConfig);
          }
        }
      }
    }
  };
  input.click();
};


</script>


###########//3 样式部分scss

<style lang="scss" scoped>
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
          background: #add8e6;
        }
        &.exclude {
          background: #f0e68c;
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

		/* 删除set键
        &.set-btn {
          background: #ccc; // 默认灰色
          color: white;

          &:not(:disabled) {
            // 可用状态
            background: #52c41a; // 绿色
            &:hover {
              background: #73d13d;
            }
          }

          &:disabled {
            cursor: not-allowed;
          }
        }
		*/

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

      }

	  .layout-btn {
        height: 28px;
        border: 1px solid #ccc;
        border-radius: 2px;
        font-size: 12px;
        cursor: pointer;
		//background: #d5e7f7;
		&:hover {
		  background: #b3d7f5;
		}
	  }
    }
  }

.property-area {
  background: #f9f9f9; // 设置背景颜色为浅灰色
  //padding: 10px 12px; // 增加内边距，上下10,左右12
  padding-top: 10;  //只设上边距
  border-radius: 4px; // 设置圆角边框，半径为4px
  margin-top: 6px; // 增加与template区的间距，顶部间距为1px
  margin-bottom: 120px; // 减少底部空间，底部间距为120px

  // 增加各部分间距，选择.property-area的直接子元素div
  > div {
    margin-bottom: 10px; // 增加各部分之间的间距为10px
  }

 
  .name-row {
  display: flex;
  gap: 4px;
  align-items: center;
  padding-right: 6px;  // 添加右边距，确保不会贴着边界
  margin-bottom: 8px;

  span {
    font-size: 12px;
    color: #666;
    min-width: 40px;  // 与其他标签宽度保持一致
  }

  .name-input {
    width: 110px;
    height: 24px;  // 与按钮高度保持一致
    padding: 0 6px;
    font-size: 12px;
    border: 1px solid #ccc;
    border-radius: 2px;
    box-sizing: border-box;

    &:focus {
      outline: none;
      border-color: #1890ff;
    }

    &::placeholder {
      color: #ccc;
    }
  }
}

  /*
  .name-row {
    margin-bottom: 8px; // 增加底部间距为8px
	
	span {
          font-size: 12px; // 字体大小为12px
          color: #666; // 文字颜色为灰色
        }

    .name-input {
      width:  100px ;//100%; // 输入框宽度占满父容器
      padding: 4px; // 输入框内边距为4px
      font-size: 12px; // 输入框字体大小为12px
      border: 1px solid #ccc; // 输入框边框为1px的灰色实线
      border-radius: 2px; // 输入框圆角边框，半径为2px
      margin-right: 6px; // 增加右边距为2px
    }

 	 删除set键，layout 上移至action-buttons
		.layout-btn {
		width:49px;
        height: 23px;
		border: 1px solid #ccc;
        border-radius: 2px;
		//margin-right: 2px;
        font-size: 12px;
        cursor: pointer;
		//background: #d5e7f7;
		&:hover {
			background: #b3d7f5;
		}
  	} 
  }
  */

  .size-row {
    display: flex; // 使用flex布局
    gap: 10px; // 子元素之间的间距为10px
    margin-bottom: 8px; // 增加底部间距为8px

    .input-group {
      display: flex; // 使用flex布局
      align-items: center; // 子元素垂直居中对齐

      span {
        font-size: 12px; // 字体大小为12px
        margin-right: 4px; // 右边距为4px
      }

      input {
        width: 50px; // 输入框宽度为50px
        padding: 2px 4px; // 输入框内边距上下2px，左右4px
        text-align: right; // 输入框文本右对齐
        font-size: 12px; // 输入框字体大小为12px
        border: 1px solid #ccc; // 输入框边框为1px的灰色实线
        border-radius: 2px; // 输入框圆角边框，半径为2px
      }
    }
  }

  .specific-props {
    font-size: 12px; // 字体大小为12px

    .mode-select {
      display: flex; // 使用flex布局
      gap: 20px; // 两个选项之间的间距为20px
      margin-bottom: 10px; // 增加底部间距为10px

      label {
        display: flex; // 使用flex布局
        align-items: center; // 子元素垂直居中对齐
        gap: 6px; // radio与文字的间距为6px
        cursor: pointer; // 鼠标悬停时显示为指针样式

        input[type="radio"] {
          margin: 0; // 去除默认外边距
        }
      }
    }

    .height-input {
      margin-bottom: 8px; // 增加底部间距为8px

      .input-group {
        display: flex; // 使用flex布局
        align-items: center; // 子元素垂直居中对齐

        span {
          font-size: 12px; // 字体大小为12px
          margin-right: 4px; // 右边距为4px

          &.accuracy {
            margin-left: 12px; // 左边距为12px
            color: #666; // 文字颜色为灰色
            font-size: 11px; // 字体大小为11px
          }
        }

        input {
          width: 50px; // 输入框宽度为45px
          padding: 2px 4px; // 输入框内边距上下2px，左右4px
          text-align: right; // 输入框文本右对齐
          font-size: 12px; // 输入框字体大小为12px
          border: 1px solid #ccc; // 输入框边框为1px的灰色实线
          border-radius: 2px; // 输入框圆角边框，半径为2px
        }
      }
    }

    .boundary-settings {
      margin: 8px 0; // 上下外边距为8px，左右外边距为0

      .boundary-row {
        display: flex; // 使用flex布局
        align-items: center; // 子元素垂直居中对齐
        gap: 8px; // 子元素之间的间距为8px
        margin-bottom: 6px; // 增加底部间距为6px

        span {
          font-size: 12px; // 字体大小为12px
          color: #666; // 文字颜色为灰色
        }

        .input-group {
          flex: 1; // 弹性伸缩，占满剩余空间
          input {
            width: 50px; // 输入框宽度为45px
            padding: 2px 4px; // 输入框内边距上下2px，左右4px
            text-align: right; // 输入框文本右对齐
            font-size: 12px; // 输入框字体大小为12px
            border: 1px solid #ccc; // 输入框边框为1px的灰色实线
            border-radius: 2px; // 输入框圆角边框，半径为2px
          }
        }
      }
    }

    // 新增的 show-controls 样式
    .show-controls {
      display: flex; // 使用flex布局
      align-items: flex-start; // 左对齐
      margin-top: 8px; // 顶部外边距为8px
      padding: 4px 0; // 上下内边距为4px，左右内边距为0
      
      label {
        display: flex; // 使用flex布局
        //align-items: center;
        gap: 6px; // 子元素之间的间距为6px
        font-size: 12px; // 字体大小为12px

        input[type="checkbox"] {
          margin: 0; // 去除默认外边距
          cursor: pointer; // 鼠标悬停时显示为指针样式
        }

        span {
          user-select: none; // 禁止用户选择文本
		margin-right: 0px   ; // 向左边框移动，只保留0px间距
        }
      }
    }
  }
}

  .control-area {
    position: absolute;
    bottom: 2px; // 缩短10px
    left: 8px;
    right: 8px;
    background: #f9f9f9;
    padding: 10px;
    border-top: 1px solid #eee;

    // 坐标显示
    .coordinates {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;

      .coord-item {
        display: flex;
        align-items: center;
        gap: 4px;

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
      width: 100%; /* 容器宽度，根据需要调整 */
      justify-content: space-between; /* 左右两列水平拉伸，两端对齐 */

      .left-controls {
        width: 50px; /* 调整左列宽度，根据实际内容调整 */
      }

      .right-controls {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }

      .direction-buttons {
        display: flex;
        flex-direction: column; /* 方向键竖向排列 */
        align-items: center; /* 方向键水平居中 */
        justify-content: center; /* 方向键垂直居中 */
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

    // 旋转控制
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
