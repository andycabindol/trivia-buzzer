/**
 * Master switch for onboarding UI motion (fade / translate).
 * Gameplay screens (buzzer, queue, scores) are never animated.
 */
export const ANIMATIONS_ENABLED = true;

/** Stagger delay in ms for list items (caps at index 12). */
export function motionStaggerDelay(index: number, stepMs = 45): number {
  return Math.min(index, 12) * stepMs;
}
