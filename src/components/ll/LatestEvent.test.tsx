import { ParkTime } from '@/datetime';
import { render, screen } from '@/testing';

import LatestEvent from './LatestEvent';

describe('LatestEvent', () => {
  it('puts the time first, then what happened', () => {
    render(
      <LatestEvent
        event={{
          at: new ParkTime(11, 43),
          level: 'info',
          text: 'Booked Space Mountain for 1:10 PM',
        }}
      />
    );
    const line = screen.getByText(/Booked Space Mountain for 1:10 PM/);
    expect(line).toHaveTextContent('11:43 AM — Booked Space Mountain');
    expect(line).toHaveClass('text-gray-800');
  });

  it('does without a time when the event has none', () => {
    render(
      <LatestEvent
        event={{ level: 'warn', text: 'Found Space Mountain at 1:10 PM' }}
      />
    );
    const line = screen.getByText('Found Space Mountain at 1:10 PM');
    expect(line.querySelector('time')).toBeNull();
    expect(line).toHaveClass('text-amber-800');
  });

  it('renders nothing when there is nothing to say', () => {
    const { container } = render(<LatestEvent />);
    expect(container).toBeEmptyDOMElement();
  });
});
