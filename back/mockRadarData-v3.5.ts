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
	private RadarBoundaryMargin = 20;  // 雷达边界余量，现有的
	private BedMargin = 10;           // 床位边界余量，新增, 用于生成床上位置,减少出界概率
	private vitalStateStartTime = 0;
    private currentVitalState: string | null = null;
   
	constructor(config: RadarServiceConfig = {}) {
	  this.config = {
		vitalSignProbability: {
		  danger: 0.5,
		  warning: 0.15,
		  normal: 0.3,
		  undefined: 0.05,
		  ...config.vitalSignProbability
		},
		areaProbability: { 
		  bed: 0.8,      // 床上区域概率,l因为床上面积较小，所以要求概率较高以保证出现在床上的概率
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
	
	  this.radarObjects = this.roomLayout.objects.map(obj => {
		if (obj.typeName === 'Radar') {
		  return {
			...obj,
			position: { h: 0, v: 0 },
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
	  getValidPosition: (): RadarPoint | null => {
		const radar = this.radarObjects.find(obj => obj.typeName === 'Radar');
		if (!radar) return null;
	
		const mode = radar.mode || 'ceiling';
		const boundary = mode === 'ceiling' ? radar.ceiling.boundary : radar.wall.boundary;
		
		// 先决定是否应该在床上 
		const shouldBeInBed = Math.random() < this.config.areaProbability.bed;
		let attempts = 0;
		const maxAttempts = 50;
	
		do {
			let position: RadarPoint | null = null;
		  
		  if (shouldBeInBed) {
			// 尝试生成床上的位置
			const bed = this.radarObjects.find(obj => obj.typeName === 'Bed');
			if (bed) {
			  // 在床的范围内生成位置
			  const randomOffset = {
				h: (Math.random() - 0.5) * (bed.width - 2 * this.BedMargin),
				v: (Math.random() - 0.5) * (bed.length - 2 * this.BedMargin)
			  };
			  position = {
				h: bed.position.h + randomOffset.h,
				v: bed.position.v + randomOffset.v
			  };
			}
		  }
	
		  // 如果不是床上位置或者床上位置生成失败，使用原有的有效位置生成逻辑
		  if (!position) {
			const effectiveWidth = boundary.leftH + boundary.rightH - 2 * this.RadarBoundaryMargin;
			const effectiveDepth = mode === 'ceiling' ? 
			  boundary.frontV + boundary.rearV - 2 * this.RadarBoundaryMargin :
			  boundary.frontV - this.RadarBoundaryMargin;

		      position = {
		        h: Math.random() * effectiveWidth - (boundary.rightH - this.RadarBoundaryMargin),
		        v: mode === 'ceiling' ?
		           Math.random() * effectiveDepth - (boundary.rearV - this.RadarBoundaryMargin) :
		           Math.random() * (boundary.frontV - this.RadarBoundaryMargin)
		      };
		  }
	
		  attempts++;
		  // 验证位置是否有效
		  if (shouldBeInBed === this.areaSystem.isInBedArea(position) && 
			  !this.areaSystem.isInForbiddenArea(position)) {
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
   
		  // 使用内缩的床位范围
		  return Math.abs(localX) <= (obj.width/2 - this.BedMargin) && 
		  Math.abs(localY) <= (obj.length/2 - this.BedMargin);
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
   
		  return Math.abs(localX) <= obj.width/2 && Math.abs(localY) <= obj.length/2;
		});
	  }
	};
   
	// ================ 行为生成系统 ================
	private behaviorSystem = {
	  generatePosture: (position: RadarPoint): number => {
		const inBed = this.areaSystem.isInBedArea(position);
		
		if (inBed) {
		  const bedPostures = [
			{ posture: PersonPosture.Lying, weight: 60 },
			{ posture: PersonPosture.SitUpBed, weight: 15 },
			{ posture: PersonPosture.SitUpBedSuspect, weight: 10 },
			{ posture: PersonPosture.SitUpBedConfirm, weight: 15 }
		  ];
		  return this.behaviorSystem.getWeightedRandomPosture(bedPostures);
		} else {
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
   
		// 应用渐变
		if (!this.lastVitalData || !newVital) {
		  this.lastVitalData = newVital;
		  return newVital;
		}
   
		const smoothVital: VitalSignData = {
		  type: 0,
		  heartRate: Math.floor(this.lastVitalData.heartRate + (newVital.heartRate - this.lastVitalData.heartRate) * 0.3),
		  breathing: Math.floor(this.lastVitalData.breathing + (newVital.breathing - this.lastVitalData.breathing) * 0.3),
		  sleepState: newVital.sleepState
		};
   
		this.lastVitalData = smoothVital;
		return smoothVital;
	  },
   
	  generateVitalState: (): string => {
		const now = Date.now();

		  // 如果已有状态，检查是否需要继续保持
		  if (this.currentVitalState) {
			const duration = now - this.vitalStateStartTime;
			
			if (this.currentVitalState === 'danger' && duration < 10000) {  // danger 持续10秒
			  return 'danger';
			}
			if (this.currentVitalState === 'warning' && duration < 5000) {  // warning 持续5秒
			  return 'warning';
			}
		}

		  // 生成新状态
		  const rand = Math.random();
		  const newState = (() => {
		    if (rand < 0.3) return 'danger';     // 降低危险概率到30%
		    if (rand < 0.5) return 'warning';    // 降低警告概率到20%
		    if (rand < 0.9) return 'normal';     // 提高正常概率到40%
		    return 'undefined';                  // 保持10%
		  })();

		  // 如果状态改变，记录开始时间
		  if (newState !== this.currentVitalState) {
		    this.currentVitalState = newState;
		    this.vitalStateStartTime = now;
		  }
		  return newState;
		
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
   
	private isValidBedPosture(posture: number | null): boolean {
		if (posture === null) return false;
		return posture === PersonPosture.Lying ||
			   posture === PersonPosture.SitUpBed ||
			   posture === PersonPosture.SitUpBedSuspect ||
			   posture === PersonPosture.SitUpBedConfirm;
	  }
	  
	  private isValidGroundPosture(posture: number | null): boolean {
		if (posture === null) return false;
		return posture === PersonPosture.Walking ||
			   posture === PersonPosture.Standing ||
			   posture === PersonPosture.Sitting ||
			   posture === PersonPosture.FallSuspect ||
			   posture === PersonPosture.FallConfirm ||
			   posture === PersonPosture.SitGroundSuspect ||
			   posture === PersonPosture.SitGroundConfirm;
	  }

	// ================ 主要逻辑部分 ================
	generateMockTrackData(): PersonData[] {
		const currentTime = Date.now();
		
		if (!this.currentPosition) {
		  this.currentPosition = this.areaSystem.getValidPosition();
		  if (!this.currentPosition) return [];
		}
		 
		const inBed = this.areaSystem.isInBedArea(this.currentPosition);
		
		// 姿态更新检查
		if (this.currentPosture === null || 
			(currentTime - this.lastPostureChangeTime) >= 
			((inBed ? this.bedPostureDuration : this.postureDuration) * 1000) ||
			(inBed && !this.isValidBedPosture(this.currentPosture)) ||   
			(!inBed && !this.isValidGroundPosture(this.currentPosture))   
		) {
		  
		  // 更新位置和姿态
		  this.currentPosition = this.areaSystem.getValidPosition() || this.currentPosition;
		  this.currentPosture = this.behaviorSystem.generatePosture(this.currentPosition);
		  this.lastPostureChangeTime = currentTime;
		  
		  // 更新持续时间
		  if (this.currentPosture === PersonPosture.FallConfirm || 
			  this.currentPosture === PersonPosture.SitGroundConfirm) {
			this.postureDuration = 15;     // 跌倒和坐地确认持续15秒
		  } else if (this.currentPosture === PersonPosture.Lying) {
			this.postureDuration = 30;     // 躺卧持续30秒
		  } else {
			this.postureDuration = 5;      // 其他姿态持续5秒，避免太频繁切换
		  }
		}  // 这里缺少了结束括号
	  
		const remainTime = Math.floor(
		  ((inBed ? this.bedPostureDuration : this.postureDuration) * 1000 - 
		  (currentTime - this.lastPostureChangeTime)) / 1000
		);
		 
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
		 
		// 生理指标生成
		if (inBed && this.currentPosture === PersonPosture.Lying) {
		  this.vital = this.behaviorSystem.generateVitalData(this.currentPosture);
		} else {
		  this.vital = null;
		  this.lastVitalData = null; // 重置生理指标历史数据
		}
		 
		return [personData];  // 确保函数总是返回一个数组
	  }
   
	// ================ 数据流控制 ================
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
	  this.lastVitalData = null;
	  this.currentPosition = null;
	  this.currentPosture = null;
	  this.lastPostureChangeTime = Date.now();

	}
   }