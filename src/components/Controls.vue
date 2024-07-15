<template>
  <div class="side-panel" v-show="store.showControls">
    <div class="inputGroup">
      <label>Width: {{ store.renderWidth }}</label>
      <label>Height: {{ store.renderHeight }}</label>
    </div>

    <label>Color Map:</label>
    <div class="inputGroup">
      <button
        class="color-button"
        v-for="(colorMap, index) in colorMaps"
        :key="index"
        @click="setColorMap(index * 2)"
      >
        {{ colorMap }}
      </button>
    </div>
    <div class="inputGroup">
      <label for="checkboxInvert">Invert Color Map</label>
      <input
        id="checkboxInvert"
        type="checkbox"
        v-model="store.invertColorMap"
      />
    </div>
    <label>Zoom Center:</label>
    <input type="number" v-model="store.zoomCenter[0]" />
    <input type="number" v-model="store.zoomCenter[1]" />
    <div>
      <label>Zoom Size:</label>
      <input type="number" v-model="store.zoomSizeInverted" @change="zoomChange" />
    </div>
    <label>Iterations: {{ store.maxIterations }}</label>
    <label>Custom Iterations:</label>
    <input
      type="number"
      :value="store.customIterations"
      v-on:change="setCustomIterations"
    />
    <div class="inputGroup">
      <label>GPU:</label>
      <span>{{ store.usedGPU }}</span>
    </div>
    <label>Repository:</label>
    <span> <a href="https://github.com/Danmoreng/vue-mandel">https://github.com/Danmoreng/vue-mandel</a></span>
  </div>
</template>

<script setup>
import { useStore } from "@/store/store";

const store = useStore();
const colorMaps = ["Viridis", "Inferno", "Plasma"];

function setCustomIterations(event) {
  store.setCustomIterations(event.target.value);
}

function setColorMap(index) {
  store.colorMap = index;
}

function zoomChange() {
  store.zoomSize = 1 / store.zoomSizeInverted;
}

</script>

<style scoped>
.side-panel {
  opacity: 0.9;
  border-radius: 20px;
  padding: 20px;
  position: absolute;
  top: 50px;
  right: 5px;
  background: rgba(0, 0, 0, 0.5);
  font-family: "Helvetica", sans-serif;
  color: white;
  max-width: min(350px, calc(100vw - 10px));
  max-height: calc(100vh - 100px);
  overflow: auto;
}

a {
  color: white;
}

.inputGroup {
  display: flex;
  align-items: stretch;
  margin-bottom: 10px;
}

label {
  display: block;
  color: white;
  white-space: nowrap;
  font-weight: bold;
  margin-bottom: 10px;
  margin-right: 10px;
}

input {
  margin-bottom: 20px;
  border-radius: 5px;
  border: none;
  padding: 5px;
}

input[type="number"] {
  min-width: 150px;
  width: 100%;
}

.color-button {
  display: inline-block;
  margin: 0 0.5em 0.5em 0;
  padding: 0.75em 1.5em;
  border: none;
  border-radius: 0.25em;
  font-size: 1em;
  font-weight: 700;
  line-height: 1;
  text-align: center;
  text-decoration: none;
  white-space: nowrap;
  cursor: pointer;
  user-select: none;
  transition: background-color 0.15s ease-in-out, color 0.15s ease-in-out;
}
</style>
