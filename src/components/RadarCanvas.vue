# src/components/RadarCanvas.vue
<template>
  <div class="radar-canvas">
    <div class="zoom-controls">
      <button @click="adjustZoom(-0.1)">-</button>
      <span>{{ Math.round(scale * 100) }}%</span>
      <button @click="adjustZoom(0.1)">+</button>
    </div>
    <canvas
      ref="canvasRef"
      :width="canvasStore.width"
      :height="canvasStore.height"
      @wheel="handleWheel"
      @mousemove="handleMouseMove"
      @mousedown="handleMouseDown"
      @mouseup="handleMouseUp"
      @mouseleave="handleMouseUp"
      @click="handleCanvasClick"
    ></canvas>
  </div>
</template>

<script setup lang="ts">
// 1. 导入
import { ref, onMounted, onUnmounted, watch, reactive } from "vue";
//import { useRadarStore } from '../stores/radar'
//import type { RadarObject, ObjectProperties, BoundarySettings, Point } from '../stores/types'  // 添加 Point

import type { ObjectProperties, PostureIconConfig ,Point } from "../stores/types";
import { useObjectsStore } from "../stores/objects";
import { useMouseStore } from "../stores/mouse";
import { useCanvasStore } from "../stores/canvas";
import { useRadarDataStore } from "../stores/radarData"; // 添加
import { drawRadarBoundary, drawRadarSymbol } from "../utils/drawRadar";
import { drawPosture } from "../utils/drawPosture";
import { VITAL_SIGN_CONFIGS,getHeartRateStatus,getBreathingStatus, getSleepStatus} from '../utils/postureIcons';
//import { drawTrajectory } from '../utils/trajectoryUtils';
import { generateRadarReport,toCanvasCoordinate  } from "../utils/radarUtils";



// 2. 组件状态定义
const canvasRef = ref<HTMLCanvasElement | null>(null);
const scale = ref(1.0);
const isDragging = ref(false);
const showScale = ref(true);
const showGrid = ref(true);

const mousePosition = reactive({ x: 0, y: 0 });
const dragStartPos = reactive({ x: 0, y: 0 });

// Store初始化
const objectsStore = useObjectsStore();
const mouseStore = useMouseStore();
const canvasStore = useCanvasStore();
const radarDataStore = useRadarDataStore();


// 3. 生命周期钩子
onMounted(() => {
  const canvas = canvasRef.value;
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  drawCoordinateSystem(ctx);
});

// 4. 监听器
watch(
  [
    scale,
    () => objectsStore.objects,
    () => canvasStore.showGrid,
    () => canvasStore.showScale,
  ],
  () => {
    const ctx = canvasRef.value?.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvasStore.width, canvasStore.height);
    drawCoordinateSystem(ctx);
    drawObjects(ctx);
  },
  { deep: true }
);

watch(
  () => objectsStore.selectedId,
  () => {
    const ctx = canvasRef.value?.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvasStore.width, canvasStore.height);
    drawCoordinateSystem(ctx);
    drawObjects(ctx);
  }
);

watch([showScale, showGrid], () => {
  const ctx = canvasRef.value?.getContext("2d");
  if (ctx) {
    drawCoordinateSystem(ctx);
    drawObjects(ctx);
  }
});

// 监听人员数据变化
watch(
  () => radarDataStore.currentPersons,
  () => {
    const ctx = canvasRef.value?.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, canvasStore.width, canvasStore.height);
      drawCoordinateSystem(ctx);
      drawObjects(ctx);
    }
  },
  { deep: true }
);

// 5. 方法定义
// 5.1 缩放相关
const adjustZoom = (delta: number) => {
  const newScale = scale.value + delta;
  if (newScale >= 0.5 && newScale <= 1.5) {
    scale.value = newScale;
    redrawCanvas();
  }
};

// 封装重绘方法
const redrawCanvas = () => {
  const ctx = canvasRef.value?.getContext("2d");
  if (!ctx) return;

  ctx.clearRect(0, 0, canvasStore.width, canvasStore.height);
  drawCoordinateSystem(ctx);
  drawObjects(ctx);
};

const handleWheel = (e: WheelEvent) => {
  e.preventDefault();
  const delta = e.deltaY < 0 ? 0.1 : -0.1;
  adjustZoom(delta);
};

// 5.2 鼠标事件处理
const handleMouseMove = (event: MouseEvent) => {
  if (isDragging.value) {
    handleDrag(event);
  } else {
    updateMousePosition(event);
  }
};

const updateMousePosition = (event: MouseEvent) => {
  const rect = canvasRef.value?.getBoundingClientRect();
  if (!rect) return;

  const canvasX = event.clientX - rect.left;
  const canvasY = event.clientY - rect.top;

  // 考虑缩放比例，转换为逻辑坐标
  const logicalX = Math.round((canvasX - canvasStore.width / 2) / scale.value);
  const logicalY = Math.round(canvasY / scale.value);

  mouseStore.updatePosition(logicalX, logicalY);
};

const handleDrag = (event: MouseEvent) => {
  const rect = canvasRef.value?.getBoundingClientRect();
  if (!rect) return;

  const obj = objectsStore.objects.find(
    (o) => o.id === objectsStore.selectedId
  );
  if (!obj || obj.isLocked) return;

  // 获取鼠标在画布内的物理像素位置
  const canvasX = event.clientX - rect.left;
  const canvasY = event.clientY - rect.top;

  // 考虑缩放比例，转换为逻辑坐标
  const logicalX = Math.round((canvasX - canvasStore.width / 2) / scale.value);
  const logicalY = Math.round(canvasY / scale.value);

  objectsStore.updateObject(obj.id, {
    ...obj,
    position: { x: logicalX, y: logicalY },
  });
};

const handleMouseDown = (event: MouseEvent) => {
  if (!objectsStore.selectedId) return;
  const obj = objectsStore.objects.find(
    (o) => o.id === objectsStore.selectedId
  );
  if (!obj || obj.isLocked) return;

  //isDragging.value = true
  // Start a timer to delay the drag mode
  const delay = 200; // Adjust the delay as needed (in milliseconds)
  let timer: number | undefined;
  timer = window.setTimeout(() => {
    isDragging.value = true;
    timer = undefined;
  }, delay);

  // Cancel the timer if the mouse is released before the delay
  const cancelDrag = () => {
    if (timer) {
      window.clearTimeout(timer);
      timer = undefined;
    }
  };
  window.addEventListener("mouseup", cancelDrag, { once: true });

  const rect = canvasRef.value?.getBoundingClientRect();
  if (!rect) return;

  dragStartPos.x = event.clientX - rect.left;
  dragStartPos.y = event.clientY - rect.top;
};

const handleMouseUp = () => {
  isDragging.value = false;
};

// 5.3 对象选择相关
// 添加点击处理函数
const handleCanvasClick = (event: MouseEvent) => {
  const rect = canvasRef.value?.getBoundingClientRect();
  if (!rect) return;

  // 步骤1：获取鼠标在画布内的物理像素位置
  const canvasX = event.clientX - rect.left;
  const canvasY = event.clientY - rect.top;

  // 步骤2: 考虑缩放比例，转换为逻辑坐标
  const logicalX = Math.round((canvasX - canvasStore.width / 2) / scale.value);
  const logicalY = Math.round(canvasY / scale.value);
  //console.log("logicalX:", logicalX);
  //console.log("logicalY:", logicalY);

  // 步骤3：检测碰撞
  const clickedObject = objectsStore.getOrderedObjects.reverse().find((obj) => {
    // 计算点击位置相对于对象中心的偏移
    const dx = logicalX - obj.position.x;
    const dy = logicalY - obj.position.y;

    // 区分不同类型对象的检测范围
    if (obj.typeName === "Radar") {
      return Math.sqrt(dx * dx + dy * dy) <= 15;
    } else if (obj.typeName === "Wall") {
	 // Wall 使用较大的检测范围
	 const halfLength = obj.length / 2 + 25;  // 增加到25
	 const halfWidth = obj.width / 2 + 25;    // 增加到25
	 return Math.abs(dx) <= halfLength && Math.abs(dy) <= halfWidth;
	}	else {
	      const halfLength = obj.length / 2 + 5;
	      const halfWidth = obj.width / 2 + 5;
	      return Math.abs(dx) <= halfLength && Math.abs(dy) <= halfWidth;
	    }
	  });

  objectsStore.selectObject(clickedObject?.id || null);
};

// 添加选择检测函数
const isPointInObject = (
  x: number,
  y: number,
  obj: ObjectProperties
): boolean => {
  const dx = x - obj.position.x;
  const dy = y - obj.position.y;

  // Radar和borderOnly的Other不参与碰撞检测
  if (
    obj.typeName === "Radar" ||
    (obj.typeName === "Other" && obj.borderOnly)
  ) {
    return false;
  }

  const halfLength = obj.length / 2;
  const halfWidth = obj.width / 2;
  return Math.abs(dx) <= halfLength && Math.abs(dy) <= halfWidth;
};

// 5.4 绘制相关
const drawCoordinateSystem = (ctx: CanvasRenderingContext2D) => {
  // 底色和原点
  ctx.fillStyle = "rgb(255, 248, 220)";
  ctx.fillRect(0, 0, canvasStore.width, canvasStore.height);

  const originX = canvasStore.width / 2; // 原点X坐标（画布中心）
  const originY = 0; // 原点Y坐标（画布顶部）

  // 绘制网格
  if (canvasStore.showGrid) {
    const gridLogicSize = 50; // 网格的逻辑间隔，固定为 50 逻辑单位
    ctx.strokeStyle = "rgb(221, 221, 221)";
    ctx.lineWidth = 0.5;
    // X 轴网格
    // 右侧网格线（包含原点）
    for (let logicX = 0; ; logicX += gridLogicSize) {
      const pixelX = originX + logicX * scale.value;
      if (pixelX > canvasStore.width) break;
      ctx.beginPath();
      ctx.moveTo(pixelX, 0);
      ctx.lineTo(pixelX, canvasStore.height);
      ctx.stroke();
    }
    // 左侧网格线（不重复绘制原点）
    for (let logicX = gridLogicSize; ; logicX += gridLogicSize) {
      const pixelX = originX - logicX * scale.value;
      if (pixelX < 0) break;
      ctx.beginPath();
      ctx.moveTo(pixelX, 0);
      ctx.lineTo(pixelX, canvasStore.height);
      ctx.stroke();
    }

    // Y 轴网格（从顶部向下，包含原点）
    for (let logicY = 0; ; logicY += gridLogicSize) {
      const pixelY = originY + logicY * scale.value;
      if (pixelY > canvasStore.height) break;
      ctx.beginPath();
      ctx.moveTo(0, pixelY);
      ctx.lineTo(canvasStore.width, pixelY);
      ctx.stroke();
    }
  }

  // 刻度标注
  if (canvasStore.showScale) {
    ctx.font = "12px Arial";
    ctx.fillStyle = "rgb(0, 0, 0)";

    const tickLogicInterval = 100; // 刻度逻辑间隔

    // X轴刻度，保持左负右正
    for (let logicX = 0; ; logicX += tickLogicInterval) {
      const pixelXRight = originX + logicX * scale.value;
      if (pixelXRight > canvasStore.width) break;
      if (logicX !== 0) {
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText(`+${logicX}`, pixelXRight, 5);
        ctx.textBaseline = "bottom";
        ctx.fillText(`+${logicX}`, pixelXRight, canvasStore.height - 5);
      }

      const pixelXLeft = originX - logicX * scale.value;
      if (pixelXLeft >= 0) {
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText(`-${logicX}`, pixelXLeft, 5);
        ctx.textBaseline = "bottom";
        ctx.fillText(`-${logicX}`, pixelXLeft, canvasStore.height - 5);
      }
    }

    // Y轴刻度，上负(-)下正(+)从0开始向上递增
    for (let logicY = 0; ; logicY += tickLogicInterval) {
      const pixelY = originY + logicY * scale.value;
      if (pixelY > canvasStore.height) break;
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillText(`${logicY}`, 20, pixelY);

      ctx.textAlign = "left";
      ctx.fillText(`${logicY}`, canvasStore.width - 20, pixelY);
    }

    // 原点标记
    ctx.beginPath();
    ctx.arc(originX, originY, 3, 0, Math.PI * 2);
    ctx.fillStyle = "rgb(24, 144, 255)";
    ctx.fill();
  }
};

const drawObject = (ctx: CanvasRenderingContext2D, obj: ObjectProperties) => {
  //	console.log('Drawing object:', obj.id, 'Selected:', objectsStore.selectedId) // 添加调试日志
  ctx.save();
  // 现有的位置和旋转变换保持不变...
  ctx.translate(
    canvasStore.width / 2 + obj.position.x * scale.value,
    obj.position.y * scale.value
  );
  ctx.rotate((-obj.rotation * Math.PI) / 180);
  const halfLength = (obj.length * scale.value) / 2;
  const halfWidth = (obj.width * scale.value) / 2;

  //先绘制对象本身
  // 现有的对象绘制代码保持不变...
  switch (obj.typeName) {
    case "Door":
      ctx.beginPath();
      ctx.rect(
        -halfLength,
		-halfWidth,
        obj.length * scale.value,
        obj.width * scale.value
      );
      ctx.fillStyle = "rgb(160, 237, 160)";
      ctx.fill();
      ctx.strokeStyle = "rgb(102, 102, 102)";
      ctx.stroke();
      // 添加名称标签
      ctx.fillStyle = "rgb(0, 0, 0)";
      ctx.font = `${12 * scale.value}px Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(obj.name, 0, 0); // 在对象中心绘制名称
      break;

    case "Bed":
      ctx.beginPath();
      ctx.rect(
        -halfLength,
        -halfWidth,
        obj.length * scale.value,
        obj.width * scale.value
      );
      ctx.fillStyle = obj.isMonitored ? "rgb(240, 230, 140)" : "rgb(245, 245, 220)";  //RGB: (245, 245, 220)  HEX: #F5F5DC old"rgb(173, 216, 230)
      ctx.fill();
      ctx.strokeStyle = "rgb(102, 102, 102)";
      ctx.stroke();
      ctx.fillStyle = "rgb(0, 0, 0)";
      ctx.font = `${12 * scale.value}px Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(obj.name, 0,(obj.width/2-5) ); // 在对象
	  break;
	 
    case "Exclude":
      ctx.beginPath();
      ctx.rect(
        -halfLength,
        -halfWidth,
        obj.length * scale.value,
        obj.width * scale.value
      );
      ctx.fillStyle = "rgb(239, 255, 162)"; //#EFFFA2 rgb(239, 255, 162)
      ctx.fill();
      ctx.strokeStyle = "rgb(102, 102, 102)";
      ctx.stroke();
      break;

    case "Other":
      ctx.beginPath();
      ctx.rect(
        -halfLength,
        -halfWidth,
        obj.length * scale.value,
        obj.width * scale.value
      );
      if (!obj.borderOnly) {
        ctx.fillStyle = "rgb(211, 211, 211)";
        ctx.fill();
      }
      ctx.strokeStyle = "rgb(102, 102, 102)";
      ctx.stroke();
	  ctx.fillStyle = "rgb(0, 0, 0)";
      ctx.font = `${12 * scale.value}px Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(obj.name, 0,0) ; 
      break;

    case "Wall":
      ctx.beginPath();
      ctx.rect(
        -halfLength,
        -halfWidth,
        obj.length * scale.value,
        obj.width * scale.value
      );
      ctx.fillStyle = "rgb(120, 120, 120)"; // 灰黑色
      ctx.fill();
      ctx.strokeStyle = "rgb(102, 102, 102)";
      ctx.stroke();
      break;

    case "TV":
      // 与 Exclude 使用相同的绘制逻辑
      ctx.beginPath();
      ctx.rect(
        -halfLength,
        -halfWidth,
        obj.length * scale.value,
        obj.width * scale.value
      );
      ctx.fillStyle = "rgb(239, 255, 162)";
      ctx.fill();
      ctx.strokeStyle = "rgb(102, 102, 102)";
      ctx.stroke();
      ctx.fillStyle = "rgb(0, 0, 0)";
      ctx.font = `${12 * scale.value}px Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(obj.name, 0, 0); // 在对象中心绘制名称  
      break;

    case "Radar":
      // 直接传整个对象
      drawRadarSymbol(ctx, obj, scale.value);

      // 如果需要显示边界
      if (obj.showBoundary) {
        drawRadarBoundary(ctx, obj, scale.value);
      }
      break;

    case "Moving":
      // 绘制三角形
      const size = 10 * scale.value;
      ctx.beginPath();
      ctx.moveTo(0, -size);
      ctx.lineTo(-size, size);
      ctx.lineTo(size, size);
      ctx.closePath();
      ctx.fillStyle = "rgb(24, 144, 255)";
      ctx.fill();
      break;
  }

  // 后绘制选中高亮
  if (obj.id === objectsStore.selectedId) {
    ctx.strokeStyle = "rgb(24, 144, 255)";
    ctx.lineWidth = 2;
    if (obj.typeName === "Radar") {
      ctx.beginPath();
      ctx.arc(0, 0, 12 * scale.value, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      const halfLength = ((obj.length + 4) * scale.value) / 2;
      const halfWidth = ((obj.width + 4) * scale.value) / 2;
      ctx.strokeRect(
        -halfLength,
        -halfWidth,
        (obj.length + 4) * scale.value,
        (obj.width + 4) * scale.value
      );
    }
  }

  ctx.restore();
};


const drawStatusPanel = (ctx: CanvasRenderingContext2D) => {
  const vital = radarDataStore.currentVital;
  if (!vital) return;
  
  ctx.save();
  // 透明背景
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.strokeStyle = 'rgba(204, 204, 204, 0.2)';
  ctx.fillRect(10, 10, 200, 80);

  // 统一图标加载函数
  const drawIconAndText = (
    iconConfig: PostureIconConfig, 
    x: number, 
    y: number, 
    value: string
  ) => {
    const icon = new Image();
    icon.src = iconConfig.iconPath;
    icon.onload = () => {
      ctx.drawImage(icon, x, y, iconConfig.size, iconConfig.size);
      // 在图标加载完成后绘制文字
      ctx.font = '14px Arial';
      ctx.fillStyle = '#333';
      ctx.textAlign = 'left';
      ctx.fillText(value, x + iconConfig.size + 5, y + iconConfig.size/2 + 5);
    };
  };

  // 心率
  const heartStatus = getHeartRateStatus(vital?.heartRate);
  drawIconAndText(
    VITAL_SIGN_CONFIGS.heart[heartStatus], 
    20, 15,
    vital?.heartRate ? `${vital.heartRate} ` : '--'
  );

  // 呼吸
  const breathingStatus = getBreathingStatus(vital?.breathing);
  drawIconAndText(
    VITAL_SIGN_CONFIGS.breathing[breathingStatus], 
    20, 45,
    vital?.breathing ? `${vital.breathing}  ` : '--'
  );

  // 睡眠状态
  const sleepStatus = getSleepStatus(vital?.sleepState);
  drawIconAndText(
    VITAL_SIGN_CONFIGS.sleep[sleepStatus], 
    20, 75,
    vital?.sleepState ? sleepStatus.toUpperCase() : '--'
  );
  ctx.restore();
};


const drawPersons = (ctx: CanvasRenderingContext2D) => {
  const persons = radarDataStore.currentPersons;


 // 绘制人员姿态图标
  persons.forEach((person) => {
    if (person.id === 88) return; // 跳过无人标记

	//const canvasX = canvasStore.width / 2 + person.position.x * scale.value;
    //const canvasY = person.position.y * scale.value;
    
  const radar = objectsStore.objects.find((obj) => obj.typeName === "Radar");
  const canvasPos = radar ? toCanvasCoordinate(  { h: person.position.x, v: person.position.y },  radar) : { x: 0, y: 0 };

    /*暂不做绘制轨迹
		// 如果需要绘制轨迹，先绘制轨迹
	    if (needDrawTrajectory(person)) {
	      drawTrajectory(ctx, person, scale.value);
	    }
        */
    
    // 绘制人物
    drawPosture(
      ctx,
      {
        position: {
    		x: canvasPos.x * scale.value + canvasStore.width / 2,
    		y: canvasPos.y * scale.value  },
        rotation: 0, // 或者其他旋转值
        posture: person.posture,
        selected: `person_${person.id}` === objectsStore.selectedId, // 转换为字符串比较
      },
      scale.value
    );
  });

  // 绘制生理指标面板
  if (persons.length > 0) {
   drawStatusPanel(ctx);
 }
}

const drawObjects = (ctx: CanvasRenderingContext2D) => {
  // 非雷达对象
  objectsStore.objects
    .filter((obj) => obj.typeName !== "Radar")
    .forEach((obj) => drawObject(ctx, obj));



  // 雷达对象第二绘制
  objectsStore.objects
    .filter((obj) => obj.typeName === "Radar")
    .forEach((obj) => drawObject(ctx, obj));

  // 在所有对象绘制完成后，输出雷达报告
  // 在所有对象绘制完成后，输出雷达报告
  const radar = objectsStore.objects.find((obj) => obj.typeName === "Radar");
 /* 
  if (radar) {
    const report = generateRadarReport(radar, objectsStore.objects);
    if (report) {
      // report 可能为 null
      console.log("Radar Report:", {
        // 雷达基本信息
        id: report.id,
        typeValue: report.typeValue,
        typeName: report.typeName,
        name: report.name,
        mode: report.mode,
        // 当前模式配置
        config: {
          height: report.config.height,
          boundary: report.config.boundary,
        },
        // 边界顶点
        boundary: report.boundaryVertices,
        // boundary内物体
        objectsCount: report.objects.length,
        objects: report.objects.map((obj) => ({
          id: obj.id,
          type: obj.typeValue,
          name: obj.name,
          Vertices: obj.radarVertices?.map(
            (v) => `(h:${Math.round(v.h)}, v:${Math.round(v.v)})`
          ),
        })),
      });
    }
  }
  */

    // 最后绘制人员
	drawPersons(ctx);

};
</script>

<style lang="scss" scoped>
.radar-canvas {
  position: relative;
  width: 620px;
  height: 520px;

  canvas {
    border: 1px solid #ccc;
  }

  .zoom-controls {
    position: absolute;
    left: 10px;
    bottom: 10px;
    background: rgba(255, 255, 255, 0.8);
    padding: 5px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    gap: 5px;

    button {
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid #ccc;
      border-radius: 4px;
      background: white;
      cursor: pointer;

      &:hover {
        background: #f0f0f0;
      }
    }

    span {
      min-width: 45px;
      text-align: center;
    }
  }
}
</style>

<!-- <userStyle>Normal</userStyle> -->
