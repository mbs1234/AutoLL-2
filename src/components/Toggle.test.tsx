import { click, render, screen } from '@/testing';

import Toggle from './Toggle';

const noop = () => undefined;

describe('Toggle', () => {
  it('says what it switches and which way it is set', () => {
    const { rerender } = render(
      <Toggle on={false} variant="action" label="Auto-book" onToggle={noop} />
    );
    const off = screen.getByRole('button', { name: 'Auto-book off' });
    expect(off).toHaveAttribute('aria-pressed', 'false');
    expect(off).toHaveClass('bg-gray-200');

    rerender(<Toggle on variant="action" label="Auto-book" onToggle={noop} />);
    const on = screen.getByRole('button', { name: 'Auto-book on' });
    expect(on).toHaveAttribute('aria-pressed', 'true');
    expect(on).toHaveClass('bg-blue-700');
  });

  it('colours by what turning it on does, and is never red', () => {
    const { rerender } = render(
      <Toggle on variant="safeguard" label="Avoid clashes" onToggle={noop} />
    );
    expect(screen.getByRole('button')).toHaveClass('bg-green-700');
    rerender(<Toggle on variant="rehearsal" label="Dry run" onToggle={noop} />);
    expect(screen.getByRole('button')).toHaveClass('bg-yellow-600');
    rerender(
      <Toggle
        on
        variant="pause"
        label="Pause"
        onText="Paused"
        offText="Pause"
        onToggle={noop}
      />
    );
    const paused = screen.getByRole('button', { name: 'Paused' });
    expect(paused).toHaveClass('bg-amber-600');
    expect(paused.className).not.toMatch(/red/);
  });

  it('takes its own wording when "<label> on" is not it', () => {
    render(
      <Toggle
        on={false}
        variant="pause"
        label="Pause"
        onText="Paused"
        offText="Pause"
        onToggle={noop}
      />
    );
    screen.getByRole('button', { name: 'Pause' });
  });

  it('calls back on a tap', () => {
    const onToggle = jest.fn();
    render(
      <Toggle on={false} variant="action" label="Swap in" onToggle={onToggle} />
    );
    click('Swap in off');
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
