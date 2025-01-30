<template>
	<!-- 这里是你的画布模板 -->
	<canvas ref="canvasRef" @click="handleCanvasClick" @mousemove="handleMouseMove" @mousedown="handleMouseDown" @mouseup="handleMouseUp"></canvas>
	<div>鼠标位置: {{ displayMouseX }}, {{ displayMouseY }}</div>
  </template>
  
  <script lang="ts" setup>
  import { ref, computed } from 'vue';
  import { objectsStore, mouseStore, canvasStore, radarDataStore } from './store'; // 假设这些是你的状态管理模块
  
  const canvasRef = ref<HTMLCanvasElement | null>(null);
  const scale = ref(1);
  const isDragging = ref(false);
  const dragStartPos = { x: 0, y: 0 };
  
  // 绘制坐标系
  const drawCoordinateSystem = (ctx: CanvasRenderingContext2D) => {
	// 底色和原点
	<!-- RED START -->
	ctx.fillStyle = "#FFF8DC";
	ctx.fillRect(0, 0, 620 * scale.value, 520 * scale.value);
	<!-- RED END -->
  
	<!-- RED START -->
	const originX = 310 * scale.value; // 原点X坐标（画布中心）
	<!-- RED END -->
	const originY = 0; // 原点Y坐标（画布顶部）
  
	// 绘制网格
	if (canvasStore.showGrid) {
	  const gridSize = 50 * scale.value;
	  ctx.strokeStyle = "#ddd";
	  ctx.lineWidth = 0.5;
  
	  <!-- RED START -->
	  // X轴网格
	  for (let x = 0; x <= 620 * scale.value; x += gridSize) {
		ctx.beginPath();
		ctx.moveTo(x, 0);
		ctx.lineTo(x, 520 * scale.value);
		ctx.stroke();
	  }
  
	  // Y轴网格
	  for (let y = 0; y <= 520 * scale.value; y += gridSize) {
		ctx.beginPath();
		ctx.moveTo(0, y);
		ctx.lineTo(620 * scale.value, y);
		ctx.stroke();
	  }
	  <!-- RED END -->
	}
  
	// 刻度标注
	if (canvasStore.showScale) {
	  ctx.font = "12px Arial";
	  ctx.fillStyle = "#000";
  
	  <!-- RED START -->
	  // X轴刻度，保持左负右正
	  for (let x = -300; x <= 300; x += 100) {
		const xPos = originX + x * scale.value;
		if (x !== 0) {
		  // 不是原点时显示正负号
		  ctx.textAlign = "center";
		  ctx.textBaseline = "top";
		  ctx.fillText(x > 0 ? `+${x}` : `${x}`, xPos, 5 * scale.value);
		  ctx.textBaseline = "bottom";
		  ctx.fillText(x > 0 ? `+${x}` : `${x}`, xPos, 518 * scale.value);
		}
	  }
  
	  // Y轴刻度，上负(-)下正(+)从0开始向上递增
	  for (let y = 0; y <= 520; y += 100) {
		const yPos = y * scale.value;
		const label = y.toString();
  
		ctx.textAlign = "right";
		ctx.textBaseline = "middle";
		ctx.fillText(label, 20 * scale.value, yPos); // 左侧刻度
		ctx.textAlign = "left";
		ctx.fillText(label, 600 * scale.value, yPos); // 右侧刻度
	  }
	  <!-- RED END -->
  
	  <!-- RED START -->
	  // 原点标记
	  ctx.beginPath();
	  ctx.arc(originX, originY, 3 * scale.value, 0, Math.PI * 2);
	  ctx.fillStyle = "#1890ff";
	  ctx.fill();
	  <!-- RED END -->
	}
  };
  
  // 添加选择检测函数 v1.5.1
  const isPointInObject = (x: number, y: number, obj: any): boolean => {
	<!-- RED START -->
	const dx = x - obj.position.x * scale.value;
	const dy = y - obj.position.y * scale.value;
	<!-- RED END -->
  
	// Radar和borderOnly的Other不参与碰撞检测
	if (
	  obj.type === "Radar" ||
	  (obj.type === "Other" && obj.properties.borderOnly)
	) {
	  return false;
	}
  
	<!-- RED START -->
	const halfLength = (obj.size.length * scale.value) / 2;
	const halfWidth = (obj.size.width * scale.value) / 2;
	<!-- RED END -->
	return Math.abs(dx) <= halfLength && Math.abs(dy) <= halfWidth;
  };
  
  // 对象点选逻辑
  const handleCanvasClick = (event: MouseEvent) => {
	const rect = canvasRef.value?.getBoundingClientRect();
	if (!rect) return;
  
	<!-- RED START -->
	const canvasX = event.clientX - rect.left;
	const canvasY = event.clientY - rect.top;
  
	const logicalX = Math.round(canvasX / scale.value);
	const logicalY = Math.round(canvasY / scale.value);
	<!-- RED END -->
  
	// 按绘制顺序反向检查，确保上层对象优先选中
	const clickedObject = objectsStore.getOrderedObjects
	  .reverse()
	  .find((obj) => {
		const dx = logicalX - obj.position.x;
		const dy = logicalY - obj.position.y;
  
		// 根据对象类型确定选择范围
		if (obj.type === "Radar") {
		  <!-- RED START -->
		  // 圆形选择区域
		  return Math.sqrt(dx * dx + dy * dy) <= 15 / scale.value; // 15为感应半径
		  <!-- RED END -->
		} else {
		  <!-- RED START -->
		  // 矩形选择区域，考虑对象尺寸
		  const halfLength = (obj.size.length / 2 + 5) / scale.value;
		  const halfWidth = (obj.size.width / 2 + 5) / scale.value;
		  <!-- RED END -->
		  return Math.abs(dx) <= halfLength && Math.abs(dy) <= halfWidth;
		}
	  });
  
	if (clickedObject) {
	  objectsStore.selectObject(clickedObject.id);
	} else {
	  objectsStore.selectObject(null);
	}
  };
  
  const drawObject = (ctx: CanvasRenderingContext2D, obj: any) => {
	ctx.save();
	<!-- RED START -->
	ctx.translate(
	  obj.position.x * scale.value,
	  obj.position.y * scale.value
	);
	<!-- RED END -->
	ctx.rotate((obj.rotation * Math.PI) / 180);
	const halfLength = (obj.size.length * scale.value) / 2;
	const halfWidth = (obj.size.width * scale.value) / 2;
  
	// 先绘制对象本身
	switch (obj.type) {
	  case "Door":
		ctx.beginPath();
		ctx.rect(
		  -halfLength,
		  -halfWidth,
		  obj.size.length * scale.value,
		  obj.size.width * scale.value
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
		  obj.size.width * scale.value
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
		  obj.size.width * scale.value
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
		  obj.size.width * scale.value
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
		// 这里假设 drawRadarSymbol 和 drawRadarBoundary 函数已经定义
		drawRadarSymbol(ctx, {
		  mode: obj.properties.mode || "ceiling",
		  position: obj.position,
		  rotation: obj.rotation,
		  scale: scale.value,
		  selected: obj.id === objectsStore.selectedId
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
			  rearY: obj.properties.mode === "ceiling" ? 200 : 0
			},
			scale.value
		  );
		}
		break;
  
	  case "M":
		<!-- RED START -->
		// 绘制三角形
		const size = 10 * scale.value;
		<!-- RED END -->
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
	  <!-- RED START -->
	  ctx.strokeStyle = "#1890ff";
	  ctx.lineWidth = 2 * scale.value;
	  <!-- RED END -->
	  if (obj.type === "Radar") {
		<!-- RED START -->
		ctx.beginPath();
		ctx.arc(0, 0, 12 * scale.value, 0, Math.PI * 2);
		<!-- RED END -->
		ctx.stroke();
	  } else {
		<!-- RED START -->
		const halfLength = ((obj.size.length + 4) * scale.value) / 2;
		const halfWidth = ((obj.size.width + 4) * scale.value) / 2;
		<!-- RED END -->
		ctx.strokeRect(
		  -halfLength,
		  -halfWidth,
		  (obj.size.length + 4) * scale.value,
		  (obj.size.width + 4) * scale.value
		);
	  }
	}
  
	ctx.restore();
  };
  
  // 后续代码未修改部分省略，若需要可补充完整
  </script>