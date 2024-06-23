<script setup>
import { onMounted, ref } from "vue";
import { useStore } from "@/store/store";
import fragmentShaderRaw from "../webgl/FragmentShader.frag?raw";
import vertexShaderRaw from "../webgl/VertexShader.vert?raw";

const store = useStore();
const myCanvas = ref(null);
let gl = null;

onMounted(() => {
  if(window.visualViewport.width < 500) {
    store.showControls = false;
  }
  gl = myCanvas.value.getContext('webgl', { powerPreference: "high-performance" });
  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
  store.usedGPU = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
  const vertexShader = gl.createShader(gl.VERTEX_SHADER);
  const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(vertexShader, vertexShaderRaw);
  gl.shaderSource(fragmentShader, fragmentShaderRaw);
  gl.compileShader(vertexShader);
  gl.compileShader(fragmentShader);

  store.mandelbrotPprogram = gl.createProgram();
  gl.attachShader(store.mandelbrotPprogram, vertexShader);
  gl.attachShader(store.mandelbrotPprogram, fragmentShader);
  gl.linkProgram(store.mandelbrotPprogram);
  gl.useProgram(store.mandelbrotPprogram);
  const vertexBuf = gl.createBuffer(gl.ARRAY_BUFFER);
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuf);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 3, -1, -1, 3]),
    gl.STATIC_DRAW
  );

  /* set up the position attribute */
  const attribLocation = gl.getAttribLocation(
    store.mandelbrotPprogram,
    "a_Position"
  );
  gl.enableVertexAttribArray(attribLocation);
  gl.vertexAttribPointer(attribLocation, 2, gl.FLOAT, false, 0, 0);

  /* find uniform locations */
  const uniformNames = Object.keys(store.uniform);
  for (const uniformName of uniformNames) {
    store.uniform[uniformName] = gl.getUniformLocation(
      store.mandelbrotPprogram,
      `u_${uniformName}`
    );
  }
  myCanvas.value.addEventListener("wheel", (e) => {
    updateZoom(e.deltaY * -1);
  });

  myCanvas.value.addEventListener("mousedown", (e) => {
    store.currentMousePoint.x = e.x;
    store.currentMousePoint.y = e.y;
    store.mousedown = true;
  });

  myCanvas.value.addEventListener("mousemove", (e) => {
    if (store.mousedown) {
      const deltaX =
        ((store.currentMousePoint.x - e.x) / store.clientWidth) * store.zoomSize;
      const deltaY =
        ((store.currentMousePoint.y - e.y) / store.clientHeight) * store.zoomSize;
      store.currentMousePoint.x = e.x;
      store.currentMousePoint.y = e.y;
      store.zoomCenter[0] += deltaX;
      store.zoomCenter[1] -= deltaY;
    }
  });

  myCanvas.value.addEventListener("mouseup", () => {
    store.mousedown = false;
  });

  let initialTouchDistance = 0;

  myCanvas.value.addEventListener("touchstart", (e) => {
    if (e.touches.length >= 2) {
      // Calculate the initial distance between the two touch points
      const x1 = e.touches[0].clientX;
      const y1 = e.touches[0].clientY;
      const x2 = e.touches[1].clientX;
      const y2 = e.touches[1].clientY;
      initialTouchDistance = Math.sqrt(
        Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)
      );
    } else {
      // Store the initial touch point
      store.currentTouchPoint.x = e.touches[0].clientX;
      store.currentTouchPoint.y = e.touches[0].clientY;
    }
  });

  myCanvas.value.addEventListener("touchmove", (e) => {
    if (e.touches.length >= 2) {
      // Calculate the current distance between the two touch points
      const x1 = e.touches[0].clientX;
      const y1 = e.touches[0].clientY;
      const x2 = e.touches[1].clientX;
      const y2 = e.touches[1].clientY;
      const currentTouchDistance = Math.sqrt(
        Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)
      );

      // Calculate the change in distance between the two touch points
      const delta = currentTouchDistance - initialTouchDistance;
      // update TouchDistance
      initialTouchDistance = currentTouchDistance;

      // Update the zoom level based on the change in distance
      updateZoom(delta);
    } else if (e.touches.length === 1) {
      // Calculate the distance the touch point has moved since the last event
      const deltaX = e.touches[0].clientX - store.currentTouchPoint.x;
      const deltaY = e.touches[0].clientY - store.currentTouchPoint.y;

      // Update the current touch point
      store.currentTouchPoint.x = e.touches[0].clientX;
      store.currentTouchPoint.y = e.touches[0].clientY;

      // Pan the image based on the distance the touch point has moved
      store.zoomCenter[0] -= (deltaX / store.clientWidth) * store.zoomSize;
      store.zoomCenter[1] += (deltaY / store.clientHeight) * store.zoomSize;
    }
  });

  myCanvas.value.addEventListener("touchend", () => {
    // Reset the initial touch distance and current touch point when the touch gesture ends
    initialTouchDistance = 0;
    store.currentTouchPoint.x = 0;
    store.currentTouchPoint.y = 0;
  });

  /**
   * Subscribe to Store Changes via Control Panel
   */
  store.$subscribe(() => {
    window.requestAnimationFrame(renderFrame);
  });
  // Render Initial Frame
  resize();
});

function updateZoom(delta) {
  if (delta > 0) {
    store.zoomSize -= store.zoomSize / 10;
  } else {
    store.zoomSize += store.zoomSize / 10;
  }
  if (store.customIterations === 0) {
    store.calcIterations();
  }
}

function resize() {
  // Fix Canvas CSS size to fit screen
  myCanvas.value.style.width = window.visualViewport.width + 'px';
  myCanvas.value.style.height = window.visualViewport.height + 'px';
  // Store client width and height for zoom & pan interactions
  store.clientWidth = window.visualViewport.width;
  store.clientHeight = window.visualViewport.height;
  // Scale Cavas Render Size to match devicePixelRatio
  store.renderWidth = Math.floor(window.visualViewport.width * devicePixelRatio);
  store.renderHeight = Math.floor(window.visualViewport.height * devicePixelRatio);
  gl.uniform1f(store.uniform.width, store.renderWidth);
  gl.uniform1f(store.uniform.height, store.renderHeight);
  gl.viewport(0, 0, store.renderWidth, store.renderHeight);
  setTimeout(() => {
    renderFrame();
  }, 1500);
}

// let frameCounter = 0;
function renderFrame() {
  // frameCounter++;
  // console.log("rendering frame: " + frameCounter);
  /* bind inputs & render frame */
  gl.uniform2f(
    store.uniform.zoomCenter,
    Math.fround(store.zoomCenter[0]),
    Math.fround(store.zoomCenter[1])
  );
  gl.uniform2f(
    store.uniform.zoomCenterD,
    store.zoomCenter[0] - Math.fround(store.zoomCenter[0]),
    store.zoomCenter[1] - Math.fround(store.zoomCenter[1])
  );

  gl.uniform1f(store.uniform.zoomSize, store.zoomSize);
  gl.uniform1i(store.uniform.maxIterations, store.maxIterations);
  let colorCode = store.colorMap;
  if (store.invertColorMap) {
    colorCode++;
  }
  gl.uniform1i(store.uniform.colorMap, colorCode);
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}
window.addEventListener("resize", resize);
</script>

<template>
  <canvas ref="myCanvas" :width="store.renderWidth" :height="store.renderHeight"></canvas>
</template>

<style scoped>
canvas {
  margin: 0;
  padding: 0;
  top: 0;
  left: 0;
}
</style>
