<template>
  <div>
    <div>
      <input v-model="testLength" type="number" placeholder="Length" />
      <input v-model="testWidth" type="number" placeholder="Width" />
      <button @click="createTestObject">Create Door</button>
    </div>
    <pre>Store State: {{ radar.settings }}</pre>
    <pre>Objects: {{ objects.objects }}</pre>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRadarStore } from "./stores/radar";
import { useObjectsStore } from "./stores/objects";

const radar = useRadarStore();
const objects = useObjectsStore();
const testLength = ref(100);
const testWidth = ref(10);

const createTestObject = () => {
  objects.createObject({
    type: "Door",
    name: "Test Door",
    position: { x: 0, y: 0 },
    size: { length: testLength.value, width: testWidth.value },
    rotation: 0,
    isLocked: false,
    properties: {},
  });
};
</script>
