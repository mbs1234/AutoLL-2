import { use } from 'react';

import Button from '@/components/Button';
import { AUTOPILOT } from '@/components/ll/AutopilotStatus';
import AutopilotContext from '@/contexts/AutopilotContext';
import TabsContext from '@/contexts/TabContext';
import ClockIcon from '@/icons/ClockIcon';

/**
 * Shows at a glance whether Autopilot is running, and opens the Today tab,
 * where the switch is.
 *
 * Deliberately not a toggle. Enabling autopilot is a setup step -- choose
 * attractions, grant notification permission -- and a mis-tap here silently
 * starting or stopping background polling would be worse than one extra tap.
 */
export default function AutopilotButton() {
  const { changeTab } = use(TabsContext);
  const { enabled, status, targetsHere, dryRun } = use(AutopilotContext);
  const running = enabled && status.mode !== 'stopped';
  const attention = enabled && status.mode === 'stopped';

  return (
    <Button
      title={
        running
          ? `${AUTOPILOT} on${dryRun ? ' (dry run)' : ''}, watching ${targetsHere.length}`
          : attention
            ? `${AUTOPILOT} stopped after errors`
            : `${AUTOPILOT} off`
      }
      onClick={() => changeTab('Today')}
      // Yellow while rehearsing, so a forgotten dry run is visible from the
      // header rather than discovered when nothing gets booked.
      color={
        attention
          ? 'bg-red-700 text-white'
          : running && dryRun
            ? 'bg-yellow-600 text-white'
            : running
              ? 'bg-green-700 text-white'
              : undefined
      }
    >
      <ClockIcon />
      {/* The same count the Configure screen shows, so the badge and the
          heading can never disagree. */}
      {running && targetsHere.length > 0 && (
        <span className="ml-1 text-xs font-semibold">{targetsHere.length}</span>
      )}
    </Button>
  );
}
