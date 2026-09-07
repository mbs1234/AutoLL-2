import Activity from '@/components/ll/screens/Activity';
import Configure from '@/components/ll/screens/Configure';
import PlanCheck from '@/components/ll/screens/PlanCheck';
import TimeSearch from '@/components/ll/screens/TimeSearch';
import Timeline from '@/components/ll/screens/Timeline';

import { World } from './fakes/world';

export type ScreenName =
  | 'configure'
  | 'plancheck'
  | 'timeline'
  | 'activity'
  | 'timesearch';

export const SCREEN_TITLES: Record<ScreenName, string> = {
  configure: 'Configure',
  plancheck: 'Plan check',
  timeline: 'Timeline',
  activity: 'Activity',
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
    case 'configure':
      return <Configure />;
    case 'plancheck':
      return <PlanCheck />;
    case 'timeline':
      return <Timeline />;
    case 'activity':
      return <Activity />;
    case 'timesearch': {
      const held = world.heldToday()[0];
      return held ? <TimeSearch booking={held} /> : undefined;
    }
  }
}
