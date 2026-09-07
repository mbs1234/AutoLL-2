import { LLMP } from '@/api/itinerary';
import { dayPercent, dayTimeline } from '@/autopilot/daytimeline';
import { WatchTarget } from '@/autopilot/watchlist';
import { Time } from '@/components/Time';
import { ParkTime } from '@/datetime';

const MARKERS = [4, 8, 12, 16, 20, 0].map(hour => new ParkTime(hour));

/**
 * A deliberately read-only picture of the park day.
 *
 * Reservations live on the left and target windows on the right so a person
 * can see both the plan and its constraints without opening every target.
 * It does not decide whether a booking is legal; the booking path rechecks
 * that using the real offer before it acts.
 */
export default function DayTimeline({
  lanes,
  targets,
}: {
  lanes: LLMP[];
  targets: WatchTarget[];
}) {
  const timeline = dayTimeline(lanes, targets);
  if (timeline.lanes.length === 0 && timeline.targets.length === 0) return null;

  return (
    <section className="mt-4" aria-label="Day timeline">
      <h3>Day timeline</h3>
      <p className="text-xs text-gray-600">
        Held Lightning Lanes and the return windows Autopilot is allowed to use.
        Amber target windows cross the protected time around a held plan.
      </p>
      <div className="mt-2 grid grid-cols-[3rem_1fr_1fr] gap-x-2 text-xs">
        <div />
        <div className="font-semibold">Held</div>
        <div className="font-semibold">Targets</div>
        <div className="relative h-[480px] text-right text-gray-500">
          {MARKERS.map(time => (
            <span
              key={time.toString()}
              className="absolute right-0 -translate-y-1/2"
              style={{ top: `${dayPercent(time)}%` }}
            >
              <Time time={time} />
            </span>
          ))}
        </div>
        <div className="relative h-[480px] border-l border-gray-200">
          {timeline.lanes.map(lane => {
            const top = dayPercent(lane.start);
            const height = Math.max(3, dayPercent(lane.end) - top);
            return (
              <div
                key={lane.id}
                className="absolute left-1 right-1 overflow-hidden rounded-sm bg-blue-100 px-1 text-blue-950"
                style={{ top: `${top}%`, height: `${height}%` }}
                title={`${lane.name}: ${lane.start} to ${lane.end}`}
              >
                <span className="font-semibold">{lane.name}</span>{' '}
                <Time time={lane.start} />
              </div>
            );
          })}
        </div>
        <div className="relative h-[480px] border-l border-gray-200">
          {timeline.targets.map(target => {
            const top = dayPercent(target.after);
            const height = Math.max(3, dayPercent(target.before) - top);
            const clashes = target.clashes.length > 0;
            return (
              <div
                key={target.id}
                className={`absolute left-1 right-1 overflow-hidden rounded-sm border px-1 ${
                  clashes
                    ? 'border-amber-500 bg-amber-100 text-amber-950'
                    : 'border-green-500 bg-green-50 text-green-950'
                }`}
                style={{ top: `${top}%`, height: `${height}%` }}
                title={`${target.name}: ${target.after} to ${target.before}`}
              >
                <span className="font-semibold">{target.name}</span>{' '}
                <Time time={target.after} />
                {' – '}
                <Time time={target.before} />
                {clashes && <span className="block">crosses a held plan</span>}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
