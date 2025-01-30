// stores/radar.ts
import { defineStore } from "pinia";
import type { Point, RadarSettings, RadarBoundary } from "./types";

export const useRadarStore = defineStore("radar", {
  state: () => ({
    settings: {
      mode: "ceiling",
      height: 200,
      position: { x: 0, y: 0 },
      rotation: 0,
      boundary: {
        v1: { x: -310, y: -260 },
        v2: { x: 310, y: -260 },
        v3: { x: -310, y: 260 },
        v4: { x: 310, y: 260 },
      },
      showBoundary: false,
      showSignal: false,
    } as RadarSettings,

    defaultBoundary: {
      ceiling: {
        x: [-300, 300],
        y: [-200, 200],
      },
      wall: {
        x: [-300, 300],
        y: [0, 400],
      },
    },

    validationRules: {
      height: {
        min: 0,
        max: 300,
        step: 5,
      },
      rotation: {
        min: -180,
        max: 180,
        step: 15,
      },
    },
  }),

  actions: {
    updateSettings(updates: Partial<RadarSettings>) {
      this.settings = { ...this.settings, ...updates };
    },

    setMode(mode: "ceiling" | "wall") {
      this.settings.mode = mode;
      this.resetBoundary();
    },

    resetBoundary() {
      const bounds =
        this.settings.mode === "ceiling"
          ? this.defaultBoundary.ceiling
          : this.defaultBoundary.wall;

      this.settings.boundary = {
        v1: { x: bounds.x[0], y: bounds.y[0] },
        v2: { x: bounds.x[1], y: bounds.y[0] },
        v3: { x: bounds.x[0], y: bounds.y[1] },
        v4: { x: bounds.x[1], y: bounds.y[1] },
      };
    },

    updateBoundaryVertex(vertex: keyof RadarBoundary, point: Point) {
      this.settings.boundary[vertex] = point;
    },

    validateHeight(height: number): number {
      const { min, max, step } = this.validationRules.height;
      return Math.min(max, Math.max(min, Math.round(height / step) * step));
    },

    validateRotation(angle: number): number {
      const { min, max, step } = this.validationRules.rotation;
      return Math.min(max, Math.max(min, Math.round(angle / step) * step));
    },

    toggleBoundary() {
      this.settings.showBoundary = !this.settings.showBoundary;
    },

    toggleSignal() {
      this.settings.showSignal = !this.settings.showSignal;
    },
  },
});
