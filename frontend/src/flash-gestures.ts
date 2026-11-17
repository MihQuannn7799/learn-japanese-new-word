const dragThreshold = 10;

interface FlashGesture {
  card: HTMLElement;
  pointerId: number;
  x: number;
  y: number;
  threshold: number;
  moved: boolean;
}

function clearDrag(card: HTMLElement) {
  delete card.dataset.swipe;
  card.classList.remove('is-dragging', 'swipe-ready');
  card.style.removeProperty('--swipe-x');
  card.style.removeProperty('--swipe-tilt');
}

export function bindFlashGestures(workspace: HTMLElement, onRate: (remembered: boolean) => void): void {
  let gesture: FlashGesture | undefined;
  let suppressClick = false;

  workspace.addEventListener('pointerdown', (event) => {
    if (!event.isPrimary || event.button !== 0) return;
    suppressClick = false;
    const target = event.target;
    if (!(target instanceof Element)) return;
    const button = target.closest<HTMLButtonElement>('.card-toggle');
    const card = button?.closest<HTMLElement>('.flash-face');
    if (!button || !card) return;
    gesture = {
      card, pointerId: event.pointerId, x: event.clientX, y: event.clientY,
      threshold: Math.min(88, card.clientWidth * 0.22), moved: false,
    };
    button.setPointerCapture(event.pointerId);
  });

  function displacement(event: PointerEvent, active: FlashGesture) {
    const x = event.clientX - active.x;
    const y = event.clientY - active.y;
    const horizontal = Math.abs(x) > Math.abs(y) * 1.2;
    active.moved ||= Math.max(Math.abs(x), Math.abs(y)) >= dragThreshold;
    return { x, horizontal };
  }

  workspace.addEventListener('pointermove', (event) => {
    if (gesture?.pointerId !== event.pointerId || !gesture.card.isConnected) return;
    const { x, horizontal } = displacement(event, gesture);
    if (!gesture.moved) return;
    const { card, threshold } = gesture;
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
    const offset = gesture.card.isConnected ? displacement(event, gesture) : null;
    const { card, moved, threshold } = gesture;
    gesture = undefined;
    suppressClick = moved;
    clearDrag(card);
    if (offset?.horizontal && Math.abs(offset.x) >= threshold) onRate(offset.x > 0);
  });

  function cancel(event: PointerEvent) {
    if (gesture?.pointerId !== event.pointerId) return;
    clearDrag(gesture.card);
    suppressClick = gesture.moved;
    gesture = undefined;
  }

  workspace.addEventListener('pointercancel', cancel);
  workspace.addEventListener('lostpointercapture', cancel);
  workspace.addEventListener('click', (event) => {
    if (!suppressClick || event.detail === 0) return;
    if (!(event.target instanceof Element) || !event.target.closest('.card-toggle')) return;
    event.preventDefault();
    event.stopPropagation();
  }, { capture: true });
}
