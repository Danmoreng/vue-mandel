import shaderCode from "@/renderers/webgpu/mandelbrot.wgsl?raw";
import { getColorCode } from "@/renderers/types";

const UNIFORM_BUFFER_SIZE = 32;
const GPU_BUFFER_USAGE = window.GPUBufferUsage;

function getAdapterDescription(adapter) {
  const description = adapter.info?.description?.trim();
  if (description) {
    return description;
  }

  const vendor = adapter.info?.vendor?.trim();
  const architecture = adapter.info?.architecture?.trim();
  return [vendor, architecture, "WebGPU"].filter(Boolean).join(" ");
}

/**
 * @returns {{
 *   init: (canvas: HTMLCanvasElement) => Promise<{ backend: string, gpuName: string }>,
 *   resize: (state: import("@/renderers/types").MandelbrotRenderState) => void,
 *   render: (state: import("@/renderers/types").MandelbrotRenderState) => void,
 *   dispose: () => void,
 *   getInfo: () => { backend: string, gpuName: string }
 * }}
 */
export function createWebGPURenderer() {
  let adapter = null;
  let device = null;
  let context = null;
  let pipeline = null;
  let bindGroup = null;
  let uniformBuffer = null;
  let presentationFormat = null;
  let gpuName = "";

  return {
    async init(canvas) {
      if (!navigator.gpu) {
        throw new Error("WebGPU is not available in this browser.");
      }

      adapter = await navigator.gpu.requestAdapter();
      if (!adapter) {
        throw new Error("Unable to acquire a WebGPU adapter.");
      }

      device = await adapter.requestDevice();
      context = canvas.getContext("webgpu");

      if (!context) {
        throw new Error("Unable to create a WebGPU canvas context.");
      }

      presentationFormat = navigator.gpu.getPreferredCanvasFormat();
      context.configure({
        device,
        format: presentationFormat,
        alphaMode: "premultiplied",
      });

      uniformBuffer = device.createBuffer({
        size: UNIFORM_BUFFER_SIZE,
        usage: GPU_BUFFER_USAGE.UNIFORM | GPU_BUFFER_USAGE.COPY_DST,
      });

      const shaderModule = device.createShaderModule({
        code: shaderCode,
      });

      pipeline = device.createRenderPipeline({
        layout: "auto",
        vertex: {
          module: shaderModule,
          entryPoint: "vertexMain",
        },
        fragment: {
          module: shaderModule,
          entryPoint: "fragmentMain",
          targets: [
            {
              format: presentationFormat,
            },
          ],
        },
        primitive: {
          topology: "triangle-list",
        },
      });

      bindGroup = device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [
          {
            binding: 0,
            resource: {
              buffer: uniformBuffer,
            },
          },
        ],
      });

      gpuName = getAdapterDescription(adapter) || "WebGPU Renderer";

      return this.getInfo();
    },

    resize() {
      if (!context || !device || !presentationFormat) {
        return;
      }

      context.configure({
        device,
        format: presentationFormat,
        alphaMode: "premultiplied",
      });
    },

    render(state) {
      if (!device || !context || !pipeline || !bindGroup || !uniformBuffer) {
        return;
      }

      const uniformData = new Float32Array([
        state.renderWidth,
        state.renderHeight,
        state.zoomCenter[0],
        state.zoomCenter[1],
        state.zoomSize,
        state.maxIterations,
        getColorCode(state),
        0,
      ]);

      device.queue.writeBuffer(uniformBuffer, 0, uniformData);

      const commandEncoder = device.createCommandEncoder();
      const renderPass = commandEncoder.beginRenderPass({
        colorAttachments: [
          {
            view: context.getCurrentTexture().createView(),
            clearValue: [0, 0, 0, 1],
            loadOp: "clear",
            storeOp: "store",
          },
        ],
      });

      renderPass.setPipeline(pipeline);
      renderPass.setBindGroup(0, bindGroup);
      renderPass.draw(3);
      renderPass.end();

      device.queue.submit([commandEncoder.finish()]);
    },

    dispose() {
      if (context) {
        context.unconfigure();
      }

      if (uniformBuffer) {
        uniformBuffer.destroy();
      }

      if (device) {
        device.destroy();
      }

      adapter = null;
      device = null;
      context = null;
      pipeline = null;
      bindGroup = null;
      uniformBuffer = null;
      presentationFormat = null;
      gpuName = "";
    },

    getInfo() {
      return {
        backend: "webgpu",
        gpuName,
      };
    },
  };
}
