// Mock output for tests/08_past_midnight.txt, traced by hand. Replace `output` with real main.py output once it exists.
window.SAMPLES = window.SAMPLES || {};
window.SAMPLES["08 Past midnight"] = {
  description: "1 vehicle, job runs past 24:00",
  input: `1
23:50 5 N 15`,
  output: `Vehicle 0: 23:50 Start route to job
Vehicle 0: 23:50 Drive 5 minutes north
Vehicle 0: 23:55 Start job
Vehicle 0: 00:10 (+1d) Finish job
Vehicle 0: 00:10 (+1d) Start route to base
Vehicle 0: 00:10 (+1d) Drive 5 minutes south
Vehicle 0: 00:15 (+1d) Arrive at base`,
};
