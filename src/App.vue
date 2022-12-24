<script setup>
import MandelbrotContainer from "./components/MandelbrotContainer.vue";
import Controls from "@/components/Controls.vue";
import { useStore } from "@/store/store";
const store = useStore();
function toggleControls() {
  store.showControls = !store.showControls;
}
function reset() {
  store.zoomCenter[0] = 0;
  store.zoomCenter[1] = 0;
  store.zoomSize = 5.0;
  store.maxIterations = 100;
  store.customIterations = 0;
}
</script>

<template>
  <button class="resetButton" v-on:click="reset">Reset</button>
  <button class="controlsButton" v-on:click="toggleControls">Show/Hide Controls</button>
  <main>
    <MandelbrotContainer />
    <Controls></Controls>
  </main>
</template>

<style>
html,
body {
  touch-action: none;
  background: #111;
  margin: 0;
}
main {
  display: flex;
}
.resetButton {
  position: absolute;
  top: 15px;
  left: 15px;
}
.controlsButton {
  position: absolute;
  z-index: 100;
  top: 15px;
  right: 15px;
}
</style>
