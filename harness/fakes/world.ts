import * as data from '@/api/data/wdw';
import {
  Booking,
  EntitledGuest,
  LLMP,
  ParkPass,
  Reservation,
  isLLMP,
} from '@/api/itinerary';
import { FlexExperience, Guest } from '@/api/ll';
import { Experience as ExpData, Park, Resort } from '@/api/resort';
import { DateTime, ParkTime, parkDate } from '@/datetime';

/** The resort the real app loads from this origin, built from the same data. */
export const wdw = new Resort('WDW', data);
export const [mk, ep, hs, ak] = wdw.parks as [Park, Park, Park, Park];

/** Attractions the scenarios name. Disney's ids, from the data file. */
export const IDS = {
  spaceMountain: '80010190',
  hauntedMansion: '80010208',
  jungleCruise: '80010153',
  tron: '411504498',
  slinkyDog: '18904138',
  /** Not in the data file: what a re-themed ride looks like on the tipboard. */
  unknown: '999999999',
} as const;

export const mickey: Guest = {
  id: 'mickey',
  name: 'Mickey Mouse',
  primary: true,
};
export const minnie: Guest = { id: 'minnie', name: 'Minnie Mouse' };
export const pluto: Guest = { id: 'pluto', name: 'Pluto' };
export const donald: Guest = {
  id: 'donald',
  name: 'Donald Duck',
  ineligibleReason: 'INVALID_PARK_ADMISSION',
};
export const party: Guest[] = [mickey, minnie, pluto];

/** Park time to the minute, so times built from it agree within a render. */
export function nowTime(): ParkTime {
  return DateTime.now().time.with({ second: 0 });
}

/**
 * A time relative to now. Negative minutes work. Crossing 4 am wraps into the
 * next park day, which is the price of a fixture that is right at any hour.
 */
export function inMinutes(minutes: number): ParkTime {
  return nowTime().add({ minutes });
}

/** What the fakes do when asked to act. Each scenario picks one. */
export interface Script {
  /** The return-time grid Time Search sees, relative to the held time. */
  grid: 'earlier' | 'later' | 'same';
  /** What `book()` does: succeed, get no response, or be refused. */
  book: 'ok' | 'timeout' | 'refused';
  /** Whether a successful move shows up in Plans afterwards. */
  plansFollow: boolean;
  /** After how many tipboard polls Space Mountain comes back into stock. */
  restockAfterPolls?: number;
  /** List an id the data file does not know. */
  unknownId?: boolean;
}

export const DEFAULT_SCRIPT: Script = {
  grid: 'earlier',
  book: 'ok',
  plansFollow: true,
};

const STATES = [
  'soon',
  'soldout',
  'later',
  'soon',
  'later',
  'soldout',
  'later',
] as const;

/**
 * The state the fakes share: what the party holds, and how many times the
 * tipboard has been asked. One per page load, created before the app mounts.
 */
export class World {
  plans: Booking[];
  polls = 0;
  seq = 0;
  /** The held time a Time Search grid is anchored to, fixed once asked. */
  anchor?: ParkTime;

  constructor(
    readonly script: Script,
    plans: Booking[] = seedPlans()
  ) {
    this.plans = plans;
  }

  heldToday(): LLMP[] {
    const today = parkDate();
    return this.plans.filter(
      (b): b is LLMP => isLLMP(b) && parkDate(b.start) === today
    );
  }

  /** The park's Multi Pass attractions, each in a state chosen by position. */
  tipboard(park: Park): FlexExperience[] {
    return attractions(park).map((exp, i) => {
      const { available, time } = this.stateOf(exp.id, i);
      return {
        ...exp,
        park,
        standby: { available: true, waitTime: 15 + ((i * 17) % 75) },
        flex:
          available && time
            ? { available: true, nextAvailableTime: time }
            : { available: false },
      };
    });
  }

  private stateOf(
    id: string,
    i: number
  ): { available: boolean; time?: ParkTime } {
    switch (id) {
      case IDS.spaceMountain: {
        const restock = this.script.restockAfterPolls;
        if (restock === undefined) return { available: false };
        return { available: this.polls >= restock, time: inMinutes(45) };
      }
      case IDS.hauntedMansion:
        return { available: true, time: inMinutes(20) };
      case IDS.jungleCruise:
        return { available: true, time: inMinutes(90) };
      default: {
        const state = STATES[i % STATES.length]!;
        if (state === 'soldout') return { available: false };
        const soon = state === 'soon';
        return {
          available: true,
          time: inMinutes(soon ? 20 + 15 * i : 120 + 20 * i),
        };
      }
    }
  }
}

function attractions(park: Park): ExpData[] {
  return Object.keys(data.experiences)
    .flatMap(id => {
      try {
        const exp = wdw.experience(id);
        return exp.park.id === park.id && exp.type === 'A' ? [exp] : [];
      } catch {
        return [];
      }
    })
    .sort(
      (a, b) =>
        (a.priority ?? 99) - (b.priority ?? 99) || a.name.localeCompare(b.name)
    );
}

function entitled(
  guests: Guest[],
  expId: string,
  date: string
): EntitledGuest[] {
  return guests.map(g => ({
    id: g.id,
    name: g.name,
    entitlementId: `${expId}-${g.id}-${date}`,
  }));
}

export function llmp(
  expId: string,
  start: ParkTime,
  date = parkDate(),
  guests: Guest[] = party
): LLMP {
  const experience = wdw.experience(expId);
  const holders = entitled(guests, expId, date);
  return {
    type: 'LL',
    subtype: 'MP',
    id: holders[0]!.entitlementId,
    facilityId: expId,
    name: experience.name,
    experience,
    park: experience.park,
    land: experience.land,
    start: new DateTime(date, start),
    end: new DateTime(date, start.add({ hours: 1 })),
    cancellable: true,
    modifiable: true,
    guests: holders,
  };
}

export function parkPass(park: Park, date: string): ParkPass {
  return {
    type: 'APR',
    id: `apr-${park.id}-${date}`,
    facilityId: park.id,
    name: park.name,
    park,
    start: { date },
    guests: party.map(({ id, name }) => ({ id, name })),
  };
}

export function dining(start: ParkTime, date: string): Reservation {
  return {
    type: 'RES',
    subtype: 'DINING',
    id: `dining-${date}`,
    facilityId: '90001819',
    name: 'Liberty Tree Tavern Lunch',
    park: mk,
    land: {
      name: 'Liberty Square',
      park: mk,
      sort: 0,
      color: 'gray',
      theme: mk.theme,
    },
    start: new DateTime(date, start),
    guests: [mickey, minnie].map(({ id, name }) => ({ id, name })),
  };
}

/** Two Lightning Lanes, lunch between them, and the park pass behind them. */
export function seedPlans(): Booking[] {
  const today = parkDate();
  return sortPlans([
    parkPass(mk, today),
    llmp(IDS.hauntedMansion, inMinutes(60), today),
    dining(inMinutes(75), today),
    llmp(IDS.tron, inMinutes(150), today),
  ]);
}

/** By park day, then by time, as the itinerary returns them. */
export function sortPlans(plans: Booking[]): Booking[] {
  const key = (b: Booking) => `${parkDate(b.start)}T${b.start.time ?? ''}`;
  return [...plans].sort((a, b) => key(a).localeCompare(key(b)));
}
