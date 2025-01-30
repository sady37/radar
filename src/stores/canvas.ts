// stores/canvas.ts

import { defineStore } from "pinia";

export const useCanvasStore = defineStore("canvas", {
  state: () => ({
    showScale: true,
    showGrid: true,
    // 画布配置（定数）
    width: 620,
    height: 520,
    minScale: 0.5,
    maxScale: 1.5,
  }),
  actions: {
    toggleScale() {
      this.showScale = !this.showScale;
    },
    toggleGrid() {
      this.showGrid = !this.showGrid;
    },
  },
});
