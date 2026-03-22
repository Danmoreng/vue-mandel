# AGENTS.md

## Purpose

This repository is a small Vue 3 + Vite Mandelbrot viewer. The app renders the fractal in a full-screen WebGL canvas and exposes navigation and rendering controls through a side panel. State is centralized in Pinia and shader source is imported as raw text at build time.

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

Notes:

- `npm run build` uses `vite build --base=/vue-mandel/`.
- Vite outputs production files into `docs/`.
- `docs/` is committed and appears to be the publish artifact for GitHub Pages. Do not hand-edit built files under `docs/assets`; rebuild instead.
- `lint` runs with `--fix`, so always review the diff after running it.

## Repository Layout

- `src/main.js`: creates the Vue app and installs Pinia.
- `src/App.vue`: top-level shell, reset button, controls toggle, and component composition.
- `src/components/MandelbrotContainer.vue`: owns the WebGL context, shader compilation, event handling, resize logic, and frame rendering.
- `src/components/Controls.vue`: side panel for color map selection, zoom inputs, custom iteration override, and GPU info display.
- `src/store/store.js`: shared render state and iteration helper logic.
- `src/webgl/`: active GLSL assets.
- `src/webgpu/`: currently unused exploratory shader asset.
- `docs/`: committed production build output.

## Runtime Architecture

### High-level flow

1. `src/main.js` mounts `App.vue` with a Pinia store.
2. `App.vue` renders the canvas container and the control panel side by side.
3. `MandelbrotContainer.vue` creates a WebGL context on mount, compiles the vertex and fragment shaders, creates a fullscreen triangle, resolves uniform locations from `store.uniform`, and renders frames.
4. UI events mutate Pinia state.
5. `store.$subscribe()` in `MandelbrotContainer.vue` schedules `renderFrame()` via `requestAnimationFrame`, so most store updates trigger a redraw.

### Store responsibilities

`src/store/store.js` is the shared contract between the UI and the renderer. It contains:

- Canvas client size and render size
- Current zoom center and zoom size
- Current iteration count and optional custom override
- Color-map selection and inversion flag
- GPU renderer label
- Cached uniform locations
- Pointer/touch interaction state

`calcIterations()` derives iteration count from zoom level when the user is not forcing a custom value. `setCustomIterations()` is the intended entry point for updating the override from the controls panel.

### Rendering details

`src/components/MandelbrotContainer.vue` is the core of the app:

- Creates a `webgl` context with `powerPreference: "high-performance"`.
- Reads `WEBGL_debug_renderer_info` to expose the renderer name in the UI.
- Imports `src/webgl/VertexShader.vert` and `src/webgl/FragmentShader.frag` with `?raw`.
- Uses a fullscreen triangle `[-1, -1, 3, -1, -1, 3]` rather than a quad.
- Writes `u_width`, `u_height`, `u_zoomCenter`, `u_zoomSize`, `u_maxIterations`, and `u_colorMap` uniforms before drawing.
- Keeps the canvas CSS size aligned with `window.visualViewport` and scales the backing buffer by `devicePixelRatio`.

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

`Controls.vue` relies on this encoding by setting base indices `0`, `2`, and `4`, then incrementing by one when `store.invertColorMap` is true.

## Current Caveats

These are existing repo behaviors. Do not accidentally “fix” them without confirming intent and testing the result.

- Only the single-precision WebGL fragment shader is wired into the app. `src/webgl/FragmentShaderDouble.frag` exists but is not imported by `MandelbrotContainer.vue`.
- `src/webgpu/VertexShader.wgsl` is not referenced anywhere in the app.
- The store declares `uniform.zoomCenterD`, while both fragment shaders declare `u_zoomCenterDouble`. The current live shader does not use the double-center uniform, so the mismatch is latent today but matters if the double-precision path is activated.
- The store defines `mandelbrotProgram`, but `MandelbrotContainer.vue` writes `mandelbrotPprogram` instead. Preserve awareness of that typo when refactoring.
- The reset button in `App.vue` resets `zoomSize` and iteration fields, but it does not also recompute `zoomSizeInverted`.
- `WEBGL_debug_renderer_info` is accessed without a guard. On browsers that block the extension, that code path may fail unless handled explicitly.
- There is no automated test suite in the repo today.

## Change Guidance

- Prefer changing state shape in one pass across `src/store/store.js`, `src/components/Controls.vue`, and `src/components/MandelbrotContainer.vue`. These files are tightly coupled.
- If you change uniforms in shaders, update the store’s `uniform` keys and the renderer’s uniform writes together.
- If you introduce a new rendering path, document clearly whether it replaces the current WebGL path or is optional.
- Keep `docs/` in sync with source changes when the task includes release/build output updates.
- Do not edit built assets in `docs/assets` directly.

## Validation Expectations

Because there are no tests, validation is mostly command-based and manual:

- Run `npm run lint`.
- Run `npm run build`.
- If you changed runtime behavior, verify in `npm run dev`:
  - initial render appears
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
