export function useCanvasInteractions(store) {
  let mouseDown = false;
  const currentMousePoint = {
    x: 0,
    y: 0,
  };
  const currentTouchPoint = {
    x: 0,
    y: 0,
  };
  let initialTouchDistance = 0;

  function handleWheel(event) {
    store.updateZoom(event.deltaY * -1);
  }

  function handleMouseDown(event) {
    currentMousePoint.x = event.x;
    currentMousePoint.y = event.y;
    mouseDown = true;
  }

  function handleMouseMove(event) {
    if (!mouseDown) {
      return;
    }

    const deltaX =
      ((currentMousePoint.x - event.x) / store.clientWidth) * store.zoomSize;
    const deltaY =
      ((currentMousePoint.y - event.y) / store.clientHeight) * store.zoomSize;

    currentMousePoint.x = event.x;
    currentMousePoint.y = event.y;
    store.zoomCenter[0] += deltaX;
    store.zoomCenter[1] -= deltaY;
  }

  function handleMouseUp() {
    mouseDown = false;
  }

  function handleTouchStart(event) {
    if (event.touches.length >= 2) {
      const x1 = event.touches[0].clientX;
      const y1 = event.touches[0].clientY;
      const x2 = event.touches[1].clientX;
      const y2 = event.touches[1].clientY;

      initialTouchDistance = Math.sqrt(
        Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)
      );
      return;
    }

    currentTouchPoint.x = event.touches[0].clientX;
    currentTouchPoint.y = event.touches[0].clientY;
  }

  function handleTouchMove(event) {
    if (event.touches.length >= 2) {
      const x1 = event.touches[0].clientX;
      const y1 = event.touches[0].clientY;
      const x2 = event.touches[1].clientX;
      const y2 = event.touches[1].clientY;
      const currentTouchDistance = Math.sqrt(
        Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)
      );
      const delta = currentTouchDistance - initialTouchDistance;

      initialTouchDistance = currentTouchDistance;
      store.updateZoom(delta);
      return;
    }

    if (event.touches.length !== 1) {
      return;
    }

    const deltaX = event.touches[0].clientX - currentTouchPoint.x;
    const deltaY = event.touches[0].clientY - currentTouchPoint.y;

    currentTouchPoint.x = event.touches[0].clientX;
    currentTouchPoint.y = event.touches[0].clientY;
    store.zoomCenter[0] -= (deltaX / store.clientWidth) * store.zoomSize;
    store.zoomCenter[1] += (deltaY / store.clientHeight) * store.zoomSize;
  }

  function handleTouchEnd() {
    initialTouchDistance = 0;
    currentTouchPoint.x = 0;
    currentTouchPoint.y = 0;
  }

  function resetInteractionState() {
    mouseDown = false;
    initialTouchDistance = 0;
    currentTouchPoint.x = 0;
    currentTouchPoint.y = 0;
  }

  return {
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    resetInteractionState,
  };
}
