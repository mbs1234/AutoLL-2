import { LLMP } from '@/api/itinerary';
import { clashWindow } from '@/autopilot/overlap';
import { WatchTarget } from '@/autopilot/watchlist';
import { ParkTime } from '@/datetime';

/** The end of a Disney park day, immediately before its 4am boundary. */
const DAY_END = new ParkTime(3, 59, 59);

export interface TimelineLane {
  id: string;
  name: string;
  start: ParkTime;
  end: ParkTime;
}

export interface TimelineTarget {
  id: string;
  name: string;
  after: ParkTime;
  before: ParkTime;
  /** Held reservations whose protected return span intersects this window. */
  clashes: string[];
}

/** A presentation model for the selected park day's held reservations and plan. */
export function dayTimeline(lanes: LLMP[], targets: WatchTarget[]) {
  const timelineLanes: TimelineLane[] = lanes
    .filter(
      (lane): lane is LLMP & { start: { time: ParkTime } } => !!lane.start?.time
    )
    .map(lane => ({
      id: lane.id,
      name: lane.name,
      start: lane.start.time,
      // A missing end is unusual, but a visible marker is still more useful
      // than making the held reservation disappear from the timeline.
      end: lane.end?.time ?? lane.start.time.add({ minutes: 30 }),
    }))
    .sort((a, b) => +a.start - +b.start);

  const timelineTargets: TimelineTarget[] = targets
    .map(target => {
      const after = target.after ?? ParkTime.dayStart;
      const before = target.before ?? DAY_END;
      const clashes = lanes
        .filter(
          (lane): lane is LLMP & { start: { time: ParkTime } } =>
            !!lane.start?.time
        )
        .filter(lane => {
          const protectedSpan = clashWindow(lane);
          return +after <= +protectedSpan.to && +before >= +protectedSpan.from;
        })
        .map(lane => lane.id);
      return {
        id: target.experienceId,
        name: target.name ?? target.experienceId,
        after,
        before,
        clashes,
      };
    })
    .sort((a, b) => +a.after - +b.after || +a.before - +b.before);

  return { lanes: timelineLanes, targets: timelineTargets };
}

/** Percentage from the 4am park-day boundary, for positioning a timeline bar. */
export function dayPercent(time: ParkTime) {
  return (+time / 86_400) * 100;
}
