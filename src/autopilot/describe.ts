import { WatchTarget } from '@/autopilot/watchlist';
import { ParkTime, formatTime } from '@/datetime';

/**
 * A watched attraction in one line, for the card that folds it away.
 *
 * Structured rather than a string, so a screen can render the times with
 * `<Time>` and the words as words. `summaryLine` is the same thing as plain
 * text, for titles, tests and anything that cannot render an element.
 */
export interface TargetSummary {
  name: string;
  /** What Autopilot will do for it, as a person would say it. */
  mode: string;
  /** Held: the mode stays armed but nothing happens until resumed. */
  paused: boolean;
  passkey: boolean;
  rank?: number;
  after?: ParkTime;
  before?: ParkTime;
}

/**
 * The armed actions, collapsed the way the engine reads them.
 *
 * Book then move implies both booking and moving, so it names neither
 * separately. Swap in books on its own when a slot is free, so alone it is a
 * mode of its own; beside another action it is an addition. Paused is not a
 * mode and is reported separately: a paused target keeps its arming.
 */
export function describeMode(target: WatchTarget): string {
  const parts: string[] = [];
  if (target.bookThenMove) {
    parts.push('Book then move');
  } else if (target.autoBook && target.autoModify) {
    parts.push('Auto-book and move');
  } else if (target.autoBook) {
    parts.push('Auto-book');
  } else if (target.autoModify) {
    parts.push('Auto-move');
  }
  if (target.autoSwap) parts.push(parts.length > 0 ? 'swap in' : 'Swap in');
  return parts.length > 0 ? parts.join(', ') : 'Watch only';
}

/** The return window as words; nothing when no bound is set. */
export function describeWindow(
  target: Pick<WatchTarget, 'after' | 'before'>
): string | undefined {
  const { after, before } = target;
  if (after && before) return `${formatTime(after)} to ${formatTime(before)}`;
  if (after) return `from ${formatTime(after)}`;
  if (before) return `by ${formatTime(before)}`;
  return undefined;
}

export function describeTarget(
  target: WatchTarget,
  name = target.name ?? target.experienceId
): TargetSummary {
  return {
    name,
    mode: describeMode(target),
    paused: !!target.paused,
    passkey: !!target.passkey,
    ...(typeof target.rank === 'number' ? { rank: target.rank } : {}),
    ...(target.after ? { after: target.after } : {}),
    ...(target.before ? { before: target.before } : {}),
  };
}

/** "Space Mountain · Paused · Auto-book · 10:00 AM to 2:00 PM · Rank 1" */
export function summaryLine(target: WatchTarget, name?: string): string {
  const summary = describeTarget(target, name);
  return [
    summary.name,
    summary.paused ? 'Paused' : undefined,
    summary.mode,
    describeWindow(target),
    summary.rank !== undefined ? `Rank ${summary.rank}` : undefined,
    summary.passkey ? 'Passkey' : undefined,
  ]
    .filter((part): part is string => !!part)
    .join(' · ');
}
