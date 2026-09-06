import { ParkTime } from '@/datetime';

import { CLUSTER_TOLERANCE_MIN, DropSummary, dayMinutes } from './observe';

/**
 * Distinct park days a drop must have been seen on before the poller times
 * itself to it.
 *
 * One is an anecdote: a cancellation, a glitch, a one-off release. Two
 * independent days at the same minute is a pattern, and drops are nothing if
 * not patterned -- the whole ":47" schedule is a recurrence. Raising this
 * trades responsiveness for confidence; two is the smallest number that is
 * not one.
 */
export const LEARNED_MIN_DAYS = 2;
/** Fully watched zero-observation days required before a schedule is demoted. */
export const DEMOTION_MIN_COVERED_DAYS = 3;

/**
 * Drop times learned from observation, for the attractions in one park.
 *
 * The poller bursts per park, not per attraction, so the times are unioned
 * across attractions. Filtering to the current park matters because evidence
 * accumulates across visits to different parks, and a Hollywood Studios drop
 * is no reason to burst at Magic Kingdom.
 */
export function learnedDropTimes(
  summaries: DropSummary[],
  parkExperienceIds: ReadonlySet<string>,
  minDays = LEARNED_MIN_DAYS
): ParkTime[] {
  const byMinute = new Map<number, ParkTime>();
  for (const summary of summaries) {
    if (!parkExperienceIds.has(summary.experienceId)) continue;
    for (const drop of summary.observed) {
      if (drop.days < minDays) continue;
      const minute = dayMinutes(drop.time);
      if (!byMinute.has(minute)) byMinute.set(minute, drop.time);
    }
  }
  return [...byMinute.values()].sort((a, b) => +a - +b);
}

/**
 * The schedule the poller should actually use: the hardcoded times plus any
 * learned ones that are not already covered.
 *
 * A learned time within the clustering tolerance of a scheduled one is the
 * same drop seen a minute late, so the scheduled time is kept and the learned
 * one dropped -- bursting twice for one drop would just double the requests.
 * Sorted, since the cadence policy and `upcomingTimes()` both assume it.
 */
export function mergeDropTimes(
  scheduled: ParkTime[],
  learned: ParkTime[]
): ParkTime[] {
  const merged = [...scheduled];
  for (const time of learned) {
    const minute = dayMinutes(time);
    const covered = merged.some(
      existing =>
        Math.abs(dayMinutes(existing) - minute) <= CLUSTER_TOLERANCE_MIN
    );
    if (!covered) merged.push(time);
  }
  return merged.sort((a, b) => +a - +b);
}

/**
 * The hardcoded schedule after removing entries contradicted by enough local
 * evidence. A time is removed only for an attraction that was watched at that
 * exact time on several distinct days and never produced a drop. Since the
 * poller runs per park, a shared minute stays active while any attraction at
 * that minute still has an undemoted schedule.
 */
export function activeScheduledDropTimes(
  schedule: ReadonlyMap<string, ParkTime[]>,
  summaries: DropSummary[],
  minCoveredDays = DEMOTION_MIN_COVERED_DAYS
): ParkTime[] {
  const summariesByExperience = new Map(
    summaries.map(summary => [summary.experienceId, summary])
  );
  const active = new Map<number, ParkTime>();

  for (const [experienceId, times] of schedule) {
    const checks = summariesByExperience.get(experienceId)?.scheduled ?? [];
    for (const time of times) {
      const check = checks.find(candidate => +candidate.time === +time);
      const demoted =
        check &&
        check.coveredDays >= minCoveredDays &&
        check.observedDays === 0;
      if (!demoted) active.set(+time, time);
    }
  }
  return [...active.values()].sort((a, b) => +a - +b);
}
