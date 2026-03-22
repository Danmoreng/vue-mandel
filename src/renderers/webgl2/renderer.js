import fragmentShaderRaw from "@/webgl/FragmentShader.frag?raw";
import vertexShaderRaw from "@/webgl/VertexShader.vert?raw";
import { getColorCode } from "@/renderers/types";

function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const infoLog = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(infoLog || "Shader compilation failed.");
  }

  return shader;
}

function createProgram(gl, vertexSource, fragmentSource) {
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  const program = gl.createProgram();

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const infoLog = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    throw new Error(infoLog || "Program linking failed.");
  }

  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  return program;
}

/**
 * @returns {{
 *   init: (canvas: HTMLCanvasElement) => { backend: string, gpuName: string },
 *   resize: (state: import("@/renderers/types").MandelbrotRenderState) => void,
 *   render: (state: import("@/renderers/types").MandelbrotRenderState) => void,
 *   dispose: () => void,
 *   getInfo: () => { backend: string, gpuName: string }
 * }}
 */
export function createWebGL2Renderer() {
  let gl = null;
  let program = null;
  let vertexBuffer = null;
  let gpuName = "";
  const uniforms = {
    width: null,
    height: null,
    zoomCenter: null,
    zoomSize: null,
    maxIterations: null,
    colorMap: null,
  };

  return {
    init(canvas) {
      gl = canvas.getContext("webgl2", {
        powerPreference: "high-performance",
      });

      if (!gl) {
        throw new Error("WebGL2 is not supported in this browser.");
      }

      const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
      gpuName = debugInfo
        ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
        : "WebGL2 Renderer";

      program = createProgram(gl, vertexShaderRaw, fragmentShaderRaw);
      gl.useProgram(program);

      vertexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 3, -1, -1, 3]),
        gl.STATIC_DRAW
      );

      const attribLocation = gl.getAttribLocation(program, "a_Position");
      gl.enableVertexAttribArray(attribLocation);
      gl.vertexAttribPointer(attribLocation, 2, gl.FLOAT, false, 0, 0);

      for (const uniformName of Object.keys(uniforms)) {
        uniforms[uniformName] = gl.getUniformLocation(
          program,
          `u_${uniformName}`
        );
      }

      return this.getInfo();
    },

    resize(state) {
      if (!gl) {
        return;
      }

      gl.uniform1f(uniforms.width, state.renderWidth);
      gl.uniform1f(uniforms.height, state.renderHeight);
      gl.viewport(0, 0, state.renderWidth, state.renderHeight);
    },

    render(state) {
      if (!gl) {
        return;
      }

      gl.uniform2f(
        uniforms.zoomCenter,
        Math.fround(state.zoomCenter[0]),
        Math.fround(state.zoomCenter[1])
      );
      gl.uniform1f(uniforms.zoomSize, state.zoomSize);
      gl.uniform1i(uniforms.maxIterations, state.maxIterations);
      gl.uniform1i(uniforms.colorMap, getColorCode(state));
      gl.clearColor(0.0, 0.0, 0.0, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },

    dispose() {
      if (!gl) {
        return;
      }

      if (vertexBuffer) {
        gl.deleteBuffer(vertexBuffer);
      }

      if (program) {
        gl.deleteProgram(program);
      }

      gl = null;
      program = null;
      vertexBuffer = null;
      gpuName = "";

      for (const uniformName of Object.keys(uniforms)) {
        uniforms[uniformName] = null;
      }
    },

    getInfo() {
      return {
        backend: "webgl2",
        gpuName,
      };
    },
  };
}
