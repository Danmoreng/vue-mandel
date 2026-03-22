import { describe, expect, it } from "vitest";
import { getPreferredRendererBackend, rendererLabels } from "@/renderers/index";
import { getColorCode } from "@/renderers/types";

describe("renderer helpers", () => {
  it("prefers the requested WebGPU backend when it is available", () => {
    expect(
      getPreferredRendererBackend({ webgl2: true, webgpu: true }, "webgpu")
    ).toBe("webgpu");
  });

  it("falls back to WebGL2 when WebGPU is unavailable", () => {
    expect(
      getPreferredRendererBackend({ webgl2: true, webgpu: false }, "webgpu")
    ).toBe("webgl2");
  });

  it("returns null when no supported backend exists", () => {
    expect(
      getPreferredRendererBackend({ webgl2: false, webgpu: false }, "webgl2")
    ).toBeNull();
  });

  it("encodes the color map inversion flag", () => {
    expect(getColorCode({ colorMap: 4, invertColorMap: false })).toBe(4);
    expect(getColorCode({ colorMap: 4, invertColorMap: true })).toBe(5);
  });

  it("exposes user-facing backend labels", () => {
    expect(rendererLabels.webgl2).toBe("WebGL2");
    expect(rendererLabels.webgpu).toBe("WebGPU");
  });
});
