// Mock output for tests/04_redirect_home.txt, traced by hand. Replace `output` with real main.py output once it exists.
window.SAMPLES = window.SAMPLES || {};
window.SAMPLES["04 Redirect"] = {
  description: "1 vehicle, turned around at (0, 5) on its way home",
  input: `1
10:00 10 N 5
10:20 3 E 5`,
  output: `Vehicle 0: 10:00 Start route to job
Vehicle 0: 10:00 Drive 10 minutes north
Vehicle 0: 10:10 Start job
Vehicle 0: 10:15 Finish job
Vehicle 0: 10:15 Start route to base
Vehicle 0: 10:15 Drive 10 minutes south
Vehicle 0: 10:20 Start route to job
Vehicle 0: 10:20 Drive 5 minutes south and 3 minutes east
Vehicle 0: 10:28 Start job
Vehicle 0: 10:33 Finish job
Vehicle 0: 10:33 Start route to base
Vehicle 0: 10:33 Drive 3 minutes west
Vehicle 0: 10:36 Arrive at base`,
};
