import { createWebGL2Renderer } from "@/renderers/webgl2/renderer";
import { createWebGPURenderer } from "@/renderers/webgpu/renderer";

export const rendererLabels = {
  webgl2: "WebGL2",
  webgpu: "WebGPU",
};

export async function detectRendererCapabilities() {
  const canvas = document.createElement("canvas");
  const webgl2 = Boolean(
    canvas.getContext("webgl2", {
      powerPreference: "high-performance",
    })
  );

  let webgpu = false;
  if (navigator.gpu) {
    try {
      const adapter = await navigator.gpu.requestAdapter();
      if (adapter) {
        const device = await adapter.requestDevice();
        device.destroy();
        webgpu = true;
      }
    } catch (error) {
      console.warn("WebGPU capability detection failed.", error);
    }
  }

  return {
    webgl2,
    webgpu,
  };
}

export function getPreferredRendererBackend(capabilities, requestedBackend) {
  if (requestedBackend === "webgpu" && capabilities.webgpu) {
    return "webgpu";
  }

  if (capabilities.webgl2) {
    return "webgl2";
  }

  return null;
}

export function createRenderer(backend) {
  if (backend === "webgl2") {
    return createWebGL2Renderer();
  }

  if (backend === "webgpu") {
    return createWebGPURenderer();
  }

  throw new Error(`Unsupported renderer backend: ${backend}`);
}
