# components/radar/RadarBoundary.vue
<template>
  <g v-if="showBoundary">
    <path
      :d="boundaryPath"
      fill="none"
      stroke="rgba(10, 91, 135, 1)"
      stroke-width="0.5"
      stroke-dasharray="5,5"
    />
  </g>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { Point } from "@/stores/types";

interface Props {
  mode: "ceiling" | "wall";
  position: Point;
  boundary: {
    leftX: number;
    rightX: number;
    frontY: number;
    rearY: number;
  };
  showBoundary: boolean;
}

const props = defineProps<Props>();

const boundaryPath = computed(() => {
  const { position, boundary, mode } = props;
  const bounds =
    mode === "ceiling"
      ? {
          left: position.x + boundary.leftX,
          right: position.x - boundary.rightX,
          top: position.y - boundary.frontY,
          bottom: position.y + boundary.rearY,
        }
      : {
          left: position.x + boundary.leftX,
          right: position.x - boundary.rightX,
          top: position.y,
          bottom: position.y + boundary.frontY,
        };

  return `M ${bounds.left} ${bounds.top} 
          L ${bounds.right} ${bounds.top} 
          L ${bounds.right} ${bounds.bottom} 
          L ${bounds.left} ${bounds.bottom} Z`;
});
</script>
