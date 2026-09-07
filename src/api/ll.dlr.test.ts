import { LLClientDLR } from '@/api/ll/dlr';
import { DateTime, ParkTime } from '@/datetime';

import { setTime } from '@/testing';

import { wdw } from '../__fixtures__/resort';
import { Guest, Offer, OfferExperience } from './ll';

// Pins "now" well away from the fixture's park day, so an assertion that the
// request carries the booking's date cannot pass by calendar coincidence.
setTime('09:00');

/**
 * Disneyland's client, in a suite the CI gate actually runs.
 *
 * The existing DLR coverage lives in `ll.test.ts`, which `jest.ci.config.js`
 * excludes as stale upstream -- so nothing gated held the DLR client to
 * anything. These are the two facts about it that a change should not be
 * able to undo silently.
 */
const experience = {
  ...wdw.experience('80010190'),
  flex: { available: true, nextAvailableTime: new ParkTime(10) },
  standby: { available: true },
} as OfferExperience;

const guest: Guest = {
  id: 'guest-1',
  name: 'Guest One',
  primary: true,
} as Guest;

function makeClient() {
  // Built on the WDW resort deliberately, as `ll.test.ts` does: `ApiClient`
  // derives its origin from `resort.id`, and the transport is replaced below
  // anyway, so the resort only has to resolve experience ids.
  const client = new LLClientDLR(wdw);
  const request = jest.fn();
  (client as unknown as { request: jest.Mock }).request = request;
  return { client, request };
}

/** A held pass on a park day that is not today, for the modify path. */
function held() {
  return {
    type: 'LL',
    subtype: 'MP',
    id: 'held-1',
    facilityId: experience.id,
    name: 'Space Mountain',
    experience,
    start: new DateTime('2026-09-08', new ParkTime(15)),
    end: new DateTime('2026-09-08', new ParkTime(16)),
    cancellable: true,
    modifiable: true,
    guests: [{ ...guest, entitlementId: 'ent-1', bookingId: 'bk-1' }],
  } as unknown as NonNullable<Offer['booking']>;
}

describe('LLClientDLR', () => {
  /**
   * Booking is off because it cannot work, not as a preference.
   *
   * `book()` builds its body from `diu`, the one module upstream never
   * publishes; this fork ships a stub returning `{}` so the tree builds.
   * `book: true` on the base was inherited here by omission, which rendered
   * a Book button, a Modify button and an armable Autopilot over a path that
   * dead-ends -- and the failure arrives after the drop, looking like
   * Disney's refusal rather than a missing module.
   */
  it('does not offer booking', () => {
    const { client } = makeClient();
    expect(client.rules.book).toBe(false);
  });

  it('still has no pre-booking, park change, or time picker', () => {
    const { client } = makeClient();
    expect(client.rules).toEqual({
      book: false,
      maxPartySize: 12,
      parkModify: false,
      prebook: false,
      timeSelect: false,
    });
  });

  describe('a modification', () => {
    // The park day being modified, not the calendar day. `parkDate()` shifts
    // back before 4am and `DateTime.now().date` does not, so this used to
    // send tomorrow for a day Disney considers yesterday.
    it('sends the park day of the booking, not today', async () => {
      const { client, request } = makeClient();
      request.mockResolvedValue({
        data: {
          offer: {
            id: 'offer-1',
            date: '2026-09-08',
            startTime: '10:00:00',
            endTime: '11:00:00',
            status: 'ACTIVE',
          },
          eligibleGuests: [],
          ineligibleGuests: [],
        },
      });

      await client
        .offer(experience, [guest], { booking: held() })
        .catch(() => undefined);
      expect(request).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ date: '2026-09-08' }),
        })
      );
    });

    it('sends the park day when booking a modification', async () => {
      const { client, request } = makeClient();
      request.mockResolvedValue({ data: { booking: {} } });

      await client
        .book({
          id: 'offer-1',
          start: new DateTime('2026-09-08', new ParkTime(10)),
          end: new DateTime('2026-09-08', new ParkTime(11)),
          experience,
          guests: { eligible: [guest], ineligible: [] },
          itinerary: [],
          booking: held(),
        } as unknown as Offer)
        .catch(() => undefined);
      expect(request).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ date: '2026-09-08' }),
        })
      );
    });
  });
});
