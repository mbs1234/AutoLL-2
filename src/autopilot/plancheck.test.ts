import { createBooking, hm, jc } from '@/__fixtures__/ll';
import { mk } from '@/__fixtures__/resort';
import { ParkTime } from '@/datetime';
import { TODAY } from '@/testing';

import { checkPlan } from './plancheck';

const base = () => ({
  targets: [{ experienceId: hm.id, autoBook: true }],
  parkId: mk.id,
  date: TODAY,
  experiences: [hm, jc],
  plans: [],
  bookingsRemaining: 3,
  requireWholeParty: true,
  avoidOverlaps: true,
});

describe('checkPlan', () => {
  it('blocks a plan with no targets for the selected park and date', () => {
    expect(
      checkPlan({
        ...base(),
        targets: [{ experienceId: hm.id, parkId: 'somewhere-else' }],
      })
    ).toEqual([
      expect.objectContaining({
        level: 'blocker',
        text: expect.stringMatching(/No saved targets/),
      }),
    ]);
  });

  it('finds an impossible window and an exhausted action budget', () => {
    const items = checkPlan({
      ...base(),
      bookingsRemaining: 0,
      targets: [
        {
          experienceId: hm.id,
          autoBook: true,
          after: new ParkTime(15),
          before: new ParkTime(10),
        },
      ],
    });
    expect(items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          level: 'blocker',
          text: expect.stringMatching(/budget/),
        }),
        expect.objectContaining({
          level: 'blocker',
          text: expect.stringMatching(/impossible/),
        }),
      ])
    );
  });

  it('flags a paused action, an absent target, and an overlapping bounded window', () => {
    const items = checkPlan({
      ...base(),
      targets: [
        { experienceId: hm.id, autoBook: true, paused: true },
        {
          experienceId: jc.id,
          autoBook: true,
          after: new ParkTime(10, 30),
          before: new ParkTime(11, 20),
        },
        { experienceId: 'missing', name: 'Missing ride', autoBook: true },
      ],
      plans: [createBooking(hm, { startTime: new ParkTime(11) })],
    });
    expect(items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ text: expect.stringMatching(/paused/) }),
        expect.objectContaining({
          text: expect.stringMatching(/Missing ride.*tipboard/),
        }),
        expect.objectContaining({ text: expect.stringMatching(/overlaps/) }),
      ])
    );
  });

  it('reports a clean plan without making any network-dependent claim', () => {
    expect(checkPlan(base())).toEqual([
      expect.objectContaining({
        level: 'ready',
        text: expect.stringMatching(/Eligibility, inventory/),
      }),
    ]);
  });
});
