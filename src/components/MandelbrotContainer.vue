<script setup>
import { onBeforeUnmount, onMounted, ref } from "vue";
import { useStore } from "@/store/store";
import { createWebGL2Renderer } from "@/renderers/webgl2/renderer";

const store = useStore();
const myCanvas = ref(null);
let renderer = null;
let unsubscribeStore = null;
let initialRenderTimeout = null;
let mouseDown = false;
const currentMousePoint = {
  x: 0,
  y: 0,
};
const currentTouchPoint = {
  x: 0,
  y: 0,
};
let initialTouchDistance = 0;

onMounted(() => {
  if (getViewportSize().width < 500) {
    store.showControls = false;
  }

  renderer = createWebGL2Renderer();

  try {
    const rendererInfo = renderer.init(myCanvas.value);
    store.usedGPU = rendererInfo.gpuName;
  } catch (error) {
    console.error(error);
    store.usedGPU = "";
    return;
  }

  unsubscribeStore = store.$subscribe(() => {
    window.requestAnimationFrame(renderFrame);
  });
  window.addEventListener("resize", resize);
  resize();
});

onBeforeUnmount(() => {
  if (unsubscribeStore) {
    unsubscribeStore();
    unsubscribeStore = null;
  }

  if (initialRenderTimeout) {
    window.clearTimeout(initialRenderTimeout);
    initialRenderTimeout = null;
  }

  window.removeEventListener("resize", resize);
  mouseDown = false;
  initialTouchDistance = 0;

  if (renderer) {
    renderer.dispose();
    renderer = null;
  }
});

function getViewportSize() {
  return {
    width: window.visualViewport?.width ?? window.innerWidth,
    height: window.visualViewport?.height ?? window.innerHeight,
  };
}

function handleWheel(event) {
  updateZoom(event.deltaY * -1);
}

function handleMouseDown(event) {
  currentMousePoint.x = event.x;
  currentMousePoint.y = event.y;
  mouseDown = true;
}

function handleMouseMove(event) {
  if (!mouseDown) {
    return;
  }

  const deltaX =
    ((currentMousePoint.x - event.x) / store.clientWidth) * store.zoomSize;
  const deltaY =
    ((currentMousePoint.y - event.y) / store.clientHeight) * store.zoomSize;

  currentMousePoint.x = event.x;
  currentMousePoint.y = event.y;
  store.zoomCenter[0] += deltaX;
  store.zoomCenter[1] -= deltaY;
}

function handleMouseUp() {
  mouseDown = false;
}

function handleTouchStart(event) {
  if (event.touches.length >= 2) {
    const x1 = event.touches[0].clientX;
    const y1 = event.touches[0].clientY;
    const x2 = event.touches[1].clientX;
    const y2 = event.touches[1].clientY;

    initialTouchDistance = Math.sqrt(
      Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)
    );
    return;
  }

  currentTouchPoint.x = event.touches[0].clientX;
  currentTouchPoint.y = event.touches[0].clientY;
}

function handleTouchMove(event) {
  if (event.touches.length >= 2) {
    const x1 = event.touches[0].clientX;
    const y1 = event.touches[0].clientY;
    const x2 = event.touches[1].clientX;
    const y2 = event.touches[1].clientY;
    const currentTouchDistance = Math.sqrt(
      Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)
    );
    const delta = currentTouchDistance - initialTouchDistance;

    initialTouchDistance = currentTouchDistance;
    updateZoom(delta);
    return;
  }

  if (event.touches.length !== 1) {
    return;
  }

  const deltaX = event.touches[0].clientX - currentTouchPoint.x;
  const deltaY = event.touches[0].clientY - currentTouchPoint.y;

  currentTouchPoint.x = event.touches[0].clientX;
  currentTouchPoint.y = event.touches[0].clientY;
  store.zoomCenter[0] -= (deltaX / store.clientWidth) * store.zoomSize;
  store.zoomCenter[1] += (deltaY / store.clientHeight) * store.zoomSize;
}

function handleTouchEnd() {
  initialTouchDistance = 0;
  currentTouchPoint.x = 0;
  currentTouchPoint.y = 0;
}

function updateZoom(delta) {
  if (delta > 0) {
    store.zoomSize -= store.zoomSize / 10;
  } else {
    store.zoomSize += store.zoomSize / 10;
  }
  store.zoomSizeInverted = Math.floor((1 / store.zoomSize) * 100) / 100;
  if (store.customIterations === 0) {
    store.calcIterations();
  }
}

function resize() {
  if (!myCanvas.value || !renderer) {
    return;
  }

  const viewport = getViewportSize();

  // Fix Canvas CSS size to fit screen
  myCanvas.value.style.width = viewport.width + "px";
  myCanvas.value.style.height = viewport.height + "px";
  // Store client width and height for zoom & pan interactions
  store.clientWidth = viewport.width;
  store.clientHeight = viewport.height;
  // Scale Cavas Render Size to match devicePixelRatio
  store.renderWidth = Math.floor(viewport.width * devicePixelRatio);
  store.renderHeight = Math.floor(viewport.height * devicePixelRatio);
  renderer.resize(store);

  if (initialRenderTimeout) {
    window.clearTimeout(initialRenderTimeout);
  }

  initialRenderTimeout = window.setTimeout(() => {
    renderFrame();
  }, 1500);
}

function renderFrame() {
  renderer?.render(store);
}
</script>

<template>
  <canvas
    ref="myCanvas"
    :width="store.renderWidth"
    :height="store.renderHeight"
    @mousedown="handleMouseDown"
    @mousemove="handleMouseMove"
    @mouseup="handleMouseUp"
    @mouseleave="handleMouseUp"
    @touchend="handleTouchEnd"
    @touchmove="handleTouchMove"
    @touchstart="handleTouchStart"
    @wheel="handleWheel"
  ></canvas>
</template>

<style scoped>
canvas {
  margin: 0;
  padding: 0;
  top: 0;
  left: 0;
}
</style>
