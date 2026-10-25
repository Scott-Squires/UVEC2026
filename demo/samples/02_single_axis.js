// Mock output for tests/02_single_axis.txt, traced by hand. Replace `output` with real main.py output once it exists.
window.SAMPLES = window.SAMPLES || {};
window.SAMPLES["02 Single axis"] = {
  description: "1 vehicle, drives that use only one direction",
  input: `1
09:00 5 N 10
10:00 3 W 10
11:00 4 S 5
12:00 6 E 5`,
  output: `Vehicle 0: 09:00 Start route to job
Vehicle 0: 09:00 Drive 5 minutes north
Vehicle 0: 09:05 Start job
Vehicle 0: 09:15 Finish job
Vehicle 0: 09:15 Start route to base
Vehicle 0: 09:15 Drive 5 minutes south
Vehicle 0: 09:20 Arrive at base
Vehicle 0: 10:00 Start route to job
Vehicle 0: 10:00 Drive 3 minutes west
Vehicle 0: 10:03 Start job
Vehicle 0: 10:13 Finish job
Vehicle 0: 10:13 Start route to base
Vehicle 0: 10:13 Drive 3 minutes east
Vehicle 0: 10:16 Arrive at base
Vehicle 0: 11:00 Start route to job
Vehicle 0: 11:00 Drive 4 minutes south
Vehicle 0: 11:04 Start job
Vehicle 0: 11:09 Finish job
Vehicle 0: 11:09 Start route to base
Vehicle 0: 11:09 Drive 4 minutes north
Vehicle 0: 11:13 Arrive at base
Vehicle 0: 12:00 Start route to job
Vehicle 0: 12:00 Drive 6 minutes east
Vehicle 0: 12:06 Start job
Vehicle 0: 12:11 Finish job
Vehicle 0: 12:11 Start route to base
Vehicle 0: 12:11 Drive 6 minutes west
Vehicle 0: 12:17 Arrive at base`,
};
