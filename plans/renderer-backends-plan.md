# Renderer Backends Plan

## Goal

Evolve the Mandelbrot viewer from a single WebGL 1 renderer into a dual-backend web app with:

- WebGL2 as the required baseline renderer
- WebGPU as an optional renderer on supported browsers
- runtime switching between WebGL2 and WebGPU when both are available
- graceful fallback to WebGL2 when WebGPU is unavailable or initialization fails

For now, the project will stay on single-precision `f32` math. The existing double-precision path is not part of the implementation plan and should be considered deprecated.

## Why This Approach

- WebGL2 remains the broadest safe browser baseline across Chrome, Firefox, and Safari.
- WebGPU support is now good enough to justify an optional backend, especially on Chrome and Safari, but not consistent enough to be the only renderer.
- Emulated double precision in fragment shaders is too slow and should not be the focus of this repo right now.
- A renderer abstraction keeps the Vue UI and interaction model stable while allowing multiple GPU backends.

## Scope

In scope:

- replace the current WebGL1 implementation with WebGL2
- implement a WebGPU renderer
- expose renderer selection in the UI
- detect capabilities and disable unsupported options
- remove double-precision state and unused live wiring

Out of scope for this phase:

- deep zoom / arbitrary precision
- WASM numeric backend
- perturbation or series approximation algorithms
- performance tuning beyond basic parity and correctness

## Current State

The current app:

- uses `src/components/MandelbrotContainer.vue` as a backend-agnostic canvas and interaction container
- uses `src/renderers/webgl/renderer.js` as the current renderer implementation
- imports raw GLSL shader strings from `src/webgl/FragmentShader.frag` and `src/webgl/VertexShader.vert`
- keeps application render state in Pinia while GPU resources live inside the renderer module
- contains an unused or incomplete double-precision shader path

This means the initial refactor boundary is in place, but the project still has only one active backend and still needs the WebGL2 and WebGPU milestones.

## Target Architecture

### 1. Shared renderer interface

Introduce a renderer contract that both backends implement.

Suggested surface:

- `init(canvas, state)`
- `resize(state)`
- `render(state)`
- `dispose()`
- `getInfo()`

The contract should be small and stateless where possible. Vue and Pinia should own application state; renderers should consume it.

### 2. Shared render state

Pinia remains the single source of truth for:

- canvas client size
- render width and height
- zoom center
- zoom size
- max iterations
- color map / invert flag
- selected backend
- backend capability flags
- backend status or init error

Add new store fields:

- `rendererBackend: "webgl2" | "webgpu"`
- `capabilities.webgl2`
- `capabilities.webgpu`
- optional `rendererError`

Remove or phase out double-related store fields after backend migration is complete.

### 3. Backend-agnostic container

`MandelbrotContainer.vue` should become an orchestration layer, not the renderer implementation.

Its responsibilities should be:

- own the canvas element
- detect capabilities
- create and destroy the selected renderer
- translate UI/store changes into renderer calls
- handle pointer, wheel, touch, and resize events

Its responsibilities should not include:

- shader compilation details
- direct WebGL2 or WebGPU setup code
- backend-specific uniform/buffer binding logic

### 4. Concrete renderer modules

Suggested structure:

- `src/renderers/types.js`
- `src/renderers/webgl2/renderer.js`
- `src/renderers/webgl2/mandelbrot.vert`
- `src/renderers/webgl2/mandelbrot.frag`
- `src/renderers/webgpu/renderer.js`
- `src/renderers/webgpu/mandelbrot.wgsl`
- optional `src/composables/useCanvasInteractions.js`

## Implementation Phases

### Phase 1: Refactor without behavior change

Objective:

- extract the current rendering logic behind a renderer interface while keeping the existing visual behavior

Tasks:

- move current renderer setup and draw logic out of `MandelbrotContainer.vue`
- keep the current shader math and color-map behavior unchanged
- keep store-driven redraws unchanged
- keep wheel, drag, touch, and resize behavior unchanged

Deliverable:

- one renderer implementation behind a clean interface

Status:

- implemented

### Phase 2: Upgrade the baseline renderer to WebGL2

Objective:

- replace the current WebGL1 path with WebGL2

Tasks:

- switch context creation from `webgl` to `webgl2`
- port shaders to GLSL ES 3.00
- replace `attribute` with `in`
- replace `gl_FragColor` with explicit fragment output
- verify fullscreen-triangle rendering still matches the current image

Deliverable:

- WebGL2 backend with behavior parity

Acceptance criteria:

- image output matches the current renderer closely
- interactions still work
- Chrome, Firefox, and Safari can render through WebGL2

### Phase 3: Add capability detection

Objective:

- determine at runtime which backends are available

Tasks:

- test WebGL2 availability with a temporary context
- test WebGPU availability via `navigator.gpu`
- if WebGPU exists, confirm adapter and device acquisition
- persist capability results in store

Behavior:

- if only WebGL2 is available, select it automatically
- if both are available, default to WebGL2 first unless a future product decision changes that
- if the chosen backend fails, fall back to WebGL2 and surface a non-fatal UI message

Deliverable:

- capability detection feeding renderer selection logic

### Phase 4: Add WebGPU backend

Objective:

- implement a WebGPU renderer with visual parity to WebGL2

Tasks:

- create a WebGPU render pipeline
- implement a WGSL shader equivalent to the active single-precision Mandelbrot shader
- define a shared uniform payload layout
- upload viewport, zoom, iteration, and color-map inputs through a uniform buffer
- render the same fullscreen geometry strategy

Deliverable:

- selectable WebGPU backend

Acceptance criteria:

- switching between WebGL2 and WebGPU preserves zoom and visual state
- image output stays materially equivalent
- backend failures do not crash the app

### Phase 5: Add backend switching UI

Objective:

- let users switch renderers where supported

Tasks:

- extend `Controls.vue` with a renderer selector
- show `WebGL2` and `WebGPU`
- disable or grey out `WebGPU` when unsupported
- optionally show a short reason or status text

Behavior:

- switching renderer should recreate backend resources cleanly
- switching should preserve zoom, iteration, and color-map settings

Deliverable:

- runtime backend selector in the controls panel

### Phase 6: Remove dead double-precision path

Objective:

- simplify the codebase after the new backend architecture is stable

Tasks:

- remove double-precision shader imports or unused references
- remove double-related store fields and uniform keys
- remove stale naming mismatches tied to abandoned code paths
- update docs to reflect the supported renderer set

Deliverable:

- cleaner single-precision dual-backend codebase

## UI Expectations

The controls panel should include a renderer section:

- `WebGL2`
- `WebGPU`

Rules:

- `WebGL2` is always the baseline target
- `WebGPU` is enabled only when support is confirmed
- unsupported options are visible but disabled
- selection state must reflect the actual active backend

Optional future enhancement:

- show renderer and GPU adapter info in the UI for debugging

## State and Data Contract

Define one backend-neutral render payload:

- `width`
- `height`
- `zoomCenterX`
- `zoomCenterY`
- `zoomSize`
- `maxIterations`
- `colorMapCode`

Both backends must render from the same values so the app does not drift visually depending on the selected renderer.

Color-map encoding should stay shared across backends:

- base values for `Viridis`, `Inferno`, `Plasma`
- inverted palette derived from the same state flag

## Error Handling

If WebGPU initialization fails after detection:

- log the backend error for debugging
- set a store-level error/status message
- fall back to WebGL2 automatically
- update the UI so it does not claim WebGPU is active

If WebGL2 is unavailable:

- show a fatal unsupported-browser message

The app should not silently fail into a blank canvas.

## Validation Plan

### Functional validation

Verify for both backends:

- initial render appears
- wheel zoom works
- mouse drag pans correctly
- touch pan and pinch behavior still work
- color map selection redraws correctly
- invert color map still works
- custom iterations still work
- resizing the viewport redraws correctly

### Browser validation

Target browsers:

- Chrome
- Firefox
- Safari

Expected behavior:

- Chrome: WebGL2 works, WebGPU available on supported environments
- Firefox: WebGL2 works, WebGPU only where the browser and platform actually support it
- Safari: WebGL2 works, WebGPU available on supported versions/platforms
- unsupported environments: WebGPU remains disabled and WebGL2 still works

### Build validation

Run:

- `npm run lint`
- `npm run build`

Rebuild `docs/` whenever the deployment artifact needs to be updated.

## Risks

- WebGPU support remains browser- and platform-dependent, especially outside Chrome
- shader parity bugs between GLSL and WGSL can create subtle image differences
- runtime switching requires careful cleanup of old GPU resources
- keeping Vue, store, and renderer responsibilities separate will require an initial refactor before feature work feels fast

## Decision Summary

The project should proceed with:

- WebGL2 as the baseline renderer
- WebGPU as an optional selectable backend
- single-precision rendering only for this phase
- no active double-precision implementation

This gives the project better browser coverage, a cleaner architecture, and a practical path toward future rendering experiments without overcommitting to WebGPU as the only runtime.
