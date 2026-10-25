# Demo

A browser page that plays back the scheduler's output on a grid. It reads the **text that `main.py` prints**, so the scheduler and the demo only share the output format below. No code is shared between them.

**On the day (judges' input files):**

```bash
python3 demo/show.py judges_test.txt
```

This runs `main.py` on the file and prints its output to the console as normal. It then opens the demo with that run loaded, shown first in the list as "Run: judges_test.txt". Run it again with the next file; the demo always shows the latest run. To try a different program, add it as a second argument: `python3 demo/show.py judges_test.txt other.py`.

**Just the page:** `open demo/index.html`, or double-click the file in Finder. It needs no server and no install. Without internet it still works, with a fallback font.

```
demo/
├── index.html        the page; loads the scripts below in order
├── style.css         colours and layout
├── parse.js          output text (and input file) → segments, plus warnings
├── timeline.js       builds the model; where every vehicle is at minute t
├── draw.js           draws the grid
├── app.js            playback, controls, step explanations
├── show.py           runs main.py on an input file and opens the result here
├── latest.js         written by show.py (not committed)
└── samples/          mock outputs, one file per test
```

### What it shows

Each square is one block (1 minute of driving). The page moves one minute at a time.

| On screen | Meaning |
|---|---|
| Blue square "B" | Base (0, 0) |
| Red square with a number | A call waiting for a vehicle |
| Green square | A call being worked on |
| Grey square | A finished call |
| Shaded squares | The path a vehicle has driven, in that vehicle's colour |
| Numbered circle | A vehicle away from base. Vehicles at base aren't drawn |

North is up and east is right.

The bottom-left card shows what each vehicle is doing. The bottom-right card explains the current step in plain English (for example "Vehicle 0 goes straight on to call 3 without going home"), followed by the average and worst wait if the input file is loaded. **Output** expands to show the raw output. Anything that doesn't add up is shown in red: a drive whose minutes don't match its timestamps, a job that doesn't match any call, or a call that's never answered.

### Controls

Everything is in the top bar:
- **Sample name ▾:** shows what's loaded. Click it to pick any sample from the list, or press **S** for the next one.
- **Open:** your own output file, plus the input file if you have it. Select both at once. The bar then shows the file's name.
- **‹ ▶ ›:** step back, play / pause, step forward (also ←, space, →). Steps jump to the next moment when something happens.
- **Slider:** drag to any time.
- **− 1x +:** speed, from 0.5x to 20x. At 1x, one minute every 0.25 s.
- **Red clock:** the current time.

The page opens on the brief sample. Long stretches where nothing happens are skipped during playback.

---

## Output format contract

`main.py` must print **exactly** this to stdout. The visualizer depends on every rule here.

### Line grammar

```
Vehicle <id>: <time> <event>
```

| Part | Format | Examples |
|---|---|---|
| `<id>` | 0, 1, 2 … | `Vehicle 0:` |
| `<time>` | `HH:MM`, with ` (+Nd)` after midnight | `10:45`, `00:10 (+1d)` |
| `<event>` | one of the 6 below | |

| Event | Meaning |
|---|---|
| `Start route to job` | Leaves for a job from wherever it is now |
| `Drive <n> minutes <dir>[ and <n> minutes <dir>]` | The route for the drive just started. North/south part first, then east/west |
| `Start job` | Arrived at the job |
| `Finish job` | Job done |
| `Start route to base` | Heads home |
| `Arrive at base` | Home at (0, 0) |

Drive examples: `Drive 15 minutes north and 20 minutes west`, `Drive 4 minutes east`, `Drive 1 minutes south`.
Always write `minutes`, even for 1. That's what `format_driving_instruction` in `job.py` prints. The visualizer also accepts `minute`.

### Rules

1. **Time order.** Lines are sorted by time. Within the same minute, lines from different vehicles can come in any order, but each vehicle's own lines stay in order.
2. **Drive line right after a route line.** `Start route to job` and `Start route to base` are each followed by a `Drive` line at the same minute.
3. **Zero distance means no Drive line.** For a job at base (0, 0), print `Start route to job` and then `Start job` straight away. Don't print `Drive … Already at destination`.
4. **Job at base means no trip home.** After `Finish job` at (0, 0) there is no `Start route to base` and no `Arrive at base`.
5. **Chaining.** If a vehicle has another job lined up, then `Finish job` is followed by `Start route to job` at the same minute, with no trip to base in between.
6. **Redirect.** A vehicle that is driving home and gets a new call prints `Start route to job` **without** `Arrive at base`. The new `Drive` line starts from where it is at that minute (north/south leg first). Example: it left (0, 10) at 10:15 heading home, so at 10:20 it is at (0, 5).
7. **Past midnight.** Times keep counting and print as `00:10 (+1d)`.
8. **stdout is only the schedule.** Warnings about bad lines, the delay summary and debug prints all go to **stderr** (`print(..., file=sys.stderr)`). A stray `print` on stdout will break the visualizer.

---

## Samples

Each file in `samples/` sets one entry on `window.SAMPLES`:

```js
window.SAMPLES["04 Redirect"] = {
  description: "...",
  input:  `...`,   // the tests/*.txt file, copied in
  output: `...`,   // what main.py should print
};
```

The **input** is there because the output alone can't tell you:
- **how many vehicles there are.** In test 13, vehicle 2 never moves, so it never appears in the output.
- **when a call came in.** In test 03, call #3 comes in at 10:10 but isn't started until 11:14.

Use the input for the vehicle count, the call markers and the waiting animation, and the output for everything that moves.

| File | Shows |
|---|---|
| `01_brief_sample.js` | The brief's example; the first 14 lines match it exactly |
| `02_single_axis.js` | Drives in one direction only (N, W, S, E) |
| `03_chaining_all_busy.js` | V0 goes from one job straight to the next at 11:10 |
| `04_redirect_home.js` | V0 turned around at (0, 5), then passes through base to get to (3, 0) |
| `05_simultaneous.js` | 3 calls at 12:00; the 3rd is chained onto V0 |
| `07_queue_vs_idle.js` | V1 drives 32 min because V0 is busy |
| `08_past_midnight.js` | The clock goes past midnight: `23:55` → `00:10 (+1d)` |
| `09_job_at_base.js` | No Drive line, no trip home |
| `10_zero_duration.js` | Start and Finish at the same minute |
| `13_tie_lowest_id.js` | 3 vehicles, V2 never moves |
| `17_three_vehicle_rush.js` | 3 vehicles, 8 calls in a morning rush: everyone busy, a chain, a redirect and a queued call |
| `18_four_vehicle_day.js` | 4 vehicles, 16 calls from 07:00 to 13:00 |
| `19_five_vehicle_busy.js` | 5 vehicles, 30 calls through the day, ending past midnight |

All of these follow the greedy rules (soonest arrival, ties go to the lowest id). Samples 01–13 were traced by hand. Samples 17–19 are too long for that, so they were generated by a throwaway script that applies the same rules; it reproduces 01–13 exactly. Every sample passes the demo's own checks: drive times equal the distances, every job lines up with a call in its input with the right duration, and every call is answered.

The inputs for 17–19 exist only inside their sample files. To run them through `main.py`, copy the `input` text into a file in `tests/`.

---

## Connecting the real scheduler

When `main.py` works:

1. Run a test: `python3 demo/show.py tests/04_redirect_home.txt`
2. Check the bottom-right card. Warnings on stderr go to the console only, never to the page.
3. If any warnings show in red, or the real output differs from the mock, decide which one is wrong. They were built from the same rules, so a difference means either a scheduler bug or a mistake in a mock.

To add a new sample, copy one of the files in `samples/`, change its name, `input` and `output`, and add a `<script src="samples/…">` line for it in `index.html`.

### Checklist for whoever writes `main.py`

- [ ] Reads from stdin
- [ ] Nothing but schedule lines on stdout; warnings and the summary go to stderr
- [ ] No Drive line when the distance is 0 (rule 3)
- [ ] North/south part before east/west in every Drive line
- [ ] `(+1d)` past midnight (`format_time` in `job.py` already does this)
- [ ] All 10 samples match
