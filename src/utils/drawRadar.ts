// src/utils/drawRadar.ts
export interface RadarSymbolProps {
	mode: 'ceiling' | 'wall'
	position: { x: number; y: number }
	rotation: number
	scale: number
	selected: boolean
  }
  
export function drawRadarSymbol(ctx: CanvasRenderingContext2D, props: RadarSymbolProps) {
  const { mode, scale } = props;
	
  drawCoordinateLines(ctx, mode, scale);
  drawRadarCircles(ctx, scale);
  drawLEDIndicator(ctx, mode, scale);
}
  
function drawCoordinateLines(ctx: CanvasRenderingContext2D, mode: 'ceiling' | 'wall', scale: number) {
  ctx.beginPath();
  ctx.strokeStyle = '#718096';
  ctx.lineWidth = 0.2;
	
  // 绘制X轴
  ctx.moveTo(-15 * scale, 0);
  ctx.lineTo(15 * scale, 0);
	
  // 绘制Y轴
  ctx.moveTo(0, -15 * scale);
  ctx.lineTo(0, 15 * scale);
  ctx.stroke();
	
  // 绘制轴标签
  ctx.font = `${10 * scale}px sans-serif`;
  ctx.fillStyle = '#4a5568';
	
  // X轴标签
  ctx.textAlign = 'start';
  ctx.textBaseline = 'middle';
  ctx.fillText('+X', 16 * scale, 0);
  ctx.textAlign = 'end';
  ctx.fillText('-X', -16 * scale, 0);
	
  // Y轴标签
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  if (mode === 'wall') {
	  ctx.fillText('+Y', 0, -16 * scale);
	  ctx.fillText('-Y', 0, 16 * scale);
  } else {
	  ctx.fillText('-Y', 0, -16 * scale);
	  ctx.fillText('+Y', 0, 16 * scale);
  }
}
  
function drawRadarCircles(ctx: CanvasRenderingContext2D, scale: number) {
  // 外圈
  ctx.beginPath();
  ctx.arc(0, 0, 15 * scale, 0, Math.PI * 2);
  ctx.fillStyle = '#bee3f8';
  ctx.fill();
  ctx.strokeStyle = '#90cdf4';
  ctx.lineWidth = 0.5;
  ctx.stroke();
  
  // 中圈
  ctx.beginPath();
  ctx.arc(0, 0, 10 * scale, 0, Math.PI * 2);
  ctx.fillStyle = '#63b3ed';
  ctx.fill();
  ctx.strokeStyle = '#4299e1';
  ctx.stroke();
  
  // 内圈
  ctx.beginPath();
  ctx.arc(0, 0, 5 * scale, 0, Math.PI * 2);
  ctx.fillStyle = '#3182ce';
  ctx.fill();
  ctx.strokeStyle = '#2b6cb0';
  ctx.stroke();
}
  
function drawLEDIndicator(ctx: CanvasRenderingContext2D, mode: 'ceiling' | 'wall', scale: number) {
  const indicatorY = mode === 'ceiling' ? 17 : -17;
	
  // LED指示器
  ctx.beginPath();
  ctx.fillStyle = '#48bb78';
  ctx.strokeStyle = '#2f855a';
  ctx.lineWidth = 0.5;
  //-10，与中圆r相等
  ctx.rect(-10 * scale, (indicatorY - 3) * scale, 20 * scale, 6 * scale); 
  ctx.fill();
  ctx.stroke();
  
  // 模式标识
  ctx.fillStyle = '#1a202c';
  ctx.font = `bold ${14 * scale}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const textY = mode === 'ceiling' ? (indicatorY + 15) * scale : (indicatorY - 8) * scale;
  ctx.fillText(mode === 'ceiling' ? 'C' : 'W', 0, textY);
}
  
export interface RadarBoundary {
	leftX: number
	rightX: number
	frontY: number
	rearY: number
  }
  
export function drawRadarBoundary(
  ctx: CanvasRenderingContext2D, 
  mode: 'ceiling' | 'wall',
  boundary: RadarBoundary,
  scale: number
) {
  ctx.beginPath();
  ctx.strokeStyle = 'rgba(1, 5, 35, 0.8)';
  ctx.lineWidth = 0.5;
  ctx.setLineDash([5, 5]);
	
  const bounds = mode === 'ceiling'
	  ? {
		  left: -boundary.leftX * scale,
		  right: boundary.rightX * scale,
		  top: boundary.frontY * scale,
		  bottom: -boundary.rearY * scale
    }
	  : {
		  left: -boundary.leftX * scale,
		  right: boundary.rightX * scale,
		  top: -boundary.frontY * scale,
		  bottom: 0
    };
  
  ctx.moveTo(bounds.left, bounds.top);
  ctx.lineTo(bounds.right, bounds.top);
  ctx.lineTo(bounds.right, bounds.bottom);
  ctx.lineTo(bounds.left, bounds.bottom);
  ctx.closePath();
  ctx.stroke();
  ctx.setLineDash([]);
}