// src/services/radarService.ts
import type { RadarReport, ObjectProperties, Point } from '../stores/types';
import { generateRadarReport } from '../utils/radarUtils';
import type { Store } from 'pinia';
import type { ObjectsStore } from '../stores/objects';


// 定义边界设置接口
interface RadarBoundarySettings {
	leftH: number;
	rightH: number;
	frontV: number;
	rearV: number;
  }
  
  // 定义雷达设置接口
  interface RadarSettings {
	mode: 'ceiling' | 'wall';
	boundary: RadarBoundarySettings;
	height: number;
  }
  
  // 定义区域查询接口
  interface AreaQuery {
	x1: number;
	y1: number;
	x2: number;
	y2: number;
  }
  

export interface RadarLayoutService {
  // 获取雷达报告
  getRadarReport(): RadarReport | null;
  
  // 更新雷达设置
  updateRadarSettings(settings: RadarSettings): void;
  
  // 获取指定区域内的物体
  getObjectsInArea(area: AreaQuery): ObjectProperties[];
}

export class RadarLayoutServiceImpl implements RadarLayoutService {
  private store: ObjectsStore;

  constructor(store: ObjectsStore) {
    this.store = store;
  }

  getRadarReport(): RadarReport | null {
	const radar = this.store.$state.objects.find((obj: ObjectProperties) => obj.typeName === 'Radar');
    if (!radar) return null;
    return generateRadarReport(radar, this.store.objects);
  }

  updateRadarSettings(settings: RadarSettings): void {
    const radar = this.store.objects.find((obj: ObjectProperties) => obj.typeName === 'Radar');
    if (radar) {
      this.store.updateObject(radar.id, {
        ...radar,
        mode: settings.mode,
        [settings.mode]: {
          ...radar[settings.mode],
          boundary: settings.boundary,
          height: {
            ...radar[settings.mode].height,
            default: settings.height
          }
        }
      });
    }
  }

  getObjectsInArea(area: AreaQuery): ObjectProperties[] {
    // 实现区域内物体查询逻辑
    return this.store.objects.filter((obj: ObjectProperties) => {
      if (obj.typeName === 'Radar') return false;
      const { x, y } = obj.position;
      return x >= area.x1 && x <= area.x2 && y >= area.y1 && y <= area.y2;
    });
  }
}


