// src/utils/drawPosture.ts
import type { Point, PostureIconConfig } from '../stores/types';
import { PersonPosture, POSTURE_LABELS } from '../stores/types';
import { POSTURE_CONFIGS } from './postureIcons';


interface DrawPostureOptions {
  position: Point;
  rotation: number;
  posture: number;
  selected?: boolean;
}

// 主绘制函数
export function drawPosture(
  ctx: CanvasRenderingContext2D,
  options: DrawPostureOptions,
  scale: number
) {
  const { position, rotation, posture, selected = false } = options;

  // 保存当前绘图状态
  ctx.save();

  // 移动到目标位置并旋转
  ctx.translate(position.x * scale, position.y * scale);
  ctx.rotate((rotation * Math.PI) / 180);

  // 获取姿态配置
  const config = POSTURE_CONFIGS[posture] || {
	type: "default" as const,  // 明确指定类型
    size: 50,
    showLabel: true,
  };

  // 绘制人体图标
  if (config.type === "svg" && config.iconPath) {
    drawSVGIcon(ctx, config, scale);
  } else {
    drawDefaultEllipse(ctx, scale);
  }

  // 绘制标签
  if (config.type === "default" || config.showLabel) {
    drawLabel(ctx, POSTURE_LABELS[posture], isWarningState(posture), scale);
  }

  // 绘制警告状态
  //if (isWarningState(posture)) {
  //  drawWarningIndicator(ctx, scale);
  // }

  // 绘制选中状态
  //if (selected) {
  //  drawSelectionIndicator(ctx, scale);
  //}

  // 恢复绘图状态
  ctx.restore();
}

// 绘制 SVG 图标
function drawSVGIcon(
  ctx: CanvasRenderingContext2D,
  config: PostureIconConfig, // 使用完整的 PostureIconConfig 类型
  scale: number
) {
  if (config.type === "svg" && config.iconPath) {
    // 类型守卫
    const size = config.size * scale;
    const image = new Image();
    image.src = config.iconPath;
    ctx.drawImage(image, -size / 2, -size / 2, size, size);
  }
}
// 绘制默认椭圆
function drawDefaultEllipse(ctx: CanvasRenderingContext2D, scale: number) {
  // 椭圆主体
  ctx.beginPath();
  ctx.ellipse(0, 0, 5 * scale, 20 * scale, 0, 0, Math.PI * 2);
  ctx.fillStyle = "rgb(234, 218, 136)";
  ctx.fill();
  ctx.strokeStyle = "rgb(102, 102, 102)";
  ctx.lineWidth = 0.5;
  ctx.stroke();

  // 头部标记
  ctx.beginPath();
  ctx.arc(0, -5 * scale, 2 * scale, 0, Math.PI * 2);
  ctx.fillStyle = "rgb(255, 0, 0)";
  ctx.fill();
}

// 绘制文本标签
function drawLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  isWarning: boolean,
  scale: number
) {
  ctx.font = `${8 * scale}px Arial`;
  ctx.fillStyle = isWarning ? "rgb(255, 77, 79)" : "rgb(26, 32, 44)";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 0, (-10 + (isWarning ? -5 : 0)) * scale);
}

// 绘制警告指示器
function drawWarningIndicator(ctx: CanvasRenderingContext2D, scale: number) {
  ctx.beginPath();
  ctx.arc(0, 0, 25 * scale, 0, Math.PI * 2);
  ctx.strokeStyle = "rgb(255, 77, 79)";
  ctx.lineWidth = 1;
  ctx.setLineDash([4 * scale, 4 * scale]);
  ctx.stroke();
  ctx.setLineDash([]); // 重置虚线样式
}

// 绘制选中指示器
function drawSelectionIndicator(ctx: CanvasRenderingContext2D, scale: number) {
  ctx.beginPath();
  ctx.arc(0, 0, 25 * scale, 0, Math.PI * 2);
  ctx.strokeStyle = "rgb(24, 144, 255)";
  ctx.lineWidth = 1;
  ctx.setLineDash([4 * scale, 4 * scale]);
  ctx.stroke();
  ctx.setLineDash([]); // 重置虚线样式
}

// 判断是否为警告状态
function isWarningState(posture: number): boolean {
  return [
    PersonPosture.FallSuspect,
    PersonPosture.FallConfirm,
    PersonPosture.SitGroundSuspect,
    PersonPosture.SitUpBedSuspect,
  ].includes(posture);
}

// 获取姿态颜色
function getPostureColor(posture: number): string {
  switch (posture) {
    case PersonPosture.FallSuspect:
    case PersonPosture.FallConfirm:
      return "rgb(255, 77, 79)"; // 红色警告
    case PersonPosture.SitGroundSuspect:
    case PersonPosture.SitUpBedSuspect:
      return "rgb(250, 173, 20)"; // 黄色警告
    case PersonPosture.Lying:
    case PersonPosture.SitUpBed:
    case PersonPosture.SitUpBedConfirm:
      return "rgb(145, 202, 255)"; // 浅蓝色（床相关）
    default:
      return "rgb(173, 171, 161)"; // 默认灰色
  }
}

function rgb(
  arg0: number,
  arg1: number,
  arg2: number
): string | CanvasGradient | CanvasPattern {
  throw new Error("Function not implemented.");
}
