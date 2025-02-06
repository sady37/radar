// src/utils/mockRadarData.ts
// ================ 引入和配置部分 ================
import type { PersonData, VitalSignData, Point, RadarPoint, ObjectProperties, RoomLayout } from "../stores/types";
import { PersonPosture } from "../stores/types";
import { toRadarCoordinate, toCanvasCoordinate, isPointInBoundary } from "./radarUtils";
import { getHeartRateStatus, getBreathingStatus } from "./postureIcons";
import rawTestLayout from '../config/test_layout.json';

interface RadarServiceConfig {
 vitalSignProbability?: {
   danger: number;    
   warning: number;   
   normal: number;    
   undefined: number; 
 };
 areaProbability?: {
   bed: number;      
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
 private roomLayout: RoomLayout;
 private config: Required<RadarServiceConfig>;
 private timer: number | null = null;
 private vitalTimer: number | null = null;
 private vital: VitalSignData | null = null;
 private movementState: MovementState | null = null;
 private lastPostureChangeTime = Date.now(); // 上次姿态变化的时间
 private currentPosture: number | null = null; // 当前姿态
 private postureDuration = 0; // 姿态持续时间，单位秒
 private bedPostureDuration = 0; // 床上姿态的特定持续时间，单位秒

 constructor(config: RadarServiceConfig = {}) {
   // 处理雷达模式
   this.roomLayout = {
	objects: rawTestLayout.objects,
	radar: rawTestLayout.objects.find(obj => obj.typeName === 'Radar') || undefined
  } as RoomLayout;
   this.config = {
     vitalSignProbability: {
       danger: 0.3,
       warning: 0.3,
       normal: 0.3,
       undefined: 0.1,
       ...config.vitalSignProbability
     },
     areaProbability: { 
       bed: 0.3, 
       ...config.areaProbability 
     },
     duration: {
       bed: { min: 8000, max: 15000 },
       normal: { min: 5000, max: 10000 },
       ...config.duration
     }
   };
 }
  // ================ 坐标转换系统 ================
  private coordSystem = {
    getValidPosition: (radar: ObjectProperties): RadarPoint => {
      let position: RadarPoint;
      let canvasPos: Point;
      const bed = this.roomLayout?.objects.find(obj => obj.typeName === 'Bed');
      const inBed = Math.random() < this.config.areaProbability.bed;

      do {
        if (inBed && bed) {
          const bedPos = toRadarCoordinate(bed.position.x, bed.position.y, radar);
          position = {
            h: bedPos.h + (Math.random() - 0.5) * bed.width,
            v: bedPos.v + (Math.random() - 0.5) * bed.length
          };
        } else {
          const boundary = radar.ceiling.boundary;
          position = {
            h: Math.random() * (boundary.leftH + boundary.rightH) - boundary.rightH,
            v: Math.random() * (boundary.frontV + boundary.rearV) - boundary.rearV
          };
        }
        canvasPos = toCanvasCoordinate(position, radar);
      }  while (!this.coordSystem.isValidPosition(position, canvasPos, radar));

      return position;
    },

    isValidPosition: (position: RadarPoint, canvasPos: Point, radar: ObjectProperties): boolean => {
      if (!isPointInBoundary(position, radar)) return false;

      // 检查是否在家具区域
      const furniture = this.roomLayout?.objects.filter(obj => 
        ['TV', 'Desk'].includes(obj.typeName)
      );

      return !furniture?.some(item => 
        Math.abs(canvasPos.x - item.position.x) <= item.width/2 && 
        Math.abs(canvasPos.y - item.position.y) <= item.length/2
      );
    }
  };

  // ================ 区域管理系统 ================
  private areaSystem = {
    isInBedArea: (point: RadarPoint, radar: ObjectProperties): boolean => {
      const canvasPos = toCanvasCoordinate(point, radar);
      const bed = this.roomLayout?.objects.find(obj => obj.typeName === 'Bed');
      
      return bed ? (
        Math.abs(canvasPos.x - bed.position.x) <= bed.width/2 && 
        Math.abs(canvasPos.y - bed.position.y) <= bed.length/2
      ) : false;
    },

    isInFurnitureArea: (point: Point): boolean => {
      const furniture = this.roomLayout?.objects.filter(obj => 
        ['TV', 'Desk'].includes(obj.typeName)
      );

      return furniture?.some(item => 
        Math.abs(point.x - item.position.x) <= item.width/2 && 
        Math.abs(point.y - item.position.y) <= item.length/2
      ) ?? false;
    }
  };

  // ================ 行为生成系统 ================
  private behaviorSystem = {
  // 作为 behaviorSystem 的一个方法
  weightedRandomPosture(postures: {posture: number, weight: number}[]): number {
    const totalWeight = postures.reduce((sum, item) => sum + item.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const item of postures) {
      random -= item.weight;
      if (random <= 0) {
        return item.posture;
      }
    }
    return postures[0].posture;
  },

  generatePosture(inBed: boolean): number {
    if (inBed) {
      const bedPostures = [
        {posture: PersonPosture.Lying, weight: 40},
        {posture: PersonPosture.SitUpBed, weight: 30},
        {posture: PersonPosture.SitUpBedSuspect, weight: 15},
        {posture: PersonPosture.SitUpBedConfirm, weight: 15}
      ];
      return this.weightedRandomPosture(bedPostures);  // 使用 this 调用
    } else {
      const roomPostures = [
        {posture: PersonPosture.Walking, weight: 40},
        {posture: PersonPosture.FallSuspect, weight: 20},
        {posture: PersonPosture.Sitting, weight: 20},
        {posture: PersonPosture.Standing, weight: 15},
        {posture: PersonPosture.FallConfirm, weight: 5}
      ];
      return this.weightedRandomPosture(roomPostures);  // 使用 this 调用
    }
  },

    generateVitalState: (): string => {
      const rand = Math.random();
      const prob = this.config.vitalSignProbability;
      if (rand < prob.danger) return 'danger';
      if (rand < prob.danger + prob.warning) return 'warning';
      if (rand < prob.danger + prob.warning + prob.normal) return 'normal';
      return 'undefined';
    },

    generateVitalData: (state: string): VitalSignData | null => {
      if (state === 'undefined') return null;

      let heartRate, breathing;
      switch(state) {
        case 'normal':
          heartRate = Math.floor(Math.random() * (95 - 60) + 60);
          breathing = Math.floor(Math.random() * (20 - 12) + 12);
          break;
        case 'warning':
          heartRate = Math.random() < 0.5 ? 
            Math.floor(Math.random() * (59 - 45) + 45) :
            Math.floor(Math.random() * (105 - 96) + 96);
          breathing = Math.random() < 0.5 ?
            Math.floor(Math.random() * (11 - 8) + 8) :
            Math.floor(Math.random() * (26 - 21) + 21);
          break;
        case 'danger':
          heartRate = Math.random() < 0.5 ? 
            Math.floor(Math.random() * 45) :
            Math.floor(Math.random() * (150 - 105) + 105);
          breathing = Math.random() < 0.5 ?
            Math.floor(Math.random() * 8) :
            Math.floor(Math.random() * (40 - 26) + 26);
          break;
        default:
          return null;
      }

      return {
        type: 0,
        heartRate,
        breathing,
        sleepState: heartRate < 65 ? 128 : heartRate > 75 ? 192 : 64
      };
    }
  };

  // ================ 主要逻辑部分 ================
 /* 
  generateMockTrackData(): PersonData[] {
    if (!this.roomLayout?.radar) throw new Error('Radar not initialized');
    const radar = this.roomLayout.radar;

    const position = this.coordSystem.getValidPosition(radar);
    const canvasPos = toCanvasCoordinate(position, radar);
    const inBed = this.areaSystem.isInBedArea(position, radar);

    const personData: PersonData = {
      id: 1,
      position: {
        x: canvasPos.x,
        y: canvasPos.y,
        z: Math.floor(Math.random() * 200 + 50)
      },
      remainTime: 30,
      posture: this.behaviorSystem.generatePosture(inBed),
      event: 0,
      areaId: 0
    };

    if (inBed && personData.posture == PersonPosture.Lying) {
      const vitalState = this.behaviorSystem.generateVitalState();
      this.vital = this.behaviorSystem.generateVitalData(vitalState);
    } else {
      this.vital = null;
    }

    return [personData];
  }
  */
  generateMockTrackData(): PersonData[] {
	const currentTime = Date.now();
	if (!this.roomLayout?.radar) throw new Error('Radar not initialized');
	const radar = this.roomLayout.radar;

	const position = this.coordSystem.getValidPosition(radar);
	const canvasPos = toCanvasCoordinate(position, radar);
	const inBed = this.areaSystem.isInBedArea(position, radar);

	let posture = this.currentPosture;
	if (posture === null || 
		(currentTime - this.lastPostureChangeTime) >= ((inBed ? this.bedPostureDuration : this.postureDuration) * 1000)) {
		// 更新姿态
		posture = this.behaviorSystem.generatePosture(inBed);
		this.currentPosture = posture;
		this.lastPostureChangeTime = currentTime;

		// 设置不同的持续时间（毫秒）
		this.postureDuration = Math.floor(Math.random() * 4 + 5); // 5-8秒
		this.bedPostureDuration = Math.floor(Math.random() * 3 + 8); // 8-10秒
	}

	const personData: PersonData = {
		id: 1,
		position: {
			x: canvasPos.x,
			y: canvasPos.y,
			z: Math.floor(Math.random() * 200 + 50)
		},
		remainTime: 30,
		posture: this.behaviorSystem.generatePosture(inBed),
		event: 0,
		areaId: 0
	};

	if (inBed && personData.posture === PersonPosture.Lying) {  // 严格等于Lying
		const vitalState = this.behaviorSystem.generateVitalState();
		this.vital = this.behaviorSystem.generateVitalData(vitalState);
	  } else {
		this.vital = null;
	  }

	return [personData];
}

  // ================ 数据流控制部分 ================
  startMockDataStream(
    onTrackData: (data: PersonData[]) => void,
    onVitalData: (data: VitalSignData) => void,
  ): void {
    this.stopDataStream();
    
    this.timer = window.setInterval(() => {
      const trackData = this.generateMockTrackData();
      onTrackData(trackData);
    }, 1000);

    this.vitalTimer = window.setInterval(() => {
      if (this.vital) {
        onVitalData(this.vital);
      }
    }, 2000);
  }

  stopDataStream(): void {
    if (this.timer) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
    if (this.vitalTimer) {
      window.clearInterval(this.vitalTimer);
      this.vitalTimer = null;
    }
    this.vital = null;
    this.movementState = null;
  }
} // 类结束