// Mock output for tests/03_chaining_all_busy.txt, traced by hand. Replace `output` with real main.py output once it exists.
window.SAMPLES = window.SAMPLES || {};
window.SAMPLES["03 Chaining"] = {
  description: "2 vehicles, all busy; V0 goes job to job without going home",
  input: `2
10:00 5 N 5 E 60
10:05 3 S 2 W 60
10:10 2 N 4 E 20`,
  output: `Vehicle 0: 10:00 Start route to job
Vehicle 0: 10:00 Drive 5 minutes north and 5 minutes east
Vehicle 1: 10:05 Start route to job
Vehicle 1: 10:05 Drive 3 minutes south and 2 minutes west
Vehicle 0: 10:10 Start job
Vehicle 1: 10:10 Start job
Vehicle 0: 11:10 Finish job
Vehicle 0: 11:10 Start route to job
Vehicle 0: 11:10 Drive 3 minutes south and 1 minutes west
Vehicle 1: 11:10 Finish job
Vehicle 1: 11:10 Start route to base
Vehicle 1: 11:10 Drive 3 minutes north and 2 minutes east
Vehicle 0: 11:14 Start job
Vehicle 1: 11:15 Arrive at base
Vehicle 0: 11:34 Finish job
Vehicle 0: 11:34 Start route to base
Vehicle 0: 11:34 Drive 2 minutes south and 4 minutes west
Vehicle 0: 11:40 Arrive at base`,
};
