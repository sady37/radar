
export interface Point {
	x: number;
	y: number;
  }

export interface ObjectProperties {
    // 基础属性(所有对象必需)
	typeValue: number;    // 类型值(1-Other, 2-bed等)
	typeName: string;     // 类型名称
	id: string;
	name: string;
	position: Point; 
	isLocked: boolean;

	
  // 雷达特有属性
  HFOV?: number;    
  VFOV?: number;        
  rotation: number;
  mode?: "ceiling" | "wall";

  // 按模式分组的属性
  ceiling: {
    height: {
      min: number;   // 150
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
      min: number;   // 150
      max: number;   // 330
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
