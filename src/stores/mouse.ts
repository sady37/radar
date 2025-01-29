// stores/mouse.ts
import { defineStore } from 'pinia';

export const useMouseStore = defineStore('mouse', {
  state: () => ({
    position: { x: 0, y: 0 }
  }),
  actions: {
    updatePosition(x: number, y: number) {
      this.position = { x, y };
    }
  }
});

