//src/utils/postureIcons.ts

// 首先定义接口
import type { 
	PostureIconConfig, 
	PersonPosture,
	POSTURE_LABELS
   } from '../stores/types';

   


// 批量导入所有SVG
const icons = import.meta.glob("@/assets/icons/*.svg", { eager: true });

// 映射文件名到图标路径
const iconMap = Object.entries(icons).reduce(
  (acc, [path, module]) => {
    const name = path.split("/").pop()?.replace(".svg", "");
    if (name) {
      acc[name] = (module as { default: string }).default;
    }
    return acc;
  },
  {} as Record<string, string>,
);




export const POSTURE_CONFIGS: Record<number, PostureIconConfig> = {
	0: {
	  // Init
	  type: "svg",
	  iconPath: iconMap["Init"],
	  size: 50,
	  showLabel: false,
	},
	1: {
	  // Walking
	  type: "svg",
	  iconPath: iconMap["Walking"],
	  size: 50,
	  showLabel: false,
	},
	2: {
	  // FallSuspect
	  type: "svg",
	  iconPath: iconMap["FallSuspect"],
	  size: 50,
	  showLabel: false,
	},
	3: {
	  // Sitting
	  type: "svg",
	  iconPath: iconMap["Sitting"],
	  size: 50,
	  showLabel: false,
	},
	4: {
	  // Standing
	  type: "svg",
	  iconPath: iconMap["Standing"],
	  size: 50,
	  showLabel: false,
	},
	5: {
	  // FallConfirm
	  type: "svg",
	  iconPath: iconMap["FallConfirm"],
	  size: 50,
	  showLabel: false,
	},
	6: {
	  // Lying
	  type: "svg",
	  iconPath: iconMap["LyingBed-back"],
	  size: 50,
	  showLabel: false,
	},
	7: {
	  // SitGroundSuspect
	  type: "svg",
	  iconPath: iconMap["SitGroundSuspect"],
	  size: 50,
	  showLabel: false,
	},
	8: {
	  // SitGroundConfirm
	  type: "svg",
	  iconPath: iconMap["SitGroundConfirm"],
	  size: 50,
	  showLabel: false,
	},
	9: {
	  // SitUpBed
	  type: "svg",
	  iconPath: iconMap["SitUpBed"],
	  size: 50,
	  showLabel: false,
	},
	10: {
	  // SitUpBedSuspect
	  type: "svg",
	  iconPath: iconMap["SitUpBedSuspect"],
	  size: 50,
	  showLabel: false,
	},
	11: {
	  // SitUpBedConfirm
	  type: "svg",
	  iconPath: iconMap["SitUpBedConfirm"],
	  size: 50,
	  showLabel: false,
	},
  };


// 生理状态图标配置
export const VITAL_SIGN_CONFIGS = {
	heart: {
	  undefined: { type: "svg" as const, iconPath: iconMap["heart-gray"], size: 24, showLabel: false },
	  normal: { type: "svg" as const, iconPath: iconMap["heart-green"], size: 24, showLabel: false },
	  warning: { type: "svg" as const, iconPath: iconMap["heart-yellow"], size: 24, showLabel: false },
	  danger: { type: "svg" as const, iconPath: iconMap["heart-red"], size: 24, showLabel: false }
	},
	breathing: {
	  undefined: { type: "svg" as const, iconPath: iconMap["breathe-gray"], size: 24, showLabel: false },
	  normal: { type: "svg" as const, iconPath: iconMap["breathe-green"], size: 24, showLabel: false },
	  warning: { type: "svg" as const, iconPath: iconMap["breathe-yellow"], size: 24, showLabel: false },
	  danger: { type: "svg" as const, iconPath: iconMap["breathe-red"], size: 24, showLabel: false }
	},
	sleep: {
	  undefined: { type: "svg" as const, iconPath: iconMap["AwakeUnknow"], size: 24, showLabel: false },
	  light: { type: "svg" as const, iconPath: iconMap["LightSleep"], size: 24, showLabel: false },
	  deep: { type: "svg" as const, iconPath: iconMap["DeepSleep"], size: 24, showLabel: false },
	  awake: { type: "svg" as const, iconPath: iconMap["Awake"], size: 24, showLabel: false }
	}
   } as const;


// 导出状态判断函数
export const getHeartRateStatus = (rate: number) => {
	if (rate === undefined || rate === null || isNaN(rate)) return 'undefined';
	if (rate >= 60 && rate <= 95) return 'normal';
	if ((rate >= 45 && rate <= 59) || (rate >= 96 && rate <= 105)) return 'warning';
	return 'danger';
   };
   
   export const getBreathingStatus = (rate: number) => {
	if (rate === undefined || rate === null || isNaN(rate)) return 'undefined';
	if (rate >= 12 && rate <= 26) return 'normal';
	if ((rate >= 8 && rate <= 11) || (rate >= 21 && rate <= 26)) return 'warning';
	return 'danger';
   };
   
   export const getSleepStatus = (state: number) => {
	if (state === undefined || state === null) return 'undefined';
	switch (state >> 6) {
	  case 1: return 'light';
	  case 2: return 'deep';
	  case 3: return 'awake';
	  default: return 'undefined';
	}
   };