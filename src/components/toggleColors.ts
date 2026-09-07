/**
 * What turning a chip on does, which is what its colour says.
 *
 * - `action` arms something that spends an entitlement: book, move, swap.
 * - `safeguard` narrows what may happen: whole party only, avoid clashes.
 * - `rehearsal` is dry run.
 * - `pause` holds an armed target without disarming it.
 *
 * Red is deliberately absent. Every armed action used to be red, which left
 * nothing for Stop, errors and blockers to be; those keep red to themselves.
 * And every chip keeps "on" or "off" in its text, so colour never carries the
 * state alone.
 */
export type ToggleVariant = 'action' | 'safeguard' | 'rehearsal' | 'pause';

export const ON_COLORS: Record<ToggleVariant, string> = {
  action: 'bg-blue-700 text-white',
  safeguard: 'bg-green-700 text-white',
  rehearsal: 'bg-yellow-600 text-white',
  pause: 'bg-amber-600 text-white',
};

export const OFF_COLOR = 'bg-gray-200 text-black';
