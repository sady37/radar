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
		:width= "canvasStore.width" 
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
import { ref, onMounted, watch, reactive } from 'vue'
import { useRadarStore } from '../stores/radar'
import { useObjectsStore } from '../stores/objects'
import { useMouseStore } from '../stores/mouse'
import { useCanvasStore } from '../stores/canvas'
import { useRadarDataStore } from '../stores/radarData'  // 添加
import { drawRadarBoundary, drawRadarSymbol } from '../utils/drawRadar'
import type { RadarObject, ObjectProperties, BoundarySettings, Point } from '../stores/types'  // 添加 Point

  
  // 2. 组件状态定义
  const canvasRef = ref<HTMLCanvasElement | null>(null)
  const scale = ref(1.0)
  const isDragging = ref(false)
  const showScale = ref(true)
  const showGrid = ref(true)
  
  const mousePosition = reactive({ x: 0, y: 0 })
  const dragStartPos = reactive({ x: 0, y: 0 })

  //const canvasStore.width = canvasStore.width;
  //const canvasStore.height = canvasStore.height;

  // Store初始化
  const radarStore = useRadarStore()
  const objectsStore = useObjectsStore()
  const mouseStore = useMouseStore()
  const canvasStore = useCanvasStore()
  const radarDataStore = useRadarDataStore() 
  
  // 3. 生命周期钩子
  onMounted(() => {
	const canvas = canvasRef.value
	if (!canvas) return
	
	const ctx = canvas.getContext('2d')
	if (!ctx) return
	
	drawCoordinateSystem(ctx)
  })
  
  // 4. 监听器
  watch([scale, () => objectsStore.objects, () => canvasStore.showGrid, () => canvasStore.showScale], () => {
	const ctx = canvasRef.value?.getContext('2d')
	if (!ctx) return
	
	ctx.clearRect(0, 0, canvasStore.width, canvasStore.height)
	drawCoordinateSystem(ctx)
	drawObjects(ctx)
  }, { deep: true })
  
  watch(() => objectsStore.selectedId, () => {
	const ctx = canvasRef.value?.getContext('2d')
	if (!ctx) return
	
	ctx.clearRect(0, 0, canvasStore.width, canvasStore.height)
	drawCoordinateSystem(ctx)
	drawObjects(ctx)
  })
  
  watch([showScale, showGrid], () => {
	const ctx = canvasRef.value?.getContext('2d')
	if (ctx) {
	  drawCoordinateSystem(ctx)
	  drawObjects(ctx)
	}
  })
  // 监听人员数据变化
  watch(() => radarDataStore.currentPersons, () => {
	  const ctx = canvasRef.value?.getContext('2d')
	  if (ctx) {
	    ctx.clearRect(0, 0, canvasStore.width, canvasStore.height)
	    drawCoordinateSystem(ctx)
	    drawObjects(ctx)
	   }
  }, { deep: true })


  // 5. 方法定义
  // 5.1 缩放相关
  const adjustZoom = (delta: number) => {
	const newScale = scale.value + delta
	if (newScale >= 0.5 && newScale <= 1.5) {
	  scale.value = newScale
	  redrawCanvas()
	}
  }
  
  // 封装重绘方法
  const redrawCanvas = () => {
    const ctx = canvasRef.value?.getContext('2d')
    if (!ctx) return
  
    ctx.clearRect(0, 0, canvasStore.width, canvasStore.height)
    drawCoordinateSystem(ctx)
    drawObjects(ctx)
  }

  const handleWheel = (e: WheelEvent) => {
	e.preventDefault()
	const delta = e.deltaY < 0 ? 0.1 : -0.1
	adjustZoom(delta)
  }
  
  // 5.2 鼠标事件处理
  const handleMouseMove = (event: MouseEvent) => {
	if (isDragging.value) {
	  handleDrag(event)
	} else {
	  updateMousePosition(event)
	}
  }
  
  const updateMousePosition = (event: MouseEvent) => {
	  const rect = canvasRef.value?.getBoundingClientRect()
	  if (!rect) return

	  const canvasX = event.clientX - rect.left;
      const canvasY = event.clientY - rect.top;

      // 考虑缩放比例，转换为逻辑坐标
      const logicalX = Math.round((canvasX-(canvasStore.width/2)) / scale.value);
      const logicalY = Math.round(canvasY / scale.value);

      mouseStore.updatePosition(logicalX, logicalY);
   };


  
  const handleDrag = (event: MouseEvent) => {
	const rect = canvasRef.value?.getBoundingClientRect()
	if (!rect) return
  
	const obj = objectsStore.objects.find(o => o.id === objectsStore.selectedId)
	if (!obj || obj.isLocked) return
	
    // 获取鼠标在画布内的物理像素位置
    const canvasX = event.clientX - rect.left;
    const canvasY = event.clientY - rect.top;

    // 考虑缩放比例，转换为逻辑坐标
    const logicalX = Math.round((canvasX-(canvasStore.width/2)) / scale.value);
    const logicalY = Math.round(canvasY / scale.value);
    
	objectsStore.updateObject(obj.id, {
      ...obj,
	  position: { x: logicalX, y: logicalY  }
    })
  }
  
  const handleMouseDown = (event: MouseEvent) => {
	if (!objectsStore.selectedId) return
	const obj = objectsStore.objects.find(o => o.id === objectsStore.selectedId)
	if (!obj || obj.isLocked) return
  
	isDragging.value = true
	
	const rect = canvasRef.value?.getBoundingClientRect()
	if (!rect) return
	
	dragStartPos.x = event.clientX - rect.left
	dragStartPos.y = event.clientY - rect.top
  }
  
  const handleMouseUp = () => {
	isDragging.value = false
  }
  
  // 5.3 对象选择相关
  // 添加点击处理函数
  const handleCanvasClick = (event: MouseEvent) => {
    const rect = canvasRef.value?.getBoundingClientRect()
    if (!rect) return

	// 步骤1：获取鼠标在画布内的物理像素位置
	const canvasX = event.clientX - rect.left
	const canvasY = event.clientY - rect.top

	// 步骤2: 考虑缩放比例，转换为逻辑坐标
	const logicalX = Math.round((canvasX-(canvasStore.width/2)) / scale.value);
    const logicalY = Math.round(canvasY/ scale.value);
	console.log('logicalX:', logicalX);
    console.log('logicalY:', logicalY);

	// 步骤3：检测碰撞
	const clickedObject = objectsStore.getOrderedObjects.reverse().find(obj => {
	  // 计算点击位置相对于对象中心的偏移
	  const dx = logicalX - obj.position.x;
	  const dy = logicalY - obj.position.y;

	  // 区分不同类型对象的检测范围
	  if (obj.type === 'Radar') {
	    return Math.sqrt(dx * dx + dy * dy) <= 15
	  } else {
		const halfLength = obj.size.length / 2 + 5;
		const halfWidth = obj.size.width / 2 + 5;
	    return Math.abs(dx) <= halfLength && Math.abs(dy) <= halfWidth
	    }
	  })

      objectsStore.selectObject(clickedObject?.id || null)
    }

  // 添加选择检测函数 
  const isPointInObject = (x: number, y: number, obj: RadarObject): boolean => {
    const dx = x - obj.position.x;
    const dy = y - obj.position.y;

    // Radar和borderOnly的Other不参与碰撞检测
    if (
      obj.type === "Radar" ||
      (obj.type === "Other" && obj.properties.borderOnly)
    ) {
      return false;
    }

    const halfLength = obj.size.length / 2;
    const halfWidth = obj.size.width / 2;
    return Math.abs(dx) <= halfLength && Math.abs(dy) <= halfWidth;
  };
  
  // 5.4 绘制相关
  const drawCoordinateSystem = (ctx: CanvasRenderingContext2D) => {
  // 底色和原点
  ctx.fillStyle = "#FFF8DC";
  ctx.fillRect(0, 0, canvasStore.width, canvasStore.height);

  const originX = canvasStore.width / 2;; // 原点X坐标（画布中心）
  const originY = 0; // 原点Y坐标（画布顶部）

  // 绘制网格
  if (canvasStore.showGrid) {
    const gridLogicSize = 50; // 网格的逻辑间隔，固定为 50 逻辑单位
    ctx.strokeStyle = "#ddd";
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
    ctx.fillStyle = "#000";
    
	const tickLogicInterval = 100; // 刻度逻辑间隔
	
    // X轴刻度，保持左负右正
	for (let logicX = 0; ; logicX += tickLogicInterval) {
            const pixelXRight = originX + logicX * scale.value;
            if (pixelXRight > canvasStore.width) break;
            if (logicX!== 0) {
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
    ctx.fillStyle = "#1890ff";
    ctx.fill();
  }


  // 添加点击处理函数 v1.5.1
  const handleCanvasClick = (event: MouseEvent) => {

	const rect = canvasRef.value?.getBoundingClientRect();
    if (!rect) return;

	// 步骤1：获取鼠标在画布内的物理像素位置
	const canvasX = event.clientX - rect.left
    const canvasY = event.clientY - rect.top

	// 步骤2: 考虑缩放比例，转换为逻辑坐标
	const logicalX = Math.round((canvasX-(canvasStore.width/2)) / scale.value);
    const logicalY = Math.round(canvasY / scale.value);
    

    
	// 步骤3：检测碰撞
    // 按绘制顺序反向检查，确保上层对象优先选中
    const clickedObject = objectsStore.getOrderedObjects
      .reverse()
      .find((obj) => {
		const dx = logicalX - obj.position.x;
		const dy = logicalY - obj.position.y;
		//const dx = x - obj.position.x;
        //const dy = y - obj.position.y;


        // 根据对象类型确定选择范围
        if (obj.type === "Radar") {
          // 圆形选择区域
          return Math.sqrt(dx * dx + dy * dy) <= 15; // 15为感应半径
        } else {
          // 矩形选择区域，考虑对象尺寸
          const halfLength = obj.size.length / 2 + 5; // 额外5单位的感应区域
          const halfWidth = obj.size.width / 2 + 5;
          return Math.abs(dx) <= halfLength && Math.abs(dy) <= halfWidth;
        }
      });

    if (clickedObject) {
      objectsStore.selectObject(clickedObject.id);
    } else {
      objectsStore.selectObject(null);
    }
  };

  const drawObject = (ctx: CanvasRenderingContext2D, obj: RadarObject) => {
    //	console.log('Drawing object:', obj.id, 'Selected:', objectsStore.selectedId) // 添加调试日志
    ctx.save();
    // 现有的位置和旋转变换保持不变...
    ctx.translate(
      (canvasStore.width/2) + obj.position.x * scale.value,
      obj.position.y * scale.value,
    );
    ctx.rotate((obj.rotation * Math.PI) / 180);
    const halfLength = (obj.size.length * scale.value) / 2;
    const halfWidth = (obj.size.width * scale.value) / 2;

    //先绘制对象本身
    // 现有的对象绘制代码保持不变...
    switch (obj.type) {
      case "Door":
        ctx.beginPath();
        ctx.rect(
          -halfLength,
          -halfWidth,
          obj.size.length * scale.value,
          obj.size.width * scale.value,
        );
        ctx.fillStyle = "#add8e6";
        ctx.fill();
        ctx.strokeStyle = "#666";
        ctx.stroke();
        break;

      case "Bed":
        ctx.beginPath();
        ctx.rect(
          -halfLength,
          -halfWidth,
          obj.size.length * scale.value,
          obj.size.width * scale.value,
        );
        ctx.fillStyle = obj.properties.isMonitored ? "#f0e68c" : "#98fb98";
        ctx.fill();
        ctx.strokeStyle = "#666";
        ctx.stroke();
        break;

      case "Exclude":
        ctx.beginPath();
        ctx.rect(
          -halfLength,
          -halfWidth,
          obj.size.length * scale.value,
          obj.size.width * scale.value,
        );
        ctx.fillStyle = "#f0e68c";
        ctx.fill();
        ctx.strokeStyle = "#666";
        ctx.stroke();
        break;

      case "Other":
        ctx.beginPath();
        ctx.rect(
          -halfLength,
          -halfWidth,
          obj.size.length * scale.value,
          obj.size.width * scale.value,
        );
        if (!obj.properties.borderOnly) {
          ctx.fillStyle = "#d3d3d3";
          ctx.fill();
        }
        ctx.strokeStyle = "#666";
        ctx.stroke();
        break;

      case "Radar":
        // 调用独立的绘制函数
        drawRadarSymbol(ctx, {
          mode: obj.properties.mode || "ceiling",
          position: obj.position,
          rotation: obj.rotation,
          scale: scale.value,
          selected: obj.id === objectsStore.selectedId,
        });

        // 如果需要显示边界
        if (obj.properties.showBoundary) {
          drawRadarBoundary(
            ctx,
            obj.properties.mode || "ceiling",
            obj.properties.boundary || {
              leftX: 300,
              rightX: 300,
              frontY: obj.properties.mode === "ceiling" ? 200 : 400,
              rearY: obj.properties.mode === "ceiling" ? 200 : 0,
            },
            scale.value,
          );
        }
        break;

      case "M":
        // 绘制三角形
        const size = 10 * scale.value;
        ctx.beginPath();
        ctx.moveTo(0, -size);
        ctx.lineTo(-size, size);
        ctx.lineTo(size, size);
        ctx.closePath();
        ctx.fillStyle = "#1890ff";
        ctx.fill();
        break;
    }

    // 后绘制选中高亮
    if (obj.id === objectsStore.selectedId) {
      ctx.strokeStyle = "#1890ff";
      ctx.lineWidth = 2;
      if (obj.type === "Radar") {
        ctx.beginPath();
        ctx.arc(0, 0, 12 * scale.value, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        const halfLength = ((obj.size.length + 4) * scale.value) / 2;
        const halfWidth = ((obj.size.width + 4) * scale.value) / 2;
        ctx.strokeRect(
          -halfLength,
          -halfWidth,
          (obj.size.length + 4) * scale.value,
          (obj.size.width + 4) * scale.value,
        );
      }
    }

    ctx.restore();
  };

  const drawObjects = (ctx: CanvasRenderingContext2D) => {
    // 非雷达对象
    objectsStore.objects
      .filter((obj) => obj.type !== "Radar")
      .forEach((obj) => drawObject(ctx, obj));

    // 绘制人员
    drawPersons(ctx);

    // 雷达对象最后绘制
    objectsStore.objects
      .filter((obj) => obj.type === "Radar")
      .forEach((obj) => drawObject(ctx, obj));
  };

  const drawPersons = (ctx: CanvasRenderingContext2D) => {
    const persons = radarDataStore.currentPersons;
    persons.forEach((person) => {
      if (person.id === 88) return; // 跳过无人标记

      const position: Point = {
        x: person.position.x,
        y: person.position.y,
      };

      const isWarningState = [2, 5, 7, 10].includes(person.posture);

      drawObject(ctx, {
        id: `person_${person.id}`,
        type: "person",
        name: `Person_${person.id}`,
        position: position,
        size: {
          length: 43,
          width: 43,
        },
        rotation: 0,
        isLocked: false,
        properties: {
          posture: person.posture,
          isWarning: isWarningState,
        },
      });
    });
  };

  const updateMousePosition = (event: MouseEvent) => {
    const rect = canvasRef.value?.getBoundingClientRect();
    if (!rect) return;

    const x = Math.round((event.clientX - rect.left - (canvasStore.width/2)) / scale.value); // 到中心点的X偏移
    const y = Math.round((event.clientY - rect.top) / scale.value); // 到顶部的Y偏移

    mouseStore.updatePosition(x, y);
  };

  const handleDrag = (event: MouseEvent) => {
    const rect = canvasRef.value?.getBoundingClientRect();
    if (!rect) return;

    const obj = objectsStore.objects.find(
      (o) => o.id === objectsStore.selectedId,
    );
    // 检查对象是否锁定
    if (!obj || obj.isLocked) return; // 如果对象被锁定，直接返回

    const x = Math.round((event.clientX - rect.left - (canvasStore.width/2)) / scale.value);
    const y = Math.round((event.clientY - rect.top) / scale.value);

    objectsStore.updateObject(obj.id, {
      ...obj,
      position: { x, y },
    });
  };

  const handleMouseMove = (event: MouseEvent) => {
    if (isDragging.value) {
      handleDrag(event);
    } else {
      updateMousePosition(event);
    }
  };

  const handleMouseDown = (event: MouseEvent) => {
    if (!objectsStore.selectedId) return;
    // 检查对象是否锁定
    const obj = objectsStore.objects.find(
      (o) => o.id === objectsStore.selectedId,
    );
    if (!obj || obj.isLocked) return; // 如果对象被锁定，直接返回

    isDragging.value = true;

    const rect = canvasRef.value?.getBoundingClientRect();
    if (!rect) return;

    dragStartPos.x = event.clientX - rect.left;
    dragStartPos.y = event.clientY - rect.top;
  };

  const handleMouseUp = () => {
    isDragging.value = false;
  };
};
  
	const drawObject = (ctx: CanvasRenderingContext2D, obj: RadarObject) => {
    //	console.log('Drawing object:', obj.id, 'Selected:', objectsStore.selectedId) // 添加调试日志
    ctx.save();
    // 现有的位置和旋转变换保持不变...
    ctx.translate(
      (canvasStore.width/2) + obj.position.x * scale.value,
       obj.position.y * scale.value,
    );
    ctx.rotate((obj.rotation * Math.PI) / 180);
    const halfLength = (obj.size.length * scale.value) / 2;
    const halfWidth = (obj.size.width * scale.value) / 2;

    //先绘制对象本身
    // 现有的对象绘制代码保持不变...
    switch (obj.type) {
      case "Door":
        ctx.beginPath();
        ctx.rect(
          -halfLength,
          -halfWidth,
          obj.size.length * scale.value,
          obj.size.width * scale.value,
        );
        ctx.fillStyle = "#add8e6";
        ctx.fill();
        ctx.strokeStyle = "#666";
        ctx.stroke();
        break;

      case "Bed":
        ctx.beginPath();
        ctx.rect(
          -halfLength,
          -halfWidth,
          obj.size.length * scale.value,
          obj.size.width * scale.value,
        );
        ctx.fillStyle = obj.properties.isMonitored ? "#f0e68c" : "#98fb98";
        ctx.fill();
        ctx.strokeStyle = "#666";
        ctx.stroke();
        break;

      case "Exclude":
        ctx.beginPath();
        ctx.rect(
          -halfLength,
          -halfWidth,
          obj.size.length * scale.value,
          obj.size.width * scale.value,
        );
        ctx.fillStyle = "#f0e68c";
        ctx.fill();
        ctx.strokeStyle = "#666";
        ctx.stroke();
        break;

      case "Other":
        ctx.beginPath();
        ctx.rect(
          -halfLength,
          -halfWidth,
          obj.size.length * scale.value,
          obj.size.width * scale.value,
        );
        if (!obj.properties.borderOnly) {
          ctx.fillStyle = "#d3d3d3";
          ctx.fill();
        }
        ctx.strokeStyle = "#666";
        ctx.stroke();
        break;

		case "Wall":
		  ctx.beginPath();
		  ctx.rect(-halfLength, -halfWidth, obj.size.length * scale.value, obj.size.width * scale.value);
		  ctx.fillStyle = "#4a4a4a";  // 灰黑色
		  ctx.fill();
		  ctx.strokeStyle = "#666";
		  ctx.stroke();
		  break;

		case "TV":
		  // 与 Exclude 使用相同的绘制逻辑
		  ctx.beginPath();
		  ctx.rect(-halfLength, -halfWidth, obj.size.length * scale.value, obj.size.width * scale.value);
		  ctx.fillStyle = "#f0e68c";
		  ctx.fill();
		  ctx.strokeStyle = "#666";
		  ctx.stroke();
		  break;		


      case "Radar":
        // 调用独立的绘制函数
        drawRadarSymbol(ctx, {
          mode: obj.properties.mode || "ceiling",
          position: obj.position,
          rotation: obj.rotation,
          scale: scale.value,
          selected: obj.id === objectsStore.selectedId,
        });

        // 如果需要显示边界
        if (obj.properties.showBoundary) {
          drawRadarBoundary(
            ctx,
            obj.properties.mode || "ceiling",
            obj.properties.boundary || {
              leftX: 300,
              rightX: 300,
              frontY: obj.properties.mode === "ceiling" ? 200 : 400,
              rearY: obj.properties.mode === "ceiling" ? 200 : 0,
            },
            scale.value,
          );
        }
        break;

      case "M":
        // 绘制三角形
        const size = 10 * scale.value;
        ctx.beginPath();
        ctx.moveTo(0, -size);
        ctx.lineTo(-size, size);
        ctx.lineTo(size, size);
        ctx.closePath();
        ctx.fillStyle = "#1890ff";
        ctx.fill();
        break;
    }

    // 后绘制选中高亮
    if (obj.id === objectsStore.selectedId) {
      ctx.strokeStyle = "#1890ff";
      ctx.lineWidth = 2;
      if (obj.type === "Radar") {
        ctx.beginPath();
        ctx.arc(0, 0, 12 * scale.value, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        const halfLength = ((obj.size.length + 4) * scale.value) / 2;
        const halfWidth = ((obj.size.width + 4) * scale.value) / 2;
        ctx.strokeRect(
          -halfLength,
          -halfWidth,
          (obj.size.length + 4) * scale.value,
          (obj.size.width + 4) * scale.value,
        );
      }
    }

    ctx.restore();
  };

  const drawPersons = (ctx: CanvasRenderingContext2D) => {
    const persons = radarDataStore.currentPersons;
    persons.forEach((person) => {
      if (person.id === 88) return; // 跳过无人标记

      const position: Point = {
        x: person.position.x,
        y: person.position.y,
      };

      const isWarningState = [2, 5, 7, 10].includes(person.posture);

      drawObject(ctx, {
        id: `person_${person.id}`,
        type: "person",
        name: `Person_${person.id}`,
        position: position,
        size: {
          length: 43,
          width: 43,
        },
        rotation: 0,
        isLocked: false,
        properties: {
          posture: person.posture,
          isWarning: isWarningState,
        },
      });
    });
  };

	const drawObjects = (ctx: CanvasRenderingContext2D) => {
    // 非雷达对象
    objectsStore.objects
      .filter((obj) => obj.type !== "Radar")
      .forEach((obj) => drawObject(ctx, obj));

    // 绘制人员
    drawPersons(ctx);

    // 雷达对象最后绘制
    objectsStore.objects
      .filter((obj) => obj.type === "Radar")
      .forEach((obj) => drawObject(ctx, obj));
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