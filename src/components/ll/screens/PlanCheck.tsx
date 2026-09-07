import { use, useState } from 'react';

import { Guests } from '@/api/ll';
import { PlanCheckLevel, checkPlan } from '@/autopilot/plancheck';
import Button from '@/components/Button';
import Screen from '@/components/Screen';
import AutopilotContext from '@/contexts/AutopilotContext';
import BookingDateContext from '@/contexts/BookingDateContext';
import ClientsContext from '@/contexts/ClientsContext';
import ExperiencesContext from '@/contexts/ExperiencesContext';
import ParkContext from '@/contexts/ParkContext';
import PlansContext from '@/contexts/PlansContext';
import { formatDate } from '@/datetime';
import useDataLoader from '@/hooks/useDataLoader';

const STYLE: Record<PlanCheckLevel, string> = {
  blocker: 'bg-red-100 text-red-900',
  review: 'bg-amber-100 text-amber-900',
  ready: 'bg-green-100 text-green-900',
};

const LABEL: Record<PlanCheckLevel, string> = {
  blocker: 'Fix before enabling',
  review: 'Review',
  ready: 'Ready',
};

/** A no-request review of the current Autopilot configuration. */
export default function PlanCheck() {
  const { park } = use(ParkContext);
  const { bookingDate } = use(BookingDateContext);
  const { ll } = use(ClientsContext);
  const { experiences } = use(ExperiencesContext);
  const { plans } = use(PlansContext);
  const { loadData, loaderElem } = useDataLoader();
  const { targets, bookingsRemaining, requireWholeParty, avoidOverlaps } =
    use(AutopilotContext);
  const items = checkPlan({
    targets,
    parkId: park.id,
    date: bookingDate,
    experiences,
    plans,
    bookingsRemaining,
    requireWholeParty,
    avoidOverlaps,
  });
  const blockers = items.filter(item => item.level === 'blocker').length;
  const [party, setParty] = useState<Guests>();
  const partyIneligible =
    party?.ineligible.filter(g => g.ineligibleReason !== 'NOT_IN_PARTY') ?? [];

  function checkParty() {
    loadData(async () => {
      // This asks only for current party eligibility. It never creates an
      // offer and it cannot spend an entitlement.
      setParty(await ll.guests(undefined, bookingDate));
    });
  }

  return (
    <Screen title="Plan check" theme={park.theme}>
      <p>
        {park.name} &mdash; {formatDate(bookingDate)}
      </p>
      <p className="mt-2 text-sm text-gray-600">
        This checks the plan already on this screen. It does not request offers
        or make a booking. Live eligibility is checked only if you ask below,
        and is always checked again immediately before every Autopilot action.
      </p>
      <h3>
        {blockers > 0
          ? `${blockers} item${blockers === 1 ? '' : 's'} to fix`
          : 'Plan review'}
      </h3>
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li
            className={`rounded-sm p-2 text-sm ${STYLE[item.level]}`}
            key={`${item.level}-${index}`}
          >
            <span className="font-semibold">{LABEL[item.level]}:</span>{' '}
            {item.text}
          </li>
        ))}
      </ul>
      <h3>Current party</h3>
      <p className="text-sm text-gray-600">
        Check whether the guests AutoLL currently sees are eligible in general.
        Attraction-specific eligibility, inventory, and the actual offered time
        can change and remain protected by the final action checks.
      </p>
      <Button type="small" className="mt-2" onClick={checkParty}>
        Check current party
      </Button>
      {party && partyIneligible.length === 0 && (
        <p className="mt-2 rounded-sm bg-green-100 p-2 text-sm text-green-900">
          All guests in the current party are generally eligible.
        </p>
      )}
      {partyIneligible.length > 0 && (
        <div className="mt-2 rounded-sm bg-amber-100 p-2 text-sm text-amber-900">
          <p className="font-semibold">
            {partyIneligible.length} party member
            {partyIneligible.length === 1 ? '' : 's'} currently ineligible.
          </p>
          <ul className="mt-1 list-disc pl-5">
            {partyIneligible.map(guest => (
              <li key={guest.id}>
                {guest.name} &mdash; {guest.ineligibleReason ?? 'ineligible'}
              </li>
            ))}
          </ul>
        </div>
      )}
      {loaderElem}
    </Screen>
  );
}
