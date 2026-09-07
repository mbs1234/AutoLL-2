import { use } from 'react';

import { LLMP, isLLMP } from '@/api/itinerary';
import { targetApplies } from '@/autopilot/watchlist';
import Screen from '@/components/Screen';
import { Time } from '@/components/Time';
import DayTimeline from '@/components/ll/DayTimeline';
import AutopilotContext from '@/contexts/AutopilotContext';
import BookingDateContext from '@/contexts/BookingDateContext';
import ClientsContext from '@/contexts/ClientsContext';
import ParkContext from '@/contexts/ParkContext';
import PlansContext from '@/contexts/PlansContext';
import { formatDate, parkDate } from '@/datetime';

/** A compact operational view of the selected park day. */
export default function DaySummary() {
  const { bookingDate } = use(BookingDateContext);
  const { park } = use(ParkContext);
  const { plans } = use(PlansContext);
  const { ll } = use(ClientsContext);
  const { targets, passkeyStatus } = use(AutopilotContext);
  const targetsToday = targets.filter(target =>
    targetApplies(target, park.id, bookingDate)
  );
  // Every Multi Pass held on the date, wherever it is. Deliberately not
  // filtered to the loaded park: the party holds at most three at a time and
  // on a hopping day they span parks, so hiding one would hide a slot that is
  // spent. The park below applies to the plan, which *is* park-scoped -- so
  // the headings say which is which rather than the screen implying both.
  const lanes = plans.filter(
    (booking): booking is LLMP =>
      isLLMP(booking) && parkDate(booking.start) === bookingDate
  );

  return (
    <Screen title="Day summary" theme={park.theme}>
      <p>{formatDate(bookingDate)}</p>

      {ll.nextBookTime && (
        <p className="mt-3 rounded-sm bg-gray-100 p-2 text-sm">
          <span className="font-semibold">Next Lightning Lane:</span>{' '}
          <Time time={ll.nextBookTime} />
        </p>
      )}

      <h3>Lightning Lanes ({lanes.length})</h3>
      <p className="text-xs text-gray-600">
        Everything held on this date, in any park.
      </p>
      {lanes.length === 0 ? (
        <p className="text-sm text-gray-600">No Multi Pass reservations yet.</p>
      ) : (
        <ul className="text-sm">
          {lanes.map(lane => (
            <li key={lane.id} className="py-1">
              <span className="font-semibold">{lane.name}</span>
              {/* `isLLMP` asserts start and end are DateTimes, but the
                  itinerary parser does not honour that: a pass carried over
                  from an earlier park day comes back with a date and no time.
                  Dereferencing `.time` there throws, and a throw while
                  rendering this screen unmounts the provider above it --
                  taking the running watcher down with the screen. */}
              {lane.start?.time && lane.end?.time ? (
                <>
                  {' '}
                  &mdash; <Time time={lane.start.time} /> to{' '}
                  <Time time={lane.end.time} />
                  <span className="text-gray-600">
                    {' '}
                    (grace scan until{' '}
                    <Time time={lane.end.time.add({ minutes: 119 })} />)
                  </span>
                </>
              ) : (
                <span className="text-gray-600"> &mdash; no return time</span>
              )}
            </li>
          ))}
        </ul>
      )}

      <h3>Active plan ({targetsToday.length})</h3>
      <p className="text-xs text-gray-600">
        What Autopilot is watching at {park.name} on this date.
      </p>
      {targetsToday.length === 0 ? (
        <p className="text-sm text-gray-600">
          No Autopilot targets for this park day.
        </p>
      ) : (
        <ul className="text-sm">
          {targetsToday
            .slice()
            .sort((a, b) => (a.rank ?? Infinity) - (b.rank ?? Infinity))
            .map(target => (
              <li key={target.experienceId} className="py-1">
                <span className="font-semibold">
                  {target.name ?? target.experienceId}
                </span>
                {target.passkey && <span> &mdash; passkey</span>}
                {typeof target.rank === 'number' && (
                  <span> &mdash; rank {target.rank}</span>
                )}
                {(target.after || target.before) && (
                  <span>
                    {' '}
                    &mdash; return window{' '}
                    {target.after ? <Time time={target.after} /> : 'open'}
                    {' – '}
                    {target.before ? <Time time={target.before} /> : 'open'}
                  </span>
                )}
              </li>
            ))}
        </ul>
      )}

      {passkeyStatus !== 'off' && (
        <p className="mt-3 text-sm">
          <span className="font-semibold">Passkey:</span>{' '}
          {passkeyStatus === 'unlocked'
            ? 'Disney confirmed the Tier 1 hold is unlocked for the selected party.'
            : 'Waiting for Disney to confirm every selected guest cleared the Tier 1 hold.'}
        </p>
      )}

      <DayTimeline lanes={lanes} targets={targetsToday} />
    </Screen>
  );
}
