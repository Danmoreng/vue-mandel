import { defineStore } from "pinia";

export const useStore = defineStore("store", {
  state: () => ({
    clientWidth: 200,
    clientHeight: 200,
    renderWidth: 200,
    renderHeight: 200,
    capabilitiesChecked: false,
    unsupportedBrowser: false,
    rendererBackend: "webgl2",
    capabilities: {
      webgl2: false,
      webgpu: false,
    },
    rendererError: "",
    usedGPU: "",
    showControls: true,
    colorMap: 0,
    invertColorMap: false,
    zoomCenter: [0, 0],
    zoomSize: 5.0,
    zoomSizeInverted: 1 / 5.0,
    maxIterations: 100,
    customIterations: 0,
  }),
  actions: {
    calcIterations() {
      this.maxIterations = Math.max(
        100,
        Math.floor(Math.log(1 / this.zoomSize) * 40)
      );
    },
    syncZoomSizeInverted() {
      this.zoomSizeInverted = Math.floor((1 / this.zoomSize) * 100) / 100;
    },
    resetView() {
      this.zoomCenter[0] = 0;
      this.zoomCenter[1] = 0;
      this.zoomSize = 5.0;
      this.syncZoomSizeInverted();
      this.setCustomIterations(0);
    },
    setZoomCenter(index, value) {
      const parsed = Number(value);
      this.zoomCenter[index] = Number.isFinite(parsed) ? parsed : 0;
    },
    setZoomSizeInverted(value) {
      const parsed = Number(value);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        return;
      }

      this.zoomSizeInverted = parsed;
      this.zoomSize = 1 / parsed;
      if (this.customIterations === 0) {
        this.calcIterations();
      }
    },
    updateZoom(delta) {
      if (delta > 0) {
        this.zoomSize -= this.zoomSize / 10;
      } else {
        this.zoomSize += this.zoomSize / 10;
      }

      this.syncZoomSizeInverted();
      if (this.customIterations === 0) {
        this.calcIterations();
      }
    },
    setCustomIterations(value) {
      let parsed = Number(value);
      if (value === "" || !Number.isFinite(parsed) || parsed < 0) {
        parsed = 0;
      }
      parsed = Math.floor(parsed);

      if (parsed === 0) {
        this.calcIterations();
      } else {
        this.maxIterations = parsed;
      }
      this.customIterations = parsed;
    },
    setCapabilities(value) {
      this.capabilities = value;
      this.capabilitiesChecked = true;
      this.unsupportedBrowser = !value.webgl2;
    },
    setRendererBackend(value) {
      this.rendererBackend = value;
    },
    setRendererError(value) {
      this.rendererError = value;
    },
    setUnsupportedBrowser(value) {
      this.unsupportedBrowser = value;
    },
  },
});
