// parse.js: turns the text main.py prints (and, optionally, the input file) into plain data.
// Pure functions only: text in, objects out. No drawing and no DOM.

const LINE_RE = /^Vehicle\s+(\d+):\s+(\d{1,2}):(\d{2})(?:\s+\(\+(\d+)d\))?\s+(.+?)$/;
const DRIVE_LINE_RE = /^Drive \d+ minutes? (north|south|east|west)( and \d+ minutes? (north|south|east|west))?$/i;
const DRIVE_PART_RE = /(\d+) minutes? (north|south|east|west)/gi;

function dist(a, b) {
  return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
}

function isBase(p) {
  return p[0] === 0 && p[1] === 0;
}

// Where a vehicle is after driving k minutes (k may be fractional) from `from` toward `to`.
// order "ns" drives the north/south leg first, "ew" the east/west leg first.
function along(from, to, k, order) {
  let x = from[0];
  let y = from[1];
  const legs = order === "ew" ? ["x", "y"] : ["y", "x"];
  for (const axis of legs) {
    const cur = axis === "x" ? x : y;
    const target = axis === "x" ? to[0] : to[1];
    const step = Math.min(Math.max(k, 0), Math.abs(target - cur));
    const next = cur + Math.sign(target - cur) * step;
    k -= step;
    if (axis === "x") x = next;
    else y = next;
  }
  return [x, y];
}

// Minutes since midnight -> "HH:MM", or "HH:MM (+1d)" after midnight
function fmtTime(t) {
  const m = Math.floor(t);
  const day = Math.floor(m / 1440);
  const inDay = ((m % 1440) + 1440) % 1440;
  const clock = String(Math.floor(inDay / 60)).padStart(2, "0") + ":" + String(inDay % 60).padStart(2, "0");
  return day > 0 ? `${clock} (+${day}d)` : clock;
}

function fmtPoint(p) {
  return `(${p[0]}, ${p[1]})`;
}

// ---------- Input file: "2" then lines like "10:45 15 N 20 W 45" ----------

function parseCallTokens(tok) {
  const tm = /^(\d{1,2}):(\d{2})$/.exec(tok[0] || "");
  if (!tm || Number(tm[1]) > 23 || Number(tm[2]) > 59) return null;
  if (tok.length !== 4 && tok.length !== 6) return null;

  let x = 0;
  let y = 0;
  const axes = new Set();
  for (let k = 1; k < tok.length - 1; k += 2) {
    if (!/^\d+$/.test(tok[k])) return null;
    const n = Number(tok[k]);
    const d = tok[k + 1].toUpperCase();
    const axis = d === "N" || d === "S" ? "y" : d === "E" || d === "W" ? "x" : null;
    if (!axis || axes.has(axis)) return null;
    axes.add(axis);
    if (d === "N") y += n;
    else if (d === "S") y -= n;
    else if (d === "E") x += n;
    else x -= n;
  }

  const last = tok[tok.length - 1];
  if (!/^\d+$/.test(last)) return null;
  return { t: Number(tm[1]) * 60 + Number(tm[2]), x, y, duration: Number(last) };
}

// Returns { vehicleCount, calls: [{t, x, y, duration, index}], skipped } or null if it isn't an input file
function parseInput(text) {
  const lines = text.split(/\r?\n/);
  let i = 0;
  while (i < lines.length && !lines[i].trim()) i++;
  if (i >= lines.length || !/^\d+$/.test(lines[i].trim())) return null;

  const vehicleCount = Number(lines[i].trim());
  const calls = [];
  let skipped = 0;
  for (const raw of lines.slice(i + 1)) {
    if (!raw.trim()) continue;
    const call = parseCallTokens(raw.trim().split(/\s+/));
    if (call) {
      call.index = calls.length;
      calls.push(call);
    } else {
      skipped++;
    }
  }
  return { vehicleCount, calls, skipped };
}

// ---------- Output: "Vehicle 0: 10:45 Start route to job" ----------
//
// Each vehicle becomes a list of segments:
//   { kind: "drive_job" | "drive_home", t0, t1, from: [x,y], to: [x,y], order: "ns" | "ew" }
//   { kind: "job", t0, t1, at: [x,y] }
// Anything that doesn't add up goes into `warnings` instead of throwing.

function parseOutput(text) {
  const rawLines = text.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
  const explicitDays = rawLines.some((l) => /\(\+\d+d\)/.test(l));
  const lines = [];
  const warnings = [];
  const vehicles = new Map();
  let prevT = -Infinity;
  let dayOffset = 0;
  let rolledOver = false;

  const warn = (line, msg) => warnings.push({ line, msg });
  const vehicle = (id) => {
    if (!vehicles.has(id)) vehicles.set(id, { pos: [0, 0], open: null, segs: [] });
    return vehicles.get(id);
  };
  const open = (v, seg) => {
    v.segs.push(seg);
    v.open = seg;
  };
  const describe = (seg) => (seg.kind === "job" ? "still on a job" : seg.kind === "drive_job" ? "still driving to a job" : "still driving home");

  // Ends the open drive at time t; the vehicle is now wherever the drive ended
  const closeDrive = (v, t, n, where) => {
    const s = v.open;
    s.t1 = t;
    const d = dist(s.from, s.to);
    if (t - s.t0 !== d) warn(n, `${where}: a ${d}-block drive took ${t - s.t0} minutes`);
    v.pos = s.to.slice();
    v.open = null;
  };

  // Closes whatever is open when a line arrives out of turn, so parsing can carry on
  const forceClose = (v, t) => {
    const s = v.open;
    s.t1 = t;
    if (s.kind !== "job") {
      s.to = along(s.from, s.to, t - s.t0, s.order);
      v.pos = s.to.slice();
    }
    v.open = null;
  };

  for (const text of rawLines) {
    const n = lines.length;
    const entry = { text, t: null, vehicle: null, ok: false };
    lines.push(entry);

    const m = LINE_RE.exec(text);
    if (!m) {
      warn(n, `Unrecognised line: "${text}"`);
      continue;
    }

    let t = Number(m[2]) * 60 + Number(m[3]);
    if (explicitDays) {
      t += 1440 * Number(m[4] || 0);
      if (t < prevT) warn(n, `This line is earlier than the line before it`);
    } else {
      // No (+1d) markers anywhere: assume the day rolled over whenever time goes backwards
      t += dayOffset;
      while (t < prevT) {
        t += 1440;
        dayOffset += 1440;
        rolledOver = true;
      }
    }
    prevT = Math.max(prevT, t);

    const id = Number(m[1]);
    const event = m[5];
    const v = vehicle(id);
    const where = `Vehicle ${id} at ${fmtTime(t)}`;
    entry.t = t;
    entry.vehicle = id;
    entry.ok = true;

    if (event === "Start route to job") {
      if (v.open && v.open.kind === "drive_home") {
        // Redirect: cut the trip home at the point the vehicle has reached
        const s = v.open;
        s.to = along(s.from, s.to, t - s.t0, s.order);
        s.t1 = t;
        s.cut = true;
        v.pos = s.to.slice();
        v.open = null;
      } else if (v.open) {
        warn(n, `${where}: starts a new route while ${describe(v.open)}`);
        forceClose(v, t);
      }
      open(v, { kind: "drive_job", t0: t, t1: null, from: v.pos.slice(), to: v.pos.slice(), order: "ns", line: n });
    } else if (/^Drive\b/.test(event)) {
      const s = v.open;
      if (!s || s.kind === "job") {
        warn(n, `${where}: Drive line without a "Start route" line before it`);
        entry.ok = false;
        continue;
      }
      if (!DRIVE_LINE_RE.test(event)) {
        warn(n, `${where}: can't read this Drive line`);
        entry.ok = false;
        continue;
      }
      let dx = 0;
      let dy = 0;
      let first = null;
      for (const part of event.matchAll(DRIVE_PART_RE)) {
        const k = Number(part[1]);
        const dir = part[2].toLowerCase();
        if (first === null) first = dir;
        if (dir === "north") dy += k;
        else if (dir === "south") dy -= k;
        else if (dir === "east") dx += k;
        else dx -= k;
      }
      s.order = first === "east" || first === "west" ? "ew" : "ns";
      s.to = [s.from[0] + dx, s.from[1] + dy];
      if (s.kind === "drive_home" && !isBase(s.to)) {
        warn(n, `${where}: the drive home ends at ${fmtPoint(s.to)}, not at base`);
      }
    } else if (event === "Start job") {
      if (v.open && v.open.kind === "drive_job") {
        closeDrive(v, t, n, where);
      } else {
        warn(n, `${where}: "Start job" without a route to it`);
        if (v.open) forceClose(v, t);
      }
      open(v, { kind: "job", t0: t, t1: null, at: v.pos.slice(), line: n });
    } else if (event === "Finish job") {
      if (v.open && v.open.kind === "job") {
        v.open.t1 = t;
        v.open = null;
      } else {
        warn(n, `${where}: "Finish job" without a job in progress`);
      }
    } else if (event === "Start route to base") {
      if (v.open) {
        warn(n, `${where}: heads home while ${describe(v.open)}`);
        forceClose(v, t);
      }
      open(v, { kind: "drive_home", t0: t, t1: null, from: v.pos.slice(), to: [0, 0], order: "ns", line: n });
    } else if (event === "Arrive at base") {
      if (v.open && v.open.kind === "drive_home") {
        closeDrive(v, t, n, where);
      } else {
        warn(n, `${where}: "Arrive at base" without a trip home`);
        if (v.open) forceClose(v, t);
      }
      v.pos = [0, 0];
    } else {
      warn(n, `${where}: unknown event "${event}"`);
      entry.ok = false;
    }
  }

  // Output that stops mid-drive or mid-job
  for (const [id, v] of vehicles) {
    const s = v.open;
    if (!s) continue;
    if (s.kind === "job") s.unfinished = true;
    else s.t1 = s.t0 + dist(s.from, s.to);
    warn(s.line, `Vehicle ${id}: the output ends before its last ${s.kind === "job" ? "job finishes" : "drive ends"}`);
  }
  if (rolledOver) {
    warnings.unshift({ line: null, msg: "Times went backwards with no (+1d) marker, so the page assumed the day rolled over" });
  }

  return { lines, warnings, vehicles: [...vehicles].map(([id, v]) => ({ id, segs: v.segs })) };
}
