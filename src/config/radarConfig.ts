// src/config/radarConfig.ts
export const RADAR_CONFIG = {
	// 支持的物体类型
	OBJECT_TYPES: {
	  RADAR: 'Radar',
	  BED: 'Bed',
	  DOOR: 'Door',
	  WALL: 'Wall',
	  OTHER: 'Other'
	},
	
	// 模式配置
	MODES: {
	  CEILING: {
		name: 'ceiling',
		heightRange: { min: 150, max: 330, step: 10 },
		boundaryRange: {
		  leftH: { min: 10, max: 300, step: 10 },
		  rightH: { min: 10, max: 300, step: 10 },
		  frontV: { min: 10, max: 200, step: 10 },
		  rearV: { min: 10, max: 200, step: 10 }
		}
	  },
	  WALL: {
		name: 'wall',
		heightRange: { min: 150, max: 330, step: 10 },
		boundaryRange: {
		  leftH: { min: 10, max: 300, step: 10 },
		  rightH: { min: 10, max: 300, step: 10 },
		  frontV: { min: 30, max: 400, step: 10 },
		  rearV: { value: 0 }
		}
	  }
	}
  };