# AGENTS.md

## Purpose

This repository is a small Vue 3 + Vite Mandelbrot viewer. The app renders the fractal in a full-screen WebGL canvas and exposes navigation and rendering controls through a side panel. State is centralized in Pinia and shader source is imported as raw text at build time.

Project roadmap and renderer migration decisions live in `plans/renderer-backends-plan.md`. Keep `AGENTS.md` focused on repository workflow and implementation guidance rather than long-lived product planning.

## Stack

- Vue 3 with `<script setup>`
- Pinia for shared application state
- Vite for dev server and production build
- Raw GLSL shader imports via Vite
- ESLint + Prettier for formatting/linting

## Working Commands

Run these from the repo root:

- `npm ci`
- `npm run dev`
- `npm run build`
- `npm run preview`
- `npm run lint`
- `npm run test`

Notes:

- `npm run build` uses `vite build --base=/vue-mandel/`.
- Vite outputs production files into `docs/`.
- `docs/` is committed and appears to be the publish artifact for GitHub Pages. Do not hand-edit built files under `docs/assets`; rebuild instead.
- Do not store source documentation under `docs/`; the build output replaces that directory.
- `lint` runs with `--fix`, so always review the diff after running it.

## Repository Layout

- `src/main.js`: creates the Vue app and installs Pinia.
- `src/App.vue`: top-level shell, reset button, controls toggle, and component composition.
- `src/components/MandelbrotContainer.vue`: owns the canvas, interaction wiring, resize logic, and renderer lifecycle.
- `src/components/Controls.vue`: side panel for color map selection, zoom inputs, custom iteration override, and GPU info display.
- `src/composables/useCanvasInteractions.js`: shared pointer, wheel, and touch interaction logic for the canvas.
- `src/store/store.js`: shared render state and iteration helper logic.
- `src/renderers/`: rendering backend implementations and shared renderer helpers.
- `src/renderers/index.js`: renderer registry, backend labels, and capability detection.
- `src/webgl/`: active GLSL assets for the WebGL2 backend.
- `src/renderers/webgpu/`: active WebGPU backend implementation and WGSL shader.
- `src/store/*.test.js`, `src/renderers/*.test.js`: minimal Vitest coverage for store logic and backend selection helpers.
- `plans/`: source documentation for architecture and roadmap decisions.
- `docs/`: committed production build output.

## Runtime Architecture

### High-level flow

1. `src/main.js` mounts `App.vue` with a Pinia store.
2. `App.vue` renders the canvas container and the control panel side by side.
3. `MandelbrotContainer.vue` detects backend capabilities, creates the active renderer, wires interactions, and forwards resize and render calls.
4. UI events mutate Pinia state.
5. `store.$subscribe()` in `MandelbrotContainer.vue` schedules `renderFrame()` via `requestAnimationFrame`, so most store updates trigger a redraw through the active renderer.

### Store responsibilities

`src/store/store.js` is the shared contract between the UI and the renderer. It contains:

- Canvas client size and render size
- Current zoom center and zoom size
- Current iteration count and optional custom override
- Color-map selection and inversion flag
- Selected renderer backend and backend capability flags
- Non-fatal renderer initialization error text
- GPU renderer label

`calcIterations()` derives iteration count from zoom level when the user is not forcing a custom value. `setCustomIterations()` is the intended entry point for updating the override from the controls panel.

### Rendering details

`src/components/MandelbrotContainer.vue` is the core of the app:

- Owns the canvas element, local pointer/touch interaction state, and redraw scheduling.
- Uses `src/renderers/webgl2/renderer.js` as the current renderer backend.
- Keeps the canvas CSS size aligned with `window.visualViewport` and scales the backing buffer by `devicePixelRatio`.

`src/renderers/webgl2/renderer.js` currently:

- Creates a `webgl2` context with `powerPreference: "high-performance"`.
- Reads `WEBGL_debug_renderer_info` when available to expose the renderer name in the UI.
- Imports `src/webgl/VertexShader.vert` and `src/webgl/FragmentShader.frag` with `?raw`.
- Uses a fullscreen triangle `[-1, -1, 3, -1, -1, 3]` rather than a quad.
- Resolves and writes the current shader uniforms before drawing.

`src/renderers/index.js` currently:

- Detects `webgl2` and WebGPU support at startup.
- Chooses the preferred backend from the available capabilities.
- Provides the shared factory entry point for renderer creation.

`src/renderers/webgpu/renderer.js` currently:

- Creates a WebGPU adapter, device, canvas context, uniform buffer, bind group, and render pipeline.
- Uses `src/renderers/webgpu/mandelbrot.wgsl` for the single-precision Mandelbrot shader path.
- Matches the existing fullscreen-triangle rendering model used by the WebGL2 backend.

Interaction model:

- Mouse wheel zooms in or out.
- Mouse drag pans the viewport.
- Single-touch drag pans.
- Two-finger gesture adjusts zoom based on touch distance delta.

### Shader behavior

The active fragment shader is `src/webgl/FragmentShader.frag`. It:

- Maps each pixel to the complex plane using the current zoom center and zoom size.
- Applies aspect-ratio correction using render width and height.
- Iterates `z = z^2 + c` up to `u_maxIterations`.
- Selects one of three polynomial color maps: Viridis, Inferno, or Plasma.
- Uses even color-map indices for normal palettes and odd indices for inverted palettes.
- Uses GLSL ES 3.00 syntax for the WebGL2 pipeline.

`Controls.vue` relies on this encoding by setting base indices `0`, `2`, and `4`, then incrementing by one when `store.invertColorMap` is true.

It also exposes the runtime renderer selector:

- `WebGL2` is the baseline option.
- `WebGPU` is selectable only when capability detection marks it available.
- Backend initialization failures surface through `store.rendererError`, and the container falls back to `WebGL2` when possible.
- WebGPU drag/pan orientation is aligned with the WebGL2 coordinate system.

## Current Caveats

These are existing repo behaviors. Do not accidentally “fix” them without confirming intent and testing the result.

- Switching between WebGL2 and WebGPU recreates the canvas so each backend gets a fresh context family.
- The test suite is intentionally small and currently focuses on store logic and backend-selection helpers, not renderer output parity.

## Change Guidance

- Prefer changing state shape in one pass across `src/store/store.js`, `src/components/Controls.vue`, and `src/components/MandelbrotContainer.vue`. These files are tightly coupled.
- If you change uniforms in shaders, update the renderer’s uniform map and the corresponding uniform writes together.
- If you introduce a new rendering path, document clearly whether it replaces the current WebGL path or is optional.
- Keep `docs/` in sync with source changes when the task includes release/build output updates.
- Do not edit built assets in `docs/assets` directly.

## Validation Expectations

Because there are no tests, validation is mostly command-based and manual:

- Run `npm run lint`.
- Run `npm run test`.
- Run `npm run build`.
- If you changed runtime behavior, verify in `npm run dev`:
  - initial render appears
  - renderer switching still works
  - wheel zoom still works
  - drag and touch pan still work
  - color map and invert controls still redraw correctly
  - resizing the window still updates the canvas
  - the `docs/` output still reflects the current source if a build artifact update was required

## Style Notes

- The codebase uses double quotes and semicolons in JavaScript/Vue scripts.
- Vue components use `<script setup>`.
- Keep changes small and direct; this is a compact project with little abstraction.
- Favor repo-local conventions over introducing new patterns unless the change clearly justifies it.
