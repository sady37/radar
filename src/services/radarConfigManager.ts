// src/services/radarConfigManager.ts
import { RadarApiService, RadarApiError } from './radarApiService';
import type { RadarProperties } from '../stores/types';
import { useRadarConfigStore } from '../stores/radarConfig';
import type { Store } from 'pinia';

type RadarConfigStoreType = ReturnType<typeof useRadarConfigStore>;

export class RadarConfigManager {
  private radarApiService: RadarApiService;
  
  constructor(private store: RadarConfigStoreType, apiService?: RadarApiService) {
    this.radarApiService = apiService || new RadarApiService();
  }

  // 发送配置流程
  async sendConfig(radarId: string) {
    try {
      // 1. 检查差异
      if (!this.store.hasConfigChanges(radarId)) {
        return { status: 'no_changes' };
      }
      
      // 2. 获取配置差异
      const configChanges = this.store.getInstallConfig(radarId);
      const needsReboot = this.needsDeviceReboot(configChanges);
      
      // 3. 获取原始属性
      const properties = this.store.getRadarProperties(radarId);
      if (!properties) {
        return { 
          status: 'error', 
          message: 'Failed to get radar properties' 
        };
      }
      
      // 4. 记录配置项以便验证
      const configItems = Object.keys(configChanges).map(key => ({
        key,
        value: configChanges[key],
        originalValue: properties[key] || ''
      }));
      
      // 5. 发送配置
      await this.radarApiService.sendRadarConfig(radarId, configChanges);
      
      // 6. 等待适当的时间
      const waitTime = needsReboot ? 10000 : 5000;
      await this.wait(waitTime);
      
      // 7. 获取最新属性进行验证
      const updatedProperties = await this.radarApiService.getRadarProperties(radarId);
      this.store.updateRadarProperties(radarId, updatedProperties);
      
      // 8. 验证结果
      const verificationResult = this.verifyConfigChanges(radarId, configItems, updatedProperties);
      
      // 9. 处理配置失败的情况
      if (!verificationResult.allSucceeded) {
        this.handleFailedConfig(radarId, verificationResult.failedItems);
      }
      
      // 10. 提供配置状态通知
      this.radarApiService.receiveNotification(
        'configStatus', 
        `Configuration completed: ${verificationResult.succeededItems.length} succeeded, ${verificationResult.failedItems.length} failed.`
      );
      
      return {
        status: 'success',
        ...verificationResult
      };
    } catch (error) {
      console.error('Configuration send error:', error);
      
      return {
        status: 'error',
        allSucceeded: false,
        message: error instanceof Error ? error.message : String(error),
        code: error instanceof RadarApiError ? error.code : 'UNKNOWN_ERROR'
      };
    }
  }
  
  // 辅助方法
  private needsDeviceReboot(configChanges: Record<string, string>): boolean {
    // 检查是否包含需要重启的配置项（高度/边界更改）
    return Object.keys(configChanges).some(key => 
      key === 'radar_install_height' || key === 'rectangle'
    );
  }
  
  private async wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  // 验证配置更改是否成功应用
  private verifyConfigChanges(
    radarId: string, 
    configItems: Array<{key: string, value: string, originalValue: string}>,
    currentProperties: RadarProperties
  ) {
    if (!currentProperties) {
      return {
        allSucceeded: false,
        succeededItems: [],
        failedItems: configItems.map(item => ({
          ...item,
          reason: 'Failed to verify - cannot get radar properties'
        }))
      };
    }
    
    const succeededItems: Array<{key: string, value: string, originalValue: string}> = [];
    const failedItems: Array<{key: string, value: string, originalValue: string, reason: string}> = [];
    
    configItems.forEach(item => {
      // 对于区域配置，特殊处理
      if (item.key.startsWith('declare_area_')) {
        // 如果是删除区域（区域类型为0）
        if (item.value.includes(',0,')) {
          // 检查区域是否已从属性中移除
          const areaExists = currentProperties[item.key] !== undefined;
          if (!areaExists) {
            succeededItems.push(item);
          } else {
            failedItems.push({
              ...item,
              reason: 'Area deletion failed - area still exists'
            });
          }
          return;
        }
      }
      
      // 一般属性对比
      if (currentProperties[item.key] === item.value) {
        succeededItems.push(item);
      } else {
        failedItems.push({
          ...item,
          reason: `Value mismatch - expected ${item.value}, got ${currentProperties[item.key]}`
        });
      }
    });
    
    return {
      allSucceeded: failedItems.length === 0,
      succeededItems,
      failedItems
    };
  }
  
  // 处理配置失败的项目
  private handleFailedConfig(radarId: string, failedItems: Array<{key: string, value: string, originalValue: string, reason: string}>) {
    // 仅清除失败项的配置记录
    if (this.store.installConfigs[radarId]) {
      failedItems.forEach(item => {
        delete this.store.installConfigs[radarId][item.key];
      });
      
      // 如果没有剩余的配置项，删除整个配置对象
      if (Object.keys(this.store.installConfigs[radarId]).length === 0) {
        delete this.store.installConfigs[radarId];
      }
    }
  }
}