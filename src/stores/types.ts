
//src/stores/types.ts
export interface Point {
	x: number;
	y: number;
  }

  export interface RadarPoint {
	h: number;
	v: number;
  }

export interface ObjectProperties {
    // 基础属性(所有对象必需)
	typeValue: number;    // 类型值(1-Other, 2-bed等)
	typeName: string;     // 类型名称
	id: string;
	name: string;
	position: Point;     //中心点坐标
	isLocked: boolean;

	
  // 雷达特有属性
  HFOV?: number;    
  VFOV?: number;        
  rotation: number;
  mode?: "ceiling" | "wall";

  // 按模式分组的属性
  ceiling: {
    height: {
      min: number;   // 0
      max: number;   // 330
      default: number; // 280
      step: number;  // 10
    };
    boundary: {
      leftH: number;  // 300
      rightH: number; // 300
      frontV: number; // 200
      rearV: number;  // 200
    };
  };
  wall: {
    height: {
      min: number;   // 0
      max: number;   // 180
      default: number; // 150
      step: number;  // 10
    };
    boundary: {
      leftH: number;  // 300
      rightH: number; // 300
      frontV: number; // 400
      rearV: number;  // 0
    };
  };
  showBoundary?: boolean;
  showSignal?: boolean;

	// 其他对象特有属性
	length: number;
	width: number;
	isMonitored?: boolean;  // 床
	borderOnly?: boolean;   // Other
}

export interface RobjectProperties extends Omit<ObjectProperties, 'position'> {
	position: RadarPoint;
  }

// 人员数据接口
export interface PersonData {
  id: number; // 0-7 或 88(无人)
  position: {
    x: number; // 逻辑单位
    y: number; // 逻辑单位
    z: number; // 逻辑单位
  };
  remainTime: number; // 0-60秒
  posture: number; // 0-11 姿态
  event: number; // 0-4 事件类型
  areaId: number; // 区域ID
}

// 生理指标数据接口
export interface VitalSignData {
  type: number; // 0: 实时呼吸心率
  breathing: number; // 呼吸值(次/分钟)
  heartRate: number; // 心率值(次/分钟)
  sleepState: number; // bit 7&6: 睡眠状态 (00:未定义 01:浅睡 10:深睡 11:清醒)
}

// 添加生理状态相关的枚举
export enum VitalStatus {
	Undefined = 'undefined',
	Normal = 'normal',
	Warning = 'warning',
	Danger = 'danger'
  }


  export enum SleepState {
	Undefined = 0, // 未定义 00
	LightSleep = 1, // 浅睡 01
	DeepSleep = 2, // 深睡 10
	Awake = 3, // 清醒 11
  }

// 可以添加一些辅助的枚举定义
export enum PersonEvent {
  None = 0, // 无事件
  EnterRoom = 1, // 进入房间
  LeaveRoom = 2, // 离开房间
  EnterArea = 3, // 进入区域
  LeaveArea = 4, // 离开区域
}



export enum PersonPosture {
	Init = 0, // 初始化
	Walking = 1, // 行走
	FallSuspect = 2, // 疑似跌倒
	Sitting = 3, // 蹲坐
	Standing = 4, // 站立
	FallConfirm = 5, // 跌倒确认
	Lying = 6, // 卧
	SitGroundSuspect = 7, // 疑似坐地
	SitGroundConfirm = 8, // 确认坐地
	SitUpBed = 9, // 普通床上坐起
	SitUpBedSuspect = 10, // 疑似床上坐起
	SitUpBedConfirm = 11, // 确认床上坐起
  }

  export const POSTURE_LABELS: Record<number, string> = {
	0: "Init",
	1: "Walking",
	2: "FallSuspect",
	3: "Sitting",
	4: "Standing",
	5: "FallConfirm",
	6: "Lying",
	7: "SitGroundSuspect",
	8: "SitGroundConfirm",
	9: "SitUpBed",		// 普通床上坐起
	10: "SitUpBedSuspect",  // 疑似床上坐起,monitorBed
	11: "SitUpBedConfirm", // 确认床上坐起,monitorBed
  };



export interface PostureIconConfig {
	type: "svg" | "default";  // 允许两种类型
	iconPath: string;
	size: number;
	showLabel: boolean;
  }


  
// 修改相关接口
export interface RadarBoundaryVertices {
	v1: RadarPoint;  // minH, minV
	v2: RadarPoint;  // minV,sec min H
	v3: RadarPoint;  // minH,sec minV
	v4: RadarPoint;  // 
  }

  // 定义雷达坐标点接口
export interface RadarPoint {
		h: number;  // 雷达坐标系中的水平位置
		v: number;  // 雷达坐标系中的垂直位置
  }


  export interface RadarReport {
	// 雷达信息
	typeValue: number;    // 类型值(1-Other, 2-bed等)
	typeName: string;     // 类型名称
	id: string;
	name: string;
	mode: 'ceiling' | 'wall';
	// 根据当前模式只保留相应配置
	config: {
	  height: {
		default: number;    // 当前高度
		min: number;
		max: number;
		step: number;
	  };
	  boundary: {
		leftH: number;
		rightH: number;
		frontV: number;
		rearV: number;
	  };
	};
	// 边界信息
	boundaryVertices: {
		v1: RadarPoint;  // minH, minV
		v2: RadarPoint;  // minV,sec min H
		v3: RadarPoint;  // minH,sec minV
		v4: RadarPoint;  // 
	};
	// 边界内物体信息
	objects: Array<{
		typeValue: number;    // 类型值(1-Other, 2-bed等)
		typeName: string;     // 类型名称
		id: string;
		name: string;
	  radarVertices: RadarPoint[];
	}>;
   }


  export interface RoomLayout {
	// 固定物体（除雷达外）
	objects: ObjectProperties[];
	// 雷达配置（可选）
	radar?: ObjectProperties;
  } 