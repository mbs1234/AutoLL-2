import { LLClientWDW } from '@/api/ll/wdw';
import { DateTime, ParkTime } from '@/datetime';

import { wdw } from '../__fixtures__/resort';
import { Guest, Offer, OfferExperience } from './ll';

const DATE = '2026-09-08';
const experience = {
  ...wdw.experience('80010190'),
  flex: { available: true, nextAvailableTime: new ParkTime(10) },
  standby: { available: true },
} as OfferExperience;

const guest: Guest = {
  id: 'guest-1',
  name: 'Guest One',
  primary: true,
  orderDetails: {
    externalIdentifier: { id: 'external-1', idType: 'externalId' },
    orderId: 'order-1',
    orderItemId: 'item-1',
  },
};

function apiGuest(overrides: Record<string, unknown> = {}) {
  return { id: guest.id, firstName: 'Guest', lastName: 'One', ...overrides };
}

function makeClient() {
  const client = new LLClientWDW(wdw);
  const request = jest.fn();
  // The public methods are what this suite exercises. Replacing the protected
  // transport keeps these contract tests independent of credentials, sensors,
  // and the browser fetch implementation.
  (client as unknown as { request: jest.Mock }).request = request;
  return { client, request };
}

function offer(): Offer {
  return {
    id: 'offer-1',
    offerSetId: 'set-1',
    start: new DateTime(DATE, new ParkTime(10)),
    end: new DateTime(DATE, new ParkTime(11)),
    experience,
    guests: { eligible: [guest], ineligible: [] },
    itinerary: [],
    booking: undefined,
  };
}

describe('WDW Lightning Lane request contracts', () => {
  it('requests party eligibility for the exact attraction and park day', async () => {
    const { client, request } = makeClient();
    request.mockResolvedValue({
      data: { guests: [apiGuest()], ineligibleGuests: [] },
    });

    await expect(client.guests(experience, DATE)).resolves.toEqual({
      eligible: [expect.objectContaining({ id: guest.id, name: guest.name })],
      ineligible: [],
    });
    expect(request).toHaveBeenCalledWith({
      path: '/ea-vas/planning/api/v1/experiences/guest/guests',
      data: {
        date: DATE,
        facilityId: experience.id,
        parkId: experience.park.id,
      },
      sensorData: true,
    });
  });

  it('generates a booking offer with the selected party and return target', async () => {
    const { client, request } = makeClient();
    request.mockResolvedValue({
      data: {
        itinerary: {
          items: [
            {
              type: 'OFFER_ITEM',
              facilityId: experience.id,
              offerSetId: 'set-1',
              offerId: 'offer-1',
              offerType: 'FLEX',
              startDateTime: `${DATE}T10:00:00`,
              endDateTime: `${DATE}T11:00:00`,
              startTime: '10:00:00',
              endTime: '11:00:00',
            },
          ],
        },
        party: { guests: [apiGuest()], ineligibleGuests: [] },
      },
    });

    await expect(
      client.offer(experience, [guest], { date: DATE })
    ).resolves.toEqual(
      expect.objectContaining({ id: 'offer-1', offerSetId: 'set-1' })
    );
    expect(request).toHaveBeenCalledWith({
      path: '/ea-vas/planning/api/v1/experiences/offerset/generate',
      data: {
        date: DATE,
        parkId: experience.park.id,
        guestIds: [guest.id],
        targetedTime: experience.flex?.nextAvailableTime,
        ignoredBookedExperienceIds: null,
        experienceIds: [experience.id],
      },
      sensorData: true,
    });
  });

  it('commits a confirmed offer with only its eligible guests', async () => {
    const { client, request } = makeClient();
    request.mockResolvedValue({
      data: {
        entitlementExperiences: [
          {
            experienceId: experience.id,
            startDateTime: `${DATE}T10:00:00`,
            endDateTime: `${DATE}T11:00:00`,
            guests: [{ guestId: guest.id, entitlementId: 'entitlement-1' }],
          },
        ],
        party: { guests: [apiGuest()], ineligibleGuests: [] },
      },
    });

    await expect(client.book(offer())).resolves.toEqual(
      expect.objectContaining({
        facilityId: experience.id,
        id: 'entitlement-1',
      })
    );
    expect(request).toHaveBeenCalledWith({
      path: '/ea-vas/planning/api/v1/experiences/entitlements/book',
      data: {
        offerSetId: 'set-1',
        orderGuestDetails: [
          {
            orderId: 'order-1',
            orderItemId: 'item-1',
            guestDetails: [
              {
                guestId: guest.id,
                externalIdentifier: guest.orderDetails!.externalIdentifier,
              },
            ],
          },
        ],
      },
      sensorData: true,
    });
  });
});
