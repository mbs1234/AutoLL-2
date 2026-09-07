import { NavMethods } from '@/contexts/NavContext';

/**
 * The navigator, handed out by the screen at the bottom of the stack so the
 * menu outside the app can push screens into it.
 */
export const bridge: { goTo?: NavMethods['goTo'] } = {};
