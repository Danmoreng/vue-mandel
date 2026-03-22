import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it } from "vitest";
import { useStore } from "@/store/store";

describe("store actions", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("normalizes custom iterations from DOM string input", () => {
    const store = useStore();

    store.setCustomIterations("250.9");

    expect(store.customIterations).toBe(250);
    expect(store.maxIterations).toBe(250);
  });

  it("updates zoom size through the inverted control value", () => {
    const store = useStore();

    store.setZoomSizeInverted("4");

    expect(store.zoomSizeInverted).toBe(4);
    expect(store.zoomSize).toBe(0.25);
  });

  it("resets the view and keeps the control state in sync", () => {
    const store = useStore();
    store.zoomCenter[0] = 12;
    store.zoomCenter[1] = -8;
    store.zoomSize = 0.5;
    store.zoomSizeInverted = 2;
    store.setCustomIterations(250);

    store.resetView();

    expect(store.zoomCenter).toEqual([0, 0]);
    expect(store.zoomSize).toBe(5);
    expect(store.zoomSizeInverted).toBe(0.2);
    expect(store.customIterations).toBe(0);
  });

  it("marks browsers without WebGL2 as unsupported after capability detection", () => {
    const store = useStore();

    store.setCapabilities({ webgl2: false, webgpu: false });

    expect(store.capabilitiesChecked).toBe(true);
    expect(store.unsupportedBrowser).toBe(true);
  });
});
