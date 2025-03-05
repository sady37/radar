// src/utils/radarUtils.ts
/**
 ** 画布坐标系规则：
 *- 原点在画布顶部中心 
 *- x轴：向右为负(-),向左为正(+)
 *- y轴：向下为正(+),向上为负(-) 
 *  计算物体相对于雷达坐标系的顶点坐标
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
 import type { RadarView, RadarProperties } from "../stores/types";

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

//将人的雷达坐标转换为画布坐标
export function toCanvasCoordinate(radarPoint: RadarPoint, radar: ObjectProperties): Point {
    const rad = (radar.rotation * Math.PI) / 180;
    // 先旋转
    const rotated = {
        x: radarPoint.h * Math.cos(rad) - radarPoint.v * Math.sin(rad),
        y: radarPoint.h * Math.sin(rad) + radarPoint.v * Math.cos(rad)
    };
    // 再平移
    return {
        x: radar.position.x + rotated.x,
        y: radar.position.y + rotated.y
    };
}

export function toRadarCoordinate(canvasX: number, canvasY: number, radar: ObjectProperties): RadarPoint {
    // 先平移到原点
    const dx = canvasX - radar.position.x;
    const dy = canvasY - radar.position.y;
    // 再反向旋转
    const rad = (-radar.rotation * Math.PI) / 180;
    return {
        h: dx * Math.cos(rad) - dy * Math.sin(rad),
        v: dx * Math.sin(rad) + dy * Math.cos(rad)
    };
}


//radarView
/**
 * 从雷达对象和场景中的其他对象生成雷达视图配置
 * @param radar - 雷达对象属性
 * @param objects - 场景中的所有对象
 * @returns 雷达视图配置
 */
export function generateRadarView(radar: ObjectProperties, objects: ObjectProperties[]): RadarView {
	// 基本配置
	const radarView: RadarView = {
	  radar_install_style: radar.mode === "ceiling" ? "0" : "1",
	  radar_install_height: String(Math.round(
		radar.mode === "ceiling" 
		  ? radar.ceiling.height.default / 10 
		  : radar.wall.height.default / 10
	  )),
	  rectangle: formatRectangle(radar)
	};
	
	// 处理区域配置
	const relevantObjects = objects.filter(obj => 
	  obj.id !== radar.id && 
	  ['Bed', 'TV', 'Door', 'Other', 'Exclude'].includes(obj.typeName)
	);
	
	// 为每个相关对象生成区域配置
	relevantObjects.forEach((obj, index) => {
		// 计算对象在雷达坐标系中的顶点
		const vertices = getObjectVertices(obj, radar);
		if (vertices.length === 4) {
		  const isInBoundary = vertices.some(vertex => isPointInBoundary(vertex, radar));
		  if (isInBoundary) {
			const areaType = getAreaTypeForObject(obj);
			const areaKey = getAreaKeyForObject(obj);
			
			// 格式化区域配置
			radarView[areaKey] = formatAreaConfig(index, areaType, vertices);
		  }
		}
	  });
	  
	  return radarView;
  }
  
  /**
   * 获取对象的区域类型
   */
  function getAreaTypeForObject(obj: ObjectProperties): number {
	if (obj.typeName === 'Bed') return obj.isMonitored ? 5 : 2;
	if (obj.typeName === 'Door') return 4;
	if (obj.typeName === 'TV' || obj.typeName === 'Exclude') return 3;
	return 1; // Other or default
  }
  
  /**
   * 获取对象的区域键名
   */
  function getAreaKeyForObject(obj: ObjectProperties): string {
	return `declare_area_${obj.typeName === obj.name ? obj.name : obj.typeName + obj.name}`;
  }
  
  /**
   * 格式化雷达矩形边界
   */
  function formatRectangle(radar: ObjectProperties): string {
	const mode = radar.mode || 'ceiling';
	const boundary = mode === 'ceiling' ? radar.ceiling.boundary : radar.wall.boundary;
	
	// 根据雷达模式生成边界顶点
	let vertices = [];
	if (mode === 'ceiling') {
	  vertices = [
		{ h: -boundary.leftH, v: -boundary.rearV },
		{ h: boundary.rightH, v: -boundary.rearV },
		{ h: -boundary.leftH, v: boundary.frontV },
		{ h: boundary.rightH, v: boundary.frontV }
	  ];
	} else {
	  vertices = [
		{ h: -boundary.leftH, v: 0 },
		{ h: boundary.rightH, v: 0 },
		{ h: -boundary.leftH, v: boundary.frontV },
		{ h: boundary.rightH, v: boundary.frontV }
	  ];
	}
	
	// 格式化为 {x1,y1,x2,y2,x3,y3,x4,y4} 格式
	return `{${vertices.map(v => `${Math.round(v.h)},${Math.round(v.v)}`).join(',')}}`;
  }
  
  /**
   * 格式化区域配置
   */
  function formatAreaConfig(areaId: number, areaType: number, vertices: RadarPoint[]): string {
	// 格式化为 {areaId,areaType,x1,y1,x2,y2,x3,y3,x4,y4}
	return `{${areaId},${areaType},${vertices.map(v => `${Math.round(v.h)},${Math.round(v.v)}`).join(',')}}`;
  }
  
  /**
   * 比较雷达视图和雷达属性，生成需要安装的配置差异
   */
  export function compareConfigs(radarView: RadarView, radarProperties: Record<string, string>): Record<string, string> {
	const differences: Record<string, string> = {};
	
	// 检查基本配置
	const basicKeys = ['radar_install_style', 'radar_install_height', 'rectangle'];
	basicKeys.forEach(key => {
	  if (radarView[key] !== radarProperties[key]) {
		differences[key] = radarView[key];
	  }
	});
	
	// 检查区域配置
	Object.keys(radarView).forEach(key => {
	  if (key.startsWith('declare_area_') && radarView[key] !== radarProperties[key]) {
		differences[key] = radarView[key];
	  }
	});
	
	// 检查需要删除的区域
	Object.keys(radarProperties).forEach(key => {
	  if (key.startsWith('declare_area_') && !radarView[key]) {
		// 使用空区域类型0表示删除
		const areaId = parseInt(key.replace('declare_area_', ''));
		differences[key] = `{${areaId},0,0,0,0,0,0,0,0,0}`;
	  }
	});
	
	return differences;
  }


/**
 * 解析雷达边界字符串为边界值对象
 * 例如: "{-300,-200,300,-200,-300,200,300,200}" 
 * @param boundaryStr 边界字符串
 * @returns 包含leftH, rightH, frontV, rearV的对象
 */
export function parseBoundaryString(boundaryStr: string) {
	// 移除大括号并分割字符串
	const values = boundaryStr.replace(/[{}]/g, '').split(',').map(Number);
	
	// 如果分割后的值不足8个（4个顶点的x,y坐标），返回默认值
	if (values.length < 8) {
	  console.warn("边界字符串格式不正确:", boundaryStr);
	  return { leftH: 300, rightH: 300, frontV: 200, rearV: 200 };
	}
	
	// 根据雷达坐标系解析边界值
	// 顶点顺序通常是: 左上, 右上, 左下, 右下 (v1, v2, v3, v4)
	// v1={x1,y1}, v2={x2,y2}, v3={x3,y3}, v4={x4,y4}
	return {
	  leftH: Math.abs(values[2]),  // x2 (右上角的x坐标，正值)
	  rightH: Math.abs(values[0]), // x1 (左上角的x坐标，负值取绝对值)
	  frontV: values[7],           // y4 (右下角的y坐标)
	  rearV: Math.abs(values[1])   // y1 (左上角的y坐标，负值取绝对值)
	};
  }
  
  /**
   * 解析区域字符串为区域配置对象
   * 例如: "{0,5,-100,80,100,80,-100,180,100,180}"
   * @param areaStr 区域字符串
   * @param radar 雷达对象
   * @returns 区域配置对象
   */
  export function parseAreaString(areaStr: string, radar: ObjectProperties) {
	// 移除大括号并分割字符串
	const values = areaStr.replace(/[{}]/g, '').split(',').map(Number);
	
	// 区域字符串至少应该包含区域ID、类型和4个顶点的坐标
	if (values.length < 10) {
	  console.warn("区域字符串格式不正确:", areaStr);
	  return null;
	}
	
	const areaId = values[0];
	const areaType = values[1];
	
	// 提取顶点坐标 (雷达坐标系)
	const vertices = [
	  { h: values[2], v: values[3] }, // 顶点1
	  { h: values[4], v: values[5] }, // 顶点2
	  { h: values[6], v: values[7] }, // 顶点3
	  { h: values[8], v: values[9] }  // 顶点4
	];
	
	// 将雷达坐标系转换为画布坐标系
	const canvasVertices = vertices.map(vertex => toCanvasCoordinate(vertex, radar));
	
	return {
	  id: areaId,
	  type: areaType,
	  vertices: canvasVertices
	};
  }
  
  
