// utils/radarUtils.ts 
//计算边界内的固定物体的4点坐标
import type { ObjectProperties, Point } from '../stores/types';

// 检查点是否在雷达边界内
export function isPointInBoundary(point: Point, radar: ObjectProperties): boolean {
	const mode = radar.mode || 'ceiling';  // 确保有默认值
	const modeConfig = mode === 'ceiling' ? radar.ceiling : radar.wall;
	const boundary = modeConfig.boundary;
	
	// 转换为雷达坐标系
	const h = -point.x;  // H轴与X轴相反
	const v = point.y;   // 使用 const
  
  return (
    h >= -boundary.leftH && 
    h <= boundary.rightH && 
    v >= -boundary.rearV && 
    v <= boundary.frontV
  );
}

// 检查矩形物体的四个顶点是否在boundary内
export function isObjectInBoundary(obj: ObjectProperties, radar: ObjectProperties): boolean {
  // 如果是 Wall，直接返回 false
  if (obj.typeName === 'Wall') return false;
  
  // 获取物体的四个顶点坐标
  const vertices = getObjectVertices(obj);
  
  // 任一顶点在boundary内，就认为物体在boundary内
  return vertices.some(vertex => isPointInBoundary(vertex, radar));
}

// 计算物体的四个顶点坐标
export function getObjectVertices(obj: ObjectProperties): Point[] {
  const { position, length, width, rotation } = obj;
  
  // 计算旋转角度（弧度）
  const rad = (rotation * Math.PI) / 180;
  
  // 计算半长和半宽
  const halfLength = length / 2;
  const halfWidth = width / 2;
  
  // 计算旋转后的四个顶点
  return [
    // 左上
    {
      x: position.x - halfLength * Math.cos(rad) + halfWidth * Math.sin(rad),
      y: position.y - halfLength * Math.sin(rad) - halfWidth * Math.cos(rad)
    },
    // 右上
    {
      x: position.x + halfLength * Math.cos(rad) + halfWidth * Math.sin(rad),
      y: position.y + halfLength * Math.sin(rad) - halfWidth * Math.cos(rad)
    },
    // 右下
    {
      x: position.x + halfLength * Math.cos(rad) - halfWidth * Math.sin(rad),
      y: position.y + halfLength * Math.sin(rad) + halfWidth * Math.cos(rad)
    },
    // 左下
    {
      x: position.x - halfLength * Math.cos(rad) - halfWidth * Math.sin(rad),
      y: position.y - halfLength * Math.sin(rad) + halfWidth * Math.cos(rad)
    }
  ];
}