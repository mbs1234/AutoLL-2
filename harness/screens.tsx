import Autopilot from '@/components/ll/screens/Autopilot';
import DaySummary from '@/components/ll/screens/DaySummary';
import PlanCheck from '@/components/ll/screens/PlanCheck';
import TimeSearch from '@/components/ll/screens/TimeSearch';

import { World } from './fakes/world';

export type ScreenName =
  | 'autopilot'
  | 'plancheck'
  | 'daysummary'
  | 'timesearch';

export const SCREEN_TITLES: Record<ScreenName, string> = {
  autopilot: 'Autopilot',
  plancheck: 'Plan check',
  daysummary: 'Day summary',
  timesearch: 'Time Search',
};

/**
 * A screen to push, built from what the world holds.
 *
 * Time Search is about a reservation, so it needs one; with nothing held today
 * there is no screen to show and the caller gets nothing.
 */
export function screenFor(
  name: ScreenName,
  world: World
): React.JSX.Element | undefined {
  switch (name) {
    case 'autopilot':
      return <Autopilot />;
    case 'plancheck':
      return <PlanCheck />;
    case 'daysummary':
      return <DaySummary />;
    case 'timesearch': {
      const held = world.heldToday()[0];
      return held ? <TimeSearch booking={held} /> : undefined;
    }
  }
}
