// Mock output for tests/01_brief_sample.txt, traced by hand. Replace `output` with real main.py output once it exists.
window.SAMPLES = window.SAMPLES || {};
window.SAMPLES["01 Brief sample"] = {
  description: "2 vehicles, the brief's own example",
  input: `2
10:45 15 N 20 W 45
11:00 2 S 3 E 30
16:02 4 E 15`,
  output: `Vehicle 0: 10:45 Start route to job
Vehicle 0: 10:45 Drive 15 minutes north and 20 minutes west
Vehicle 1: 11:00 Start route to job
Vehicle 1: 11:00 Drive 2 minutes south and 3 minutes east
Vehicle 1: 11:05 Start job
Vehicle 0: 11:20 Start job
Vehicle 1: 11:35 Finish job
Vehicle 1: 11:35 Start route to base
Vehicle 1: 11:35 Drive 2 minutes north and 3 minutes west
Vehicle 1: 11:40 Arrive at base
Vehicle 0: 12:05 Finish job
Vehicle 0: 12:05 Start route to base
Vehicle 0: 12:05 Drive 15 minutes south and 20 minutes east
Vehicle 0: 12:40 Arrive at base
Vehicle 0: 16:02 Start route to job
Vehicle 0: 16:02 Drive 4 minutes east
Vehicle 0: 16:06 Start job
Vehicle 0: 16:21 Finish job
Vehicle 0: 16:21 Start route to base
Vehicle 0: 16:21 Drive 4 minutes west
Vehicle 0: 16:25 Arrive at base`,
};
