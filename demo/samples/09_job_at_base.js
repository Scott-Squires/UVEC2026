// Mock output for tests/09_job_at_base.txt, traced by hand. Replace `output` with real main.py output once it exists.
window.SAMPLES = window.SAMPLES || {};
window.SAMPLES["09 Job at base"] = {
  description: "Incident at (0, 0): no Drive line, no trip home",
  input: `1
09:00 0 N 0 E 20`,
  output: `Vehicle 0: 09:00 Start route to job
Vehicle 0: 09:00 Start job
Vehicle 0: 09:20 Finish job`,
};
