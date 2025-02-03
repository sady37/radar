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

import type { ObjectProperties, Point } from '../stores/types';

// 定义雷达坐标点接口
interface RadarPoint {
	h: number;  // 雷达坐标系中的水平位置
	v: number;  // 雷达坐标系中的垂直位置
  }
  
  // 定义接口
  interface RadarBoundaryVertices {
	v1: RadarPoint;  // minH
	v2: RadarPoint;  // minV
	v3: RadarPoint;  // secH
	v4: RadarPoint;  // secV
  }
 
  export interface RadarReport {
	radarId: string;
	mode?: 'ceiling' | 'wall' | null;
	boundaryVertices?: RadarBoundaryVertices;
	objects: Array<{
	  id: string;
	  typeValue: number;
	  canvasVertices?: Point[];     // 画布坐标顶点
	  radarVertices?: RadarPoint[]; // 雷达坐标顶点
	}>;
  }


// 获取雷达boundary的标准格式顶点
export function getRadarBoundaryVertices(radar: ObjectProperties): RadarBoundaryVertices {
  const mode = radar.mode || 'ceiling';
  const modeConfig = mode === 'ceiling' ? radar.ceiling : radar.wall;
  const boundary = modeConfig.boundary;

  if (mode === 'ceiling') {
    return {
		v1: { h:-boundary.rightH , v: -boundary.rearV },   // minH -300,-200
		v2: { h:boundary.leftH , v: -boundary.rearV },      // minV 300，-200
		v3: { h: boundary.rightH, v: boundary.frontV },     // sec minH -300，200
		v4: { h: -boundary.rightH, v: boundary.frontV }    // sec minV  300，200
    };
  } else {
    return {
		v1: { h:-boundary.rightH , v: 0 },   // minH -300,0
		v2: { h:boundary.leftH , v: 0 },      // minV  300,0
		v3: { h: boundary.rightH, v: boundary.frontV },     // sec minH -300,400
		v4: { h: -boundary.rightH, v: boundary.frontV }    // sec minV   300,400
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
	  { h: -halfLength, v: -halfWidth },  // 左上
	  { h: halfLength, v: -halfWidth },   // 右上
	  { h: -halfLength, v: halfWidth },   // 左下
	  { h: halfLength, v: halfWidth }     // 右下
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
  
	  // 5. 修改排序规则 - 按雷达坐标系规则: 最小H(左)、最小V(上)优先
	  points.sort((a, b) => {
		// H值不同时,小的在前(更左)
		if (Math.abs(a.h - b.h) > 0.1) {
		  return a.h - b.h;  // H小的在前(左边)
		}
		// H值相近时,小的V在前(更上)
		return a.v - b.v;    // V小的在前(上面)
	  });
	

	  // 调试输出
	  console.log('Sorted vertices:', points.map(p => 
	    `(H:${Math.round(p.h)}, V:${Math.round(p.v)})`
	  ));

  return points;
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
      id: obj.id,
      typeValue: obj.typeValue,
      radarVertices: getObjectVertices(obj, radar)  // 添加 typeValue 和修正返回值结构
    }));
}

// 生成雷达报告
export function generateRadarReport(radar: ObjectProperties | null, objects: ObjectProperties[]): RadarReport {
	function getCanvasVertices(obj: ObjectProperties): Point[] {
		const rad = (obj.rotation * Math.PI) / 180;
		const halfLength = obj.length / 2;
		const halfWidth = obj.width / 2;
	// 计算四个顶点
	const points = [
	  //顺时针 
      // 左上
      {
		x: obj.position.x - halfLength * Math.cos(rad) + halfWidth * Math.sin(rad),
		y: obj.position.y - halfLength * Math.sin(rad) - halfWidth * Math.cos(rad)
	  },
	  // 右上
	  {
		x: obj.position.x + halfLength * Math.cos(rad) + halfWidth * Math.sin(rad),
		y: obj.position.y + halfLength * Math.sin(rad) - halfWidth * Math.cos(rad)
	  },
	  // 右下
	  {
		x: obj.position.x + halfLength * Math.cos(rad) - halfWidth * Math.sin(rad),
		y: obj.position.y + halfLength * Math.sin(rad) + halfWidth * Math.cos(rad)
	  },
	  // 左下
	  {
		x: obj.position.x - halfLength * Math.cos(rad) - halfWidth * Math.sin(rad),
		y: obj.position.y - halfLength * Math.sin(rad) + halfWidth * Math.cos(rad)
	  }
	];
	// 不需要排序，保持顺时针顺序
	  // 按相同规则排序：minx，max,miny,maxy
	  points.sort((a, b) => {
		// x值不同时，小的在前
		if (Math.abs(a.x - b.x) > 0.1) {
		  return a.x - b.x;
		}
		// x值相近时，小的y在前
		return a.y - b.y;
	  });
	
	  return points;
	}

	// 如果没有雷达，只返回布局信息
	if (!radar) {
		return {
		  radarId: '',
		  objects: objects
			.filter(obj => obj.typeName !== 'Radar' && obj.typeName !== 'Wall')
			.map(obj => ({
			  id: obj.id,
			  typeValue: obj.typeValue,
			  // 只需保留画布中的位置信息
			  canvasVertices: [{x: obj.position.x, y: obj.position.y}]  // 简单返回中心点
			}))
		};
	  }
	// 有雷达时，返回完整的雷达工作信息  
  const objectsInBoundary = getObjectsInBoundary(objects, radar);
  const objectsData = objectsInBoundary.map(obj => {  // 修改这里的解构和使用
    return {
      id: obj.id,
      typeValue: obj.typeValue,
      radarVertices: obj.radarVertices
    };
  });

  return {
    radarId: radar.id,
    mode: radar.mode,
    boundaryVertices: getRadarBoundaryVertices(radar),
    objects: objectsData
  };
}