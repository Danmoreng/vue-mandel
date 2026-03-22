/**
 * @typedef {Object} MandelbrotRenderState
 * @property {number} renderWidth
 * @property {number} renderHeight
 * @property {[number, number]} zoomCenter
 * @property {number} zoomSize
 * @property {number} maxIterations
 * @property {number} colorMap
 * @property {boolean} invertColorMap
 */

/**
 * Shared color map encoding used by all renderer backends.
 *
 * @param {MandelbrotRenderState} state
 * @returns {number}
 */
export function getColorCode(state) {
  return state.invertColorMap ? state.colorMap + 1 : state.colorMap;
}
