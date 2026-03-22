<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import {
  createRenderer,
  detectRendererCapabilities,
  getPreferredRendererBackend,
} from "@/renderers";
import { useCanvasInteractions } from "@/composables/useCanvasInteractions";
import { useStore } from "@/store/store";

const store = useStore();
const myCanvas = ref(null);
const canvasKey = ref(0);
let renderer = null;
let unsubscribeStore = null;
let initialRenderTimeout = null;
let isMounted = false;
let suppressBackendWatcher = false;
let canvasHasContext = false;
const {
  handleWheel,
  handleMouseDown,
  handleMouseMove,
  handleMouseUp,
  handleTouchStart,
  handleTouchMove,
  handleTouchEnd,
  resetInteractionState,
} = useCanvasInteractions(store);

onMounted(() => {
  isMounted = true;

  if (getViewportSize().width < 500) {
    store.showControls = false;
  }

  unsubscribeStore = store.$subscribe(() => {
    window.requestAnimationFrame(renderFrame);
  });
  window.addEventListener("resize", resize);

  void initializeRendererCapabilities();
});

onBeforeUnmount(() => {
  isMounted = false;

  if (unsubscribeStore) {
    unsubscribeStore();
    unsubscribeStore = null;
  }

  if (initialRenderTimeout) {
    window.clearTimeout(initialRenderTimeout);
    initialRenderTimeout = null;
  }

  window.removeEventListener("resize", resize);
  resetInteractionState();
  disposeRenderer();
});

watch(
  () => store.rendererBackend,
  (backend, previousBackend) => {
    if (!isMounted || suppressBackendWatcher || backend === previousBackend) {
      return;
    }

    void activateRenderer(backend);
  }
);

function getViewportSize() {
  return {
    width: window.visualViewport?.width ?? window.innerWidth,
    height: window.visualViewport?.height ?? window.innerHeight,
  };
}

async function initializeRendererCapabilities() {
  const capabilities = await detectRendererCapabilities();
  if (!isMounted) {
    return;
  }

  store.setCapabilities(capabilities);
  const preferredBackend = getPreferredRendererBackend(
    capabilities,
    store.rendererBackend
  );

  if (!preferredBackend) {
    store.usedGPU = "";
    store.setUnsupportedBrowser(true);
    store.setRendererError(
      "This browser does not support the WebGL2 baseline."
    );
    return;
  }

  await activateRenderer(preferredBackend);
}

async function activateRenderer(requestedBackend) {
  const preferredBackend = getPreferredRendererBackend(
    store.capabilities,
    requestedBackend
  );

  if (!preferredBackend) {
    disposeRenderer();
    store.usedGPU = "";
    store.setUnsupportedBrowser(true);
    store.setRendererError(
      "This browser does not support the WebGL2 baseline."
    );
    return;
  }

  disposeRenderer();
  if (canvasHasContext) {
    await recreateCanvas();
  }

  if (!myCanvas.value) {
    return;
  }

  store.setRendererError("");
  store.setUnsupportedBrowser(false);

  let nextRenderer = null;
  try {
    nextRenderer = createRenderer(preferredBackend);
    canvasHasContext = true;
    const rendererInfo = await nextRenderer.init(myCanvas.value);

    renderer = nextRenderer;
    setRendererBackendSilently(preferredBackend);
    store.usedGPU = rendererInfo.gpuName;
    resize();
  } catch (error) {
    console.error(error);
    nextRenderer?.dispose();
    disposeRenderer();

    if (preferredBackend !== "webgl2" && store.capabilities.webgl2) {
      store.setRendererError(
        `${preferredBackend} failed to initialize. Falling back to WebGL2.`
      );
      await activateRenderer("webgl2");
      return;
    }

    store.usedGPU = "";
    store.setRendererError(
      error instanceof Error ? error.message : "Renderer initialization failed."
    );
  }
}

function disposeRenderer() {
  if (renderer) {
    renderer.dispose();
    renderer = null;
  }
}

async function recreateCanvas() {
  canvasKey.value += 1;
  await nextTick();
  canvasHasContext = false;
}

function setRendererBackendSilently(value) {
  suppressBackendWatcher = true;
  store.setRendererBackend(value);
  suppressBackendWatcher = false;
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
  if (!renderer) {
    return;
  }

  renderer.render(store);
}
</script>

<template>
  <canvas
    :key="canvasKey"
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
