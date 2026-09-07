import { LLMP } from '@/api/itinerary';
import { dayPercent, dayTimeline } from '@/autopilot/daytimeline';
import { WatchTarget } from '@/autopilot/watchlist';
import { ParkTime } from '@/datetime';

const time = (hour: number, minute = 0) => new ParkTime(hour, minute);

function lane(id: string, start: ParkTime, end?: ParkTime) {
  return {
    id,
    name: `Lane ${id}`,
    type: 'LLMP',
    start: { date: '2026-09-08', time: start },
    end: end ? { date: '2026-09-08', time: end } : undefined,
  } as unknown as LLMP;
}

function target(id: string, after?: ParkTime, before?: ParkTime): WatchTarget {
  return { experienceId: id, name: `Target ${id}`, after, before };
}

describe('dayTimeline()', () => {
  it('sorts held reservations and uses a visible fallback for a missing end', () => {
    const result = dayTimeline(
      [lane('later', time(15), time(16)), lane('early', time(9))],
      []
    );

    expect(result.lanes.map(item => item.id)).toEqual(['early', 'later']);
    expect(result.lanes[0]?.end).toEqual(time(9, 30));
  });

  it('marks a target window that crosses a held reservation buffer', () => {
    const result = dayTimeline(
      [lane('held', time(12), time(13))],
      [
        target('clear', time(14), time(15)),
        target('clash', time(11, 30), time(12, 15)),
      ]
    );

    expect(result.targets.find(item => item.id === 'clash')?.clashes).toEqual([
      'held',
    ]);
    expect(result.targets.find(item => item.id === 'clear')?.clashes).toEqual(
      []
    );
  });

  it('places the start of a park day at the beginning of the rail', () => {
    expect(dayPercent(time(4))).toBe(0);
    expect(dayPercent(time(3, 59))).toBeGreaterThan(99.9);
  });
});
