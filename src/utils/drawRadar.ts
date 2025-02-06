// src/utils/drawRadar.ts
import type { ObjectProperties } from '../stores/types';

export function drawRadarSymbol(
	ctx: CanvasRenderingContext2D,
	radar: ObjectProperties,
	scale: number,
) {
	const mode = radar.mode || 'ceiling';
	drawCoordinateLines(ctx, mode, scale);
	drawRadarCircles(ctx, scale);
	drawLEDIndicator(ctx, mode, scale);
}

function drawCoordinateLines(
  ctx: CanvasRenderingContext2D,
  mode: "ceiling" | "wall",
  scale: number
) {
  ctx.beginPath();
  ctx.strokeStyle = "rgb(113, 128, 150)";
  ctx.lineWidth = 0.2;

  // 绘制H轴 (左正右负)
  ctx.moveTo(15 * scale, 0);
  ctx.lineTo(-15 * scale, 0);

  // 绘制V轴
  ctx.moveTo(0, -15 * scale);
  ctx.lineTo(0, 15 * scale);
  ctx.stroke();

  // 坐标标记
  ctx.font = `${8 * scale}px Arial`;
  ctx.fillStyle = "rgb(74, 85, 104)";

  // H轴标记 (左正右负)
  ctx.textAlign = "end";
  ctx.fillText("+H", -16 * scale, 4 * scale);
  ctx.textAlign = "start";
  ctx.fillText("-H", 16 * scale, 4 * scale);

  // ceiling:V轴标记（只显示-V，+V由LED指示）,wall:指示器在上方，V+在下方
  if (mode === "ceiling") {
    ctx.fillText("-V", 2 * scale, -17 * scale);
  }
}

function drawRadarCircles(ctx: CanvasRenderingContext2D, scale: number) {
	// 外圈
	ctx.beginPath();
	ctx.arc(0, 0, 15 * scale, 0, Math.PI * 2);
	ctx.fillStyle = "rgba(190, 227, 248, 0.5)";
	ctx.fill();
	ctx.strokeStyle = "rgba(144, 205, 244, 0.5)";
	ctx.lineWidth = 0.5;
	ctx.stroke();

	// 中圈
	ctx.beginPath();
	ctx.arc(0, 0, 10 * scale, 0, Math.PI * 2);
	ctx.fillStyle = "rgba(99, 179, 237, 0.5)";
	ctx.fill();
	ctx.strokeStyle = "rgba(66, 153, 225, 0.5)";
	ctx.stroke();

	// 内圈
	ctx.beginPath();
	ctx.arc(0, 0, 5 * scale, 0, Math.PI * 2);
	ctx.fillStyle = "rgba(49, 130, 206, 0.5)";
	ctx.fill();
	ctx.strokeStyle = "rgba(43, 108, 176, 0.5)";
	ctx.stroke();
}

function drawLEDIndicator(
  ctx: CanvasRenderingContext2D,
  mode: "ceiling" | "wall",
  scale: number,
) {
  const indicatorY = mode === "ceiling" ? 17 : -17;

// LED指示器
ctx.beginPath();
ctx.fillStyle = "rgb(116, 199, 151)";
ctx.strokeStyle = "rgb(47, 133, 90)";
ctx.lineWidth = 0.5;
//-10，与中圆r相等
ctx.rect(-5 * scale, (indicatorY - 0.5) * scale, 5 * scale, 1.5 * scale);
ctx.fill();
ctx.stroke();

// 模式标识
ctx.fillStyle = "rgb(74, 85, 104)";
ctx.font = `${8 * scale}px Arial`;
ctx.textAlign = "center";
ctx.textBaseline = "middle";
const textY =
	mode === "ceiling" ? (indicatorY + 8) * scale : (indicatorY - 8) * scale;
ctx.fillText(mode === "ceiling" ? "C" : "W", 0, textY);
}



export function drawRadarBoundary(
  ctx: CanvasRenderingContext2D,
  radar: ObjectProperties,
  scale: number,
) {
  ctx.beginPath();
  ctx.strokeStyle = "rgba(1, 5, 35, 0.8)";
  ctx.lineWidth = 0.5;
  ctx.setLineDash([5, 5]);
  
  const mode = radar.mode || 'ceiling';
  const modeConfig = mode === 'ceiling' ? radar.ceiling : radar.wall;
  const boundary = modeConfig.boundary;

  const bounds =
    mode === "ceiling"
      ? {
          left: -boundary.leftH * scale,    //使用的是画布坐标，H=-X
          right: boundary.rightH * scale,
          top: -boundary.rearV * scale,
          bottom: boundary.frontV * scale,
        }
      : {
          left: -boundary.leftH * scale,
          right: boundary.rightH * scale,
          top: 0,
          bottom: boundary.frontV * scale,
        };

  ctx.moveTo(bounds.left, bounds.top);
  ctx.lineTo(bounds.right, bounds.top);
  ctx.lineTo(bounds.right, bounds.bottom);
  ctx.lineTo(bounds.left, bounds.bottom);
  ctx.closePath();
  ctx.stroke();
  ctx.setLineDash([]);
}
