import { Time } from '@/components/Time';
import { ParkTime } from '@/datetime';

/** A return window: "10:00 AM to 2:00 PM", "from 10:00 AM", or "by 2:00 PM". */
export default function TargetWindow({
  after,
  before,
}: {
  after?: ParkTime;
  before?: ParkTime;
}) {
  if (after && before) {
    return (
      <>
        <Time time={after} /> to <Time time={before} />
      </>
    );
  }
  if (after) {
    return (
      <>
        from <Time time={after} />
      </>
    );
  }
  if (before) {
    return (
      <>
        by <Time time={before} />
      </>
    );
  }
  return null;
}
