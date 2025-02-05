// src/utils/radarUtils.ts
/**
 * 计算物体相对于雷达坐标系的顶点坐标
 * 雷达坐标系规则：
 * - 原点在雷达中心 (0,0)
 * - H轴：向左为正(+)，向右为负(-)
 * - V轴：向下为正(+)，向上为负(-)
 * 
 * 顶点顺序规则 (v1,v2,v3,v4)：先minH排序，相同时再用minV排序。
 * 默认ceiling模式 (H+向左, V+向下):
 * - v1: 首选minH，在相同H中取minV
 * - v2:  minH,sec minV
 * - v3:  sec min H, minV
 * - v4:   
 * 
 *  当雷达旋转后，坐标系跟随旋转，顶点定义规则保持不变
 * 即：v1始终是雷达当前坐标系下的最小H
 * 
 * @param obj - 物体属性，包含画布坐标(x,y)
 * @param radar - 雷达属性，包含画布坐标和旋转角度
 * @returns - 返回在雷达坐标系中的顶点数组[(h,v)]
 */

import type { 
	ObjectProperties, 
	Point, 
	RadarReport, 
	RadarPoint, 
	RadarBoundaryVertices 
  } from '../stores/types';

 


// 获取雷达boundary的标准格式顶点
export function getRadarBoundaryVertices(radar: ObjectProperties): RadarBoundaryVertices {
  const mode = radar.mode || 'ceiling';
  const modeConfig = mode === 'ceiling' ? radar.ceiling : radar.wall;
  const boundary = modeConfig.boundary;

  if (mode === 'ceiling') {
    return {
      v1: { h: -boundary.rightH, v: -boundary.rearV }, // minH,minV -300,-200
      v2: { h: boundary.leftH, v: -boundary.rearV }, // minV,sec min H 300，-200
      v3: { h: boundary.rightH, v: boundary.frontV }, // minH,sec minV -300，200
      v4: { h: -boundary.rightH, v: boundary.frontV } //
    };
  } else {
    return {
      v1: { h: -boundary.rightH, v: 0 }, // minH,minV -300,0
      v2: { h: boundary.leftH, v: 0 }, //minV,sec min H   300,0
      v3: { h: boundary.rightH, v: boundary.frontV }, // minH,sec minV -300,400
      v4: { h: -boundary.rightH, v: boundary.frontV } // sec minV   300,400
    };
  }
}

// 判断点是否在雷达boundary内
export function isPointInBoundary(point: RadarPoint, radar: ObjectProperties): boolean {
  const mode = radar.mode || 'ceiling';
  const modeConfig = mode === 'ceiling' ? radar.ceiling : radar.wall;
  const boundary = modeConfig.boundary;
  

  if (mode === 'ceiling') {
    return (
		point.h >= -boundary.rightH &&   // leftH和rightH通常相等，比如300 
		point.h <= boundary.leftH &&    // 所以范围是-300到300
		point.v >= -boundary.rearV &&  // frontV=200，rearV=200 (ceiling模式)
		point.v <= boundary.frontV
    );
  } else {
    return (
		point.h >= -boundary.rightH && 
		point.h <= boundary.leftH && 
		point.v >= 0 &&               // wall模式下从地面开始
		point.v <= boundary.frontV    // frontV=400，rearV=0 (wall模式)
    );
  }
}

// 采用雷达坐标，获取固定物体的四个顶点（顺序：左上，右上，左下，右下, radar factory BT）
export function getObjectVertices(obj: ObjectProperties, radar: ObjectProperties): RadarPoint[] {
	// 1. 计算物体相对于雷达的位置
	const relativePos = {
	  x: obj.position.x - radar.position.x,
	  y: obj.position.y - radar.position.y
	};
  
	// 2. 计算雷达旋转角度（弧度）
	const radarRad = (radar.rotation * Math.PI) / 180;
	const objRad = (obj.rotation * Math.PI) / 180;
  
	// 3. 计算物体中心点在雷达坐标系中的位置
	// 注意：画布x对应雷达-h，画布y对应雷达v
	const radarPos = {
		h: -(relativePos.x * Math.cos(radarRad) + relativePos.y * Math.sin(radarRad)),
		v: -relativePos.x * Math.sin(radarRad) + relativePos.y * Math.cos(radarRad)
	  };
  
	const halfLength = obj.length / 2;
	const halfWidth = obj.width / 2;
	
	// 4. 计算物体四个顶点（考虑物体自身旋转和雷达旋转）
	const points = [
    // 先计算物体自身坐标系中的四个点
    { h: -halfLength, v: -halfWidth }, // 左上
    { h: halfLength, v: -halfWidth }, // 右上
    { h: -halfLength, v: halfWidth }, // 左下
    { h: halfLength, v: halfWidth } // 右下
  ].map(p => {
    // 将每个点按物体旋转角度旋转
    const rotatedH = p.h * Math.cos(objRad) - p.v * Math.sin(objRad);
    const rotatedV = p.h * Math.sin(objRad) + p.v * Math.cos(objRad);
    // 加上物体中心点位置得到最终坐标
    return {
      h: radarPos.h + rotatedH,
      v: radarPos.v + rotatedV
    };
  });

  // 5. 修改排序规则 - 按雷达坐标系规则:
  //v1：优先找最小的 h，若 h 相同则找最小的 v。
  //v2：优先找最小的 v，若 v 相同则找次小的 h。
  //v3：最小的 h 中次小的 v。
  //v4：剩下的那个点
  // 5. 按规则排序并取整到10的倍数
  const roundToTen = (num: number) => Math.round(num / 10) * 10;

  // 先取所有点的副本并排序
  const sortedPoints = [...points].sort((a, b) => {
    if (Math.abs(a.h - b.h) > 0.1) {
      return a.h - b.h; // h小的在前（minH优先）
    }
    return a.v - b.v; // h相同时v小的在前（minV优先）
  });

  // 将结果四舍五入到10的倍数
  return sortedPoints.map(p => ({
    h: roundToTen(p.h),
    v: roundToTen(p.v)
  }));
}



// 获取boundary内的固定物体（不含wall）的顶点
export function getObjectsInBoundary(objects: ObjectProperties[], radar: ObjectProperties) {
  return objects
    .filter(obj => 
      obj.typeName !== 'Radar' && 
      obj.typeName !== 'Wall' &&
      obj.typeName !== 'Person' &&
	  // 添加 borderOnly 过滤
	  !(obj.typeName === 'Other' && obj.borderOnly) &&
      getObjectVertices(obj, radar).some(vertex => isPointInBoundary(vertex, radar))
    )
    .map(obj => ({
      // 与 ObjectProperties 保持一致的基本属性
      typeValue: obj.typeValue,
      typeName: obj.typeName,
      id: obj.id,
      name: obj.name,
      // 雷达坐标系中的顶点
	  radarVertices: getObjectVertices(obj, radar)  
    }));
}

// 生成雷达报告


// radarUtils.ts
export function generateRadarReport(radar: ObjectProperties | null, objects: ObjectProperties[]): RadarReport | null {
	// 如果没有雷达，返回 null，因为 RadarReport 就是用于雷达视角的
	if (!radar) {
	  return null;
	}
   
	// 有雷达时，返回完整信息
	const modeConfig = radar.mode === 'ceiling' ? radar.ceiling : radar.wall;
	const objectsInBoundary = getObjectsInBoundary(objects, radar);
  
	return {
	  id: radar.id,
	  typeValue: radar.typeValue,
	  typeName: radar.typeName,
	  name: radar.name,
	  mode: radar.mode || 'ceiling',
	  config: {
		height: modeConfig.height,
		boundary: modeConfig.boundary
	  },
	  boundaryVertices: getRadarBoundaryVertices(radar),
	  objects: objectsInBoundary
	};
  }


  export function toRadarCoordinate(canvasX: number, canvasY: number, radar: ObjectProperties): RadarPoint {
	// 计算相对于雷达中心的偏移
	const dx = canvasX - radar.position.x;
	const dy = canvasY - radar.position.y;
	
	// 考虑雷达旋转角度（弧度）
	const radarRotation = (radar.rotation * Math.PI) / 180;
	
	// 应用旋转变换
	const rotatedH = -(dx * Math.cos(radarRotation) + dy * Math.sin(radarRotation));
	const rotatedV = -dx * Math.sin(radarRotation) + dy * Math.cos(radarRotation);
	
	return {
	  h: rotatedH,  // 雷达坐标系：左正右负
	  v: rotatedV   // 雷达坐标系：下正上负
	};
  }
  
  export function toCanvasCoordinate(radarPoint: RadarPoint, radar: ObjectProperties): Point {
	// 雷达旋转角度（弧度）
	const radarRotation = (radar.rotation * Math.PI) / 180;
	
	// 反向应用旋转变换
	const dx = -(radarPoint.h * Math.cos(-radarRotation) + radarPoint.v * Math.sin(-radarRotation));
	const dy = -radarPoint.h * Math.sin(-radarRotation) + radarPoint.v * Math.cos(-radarRotation);
	
	return {
	  x: radar.position.x + dx,
	  y: radar.position.y + dy
	};
  }