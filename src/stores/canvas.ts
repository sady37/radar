// stores/canvas.ts

import { defineStore } from 'pinia';

export const useCanvasStore = defineStore('canvas', {
  state: () => ({
    showScale: true,
    showGrid: true,
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
