import { createContext } from 'react';

import { DasClient } from '@/api/das';
import { ItineraryClient } from '@/api/itinerary';
import { LiveDataClient } from '@/api/livedata';
import { LLClient } from '@/api/ll';
import { LLClientWDW } from '@/api/ll/wdw';
import { Resort } from '@/api/resort';

export interface Clients {
  das: DasClient;
  itinerary: ItineraryClient;
  liveData: LiveDataClient;
  ll: LLClient;
}

export default createContext<Clients>({
  das: {} as DasClient,
  itinerary: {} as ItineraryClient,
  liveData: {} as LiveDataClient,
  ll: {} as LLClient,
});

export function createClients(resort: Resort) {
  const das = new DasClient(resort);
  const liveData = new LiveDataClient(resort);
  const ll = new LLClientWDW(resort);
  const itinerary = new ItineraryClient(resort);
  itinerary.onRefresh = bookings => ll.track(bookings);
  return { das, itinerary, liveData, ll };
}
