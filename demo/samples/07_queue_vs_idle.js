// Mock output for tests/07_queue_vs_idle.txt, traced by hand. Replace `output` with real main.py output once it exists.
window.SAMPLES = window.SAMPLES || {};
window.SAMPLES["07 Queue vs idle"] = {
  description: "V0 is 1 block away but busy; V1 drives 32 min (09:12 vs 09:42)",
  input: `2
07:30 16 N 15 E 100
08:40 16 N 16 E 10`,
  output: `Vehicle 0: 07:30 Start route to job
Vehicle 0: 07:30 Drive 16 minutes north and 15 minutes east
Vehicle 0: 08:01 Start job
Vehicle 1: 08:40 Start route to job
Vehicle 1: 08:40 Drive 16 minutes north and 16 minutes east
Vehicle 1: 09:12 Start job
Vehicle 1: 09:22 Finish job
Vehicle 1: 09:22 Start route to base
Vehicle 1: 09:22 Drive 16 minutes south and 16 minutes west
Vehicle 0: 09:41 Finish job
Vehicle 0: 09:41 Start route to base
Vehicle 0: 09:41 Drive 16 minutes south and 15 minutes west
Vehicle 1: 09:54 Arrive at base
Vehicle 0: 10:12 Arrive at base`,
};
