// src/stores/radarConfig.ts
import { defineStore } from "pinia";
import { useObjectsStore } from "./objects";
import type { RadarView, RadarProperties, ObjectProperties } from "./types";
import { generateRadarView,parseBoundaryString, parseAreaString, toCanvasCoordinate } from "../utils/radarUtils";

export const useRadarConfigStore = defineStore("radarConfig", {
  state: () => ({
    // 存储不同雷达的视图配置 - 由系统生成
    radarViews: {} as Record<string, RadarView>,
    
    // 存储不同雷达的实际属性 - 从雷达设备查询得到
    radarProperties: {} as Record<string, RadarProperties>,
    
    // 存储不同雷达的待安装配置 - 表示视图与实际属性的差异
    installConfigs: {} as Record<string, Record<string, string>>,
    
    // 配置发送状态管理
    configSending: false,
    configStatus: '', // 'sending', 'success', 'error', 'refreshing', 'completed'
    lastSentRadarId: null as string | null,
    lastSentTime: null as Date | null,
  }),

  getters: {
    // 获取指定雷达的视图配置
    getRadarView: (state) => (radarId: string) => {
      return state.radarViews[radarId] || null;
    },
    
    // 获取指定雷达的属性
    getRadarProperties: (state) => (radarId: string) => {
      return state.radarProperties[radarId] || null;
    },
    
    // 获取指定雷达的安装配置（差异部分）
    getInstallConfig: (state) => (radarId: string) => {
      return state.installConfigs[radarId] || null;
    },
    
    // 检查指定雷达是否有待发送的配置更改
    hasConfigChanges: (state) => (radarId: string) => {
      return !!state.installConfigs[radarId] && 
             Object.keys(state.installConfigs[radarId]).length > 0;
    }
  },

  actions: {
    // 根据当前画布状态生成雷达视图
    generateRadarView(radarId: string) {
      const objectsStore = useObjectsStore();
      const radar = objectsStore.objects.find(obj => obj.id === radarId && obj.typeName === 'Radar');
      if (!radar) return null;
      
      const view = generateRadarView(radar, objectsStore.objects);
      this.radarViews[radarId] = view;
      
      // 如果已有该雷达的属性，计算安装配置
      if (this.radarProperties[radarId]) {
        this.updateInstallConfig(radarId);
      }
      
      return view;
    },
    
    // 更新雷达属性（通常在查询雷达设备后调用）
    updateRadarProperties(radarId: string, properties: RadarProperties) {
      this.radarProperties[radarId] = properties;
      
      // 如果已有该雷达的视图，更新安装配置
      if (this.radarViews[radarId]) {
        this.updateInstallConfig(radarId);
      }
    },
    
    // 更新安装配置（计算视图与属性之间的差异）
    updateInstallConfig(radarId: string) {
      if (!this.radarViews[radarId] || !this.radarProperties[radarId]) return;
      
      const differences: Record<string, string> = {};
      const radarView = this.radarViews[radarId];
      const radarProperties = this.radarProperties[radarId];
      
      // 检查基本配置
      const basicKeys = ['radar_install_style', 'radar_install_height', 'rectangle'];
      basicKeys.forEach(key => {
        if (radarView[key] !== radarProperties[key]) {
          differences[key] = radarView[key];
        }
      });
      
      // 检查区域配置
      Object.keys(radarView).forEach(key => {
        if (key.startsWith('declare_area_') && radarView[key] !== radarProperties[key]) {
          differences[key] = radarView[key];
        }
      });
      
      // 检查需要删除的区域
      Object.keys(radarProperties).forEach(key => {
        if (key.startsWith('declare_area_') && !radarView[key]) {
          // 使用空区域类型0表示删除区域
          const areaIdMatch = key.match(/declare_area_(\d+)/);
          const areaId = areaIdMatch ? parseInt(areaIdMatch[1]) : 0;
          differences[key] = `{${areaId},0,0,0,0,0,0,0,0,0}`;
        }
      });
      
      // 更新安装配置
      if (Object.keys(differences).length > 0) {
        this.installConfigs[radarId] = differences;
      } else {
        // 如果没有变更，删除安装配置
        if (this.installConfigs[radarId]) {
          delete this.installConfigs[radarId];
        }
      }
    },
    
    // 发送雷达配置到设备
    async sendRadarConfig(radarId: string) {
      if (!this.installConfigs[radarId] || Object.keys(this.installConfigs[radarId]).length === 0) {
        return { success: true, message: '无需更新配置' };
      }
      
      this.configSending = true;
      this.configStatus = 'sending';
      this.lastSentRadarId = radarId;
      
      try {
        // 这里应该是实际发送配置到雷达设备的API调用
        // const response = await radarService.sendConfig(radarId, this.installConfigs[radarId]);
        
        // 模拟API调用延迟
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 模拟成功响应
        this.configStatus = 'success';
        this.lastSentTime = new Date();
        
        return { success: true };
      } catch (error) {
        this.configStatus = 'error';
        console.error('发送雷达配置失败:', error);
        return { success: false, error };
      } finally {
        this.configSending = false;
      }
    },
    
    // 获取雷达当前状态（查询设备属性）
    async refreshRadarStatus(radarId: string) {
      this.configStatus = 'refreshing';
      
      try {
        // 这里应该是实际查询雷达设备属性的API调用
        // const properties = await radarService.getProperties(radarId);
        
        // 模拟API调用延迟
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // 模拟属性查询结果 - 实际应该用API返回的数据
        const mockProperties: RadarProperties = {
          radar_func_ctrl: "15",
          radar_install_style: "0",
          radar_install_height: "25",
          rectangle: "{-300,-200,300,-200,-300,200,300,200}",
          app_compile_time: "May 01 2025-10:30:15",
          radar_compile_time: "Apr 15 2025 14:22:33",
          accelera: "0.74:1.97:-0.52:1",
          type: "TSL60G442",
          sfver: "2.0",
          radarsfver: "2.3",
          mac: "00:11:22:33:44:55"
        };
        
        // 更新雷达属性
        this.updateRadarProperties(radarId, mockProperties);
        
        // 清除安装配置（因为已更新属性）
        if (this.installConfigs[radarId]) {
          delete this.installConfigs[radarId];
        }
        
        this.configStatus = 'completed';
        
        // 5秒后清除状态
        setTimeout(() => {
          if (this.configStatus === 'completed') {
            this.configStatus = '';
          }
        }, 5000);
        
        return { success: true };
      } catch (error) {
        this.configStatus = 'error';
        console.error('获取雷达状态失败:', error);
        return { success: false, error };
      }
    },
    
    // 重置配置状态
    resetConfigStatus() {
      this.configStatus = '';
      this.configSending = false;
    },
    
    // 导出所有雷达配置（用于保存/恢复）
    exportRadarConfigs() {
      return {
        radarViews: this.radarViews,
        radarProperties: this.radarProperties,
        installConfigs: this.installConfigs
      };
    },
    
    // 导入雷达配置（用于保存/恢复）
    importRadarConfigs(configs: { 
      radarViews?: Record<string, RadarView>,
      radarProperties?: Record<string, RadarProperties>,
      installConfigs?: Record<string, Record<string, string>>
    }) {
      if (configs.radarViews) {
        this.radarViews = configs.radarViews;
      }
      
      if (configs.radarProperties) {
        this.radarProperties = configs.radarProperties;
      }
      
      if (configs.installConfigs) {
        this.installConfigs = configs.installConfigs;
      }
    },
    
    // 从服务器加载安装配置模板
    async loadInstallTemplate(templateName: string) {
      try {
        // 这里应该是实际从服务器加载模板的API调用
        // const template = await radarService.getTemplate(templateName);
        
        // 模拟API调用延迟
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 模拟模板数据
        const mockTemplate = {
          radar_install_style: "0",
          radar_install_height: "28",
          rectangle: "{-300,-200,300,-200,-300,200,300,200}",
          declare_area_Bed: "{0,5,-100,80,100,80,-100,180,100,180}",
          declare_area_Door: "{1,4,80,450,140,450,80,480,140,480}"
        };
        
        // 返回模板数据 - 在实际应用中可直接用于更新视图
        return { success: true, template: mockTemplate };
      } catch (error) {
        console.error('加载安装模板失败:', error);
        return { success: false, error };
      }
    }
  }
});



/**
 * 同步雷达基本属性到画布
 * @param radarId 雷达对象ID
 * @returns 同步结果
 */
export async function synchronizeCanvasWithRadar(radarId: string) {
	const radarConfigStore = useRadarConfigStore();
	const objectsStore = useObjectsStore();
	
	// 获取雷达属性
	const radarProps = radarConfigStore.radarProperties[radarId];
	if (!radarProps) {
	  return { success: false, message: '无法获取雷达属性' };
	}
	
	// 在画布中查找雷达对象
	const radar = objectsStore.objects.find(obj => obj.id === radarId && obj.typeName === 'Radar');
	if (!radar) {
	  return { success: false, message: '画布中未找到雷达对象' };
	}
	
	// 解析安装方式
	const installStyle = radarProps.radar_install_style === "0" ? "ceiling" : "wall";
	
	// 解析安装高度 (从分米转换为厘米)
	const heightValue = parseInt(radarProps.radar_install_height) * 10;
	
	// 解析边界设置
	const boundaryValues = parseBoundaryString(radarProps.rectangle);
	
	// 更新雷达对象属性
	objectsStore.updateObject(radarId, {
	  ...radar,
	  mode: installStyle,
	  [installStyle]: {
		...radar[installStyle],
		height: {
		  ...radar[installStyle].height,
		  default: heightValue
		},
		boundary: {
		  leftH: boundaryValues.leftH,
		  rightH: boundaryValues.rightH,
		  frontV: boundaryValues.frontV,
		  rearV: boundaryValues.rearV
		}
	  }
	});
	
	console.log(`雷达基本属性已同步 - 安装方式: ${installStyle}, 高度: ${heightValue}厘米`);
	console.log(`边界设置: leftH=${boundaryValues.leftH}, rightH=${boundaryValues.rightH}, frontV=${boundaryValues.frontV}, rearV=${boundaryValues.rearV}`);
	
	return { 
	  success: true, 
	  message: '雷达基本属性已同步到画布',
	  details: {
		installStyle,
		height: heightValue,
		boundary: boundaryValues
	  }
	};
  }
  
  /**
   * 同步区域配置，保持雷达和画布一致
   * @param radarId 雷达对象ID
   * @returns 同步结果
   */
  export async function synchronizeAreasWithRadar(radarId: string) {
	const radarConfigStore = useRadarConfigStore();
	const objectsStore = useObjectsStore();
	
	// 获取雷达属性
	const radarProps = radarConfigStore.radarProperties[radarId];
	if (!radarProps) {
	  return { success: false, message: '无法获取雷达属性' };
	}
	
	// 获取雷达对象
	const radar = objectsStore.objects.find(obj => obj.id === radarId);
	if (!radar) {
	  return { success: false, message: '画布中未找到雷达对象' };
	}
	
	// 1. 收集画布中的所有关联对象 (除雷达外的配置对象)
	const canvasObjects = objectsStore.objects.filter(obj => 
	  obj.id !== radarId && 
	  ['Bed', 'TV', 'Door', 'Other', 'Exclude'].includes(obj.typeName)
	);
	
	// 2. 收集雷达中的所有区域
	const radarAreas = new Set<string>();
	Object.keys(radarProps).forEach(key => {
	  if (key.startsWith('declare_area_')) {
		const areaName = key.substring('declare_area_'.length);
		radarAreas.add(areaName);
	  }
	});
	
	// 3. 处理画布上有但雷达上没有的对象 (设置失败的对象)
	const removedFromCanvas: string[] = [];
	const canvasObjectNames = new Set<string>();
	
	canvasObjects.forEach(obj => {
	  canvasObjectNames.add(obj.name);
	  
	  if (!radarAreas.has(obj.name)) {
		// 画布上有，雷达上没有 - 说明设置失败，删除画布对象
		objectsStore.deleteObject(obj.id);
		removedFromCanvas.push(obj.name);
		console.log(`区域设置失败，已从画布删除: ${obj.name} (类型: ${obj.typeName})`);
	  }
	});
	
	// 4. 处理雷达上有但画布上没有的区域 (需要删除的区域)
	const pendingRemoveFromRadar: string[] = [];
	const pendingDeleteConfig: Record<string, string> = {};
	
	radarAreas.forEach(areaName => {
	  if (!canvasObjectNames.has(areaName)) {
		// 雷达上有，画布上没有 - 标记为待删除
		const areaKey = `declare_area_${areaName}`;
		
		// 提取区域ID (如果有)
		const areaIdMatch = areaName.match(/(\d+)/);
		const areaId = areaIdMatch ? parseInt(areaIdMatch[0]) : 0;
		
		// 创建删除指令 (区域类型0表示删除)
		pendingDeleteConfig[areaKey] = `{${areaId},0,0,0,0,0,0,0,0,0}`;
		pendingRemoveFromRadar.push(areaName);
		
		console.log(`发现雷达上多余区域，已标记删除: ${areaName}`);
	  }
	});
	
	// 5. 更新安装配置，将删除指令添加到待发送配置中
	if (pendingRemoveFromRadar.length > 0) {
	  if (!radarConfigStore.installConfigs[radarId]) {
		radarConfigStore.installConfigs[radarId] = {};
	  }
	  
	  // 合并删除指令到安装配置
	  Object.assign(radarConfigStore.installConfigs[radarId], pendingDeleteConfig);
	}
	
	return { 
	  success: true, 
	  message: '区域配置已同步', 
	  details: {
		removedFromCanvas,
		pendingRemoveFromRadar
	  }
	};
  }
  
  /**
   * 执行完整的雷达与画布同步
   * @param radarId 雷达对象ID
   * @returns 同步结果
   */
  export async function synchronizeWithRadar(radarId: string) {
	const radarConfigStore = useRadarConfigStore();
	
	try {
	  radarConfigStore.configStatus = 'refreshing';
	  
	  // 1. 同步雷达基本属性
	  const basicResult = await synchronizeCanvasWithRadar(radarId);
	  if (!basicResult.success) {
		radarConfigStore.configStatus = 'error';
		return basicResult;
	  }
	  
	  // 2. 同步区域设置
	  const areasResult = await synchronizeAreasWithRadar(radarId);
	  if (!areasResult.success) {
		radarConfigStore.configStatus = 'error';
		return areasResult;
	  }
	  
	  // 3. 更新视图配置
	  radarConfigStore.generateRadarView(radarId);
	  
	  // 4. 如果没有待发送的删除指令，清除差异标记
	  const hasDeleteCommands = Object.keys(radarConfigStore.installConfigs[radarId] || {}).length > 0;
	  if (!hasDeleteCommands) {
		delete radarConfigStore.installConfigs[radarId];
	  }
	  
	  radarConfigStore.configStatus = 'completed';
	  return { 
		success: true, 
		message: '画布已完全同步到雷达状态',
		details: {
		  ...basicResult.details,
		  ...areasResult.details
		}
	  };
	} catch (error) {
	  radarConfigStore.configStatus = 'error';
	  console.error('同步到画布失败:', error);
	  return { 
		success: false, 
		error, 
		message: '同步过程中发生错误'
	  };
	}
  }