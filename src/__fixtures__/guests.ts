import { Guest } from '@/components/GuestList';

/**
 * Guests in the shape the shared list component renders.
 *
 * These used to come from the virtual-queue fixtures, which went with
 * virtual-queue support; the list itself is used by Lightning Lane screens.
 */
export const mickey: Guest = {
  id: 'mickey',
  name: 'Mickey Mouse',
  avatarImageUrl: 'https://example.com/mickey.png',
};
export const minnie: Guest = {
  id: 'minnie',
  name: 'Minnie Mouse',
  avatarImageUrl: 'https://example.com/minnie.png',
};
export const fifi: Guest = {
  id: 'fifi',
  name: 'Fifi',
  avatarImageUrl: 'https://example.com/fifi.png',
};
export const pluto: Guest = {
  id: 'pluto',
  name: 'Pluto',
  avatarImageUrl: 'https://example.com/pluto.png',
};
export const guests = [mickey, minnie, fifi, pluto];
