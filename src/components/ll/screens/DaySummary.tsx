import { use } from 'react';

import { isLLMP, LLMP } from '@/api/itinerary';
import { targetApplies } from '@/autopilot/watchlist';
import Screen from '@/components/Screen';
import { Time } from '@/components/Time';
import AutopilotContext from '@/contexts/AutopilotContext';
import BookingDateContext from '@/contexts/BookingDateContext';
import ClientsContext from '@/contexts/ClientsContext';
import PlansContext from '@/contexts/PlansContext';
import ParkContext from '@/contexts/ParkContext';
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
  const lanes = plans.filter(
    (booking): booking is LLMP =>
      isLLMP(booking) && parkDate(booking.start) === bookingDate
  );

  return (
    <Screen title="Day summary" theme={park.theme}>
      <p>
        {formatDate(bookingDate)} &mdash; {park.name}
      </p>

      {ll.nextBookTime && (
        <p className="mt-3 rounded-sm bg-gray-100 p-2 text-sm">
          <span className="font-semibold">Next Lightning Lane:</span>{' '}
          <Time time={ll.nextBookTime} />
        </p>
      )}

      <h3>Lightning Lanes ({lanes.length})</h3>
      {lanes.length === 0 ? (
        <p className="text-sm text-gray-600">
          No Multi Pass reservations yet.
        </p>
      ) : (
        <ul className="text-sm">
          {lanes.map(lane => (
            <li key={lane.id} className="py-1">
              <span className="font-semibold">{lane.name}</span> &mdash;{' '}
              <Time time={lane.start.time} /> to{' '}
              <Time time={lane.end.time} />
              <span className="text-gray-600">
                {' '}
                {' '}
                (grace scan until{' '}
                <Time time={lane.end.time.add({ minutes: 119 })} />)
              </span>
            </li>
          ))}
        </ul>
      )}

      <h3>Active plan ({targetsToday.length})</h3>
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
    </Screen>
  );
}
