# Demo

A browser page that plays back the scheduler's output on a grid. It shows exactly what `main.py` prints.

**Run it:**

```bash
python3 demo/show.py tests/03_chaining_all_busy.txt
```

This runs `main.py` on the file, prints its output in the terminal as normal, and opens the demo with that same output loaded. The top bar shows "Run: 03_chaining_all_busy.txt". Run it again with another file and the demo shows that one instead. To try a different program, add it as a second argument: `python3 demo/show.py test.txt other.py`.

**Without show.py:** open `demo/index.html`, click **Open**, and pick an output file (plus its input file if you have it). The page needs no server and no install. Without internet it still works, with a fallback font.

```
demo/
├── index.html        the page; loads the scripts below in order
├── style.css         colours and layout
├── parse.js          output text (and input file) → segments, plus warnings
├── timeline.js       builds the model; where every vehicle is at minute t
├── draw.js           draws the grid
├── app.js            playback, controls, step explanations
├── show.py           runs main.py on an input file and opens the result here
└── latest.js         written by show.py (not committed)
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

The bottom-left card shows what each vehicle is doing. The bottom-right card explains the current step in plain English (for example "Vehicle 0 goes straight on to call 3 without going home"), followed by the average and worst wait. **Output** expands to show the raw output. Anything that doesn't add up is shown in red: a drive whose minutes don't match its timestamps, a job that doesn't match any call, or a call that's never answered.

### Controls

Everything is in the top bar:
- **Run name:** what's loaded.
- **Open:** an output file, plus the input file if you have it. Select both at once.
- **‹ ▶ ›:** step back, play / pause, step forward (also ←, space, →). Steps jump to the next moment when something happens.
- **Slider:** drag to any time.
- **− 1x +:** speed, from 0.5x to 20x. At 1x, one minute every 0.25 s.
- **Red clock:** the current time.

Long stretches where nothing happens are skipped during playback.

---

## Output format

The demo reads `main.py`'s output in this format.

```
Vehicle <id>: <time> <event>
```

| Event | Meaning |
|---|---|
| `Start route to job` | Leaves for a job from wherever it is now |
| `Drive <n> minutes <dir>[ and <n> minutes <dir>]` | The route for the drive just started. North/south part first, then east/west |
| `Start job` | Arrived at the job |
| `Finish job` | Job done |
| `Start route to base` | Heads home |
| `Arrive at base` | Home at (0, 0) |

Times are `HH:MM`, with ` (+1d)` after midnight. Warnings about bad input lines go to stderr, so they show in the terminal but never reach the demo.
