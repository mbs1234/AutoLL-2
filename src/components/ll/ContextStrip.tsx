import { use } from 'react';

import AutopilotContext from '@/contexts/AutopilotContext';
import BookingDateContext from '@/contexts/BookingDateContext';
import ParkContext from '@/contexts/ParkContext';
import { formatDate, parkDate } from '@/datetime';
import useSavedPartyCount from '@/hooks/useSavedPartyCount';

const DOT = <span aria-hidden>·</span>;

/**
 * The facts every Lightning Lane screen is about, on one line.
 *
 * Park, date, party size and whether this is a rehearsal, for a `Screen`'s
 * `subhead`, which `HeaderBar` already styles as small uppercase text. A
 * pushed screen used to show its title and nothing else, so two screens deep
 * there was no saying which park or day a decision was being made for.
 */
export default function ContextStrip() {
  const { park } = use(ParkContext);
  const { bookingDate } = use(BookingDateContext);
  const { dryRun } = use(AutopilotContext);
  const partySize = useSavedPartyCount();
  const day =
    bookingDate === parkDate() ? 'Today' : formatDate(bookingDate, 'short');

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-1.5">
      <span>{park.name}</span>
      {DOT}
      <time dateTime={bookingDate}>{day}</time>
      {DOT}
      <span>
        {partySize > 0 ? `Party of ${partySize}` : 'Everyone eligible'}
      </span>
      {dryRun && (
        <>
          {DOT}
          <span className="rounded-sm bg-yellow-200 px-1 text-yellow-900">
            Dry run
          </span>
        </>
      )}
    </div>
  );
}
