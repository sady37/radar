// src/utils/mockRadarData.ts
import type { PersonData, VitalSignData, Point } from "../stores/types";
import { PersonPosture } from "../stores/types";


interface WeightedPosture {
  posture: number;
  weight: number;
}

export class MockRadarService {
	private timer: number | null = null;
	private vitalTimer: number | null = null;
	private vital: VitalSignData | null = null;
	private lastPersons: PersonData[] | null = null;
	
	private positionInterval = 1000;
	private vitalSignInterval = 2000;
  
  // 直接使用雷达坐标范围
  private radarBounds = {
    minH: -300,  // 右
    maxH: 300,   // 左
    minV: -200,  // 上
    maxV: 200    // 下
  };

  // 床的雷达坐标位置（需要转换现有床位置到雷达坐标系）
  private bedArea = {
    center: { h: 13, v: 2 },  // (47-60, 214-216) 转换到雷达坐标系
    length: 190,
    width: 90,
    rotation: 270
  };

  // 检查雷达坐标是否在床位区域
  private isInBedArea(h: number, v: number): boolean {
    // 相对床中心的坐标
    const dh = h - this.bedArea.center.h;
    const dv = v - this.bedArea.center.v;
    
    // 床旋转270度后的坐标变换
    const rotatedH = -dv;  // 顺时针旋转270度等于逆时针旋转90度
    const rotatedV = dh;
    
    // 检查是否在床范围内
    return Math.abs(rotatedH) <= this.bedArea.width/2 && 
           Math.abs(rotatedV) <= this.bedArea.length/2;
  }

  // 生成雷达坐标系中的位置
  private generatePosition(): { h: number, v: number } {
    if (Math.random() < 0.4) {  // 40%概率在床上
      // 在床的局部坐标系中生成位置
      const localH = (Math.random() - 0.5) * this.bedArea.width;
      const localV = (Math.random() - 0.5) * this.bedArea.length;
      
      // 旋转回雷达坐标系
      const h = this.bedArea.center.h - localV;  // 考虑床的270度旋转
      const v = this.bedArea.center.v + localH;
      
      return { h, v };
    }
    
    // 60%概率在其他位置
    return {
      h: Math.floor(Math.random() * (this.radarBounds.maxH - this.radarBounds.minH) + this.radarBounds.minH),
      v: Math.floor(Math.random() * (this.radarBounds.maxV - this.radarBounds.minV) + this.radarBounds.minV)
    };
  }

  // 根据雷达坐标系位置生成姿态
  private generateRandomPosture(position: { h: number, v: number }): number {
    if (this.isInBedArea(position.h, position.v)) {
      // 在床上的姿态
      const bedPostures: WeightedPosture[] = [
        { posture: PersonPosture.Lying, weight: 50 },          // 卧床
        { posture: PersonPosture.SitUpBed, weight: 20 },      // 床上坐起
        { posture: PersonPosture.SitUpBedSuspect, weight: 15 },// 疑似床上坐起
        { posture: PersonPosture.SitUpBedConfirm, weight: 15 } // 确认床上坐起
      ];
      return this.weightedRandom(bedPostures);
    } else {
      // 床外的姿态
      const normalPostures: WeightedPosture[] = [
        { posture: PersonPosture.Walking, weight: 40 },   // 行走
        { posture: PersonPosture.Standing, weight: 30 },  // 站立
        { posture: PersonPosture.Sitting, weight: 20 },   // 坐
        { posture: PersonPosture.FallSuspect, weight: 5 },// 疑似跌倒
        { posture: PersonPosture.FallConfirm, weight: 5 } // 确认跌倒
      ];
      return this.weightedRandom(normalPostures);
    }
  }

  // 生成生理数据
  private generateMockVitalData(): VitalSignData {
    // 根据MQTT文档定义的范围生成数据
    return {
      type: 0, // 实时呼吸心率
      breathing: Math.floor(Math.random() * (26 - 12) + 12), // 12-26 次/分钟
      heartRate: Math.floor(Math.random() * (95 - 60) + 60), // 60-95 次/分钟
      sleepState: this.generateSleepState()
    };
  }

  // 生成睡眠状态
  private generateSleepState(): number {
    const states = [
      64,   // 浅睡 01 左移6位
      128,  // 深睡 10 左移6位
      192   // 清醒 11 左移6位
    ];
    return states[Math.floor(Math.random() * states.length)];
  }

  // 随机事件生成
  private generateRandomEvent(): number {
    if (Math.random() > 0.2) return 0; // 80%概率无事件
    return Math.floor(Math.random() * 4) + 1; // 1-4的随机事件
  }

  // 权重随机选择器
  private weightedRandom(items: WeightedPosture[]): number {
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const item of items) {
      random -= item.weight;
      if (random <= 0) {
        return item.posture;
      }
    }
    return items[0].posture;
  }



  generateMockTrackData(): PersonData[] {
    const personCount = this.lastPersons?.length || Math.floor(Math.random() * 2) + 1;
    const persons: PersonData[] = [];

    for (let i = 0; i < personCount; i++) {
      let position: { h: number, v: number };
      let posture: number;

      // 80%概率保持上一次的状态
      if (this.lastPersons?.[i] && Math.random() < 0.8) {
        position = {
          h: this.lastPersons[i].position.x,  // 之前存的就是雷达坐标
          v: this.lastPersons[i].position.y
        };
        posture = this.lastPersons[i].posture;
      } else {
        position = this.generatePosition();
        posture = this.generateRandomPosture(position);
      }

      persons.push({
        id: i,
        position: {
          x: position.h,  // 雷达坐标 h 对应 position.x
          y: position.v,  // 雷达坐标 v 对应 position.y
          z: Math.floor(Math.random() * 200 + 50)  // 高度 50-250cm
        },
        remainTime: 30,
        posture: posture,
        event: this.generateRandomEvent(),
        areaId: Math.floor(Math.random() * 4)
      });

      // 更新生理数据，注意使用雷达坐标判断
      if (this.isInBedArea(position.h, position.v) && 
          [PersonPosture.Lying, PersonPosture.SitUpBed, 
           PersonPosture.SitUpBedSuspect, PersonPosture.SitUpBedConfirm].includes(posture)) {
        this.vital = this.generateMockVitalData();
      } else {
        this.vital = null;
      }
    }

    this.lastPersons = persons;
    return persons;
  }
	

    // 启动数据流
	startMockDataStream(
		onTrackData: (data: PersonData[]) => void,
		onVitalData: (data: VitalSignData) => void,
	  ): void {
		// 轨迹数据定时器 - 1秒更新
		const trackTimer = window.setInterval(() => {
		  const trackData = this.generateMockTrackData();
		  onTrackData(trackData);
		}, this.positionInterval);
	
		// 生理数据定时器 - 2秒更新
		const vitalTimer = window.setInterval(() => {
		  if (this.vital) {
			onVitalData(this.vital);
		  }
		}, this.vitalSignInterval);
	
		this.timer = trackTimer;
		this.vitalTimer = vitalTimer;
	  }
	
	  // 停止数据流
	  stopDataStream(): void {
		if (this.timer) {
		  window.clearInterval(this.timer);
		  this.timer = null;
		}
		if (this.vitalTimer) {
		  window.clearInterval(this.vitalTimer);
		  this.vitalTimer = null;
		}
		// 清理状态
		this.vital = null;
		this.lastPersons = null;
	  }

}


  

