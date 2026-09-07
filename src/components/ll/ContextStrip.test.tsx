import { use } from 'react';

import { Park } from '@/api/resort';
import AutopilotContext from '@/contexts/AutopilotContext';
import BookingDateContext from '@/contexts/BookingDateContext';
import ParkContext from '@/contexts/ParkContext';
import { formatDate, modifyDate, parkDate } from '@/datetime';
import { PARTY_IDS_KEY } from '@/hooks/useSavedParty';
import kvdb from '@/kvdb';
import { render, see } from '@/testing';

import ContextStrip from './ContextStrip';

const mk = { name: 'Magic Kingdom' } as Park;
const today = parkDate();

function DryRun({ children }: { children: React.ReactNode }) {
  const state = use(AutopilotContext);
  return (
    <AutopilotContext value={{ ...state, dryRun: true }}>
      {children}
    </AutopilotContext>
  );
}

function renderStrip({ date = today, dryRun = false } = {}) {
  const strip = (
    <ParkContext value={{ park: mk, setPark: () => undefined }}>
      <BookingDateContext
        value={{ bookingDate: date, setBookingDate: () => undefined }}
      >
        <ContextStrip />
      </BookingDateContext>
    </ParkContext>
  );
  return render(dryRun ? <DryRun>{strip}</DryRun> : strip);
}

describe('ContextStrip', () => {
  beforeEach(() => kvdb.delete(PARTY_IDS_KEY));

  it('names the park and calls today today', () => {
    renderStrip();
    see('Magic Kingdom');
    see('Today');
  });

  it('names another date by its day', () => {
    const date = modifyDate(today, 3);
    renderStrip({ date });
    see(formatDate(date, 'short'));
    see.no('Today');
  });

  it('counts the saved party, and says so when there is none', () => {
    const { unmount } = renderStrip();
    see('Everyone eligible');
    unmount();
    kvdb.set(PARTY_IDS_KEY, ['mickey', 'minnie', 'pluto']);
    renderStrip();
    see('Party of 3');
  });

  it('flags a dry run only while one is on', () => {
    const { unmount } = renderStrip();
    see.no('Dry run');
    unmount();
    renderStrip({ dryRun: true });
    see('Dry run');
  });
});
