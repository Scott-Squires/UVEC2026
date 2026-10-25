// app.js: loads output into a model, runs playback, and keeps the top bar,
// vehicle card and step explanation in step with the current minute.

(() => {
  const $ = (id) => document.getElementById(id);
  const canvas = $("canvas");
  const ctx = canvas.getContext("2d");
  const slider = $("slider");

  const SPEEDS = [0.5, 1, 2, 5, 20];
  const MINUTES_PER_SECOND = 4; // at 1x, one minute every 0.25 s

  let model = null;
  let layout = null;
  let grid = null;
  let dpr = 1;
  let t = 0;
  let speedIndex = 1;
  let playing = false;
  let lastFrame = null;
  let shown = null; // minute currently on screen
  let steps = []; // distinct times when something happens: an output line or a call coming in
  let sentences = []; // plain-English version of each output line
  let logRows = [];
  let current = { output: "", input: "" }; // text currently shown

  // ---------- Loading ----------

  function load(output, input) {
    model = buildModel(output, input);
    const times = model.lines.filter((l) => l.t !== null).map((l) => l.t);
    if (model.hasInput) times.push(...model.jobs.map((j) => j.callTime));
    steps = [...new Set(times)].sort((a, b) => a - b);
    sentences = describeLines();
    slider.min = model.start;
    slider.max = model.end;
    t = model.start;
    setPlaying(false);

    logRows = model.lines.map((line) => {
      const row = document.createElement("div");
      row.textContent = line.text;
      if (!line.ok) row.className = "bad";
      row.addEventListener("click", () => line.t !== null && jumpTo(line.t));
      return row;
    });
    $("log").replaceChildren(...logRows);
    resize();
  }

  // A run saved by show.py in latest.js
  function loadSample(name) {
    const s = window.SAMPLES[name];
    current = { output: s.output, input: s.input || "" };
    $("run-name").textContent = name;
    load(current.output, current.input);
  }

  // An input file starts with a line that is just the vehicle count
  function isInputFile(text) {
    const first = text.split(/\r?\n/).find((l) => l.trim());
    return first !== undefined && /^\d+$/.test(first.trim());
  }

  // Opened files: an input file replaces the input, anything else the output
  async function openFiles(files) {
    let outputName = null;
    for (const f of files) {
      const text = await f.text();
      if (isInputFile(text)) {
        current.input = text;
      } else {
        current.output = text;
        outputName = f.name;
      }
    }
    if (outputName) $("run-name").textContent = outputName;
    load(current.output, current.input);
  }

  // One sentence per output line, so the status card can explain each step.
  // Drive lines get none: the sentence for "Start route" already covers them.
  function describeLines() {
    const said = model.lines.map(() => null);
    model.segs.forEach((list, v) => {
      list.forEach((s, i) => {
        const prev = list[i - 1];
        if (s.kind === "drive_job" && s.job) {
          const n = s.job.number;
          if (prev && prev.cut) said[s.line] = `Vehicle ${v} turns around on its way home and heads to call ${n}.`;
          else if (prev && prev.kind === "job" && prev.t1 === s.t0) said[s.line] = `Vehicle ${v} goes straight on to call ${n} without going home.`;
          else said[s.line] = `Vehicle ${v} sets off for call ${n}.`;
        } else if (s.kind === "job" && s.job) {
          const wait = s.job.call ? `, ${s.job.delay} min after the call came in` : "";
          said[s.line] = `Vehicle ${v} arrives at call ${s.job.number}${wait}.`;
        } else if (s.kind === "drive_home") {
          said[s.line] = `Vehicle ${v} heads back to base.`;
        }
      });
    });
    model.lines.forEach((line, i) => {
      if (line.text.endsWith("Finish job")) {
        const job = model.jobs.find((j) => j.vehicle === line.vehicle && j.finish === line.t);
        if (job) said[i] = `Vehicle ${line.vehicle} finishes call ${job.number}.`;
      } else if (line.text.endsWith("Arrive at base")) {
        said[i] = `Vehicle ${line.vehicle} is back at base.`;
      }
    });
    return said;
  }

  // ---------- Playback ----------

  function jumpTo(time) {
    setPlaying(false);
    t = Math.min(Math.max(time, model.start), model.end);
  }

  function setPlaying(on) {
    if (on && t >= model.end) t = model.start;
    playing = on;
    // SVG elements have no .hidden property, so toggle the attribute itself
    $("icon-play").toggleAttribute("hidden", on);
    $("icon-pause").toggleAttribute("hidden", !on);
    lastFrame = null;
  }

  function stepForward() {
    const next = steps.find((s) => s > Math.floor(t));
    jumpTo(next !== undefined ? next : model.end);
  }

  function stepBack() {
    const prev = steps.filter((s) => s < Math.floor(t)).pop();
    jumpTo(prev !== undefined ? prev : model.start);
  }

  function setSpeed(i) {
    speedIndex = Math.min(Math.max(i, 0), SPEEDS.length - 1);
    $("speed").textContent = `${SPEEDS[speedIndex]}x`;
  }

  function frame(now) {
    if (model && playing) {
      if (lastFrame !== null) {
        t += (Math.min(100, now - lastFrame) / 1000) * MINUTES_PER_SECOND * SPEEDS[speedIndex];
        // Don't sit through long stretches where nothing happens
        for (const g of model.gaps) {
          if (t > g.from + 1 && t < g.to - 1) t = g.to - 1;
        }
        if (t >= model.end) {
          t = model.end;
          setPlaying(false);
        }
      }
      lastFrame = now;
    }
    if (model && layout && Math.floor(t) !== shown) {
      shown = Math.floor(t);
      render();
    }
    requestAnimationFrame(frame);
  }

  // ---------- Drawing ----------

  function describe(s) {
    if (s.state === "TO_JOB") return s.job ? `to call ${s.job.number}` : "to a call";
    if (s.state === "ON_JOB") return `on call ${s.job.number}, ${Math.ceil(s.left)} min left`;
    if (s.state === "TO_BASE") return "heading home";
    return "at base";
  }

  function render() {
    const minute = Math.floor(t);
    const states = [];
    for (let v = 0; v < model.vehicleCount; v++) states.push(vehicleAt(model, v, minute));

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawFrame(ctx, model, layout, grid, minute, states);

    $("clock").textContent = fmtTime(minute);
    $("counter").textContent = `${steps.filter((s) => s <= minute).length} / ${steps.length}`;
    if (document.activeElement !== slider) slider.value = t;

    $("vehicles").replaceChildren(...states.map((s, v) => {
      const li = document.createElement("li");
      const dot = document.createElement("span");
      dot.className = "dot";
      dot.style.background = vehicleColor(v);
      li.append(dot, `Vehicle ${v}: ${describe(s)}`);
      return li;
    }));

    // Output: highlight the lines for the latest minute that has happened
    let nowT = null;
    for (const line of model.lines) if (line.t !== null && line.t <= minute) nowT = line.t;
    let firstNow = null;
    model.lines.forEach((line, i) => {
      const isNow = line.t !== null && line.t === nowT;
      logRows[i].classList.toggle("future", line.t !== null && line.t > minute);
      logRows[i].classList.toggle("now", isNow);
      if (isNow && firstNow === null) firstNow = i;
    });
    if (firstNow !== null && $("log").offsetParent) logRows[firstNow].scrollIntoView({ block: "nearest" });

    renderStatus(minute);
  }

  // Explains the latest step at or before this minute: calls coming in, then what the vehicles did
  function renderStatus(minute) {
    const status = $("status");
    const add = (text, className) => {
      const div = document.createElement("div");
      div.textContent = text;
      if (className) div.className = className;
      status.append(div);
      return div;
    };
    status.replaceChildren();

    const stepT = steps.filter((s) => s <= minute).pop();
    if (stepT === undefined) {
      add(model.lines.length
        ? "Press play, or use the arrows to go one step at a time."
        : "Nothing loaded yet. Run python3 demo/show.py <input file>, or click Open.");
    } else {
      add(fmtTime(stepT), "when");
      for (const j of model.jobs) {
        if (!model.hasInput || j.callTime !== stepT) continue;
        const where = fmtPoint(j.at);
        if (j.dispatched > j.callTime) add(`Call ${j.number} comes in at ${where}. Vehicle ${j.vehicle} will take it after its current job.`);
        else add(`Call ${j.number} comes in at ${where}.`);
      }
      model.lines.forEach((line, i) => {
        if (line.t === stepT && sentences[i]) add(sentences[i]);
      });
    }

    const stats = deliveryStats(model);
    if (stats) add(`Average wait ${stats.average.toFixed(1)} min, worst ${stats.worst.delay} min (call ${stats.worst.number})`, "stats");

    for (const w of model.warnings.slice(0, 5)) {
      const div = add(w.msg, "problem");
      const line = w.line !== null ? model.lines[w.line] : null;
      if (line && line.t !== null) div.addEventListener("click", () => jumpTo(line.t));
    }
  }

  function resize() {
    if (!model) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    layout = makeLayout(model, w, h);
    grid = document.createElement("canvas");
    grid.width = canvas.width;
    grid.height = canvas.height;
    const gctx = grid.getContext("2d");
    gctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawGrid(gctx, layout);
    shown = null;
  }

  // ---------- Controls ----------

  $("open").addEventListener("click", () => $("files").click());
  $("files").addEventListener("change", (e) => {
    openFiles([...e.target.files]);
    e.target.value = "";
  });

  $("play").addEventListener("click", () => setPlaying(!playing));
  $("next").addEventListener("click", stepForward);
  $("prev").addEventListener("click", stepBack);
  $("slower").addEventListener("click", () => setSpeed(speedIndex - 1));
  $("faster").addEventListener("click", () => setSpeed(speedIndex + 1));
  slider.addEventListener("input", () => (t = Number(slider.value)));

  // Space plays / pauses, arrows step
  window.addEventListener("keydown", (e) => {
    if (!model || e.metaKey || e.ctrlKey) return;
    if (e.key === " ") {
      e.preventDefault();
      setPlaying(!playing);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      stepForward();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      stepBack();
    }
  });

  window.addEventListener("resize", resize);
  // Redraw once Outfit has loaded so the canvas labels use it
  document.fonts.ready.then(resize);

  // Open on the last run from show.py, if there is one
  const runs = Object.keys(window.SAMPLES || {});
  if (runs.length) {
    loadSample(runs[0]);
  } else {
    load("", "");
  }
  requestAnimationFrame(frame);
})();
