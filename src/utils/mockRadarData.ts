// src/utils/mockRadarData.ts
// ================ 引入和配置部分 ================
import { 
  type PersonData, 
  type VitalSignData, 
  type Point, 
  type RadarPoint, 
  type RobjectProperties,
  type RoomLayout,
  type RadarBoundaryVertices,
  PersonPosture ,
  } from "../stores/types";
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
  // ================ 属性定义 ================
  private roomLayout: RoomLayout;
  private radarObjects: RobjectProperties[];  // 存放转换后的对象，雷达坐标系h,v
  private config: Required<RadarServiceConfig>;
  private timer: number | null = null;
  private vitalTimer: number | null = null;
  private vital: VitalSignData | null = null;
  private movementState: MovementState | null = null;
  private lastPostureChangeTime = Date.now(); // 上次姿态变化的时间
  private currentPosture: number | null = null; // 当前姿态
  private currentPosition: RadarPoint | null = null;
  private postureDuration = 0; // 姿态持续时间，单位秒
  private bedPostureDuration = 0; // 床上姿态的特定持续时间，单位秒
  private RadarBoundaryMargin = 20; // 雷达边界余量

 constructor(config: RadarServiceConfig = {}) {
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

     // ================ 坐标转换系统 ================
      // 2. 加载原始布局
	  this.roomLayout = {
		objects: rawTestLayout.objects
	  } as RoomLayout;
   
	  // 3. 获取雷达对象
	  const radar = this.roomLayout.objects.find(obj => obj.typeName === 'Radar');
	  if (!radar) throw new Error('Radar not found');
  
	  // 所有对象转换到雷达坐标系
	  this.radarObjects = this.roomLayout.objects.map(obj => {
		if (obj.typeName === 'Radar') {
		  return {
			...obj,
			position: { h : 0, v : 0 },
			rotation: 0
		  }as RobjectProperties; // 强制类型转换为 RobjectProperties;
		} else {
		  const radarPos = toRadarCoordinate(obj.position.x, obj.position.y, radar);
		  return {
			...obj,
			position: { h: radarPos.h, v: radarPos.v },
			rotation: (obj.rotation - radar.rotation + 360) % 360
		  }as RobjectProperties;
		}
	  });
	}
  


 // ================ 区域管理系统 ================
/* private areaSystem = {
	isInValidRange: (position: RadarPoint): boolean => {
	  const radar = this.radarObjects.find(obj => obj.typeName === 'Radar');
	  if (!radar) return false;
  
	  const boundary = radar.ceiling.boundary;
	  return Math.abs(position.h) <= (boundary.leftH + this.RadarBoundaryMargin) && 
			 position.v >= -(boundary.rearV + this.RadarBoundaryMargin) && 
			 position.v <= (boundary.frontV + this.RadarBoundaryMargin);
	},
 
	isInBedArea: (position: RadarPoint): boolean => {
		const beds = this.radarObjects.filter(obj => 
		  obj.typeValue === 2 || obj.typeValue === 5
		);
	
		return beds.some(bed => {
		  // 计算相对于床中心的偏移
		  const dx = position.h - bed.position.h;
		  const dy = position.v - bed.position.v;
		  
		  // 将点转换到床的局部坐标系（逆旋转）
		  const rad = (-bed.rotation * Math.PI) / 180;
		  const localX = dx * Math.cos(rad) - dy * Math.sin(rad);
		  const localY = dx * Math.sin(rad) + dy * Math.cos(rad);
	
		  // 在局部坐标系中判断是否在床范围内
		  return Math.abs(localX) <= bed.width/2 && 
				 Math.abs(localY) <= bed.length/2;
		});
	  },

	  isInForbiddenArea: (position: RadarPoint): boolean => {
		return this.radarObjects.some(obj => {
		  if (obj.typeValue !== 1 && obj.typeValue !== 3) return false;
	
		  const dx = position.h - obj.position.h;
		  const dy = position.v - obj.position.v;
		  
		  const rad = (-obj.rotation * Math.PI) / 180;
		  const localX = dx * Math.cos(rad) - dy * Math.sin(rad);
		  const localY = dx * Math.sin(rad) + dy * Math.cos(rad);
	
		  return Math.abs(localX) <= obj.width/2 && 
				 Math.abs(localY) <= obj.length/2;
		});
	  },
	
  
	getValidPosition: (): RadarPoint | null => {
		const radar = this.radarObjects.find(obj => obj.typeName === 'Radar');
		if (!radar) return null;
		
		let position: RadarPoint;
		let attempts = 0;
		const maxAttempts = 50;
		const boundary = radar.ceiling.boundary;
	
		do {
		  // 直接在雷达边界范围内生成位置
		  position = {
			h: Math.random() * (boundary.leftH + boundary.rightH + 2 * this.RadarBoundaryMargin) 
			   - (boundary.rightH + this.RadarBoundaryMargin),
			v: Math.random() * (boundary.frontV + boundary.rearV + 2 * this.RadarBoundaryMargin) 
			   - (boundary.rearV + this.RadarBoundaryMargin)
		  };
		  attempts++;
		  
		  if (attempts >= maxAttempts) return null;
		} while (
		  !this.areaSystem.isInValidRange(position) || 
		  this.areaSystem.isInForbiddenArea(position)
		);
	
		return position;
	  }
	};
*/

private areaSystem = {
    // 修改获取有效位置的方法，考虑雷达边界和模式
    getValidPosition: (): RadarPoint | null => {
      const radar = this.radarObjects.find(obj => obj.typeName === 'Radar');
      if (!radar) return null;

      const mode = radar.mode || 'ceiling';
      const boundary = mode === 'ceiling' ? radar.ceiling.boundary : radar.wall.boundary;
      
      let attempts = 0;
      const maxAttempts = 50;

      do {
        const position = {
          h: Math.random() * (boundary.leftH + boundary.rightH + 2 * this.RadarBoundaryMargin) 
             - (boundary.rightH + this.RadarBoundaryMargin),
          v: mode === 'ceiling' ?
             Math.random() * (boundary.frontV + boundary.rearV + 2 * this.RadarBoundaryMargin) 
             - (boundary.rearV + this.RadarBoundaryMargin) :
             Math.random() * (boundary.frontV + this.RadarBoundaryMargin)
        };

        attempts++;
        
        // 检查位置是否在forbidden区域
        if (!this.areaSystem.isInForbiddenArea(position)) {
          return position;
        }
      } while (attempts < maxAttempts);

      return null;
    },

    isInBedArea: (position: RadarPoint): boolean => {
      return this.radarObjects.some(obj => {
        if (obj.typeValue !== 2 && obj.typeValue !== 5) return false;
        
        const dx = position.h - obj.position.h;
        const dy = position.v - obj.position.v;
        
        const rad = (-obj.rotation * Math.PI) / 180;
        const localX = dx * Math.cos(rad) - dy * Math.sin(rad);
        const localY = dx * Math.sin(rad) + dy * Math.cos(rad);

        return Math.abs(localX) <= obj.width/2 && 
               Math.abs(localY) <= obj.length/2;
      });
    },

    isInForbiddenArea: (position: RadarPoint): boolean => {
      return this.radarObjects.some(obj => {
        if (obj.typeValue !== 1 && obj.typeValue !== 3) return false;

        const dx = position.h - obj.position.h;
        const dy = position.v - obj.position.v;
        
        const rad = (-obj.rotation * Math.PI) / 180;
        const localX = dx * Math.cos(rad) - dy * Math.sin(rad);
        const localY = dx * Math.sin(rad) + dy * Math.cos(rad);

        return Math.abs(localX) <= obj.width/2 && 
               Math.abs(localY) <= obj.length/2;
      });
    }
  };

  
// ================ 行为生成系统 ================
  private behaviorSystem = {
  // 作为 behaviorSystem 的一个方法

  generatePosture: (position: RadarPoint): number => {
    const inBed = this.areaSystem.isInBedArea(position);
    
    if (inBed) {
      const bedPostures = [
        { posture: PersonPosture.Lying, weight: 40 },
        { posture: PersonPosture.SitUpBed, weight: 30 },
        { posture: PersonPosture.SitUpBedSuspect, weight: 15 },
        { posture: PersonPosture.SitUpBedConfirm, weight: 15 }
      ];
      return this.behaviorSystem.getWeightedRandomPosture(bedPostures);
    } else {
      const roomPostures = [
        { posture: PersonPosture.Walking, weight: 30 },
        { posture: PersonPosture.Standing, weight: 20 },
        { posture: PersonPosture.FallSuspect, weight: 20 },
        { posture: PersonPosture.FallConfirm, weight: 20 },
        { posture: PersonPosture.Sitting, weight: 10 }
      ];
      return this.behaviorSystem.getWeightedRandomPosture(roomPostures);
    }
  },


	generateVitalData: (posture: number): VitalSignData | null => {
		const vitalState = this.behaviorSystem.generateVitalState();
		// 只有卧床时才有生理指标
		if (posture !== PersonPosture.Lying) return null;
		
		switch(vitalState) {
		  case 'normal':
			return {
			  type: 0,
			  heartRate: Math.floor(Math.random() * (95 - 60) + 60),
			  breathing: Math.floor(Math.random() * (20 - 12) + 12),
			  sleepState: 128  // 深睡
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
			  sleepState: 64   // 浅睡
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
			  sleepState: 192  // 清醒
			};
		  default:
			return null;  // undefined 状态
		}
	  },

	
	  generateVitalState: (): string => {
		const rand = Math.random();
		if (rand < 0.3) return 'danger';     // 30%
		if (rand < 0.6) return 'warning';    // 30%
		if (rand < 0.9) return 'normal';     // 30%
		return 'undefined';                  // 10%
	  },

	  
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
 /* generateMockTrackData(): PersonData[] {
	const currentTime = Date.now();
	const radar = this.radarObjects.find(obj => obj.typeName === 'Radar');
	if (!radar) throw new Error('Radar not found');
  
	
	// 获取有效位置
	const position = this.areaSystem.getValidPosition();
	if (!position) {
	  console.warn('Could not find valid position');
	  return [];
	}
  
	let posture = this.currentPosture;
	const inBed = this.areaSystem.isInBedArea(position);
	
	// 检查是否需要更换姿态（时间到了或姿态与区域不匹配）
	if (posture === null || 
		(currentTime - this.lastPostureChangeTime) >= 
		((inBed ? this.bedPostureDuration : this.postureDuration) * 1000) ||
		(inBed && posture < PersonPosture.Lying) ||
		(!inBed && posture >= PersonPosture.Lying)) {
	  
	  // 生成新姿态
	  posture = this.behaviorSystem.generatePosture(position);
	  this.currentPosture = posture;
	  this.lastPostureChangeTime = currentTime;
	  
	  // 设置持续时间
	  this.postureDuration = Math.floor(Math.random() * 3 + 5);     // 5-8秒
	  this.bedPostureDuration = Math.floor(Math.random() * 7 + 8);  // 8-15秒
	
	}
  
	const personData: PersonData = {
	  id: 1,
	  position: {
		x: position.h,  // 注意：这里直接使用雷达坐标
		y: position.v,
		z: Math.floor(Math.random() * 200 + 50)
	  },
	  remainTime: 30,
	  posture: posture,
	  event: 0,
	  areaId: 0
	};
  
	// 生理指标
	if (this.areaSystem.isInBedArea(position) && posture === PersonPosture.Lying) {
	  this.vital = this.behaviorSystem.generateVitalData(posture);
	} else {
	  this.vital = null;
	}
  
	return [personData];
  }
*/

generateMockTrackData(): PersonData[] {
    const currentTime = Date.now();
    const radar = this.radarObjects.find(obj => obj.typeName === 'Radar');
    if (!radar) throw new Error('Radar not found');

    // 如果没有当前位置或需要更新位置
    if (!this.currentPosition) {
      this.currentPosition = this.areaSystem.getValidPosition();
      if (!this.currentPosition) {
        console.warn('Could not find valid position');
        return [];
      }
    }

    const inBed = this.areaSystem.isInBedArea(this.currentPosition);

    // 保持原有的姿态检查逻辑
    if (this.currentPosture === null || 
        (currentTime - this.lastPostureChangeTime) >= 
        ((inBed ? this.bedPostureDuration : this.postureDuration) * 1000) ||
        (inBed && this.currentPosture < PersonPosture.Lying) ||
        (!inBed && this.currentPosture >= PersonPosture.Lying)) {
      
      // 生成新的姿态和位置
      this.currentPosition = this.areaSystem.getValidPosition() || this.currentPosition;
      this.currentPosture = this.behaviorSystem.generatePosture(this.currentPosition);
      this.lastPostureChangeTime = currentTime;
      
      // 更新持续时间
      this.postureDuration = Math.floor(Math.random() * 5 + 5);     // 5-10秒
      this.bedPostureDuration = Math.floor(Math.random() * 7 + 8);  // 8-15秒
    }

    const personData: PersonData = {
      id: 1,
      position: {
        x: this.currentPosition.h,
        y: this.currentPosition.v,
        z: Math.floor(Math.random() * 200 + 50)
      },
      remainTime: Math.floor(((inBed ? this.bedPostureDuration : this.postureDuration) * 1000 - 
                  (currentTime - this.lastPostureChangeTime)) / 1000),
      posture: this.currentPosture,
      event: 0,
      areaId: 0
    };

    // 只有在床上且处于lying姿态时才生成生理指标
    if (inBed && this.currentPosture === PersonPosture.Lying) {
      this.vital = this.behaviorSystem.generateVitalData(this.currentPosture);
    } else {
      this.vital = null;
    }

    return [personData];
  }


  // ================ 数据流控制部分 ================
 /* startMockDataStream(
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
*/
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
    // 清理所有状态
    this.vital = null;
    this.currentPosition = null;
    this.currentPosture = null;
    this.lastPostureChangeTime = Date.now();
  }
}