export interface Frame {
  width: number;
  height: number;
}

/** Phone sizes worth checking: the 360 px design floor, and a current iPhone. */
export const FRAMES: Record<string, Frame | undefined> = {
  '360x780': { width: 360, height: 780 },
  '390x844': { width: 390, height: 844 },
  none: undefined,
};

export const DEFAULT_FRAME = '360x780';
