//src/stores/objects.ts
import { defineStore } from "pinia";
import type { ObjectProperties, Point } from "./types";
import { generateRadarReport, type RadarReport } from '../utils/radarUtils';
import type { Store } from 'pinia';

// radarService need
// 定义 store 的状态接口
interface ObjectsState {
	objects: ObjectProperties[];
	selectedId: string | null;
	copiedObject: ObjectProperties | null;
	radarReport: RadarReport | null;
  }

// 导出 store 类型
export type ObjectsStore = ReturnType<typeof useObjectsStore>;
//end  radarService

export const useObjectsStore = defineStore("objects", {
  state: () => ({
    objects: [] as ObjectProperties[],
    selectedId: null as string | null,
    copiedObject: null as ObjectProperties | null,  //复制/粘贴对象功能
	radarReport: null as RadarReport | null,  // 新增
  }),

  getters: {
    selectedObject: (state) =>
      state.selectedId
        ? state.objects.find((obj) => obj.id === state.selectedId)
        : null,

    getObjectById: (state) => (id: string) =>
      state.objects.find((obj) => obj.id === id),

	getObjectsByType: (state) => (typeName: string) =>
		state.objects.filter((obj) => obj.typeName === typeName),
  
	  // 确保雷达总是在最上层绘制
    getOrderedObjects: (state) => {
      return [
        ...state.objects.filter((obj) => obj.mode === undefined),  // 非雷达对象
        ...state.objects.filter((obj) => obj.mode !== undefined),  // 雷达对象
      ];
    },
  },

  actions: {
	// 更新雷达报告
	updateRadarReport() {
	  const radar = this.objects.find(obj => obj.typeName === 'Radar');
	  if (radar) {
		this.radarReport = generateRadarReport(radar, this.objects);
		console.log('Radar Report Updated:', this.radarReport);
	  }
	},
 
	createObject(data: Omit<ObjectProperties, "id">) {
	  const id = Date.now().toString();
	  this.objects.push({ ...data, id });
	  // 如果创建的是雷达或fixed物体，重新计算report
	  if (data.typeName === 'Radar' || 
		  ['Door', 'Bed', 'Exclude', 'Other'].includes(data.typeName)) {
		this.updateRadarReport();
	  }
	  return id;
	},
 
	updateObject(id: string, updates: Partial<ObjectProperties>) {
	  const index = this.objects.findIndex((obj) => obj.id === id);
	  if (index !== -1) {
		this.objects[index] = { ...this.objects[index], ...updates };
		// 如果更新的是雷达或fixed物体，重新计算report
		if (this.objects[index].typeName === 'Radar' || 
			['Door', 'Bed', 'Exclude', 'Other'].includes(this.objects[index].typeName)) {
		  this.updateRadarReport();
		}
	  }
	},
 
	deleteObject(id: string) {
	  const index = this.objects.findIndex((obj) => obj.id === id);
	  if (index !== -1) {
		const deletedObject = this.objects[index];
		this.objects.splice(index, 1);
		if (this.selectedId === id) {
		  this.selectedId = null;
		}
		// 如果删除的是雷达或fixed物体，重新计算report
		if (deletedObject.typeName === 'Radar' || 
			['Door', 'Bed', 'Exclude', 'Other'].includes(deletedObject.typeName)) {
		  this.updateRadarReport();
		}
	  }
	},
 
	selectObject(id: string | null) {
	  this.selectedId = id;
	},
 
	copyObject(id: string) {
	  const obj = this.objects.find((o) => o.id === id);
	  if (obj) {
		this.copiedObject = { ...obj };
	  }
	},
 
	pasteObject(position: Point) {
	  if (this.copiedObject) {
		const newObj = {
		  ...this.copiedObject,
		  id: Date.now().toString(),
		  position,
		  name: `${this.copiedObject.name}_copy`,
		};
		this.objects.push(newObj);
		// 如果粘贴的是雷达或fixed物体，重新计算report
		if (newObj.typeName === 'Radar' || 
			['Door', 'Bed', 'Exclude', 'Other'].includes(newObj.typeName)) {
		  this.updateRadarReport();
		}
		return newObj.id;
	  }
	  return null;
	},
  },
 }); 

// 定义 store 的状态接口
interface ObjectsState {
  objects: ObjectProperties[];
  selectedId: string | null;
  copiedObject: ObjectProperties | null;
  radarReport: RadarReport | null;
}


