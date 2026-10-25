// draw.js: paints the city as a grid of cells on warm graph paper.
// Each vehicle's path fills in cell by cell; base and calls are hatched, outlined cells.

const PAPER = "#e7e2da";
const GRID_LINE = "#d6d0c6";
const INK = "#3d3a36";
const BASE = "#4f86ad";
const WAITING = "#c0624a";
const ACTIVE = "#5f9e57";
const DONE = "#9b958b";
const VEHICLE_COLORS = ["#7a5aa6", "#b8912f", "#2f8a8f", "#a3487a", "#6f7d32", "#5b6475"];
const FONT = '"Outfit", system-ui, sans-serif';

// Room for the top bar. CARDS is how far the bottom cards reach in from each side and
// up from the bottom; the grid moves up out of their way if needed.
const MARGIN = { top: 80, right: 40, bottom: 40, left: 40 };
const CARDS = { left: 280, right: 400, height: 190 };

function vehicleColor(i) {
  return VEHICLE_COLORS[i] || `hsl(${(i * 137.5) % 360}, 40%, 45%)`;
}

// Fits the city's cells into a w x h canvas. North is up, east is right.
function makeLayout(model, w, h, bottom = MARGIN.bottom) {
  const b = model.bounds;
  const cols = b.maxX - b.minX + 1;
  const rows = b.maxY - b.minY + 1;
  const availW = w - MARGIN.left - MARGIN.right;
  const availH = h - MARGIN.top - bottom;
  const cell = Math.max(4, Math.floor(Math.min(availW / cols, availH / rows, 64)));
  const ox = Math.round(MARGIN.left + (availW - cols * cell) / 2);
  const oy = Math.round(MARGIN.top + (availH - rows * cell) / 2);

  const underCards = ox < CARDS.left || ox + cols * cell > w - CARDS.right;
  if (underCards && bottom < CARDS.height && h > 600) return makeLayout(model, w, h, CARDS.height);

  return { w, h, cell, cols, rows, minX: b.minX, maxX: b.maxX, minY: b.minY, maxY: b.maxY, ox, oy };
}

function cellXY(L, x, y) {
  return [L.ox + (x - L.minX) * L.cell, L.oy + (L.maxY - y) * L.cell];
}

// A pale tint of `color` with faint diagonal lines over it
const tiles = new Map();
function hatch(ctx, color, tint) {
  const key = color + tint;
  if (!tiles.has(key)) {
    const tile = document.createElement("canvas");
    tile.width = tile.height = 6;
    const g = tile.getContext("2d");
    g.fillStyle = PAPER;
    g.fillRect(0, 0, 6, 6);
    g.globalAlpha = tint;
    g.fillStyle = color;
    g.fillRect(0, 0, 6, 6);
    g.globalAlpha = Math.min(1, tint * 1.5);
    g.strokeStyle = color;
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(-1, 7);
    g.lineTo(7, -1);
    g.moveTo(-1, 1);
    g.lineTo(1, -1);
    g.moveTo(5, 7);
    g.lineTo(7, 5);
    g.stroke();
    tiles.set(key, ctx.createPattern(tile, "repeat"));
  }
  return tiles.get(key);
}

// Fills one cell, inside the grid lines. With `outline`, also draws a border in that colour.
function fillCell(ctx, L, x, y, fill, outline) {
  const [px, py] = cellXY(L, x, y);
  ctx.fillStyle = fill;
  ctx.fillRect(px + 1, py + 1, L.cell - 1, L.cell - 1);
  if (outline) {
    ctx.strokeStyle = outline;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(px + 1.75, py + 1.75, L.cell - 2.5, L.cell - 2.5);
  }
}

function cellText(ctx, L, x, y, text, color) {
  if (L.cell < 16) return;
  const [px, py] = cellXY(L, x, y);
  ctx.fillStyle = color;
  ctx.font = `600 ${Math.round(L.cell * 0.42)}px ${FONT}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, px + L.cell / 2 + 0.5, py + L.cell / 2 + 1);
}

// Graph paper across the whole screen. Drawn once per resize, then copied every frame.
function drawGrid(ctx, L) {
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, L.w, L.h);

  if (L.cell >= 6) {
    ctx.strokeStyle = GRID_LINE;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let px = L.ox % L.cell; px <= L.w; px += L.cell) {
      ctx.moveTo(Math.round(px) + 0.5, 0);
      ctx.lineTo(Math.round(px) + 0.5, L.h);
    }
    for (let py = L.oy % L.cell; py <= L.h; py += L.cell) {
      ctx.moveTo(0, Math.round(py) + 0.5);
      ctx.lineTo(L.w, Math.round(py) + 0.5);
    }
    ctx.stroke();
  }
}

function drawFrame(ctx, model, L, grid, t, states) {
  ctx.drawImage(grid, 0, 0, L.w, L.h);

  // Cells each vehicle has driven over so far
  model.trails.forEach((cells, v) => {
    const fill = hatch(ctx, vehicleColor(v), 0.22);
    for (const c of cells) {
      if (c.t > t) break;
      fillCell(ctx, L, c.x, c.y, fill);
    }
  });

  // Calls: red while waiting, green while being worked on, grey once done
  for (const j of model.jobs) {
    const status = callStatus(j, t);
    if (!status) continue;
    const color = status === "waiting" ? WAITING : status === "active" ? ACTIVE : DONE;
    fillCell(ctx, L, j.at[0], j.at[1], hatch(ctx, color, status === "done" ? 0.12 : 0.3), color);
    cellText(ctx, L, j.at[0], j.at[1], String(j.number), INK);
  }

  fillCell(ctx, L, 0, 0, hatch(ctx, BASE, 0.3), BASE);
  cellText(ctx, L, 0, 0, "B", INK);

  // Vehicles away from base: a solid circle with its number
  const r = Math.max(4, Math.min(18, L.cell * 0.32));
  states.forEach((s, v) => {
    if (s.state === "AT_BASE") return;
    const [px, py] = cellXY(L, Math.round(s.pos[0]), Math.round(s.pos[1]));
    const cx = px + L.cell / 2 + 0.5;
    const cy = py + L.cell / 2 + 0.5;
    ctx.fillStyle = vehicleColor(v);
    ctx.strokeStyle = PAPER;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    if (r >= 7) {
      ctx.fillStyle = "#fff";
      ctx.font = `600 ${Math.round(r * 1.05)}px ${FONT}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(v), cx, cy + 1);
    }
  });
}
