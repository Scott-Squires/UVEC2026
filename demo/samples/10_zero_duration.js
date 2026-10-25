// Mock output for tests/10_zero_duration.txt, traced by hand. Replace `output` with real main.py output once it exists.
window.SAMPLES = window.SAMPLES || {};
window.SAMPLES["10 Zero duration"] = {
  description: "Start job and Finish job at the same minute",
  input: `1
09:00 3 N 2 W 0`,
  output: `Vehicle 0: 09:00 Start route to job
Vehicle 0: 09:00 Drive 3 minutes north and 2 minutes west
Vehicle 0: 09:05 Start job
Vehicle 0: 09:05 Finish job
Vehicle 0: 09:05 Start route to base
Vehicle 0: 09:05 Drive 3 minutes south and 2 minutes east
Vehicle 0: 09:10 Arrive at base`,
};
