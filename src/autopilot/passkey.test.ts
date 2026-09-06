import { Guests } from '@/api/ll';

import { tierLimitLifted } from './passkey';

const guests = (...ineligibleReasons: (string | undefined)[]): Guests => ({
  eligible: [{ id: 'eligible', name: 'Eligible' }],
  ineligible: ineligibleReasons.map((ineligibleReason, i) => ({
    id: `${i}`,
    name: `${i}`,
    ineligibleReason,
  })) as Guests['ineligible'],
});

describe('tierLimitLifted()', () => {
  it('waits while any selected guest still has a Tier 1 restriction', () => {
    expect(tierLimitLifted(guests('TIER_LIMIT_REACHED'))).toBe(false);
  });

  it('ignores people explicitly outside the saved party', () => {
    expect(tierLimitLifted(guests('NOT_IN_PARTY'))).toBe(true);
  });

  it('accepts Disney clearing the Tier 1 restriction despite another reason', () => {
    expect(tierLimitLifted(guests('TOO_EARLY'))).toBe(true);
  });
});
