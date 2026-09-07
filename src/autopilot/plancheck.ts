import { Booking } from '@/api/itinerary';
import { Experience } from '@/api/ll';
import { clashWindow } from '@/autopilot/overlap';
import { isTier1 } from '@/autopilot/priority';
import { WatchTarget, targetApplies } from '@/autopilot/watchlist';
import { ParkTime, parkDate } from '@/datetime';

export type PlanCheckLevel = 'blocker' | 'review' | 'ready';

export interface PlanCheckItem {
  level: PlanCheckLevel;
  text: string;
}

export interface PlanCheckInput {
  targets: WatchTarget[];
  parkId: string;
  date: string;
  experiences: Experience[];
  plans: Booking[];
  bookingsRemaining: number;
  requireWholeParty: boolean;
  avoidOverlaps: boolean;
}

const acts = (target: WatchTarget) =>
  !!(
    target.autoBook ||
    target.autoModify ||
    target.bookThenMove ||
    target.autoSwap
  );

const displayName = (target: WatchTarget, experiences: Experience[]) =>
  experiences.find(exp => exp.id === target.experienceId)?.name ??
  target.name ??
  target.experienceId;

function timedPlansFor(date: string, plans: Booking[]) {
  return plans.filter(
    (plan): plan is Booking & { start: { date: string; time: ParkTime } } =>
      !!plan.start.time && parkDate(plan.start) === date
  );
}

/**
 * A configuration-only preflight for Autopilot.
 *
 * It intentionally receives all of its facts as arguments: opening Plan
 * Check does not ask Disney for an offer, eligibility, or a booking. Those
 * facts are deliberately re-read immediately before every real action by the
 * provider. A preflight that looked authoritative while making one more
 * request would be less safe, not more.
 */
export function checkPlan(input: PlanCheckInput): PlanCheckItem[] {
  const active = input.targets.filter(target =>
    targetApplies(target, input.parkId, input.date)
  );
  const items: PlanCheckItem[] = [];

  if (active.length === 0) {
    return [
      {
        level: 'blocker',
        text: 'No saved targets apply to this park and date.',
      },
    ];
  }

  const armed = active.filter(acts);
  if (armed.length === 0) {
    items.push({
      level: 'review',
      text: 'This plan watches and alerts only; no booking, move, or swap action is armed.',
    });
  }

  if (armed.length > 0 && input.bookingsRemaining <= 0) {
    items.push({
      level: 'blocker',
      text: 'Today’s Autopilot action budget is exhausted. Add more actions before enabling it.',
    });
  }

  for (const target of active) {
    const name = displayName(target, input.experiences);
    if (
      input.experiences.length > 0 &&
      !input.experiences.some(exp => exp.id === target.experienceId)
    ) {
      items.push({
        level: 'blocker',
        text: `${name} is not on the loaded tipboard, so it cannot be watched or acted on.`,
      });
    }
    if (acts(target) && target.paused) {
      items.push({
        level: 'review',
        text: `${name} has an action armed but is paused; it will alert only until resumed.`,
      });
    }
    if (target.after && target.before && +target.after > +target.before) {
      items.push({
        level: 'blocker',
        text: `${name} has an impossible return window: its earliest time is after its latest time.`,
      });
    }
  }

  // A bounded window can be inspected without guessing an offer. Flag only a
  // real overlap with a currently held plan, not an open-ended preference.
  for (const target of armed) {
    const { after, before } = target;
    if (!after || !before || +after > +before) {
      continue;
    }
    const conflict = timedPlansFor(input.date, input.plans).find(plan => {
      const { from, to } = clashWindow(plan);
      return +after < +to && +before > +from;
    });
    if (conflict) {
      items.push({
        level: 'review',
        text: `${displayName(target, input.experiences)}’s return window overlaps ${conflict.name}. Check whether enough of the window remains practical.`,
      });
    }
  }

  const tierOneArmed = armed.filter(target => {
    const exp = input.experiences.find(e => e.id === target.experienceId);
    return !!exp && isTier1(exp);
  });
  if (tierOneArmed.length > 1 && !active.some(target => target.passkey)) {
    items.push({
      level: 'review',
      text: 'More than one Tier 1 target is armed. Autopilot may hold a lower-priority one for a better imminent drop.',
    });
  }
  if (!input.requireWholeParty && armed.length > 0) {
    items.push({
      level: 'review',
      text: 'Whole party only is off. An eligible subset of the saved party may receive a Lightning Lane.',
    });
  }
  if (!input.avoidOverlaps && armed.length > 0) {
    items.push({
      level: 'review',
      text: 'Avoid clashes is off. Autopilot may take a return time that overlaps an existing plan.',
    });
  }

  if (items.length === 0) {
    items.push({
      level: 'ready',
      text: 'This plan has no configuration conflicts. Eligibility, inventory, and the offer’s real return time will still be checked before every action.',
    });
  }
  return items;
}
