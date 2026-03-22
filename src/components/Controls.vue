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
    <input
      type="number"
      :value="store.zoomCenter[0]"
      @change="setZoomCenter(0, $event.target.value)"
    />
    <input
      type="number"
      :value="store.zoomCenter[1]"
      @change="setZoomCenter(1, $event.target.value)"
    />
    <div>
      <label>Zoom Size:</label>
      <input
        type="number"
        :value="store.zoomSizeInverted"
        @change="setZoomSizeInverted($event.target.value)"
      />
    </div>
    <label>Iterations: {{ store.maxIterations }}</label>
    <label>Custom Iterations:</label>
    <input
      type="number"
      :value="store.customIterations"
      v-on:change="setCustomIterations"
    />
    <label>Renderer:</label>
    <div class="inputGroup rendererButtons">
      <button
        v-for="backend in rendererOptions"
        :key="backend.value"
        class="renderer-button"
        :class="{
          active: store.rendererBackend === backend.value,
          disabled: backend.disabled,
        }"
        :disabled="backend.disabled"
        @click="setRendererBackend(backend.value)"
      >
        {{ backend.label }}
      </button>
    </div>
    <div class="inputGroup">
      <label>Active Renderer:</label>
      <span>{{ rendererLabel }}</span>
    </div>
    <div class="inputGroup">
      <label>WebGPU:</label>
      <span>{{ webgpuStatus }}</span>
    </div>
    <div class="inputGroup">
      <label>Status:</label>
      <span>{{ rendererStatus }}</span>
    </div>
    <div class="inputGroup">
      <label>GPU:</label>
      <span>{{ store.usedGPU }}</span>
    </div>
    <div v-if="store.rendererError" class="errorMessage">
      {{ store.rendererError }}
    </div>
    <label>Repository:</label>
    <span>
      <a href="https://github.com/Danmoreng/vue-mandel"
        >https://github.com/Danmoreng/vue-mandel</a
      ></span
    >
  </div>
</template>

<script setup>
import { computed } from "vue";
import { rendererLabels } from "@/renderers";
import { useStore } from "@/store/store";

defineOptions({
  name: "ControlPanel",
});

const store = useStore();
const colorMaps = ["Viridis", "Inferno", "Plasma"];
const rendererOptions = computed(() => [
  {
    value: "webgl2",
    label: "WebGL2",
    disabled: !store.capabilities.webgl2,
  },
  {
    value: "webgpu",
    label: "WebGPU",
    disabled: !store.capabilities.webgpu,
  },
]);
const rendererLabel = computed(
  () => rendererLabels[store.rendererBackend] ?? store.rendererBackend
);
const webgpuStatus = computed(() =>
  store.capabilities.webgpu ? "Available" : "Unavailable"
);
const rendererStatus = computed(() => {
  if (!store.capabilitiesChecked) {
    return "Detecting";
  }

  if (store.unsupportedBrowser) {
    return "Unsupported";
  }

  if (store.rendererError) {
    return "Fallback Active";
  }

  return "Ready";
});

function setCustomIterations(event) {
  store.setCustomIterations(event.target.value);
}

function setColorMap(index) {
  store.colorMap = index;
}

function setZoomCenter(index, value) {
  store.setZoomCenter(index, value);
}

function setZoomSizeInverted(value) {
  store.setZoomSizeInverted(value);
}

function setRendererBackend(backend) {
  if (backend === "webgpu" && !store.capabilities.webgpu) {
    return;
  }

  if (backend === "webgl2" && !store.capabilities.webgl2) {
    return;
  }

  store.setRendererBackend(backend);
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

.rendererButtons {
  gap: 8px;
  flex-wrap: wrap;
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

.renderer-button {
  display: inline-block;
  padding: 0.65em 1.2em;
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 0.25em;
  background: rgba(255, 255, 255, 0.08);
  color: white;
  font-size: 0.95em;
  font-weight: 700;
  cursor: pointer;
  user-select: none;
  transition: background-color 0.15s ease-in-out, opacity 0.15s ease-in-out;
}

.renderer-button.active {
  background: rgba(255, 255, 255, 0.25);
}

.renderer-button.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.errorMessage {
  margin-bottom: 10px;
  color: #ff8a8a;
  font-weight: 700;
}
</style>
