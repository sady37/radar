// utils/radarUtils.ts
import type { ObjectProperties, Point } from '../stores/types';

// 定义接口
interface RadarBoundaryVertices {
  v1: Point;  // 左上
  v2: Point;  // 右上
  v3: Point;  // 左下
  v4: Point;  // 右下
}

export interface RadarReport {
  radarId: string;
  boundaryVertices: RadarBoundaryVertices;
  objects: Array<{
    id: string;
    typeValue: number;
    vertices: Point[];
  }>;
}

// 获取雷达boundary的标准格式顶点
export function getRadarBoundaryVertices(radar: ObjectProperties): RadarBoundaryVertices {
  const mode = radar.mode || 'ceiling';
  const modeConfig = mode === 'ceiling' ? radar.ceiling : radar.wall;
  const boundary = modeConfig.boundary;

  if (mode === 'ceiling') {
    return {
      v1: { x: -boundary.leftH, y: -boundary.frontV },  // 左上
      v2: { x: boundary.rightH, y: -boundary.frontV },  // 右上
      v3: { x: -boundary.leftH, y: boundary.rearV },    // 左下
      v4: { x: boundary.rightH, y: boundary.rearV }     // 右下
    };
  } else {
    return {
      v1: { x: -boundary.leftH, y: 0 },                // 左上
      v2: { x: boundary.rightH, y: 0 },                // 右上
      v3: { x: -boundary.leftH, y: boundary.frontV },  // 左下
      v4: { x: boundary.rightH, y: boundary.frontV }   // 右下
    };
  }
}

// 判断点是否在雷达boundary内
export function isPointInBoundary(point: Point, radar: ObjectProperties): boolean {
  const mode = radar.mode || 'ceiling';
  const modeConfig = mode === 'ceiling' ? radar.ceiling : radar.wall;
  const boundary = modeConfig.boundary;
  
  // 转换到雷达坐标系
  const h = point.x;  // 不需要取反，因为boundary定义已经包含正负
  const v = point.y;

  if (mode === 'ceiling') {
    return (
      h >= -boundary.leftH && 
      h <= boundary.rightH && 
      v >= -boundary.frontV && 
      v <= boundary.rearV
    );
  } else {
    return (
      h >= -boundary.leftH && 
      h <= boundary.rightH && 
      v >= 0 && 
      v <= boundary.frontV
    );
  }
}

// 获取固定物体的四个顶点（顺序：左上，右上，左下，右下）
export function getObjectVertices(obj: ObjectProperties): Point[] {
  const { position, length, width, rotation } = obj;
  
  const rad = (rotation * Math.PI) / 180;
  const halfLength = length / 2;
  const halfWidth = width / 2;
  
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
    // 左下
    {
      x: position.x - halfLength * Math.cos(rad) - halfWidth * Math.sin(rad),
      y: position.y - halfLength * Math.sin(rad) + halfWidth * Math.cos(rad)
    },
    // 右下
    {
      x: position.x + halfLength * Math.cos(rad) - halfWidth * Math.sin(rad),
      y: position.y + halfLength * Math.sin(rad) + halfWidth * Math.cos(rad)
    }
  ];
}

// 获取boundary内的固定物体（不含wall）的顶点
export function getObjectsInBoundary(objects: ObjectProperties[], radar: ObjectProperties) {
  return objects
    .filter(obj => 
      obj.typeName !== 'Radar' && 
      obj.typeName !== 'Wall' &&
      obj.typeName !== 'Person' &&
      getObjectVertices(obj).some(vertex => isPointInBoundary(vertex, radar))
    )
    .map(obj => ({
      id: obj.id,
      vertices: getObjectVertices(obj)
    }));
}

// 生成雷达报告
export function generateRadarReport(radar: ObjectProperties, objects: ObjectProperties[]): RadarReport {
  const objectsInBoundary = getObjectsInBoundary(objects, radar);
  const objectsData = objectsInBoundary.map(({ id, vertices }) => {
    const obj = objects.find(o => o.id === id);
    return {
      id,
      typeValue: obj!.typeValue,
      vertices
    };
  });

  return {
    radarId: radar.id,
    boundaryVertices: getRadarBoundaryVertices(radar),
    objects: objectsData
  };
}