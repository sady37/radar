// stores/types.ts
export interface Point {
  x: number;
  y: number;
}

export interface Size {
  length: number;
  width: number;
}

export interface ObjectProperties {
  typeValue?: number;    // 新增：雷达定义的类型值 1-Other,2-bed,3-exclude,4-door,5-monitorBed
  height?: number;
  mode?: "ceiling" | "wall";
  isMonitored?: boolean;
  showBoundary?: boolean;
  showSignal?: boolean;
  borderOnly?: boolean;
  boundary?: {
    // 添加 boundary 属性
    leftX: number;
    rightX: number;
    frontY: number;
    rearY: number;
  };
  // 人物相关属性
  posture?: number; // 姿态
  isWarning?: boolean; // 警告状态
}

export interface RadarObject {
  id: string;
  type: string;
  name: string;
  position: Point;
  size: Size;
  rotation: number;
  isLocked: boolean;
  properties: ObjectProperties;
}

export interface RadarPosition {
	h: number       // 水平方向位置，左负右正
	v: number       // 垂直方向位置，下负上正
	height: number  // 雷达安装高度
  }
/*
export interface RadarBoundary {
  v1: Point; // (-,-)
  v2: Point; // (+,-)
  v3: Point; // (-,+)
  v4: Point; // (+,+)
}
*/

export interface RadarBoundary {
	// 水平方向边界
	hLeft: number    // 替代 leftX
	hRight: number   // 替代 rightX
	// 垂直方向边界
	vFront: number   // 替代 frontY
	vRear: number    // 替代 rearY
  }

export interface BoundarySettings {
  ceiling: {
    leftX: number; // 左边界，正值
    rightX: number; // 右边界，负值
    topY: number; // 上边界，负值
    bottomY: number; // 下边界，正值
  };
  wall: {
    leftX: number; // 左边界，正值
    rightX: number; // 右边界，负值
    topY: number; // 固定为0
    bottomY: number; // 下边界，正值
  };
}

export interface RadarSettings {
  mode: "ceiling" | "wall";
  height: number;
  position: Point;
  rotation: number;
  boundary: RadarBoundary;
  showBoundary: boolean;
  showSignal: boolean;
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

// 可以添加一些辅助的枚举定义
export enum PersonEvent {
  None = 0, // 无事件
  EnterRoom = 1, // 进入房间
  LeaveRoom = 2, // 离开房间
  EnterArea = 3, // 进入区域
  LeaveArea = 4, // 离开区域
}

export enum SleepState {
  Undefined = 0, // 未定义 00
  LightSleep = 1, // 浅睡 01
  DeepSleep = 2, // 深睡 10
  Awake = 3, // 清醒 11
}
