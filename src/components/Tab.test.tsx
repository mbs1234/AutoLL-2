import TabsContext from '@/contexts/TabContext';
import { render, screen } from '@/testing';

import Tab from './Tab';

const tab = (name: string) => ({ name, icon: null, component: () => null });
const tabs = [
  tab('Today'),
  tab('LL'),
  tab('Times'),
  tab('Plans'),
  tab('NextLL'),
];

function renderTab(title = 'LL') {
  return render(
    <TabsContext
      value={{
        tabs,
        active: tabs[0]!,
        changeTab: () => {},
        scrollPos: { get: () => 0, set: () => {} },
      }}
    >
      <Tab title={title}>content</Tab>
    </TabsContext>
  );
}

describe('Tab', () => {
  // Text inside an <h1> joins its accessible name, which is how every screen
  // in the suite is found.
  it('leaves the heading naming only the screen', () => {
    renderTab('Magic Kingdom');
    expect(
      screen.getByRole('heading', { name: 'Magic Kingdom', level: 1 })
    ).toBeVisible();
  });

  // Titled off the tab names on purpose: the LL screen is headed "LL" and
  // there is also a tab called "LL", so a bare text query matches both.
  it('renders every tab button', () => {
    renderTab('Magic Kingdom');
    for (const { name } of tabs) expect(screen.getByText(name)).toBeVisible();
  });

  // The build label used to sit beside the tabs; five tabs left it no room,
  // so it moved to the settings menu, and nothing else must pose as a tab.
  it('adds nothing to the tab bar but the tabs', () => {
    renderTab('Magic Kingdom');
    expect(screen.getAllByRole('button')).toHaveLength(tabs.length);
  });
});
