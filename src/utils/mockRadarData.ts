// src/utils/mockRadarData.ts
import type { PersonData, VitalSignData } from "../stores/types";
import { PersonEvent, SleepState } from "../stores/types";

export class MockRadarService {
  private timer: number | null = null;
  private positionInterval = 1000; // 1秒更新轨迹
  private vitalSignInterval = 2000; // 2秒更新生理指标

  /*
 generateMockTrackData(): PersonData {
   const hasTarget = Math.random() > 0.1  // 90%概率有人
   const event = this.generateRandomEvent()

   return {
     id: hasTarget ? Math.floor(Math.random() * 8) : 88,  // 0-7或88(无人)
     position: {
       x: Math.floor(Math.random() * 600 - 300),  // -300~300 逻辑单位
       y: Math.floor(Math.random() * 400 - 200),  // -200~200 逻辑单位
       z: Math.floor(Math.random() * 300)         // 0~300 逻辑单位
     },
     remainTime: 30,
     posture: this.generateRandomPosture(),
     event: event,
     areaId: event === PersonEvent.EnterArea || event === PersonEvent.LeaveArea 
       ? Math.floor(Math.random() * 4) 
       : 0
   }
 }
 */

  generateMockTrackData(): PersonData[] {
    const personCount = Math.floor(Math.random() * 3) + 1; // 1-3人
    const persons: PersonData[] = [];

    for (let i = 0; i < personCount; i++) {
      persons.push({
        id: i, // 0-7
        position: {
          x: Math.floor(Math.random() * 600 - 300),
          y: Math.floor(Math.random() * 400 - 200),
          z: Math.floor(Math.random() * 300),
        },
        remainTime: 30,
        posture: this.generateRandomPosture(),
        event: this.generateRandomEvent(),
        areaId: Math.floor(Math.random() * 4),
      });
    }

    return persons;
  }

  generateMockVitalData(): VitalSignData {
    return {
      type: 0, // 实时呼吸心率
      breathing: Math.floor(Math.random() * 10 + 15), // 15-25次/分钟
      heartRate: Math.floor(Math.random() * 20 + 60), // 60-80次/分钟
      sleepState: this.generateRandomSleepState(),
    };
  }

  startMockDataStream(
    onTrackData: (data: PersonData[]) => void,
    onVitalData: (data: VitalSignData) => void,
  ): void {
    const trackTimer = window.setInterval(() => {
      const trackData = this.generateMockTrackData();
      onTrackData(trackData);
    }, this.positionInterval);

    const vitalTimer = window.setInterval(() => {
      const vitalData = this.generateMockVitalData();
      onVitalData(vitalData);
    }, this.vitalSignInterval);

    this.timer = trackTimer;
  }

  stopMockDataStream(): void {
    if (this.timer) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
  }

  private generateRandomPosture(): number {
    // 设置不同姿态的出现概率
    const probabilities = [
      { posture: 0, weight: 5 }, // Init
      { posture: 1, weight: 15 }, // Walking
      { posture: 2, weight: 5 }, // FallSuspect
      { posture: 3, weight: 10 }, // Sitting
      { posture: 4, weight: 15 }, // Standing
      { posture: 5, weight: 5 }, // FallConfirm
      { posture: 6, weight: 15 }, // Lying
      { posture: 7, weight: 5 }, // SitGroundSuspect
      { posture: 8, weight: 5 }, // SitGroundConfirm
      { posture: 9, weight: 10 }, // SitUpBed
      { posture: 10, weight: 5 }, // SitUpBedSuspect
      { posture: 11, weight: 5 }, // SitUpBedConfirm
    ];

    const totalWeight = probabilities.reduce(
      (sum, item) => sum + item.weight,
      0,
    );
    let random = Math.random() * totalWeight;

    for (const item of probabilities) {
      random -= item.weight;
      if (random <= 0) {
        return item.posture;
      }
    }
    return 0; // 默认返回Init状态
  }

  private generateRandomEvent(): PersonEvent {
    // 80%概率无事件，20%概率有事件
    if (Math.random() > 0.2) {
      return PersonEvent.None;
    }
    // 在有事件的情况下随机选择一种事件
    const events = [
      PersonEvent.EnterRoom,
      PersonEvent.LeaveRoom,
      PersonEvent.EnterArea,
      PersonEvent.LeaveArea,
    ];
    return events[Math.floor(Math.random() * events.length)];
  }

  private generateRandomSleepState(): number {
    const states = [
      SleepState.Undefined,
      SleepState.LightSleep,
      SleepState.DeepSleep,
      SleepState.Awake,
    ];
    const state = states[Math.floor(Math.random() * states.length)];
    return state << 6; // 移位到bit 7&6位置
  }
}
