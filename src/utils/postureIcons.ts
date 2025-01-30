// utils/postureIcons.ts

// 首先定义接口
export interface PostureIconConfig {
  type: "svg" | "default";
  iconPath?: string;
  size: number;
  showLabel: boolean;
}

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
    size: 43,
    showLabel: true,
  },
  1: {
    // Walking
    type: "svg",
    iconPath: iconMap["Walking"],
    size: 43,
    showLabel: true,
  },
  2: {
    // FallSuspect
    type: "svg",
    iconPath: iconMap["FallSuspect"],
    size: 43,
    showLabel: true,
  },
  3: {
    // Sitting
    type: "svg",
    iconPath: iconMap["Sitting"],
    size: 43,
    showLabel: false,
  },
  4: {
    // LyingBed
    type: "svg",
    iconPath: iconMap["LyingBed"],
    size: 43,
    showLabel: false,
  },
  5: {
    // FallConfirm
    type: "svg",
    iconPath: iconMap["FallConfirm"],
    size: 43,
    showLabel: false,
  },
  6: {
    // Lying
    type: "svg",
    iconPath: iconMap["Lying"],
    size: 43,
    showLabel: false,
  },
  7: {
    // SitUp
    type: "svg",
    iconPath: iconMap["SitUp"],
    size: 43,
    showLabel: false,
  },
  8: {
    // SitGroundConfirm
    type: "svg",
    iconPath: iconMap["SitGroundConfirm"],
    size: 43,
    showLabel: true,
  },
  9: {
    // SitUpBed
    type: "svg",
    iconPath: iconMap["SitUpBed"],
    size: 43,
    showLabel: false,
  },
  10: {
    // SitUpBedSuspect
    type: "svg",
    iconPath: iconMap["SitUpBedSuspect"],
    size: 43,
    showLabel: true,
  },
  11: {
    // SitUpBedConfirm
    type: "svg",
    iconPath: iconMap["SitUpBedConfirm"],
    size: 43,
    showLabel: false,
  },
};

export enum PersonPosture {
  Init = 0, // 初始化
  Walking = 1, // 行走
  FallSuspect = 2, // 疑似跌倒
  Sitting = 3, // 蹲坐
  Standing = 4, // 站立
  FallConfirm = 5, // 跌倒确认
  Lying = 6, // 卧
  SitGroundSuspect = 7, // 疑似坐地
  SitGroundConfirm = 8, // 确认坐地
  SitUpBed = 9, // 普通床上坐起
  SitUpBedSuspect = 10, // 疑似床上坐起
  SitUpBedConfirm = 11, // 确认床上坐起
}

export const POSTURE_LABELS: Record<number, string> = {
  0: "Init",
  1: "Walking",
  2: "FallSuspect",
  3: "Sitting",
  4: "Standing",
  5: "FallConfirm",
  6: "Lying",
  7: "SitGroundSuspect",
  8: "SitGroundConfirm",
  9: "SitUpBed",
  10: "SitUpBedSuspect",
  11: "SitUpBedConfirm",
};
/*
export interface PostureIconConfig {
	type: 'png' | 'default'  // 改为 png 或默认椭圆
	imageUrl?: string       // PNG图片路径
	size: number           // 统一43x43
	showLabel: boolean
  }


  export const POSTURE_CONFIGS: Record<number, PostureIconConfig> = {
	/*0: {  // Init
	  type: 'default',
	  size: 43,
	  showLabel: true
	},
	0: {  // Init
	  type: 'png',
	  imageUrl: '/src/assets/icons/Init.png',
	  size: 43,
	  showLabel: false
	},
	1: {  // Walking
	  type: 'png',
	  imageUrl: '/src/assets/icons/Walking.png',
	  size: 43,
	  showLabel: false
	},
	2: {  // FallSuspect
	  type: 'png',
	  imageUrl: '/src/assets/icons/FallSuspect.png',
	  size: 43,
	  showLabel: false
	},
	3: {  // Sitting
		type: 'png',
		imageUrl: '/src/assets/icons/Sitting.png',
		size: 43,
		showLabel: false
	},
	4: {  // LyingBed
		type: 'png',
		imageUrl: '/src/assets/icons/Init.png',
		size: 43,
		showLabel: false
	},
	5: {  // FallConfirm
		type: 'png',
		imageUrl: '/src/assets/icons/FallConfirm.png',
		size: 43,
		showLabel: false
	},
	6: {  // Lying
		type: 'png',
		imageUrl: '/src/assets/icons/Lying.png',
		size: 43,
		showLabel: false
	},
	7: {  // SitUp
		type: 'png',
		imageUrl: '/src/assets/icons/SitUp.png',
		size: 43,
		showLabel: false
	}
  }

  */
