// /src/__tests__/radar.spec.ts
import { describe, it, expect, beforeEach } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useRadarStore } from "../stores/radar";

describe("Radar Store Property Tests", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  const store = useRadarStore();

  it("should set rotation", () => {
    store.settings.rotation = 45;
    expect(store.settings.rotation).toBe(45);
  });

  it("should clamp rotation to valid range", () => {
    store.settings.rotation = -10;
    expect(store.settings.rotation).toBe(0);
    store.settings.rotation = 370;
    expect(store.settings.rotation).toBe(360);
  });

  it("should set boundary", () => {
    const newBoundary = {
      v1: { x: -300, y: -200 },
      v2: { x: 300, y: -200 },
      v3: { x: -300, y: 200 },
      v4: { x: 300, y: 200 },
    };
    store.settings.boundary = newBoundary;
    expect(store.settings.boundary).toEqual(newBoundary);
  });

  it("should handle installation mode changes", () => {
    store.settings.mode = "ceiling";
    expect(store.settings.mode).toBe("ceiling");
    expect(store.settings.height).toBe(280);

    store.settings.mode = "wall";
    expect(store.settings.mode).toBe("wall");
    expect(store.settings.height).toBe(150);
  });
});
