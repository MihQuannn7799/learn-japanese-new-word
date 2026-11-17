const dragThreshold = 10;

function clearDrag(card) {
  delete card.dataset.swipe;
  card.classList.remove('is-dragging', 'swipe-ready');
  card.style.removeProperty('--swipe-x');
  card.style.removeProperty('--swipe-tilt');
}

export function bindFlashGestures(workspace, onRate) {
  let gesture;
  let suppressClick = false;

  workspace.addEventListener('pointerdown', (event) => {
    if (!event.isPrimary || event.button !== 0) return;
    suppressClick = false;
    const button = event.target.closest('.card-toggle');
    if (!button) return;
    const card = button.closest('.flash-face');
    gesture = {
      card, pointerId: event.pointerId, x: event.clientX, y: event.clientY,
      threshold: Math.min(88, card.clientWidth * 0.22), moved: false,
    };
    button.setPointerCapture(event.pointerId);
  });

  function displacement(event) {
    if (gesture?.pointerId !== event.pointerId || !gesture.card.isConnected) return null;
    const x = event.clientX - gesture.x;
    const y = event.clientY - gesture.y;
    const horizontal = Math.abs(x) > Math.abs(y) * 1.2;
    gesture.moved ||= Math.max(Math.abs(x), Math.abs(y)) >= dragThreshold;
    return { x, horizontal };
  }

  workspace.addEventListener('pointermove', (event) => {
    const offset = displacement(event);
    if (!offset || !gesture.moved) return;
    const { card, threshold } = gesture;
    const { x, horizontal } = offset;
    if (!horizontal || Math.abs(x) < dragThreshold) {
      clearDrag(card);
      return;
    }
    const travel = Math.max(-160, Math.min(160, x));
    card.classList.add('is-dragging');
    card.classList.toggle('swipe-ready', Math.abs(x) >= threshold);
    card.dataset.swipe = x > 0 ? 'right' : 'left';
    card.style.setProperty('--swipe-x', `${travel}px`);
    card.style.setProperty('--swipe-tilt', `${travel / 24}deg`);
  });

  workspace.addEventListener('pointerup', (event) => {
    if (gesture?.pointerId !== event.pointerId) return;
    const offset = displacement(event);
    const { card, moved, threshold } = gesture;
    gesture = undefined;
    suppressClick = moved;
    clearDrag(card);
    if (offset?.horizontal && Math.abs(offset.x) >= threshold) onRate(offset.x > 0);
  });

  function cancel(event) {
    if (gesture?.pointerId !== event.pointerId) return;
    clearDrag(gesture.card);
    suppressClick = gesture.moved;
    gesture = undefined;
  }

  workspace.addEventListener('pointercancel', cancel);
  workspace.addEventListener('lostpointercapture', cancel);
  workspace.addEventListener('click', (event) => {
    if (!suppressClick || event.detail === 0) return;
    if (!event.target.closest('.card-toggle')) return;
    event.preventDefault();
    event.stopPropagation();
  }, { capture: true });
}
