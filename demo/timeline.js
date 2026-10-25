// timeline.js: combines the parsed output (and input, if given) into one model,
// and answers "where is every vehicle at time t?". Everything is computed from t alone,
// so the slider can scrub backwards as well as forwards.

const IDLE_GAP = 4; // quiet stretches longer than this (minutes) get skipped during playback

function buildModel(outputText, inputText) {
  const out = parseOutput(outputText || "");
  const hasInputText = Boolean(inputText && inputText.trim());
  const input = hasInputText ? parseInput(inputText) : null;
  const warnings = out.warnings.slice();
  const warn = (line, msg) => warnings.push({ line, msg });

  if (hasInputText && !input) {
    warn(null, "The input box doesn't look like an input file (its first line should be the number of vehicles), so it was ignored");
  }

  const maxId = out.vehicles.reduce((m, v) => Math.max(m, v.id), -1);
  let vehicleCount = maxId + 1;
  if (input) {
    if (maxId >= input.vehicleCount) {
      warn(null, `The output mentions Vehicle ${maxId}, but the input only has ${input.vehicleCount} vehicle(s)`);
    }
    vehicleCount = Math.max(input.vehicleCount, maxId + 1);
  }

  const segs = Array.from({ length: vehicleCount }, () => []);
  for (const v of out.vehicles) segs[v.id] = v.segs;

  // One job per "Start job", linked to the drive that led to it
  const jobs = [];
  segs.forEach((list, id) => {
    list.forEach((s, i) => {
      if (s.kind !== "job") return;
      const prev = list[i - 1];
      const drive = prev && prev.kind === "drive_job" ? prev : null;
      const job = { vehicle: id, at: s.at, start: s.t0, finish: s.t1, dispatched: drive ? drive.t0 : s.t0, seg: s, drive, call: null };
      s.job = job;
      if (drive) drive.job = job;
      jobs.push(job);
    });
  });

  // Match each job to the call it answers: same spot, called before the vehicle set off
  if (input) {
    const pool = input.calls.slice().sort((a, b) => a.t - b.t || a.index - b.index);
    const byDispatch = jobs.slice().sort((a, b) => a.dispatched - b.dispatched || a.vehicle - b.vehicle);
    for (const job of byDispatch) {
      const call = pool.find((c) => !c.used && c.x === job.at[0] && c.y === job.at[1] && c.t <= job.dispatched);
      if (!call) {
        warn(job.seg.line, `Vehicle ${job.vehicle}'s job at ${fmtPoint(job.at)} (${fmtTime(job.start)}) doesn't match any call in the input`);
        continue;
      }
      call.used = true;
      job.call = call;
    }
    for (const c of pool) {
      if (!c.used) warn(null, `The ${fmtTime(c.t)} call at ${fmtPoint([c.x, c.y])} is never answered in the output`);
    }
  }

  for (const job of jobs) {
    if (job.finish === null) {
      job.finish = job.seg.t1 = job.start + (job.call ? job.call.duration : 0);
    } else if (job.call && job.finish - job.start !== job.call.duration) {
      warn(job.seg.line, `Vehicle ${job.vehicle}'s job at ${fmtPoint(job.at)} lasts ${job.finish - job.start} min, but the call says ${job.call.duration} min`);
    }
    job.callTime = job.call ? job.call.t : job.dispatched;
    job.duration = job.finish - job.start;
    job.delay = job.start - job.callTime;
  }

  // Number calls in the order they came in (input order breaks ties)
  jobs.sort((a, b) => a.callTime - b.callTime || (a.call && b.call ? a.call.index - b.call.index : a.vehicle - b.vehicle));
  jobs.forEach((j, i) => (j.number = i + 1));

  // Time range
  const times = [];
  for (const l of out.lines) if (l.t !== null) times.push(l.t);
  for (const list of segs) for (const s of list) times.push(s.t0, s.t1);
  for (const j of jobs) times.push(j.callTime);
  const start = times.length ? Math.min(...times) : 0;
  const end = times.length ? Math.max(...times) : 0;

  // Cells each vehicle drives over, with the minute it enters each one
  const trails = segs.map((list) => {
    const cells = [];
    for (const s of list) {
      if (s.kind === "job") continue;
      const d = dist(s.from, s.to);
      for (let k = 1; k <= d; k++) {
        const p = along(s.from, s.to, k, s.order);
        cells.push({ x: p[0], y: p[1], t: s.t0 + k });
      }
    }
    return cells;
  });

  // Quiet stretches: nobody moving, working, or waiting for a vehicle
  const spans = [];
  for (const list of segs) for (const s of list) spans.push([s.t0, s.t1]);
  for (const j of jobs) spans.push([j.callTime, j.start]);
  spans.sort((a, b) => a[0] - b[0]);
  const gaps = [];
  let reach = spans.length ? spans[0][1] : 0;
  for (const [a, b] of spans) {
    if (a - reach > IDLE_GAP) gaps.push({ from: reach, to: a });
    reach = Math.max(reach, b);
  }

  // Grid bounds: every point anyone visits, plus base, plus 2 cells of padding
  const xs = [0];
  const ys = [0];
  for (const list of segs) {
    for (const s of list) {
      for (const p of s.kind === "job" ? [s.at] : [s.from, s.to]) {
        xs.push(p[0]);
        ys.push(p[1]);
      }
    }
  }
  if (input) {
    for (const c of input.calls) {
      xs.push(c.x);
      ys.push(c.y);
    }
  }
  const bounds = { minX: Math.min(...xs) - 2, maxX: Math.max(...xs) + 2, minY: Math.min(...ys) - 2, maxY: Math.max(...ys) + 2 };

  return { vehicleCount, segs, jobs, lines: out.lines, warnings, start, end, trails, gaps, bounds, hasInput: Boolean(input), input };
}

// State of vehicle v at time t:
//   { state: "AT_BASE" | "TO_JOB" | "ON_JOB" | "TO_BASE" | "STOPPED", pos: [x, y], seg?, job?, progress?, left? }
function vehicleAt(model, v, t) {
  let last = null;
  for (const s of model.segs[v]) {
    if (t < s.t0) break;
    if (t < s.t1) {
      if (s.kind === "job") {
        return { state: "ON_JOB", pos: s.at, seg: s, job: s.job, progress: (t - s.t0) / (s.t1 - s.t0), left: s.t1 - t };
      }
      return { state: s.kind === "drive_job" ? "TO_JOB" : "TO_BASE", pos: along(s.from, s.to, t - s.t0, s.order), seg: s, job: s.job || null };
    }
    last = s;
  }
  if (!last) return { state: "AT_BASE", pos: [0, 0] };
  const end = last.kind === "job" ? last.at : last.to;
  return isBase(end) ? { state: "AT_BASE", pos: [0, 0] } : { state: "STOPPED", pos: end };
}

// "waiting" (called, nobody there yet), "active" (being worked), "done", or null (not called yet)
function callStatus(job, t) {
  if (t < job.callTime) return null;
  if (t < job.start) return "waiting";
  if (t < job.finish) return "active";
  return "done";
}

function deliveryStats(model) {
  if (!model.hasInput || !model.jobs.length) return null;
  const answered = model.jobs.filter((j) => j.call);
  if (!answered.length) return null;
  const total = answered.reduce((s, j) => s + j.delay, 0);
  const worst = answered.reduce((w, j) => (j.delay > w.delay ? j : w), answered[0]);
  return { calls: model.input.calls.length, answered: answered.length, total, average: total / answered.length, worst };
}
