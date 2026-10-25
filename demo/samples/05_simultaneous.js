// Mock output for tests/05_simultaneous.txt, traced by hand. Replace `output` with real main.py output once it exists.
window.SAMPLES = window.SAMPLES || {};
window.SAMPLES["05 Simultaneous"] = {
  description: "2 vehicles, 3 calls at 12:00; the 3rd chains onto V0 (12:17 vs 12:19)",
  input: `2
12:00 2 N 10
12:00 3 S 10
12:00 3 E 10`,
  output: `Vehicle 0: 12:00 Start route to job
Vehicle 0: 12:00 Drive 2 minutes north
Vehicle 1: 12:00 Start route to job
Vehicle 1: 12:00 Drive 3 minutes south
Vehicle 0: 12:02 Start job
Vehicle 1: 12:03 Start job
Vehicle 0: 12:12 Finish job
Vehicle 0: 12:12 Start route to job
Vehicle 0: 12:12 Drive 2 minutes south and 3 minutes east
Vehicle 1: 12:13 Finish job
Vehicle 1: 12:13 Start route to base
Vehicle 1: 12:13 Drive 3 minutes north
Vehicle 1: 12:16 Arrive at base
Vehicle 0: 12:17 Start job
Vehicle 0: 12:27 Finish job
Vehicle 0: 12:27 Start route to base
Vehicle 0: 12:27 Drive 3 minutes west
Vehicle 0: 12:30 Arrive at base`,
};
