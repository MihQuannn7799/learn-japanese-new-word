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
  card.style.removeProperty('--swipe-transform');
}

function swipeTransform(x: number) {
  const tilt = Math.max(-10, Math.min(10, x / 24));
  return `translate3d(${x}px, 0, 0) rotate(${tilt}deg)`;
}

function completeSwipe(workspace: HTMLElement, card: HTMLElement, x: number, onRate: (remembered: boolean) => void) {
  const remembered = x > 0;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !card.animate) {
    onRate(remembered);
    return;
  }

  const height = card.offsetHeight;
  const exitDistance = Math.max(card.offsetWidth, Math.abs(x)) + 24;
  onRate(remembered);

  const deck = workspace.querySelector<HTMLElement>('.flash-deck');
  if (!deck || card.isConnected) return;

  // Keep the outgoing face visible while the new deck is already interactive.
  const incoming = deck.firstElementChild;
  card.querySelectorAll('[id]').forEach((element) => element.removeAttribute('id'));
  card.inert = true;
  card.classList.add('is-leaving', 'swipe-ready');
  card.dataset.swipe = remembered ? 'right' : 'left';
  card.style.height = `${height}px`;
  deck.append(card);

  const duration = 230;
  const exit = card.animate([
    { transform: swipeTransform(x), opacity: 1 },
    { transform: swipeTransform(Math.sign(x) * exitDistance), opacity: 0 },
  ], { duration, easing: 'cubic-bezier(.22,.7,.38,1)', fill: 'forwards' });
  exit.onfinish = exit.oncancel = () => card.remove();
  incoming?.animate([{ opacity: .45 }, { opacity: 1 }], { duration, easing: 'ease-out' });
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
    card.classList.add('is-dragging');
    card.classList.toggle('swipe-ready', Math.abs(x) >= threshold);
    card.dataset.swipe = x > 0 ? 'right' : 'left';
    card.style.setProperty('--swipe-transform', swipeTransform(x));
  });

  workspace.addEventListener('pointerup', (event) => {
    if (gesture?.pointerId !== event.pointerId) return;
    const offset = gesture.card.isConnected ? displacement(event, gesture) : null;
    const { card, moved, threshold } = gesture;
    gesture = undefined;
    suppressClick = moved;
    if (offset?.horizontal && Math.abs(offset.x) >= threshold) {
      completeSwipe(workspace, card, offset.x, onRate);
    } else {
      clearDrag(card);
    }
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
