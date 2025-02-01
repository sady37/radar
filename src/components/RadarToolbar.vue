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
        <button
          class="action-btn create-btn"
          @click="createObject"
          :disabled="editMode !== 'template'"
        >
          Create
        </button>
        <button
          class="action-btn set-btn"
          @click="updateObject"
          :disabled="editMode !== 'object'"
        >
          Set
        </button>
        <button
          class="action-btn delete-btn"
          @click="deleteObject"
          :disabled="editMode !== 'object'"
        >
          Delete
        </button>
      </div>
    </div>

    <!-- 对象属性区 -->
    <div class="property-area">
      <div class="name-row">
        <input
          type="text"
          v-model="objectName"
          placeholder="Name"
          class="name-input"
        />
      </div>

      <div
        class="size-row"
        v-if="['Door', 'Bed', 'Exclude', 'Other','Wall', 'TV'].includes(selectedType)"
      >
        <div class="input-group">
          <span>L:</span>
          <input
            type="number"
            v-model="properties.length"
            @change="validateLengthInput"
          />
        </div>
        <div class="input-group">
          <span>W:</span>
          <input
            type="number"
            v-model="properties.width"
            @change="validateWidthInput"
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
              @change="validateHeightInput"
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
              <span>Re:</span>
              <input
                type="number"
                v-model="currentModeConfig.boundary.rearV"
                :min="properties.mode === 'wall' ? 0 : 10"
                :max="properties.mode === 'wall' ? 0 : 200"
                step="10"
                @change="validateBoundary"
                @blur="validateBoundary"
              />
            </div>
          </div>
        </div>

        <!-- 开关选项 -->
        <div class="toggle-item">
          <label>
            <input type="checkbox" v-model="properties.showBoundary" />
            Show Boundary
          </label>
        </div>
        <div class="toggle-item">
          <label>
            <input type="checkbox" v-model="properties.showSignal" />
            Show Signal
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
import type { ObjectProperties, Point } from "../stores/types";


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
const position = reactive({ x: 0, y: 0 });
const rotation = ref(0);
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

const validateLengthInput = () => {
  properties.length = validateLength(properties.length);
};
const validateWidthInput = () => {
  properties.width = validateWidth(properties.width);
};
const validateHeightInput = () => {
  const currentMode = properties.mode;
  const value = currentModeConfig.value.height.default;
  currentModeConfig.value.height.default = validateHeight(value);

};

const validateLength = (value: number): number => {
  return Math.min(700, Math.max(10, Math.round(value / 10) * 10));
};

const validateWidth = (value: number): number => {
  return Math.min(700, Math.max(10, Math.round(value / 10) * 10));
};

const validateHeight = (value: number): number => {
  const currentMode = properties.mode;
  const heightLimits = currentModeConfig.value.height;
  return Math.min(heightLimits.max,
    Math.max(heightLimits.min, Math.round(value / heightLimits.step) * heightLimits.step));
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
       properties.name = obj.name;
       properties.position = obj.position;
       properties.rotation = obj.rotation;
       properties.isLocked = obj.isLocked;

       // 同步固定物体属性
       properties.length = obj.length;
       properties.width = obj.width;

       // 同步雷达特有属性
       if (obj.mode) {  // 如果是雷达对象
         properties.mode = obj.mode;
         properties[obj.mode] = obj[obj.mode];
         properties.HFOV = obj.HFOV || 140;
         properties.VFOV = obj.VFOV || 120;
         properties.showBoundary = obj.showBoundary || false;
         properties.showSignal = obj.showSignal || false;
       }

       // 同步其他特有属性
       properties.isMonitored = obj.isMonitored || false;
       properties.borderOnly = obj.borderOnly || false;
     }
   } else {
     editMode.value = null;
   }
 }
);



// 5. 函数定义 (确保每个函数只定义一次)

const selectObjectType = (typeName: string) => {
  editMode.value = "template";
  selectedType.value = typeName;
  const objType = objectTypes.find((t) => t.typeName === typeName);
  if (objType) {
    properties.length = objType.defaultLength;
    properties.width = objType.defaultWidth;

    if (typeName === "Radar") {
      currentModeConfig.value.height.default = 
        properties.mode === "ceiling" ? properties.ceiling.height.default : properties.wall.height.default;
    }
  }
};

const handleSetButton = () => {
  const objectData: Omit<ObjectProperties, "id"> = {
    typeValue: objectTypes.find(t => t.typeName === selectedType.value)?.typeValue || 0,
    typeName: selectedType.value,
    name: objectName.value || selectedType.value,
    position: {
      x: objectsStore.selectedId ? properties.position.x : 0,
      y: objectsStore.selectedId ? properties.position.y : 0,
    },
    length: properties.length,
    width: properties.width,
    rotation: properties.rotation,
    isLocked: properties.isLocked,
    mode: properties.mode,
    ceiling: properties.ceiling,   // 直接使用具体的模式数据
    wall: properties.wall,         // 直接使用具体的模式数据
    showBoundary: properties.showBoundary,
    showSignal: properties.showSignal,
    isMonitored: properties.isMonitored,
    borderOnly: properties.borderOnly,
  };

  if (objectsStore.selectedId) {
    objectsStore.updateObject(objectsStore.selectedId, objectData);
  } else {
    const id = objectsStore.createObject(objectData);
    objectsStore.selectObject(null);
  }
  selectedType.value = "";
  //console.log("After update/create:", objectsStore.objects);
};

const createObject = () => {
  const selectedObj = objectTypes.find((t) => t.typeName === selectedType.value);
  const objectData: Omit<ObjectProperties, "id"> = {
      typeValue: selectedObj?.typeValue || 0,  // 从 objectTypes 中获取对应的 typeValue
	  typeName: selectedType.value,
	  name: objectName.value || selectedType.value,
	  position: {
		  x: objectsStore.objects.length * 20,
		  y: canvasStore.height / 2 + objectsStore.objects.length * 20,
	  },
	  length: properties.length,
	  width: properties.width,
	  rotation: 0,
	  isLocked: false,
	  mode: properties.mode,
	  ceiling: properties.ceiling, // 直接使用具体的模式数据
	  wall: properties.wall, // 直接使用具体的模式数据
	  showBoundary: properties.showBoundary,
	  showSignal: properties.showSignal,
	  isMonitored: properties.isMonitored,
	  borderOnly: properties.borderOnly,
  };

  const id = objectsStore.createObject(objectData);
  selectedType.value = "";  // 清空选择的模板
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
  if (objectsStore.selectedId) {
    const obj = objectsStore.objects.find((o:ObjectProperties) => o.id === objectsStore.selectedId);
    if (obj) {
      if (obj.typeName === "Radar") {
        return { x: obj.position.x, y: obj.position.y };
      } else {
		// 计算矩形右上角坐标
        const halfLength = obj.length / 2;
        const halfWidth = obj.width / 2;
        return {
          x: obj.position.x + halfLength,
          y: obj.position.y - halfWidth,
        };
      }
    }
  }
  return mouseStore.position;
});
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
    }
  }

  .property-area {
    background: #f9f9f9;
    padding: 12px 10px; // 增加内边距
    border-radius: 4px;
    margin-top: 1px; // 增加与template区的间距
    margin-bottom: 140px; // 减少底部空间150

    // 增加各部分间距
    > div {
      margin-bottom: 15px; // 增加各部分之间的间距
    }

    .name-row {
      margin-bottom: 8px;

      .name-input {
        width: 100%;
        padding: 4px;
        font-size: 12px;
        border: 1px solid #ccc;
        border-radius: 2px;
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
        gap: 20px; // 两个选项之间的间距
        margin-bottom: 15px;

        label {
          display: flex;
          align-items: center;
          gap: 6px; // radio与文字的间距
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
              margin-left: 8px;
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
              width: 45px;
              padding: 2px 4px;
              text-align: right;
              font-size: 12px;
              border: 1px solid #ccc;
              border-radius: 2px;
            }
          }
        }
      }

      .toggle-item {
        margin-bottom: 6px;

        label {
          display: flex;
          align-items: center;
          gap: 4px;
          cursor: pointer;
        }
      }
    }
  }

  .control-area {
    position: absolute;
    bottom: 10px; // 缩短10px
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
