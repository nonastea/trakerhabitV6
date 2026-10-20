/* ==========================================================================
   DON GASTÓN — jefe de «Plata» (gastar de más). Chanchito-alcancía de frac.
   3 fases: alcancía sobre caja registradora → registradora-vehículo → chanchito
   flaco en carro de supermercado. Todo dibujado con código (MG.art).
   ========================================================================== */
(function () {
'use strict';
const MG = window.MG, A = MG.art, W = MG.W, H = MG.H, FLOOR = 620;
const clamp = MG.clamp, lerp = MG.lerp, rand = MG.rand, pick = MG.pick, TAU = Math.PI * 2;
const PEACH = '#f0b49e', PEACH_D = '#d98f7d', PEACH_L = '#f9d6c4';
const BRASS = '#d7a64a', BRASS_D = '#9c6e22', BRASS_L = '#f2d27c';
const BILL = '#7cae6a', BILL_D = '#4f7f45';
const KC = 1.2;                              // escala del carro
const K = 1.12;                              // escala del chancho gordo
const SOFT = 'rgba(70,40,18,.5)';           // tinta suave para el fondo

const sfx = n => { try { MG.audio && MG.audio.sfx && MG.audio.sfx(n); } catch (e) {} };
const mkc = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };
let _s = 7; const rnd = () => (_s = (_s * 16807) % 2147483647, (_s - 1) / 2147483646);
function rr(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
function box(ctx, x, y, w, h, fill, lw, r, line) {
  rr(ctx, x, y, w, h, r == null ? 4 : r);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (lw !== 0) { ctx.lineWidth = lw || 4; ctx.strokeStyle = line || A.ink; ctx.lineJoin = 'round'; ctx.stroke(); }
}
function poly(ctx, pts, fill, lw, line) {
  ctx.beginPath(); pts.forEach((p, i) => ctx[i ? 'lineTo' : 'moveTo'](p[0], p[1])); ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (lw !== 0) { ctx.lineWidth = lw || 4; ctx.strokeStyle = line || A.ink; ctx.lineJoin = 'round'; ctx.stroke(); }
}

// Copia de A.blob con el contorno bien trazado (el A.blob del motor traza el contorno sobre el brillo interior cuando hay sombra)
function blob(ctx, x, y, rx, ry, fill, opt) {
  opt = opt || {};
  const n = opt.points || 18, wob = opt.wob == null ? 1.6 : opt.wob, rot = opt.rot || 0, sd = opt.seed || 0, p = new Path2D();
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  for (let i = 0; i <= n; i++) {
    const a = i / n * TAU, k = i % n, px = Math.cos(a) * (rx + A.j(k + sd, wob)), py = Math.sin(a) * (ry + A.j(k + 7 + sd, wob));
    if (i === 0) p.moveTo(px, py); else p.lineTo(px, py);
  }
  p.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(p); }
  if (opt.shade !== false && fill) {
    ctx.save(); ctx.clip(p);
    ctx.fillStyle = 'rgba(60,30,10,.18)'; ctx.beginPath(); ctx.ellipse(rx * .35, ry * .4, rx, ry, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.22)'; ctx.beginPath(); ctx.ellipse(-rx * .35, -ry * .45, rx * .35, ry * .22, -.5, 0, TAU); ctx.fill();
    ctx.restore();
  }
  if (opt.line !== false) { ctx.lineWidth = opt.lw || 4; ctx.strokeStyle = A.ink; ctx.lineJoin = 'round'; ctx.stroke(p); }
  ctx.restore();
}
const money = n => '$ ' + String(Math.floor(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

/* ============================ escenario ============================ */
let BG = null;
function buildBG() {
  const M = 80, WW = W + M * 2;
  /* ---- capa lejana: muro, galería con arcos, escalera mecánica ---- */
  const [far, f] = mkc(WW, H); f.translate(M, 0);
  let g = f.createLinearGradient(0, 0, 0, FLOOR); g.addColorStop(0, '#f2dfb4'); g.addColorStop(1, '#d9ba84');
  f.fillStyle = g; f.fillRect(-M, 0, WW, H);
  f.strokeStyle = 'rgba(150,100,50,.12)'; f.lineWidth = 2;
  for (let i = -8; i < 24; i++) { f.beginPath(); f.moveTo(i * 70, 0); f.lineTo(i * 70 + 380, 600); f.stroke(); f.beginPath(); f.moveTo(i * 70 + 380, 0); f.lineTo(i * 70, 600); f.stroke(); }
  // galería superior: arcos con vitral de sol
  for (let i = 0; i < 6; i++) {
    const x0 = -20 + i * 250, x1 = x0 + 190;
    f.beginPath(); f.moveTo(x0, 235); f.lineTo(x0, 105); f.arc((x0 + x1) / 2, 105, 95, Math.PI, 0); f.lineTo(x1, 235); f.closePath();
    const gg = f.createLinearGradient(0, 10, 0, 235); gg.addColorStop(0, '#f7e3a4'); gg.addColorStop(1, '#a9cfc6');
    f.fillStyle = gg; f.fill(); f.lineWidth = 5; f.strokeStyle = SOFT; f.stroke();
    f.save(); f.clip(); f.strokeStyle = 'rgba(255,255,255,.55)'; f.lineWidth = 3;
    for (let k = 0; k < 9; k++) { f.beginPath(); f.moveTo((x0 + x1) / 2, 215); f.lineTo((x0 + x1) / 2 + Math.cos(Math.PI + k * .39) * 160, 215 + Math.sin(Math.PI + k * .39) * 200); f.stroke(); }
    f.restore();
    // pilastra entre arcos
    box(f, x1 + 8, 20, 52, 600, '#e3c892', 3, 6, SOFT);
    f.strokeStyle = 'rgba(120,80,30,.25)'; f.lineWidth = 2;
    for (let k = 0; k < 4; k++) { f.beginPath(); f.moveTo(x1 + 20 + k * 11, 40); f.lineTo(x1 + 20 + k * 11, 600); f.stroke(); }
    box(f, x1 + 2, 18, 64, 20, BRASS, 3, 4, SOFT); box(f, x1 + 2, 596, 64, 24, BRASS, 3, 4, SOFT);
  }
  // balaustrada
  box(f, -M, 232, WW, 14, '#c9a56b', 3, 3, SOFT);
  for (let x = -M + 8; x < W + M; x += 26) box(f, x, 246, 12, 42, '#e8d3a2', 2, 5, SOFT);
  box(f, -M, 288, WW, 12, '#c9a56b', 3, 3, SOFT);
  // cartel colgante de la tienda
  f.save(); f.translate(640, 78);
  f.strokeStyle = SOFT; f.lineWidth = 3; f.beginPath(); f.moveTo(-190, -78); f.lineTo(-150, -20); f.moveTo(190, -78); f.lineTo(150, -20); f.stroke();
  box(f, -240, -26, 480, 74, '#a8483c', 5, 14, A.ink);
  box(f, -228, -16, 456, 54, null, 3, 10, BRASS_L);
  A.text(f, 'GRANDES ALMACENES', 0, -2, 30, { fill: BRASS_L, lw: 5 });
  A.text(f, '· GASTÓN & CÍA. ·', 0, 26, 18, { fill: A.cream, lw: 4, font: 'ui' });
  f.restore();
  // escalera mecánica diagonal con compradores
  f.save(); f.translate(30, 0);
  poly(f, [[60, 612], [150, 612], [610, 305], [520, 305]], '#7fa59a', 4, SOFT);
  poly(f, [[110, 612], [150, 612], [610, 305], [575, 305]], '#5f8a80', 0);
  for (let k = 0; k < 15; k++) { const t = k / 15, sx = 76 + t * 460, sy = 596 - t * 285; f.strokeStyle = 'rgba(40,70,60,.5)'; f.lineWidth = 3; f.beginPath(); f.moveTo(sx, sy); f.lineTo(sx + 38, sy - 25); f.stroke(); }
  f.strokeStyle = SOFT; f.lineWidth = 8; f.beginPath(); f.moveTo(66, 545); f.lineTo(526, 255); f.stroke();
  f.strokeStyle = '#3d4a46'; f.lineWidth = 5; f.beginPath(); f.moveTo(66, 545); f.lineTo(526, 255); f.stroke();
  for (const [t, s] of [[.22, 1], [.5, -1], [.74, 1]]) {      // siluetas de compradores
    const sx = 76 + t * 460 + 14, sy = 596 - t * 285 - 14;
    f.fillStyle = 'rgba(70,45,30,.55)'; f.beginPath(); f.ellipse(sx, sy - 50, 14, 20, 0, 0, TAU); f.fill();
    f.fillRect(sx - 15, sy - 36, 30, 40); f.beginPath(); f.ellipse(sx, sy - 74, 16, 5, 0, 0, TAU); f.fill(); f.fillRect(sx - 9, sy - 92, 18, 20);
    if (s > 0) f.fillRect(sx + 14, sy - 20, 16, 22);
  }
  f.restore();
  // zócalo de madera
  box(f, -M, 520, WW, 120, '#8a6a3f', 0, 0); f.fillStyle = 'rgba(0,0,0,.12)'; f.fillRect(-M, 520, WW, 120);
  for (let x = -M; x < W + M; x += 120) box(f, x + 8, 534, 104, 70, null, 3, 4, 'rgba(40,20,5,.35)');
  f.fillStyle = 'rgba(250,235,200,.28)'; f.fillRect(-M, 0, WW, H);          // velo para que el fondo no compita

  /* ---- capa media: vitrinas con letreros OFERTA, mostradores y cajas ---- */
  const [mid, m] = mkc(WW, H); m.translate(M, 0);
  const vitrina = (x, y, w, h, label, hats) => {
    box(m, x - 8, y - 8, w + 16, h + 16, '#8f5f33', 5, 8, A.ink);
    const gg = m.createLinearGradient(0, y, 0, y + h); gg.addColorStop(0, '#d7ece6'); gg.addColorStop(1, '#b6d6cb');
    box(m, x, y, w, h, gg, 3, 4, A.ink);
    m.strokeStyle = 'rgba(255,255,255,.7)'; m.lineWidth = 6; m.beginPath(); m.moveTo(x + 22, y + h - 18); m.lineTo(x + 62, y + 14); m.moveTo(x + 48, y + h - 18); m.lineTo(x + 88, y + 14); m.stroke();
    m.fillStyle = '#7d542f'; m.fillRect(x, y + h * .62, w, 10);               // repisa
    for (let i = 0; i < hats; i++) {                                           // sombreros / cajas en repisa
      const hx = x + 36 + i * ((w - 72) / Math.max(1, hats - 1 || 1));
      blob(m, hx, y + h * .62 - 14, 24, 10, i % 2 ? '#a8483c' : '#38507a', { wob: .4, lw: 3, shade: false, seed: i });
      box(m, hx - 15, y + h * .62 - 44, 30, 32, i % 2 ? '#a8483c' : '#38507a', 3, 6);
    }
    // letrero OFERTA colgando
    m.save(); m.translate(x + w / 2, y - 26); m.rotate(-.05);
    m.strokeStyle = A.ink; m.lineWidth = 3; m.beginPath(); m.moveTo(-40, -2); m.lineTo(-30, -26); m.moveTo(40, -2); m.lineTo(30, -26); m.stroke();
    box(m, -62, -4, 124, 42, A.red, 4, 8); A.text(m, label, 0, 17, 26, { fill: A.cream, lw: 5 });
    m.restore();
  };
  vitrina(10, 360, 270, 200, 'OFERTA', 3);
  vitrina(700, 380, 250, 180, '−50 %', 3);
  vitrina(1010, 350, 250, 210, 'OFERTA', 2);
  // maniquí con sombrero en la vitrina izquierda
  m.save(); m.translate(150, 548);
  poly(m, [[-26, -112], [26, -112], [34, -30], [-34, -30]], '#e6ccb0', 3); blob(m, 0, -128, 16, 18, '#e6ccb0', { wob: .3, lw: 3, shade: false });
  blob(m, 0, -146, 26, 7, '#1b120a', { wob: .3, lw: 2, shade: false }); box(m, -14, -176, 28, 30, '#1b120a', 2, 4);
  m.fillStyle = A.ink; m.fillRect(-4, -30, 8, 30); m.restore();
  // mostrador central con cajas registradoras chiquitas
  box(m, 330, 470, 330, 100, '#8f5f33', 5, 6); box(m, 322, 458, 346, 18, '#c9a56b', 4, 4);
  for (let i = 0; i < 2; i++) {
    const rx = 372 + i * 150;
    box(m, rx, 400, 96, 60, BRASS, 4, 8); box(m, rx + 12, 386, 72, 22, '#1d3a2b', 3, 4);
    for (let k = 0; k < 4; k++) blob(m, rx + 18 + k * 20, 436, 6, 6, A.cream, { wob: .2, lw: 2, shade: false });
  }
  // pirámide de latas "saldo"
  for (let r = 0; r < 4; r++) for (let c = 0; c <= r; c++) blob(m, 1180 + (c - r / 2) * 36 - 40, 590 - (3 - r) * 0 - r * 32 + 0, 17, 15, ['#a8483c', '#38507a', '#6d8f4e'][(r + c) % 3], { wob: .5, lw: 2.5, shade: false, seed: r * 4 + c });
  m.fillStyle = 'rgba(250,235,200,.13)'; m.fillRect(-M, 0, WW, H);

  /* ---- piso ajedrezado en perspectiva ---- */
  const [flo, fl] = mkc(WW, H); fl.translate(M, 0);
  const rows = [575, 596, 620, 652, 690, 735], vx = 640, vy = 300;
  for (let r = 0; r < rows.length - 1; r++) {
    const ya = rows[r], yb = rows[r + 1], ka = (ya - vy) / (620 - vy), kb = (yb - vy) / (620 - vy);
    for (let c = -16; c < 16; c++) {
      const xa0 = vx + c * 120 * ka, xa1 = vx + (c + 1) * 120 * ka, xb0 = vx + c * 120 * kb, xb1 = vx + (c + 1) * 120 * kb;
      poly(fl, [[xa0, ya], [xa1, ya], [xb1, yb], [xb0, yb]], (c + r) & 1 ? '#efe3c6' : '#7fa59a', 0);
    }
  }
  fl.fillStyle = 'rgba(60,30,10,.18)'; fl.fillRect(-M, 575, WW, 20);
  fl.fillStyle = 'rgba(255,255,255,.12)'; fl.beginPath(); fl.ellipse(640, 660, 520, 36, 0, 0, TAU); fl.fill();
  fl.strokeStyle = A.ink; fl.lineWidth = 4; fl.beginPath(); fl.moveTo(-M, 620); fl.lineTo(W + M, 620); fl.stroke();
  BG = { far, mid, flo, M };
}

/* ============================ piezas de dibujo ============================ */
function drawCoin(ctx, x, y, r, rot, pink) {
  const sx = Math.max(.22, Math.abs(Math.cos(rot)));
  ctx.save(); ctx.translate(x, y);
  if (pink) {
    ctx.fillStyle = 'rgba(255,95,162,.35)'; ctx.beginPath(); ctx.arc(0, 0, r * 1.55 + Math.sin(rot * 2) * 2, 0, TAU); ctx.fill();
    A.star(ctx, -r * 1.1, -r * 1.1, 6, A.cream, rot); A.star(ctx, r * 1.2, r * .9, 5, A.cream, -rot);
  }
  ctx.scale(sx, 1);
  blob(ctx, 0, 0, r, r, pink ? '#ffd36a' : BRASS_L, { wob: .5, lw: 3.5, shade: false });
  if (pink) { ctx.strokeStyle = A.pink; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, 0, r - 2, 0, TAU); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(120,70,10,.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, r * .66, 0, TAU); ctx.stroke();
  if (sx > .5) A.text(ctx, '$', 0, 1, r * 1.05, { fill: BRASS_D, stroke: false });
  ctx.restore();
}
function drawBill(ctx, x, y, rot, pink) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(1, .55 + .45 * Math.abs(Math.cos(rot * 1.7)));
  box(ctx, -26, -15, 52, 30, pink ? A.pink : BILL, 3.5, 4);
  ctx.strokeStyle = pink ? '#ffe3f0' : BILL_D; ctx.lineWidth = 2; rr(ctx, -21, -10, 42, 20, 3); ctx.stroke();
  blob(ctx, 0, 0, 8, 8, pink ? '#ffe3f0' : '#b4d6a3', { wob: .2, lw: 2, shade: false });
  ctx.restore();
}
function drawCard(ctx, x, y, t) {
  const f = Math.cos(t * 9), sx = Math.max(.2, Math.abs(f));
  ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(t * 4) * .2); ctx.scale(sx, 1);
  box(ctx, -46, -29, 92, 58, '#2f4c8c', 4, 8);
  ctx.fillStyle = BRASS_L; ctx.fillRect(-46, -14, 92, 12); ctx.fillStyle = A.ink; ctx.fillRect(-46, -12, 92, 8);
  box(ctx, -36, 4, 24, 18, BRASS, 2.5, 3);
  if (sx > .55) A.text(ctx, 'CRÉDITO', 16, 16, 12, { font: 'ui', fill: A.cream, lw: 3 });
  ctx.restore();
}
function drawTag(ctx, x, y, rot) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.strokeStyle = A.ink; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, -76); ctx.lineTo(0, -34); ctx.stroke();
  poly(ctx, [[-52, -30], [40, -30], [58, 0], [40, 30], [-52, 30]], A.red, 5);
  ctx.strokeStyle = A.cream; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.setLineDash([6, 5]); ctx.moveTo(-46, -24); ctx.lineTo(36, -24); ctx.lineTo(50, 0); ctx.lineTo(36, 24); ctx.lineTo(-46, 24); ctx.closePath(); ctx.stroke(); ctx.setLineDash([]);
  blob(ctx, 42, 0, 5, 5, A.paper, { wob: .2, lw: 2.5, shade: false });
  A.text(ctx, 'OFERTA', -8, -9, 19, { fill: A.cream, lw: 4, font: 'ui' }); A.text(ctx, '−50 %', -8, 12, 19, { fill: A.gold, lw: 4, font: 'ui' });
  ctx.restore();
}
function drawBag(ctx, x, y, rot, pink) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  poly(ctx, [[-32, -22], [32, -22], [36, 34], [-36, 34]], pink ? A.pink : '#c79a63', 4);
  ctx.strokeStyle = A.ink; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(-14, -22); ctx.quadraticCurveTo(-14, -42, 0, -42); ctx.quadraticCurveTo(14, -42, 14, -22); ctx.stroke();
  blob(ctx, -10, -34, 8, 22, '#6aa84f', { wob: .5, lw: 2.5, shade: false, rot: -.3 }); blob(ctx, 12, -32, 7, 20, '#e0b04a', { wob: .5, lw: 2.5, shade: false, rot: .3 });
  A.text(ctx, '$', 0, 8, 30, { fill: A.cream, lw: 4 });
  ctx.restore();
}
function drawHat(ctx, x, y, rot, s) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s || 1, s || 1);
  box(ctx, -38, -84, 76, 84, '#26201d', 5, 6); ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(-28, -78, 9, 70);
  blob(ctx, 0, -84, 38, 9, '#3a312c', { wob: .4, lw: 4, shade: false });
  ctx.fillStyle = A.red; ctx.fillRect(-38, -30, 76, 17); ctx.strokeStyle = A.ink; ctx.lineWidth = 3; ctx.strokeRect(-38, -30, 76, 17);
  box(ctx, -9, -31, 18, 19, BRASS_L, 2.5, 3);
  blob(ctx, 0, 0, 62, 15, '#26201d', { wob: .5, lw: 5, shade: false });
  ctx.restore();
}
function drawMustache(ctx, x, y, s, droop) {
  ctx.save(); ctx.translate(x, y); ctx.lineCap = 'round'; ctx.strokeStyle = A.ink;
  for (const d of [-1, 1]) {
    ctx.lineWidth = 11 * s; ctx.beginPath(); ctx.moveTo(0, 0);
    ctx.bezierCurveTo(d * 28 * s, 10 * s + droop, d * 62 * s, 6 * s + droop, d * 74 * s, (-8 * s) + droop * 1.6);
    ctx.stroke();
    ctx.lineWidth = 7 * s; ctx.beginPath(); ctx.arc(d * 74 * s, (-18 * s) + droop * 1.5, 11 * s, d > 0 ? Math.PI * .5 : Math.PI * .5, d > 0 ? -Math.PI * .85 : Math.PI * 1.85, d < 0); ctx.stroke();
  }
  ctx.restore();
}

/* caja registradora: v=0 pedestal, v=1 vehículo con ruedas */
function drawRegister(ctx, cx, top, o) {
  const v = o.veh, w = lerp(300, 350, v), h = lerp(125, 120, v), bt = top + h, wob = o.wobble || 0;
  ctx.save();
  // ruedas
  if (v > .02) for (const s of [-1, 1]) {
    const wx = cx + s * 128, wy = bt + 6, r = 44 * v;
    blob(ctx, wx, wy, r, r, '#2a2320', { wob: .5, lw: 4, shade: false });
    blob(ctx, wx, wy, r * .55, r * .55, A.cream, { wob: .3, lw: 3, shade: false });
    ctx.strokeStyle = A.ink; ctx.lineWidth = 3;
    for (let k = 0; k < 5; k++) { const a = o.wheel + k * TAU / 5; ctx.beginPath(); ctx.moveTo(wx, wy); ctx.lineTo(wx + Math.cos(a) * r * .55, wy + Math.sin(a) * r * .55); ctx.stroke(); }
  }
  // escape con humo de monedas, bocina y faro (solo vehículo)
  if (v > .5) {
    box(ctx, cx + w / 2 - 34, top - 42, 22, 56, '#7a7068', 4, 4); blob(ctx, cx + w / 2 - 23, top - 44, 17, 6, '#4b4540', { wob: .3, lw: 3, shade: false });
    poly(ctx, [[cx - w / 2 - 6, top + 46], [cx - w / 2 - 54, top + 22], [cx - w / 2 - 54, top + 74]], BRASS_L, 4);
    blob(ctx, cx - w / 2 - 54, top + 48, 8, 26, BRASS, { wob: .4, lw: 3.5, shade: false });
    blob(ctx, cx - w / 2 - 8, top + 96, 15, 15, '#fff0a0', { wob: .4, lw: 3.5, shade: false });
    ctx.fillStyle = 'rgba(255,240,150,.28)'; ctx.beginPath(); ctx.moveTo(cx - w / 2 - 20, top + 90); ctx.lineTo(cx - w / 2 - 150, top + 62); ctx.lineTo(cx - w / 2 - 150, top + 140); ctx.closePath(); ctx.fill();
  }
  // cuerpo
  box(ctx, cx - w / 2, top, w, h, BRASS, 6, 12);
  ctx.fillStyle = 'rgba(255,240,180,.35)'; ctx.fillRect(cx - w / 2 + 10, top + 8, w - 20, 8);
  box(ctx, cx - w / 2 - 12, top - 6, w + 24, 24, BRASS_L, 5, 8);            // repisa superior
  // pantallita
  const sw = 134, sx0 = cx - sw / 2, sy0 = top + 24;
  box(ctx, sx0 - 6, sy0 - 6, sw + 12, 50, BRASS_D, 4, 8); box(ctx, sx0, sy0, sw, 38, '#10301f', 3, 5);
  const txt = o.screen || '$ 9.990';
  A.text(ctx, txt, cx + sw / 2 - 8, sy0 + 20, txt.length > 10 ? 17 : 22, { fill: (o.blink ? '#d6ffe0' : '#6dff95'), stroke: false, align: 'right', font: 'ui' });
  if (o.dollars && txt.length < 11) A.text(ctx, '$$$', cx - sw / 2 + 8, sy0 + 20, 13, { fill: '#6dff95', stroke: false, align: 'left', font: 'ui' });
  // teclas
  for (let r = 0; r < 3; r++) for (let c = 0; c < 7; c++) {
    const kx = cx - 90 + c * 30, ky = top + 80 + r * 15 - (r === 2 ? -1 : 0);
    blob(ctx, kx, ky, 10, 6.5, (r * 7 + c) % 5 === 0 ? A.red : A.cream, { wob: .2, lw: 2.2, shade: false, points: 10, seed: r * 7 + c });
  }
  // cajón
  const dr = o.drawer || 0;
  box(ctx, cx - 120, bt - 32, 240, 26, BRASS_D, 4, 5);
  if (dr > .02) {
    ctx.fillStyle = '#2b1d12'; rr(ctx, cx - 120, bt - 32, 240, 26, 5); ctx.fill();
    box(ctx, cx - 120 - 70 * dr, bt - 24, 130 + 70 * dr, 24 + 8 * dr, BRASS_L, 4, 4);
    for (let i = 0; i < 5; i++) box(ctx, cx - 112 - 60 * dr + i * 34, bt - 30 + 2 * dr, 28, 18, BILL, 2.5, 2);
  } else box(ctx, cx - 18, bt - 24, 36, 8, BRASS_L, 3, 4);
  // impresora de recibos
  if (o.print > 0) {
    const pr = o.print;
    box(ctx, cx + w / 2 - 80, top - 18, 56, 14, '#4b4540', 3, 3);
    ctx.save(); ctx.strokeStyle = A.ink; ctx.lineWidth = 3.5; ctx.fillStyle = A.cream;
    ctx.beginPath(); ctx.moveTo(cx + w / 2 - 74, top - 16);
    ctx.bezierCurveTo(cx + w / 2 - 74, top - 16 - 120 * pr, cx + w / 2 - 20 + Math.sin(o.t * 6) * 8, top - 70 - 80 * pr, cx + w / 2 - 14, top - 16 - 56 * pr);
    ctx.lineTo(cx + w / 2 - 38, top - 16 - 54 * pr); ctx.bezierCurveTo(cx + w / 2 - 44, top - 60 * pr - 70, cx + w / 2 - 50, top - 100 * pr - 10, cx + w / 2 - 50, top - 16); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

/* ============================ el jefe ============================ */
class Gaston extends MG.Boss {
  constructor(arena, opts) {
    super(arena, { hp: 1350, phases: [.66, .33], difficulty: opts.difficulty, x: 945, y: FLOOR });
    Object.assign(this, { pose: 'idle', poseT: 0, sq: 0, sqv: 0, ox: 0, oy: 0, cash: 9990, veh: 0, wheel: 0, drawer: 0, print: 0, warn: 0,
      last: '', introT: 0, deadT: 0, transT: 0, crack: 0, broken: false, cartX: 945, cartMode: 'rest', cartV: 0, cartTilt: 0, wheelC: 0,
      armL: { x: -150, y: 100 }, armR: { x: 150, y: 80 }, hold: null, mouth: 0, hatLift: 0, slotT: 2, sweat: [], dmgWob: 0, shards: [], coinShow: false });
    this.state = 'intro';
  }
  get W_() { return Math.max(.5, .64 - (this.difficulty - 1) * .25); }     // aviso (anticipación) ≥ 0,5 s
  kick(v) { this.sqv += v; }
  takeDamage(n) { super.takeDamage(n); if (n > 0 && !this.dead && this.state === 'fight') this.sqv += 1.1; }

  /* ---------- ciclo de vida ---------- */
  introUpdate(dt) {
    this.introT += dt; this.t += dt; this.poseT += dt;
    this.spring(dt); this.layout();
    if (this.introT > 1.3 && !this.said) { this.said = true; this.pose = 'tag'; this.poseT = 0; this.kick(5); sfx('coin'); }
  }
  start() { this.state = 'fight'; this.pose = 'idle'; this.after(.5, () => this.pick()); }
  pick() {
    if (this.dead || this.state !== 'fight') return;
    const list = [null, ['coins', 'card', 'tags'], ['bills', 'receipts', 'card', 'tags'], ['ram', 'rain', 'ram', 'rain']][this.phase];
    let a, n = 0; do { a = pick(list); } while (a === this.last && n++ < 8); this.last = a; this['atk_' + a]();
  }
  rest(s) { this.pose = 'idle'; this.poseT = 0; this.hold = null; this.after((s || 1.2) / Math.sqrt(this.difficulty), () => this.pick()); }
  spring(dt) { this.sqv += (-this.sq * 230 - this.sqv * 11) * dt; this.sq += this.sqv * dt; }

  onPhase(n) {
    this.clearTimers(); this.state = 'trans'; this.transT = 0; this.pose = 'idle'; this.poseT = 0; this.warn = 0; this.hold = null; this.cartMode = 'rest';
    this.arena.enemyProj.forEach(p => { if (!p.pink) { p.dead = true; this.puff(p.x, p.y, 1); } });
    this.kick(n === 2 ? 7 : 9); this.drawer = 0; this.print = 0;
    if (n === 3) {
      this.after(.55, () => {                                         // se rompe la alcancía
        this.broken = true; this.cartX = 945; this.kick(8); MG.fx.shake(14, .4); sfx('phase');
        for (let i = 0; i < 16; i++) this.shards.push({ x: this.x + rand(-90, 90), y: 380 + rand(-60, 60), vx: rand(-360, 360), vy: rand(-950, -300), r: rand(18, 40), rot: rand(0, 6), vr: rand(-9, 9), c: i % 4 === 0 ? BRASS : PEACH, k: randi4(), rest: false });
        for (let i = 0; i < 14; i++) this.coinPop(this.x + rand(-60, 60), 380, rand(-360, 360), rand(-900, -400));
        this.puff(this.x, 400, 8);
      });
    }
    this.after(n === 3 ? 1.5 : 1.15, () => { this.state = 'fight'; this.pick(); });
  }
  onDeath() {
    this.state = 'dead'; this.deadT = 0; this.clearTimers(); this.cartMode = 'rest'; this.cartX = 945; this.mouth = 1;
    for (let i = 0; i < 90; i++) this.after(i * .03, () => this.coinPop(rand(200, 1240), -30, rand(-60, 60), rand(100, 400), true));
    sfx('coin');
  }

  /* ---------- efectos reutilizables ---------- */
  puff(x, y, n) {
    for (let i = 0; i < (n || 3); i++) {
      const a = rand(0, TAU), sp = rand(40, 160), r = rand(14, 30);
      this.fx({ t: 0, dur: rand(.35, .6), x: x + rand(-12, 12), y: y + rand(-12, 12), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 30, update(dt) { this.t += dt; this.x += this.vx * dt; this.y += this.vy * dt; return this.t < this.dur; },
        draw(ctx) { const k = this.t / this.dur; A.puff(ctx, this.x, this.y, r * (.6 + k * .8), 1 - k); } });
    }
  }
  coinPop(x, y, vx, vy, shower) {
    const self = this, floor = FLOOR - rand(0, 30);
    this.fx({ t: 0, x, y, vx, vy, rot: rand(0, 6), life: shower ? 2.8 : 1.6, sparkle: 0,
      update(dt) { this.t += dt; this.vy += 1500 * dt; this.x += this.vx * dt; this.y += this.vy * dt; this.rot += dt * 9;
        if (this.y > floor && this.vy > 0) { this.y = floor; this.vy *= -.5; this.vx *= .7; if (Math.abs(this.vy) < 120) this.vy = 0; }
        return this.t < this.life; },
      draw(ctx) { const fade = clamp((this.life - this.t) / .5, 0, 1); ctx.save(); ctx.globalAlpha = fade; drawCoin(ctx, this.x, this.y, 17, this.rot, false);
        if (shower && ((this.t * 10 + this.rot) % 1.6) < .5) A.star(ctx, this.x + 12, this.y - 12, 7, A.cream, this.rot); ctx.restore(); } });
  }

  /* ---------- ataques ---------- */
  armTo(l, r) { if (l) this.armLt = l; if (r) this.armRt = r; }
  atk_coins() {
    const W_ = this.W_, d = this.difficulty;
    this.pose = 'coin'; this.poseT = 0; this.warn = W_; this.kick(-3); this.hold = 'coin';
    this.after(W_, () => {
      this.kick(5); sfx('coin'); this.hold = null; this.pose = 'throw'; this.poseT = 0;
      const n = d > 1.2 ? 4 : 3, px = this.arena.player ? this.arena.player.x : 250, goldIdx = randi4() % n;
      for (let i = 0; i < n; i++) this.after(i * .27, () => {
        const T = .95 + i * .05, x0 = this.x - 160 + this.ox, y0 = 330, tx = clamp(px + (i - 1) * 130 + rand(-40, 40), 100, 760);
        const g = 1500, vy = (FLOOR - 20 - y0) / T - g * T / 2;
        this.spawn({ x: x0, y: y0, vx: (tx - x0) / T, vy, grav: g, bounce: .74, r: 20, pink: i === goldIdx, spin: 7, life: 8,
          onDraw(ctx) { drawCoin(ctx, this.x, this.y, this.r + 2, this.t * 8, this.pink); } });
      });
      this.after(n * .27 + .55, () => this.rest(1.1));
    });
  }
  atk_card() {
    const W_ = this.W_, d = this.difficulty;
    this.pose = 'card'; this.poseT = 0; this.warn = W_; this.kick(-3); this.hold = 'card';
    this.after(W_, () => {
      this.hold = null; this.kick(5); sfx('hit'); this.pose = 'throw'; this.poseT = 0;
      const p0 = this.arena.player, shots = d > 1.25 ? 2 : 1;
      for (let s = 0; s < shots; s++) this.after(s * .9, () => {
        const px = p0 ? p0.x : 300, tx = clamp(px - 60, 130, 640), self = this;
        this.spawn({ x: this.x - 170 + this.ox, y: 520, r: 31, vx: -820, vy: 0, life: 8, mode: 'out', wait: 0, tx,
          onUpdate(dt) {
            if (this.mode === 'out') { this.vx = Math.min(-120, this.vx + 330 * dt * (this.x < this.tx + 280 ? 1.2 : 0)); if (this.x <= this.tx) { this.mode = 'hold'; this.vx = 0; } }
            else if (this.mode === 'hold') { this.wait += dt; this.y = 520 + Math.sin(this.wait * 22) * 4; if (this.wait > .28) this.mode = 'back'; }
            else { this.vx += 1500 * dt; if (this.vx > 900) this.vx = 900; if (this.x > self.x - 150 + self.ox) { this.dead = true; self.puff(this.x, this.y, 3); self.kick(3); } }
          },
          onDraw(ctx) { drawCard(ctx, this.x, this.y, this.t); } });
      });
      this.after(shots * .9 + 1.6, () => this.rest(.9));
    });
  }
  atk_tags() {
    const W_ = this.W_ + .2, d = this.difficulty, p = this.arena.player;
    this.pose = 'tag'; this.poseT = 0; this.warn = W_; this.kick(-4); this.hatLift = 1;
    const cols = [0, 1, 2, 3, 4, 5, 6].map(c => 110 + c * 105);
    const pc = p ? clamp(Math.round((p.x - 110) / 105), 0, 6) : 1;
    const set = new Set([pc]); const n = d > 1.15 ? 4 : 3;
    while (set.size < n) set.add(randi4() % 7);
    const xs = [...set].map(c => cols[c]).sort(() => Math.random() - .5);
    xs.forEach((x, i) => {
      this.spawn({ x, y: 40, r: 1, harmless: true, life: W_ + .1 + i * .12, vx: 0, vy: 0,
        onDraw(ctx) { const k = this.t / (W_ + i * .12), a = clamp(k, 0, 1), blink = (Math.floor(this.t * 12) % 2) ? 1 : .55;
          ctx.save(); ctx.globalAlpha = blink * .9; ctx.fillStyle = 'rgba(216,67,46,.25)'; ctx.beginPath(); ctx.ellipse(this.x, FLOOR, 30 + a * 40, 8 + a * 8, 0, 0, TAU); ctx.fill();
          ctx.fillStyle = 'rgba(216,67,46,.18)'; ctx.fillRect(this.x - 4 - a * 10, 60, 8 + a * 20, FLOOR - 60);
          A.text(ctx, '!', this.x, 56, 46 + Math.sin(this.t * 20) * 5, { fill: A.red, lw: 8 }); ctx.restore(); } });
      this.after(W_ + i * .12, () => {
        this.spawn({ x, y: -50, r: 36, vx: 0, vy: 150, grav: 2600, life: 4, rot: 0, bounceNone: 1,
          onUpdate(dt, ar) { this.rot = Math.sin(this.t * 14) * .25; if (this.y > FLOOR - 36) { this.dead = true; MG.fx.shake(4, .12); } },
          onDraw(ctx) { drawTag(ctx, this.x, this.y, this.rot); } });
      });
    });
    this.after(W_ + n * .12 + .9, () => { this.hatLift = 0; this.rest(1); });
  }
  atk_bills() {
    const W_ = this.W_, d = this.difficulty;
    this.pose = 'drawer'; this.poseT = 0; this.warn = W_; this.kick(-3);
    this.after(W_, () => {
      sfx('coin'); this.kick(6); this.cash += randi4() * 7777; MG.fx.shake(5, .18);
      const slots = d > 1.2 ? 8 : 7, gap = randi4() % (slots - 2), free = d > 1.15 ? [gap] : [gap, gap + 1];
      const list = []; for (let k = 0; k < slots; k++) if (!free.includes(k)) list.push(k);
      const pinkK = pick(list), sx = this.x - 190 + this.ox, sy = 545;
      list.sort(() => Math.random() - .5).forEach((k, i) => this.after(i * .1, () => {
        const T = .9 + rand(0, .22), tx = 150 + k * (620 / (slots - 1)), g = 1100, y1 = FLOOR - 20;
        this.spawn({ x: sx, y: sy, vx: (tx - sx) / T, vy: (y1 - sy) / T - g * T / 2, grav: g, r: 19, pink: k === pinkK, spin: rand(-6, 6), life: T + .02, ph: rand(0, 6),
          onUpdate(dt) { if (this.t >= T) { this.dead = true; } },
          onDraw(ctx) { drawBill(ctx, this.x, this.y, this.rot + this.t * 3, this.pink); } });
        this.puff(sx, sy, 1);
      }));
      this.after(2.0, () => { this.drawerClose = true; this.rest(1.0); });
    });
  }
  atk_receipts() {
    const W_ = this.W_ + .15, d = this.difficulty;
    this.pose = 'print'; this.poseT = 0; this.warn = W_; this.kick(-3);
    const n = d > 1.15 ? 2 : 1;
    for (let r = 0; r < n; r++) this.after(W_ + r * .85, () => {
      sfx('hit'); this.kick(4); const self = this, x0 = this.x - 175 + this.ox;
      this.spawn({ x: x0, y: FLOOR - 34, r: 30, vx: -(540 + d * 60), vy: 0, pierce: true, life: 6, x0, trail: 0,
        onDraw(ctx) {
          const len = this.x0 - this.x; ctx.save();
          ctx.fillStyle = A.cream; ctx.strokeStyle = A.ink; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.moveTo(this.x, FLOOR - 4); for (let xx = this.x; xx < this.x0 - 10; xx += 22) ctx.lineTo(xx, FLOOR - 14 + A.j(xx, 1.5));
          ctx.lineTo(this.x0 - 10, FLOOR - 4); ctx.lineTo(this.x0 - 10, FLOOR + 8); ctx.lineTo(this.x, FLOOR + 8); ctx.closePath(); ctx.fill(); ctx.stroke();
          ctx.strokeStyle = 'rgba(40,30,20,.55)'; ctx.lineWidth = 2; ctx.setLineDash([5, 6]); ctx.beginPath(); ctx.moveTo(this.x + 24, FLOOR - 1); ctx.lineTo(this.x0 - 14, FLOOR - 1); ctx.stroke(); ctx.setLineDash([]);
          ctx.translate(this.x, this.y); ctx.rotate(-this.t * 9);
          blob(ctx, 0, 0, 33, 33, A.cream, { wob: .8, lw: 4.5, shade: false });
          ctx.strokeStyle = A.ink; ctx.lineWidth = 3; for (let k = 1; k < 4; k++) { ctx.beginPath(); ctx.arc(0, 0, k * 7.5, k * 1.3, k * 1.3 + 4.4); ctx.stroke(); }
          ctx.restore();
          if (len > 160) A.text(ctx, 'TOTAL', this.x + 80, FLOOR - 18, 14, { font: 'ui', fill: A.red, lw: 3 });
        } });
    });
    this.after(W_ + (n - 1) * .85 + 1.7, () => this.rest(.9));
  }
  atk_ram() {
    const W_ = this.W_ + .3, d = this.difficulty;
    this.pose = 'ramwind'; this.poseT = 0; this.warn = W_; this.cartMode = 'wind'; this.cartV = 0;
    this.after(W_, () => {
      this.cartMode = 'charge'; this.cartV = -(900 + d * 120); sfx('hit'); MG.fx.shake(5, .2);
    });
  }
  atk_rain() {
    const d = this.difficulty, dur = 3.4, step = .62 / Math.sqrt(d);
    this.pose = 'rain'; this.poseT = 0; this.warn = .6; this.hatLift = 1;
    const p = this.arena.player;
    for (let t = .55, i = 0; t < dur; t += step, i++) this.after(t, () => {
      const px = p ? p.x : 300, x = (i % 3 === 0) ? clamp(px + rand(-90, 90), 90, 780) : rand(90, 800), pink = i % 5 === 3;
      this.spawn({ x, y: -60, r: 32, vx: 0, vy: 470, grav: 380, pink, life: 4, spin: 0, rot: 0,
        onUpdate(dt) { this.rot = Math.sin(this.t * 6 + x) * .25; if (this.y > FLOOR - 34) this.dead = true; },
        onDraw(ctx) {
          const k = clamp(1 - (FLOOR - this.y) / 700, 0, 1);
          ctx.save(); ctx.fillStyle = 'rgba(40,20,5,.3)'; ctx.beginPath(); ctx.ellipse(this.x, FLOOR + 2, 14 + k * 34, 4 + k * 8, 0, 0, TAU); ctx.fill(); ctx.restore();
          drawBag(ctx, this.x, this.y, this.rot, this.pink); } });
    });
    this.after(dur + 1.2, () => { this.hatLift = 0; this.rest(.7); });
  }

  /* ---------- actualización ---------- */
  update(dt) {
    this.baseUpdate(dt); this.poseT += dt; this.spring(dt);
    if (this.warn > 0) this.warn -= dt;
    const T = this.t, ph = this.phase;
    this.veh = lerp(this.veh, ph >= 2 && !this.broken ? 1 : 0, 1 - Math.exp(-dt * 5));
    if (this.state === 'trans') this.transT += dt;
    if (this.state === 'dead') this.deadT += dt;
    // vehículo: se mece y las ruedas giran
    this.ox = ph === 2 && this.state !== 'dead' ? Math.sin(T * 1.3) * 26 + (this.pose === 'drawer' || this.pose === 'print' ? 22 * clamp(this.poseT * 3, 0, 1) : 0) : 0;
    this.wheel += dt * (ph === 2 ? Math.cos(T * 1.3) * 20 : 0);
    const dTarget = this.pose === 'drawer' && this.poseT > .1 && !this.drawerClose ? 1 : 0; if (this.pose !== 'drawer') this.drawerClose = false;
    this.drawer = lerp(this.drawer, dTarget, 1 - Math.exp(-dt * 12));
    this.print = lerp(this.print, this.pose === 'print' ? clamp(this.poseT / .6, 0, 1) : 0, 1 - Math.exp(-dt * 8));
    if (this.pose === 'print' && this.poseT < .02) this.cash += 123456;
    this.cashSh = this.cashSh == null ? this.cash : this.cashSh; this.cashSh = lerp(this.cashSh, this.cash, 1 - Math.exp(-dt * 6));
    if (ph === 2 && !this.dead) this.cash += dt * 4200;
    this.hatFall = lerp(this.hatFall || 0, this.hatLift, 1 - Math.exp(-dt * 9));
    // carro de supermercado
    if (ph >= 3) this.updateCart(dt);
    for (const s of this.shards) if (!s.rest) {
      s.vy += 1800 * dt; s.x += s.vx * dt; s.y += s.vy * dt; s.rot += s.vr * dt;
      if (s.y > FLOOR - s.r * .4) { s.y = FLOOR - s.r * .4; s.vy *= -.35; s.vx *= .6; s.vr *= .5; if (Math.abs(s.vy) < 90) { s.rest = true; s.vy = 0; } }
    }
    // gotas de sudor (fase 3) / lágrimas (muerte)
    if (this.broken && this.cartMode !== 'gone' && Math.random() < dt * (this.state === 'dead' ? 30 : 6)) {
      const dead = this.state === 'dead';
      this.sweat.push({ x: this.cartX - 40 + rand(-10, 20), y: 410, vx: dead ? rand(-260, -60) * (Math.random() < .5 ? 1 : -.4) : rand(-80, 40), vy: dead ? rand(-380, -120) : rand(-260, -120), life: 0 });
    }
    for (const s of this.sweat) { s.life += dt; s.vy += 1400 * dt; s.x += s.vx * dt; s.y += s.vy * dt; }
    this.sweat = this.sweat.filter(s => s.life < 1.2 && s.y < FLOOR);
    // ranura: moneda cayendo
    this.slotT -= dt; if (this.slotT < -.5) this.slotT = 3.2 + rand(0, 2);
    this.layout();
  }
  updateCart(dt) {
    const home = 945;
    if (this.cartMode === 'wind') {
      this.cartX = home + Math.min(70, this.poseT * 150) + Math.sin(this.poseT * 50) * 3; this.cartTilt = lerp(this.cartTilt, -.18, 1 - Math.exp(-dt * 10));
    } else if (this.cartMode === 'charge') {
      this.cartX += this.cartV * dt; this.cartTilt = lerp(this.cartTilt, .07, 1 - Math.exp(-dt * 10));
      if (this.cartX < -300) {
        this.cartMode = 'gone'; this.cartTilt = 0;
        this.spawn({ x: 60, y: FLOOR - 70, r: 1, harmless: true, life: 1.05, vx: 0, vy: 0,
          onDraw(ctx) { const b = (Math.floor(this.t * 14) % 2) ? 1 : .4; ctx.save(); ctx.globalAlpha = b; A.text(ctx, '!', 60, this.y, 70, { fill: A.red, lw: 10 });
            ctx.fillStyle = A.red; poly(ctx, [[96, this.y - 24], [140, this.y], [96, this.y + 24]], A.red, 4); ctx.restore(); } });
        this.after(1.05, () => { this.cartMode = 'return'; this.cartX = -300; sfx('hit'); });
      }
    } else if (this.cartMode === 'return') {
      this.cartX += (620 + this.difficulty * 80) * dt; this.cartTilt = lerp(this.cartTilt, .05, 1 - Math.exp(-dt * 8));
      if (this.cartX >= home) { this.cartX = home; this.cartMode = 'rest'; this.kick(7); this.puff(home - 100, FLOOR - 10, 4); MG.fx.shake(6, .2); this.after(.5, () => this.rest(.6)); }
    } else {
      this.cartX = lerp(this.cartX, home, 1 - Math.exp(-dt * 8)); this.cartTilt = lerp(this.cartTilt, 0, 1 - Math.exp(-dt * 8));
    }
    this.wheelC += (this.cartMode === 'charge' ? this.cartV : this.cartMode === 'return' ? 620 : 0) * dt * .045;
  }
  layout() {
    const ph = this.phase, x = this.x + this.ox, s = this.sq;
    this.hurtboxes = []; this.hitboxes = [];
    if (this.state === 'dead' || this.state === 'intro' && false) return;
    if (this.broken || ph >= 3 && this.state !== 'trans') {
      if (this.cartMode === 'gone') return;
      const cx = this.cartX, y = 400 - s * 40;
      this.hurtboxes.push({ x: cx - 24, y: y, r: 72 }, { x: cx - 12, y: 490, r: 68 }, { x: cx - 12, y: 560, r: 64 }, { x: cx + 80, y: 560, r: 46 });
      this.hitboxes.push({ x: cx - 140, y: 510, w: 280, h: 108 });
    } else if (ph === 1 || this.state === 'trans' && ph === 2 && this.transT < .2) {
      const cy = 372 - s * 30;
      this.hurtboxes.push({ x: x - 34, y: cy, r: 142 }, { x: x + 90, y: cy + 15, r: 105 }, { x: x - 50, y: 540, r: 70 }, { x: x + 60, y: 545, r: 60 }, { x: x - 130, y: 560, r: 45 });
      this.hitboxes.push({ x: x - 10, y: 420, r: 90 });
    } else {
      const cy = 329 - s * 30;
      this.hurtboxes.push({ x: x - 34, y: cy, r: 142 }, { x: x + 90, y: cy + 15, r: 105 }, { x: x - 80, y: 520, r: 70 }, { x: x + 70, y: 520, r: 74 }, { x: x - 170, y: 565, r: 42 });
      this.hitboxes.push({ x: x - 10, y: 400, r: 85 }, { x: x - 170, y: 455, w: 340, h: 150 });
    }
  }

  /* ---------- dibujo del jefe ---------- */
  draw(ctx, t) {
    const ph = this.phase, intro = this.state === 'intro';
    // sombra
    if (!(this.cartMode === 'gone')) A.shadow(ctx, (ph >= 3 && this.broken ? this.cartX : this.x + this.ox) - 10, FLOOR + 6, ph >= 3 && this.broken ? 130 : 190);
    let ik = 1;
    if (intro) ik = MG.ease.outElastic(clamp(this.introT / 1.1, 0, 1));
    for (const s of this.shards) this.drawShard(ctx, s);
    ctx.save();
    if (intro) { ctx.translate(this.x, FLOOR); ctx.scale(ik, ik); ctx.translate(-this.x, -FLOOR); }
    if (this.broken) this.drawCartPig(ctx);
    else this.drawFat(ctx);
    ctx.restore();
    // sudor / lágrimas
    ctx.save(); ctx.fillStyle = '#7fc4e6'; ctx.strokeStyle = A.ink; ctx.lineWidth = 2.5;
    for (const s of this.sweat) { ctx.beginPath(); ctx.ellipse(s.x, s.y, 5, 8, Math.atan2(s.vx, -s.vy) * -1, 0, TAU); ctx.fill(); ctx.stroke(); }
    ctx.restore();
    // aviso "!"
    if (this.warn > 0 && this.state === 'fight') {
      const k = this.warn, bx = (this.broken ? this.cartX : this.x + this.ox) - 20, by = (this.broken ? 235 : 130) + Math.sin(t * 30) * 3;
      ctx.save(); ctx.translate(bx, by); const sc = 1 + Math.sin(t * 24) * .08; ctx.scale(sc, sc);
      blob(ctx, 0, 0, 24, 28, A.red, { wob: .8, lw: 4, shade: false }); A.text(ctx, '!', 0, 1, 40, { fill: A.cream, lw: 6 }); ctx.restore();
    }
    if (this.state === 'dead') this.drawDeathExtras(ctx);
  }
  armTargets() {
    const p = this.pose, T = this.poseT, sin = Math.sin(this.t * 3);
    let L = { x: -150, y: 100 + sin * 4 }, R = { x: 150, y: 82 - sin * 4 };
    if (p === 'coin') { R = { x: 195, y: -125 + Math.sin(this.t * 30) * 3 }; L = { x: -170, y: 20 }; }
    else if (p === 'throw') { R = { x: -125, y: -158 }; L = { x: -160, y: 60 }; }
    else if (p === 'card') { R = { x: -40, y: 60 + (T > .25 ? -90 : 0) }; L = { x: -150, y: -50 }; if (T > .3) R = { x: -172, y: -100 }; }
    else if (p === 'tag') { L = { x: -135, y: -190 }; R = { x: 140, y: -190 }; }
    else if (p === 'drawer') { L = { x: -215, y: 30 }; R = { x: 215, y: 30 }; }
    else if (p === 'print') { L = { x: -210, y: 70 }; R = { x: 160, y: -20 + Math.sin(this.t * 40) * 8 }; }
    else if (p === 'rain') { L = { x: -135, y: -190 }; R = { x: 140, y: -190 }; }
    return { L, R };
  }
  drawFat(ctx) {
    const ph = this.phase, x = this.x + this.ox, T = this.t, veh = this.veh;
    const trans = this.state === 'trans' && ph === 2;
    const top = lerp(495, 452, veh), feet = top;
    const screen = ph >= 2 ? money(this.cashSh) : '$ 9.990', blink = Math.floor(T * 6) % 2;
    // humo de monedas del escape (vehículo)
    if (veh > .5) for (let i = 0; i < 4; i++) { const k = ((T * .8 + i / 4) % 1); A.puff(ctx, x + 150 + k * 60, top - 50 - k * 110, 8 + k * 14, (1 - k) * .8); drawCoin(ctx, x + 158 + k * 70 + Math.sin(i) * 10, top - 70 - k * 120, 8, T * 9 + i, false); }
    drawRegister(ctx, x, top, { veh, wheel: this.wheel, screen, blink, dollars: ph >= 2 && this.pose !== 'idle', drawer: this.drawer, print: this.print, t: T });
    // el chancho
    const sq = this.sq, br = Math.sin(T * 3) * .012;
    const sx = 1 + sq * 1 + br, sy = 1 - sq * .9 - br;
    const pcY = feet - 110, lerpL = 1 - Math.exp(-.2), tg = this.armTargets();
    this.armL.x = lerp(this.armL.x, tg.L.x, .22); this.armL.y = lerp(this.armL.y, tg.L.y, .22); this.armR.x = lerp(this.armR.x, tg.R.x, .22); this.armR.y = lerp(this.armR.y, tg.R.y, .22);
    if (this.pose === 'throw' && this.poseT < .05) { this.armR.x = tg.R.x; }
    ctx.save(); ctx.translate(x, feet); ctx.scale(sx * K, sy * K); ctx.translate(0, -110);
    const rot = (this.pose === 'coin' || this.pose === 'card') ? .06 : Math.sin(T * 1.7) * .02 + (ph === 2 ? -.03 : 0);
    ctx.rotate(rot);
    const p = this.arena.player, lookX = p ? clamp((p.x - x) / 400, -1, 1) : -1, lookY = p ? clamp((p.y - 60 - pcY) / 300, -1, 1) : 0;
    const angry = ph >= 2 || this.pose === 'coin' || this.pose === 'card';
    // cola y faldones
    ctx.lineWidth = 6; ctx.strokeStyle = A.ink; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(158, 10); ctx.bezierCurveTo(205, -20 + Math.sin(T * 5) * 6, 210, 40, 178, 38); ctx.bezierCurveTo(168, 36, 178, 22, 188, 26); ctx.stroke();
    ctx.strokeStyle = PEACH_D; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(158, 10); ctx.bezierCurveTo(205, -20 + Math.sin(T * 5) * 6, 210, 40, 178, 38); ctx.bezierCurveTo(168, 36, 178, 22, 188, 26); ctx.stroke();
    poly(ctx, [[40, 60], [190, 78 + A.j(1, 2)], [130, 150], [20, 128]], '#26201d', 5);
    // orejas (detrás de la cabeza)
    blob(ctx, -118, -104, 30, 40, PEACH_D, { wob: 1, lw: 4.5, rot: -.7 + Math.sin(T * 2.4) * .06, seed: 3 });
    blob(ctx, 18, -118, 30, 40, PEACH_D, { wob: 1, lw: 4.5, rot: .55 - Math.sin(T * 2.4) * .06, seed: 4 });
    // cuerpo
    blob(ctx, 0, 0, 165, 128, PEACH, { wob: 2.2, lw: 5.5, points: 26 });
    blob(ctx, -22, 50, 112, 66, PEACH_L, { wob: 1.5, line: false, shade: false, points: 20, seed: 11 });
    if (this.state === 'trans' && ph === 3 && !this.broken) {            // grietas antes de reventar
      const ck = clamp(this.transT / .55, 0, 1); ctx.strokeStyle = A.ink; ctx.lineWidth = 4; ctx.lineJoin = 'miter'; ctx.beginPath();
      const pts = [[-20, -126], [-5, -80], [-40, -50], [-10, -10], [-60, 30], [-30, 70], [-70, 120]]; const n = Math.ceil(pts.length * ck);
      for (let i = 0; i < n; i++) ctx[i ? 'lineTo' : 'moveTo'](pts[i][0], pts[i][1]);
      const pts2 = [[90, -100], [60, -50], [100, -10], [70, 40], [110, 90]]; for (let i = 0; i < Math.ceil(pts2.length * ck); i++) ctx[i ? 'lineTo' : 'moveTo'](pts2[i][0], pts2[i][1]);
      ctx.stroke();
    }
    // ranura en el lomo
    ctx.save(); ctx.translate(82, -102); ctx.rotate(.38);
    blob(ctx, 0, 0, 30, 8, '#2b1d12', { wob: .4, lw: 3.5, shade: false });
    if (this.slotT > 0 && this.slotT < 1.1) { const k = 1 - this.slotT / 1.1; drawCoin(ctx, 0, -52 + k * 52, 15, 0.2 + Math.PI / 2 * 0, false); }
    ctx.restore();
    // camisa, chaleco y corbatín
    ctx.save(); ctx.beginPath(); ctx.ellipse(0, 0, 160, 123, 0, 0, TAU); ctx.clip();
    blob(ctx, -28, 98, 74, 56, A.cream, { wob: 1, lw: 4, shade: false, seed: 5 });
    poly(ctx, [[-102, 52], [-30, 128], [-100, 150], [-135, 100]], '#26201d', 4); poly(ctx, [[48, 52], [-26, 128], [34, 150], [76, 100]], '#26201d', 4);
    ctx.restore();
    for (let k = 0; k < 3; k++) blob(ctx, -30, 82 + k * 20, 5, 5, BRASS_L, { wob: .2, lw: 2, shade: false });
    ctx.strokeStyle = A.ink; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(-84, 74); ctx.quadraticCurveTo(-35, 126, 18, 74); ctx.stroke(); ctx.strokeStyle = BRASS_L; ctx.lineWidth = 3; ctx.stroke();
    blob(ctx, -34, 112, 11, 11, BRASS, { wob: .3, lw: 3, shade: false });
    // bigote y cara
    const fx = -66;
    blob(ctx, fx - 70, 6, 22, 16, '#ec9a8d', { wob: 1, line: false, shade: false, seed: 9 }); blob(ctx, fx + 66, 6, 22, 16, '#ec9a8d', { wob: 1, line: false, shade: false, seed: 10 });
    blob(ctx, fx, 8, 58, 40, PEACH_D, { wob: 1.4, lw: 4.5, seed: 6 });
    blob(ctx, fx - 22, 8, 7, 12, '#4a2418', { wob: .4, lw: 2.5, shade: false }); blob(ctx, fx + 22, 8, 7, 12, '#4a2418', { wob: .4, lw: 2.5, shade: false });
    // boca
    const op = this.mouth || (this.flash > 0 ? .8 : (this.pose === 'throw' || this.pose === 'drawer' ? .6 : 0));
    ctx.save(); ctx.lineWidth = 4.5; ctx.strokeStyle = A.ink; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(fx - 78, 52); ctx.quadraticCurveTo(fx, 78 + op * 30 + Math.sin(T * 4) * 2, fx + 74, 52);
    if (op > .1) { ctx.fillStyle = '#7a2b22'; ctx.fill(); } ctx.stroke(); ctx.restore();
    drawMustache(ctx, fx, 0, 1, Math.sin(T * 4) * 1.5);
    // ojos con monóculo
    const ey = -52;
    A.eyes(ctx, fx, ey, 28, lookX, lookY, angry ? 'angry' : '');
    ctx.strokeStyle = A.ink; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(fx - 17.5, ey, 24, 0, TAU); ctx.stroke(); ctx.strokeStyle = BRASS_L; ctx.lineWidth = 4; ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(fx - 17.5, ey, 17, Math.PI * 1.1, Math.PI * 1.45); ctx.stroke();
    ctx.strokeStyle = A.ink; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(fx - 32, ey + 18); ctx.quadraticCurveTo(fx - 80, ey + 70, fx - 40, 76); ctx.stroke();
    // sombrero de copa
    const hl = (this.hatFall || 0) * 34 + Math.max(0, Math.sin(T * 3 + 1)) * 4 + (this.state === 'intro' ? Math.max(0, 1.3 - this.introT) * 0 : 0);
    drawHat(ctx, fx + 24, -118 - hl, -.12 + Math.sin(T * 2.2) * .03 + (this.hatFall || 0) * .25, 1);
    // pies
    for (const [fx2, fy] of [[-105, 112], [36, 118]]) { blob(ctx, fx2, fy, 38, 20, '#26201d', { wob: .6, lw: 4, shade: false }); blob(ctx, fx2 - 8, fy - 6, 24, 9, A.cream, { wob: .4, lw: 2.5, shade: false }); }
    // brazos
    const shL = { x: -128, y: 40 }, shR = { x: 108, y: 20 };
    A.hose(ctx, shL.x, shL.y, this.armL.x, this.armL.y, 44, 17, A.cream); A.hose(ctx, shR.x, shR.y, this.armR.x, this.armR.y, -44, 17, A.cream);
    A.glove(ctx, this.armL.x, this.armL.y, 20, Math.atan2(this.armL.y - shL.y, this.armL.x - shL.x));
    A.glove(ctx, this.armR.x, this.armR.y, 20, Math.atan2(this.armR.y - shR.y, this.armR.x - shR.x));
    if (this.hold === 'coin') drawCoin(ctx, this.armR.x + 4, this.armR.y - 20, 22, T * 6, false);
    if (this.hold === 'card') { ctx.save(); ctx.translate(this.armR.x - 10, this.armR.y - 12); ctx.scale(.8, .8); drawCard(ctx, 0, 0, 0); ctx.restore(); }
    if (this.flash > 0) { ctx.globalAlpha = .3; blob(ctx, 0, 0, 165, 128, '#fff', { wob: 0, line: false, shade: false, points: 26 }); ctx.globalAlpha = 1; }
    ctx.restore();
  }
  drawShard(ctx, s) {
    ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.rot);
    const r = s.r; poly(ctx, [[-r, -r * .4], [-r * .2, -r], [r, -r * .5], [r * .7, r * .6], [-r * .5, r * .8]], s.c, 4);
    ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-r * .6, -r * .3); ctx.lineTo(-r * .1, -r * .7); ctx.stroke();
    ctx.restore();
  }
  drawCartPig(ctx) {
    const cx = this.cartX, T = this.t, dead = this.state === 'dead', gone = this.cartMode === 'gone';
    if (gone) return;
    const fast = this.cartMode === 'charge' || this.cartMode === 'return';
    const jit = fast ? Math.sin(T * 60) * 2.5 : Math.sin(T * 9) * (dead ? 1.5 : 2.2);
    const sq = this.sq, wob = Math.sin(T * 14) * (dead ? 2 : 1.2);
    // líneas de velocidad
    if (fast) { ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 5; ctx.lineCap = 'round'; const dir = this.cartMode === 'charge' ? 1 : -1;
      for (let i = 0; i < 6; i++) { const yy = 440 + i * 30 + A.j(i, 4), xx = cx + dir * (150 + (i * 53) % 90); ctx.beginPath(); ctx.moveTo(xx, yy); ctx.lineTo(xx + dir * 90, yy); ctx.stroke(); } ctx.restore(); }
    ctx.save(); ctx.translate(cx, FLOOR); ctx.rotate(this.cartTilt); ctx.scale(KC * (1 + sq * .6), KC * (1 - sq * .5)); ctx.translate(0, -FLOOR);
    ctx.translate(0, jit * .4);
    // chancho flaco de pie dentro del carro
    const flipX = this.cartMode === 'return' ? 1 : 1;
    const lean = fast ? -12 : 0, py = 452;
    // faldones rotos
    poly(ctx, [[-4, 470], [60, 520], [20, 560], [-24, 520]], '#26201d', 4);
    blob(ctx, -22 + lean, py, 60, 88, PEACH_L, { wob: 2, lw: 5, points: 22, seed: 2 });
    // arrugas del hambre
    ctx.strokeStyle = 'rgba(120,60,40,.5)'; ctx.lineWidth = 2.5; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-60 + lean, py + 20 + i * 14); ctx.quadraticCurveTo(-32 + lean, py + 28 + i * 14, -6 + lean, py + 20 + i * 14); ctx.stroke(); }
    // orejas
    blob(ctx, -62 + lean, py - 74, 18, 34, PEACH_D, { wob: 1, lw: 4, rot: -.5 + Math.sin(T * 8) * .08, seed: 3 }); blob(ctx, 14 + lean, py - 80, 18, 34, PEACH_D, { wob: 1, lw: 4, rot: .4 - Math.sin(T * 8) * .08, seed: 4 });
    // saco del chaleco medio roto
    poly(ctx, [[-70 + lean, py + 8], [-30 + lean, py + 80], [-80 + lean, py + 84]], '#26201d', 4);
    const fx = -26 + lean;
    blob(ctx, fx - 4, py - 6, 42, 28, PEACH_D, { wob: 1.2, lw: 4, seed: 6 });
    blob(ctx, fx - 18, py - 6, 5, 9, '#4a2418', { wob: .3, lw: 2, shade: false }); blob(ctx, fx + 10, py - 6, 5, 9, '#4a2418', { wob: .3, lw: 2, shade: false });
    drawMustache(ctx, fx - 4, py - 22, .55, 10 + Math.sin(T * 6) * 1.5);
    // ojos desesperados
    const p = this.arena.player, lookX = p ? clamp((p.x - cx) / 400, -1, 1) : -1;
    A.eyes(ctx, fx - 2, py - 52, 22 + (dead ? 0 : Math.sin(T * 20) * .8), dead ? 0 : lookX, dead ? 1 : 0, '');
    ctx.strokeStyle = A.ink; ctx.lineWidth = 5; ctx.lineCap = 'round';
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(fx - 2 + s * 24, py - 82 + (dead ? 8 : 0)); ctx.lineTo(fx - 2 + s * 4, py - 78 - (dead ? 10 : -4)); ctx.stroke(); }
    // boca: gritando o llorando
    const open = dead ? .9 + Math.sin(T * 12) * .1 : .6 + Math.abs(Math.sin(T * 3)) * .4;
    ctx.fillStyle = '#7a2b22'; ctx.beginPath(); ctx.ellipse(fx - 2, py + 22, 16, 8 + open * 10, 0, 0, TAU); ctx.fill(); ctx.stroke();
    // sombrero abollado
    ctx.save(); ctx.translate(fx + 22, py - 98); ctx.rotate(.45 + Math.sin(T * 7) * (dead ? .03 : .06)); ctx.scale(.62, .62);
    box(ctx, -38, -76, 76, 76, '#26201d', 6, 6); ctx.strokeStyle = A.cream; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-14, -72); ctx.lineTo(0, -52); ctx.lineTo(-8, -38); ctx.stroke();
    blob(ctx, 0, 0, 62, 14, '#26201d', { wob: .5, lw: 5, shade: false }); ctx.restore();
    // bolsillos vacíos al revés al morir
    if (dead) for (const s of [-1, 1]) { ctx.save(); ctx.translate(fx + s * 54, py + 38); ctx.rotate(s * .45); box(ctx, -15, 0, 30, 44, A.cream, 3.5, 6); ctx.restore(); }
    // el carro de supermercado
    const cartCol = '#b9c6c9';
    for (const wx of [-86, 84]) { blob(ctx, wx, 600, 21, 21, '#2a2320', { wob: .4, lw: 3.5, shade: false }); blob(ctx, wx, 600, 9, 9, A.cream, { wob: .2, lw: 2.5, shade: false }); const a = this.wheelC; ctx.strokeStyle = A.ink; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(wx, 600); ctx.lineTo(wx + Math.cos(a) * 9, 600 + Math.sin(a) * 9); ctx.stroke(); }
    ctx.strokeStyle = A.ink; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-70, 585); ctx.lineTo(-86, 598); ctx.moveTo(70, 585); ctx.lineTo(84, 598); ctx.stroke();
    // compras apiladas dentro del carro
    blob(ctx, -60, 520, 20, 16, '#c79a63', { wob: .8, lw: 3, shade: false }); box(ctx, -14, 498, 34, 40, '#a8483c', 3, 4); blob(ctx, 46, 516, 12, 24, '#6aa84f', { wob: .6, lw: 3, shade: false, rot: .2 }); box(ctx, 62, 510, 30, 28, BRASS_L, 3, 3);
    poly(ctx, [[-132, 515], [122, 515], [104, 598], [-104, 598]], 'rgba(200,215,218,.38)', 5);
    ctx.strokeStyle = A.ink; ctx.lineWidth = 2.5;
    for (let i = 1; i < 6; i++) { ctx.beginPath(); ctx.moveTo(-132 + i * 42 - i * 3, 515); ctx.lineTo(-104 + i * 41 - i * 3, 598); ctx.stroke(); }
    for (let i = 1; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-132 + i * 9, 515 + i * 28); ctx.lineTo(122 - i * 6, 515 + i * 28); ctx.stroke(); }
    ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(-134, 515); ctx.lineTo(124, 515); ctx.stroke(); ctx.strokeStyle = cartCol; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-134, 515); ctx.lineTo(124, 515); ctx.stroke();
    // manubrio
    ctx.strokeStyle = A.ink; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(116, 520); ctx.lineTo(150, 470); ctx.lineTo(176, 470); ctx.stroke(); ctx.strokeStyle = A.red; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(150, 470); ctx.lineTo(176, 470); ctx.stroke();
    // brazos agarrando el borde delantero
    const gx = -124, gy = 506 + (fast ? 0 : Math.sin(T * 9) * 3);
    A.hose(ctx, -50 + lean, py + 30, gx, gy, 14, 14, A.cream); A.hose(ctx, 6 + lean, py + 24, 108, 480, -14, 14, A.cream);
    A.glove(ctx, gx, gy, 17, 0); A.glove(ctx, 112, 476, 17, -.4);
    if (this.flash > 0) { ctx.globalAlpha = .3; blob(ctx, -22 + lean, py, 60, 88, '#fff', { wob: 0, line: false, shade: false }); ctx.globalAlpha = 1; }
    ctx.restore();
  }
  drawDeathExtras(ctx) {
    // un cartelito de "SALDO: $0"
    const k = clamp((this.deadT - .8) / .5, 0, 1); if (k <= 0) return;
    ctx.save(); ctx.translate(this.cartX - 250, 330); ctx.rotate(-.1 + Math.sin(this.t * 3) * .03); ctx.scale(MG.ease.outBack(k), MG.ease.outBack(k));
    box(ctx, -80, -26, 160, 52, A.cream, 5, 10); A.text(ctx, 'SALDO: $0', 0, 1, 26, { font: 'ui', fill: A.red, lw: 5 }); ctx.restore();
  }

  /* ---------- fondo ---------- */
  drawBackground(ctx, t) {
    if (!BG) buildBG();
    const p = this.arena.player, px = p ? clamp((p.x - 640) / 640, -1, 1) : 0, M = BG.M;
    ctx.drawImage(BG.far, -M - px * 10, 0);
    // candelabros que se balancean
    for (let i = 0; i < 3; i++) {
      const cx = 220 + i * 420 - px * 22, ang = Math.sin(t * .9 + i * 1.7) * .045;
      ctx.save(); ctx.translate(cx, 0); ctx.rotate(ang);
      ctx.strokeStyle = A.ink; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 74); ctx.stroke();
      blob(ctx, 0, 82, 16, 12, BRASS, { wob: .4, lw: 3, shade: false });
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(0, 86); ctx.quadraticCurveTo(s * 40, 92, s * 52, 70); ctx.stroke(); }
      for (const s of [-52, 0, 52]) {
        const fl = .85 + Math.sin(t * 9 + s + i) * .15;
        ctx.fillStyle = `rgba(255,236,150,${.3 * fl})`; ctx.beginPath(); ctx.arc(s, s === 0 ? 108 : 64, 24, 0, TAU); ctx.fill();
        blob(ctx, s, s === 0 ? 108 : 64, 6, 10, '#fff2b0', { wob: .4, lw: 2.5, shade: false });
      }
      ctx.restore();
    }
    ctx.drawImage(BG.mid, -M - px * 24, 0);
    // letrero de neón OFERTA que parpadea
    const on = Math.sin(t * 5) > -.2 || (Math.floor(t * 3) % 5) === 0;
    ctx.save(); ctx.translate(500 - px * 26, 338); ctx.rotate(-.04);
    A.text(ctx, '¡OFERTA!', 0, 0, 38, { fill: on ? '#ff8aa8' : '#7a4a52', stroke: on ? '#a8183c' : '#3a2025', lw: 6 }); ctx.restore();
    ctx.drawImage(BG.flo, -M - px * 6, 0);
  }
  drawForeground(ctx, t) {
    // serpentinas colgando de las esquinas y confeti que cae
    const cols = [A.red, A.gold, A.blue, A.pink, A.green];
    ctx.save(); ctx.lineCap = 'round';
    for (let i = 0; i < 5; i++) {
      const left = i < 3, bx = left ? 20 + i * 40 : W - 30 - (i - 3) * 50, sw = Math.sin(t * 1.4 + i * 1.3) * 18;
      ctx.strokeStyle = A.ink; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(bx, -4); ctx.bezierCurveTo(bx + sw, 90, bx - sw, 160, bx + sw * .6, 230 + i * 18); ctx.stroke();
      ctx.strokeStyle = cols[i]; ctx.lineWidth = 5.5; ctx.stroke();
    }
    for (let i = 0; i < 42; i++) {
      const sd = i * 37.7, x = ((sd * 17) % W + Math.sin(t * 1.5 + i) * 26 + W) % W, y = ((t * (34 + (i % 5) * 9) + sd * 29) % (H + 40)) - 20;
      ctx.save(); ctx.translate(x, y); ctx.rotate(t * (1 + i % 3) + i); ctx.fillStyle = cols[i % 5]; ctx.globalAlpha = .85; ctx.fillRect(-4, -2.5, 8, 5); ctx.restore();
    }
    ctx.restore();
  }
}
function randi4() { return Math.floor(Math.random() * 1000); }

/* ============================ registro ============================ */
MG.registerBoss({
  id: 'gaston', nombre: 'Don Gastón', area: 'Plata', intro: '¡Cómpralo, cómpralo, que está en oferta!',
  music: 'gaston', parTime: 115, color: '#d7a64a',
  mapIcon(ctx, x, y, s, t) {
    const k = s > 8 ? s / 90 : (s || 1); t = t || 0;
    ctx.save(); ctx.translate(x, y); ctx.scale(k, k); const bob = Math.sin(t * 3) * 2.5, sq = Math.sin(t * 3) * .02;
    ctx.scale(1 + sq, 1 - sq); ctx.translate(0, bob);
    blob(ctx, 32, 6, 8, 12, PEACH_D, { wob: .6, lw: 3, shade: false });                       // cola
    blob(ctx, 0, 6, 46, 36, PEACH, { wob: 1.2, lw: 4 });
    blob(ctx, -34, 8, 16, 12, PEACH_D, { wob: .6, lw: 3 }); blob(ctx, -39, 8, 2.5, 4, '#4a2418', { wob: .2, lw: 1, shade: false }); blob(ctx, -30, 8, 2.5, 4, '#4a2418', { wob: .2, lw: 1, shade: false });
    blob(ctx, -30, -30, 9, 13, PEACH_D, { wob: .6, lw: 3, rot: -.5, shade: false });
    A.eyes(ctx, -14, -8, 11, -1, 0, ''); ctx.strokeStyle = BRASS_L; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(-20, -8, 9, 0, TAU); ctx.stroke();
    ctx.strokeStyle = A.ink; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-34, 0); ctx.quadraticCurveTo(-40, -6, -44, -10); ctx.moveTo(-34, 0); ctx.quadraticCurveTo(-20, -4, -14, -12); ctx.stroke();
    drawHat(ctx, 0, -28, -.1 + Math.sin(t * 2) * .05, .42);
    blob(ctx, 14, 36, 14, 7, A.ink, { wob: .3, lw: 2, shade: false }); blob(ctx, -22, 36, 14, 7, A.ink, { wob: .3, lw: 2, shade: false });
    drawCoin(ctx, 40, -22 + Math.sin(t * 4) * 3, 9, t * 5, false);
    ctx.restore();
  },
  create(arena, opts) { return new Gaston(arena, opts || {}); }
});
})();
