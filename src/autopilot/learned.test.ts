import { ParkTime } from '@/datetime';

import {
  DEMOTION_ENABLED,
  DEMOTION_MIN_COVERED_DAYS,
  LEARNED_MIN_DAYS,
  activeScheduledDropTimes,
  learnedDropTimes,
  mergeDropTimes,
} from './learned';
import { DropSummary } from './observe';

const at = (h: number, m = 0) => new ParkTime(h, m);

const summary = (
  experienceId: string,
  observed: [ParkTime, number][]
): DropSummary => ({
  experienceId,
  observed: observed.map(([time, days]) => ({ time, days, count: days })),
  scheduled: [],
});

const park = new Set(['a', 'b']);

describe('learnedDropTimes()', () => {
  // One day is an anecdote; two is a pattern.
  it('includes drops seen on enough distinct days', () => {
    const times = learnedDropTimes(
      [summary('a', [[at(9, 47), LEARNED_MIN_DAYS]])],
      park
    );
    expect(times).toEqual([at(9, 47)]);
  });

  it('excludes drops seen on too few days', () => {
    const times = learnedDropTimes(
      [summary('a', [[at(9, 47), LEARNED_MIN_DAYS - 1]])],
      park
    );
    expect(times).toEqual([]);
  });

  it('honors a custom threshold', () => {
    const times = learnedDropTimes([summary('a', [[at(9, 47), 1]])], park, 1);
    expect(times).toEqual([at(9, 47)]);
  });

  // Evidence accumulates across visits to different parks.
  it('ignores attractions outside the current park', () => {
    const times = learnedDropTimes(
      [summary('elsewhere', [[at(9, 47), 5]])],
      park
    );
    expect(times).toEqual([]);
  });

  // The poller bursts per park, so times are unioned across attractions.
  it('unions and sorts across attractions', () => {
    const times = learnedDropTimes(
      [summary('a', [[at(15, 47), 2]]), summary('b', [[at(9, 47), 3]])],
      park
    );
    expect(times).toEqual([at(9, 47), at(15, 47)]);
  });

  it('dedupes the same minute seen for two attractions', () => {
    const times = learnedDropTimes(
      [summary('a', [[at(9, 47), 2]]), summary('b', [[at(9, 47), 2]])],
      park
    );
    expect(times).toEqual([at(9, 47)]);
  });

  it('returns nothing with no evidence', () => {
    expect(learnedDropTimes([], park)).toEqual([]);
  });
});

describe('mergeDropTimes()', () => {
  it('adds a learned time the schedule lacks', () => {
    expect(mergeDropTimes([at(9, 47)], [at(14, 17)])).toEqual([
      at(9, 47),
      at(14, 17),
    ]);
  });

  // A learned :48 is the scheduled :47 seen a minute late; bursting twice for
  // one drop would double the requests.
  it('keeps the scheduled time when a learned one is within tolerance', () => {
    expect(mergeDropTimes([at(9, 47)], [at(9, 48)])).toEqual([at(9, 47)]);
    expect(mergeDropTimes([at(9, 47)], [at(9, 49)])).toEqual([at(9, 47)]);
  });

  it('adds a learned time just outside tolerance', () => {
    expect(mergeDropTimes([at(9, 47)], [at(9, 50)])).toEqual([
      at(9, 47),
      at(9, 50),
    ]);
  });

  // The cadence policy and upcomingTimes() both assume a sorted list.
  it('returns a sorted list', () => {
    const merged = mergeDropTimes([at(15, 47), at(9, 47)], [at(11, 47)]);
    expect(merged).toEqual([at(9, 47), at(11, 47), at(15, 47)]);
  });

  it('sorts across midnight using the park-day origin', () => {
    const merged = mergeDropTimes([at(23, 47)], [at(0, 17)]);
    expect(merged).toEqual([at(23, 47), at(0, 17)]);
  });

  it('is the schedule alone with nothing learned', () => {
    expect(mergeDropTimes([at(9, 47)], [])).toEqual([at(9, 47)]);
  });

  it('is the learned times alone with no schedule', () => {
    expect(mergeDropTimes([], [at(9, 47)])).toEqual([at(9, 47)]);
  });

  it('does not mutate its inputs', () => {
    const scheduled = [at(15, 47), at(9, 47)];
    const learned = [at(11, 47)];
    mergeDropTimes(scheduled, learned);
    expect(scheduled).toEqual([at(15, 47), at(9, 47)]);
    expect(learned).toEqual([at(11, 47)]);
  });
});

describe('activeScheduledDropTimes()', () => {
  const scheduled = new Map([
    ['a', [at(9, 47), at(15, 47)]],
    ['b', [at(15, 47)]],
  ]);

  // The mechanism, exercised explicitly: DEMOTION_ENABLED is false, so these
  // pass `true` to keep it under test while it is not acting.
  it('demotes a time only after several fully covered zero-observation days', () => {
    const active = activeScheduledDropTimes(
      scheduled,
      [
        {
          experienceId: 'a',
          observed: [],
          scheduled: [
            {
              time: at(9, 47),
              observedDays: 0,
              coveredDays: DEMOTION_MIN_COVERED_DAYS,
            },
            { time: at(15, 47), observedDays: 1, coveredDays: 5 },
          ],
        },
      ],
      DEMOTION_MIN_COVERED_DAYS,
      true
    );
    expect(active).toEqual([at(15, 47)]);
  });

  it('keeps a schedule when the evidence is incomplete or it fired once', () => {
    expect(
      activeScheduledDropTimes(scheduled, [
        {
          experienceId: 'a',
          observed: [],
          scheduled: [
            {
              time: at(9, 47),
              observedDays: 0,
              coveredDays: DEMOTION_MIN_COVERED_DAYS - 1,
            },
            {
              time: at(15, 47),
              observedDays: 1,
              coveredDays: DEMOTION_MIN_COVERED_DAYS,
            },
          ],
        },
      ])
    ).toEqual([at(9, 47), at(15, 47)]);
  });

  it('keeps a shared minute while another attraction has not been demoted', () => {
    expect(
      activeScheduledDropTimes(
        scheduled,
        [
          {
            experienceId: 'a',
            observed: [],
            scheduled: [
              {
                time: at(9, 47),
                observedDays: 0,
                coveredDays: DEMOTION_MIN_COVERED_DAYS,
              },
              {
                time: at(15, 47),
                observedDays: 0,
                coveredDays: DEMOTION_MIN_COVERED_DAYS,
              },
            ],
          },
        ],
        DEMOTION_MIN_COVERED_DAYS,
        true
      )
    ).toEqual([at(15, 47)]);
  });

  // What actually ships. Demotion is the only part of drop learning that can
  // remove a burst the schedule asked for, and its evidence is not yet sound
  // enough to act on -- see DEMOTION_ENABLED.
  it('removes nothing by default, however damning the evidence', () => {
    expect(DEMOTION_ENABLED).toBe(false);
    expect(
      activeScheduledDropTimes(scheduled, [
        {
          experienceId: 'a',
          observed: [],
          scheduled: [
            {
              time: at(9, 47),
              observedDays: 0,
              coveredDays: DEMOTION_MIN_COVERED_DAYS * 10,
            },
          ],
        },
      ])
    ).toEqual([at(9, 47), at(15, 47)]);
  });
});
