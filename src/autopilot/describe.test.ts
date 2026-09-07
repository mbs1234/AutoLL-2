import { ParkTime } from '@/datetime';

import {
  describeMode,
  describeTarget,
  describeWindow,
  summaryLine,
} from './describe';

const target = (extra = {}) => ({
  experienceId: 'sm',
  name: 'Space Mountain',
  ...extra,
});

describe('describeMode', () => {
  it('reads the flags the way the engine does', () => {
    expect(describeMode(target())).toBe('Watch only');
    expect(describeMode(target({ autoBook: true }))).toBe('Auto-book');
    expect(describeMode(target({ autoModify: true }))).toBe('Auto-move');
    expect(describeMode(target({ autoBook: true, autoModify: true }))).toBe(
      'Auto-book and move'
    );
    expect(
      describeMode(
        target({ bookThenMove: true, autoBook: true, autoModify: true })
      )
    ).toBe('Book then move');
    expect(describeMode(target({ autoSwap: true }))).toBe('Swap in');
    expect(describeMode(target({ autoBook: true, autoSwap: true }))).toBe(
      'Auto-book, swap in'
    );
  });

  it('does not fold paused into the mode', () => {
    const paused = target({ autoBook: true, paused: true });
    expect(describeMode(paused)).toBe('Auto-book');
    expect(describeTarget(paused).paused).toBe(true);
  });
});

describe('describeWindow', () => {
  it('says both bounds, one bound, or nothing', () => {
    expect(
      describeWindow({ after: new ParkTime(10), before: new ParkTime(14) })
    ).toBe('10:00 AM to 2:00 PM');
    expect(describeWindow({ after: new ParkTime(10) })).toBe('from 10:00 AM');
    expect(describeWindow({ before: new ParkTime(14, 30) })).toBe('by 2:30 PM');
    expect(describeWindow({})).toBeUndefined();
  });
});

describe('describeTarget', () => {
  it('falls back to the id when nothing names the target', () => {
    expect(describeTarget({ experienceId: '123' }).name).toBe('123');
    expect(describeTarget({ experienceId: '123' }, 'Named').name).toBe('Named');
  });

  it('carries rank, passkey and bounds only when set', () => {
    const summary = describeTarget(
      target({ rank: 1, passkey: true, after: new ParkTime(10) })
    );
    expect(summary).toMatchObject({ rank: 1, passkey: true });
    expect(summary.after).toEqual(new ParkTime(10));
    expect(summary).not.toHaveProperty('before');
    expect(describeTarget(target())).not.toHaveProperty('rank');
  });
});

describe('summaryLine', () => {
  it('reads as the card will', () => {
    expect(
      summaryLine(
        target({
          autoBook: true,
          paused: true,
          rank: 1,
          after: new ParkTime(10),
          before: new ParkTime(14),
        })
      )
    ).toBe(
      'Space Mountain · Paused · Auto-book · 10:00 AM to 2:00 PM · Rank 1'
    );
    expect(summaryLine(target())).toBe('Space Mountain · Watch only');
  });
});
