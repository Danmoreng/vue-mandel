<template>
  <div class="side-panel">
    <button class="resetButton" v-on:click="reset">Reset</button>
    <div class="inputGroup">
      <label>Width: {{ store.width }}</label>
      <label>Height: {{ store.height }}</label>
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
      <input type="number" v-model="store.zoomSize" />
    </div>
    <label>Iterations: {{ store.maxIterations }}</label>
    <label>Custom Iterations:</label>
    <input
      type="number"
      :value="store.customIterations"
      v-on:change="setCustomIterations"
    />
    <p>
      Repository:
      <a href="https://github.com/Danmoreng/vue-mandel"
        >https://github.com/Danmoreng/vue-mandel</a
      >
    </p>
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

function reset() {
  store.zoomCenter[0] = 0;
  store.zoomCenter[1] = 0;
  store.zoomSize = 5.0;
  store.maxIterations = 100;
  store.customIterations = 0;
}
</script>

<style scoped>
.side-panel {
  opacity: 0.9;
  border-radius: 20px;
  padding: 20px;
  position: absolute;
  top: 5px;
  right: 5px;
  background: rgba(0, 0, 0, 0.5);
  font-family: "Helvetica", sans-serif;
  color: white;
}

a {
  color: white;
}

.inputGroup {
  display: flex;
  align-items: stretch;
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

.resetButton {
  position: absolute;
  top: 15px;
  right: 15px;
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
