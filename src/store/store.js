import { defineStore } from "pinia";

export const useStore = defineStore("store", {
  state: () => ({
    clientWidth: 200,
    clientHeight: 200,
    renderWidth: 200,
    renderHeight: 200,
    uniform: {
      width: 0,
      height: 0,
      zoomCenter: 0,
      zoomSize: 0,
      maxIterations: 0,
      colorMap: 0,
    },
    colorMap: 0,
    invertColorMap: false,
    zoomCenter: [0, 0],
    zoomSize: 5.0,
    maxIterations: 100,
    customIterations: 0,
    mandelbrotProgram: null,
    currentMousePoint: {
      x: 0,
      y: 0,
    },
    currentTouchPoint: {
      x: 0,
      y: 0,
    },
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
