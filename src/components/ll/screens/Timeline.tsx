import { use } from 'react';

import { LLMP, isLLMP } from '@/api/itinerary';
import { targetApplies } from '@/autopilot/watchlist';
import Screen from '@/components/Screen';
import ContextStrip from '@/components/ll/ContextStrip';
import DayTimeline from '@/components/ll/DayTimeline';
import AutopilotContext from '@/contexts/AutopilotContext';
import BookingDateContext from '@/contexts/BookingDateContext';
import ParkContext from '@/contexts/ParkContext';
import PlansContext from '@/contexts/PlansContext';
import { parkDate } from '@/datetime';

export const TIMELINE = 'Timeline';

/** The day's held passes beside the windows Autopilot may use, full height. */
export default function Timeline() {
  const { bookingDate } = use(BookingDateContext);
  const { park } = use(ParkContext);
  const { plans } = use(PlansContext);
  const { targets } = use(AutopilotContext);
  const targetsToday = targets.filter(target =>
    targetApplies(target, park.id, bookingDate)
  );
  // Every Multi Pass held on the date, in any park, as Today lists them.
  const lanes = plans.filter(
    (booking): booking is LLMP =>
      isLLMP(booking) && parkDate(booking.start) === bookingDate
  );

  return (
    <Screen title={TIMELINE} theme={park.theme} subhead={<ContextStrip />}>
      {lanes.length === 0 && targetsToday.length === 0 ? (
        <p>
          Nothing to draw yet: no Lightning Lane held on this date, and nothing
          watched at {park.name}.
        </p>
      ) : (
        <DayTimeline lanes={lanes} targets={targetsToday} date={bookingDate} />
      )}
    </Screen>
  );
}
