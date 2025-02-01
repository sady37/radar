import { defineStore } from "pinia";
import type { ObjectProperties, Point } from "./types";

export const useObjectsStore = defineStore("objects", {
  state: () => ({
    objects: [] as ObjectProperties[],
    selectedId: null as string | null,
    copiedObject: null as ObjectProperties | null,
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
    createObject(data: Omit<ObjectProperties, "id">) {
      const id = Date.now().toString();
      this.objects.push({ ...data, id });
      return id;
    },

    updateObject(id: string, updates: Partial<ObjectProperties>) {
      const index = this.objects.findIndex((obj) => obj.id === id);
      if (index !== -1) {
        this.objects[index] = { ...this.objects[index], ...updates };
      }
    },

    deleteObject(id: string) {
      const index = this.objects.findIndex((obj) => obj.id === id);
      if (index !== -1) {
        this.objects.splice(index, 1);
        if (this.selectedId === id) {
          this.selectedId = null;
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
        return newObj.id;
      }
      return null;
    },
  },
});
