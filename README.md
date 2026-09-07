# AutoLL-2

AutoLL-2 is an independent, experimental browser companion for Lightning Lane Multi Pass and virtual queues at Walt Disney World. It runs inside your browser while you are on a supported Disney page, helping you view availability, keep track of plans, and—when you explicitly enable it—watch selected Multi Pass attractions.

It is designed to be useful in two ways:

- **Autopilot** watches a set of attractions through the day, alerts when availability changes, and can perform only the actions you have individually armed.
- **NextLL** is a focused, one-attraction search for when you want the earliest practical Lightning Lane right now.

**Important:** AutoLL-2 is unofficial, experimental software. It is not affiliated with or endorsed by Disney, may stop working at any time, and is provided without warranty. Keep the official Disney app available and use it as the source of truth for your plans and reservations.

> AutoLL-2 supports **Lightning Lane Multi Pass** and virtual queues. It does not offer a Single Pass booking workflow, so TRON, Rise of the Resistance, Seven Dwarfs Mine Train, Guardians of the Galaxy: Cosmic Rewind, and Flight of Passage are deliberately not watchable.

> **Booking depends on a component this repository does not maintain.** It works here because the inherited base from jgeurts/bg1 sends a header Disney's bot filter requires. Disney has changed the rules around that header several times, so treat booking as something that can stop without warning. Watching, alerting, drop learning, return-time windows, and the corrected attraction data do not depend on it and keep working either way.

## What AutoLL-2 adds

AutoLL-2 is the experimental sibling of [AutoLL](https://github.com/mbs1234/AutoLL). It does everything AutoLL does — the same Autopilot, NextLL, safety limits, and corrected attraction data — plus the following. Each is described in full further down.

| Addition                        | What it is                                                                                                                                                                                                                  |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Passkey and tap-in strategy** | Mark one easy non-Tier-1 attraction as the pass to spend first. Once that entitlement is established as gone, AutoLL-2 reports the day's Tier 1 restriction lifted and stops holding a Tier 1 slot back.                    |
| **Day plans**                   | Watch targets carry a park, a date, and a manual **rank**, so a watch list is a plan for one park day rather than a global list. A target starred for another park or date is kept, but not watched or acted on today.      |
| **Day summary screen**          | One screen for the selected day: Multi Passes held in any park with their return and grace-scan windows, the next Lightning Lane time, the active plan in rank order, and passkey status.                                   |
| **More cadence modes**          | Refill windows hold the 6-second approach rate for a whole span rather than one instant; drop bursts start 2 minutes early instead of 30 seconds; a watch on tomorrow polls every 15 seconds through the day.               |
| **Reopening alerts**            | A watched attraction coming back from a temporary closure raises an alert. Deliberately an alert only — the ordinary watch and booking rules stay the sole authority for spending an entitlement.                           |
| **Live tier reporting**         | Where Disney labels an attraction's tier and that disagrees with the curated table, the disagreement is reported rather than applied. Acting on it would let the tipboard and a booking disagree about the same attraction. |
| **Drop-demotion evidence**      | Coverage evidence for scheduled drop times that never fire is gathered and shown, but demotion itself is off. See [Learned drop times](#how-autopilot-checks).                                                              |

AutoLL-2 also keeps its own `autoll2.*` browser storage, separate from both BG1's and AutoLL's, so all three can be installed on the same phone without overwriting each other.

## Install

Open the [AutoLL-2 setup page](https://mbs1234.github.io/AutoLL-2/) on the phone or tablet you use in the park. It provides installation instructions for both supported options:

1. **Bookmarklet** — save the generated bookmarklet, then run it while on a supported Disney page.
2. **Userscript** — optional. Install the listed userscript extension first, then install AutoLL-2's autoloader. It loads AutoLL-2 automatically on supported pages.

After installation:

1. Open the Walt Disney World Lightning Lane page in your browser.
2. Run the bookmarklet, or let the userscript load AutoLL-2.
3. Sign in through the normal browser flow.
4. Choose a park and, on the **LL** tab, choose the party AutoLL-2 should use.

On iOS, add the page to your Home Screen if you want system notifications. Without that you still get the audible chime.

AutoLL-2 stores its sign-in state, saved party, preferences, watch lists, and diagnostics under its own `autoll2.*` browser-storage keys. It does not import BG1 or AutoLL settings, so the first use requires a separate sign-in and setup.

Each published build includes `autoll2-release.json`, which names the source
revision, and `autoll2-files.sha256`, a SHA-256 manifest of every deployed
payload file. They are generated only after the bookmarklet site, app bundle,
and runtime module are assembled; the deployment verifies the checksums before
uploading to Pages.

## Before you turn anything on

Start with the **LL** tab:

1. Select the park and date you are working on.
2. Let the Lightning Lane list load.
3. Select the guests you want in your saved party.
4. Review your current reservations on **Plans**.
5. Open **Autopilot** with the clock button in the header, or use **NextLL** for a single ride.

Mobile browsers heavily slow background tabs. Keep AutoLL-2 open and in the foreground while a watch or search is running. Autopilot requests a screen wake lock where supported, so the phone will not lock mid-drop, but switching apps or tabs can still pause timers.

## Main features

Four tabs sit along the bottom: **LL**, **Times**, **Plans**, and **NextLL**. The label at the left of that bar (`aLL-2`) identifies this build, so AutoLL and AutoLL-2 open at once can be told apart.

### LL: availability and your party

The **LL** tab is the main availability list. Use it to change the park and date, select your party, refresh current availability, and open the Autopilot screen.

The clock button is a status indicator:

| Color  | Meaning                                                        |
| ------ | -------------------------------------------------------------- |
| Gray   | Autopilot is off.                                              |
| Green  | Autopilot is watching.                                         |
| Yellow | Dry run is on: it evaluates actions but does not perform them. |
| Red    | Autopilot stopped after repeated errors and needs attention.   |

While it is running, the button carries a badge counting the attractions it is watching in the currently loaded park.

### Times: compare return times

Use **Times** to inspect available return times for the selected park. It is useful for deciding which attraction to pursue before adding it to a watch list or starting a NextLL search.

### Plans: check what you already hold

Use **Plans** to review Lightning Lanes and other itinerary items. Autopilot can use this information to avoid a return time that overlaps an existing reservation, including dining.

### Autopilot: watch several attractions

Open Autopilot with the clock button on the LL tab. First, star the Multi Pass attractions you want it to watch. Watching alone only checks and alerts; it does not authorize any booking or modification.

Use **Plan check** before turning Autopilot on. It reviews the selected park day without generating offers or making a booking: targets missing from the loaded tipboard, paused or unarmed actions, impossible return windows, action-budget limits, configured overlap risks, and Tier 1 tradeoffs. Its optional **Check current party** button makes one eligibility-only request; availability and attraction-specific eligibility are still rechecked immediately before every action.

**View day summary** includes a read-only **Day timeline**. Held Lightning
Lanes appear beside Autopilot's allowed return windows. An amber target window
crosses the protected time around an existing reservation, so adjust it (or
turn off Avoid clashes) before expecting Autopilot to use it.

For each watched attraction, choose the actions you want. Each is off by default and independent, because the risks differ:

| Control            | What it does                                                                                                                                                                                                                                        |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Auto-book**      | Books the attraction when it becomes available inside its return-time window.                                                                                                                                                                       |
| **Auto-move**      | Tries to improve a reservation you already hold. A move must be at least 30 minutes earlier, never later, and inside the window.                                                                                                                    |
| **Book then move** | Takes the first available time, even if it is outside the window, then tries to move it into the window. Holding something beats holding nothing. Implies the two above.                                                                            |
| **Pause**          | Continues watching and alerting, but prevents actions for that attraction. Use it to force a higher-priority attraction to be booked first.                                                                                                         |
| **Swap in**        | If all Multi Pass slots are occupied, gives up your lowest-priority held reservation for this one. It prefers a non-Tier-1, never trades down, and uses a single atomic request, so the old reservation is released only if the new one is secured. |
| **Passkey**        | Marks an easy, non-Tier-1 target to prioritize before the first redemption of the day. It does not enable Auto-book by itself.                                                                                                                      |
| **Plan rank**      | An optional number. Lower ranks are tried first and override the built-in priority order for both ordering and swap decisions.                                                                                                                      |

**Alerts** are edge-triggered per attraction: one when it becomes available, silence while it stays, eligible again once it goes away and returns. A watched attraction returning from a temporary closure also alerts — an alert only, never a booking trigger.

#### Day plans

A watch target records the park and date it was starred on, so a watch list is a plan for one park day rather than a global list. Only targets matching the loaded park and the selected date are watched or acted on; the others are kept for the day they belong to. Targets saved before this existed carry no park or date and stay global.

Targets are also named when they are starred, so **Not on today's list** can name the ones Disney's tipboard has stopped listing — a seasonal version, or a changed attraction ID — rather than showing bare facility IDs. Autopilot cannot watch or book those, and each row has a button to remove it.

#### Passkey and tap-in strategy

A **passkey** is an easy early Lightning Lane selected to help open up the rest of the day. Mark one non-Tier-1 target as Passkey, enable the action you want for it, and redeem it with the selected party. AutoLL-2 waits until the pass is spent, then checks Disney's eligibility response; it only reports the Tier 1 hold unlocked once both are true. Both halves are needed: Disney only reports the restriction to a party already holding a Tier 1, so on its own the eligibility check says nothing. This matters for parties with different redemption progress or attractions requiring more than one touch point.

"Spent" is what can actually be established, and it covers a pass whose window lapsed unused as well as one that was tapped in — Disney counts both as ridden. That is the right test here, because the tier limit turns on the entitlement being gone rather than on how it went.

Passkey is optional. It never creates a booking authorization, bypasses an eligibility rule, or assumes that a reservation was redeemed merely because it appears in Plans.

#### Return-time windows and ordering

Each watched attraction can have an **earliest** and **latest** acceptable return time. Leave either field empty for no bound on that side.

The window controls what Autopilot will take, move to, or swap for. It does not hide alerts: an outside-window time can still be useful information.

When two armed attractions appear in the same check, the lower plan rank goes first, then the LL list's **Priority** order. On the current day, before the party has redeemed anything, a passkey target sorts ahead of both. If a higher-ranked Tier 1 attraction is armed and still has a drop within the next 90 minutes, Autopilot passes on a lesser Tier 1 rather than spend the party's single Tier 1 slot. That hold releases once the better attraction's drops have passed, or as soon as your party redeems its first Lightning Lane, since the one-Tier-1 limit applies only until then.

#### Global Autopilot settings

| Setting              | Default | Meaning                                                                                                                                                           |
| -------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Dry run**          | Off     | Rehearses every check and records what it would do, but does not book, move, or swap. Use this first.                                                             |
| **Whole party only** | Off     | Requires every guest in the saved party to be eligible before AutoLL-2 acts. With it off, it may act for the eligible guests, which is how booking by hand works. |
| **Avoid clashes**    | On      | Refuses a return time that overlaps an existing reservation or dining plan, checked before the offer is requested and again on the offer's real time.             |
| **Actions per day**  | 10      | Daily cap shared by bookings, moves, and swaps. Adjustable from 1 to 50; AutoLL-2 continues watching after the cap is reached.                                    |

Dry run is deliberately loud — yellow banner, yellow header button — because a forgotten dry run looks exactly like a broken booker.

Autopilot's running state is intentionally not restored after a reload. Its watch list, settings, and the day's budget are saved, but you must turn it on again.

#### How Autopilot checks

Autopilot uses one coordinated polling loop rather than separate timers per screen. Rather than a fixed rate, it adjusts to what is coming:

| Mode                  | When                                                       | Interval |
| --------------------- | ---------------------------------------------------------- | -------- |
| **Watching**          | nothing imminent                                           | ~45s     |
| **Drop approaching**  | within 5 minutes of a drop or one of your booking windows  | ~6s      |
| **Refill window**     | inside a span an attraction tends to refill over           | ~6s      |
| **Checking rapidly**  | 2 minutes before to 2 minutes after a drop                 | ~1.2s    |
| **Watching tomorrow** | a watch on the next day, between 07:00 and 22:00           | ~15s     |

Those targets come from the per-attraction drop times and refill windows in `src/api/data/wdw.ts` and from every booking window Disney reports for your party, since their slots free at different times and each one is a moment inventory opens. The lead exists because inventory sometimes releases early, the trail because it trickles in. Every interval carries ±20% jitter, timed on the drift-corrected clock in `src/timesync.ts`. A refill window is a span rather than an instant, so it holds the approach rate for its whole duration; a real scheduled drop inside one still wins and uses the shorter burst interval.

The built-in schedule also learns from local observations. A drop is an attraction becoming available, or its earliest return time jumping 15 minutes or more earlier. A time observed on two or more distinct park days is added to the times Autopilot bursts for. AutoLL-2 also records **when it was watching**, so the **Learned drop times** panel can tell "seen 2 of 2 watched days" apart from "seen 0 of 3" — evidence the schedule is wrong — and from "not watched yet", which says nothing.

Learning only ever adds. Removing a scheduled time on that evidence is implemented but **disabled**, because coverage is currently recorded per park day rather than per scheduled drop time, and the two counts can disagree without the drop having failed to fire. The evidence is still gathered and still shown; it just does not act. See `DEMOTION_ENABLED` in `src/autopilot/learned.ts`.

If repeated checks fail, AutoLL-2 backs off progressively — 2s, 4s, and so on to a 60s cap — and stops after eight consecutive failures. The status area says so while it is happening and names the error, so a backing-off Autopilot cannot be mistaken for an idle one.

#### Safety limits

- **The daily action budget** is shared by bookings, moves, and swaps, so a matching bug cannot burn a day of Lightning Lanes. It survives a reload and turning Autopilot off and on; when it runs out Autopilot keeps watching and offers a top-up rather than stopping quietly. A new park day starts clean.
- **One attempt per attraction per action,** recorded *before* the request goes out, because a timed-out request may have succeeded. A rejection Disney actually returned is different — nothing happened — so that lock comes back after a 20-second wait. Booking is a further exception: Disney allows book, cancel, and rebook, so a booking lock lifts once Plans has shown the reservation and then shown it gone.
- **An unsettled booking holds a slot.** A request that never returned may still have landed, so it counts against the allowance until Plans settles it. The cap bounds Lightning Lanes *possibly* spent.
- **The eligibility cache is emptied** each time you turn Autopilot on, so a stale result cannot drive a booking. The day's spend is deliberately not reset with it.
- **Every guard is re-evaluated at the moment of commitment,** not only when the check began — including the offer's real return time, which can differ from the one the tipboard advertised. An offer outside your window is abandoned.

#### Working a date before your trip

Pick a later date on the LL tab and Autopilot works that day instead of today — **booking as well as moving**. The case it wins: you buy Multi Pass at the 7-day window with one selection because the headliners were gone, and Autopilot fills slots 2 and 3 overnight from cancellations.

Everything deciding an action is scoped to the day being worked on, and three facts that are only ever about *today* are fenced off from it: whether an attraction has been ridden, whether the party has redeemed anything, and the drop schedule governing the Tier 1 hold. Alerts name the date when it is not today. A watch on tomorrow uses the bounded 15-second daytime cadence above; anything further out polls at the slow steady rate, since cancellations have no schedule.

#### Diagnostics

- **Day summary.** **View day summary** on the Autopilot screen gives one screen for the selected day: every Multi Pass held on that date in any park with its return and grace-scan window, the next Lightning Lane time, the active plan for the loaded park in rank order, and passkey status.
- **Why nothing was booked.** Skips are counted rather than logged — during a drop they happen every second — and ranked, so the panel reads *"7× not everyone in the party was eligible"*.
- **Refused requests.** If Disney refuses the booking calls outright, the screen says so and names which call. It waits for three refusals spanning at least a minute, and a single success clears it. This matters because a refusal lands on *eligibility*, one step before an offer exists: without the notice, Autopilot keeps polling, alerting, and learning while silently never acting.
- **Activity log.** What was booked, moved, swapped, or failed for the rest of the park day.
- **Unknown attractions.** A notice when Disney's tipboard lists a facility ID this build does not know. Without it, such an attraction is dropped in silence — no row, no alert, no booking.

### NextLL: pursue one attraction now

Use **NextLL** when you want one attraction rather than a day-long watch list.

1. Open **NextLL**.
2. Choose the park and attraction.
3. Optionally set **Return by** to set the latest acceptable return time.
4. Tap **Find it**.

NextLL takes the first practical Lightning Lane it finds, then keeps trying to move it earlier until the target is met or you stop it. It uses your saved party from the LL tab and carries its own park selector. Underneath it is Autopilot's *book then move* with a single target and none of the levers, because at 7am with one hand the levers are the problem. Three deliberate differences:

- **It polls hard** — every 0.6s, about twice as fast as a drop burst, because there is no drop schedule to pace against when you are waiting for someone else to cancel. Not faster than that: the client's rate limit throws rather than throttles.
- **It ignores the day's action budget,** so a morning of Autopilot cannot silently disable an afternoon search.
- **It moves a reservation as often as it can improve it,** where Autopilot allows one move per attraction per session to stop it thrashing. Every move must still clear the 30-minute bar.

Its watch list is stored separately, so a search does not disturb what Autopilot is watching. Leaving the NextLL tab stops its active search, because a browser page cannot reliably keep a 0.6s timer alive in the background — but not silently: the goal is remembered for the park day, and returning offers **Resume** in one tap.

## Recommended first use

1. Configure your party and star only one or two attractions.
2. Set realistic return-time windows.
3. Use **Plan check** and resolve anything marked “Fix before enabling.”
4. Turn on **Dry run**.
5. Keep the page open while you observe the status, alerts, skip reasons, and activity log.
6. When the behavior matches your expectations, turn Dry run off and enable only the per-attraction actions you actually want.

The **Why nothing was booked** section groups common guard reasons, such as an unavailable party member, an overlap, an exhausted action budget, or a time outside the configured window.

## Troubleshooting

| Symptom                     | What to check                                                                                                                                                           |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Nothing is loading          | Confirm you launched AutoLL-2 from a supported Disney page, then refresh and sign in again if needed.                                                                   |
| Autopilot appears slow      | Keep the tab foregrounded. Check its status for a backoff message or a stopped state.                                                                                   |
| It watches but does not act | Check Dry run, paused targets, return-time windows, whole-party eligibility, clashes, and the daily action budget.                                                      |
| A starred ride is ignored   | A target starred in another park or on another date does not apply to the loaded day. Check **Not on today's list** for one Disney has stopped listing.                 |
| Nothing books at all        | Check the refused-requests notice. Disney's bot filter can refuse the booking calls outright.                                                                           |
| NextLL stopped              | It stops when you leave its tab. Return to NextLL and choose **Resume**.                                                                                                |
| A ride is missing           | Refresh the LL list. Single Pass attractions are not watchable. If Disney's tipboard contains an unknown attraction ID, AutoLL-2 displays an unknown-attraction notice. |

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
