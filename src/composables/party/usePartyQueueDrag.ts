/**
 * Drag a party queue row to a new position with mouse or touch. Rows mark
 * themselves with data-party-queue-index.
 */

import { ref } from "vue";

const ROW_SELECTOR = "[data-party-queue-index]";
const dropIndex = ref<number | null>(null);

export function usePartyQueueDrag(
  getIndex: () => number,
  getFirstIndex: () => number,
  onMove: (posShift: number) => void,
) {
  let dragging = false;

  const onPointerDown = (event: PointerEvent) => {
    dragging = true;
    (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
    dropIndex.value = getIndex();
  };

  const onPointerMove = (event: PointerEvent) => {
    if (!dragging) return;
    const row = document
      .elementFromPoint(event.clientX, event.clientY)
      ?.closest<HTMLElement>(ROW_SELECTOR);
    const index = Number(row?.dataset.partyQueueIndex);
    if (row && index >= getFirstIndex()) dropIndex.value = index;
  };

  const finish = () => {
    const target = dropIndex.value;
    dragging = false;
    dropIndex.value = null;
    return target;
  };

  const onPointerUp = () => {
    if (!dragging) return;
    const target = finish();
    if (target !== null && target !== getIndex()) {
      onMove(target - getIndex());
    }
  };

  return {
    dropIndex,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel: finish,
  };
}
