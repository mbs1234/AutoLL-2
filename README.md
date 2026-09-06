# AutoLL-2

AutoLL-2 is an independent, experimental browser companion for Lightning Lane Multi Pass and virtual queues at Walt Disney World. It runs inside your browser while you are on a supported Disney page, helping you view availability, keep track of plans, and—when you explicitly enable it—watch selected Multi Pass attractions.

It is designed to be useful in two ways:

- **Autopilot** watches a set of attractions through the day, alerts when availability changes, and can perform only the actions you have individually armed.
- **NextLL** is a focused, one-attraction search for when you want the earliest practical Lightning Lane right now.

**Important:** AutoLL-2 is unofficial, experimental software. It is not affiliated with or endorsed by Disney, may stop working at any time, and is provided without warranty. Keep the official Disney app available and use it as the source of truth for your plans and reservations.

> AutoLL-2 supports **Lightning Lane Multi Pass** and virtual queues. It does not offer a Single Pass booking workflow.

## Install

Open the [AutoLL-2 setup page](https://mbs1234.github.io/AutoLL-2/) on the phone or tablet you use in the park. It provides installation instructions for both supported options:

1. **Bookmarklet** — save the generated bookmarklet, then run it while on a supported Disney page.
2. **Userscript** — optional. Install the listed userscript extension first, then install AutoLL-2's autoloader. It loads AutoLL-2 automatically on supported pages.

After installation:

1. Open the Walt Disney World Lightning Lane page in your browser.
2. Run the bookmarklet, or let the userscript load AutoLL-2.
3. Sign in through the normal browser flow.
4. Choose a park and, on the **LL** tab, choose the party AutoLL-2 should use.

AutoLL-2 stores its sign-in state, saved party, preferences, watch lists, and diagnostics under its own `autoll2.*` browser-storage keys. It does not import BG1 or AutoLL settings, so the first use requires a separate sign-in and setup.

## Before you turn anything on

Start with the **LL** tab:

1. Select the park and date you are working on.
2. Let the Lightning Lane list load.
3. Select the guests you want in your saved party.
4. Review your current reservations on **Plans**.
5. Open **Autopilot** with the clock button in the header, or use **NextLL** for a single ride.

Mobile browsers heavily slow background tabs. Keep AutoLL-2 open and in the foreground while a watch or search is running. Autopilot requests a screen wake lock where supported, but switching apps or tabs can still pause timers.

## Main features

### LL: availability and your party

The **LL** tab is the main availability list. Use it to change the park, select your party, refresh current availability, and open the Autopilot screen.

The clock button is a status indicator:

| Color  | Meaning                                                        |
| ------ | -------------------------------------------------------------- |
| Gray   | Autopilot is off.                                              |
| Green  | Autopilot is watching.                                         |
| Yellow | Dry run is on: it evaluates actions but does not perform them. |
| Red    | Autopilot stopped after repeated errors and needs attention.   |

The badge is the number of watched attractions in the currently loaded park.

### Times: compare return times

Use **Times** to inspect available return times for the selected park. It is useful for deciding which attraction to pursue before adding it to a watch list or starting a NextLL search.

### Plans: check what you already hold

Use **Plans** to review Lightning Lanes and other itinerary items. Autopilot can use this information to avoid a return time that overlaps an existing reservation, including dining.

### Autopilot: watch several attractions

Open Autopilot with the clock button on the LL tab. First, star the Multi Pass attractions you want it to watch. Watching alone only checks and alerts; it does not authorize any booking or modification.

For each watched attraction, choose the actions you want:

| Control            | What it does                                                                                                                                 |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **Auto-book**      | Books the attraction when it becomes available inside its return-time window.                                                                |
| **Auto-move**      | Tries to improve a reservation you already hold. A move must be at least 30 minutes earlier, never later, and inside the window.             |
| **Book then move** | Takes the first available time, even if it is outside the window, then tries to move it into the window. It implies Auto-book and Auto-move. |
| **Pause**          | Continues watching and alerting, but prevents actions for that attraction.                                                                   |
| **Swap in**        | If all Multi Pass slots are occupied, may replace a lower-priority held reservation for this attraction.                                     |
| **Passkey**        | Marks an easy, non-Tier-1 target to prioritize before the first redemption of the day. It does not enable Auto-book by itself.               |

#### Passkey and tap-in strategy

A **passkey** is an easy early Lightning Lane selected to help open up the rest
of the day. Mark one non-Tier-1 target as Passkey, enable the action you want
for it, and redeem it with the selected party. AutoLL-2 waits until the pass is
spent, then checks Disney's eligibility response; it only reports the Tier 1
hold unlocked once both are true. Both halves are needed: Disney only reports
the restriction to a party already holding a Tier 1, so on its own the
eligibility check says nothing. This matters for parties with different
redemption progress or attractions requiring more than one touch point.

"Spent" is what can actually be established, and it covers a pass whose window
lapsed unused as well as one that was tapped in — Disney counts both as ridden.
That is the right test here, because the tier limit turns on the entitlement
being gone rather than on how it went.

Passkey is optional. It never creates a booking authorization, bypasses an
eligibility rule, or assumes that a reservation was redeemed merely because it
appears in Plans.

#### Return-time windows

Each watched attraction can have an **earliest** and **latest** acceptable return time. Leave either field empty for no bound on that side.

The window controls what Autopilot will take, move to, or swap for. It does not hide alerts: an outside-window time can still be useful information.

#### Global Autopilot settings

| Setting              | Default | Meaning                                                                                                                        |
| -------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **Dry run**          | Off     | Rehearses every check and records what it would do, but does not book, move, or swap. Use this first.                          |
| **Whole party only** | Off     | Requires every guest in the saved party to be eligible before AutoLL-2 acts. With it off, it may act for the eligible guests.  |
| **Avoid clashes**    | On      | Refuses a return time that overlaps an existing reservation or dining plan.                                                    |
| **Actions per day**  | 10      | Daily cap shared by bookings, moves, and swaps. Adjustable from 1 to 50; AutoLL-2 continues watching after the cap is reached. |

Autopilot's running state is intentionally not restored after a reload. Its watch list and settings are saved, but you must turn it on again.

#### How Autopilot checks

Autopilot uses one coordinated polling loop rather than separate timers per screen. It checks slowly when nothing is near, speeds up around known release times and your party's booking windows, and uses a moderate refill-window cadence for selected high-demand attractions.

The built-in schedule also learns from local observations. A newly observed recurring drop can be added after it appears on two different park days. Conversely, a scheduled time is demoted only after AutoLL-2 watched it on three park-specific days without observing a drop. The **Learned drop times** panel shows this evidence.

For a selected date of tomorrow, an active watch uses a bounded daytime cadence
for cancellation and earlier-return releases. A watched ride reopening sends an
alert; reopening does not by itself authorize a booking.

If repeated checks fail, AutoLL-2 backs off progressively and stops after eight consecutive failures rather than continuing indefinitely. The status area names the error when available.

### NextLL: pursue one attraction now

Use **NextLL** when you want one attraction rather than a day-long watch list.

1. Open **NextLL**.
2. Choose the park and attraction.
3. Optionally set **Return by** to set the latest acceptable return time.
4. Tap **Find it**.

NextLL takes the first practical Lightning Lane it finds, then keeps trying to move it earlier until the target is met or you stop it. It uses your saved party from the LL tab, has its own separate watch list, and does not consume Autopilot's daily action budget.

Leaving the NextLL tab stops its active search because a browser page cannot reliably keep its rapid timer alive in the background. When you return, it offers to resume the saved search.

## Recommended first use

1. Configure your party and star only one or two attractions.
2. Set realistic return-time windows.
3. Turn on **Dry run**.
4. Keep the page open while you observe the status, alerts, skip reasons, and activity log.
5. When the behavior matches your expectations, turn Dry run off and enable only the per-attraction actions you actually want.

The **Why nothing was booked** section groups common guard reasons, such as an unavailable party member, an overlap, an exhausted action budget, or a time outside the configured window.

Use **View day summary** in Autopilot for one screen containing the selected
day's held Multi Pass reservations, their return and grace-scan windows, the
next Lightning Lane time, active plan targets and ranks, and passkey status.

## Troubleshooting

| Symptom                     | What to check                                                                                                                |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Nothing is loading          | Confirm you launched AutoLL-2 from a supported Disney page, then refresh and sign in again if needed.                        |
| Autopilot appears slow      | Keep the tab foregrounded. Check its status for a backoff message or a stopped state.                                        |
| It watches but does not act | Check Dry run, paused targets, return-time windows, whole-party eligibility, clashes, and the daily action budget.           |
| NextLL stopped              | It stops when you leave its tab. Return to NextLL and choose **Resume**.                                                     |
| A ride is missing           | Refresh the LL list. If Disney's tipboard contains an unknown attraction ID, AutoLL-2 displays an unknown-attraction notice. |

## Development

```bash
npm ci
npm run checkall      # tests, lint, and typecheck
npm run test:ci       # CI test suite
npm run build:fork    # production bundle
npm start             # development server
```

The source branch is `main`; the independent installer assets are maintained on `goofy`. GitHub Pages publishes the combined build at <https://mbs1234.github.io/AutoLL-2/>.

See [FORK.md](FORK.md) for project structure and upstream synchronization notes, and [docs/PLAN.md](docs/PLAN.md) for the feature roadmap and research notes.

## License and acknowledgments

AutoLL-2 is **GPL-3.0-only** and builds on:

- [joelface/bg1](https://github.com/joelface/bg1) by Joel Face, the original project and underlying Lightning Lane, virtual queue, DAS, itinerary, UI, and login work.
- [jgeurts/bg1](https://github.com/jgeurts/bg1), which contributed the WDW booking restoration and related improvements used by this fork.

Thanks also to the upstream contributors and testers, including Len Testa, TouringPlans, ThemeParks.wiki, Thrill Data, WDWMagic observers, BlogMickey, Arialvetica, and IcoMoon. Their work and public resources helped make this project possible.
