// src/utils/mockRadarData.ts

import { 
	type PersonData, 
	type VitalSignData, 
	type Point, 
	type RadarPoint,
	type RobjectProperties,
	type RoomLayout,
	type RadarBoundaryVertices,
	PersonPosture,
  } from "../stores/types";
  import { toRadarCoordinate, toCanvasCoordinate, isPointInBoundary } from "./radarUtils";
  import { getHeartRateStatus, getBreathingStatus } from "./postureIcons";
  import rawTestLayout from '../config/test_layout.json';
  
  // 配置接口定义
  interface RadarServiceConfig {
	vitalSignProbability?: {
	  danger: number;    
	  warning: number;   
	  normal: number;    
	  undefined: number; 
	};
	areaProbability?: {
	  bed: number;      // 床区域概率，默认0.6
	};
	duration?: {
	  bed: { min: number; max: number; };     
	  normal: { min: number; max: number; };   
	};
  }
  
  interface MovementState {
	startPosition: RadarPoint;
	endPosition: RadarPoint;
	startTime: number;
	duration: number;
	currentPosture: number;
	lastPostureChangeTime: number;
  }
  
  export class MockRadarService {
	// ================ 属性定义 ================
	private roomLayout: RoomLayout;
	private radarObjects: RobjectProperties[];  
	private config: Required<RadarServiceConfig>;
	private timer: number | null = null;
	private vitalTimer: number | null = null;
	private vital: VitalSignData | null = null;
	private lastVitalData: VitalSignData | null = null; // 用于生理指标渐变
	private movementState: MovementState | null = null;
	private lastPostureChangeTime = Date.now();
	private currentPosture: number | null = null;
	private currentPosition: RadarPoint | null = null;
	private postureDuration = 0;
	private bedPostureDuration = 0;
	private RadarBoundaryMargin = 20;    // 雷达边界余量
	private BedMargin = 10;              // 床位边界余量
	private vitalStateStartTime = 0;
	private currentVitalState: string | null = null;
  
	constructor(config: RadarServiceConfig = {}) {
	  // 默认配置初始化
	  this.config = {
		vitalSignProbability: {
		  danger: 0.3,    // 降低危险概率
		  warning: 0.2,   // 降低警告概率
		  normal: 0.4,    // 提高正常概率
		  undefined: 0.1,
		  ...config.vitalSignProbability
		},
		areaProbability: { 
		  bed: 0.5,    // 50%概率在确保床上,+50%概率在雷达范围内随机位置，仍有可能在床，总概率为0.6
		  ...config.areaProbability 
		},
		duration: {
		  bed: { min: 8000, max: 15000 },
		  normal: { min: 5000, max: 10000 },
		  ...config.duration
		}
	  };
  
	  // 加载布局并转换坐标系
	  this.roomLayout = {
		objects: rawTestLayout.objects
	  } as RoomLayout;
	 
	  const radar = this.roomLayout.objects.find(obj => obj.typeName === 'Radar');
	  if (!radar) throw new Error('Radar not found');
	
	  // 将所有物体坐标转换为雷达坐标系
	  this.radarObjects = this.roomLayout.objects.map(obj => {
		if (obj.typeName === 'Radar') {
		  return {
			...obj,
			position: { h: 0, v: 0 },   // 雷达位置为原点
			rotation: 0
		  } as RobjectProperties;
		} else {
		  const radarPos = toRadarCoordinate(obj.position.x, obj.position.y, radar);
		  return {
			...obj,
			position: { h: radarPos.h, v: radarPos.v },
			rotation: (obj.rotation - radar.rotation + 360) % 360
		  } as RobjectProperties;
		}
	  });	
	}

// ================ 区域管理系统 ================
private areaSystem = {
    // 获取有效位置：床中心或雷达范围内随机位置
    getValidPosition: (): RadarPoint | null => {
      const radar = this.radarObjects.find(obj => obj.typeName === 'Radar');
      if (!radar) return null;
      
      const mode = radar.mode || 'ceiling';
      const boundary = mode === 'ceiling' ? radar.ceiling.boundary : radar.wall.boundary;
      
      // 直接给0.6概率使用床位置
      if (Math.random() < 0.6) {
        const bed = this.radarObjects.find(obj => obj.typeName === 'Bed');
        if (bed) {
          return {
            h: bed.position.h, 
            v: bed.position.v
          };
        }
      }
      
      // 剩余0.4的概率在雷达范围内随机生成位置
      let attempts = 0;
      const maxAttempts = 50;
      
      do {
        const effectiveWidth = boundary.leftH + boundary.rightH - 2 * this.RadarBoundaryMargin;
        const effectiveDepth = mode === 'ceiling' ? 
          boundary.frontV + boundary.rearV - 2 * this.RadarBoundaryMargin :
          boundary.frontV - this.RadarBoundaryMargin;
      
        const position = {
          h: Math.random() * effectiveWidth - (boundary.leftH - this.RadarBoundaryMargin),
          v: mode === 'ceiling' ?
             Math.random() * effectiveDepth - (boundary.rearV - this.RadarBoundaryMargin) :
             Math.random() * (boundary.frontV - this.RadarBoundaryMargin)
        };
      
        if (!this.areaSystem.isInForbiddenArea(position)) {
          return position;
        }
      
        attempts++;
      } while (attempts < maxAttempts);
      
      return null;
    },  // 加上逗号

    // 检查位置是否在床区域
    isInBedArea: (position: RadarPoint): boolean => {
      return this.radarObjects.some(obj => {
        if (obj.typeValue !== 2 && obj.typeValue !== 5) return false;
        
        const dx = position.h - obj.position.h;
        const dy = position.v - obj.position.v;
        const rad = (-obj.rotation * Math.PI) / 180;
        const localX = dx * Math.cos(rad) - dy * Math.sin(rad);
        const localY = dx * Math.sin(rad) + dy * Math.cos(rad);
      
        return Math.abs(localX) <= obj.width/2 && Math.abs(localY) <= obj.length/2;
      });
    },  // 加上逗号
   
    // 检查位置是否在障碍物区域
    isInForbiddenArea: (position: RadarPoint): boolean => {
      return this.radarObjects.some(obj => {
        if (obj.typeValue !== 1 && obj.typeValue !== 3) return false;
        
        const dx = position.h - obj.position.h;
        const dy = position.v - obj.position.v;
        const rad = (-obj.rotation * Math.PI) / 180;
        const localX = dx * Math.cos(rad) - dy * Math.sin(rad);
        const localY = dx * Math.sin(rad) + dy * Math.cos(rad);
   
        return Math.abs(localX) <= obj.width/2 && Math.abs(localY) <= obj.length/2;
      });
    }
  };
// ================ 行为生成系统 ================
private behaviorSystem = {
    // 根据位置生成对应的姿态
    generatePosture: (position: RadarPoint): number => {
      const inBed = this.areaSystem.isInBedArea(position);
      
      if (inBed) {
        // 床上姿势集合及其权重
        const bedPostures = [
          { posture: PersonPosture.Lying, weight: 60 },        // 躺卧主要姿势
          { posture: PersonPosture.SitUpBed, weight: 15 },     // 普通床上坐起
          { posture: PersonPosture.SitUpBedSuspect, weight: 10 }, // 可疑床上坐起
          { posture: PersonPosture.SitUpBedConfirm, weight: 15 }  // 确认床上坐起
        ];
        return this.behaviorSystem.getWeightedRandomPosture(bedPostures);
      } else {
        // 地面姿势集合及其权重
        const roomPostures = [
          { posture: PersonPosture.Walking, weight: 10 },
          { posture: PersonPosture.Standing, weight: 15 },
          { posture: PersonPosture.SitGroundSuspect, weight: 10 },
          { posture: PersonPosture.SitGroundConfirm, weight: 20 },
          { posture: PersonPosture.FallSuspect, weight: 10 },
          { posture: PersonPosture.FallConfirm, weight: 20 },
          { posture: PersonPosture.Sitting, weight: 15 }
        ];
        return this.behaviorSystem.getWeightedRandomPosture(roomPostures);
      }
    },
   
    // 只在Lying姿态时生成生理指标
    generateVitalData: (posture: number): VitalSignData | null => {
      if (posture !== PersonPosture.Lying) return null;
   
      const vitalState = this.behaviorSystem.generateVitalState();
      const newVital = (() => {
        switch(vitalState) {
          case 'normal':
            return {
              type: 0,
              heartRate: Math.floor(Math.random() * (95 - 60) + 60),
              breathing: Math.floor(Math.random() * (20 - 12) + 12),
              sleepState: 128
            };
          case 'warning':
            return {
              type: 0,
              heartRate: Math.random() < 0.5 ? 
                Math.floor(Math.random() * (59 - 45) + 45) :
                Math.floor(Math.random() * (105 - 96) + 96),
              breathing: Math.random() < 0.5 ?
                Math.floor(Math.random() * (11 - 8) + 8) :
                Math.floor(Math.random() * (26 - 21) + 21),
              sleepState: 64
            };
          case 'danger':
            return {
              type: 0,
              heartRate: Math.random() < 0.5 ? 
                Math.floor(Math.random() * 45) :
                Math.floor(Math.random() * (150 - 105) + 105),
              breathing: Math.random() < 0.5 ?
                Math.floor(Math.random() * 8) :
                Math.floor(Math.random() * (40 - 26) + 26),
              sleepState: 192
            };
          default:
            return null;
        }
      })();

	  // 生理指标渐变处理
      if (!this.lastVitalData || !newVital) {
        this.lastVitalData = newVital;
        return newVital;
      }
   
      const smoothVital: VitalSignData = {
        type: 0,
        heartRate: Math.floor(this.lastVitalData.heartRate + 
          (newVital.heartRate - this.lastVitalData.heartRate) * 0.3),
        breathing: Math.floor(this.lastVitalData.breathing + 
          (newVital.breathing - this.lastVitalData.breathing) * 0.3),
        sleepState: newVital.sleepState
      };
   
      this.lastVitalData = smoothVital;
      return smoothVital;
    },
   
    // 生成生理指标状态，包含状态持续时间控制
    generateVitalState: (): string => {
      const now = Date.now();

      // 检查现有状态是否需要继续保持
      if (this.currentVitalState) {
        const duration = now - this.vitalStateStartTime;
        
        if (this.currentVitalState === 'danger' && duration < 10000) {  // danger持续10秒
          return 'danger';
        }
        if (this.currentVitalState === 'warning' && duration < 5000) {  // warning持续5秒
          return 'warning';
        }
      }

      // 生成新状态
      const rand = Math.random();
      const newState = (() => {
        if (rand < 0.3) return 'danger';     // 30%危险
        if (rand < 0.5) return 'warning';    // 20%警告
        if (rand < 0.9) return 'normal';     // 40%正常
        return 'undefined';                  // 10%未定义
      })();

      // 新状态记录开始时间
      if (newState !== this.currentVitalState) {
        this.currentVitalState = newState;
        this.vitalStateStartTime = now;
      }
      return newState;
    },
   
    // 根据权重随机选择姿势
    getWeightedRandomPosture: (postures: Array<{ posture: number; weight: number; }>): number => {
      const totalWeight = postures.reduce((sum, item) => sum + item.weight, 0);
      let random = Math.random() * totalWeight;
      
      for (const item of postures) {
        random -= item.weight;
        if (random <= 0) {
          return item.posture;
        }
      }
      return postures[0].posture;
    }
  };

  // ================ 主要逻辑部分 ================
  generateMockTrackData(): PersonData[] {
    const currentTime = Date.now();
    
    // 初始化位置或位置无效时重新生成
    if (!this.currentPosition) {
      this.currentPosition = this.areaSystem.getValidPosition();
      if (!this.currentPosition) return [];
    }
   
    const inBed = this.areaSystem.isInBedArea(this.currentPosition);
    
    // 姿态更新检查：姿态为空、持续时间到期、或位置与姿态不匹配时
    if (this.currentPosture === null || 
		(currentTime - this.lastPostureChangeTime) >= (this.postureDuration * 1000)) {
      
    // 生成新的位置
    this.currentPosition = this.areaSystem.getValidPosition();
    if (!this.currentPosition) return [];

    // 根据最终位置判断区域并生成对应姿态
    const isInBed = this.areaSystem.isInBedArea(this.currentPosition);
    this.currentPosture = this.behaviorSystem.generatePosture(this.currentPosition);
    this.lastPostureChangeTime = currentTime;
      
      // 设置不同姿态的持续时间
      if (this.currentPosture === PersonPosture.Lying) {
        this.postureDuration = 30;     // 躺卧持续30秒，期间生成生理指标
      } else if (this.currentPosture === PersonPosture.FallConfirm || 
                 this.currentPosture === PersonPosture.SitGroundConfirm) {
        this.postureDuration = 15;     // 跌倒和坐地确认持续15秒
      } else {
        this.postureDuration = 5;      // 其他姿态持续5秒
      }
    }
   
    // 计算剩余时间
    const remainTime = Math.floor(
      ((inBed ? this.bedPostureDuration : this.postureDuration) * 1000 - 
      (currentTime - this.lastPostureChangeTime)) / 1000
    );
   
    // 构建人员数据
    const personData: PersonData = {
      id: 1,
      position: {
        x: this.currentPosition.h,
        y: this.currentPosition.v,
        z: Math.floor(Math.random() * 200 + 50)
      },
      remainTime,
      posture: this.currentPosture,
      event: 0,
      areaId: 0
    };
   
    // 生理指标生成：只在Lying姿态时生成
    if (this.currentPosture === PersonPosture.Lying) {
      this.vital = this.behaviorSystem.generateVitalData(this.currentPosture);
    } else {
      this.vital = null;
      this.lastVitalData = null;
    }
   
    return [personData];
  }
   
  // ================ 数据流控制 ================
  startMockDataStream(
    onTrackData: (data: PersonData[]) => void,
    onVitalData: (data: VitalSignData) => void,
  ): void {
    this.stopDataStream();
    
    // 每秒更新人员数据
    this.timer = window.setInterval(() => {
      const trackData = this.generateMockTrackData();
      onTrackData(trackData);
    }, 1000);
   
    // 每2秒更新生理指标
    this.vitalTimer = window.setInterval(() => {
      if (this.vital) {
        onVitalData(this.vital);
      }
    }, 2000);
  }
   
  // 停止数据流并清理状态
  stopDataStream(): void {
    if (this.timer) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
    if (this.vitalTimer) {
      window.clearInterval(this.vitalTimer);
      this.vitalTimer = null;
    }
    // 清理所有状态
    this.vital = null;
    this.lastVitalData = null;
    this.currentPosition = null;
    this.currentPosture = null;
    this.lastPostureChangeTime = Date.now();
    this.currentVitalState = null;
    this.vitalStateStartTime = 0;
  }
}


	