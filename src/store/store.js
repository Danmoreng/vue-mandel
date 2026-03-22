import { defineStore } from "pinia";

export const useStore = defineStore("store", {
  state: () => ({
    clientWidth: 200,
    clientHeight: 200,
    renderWidth: 200,
    renderHeight: 200,
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
    setCustomIterations(value) {
      if (value === "" || value < 0) {
        value = 0;
      }
      if (value === 0) {
        this.calcIterations();
      } else {
        this.maxIterations = value;
      }
      this.customIterations = value;
    },
  },
});
