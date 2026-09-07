import Button from './Button';
import { OFF_COLOR, ON_COLORS, ToggleVariant } from './toggleColors';

/** An on/off chip whose colour follows the policy in `toggleColors`. */
export default function Toggle({
  on,
  variant,
  label,
  onText = `${label} on`,
  offText = `${label} off`,
  title,
  className,
  onToggle,
}: {
  on: boolean;
  variant: ToggleVariant;
  /** The thing being switched, e.g. "Auto-book". */
  label: string;
  /** The text while on and while off, where "<label> on" is not the wording. */
  onText?: string;
  offText?: string;
  title?: string;
  className?: string;
  onToggle: () => void;
}) {
  return (
    <Button
      type="small"
      color={on ? ON_COLORS[variant] : OFF_COLOR}
      aria-pressed={on}
      title={title}
      className={className}
      onClick={onToggle}
    >
      {on ? onText : offText}
    </Button>
  );
}
