// Mock output for tests/13_tie_lowest_id.txt, traced by hand. Replace `output` with real main.py output once it exists.
window.SAMPLES = window.SAMPLES || {};
window.SAMPLES["13 Tie"] = {
  description: "3 vehicles; V2 never moves, so the vehicle count must come from the input",
  input: `3
09:00 4 N 30
09:05 2 E 10`,
  output: `Vehicle 0: 09:00 Start route to job
Vehicle 0: 09:00 Drive 4 minutes north
Vehicle 0: 09:04 Start job
Vehicle 1: 09:05 Start route to job
Vehicle 1: 09:05 Drive 2 minutes east
Vehicle 1: 09:07 Start job
Vehicle 1: 09:17 Finish job
Vehicle 1: 09:17 Start route to base
Vehicle 1: 09:17 Drive 2 minutes west
Vehicle 1: 09:19 Arrive at base
Vehicle 0: 09:34 Finish job
Vehicle 0: 09:34 Start route to base
Vehicle 0: 09:34 Drive 4 minutes south
Vehicle 0: 09:38 Arrive at base`,
};
