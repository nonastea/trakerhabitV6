/* ==========================================================================
   LA RASQUINA — jefe 1 (Piel). Una pulga gigante que se rasca hasta partirse
   en "el Rasquido" (una garra con ojos). Todo dibujado con código.
   ========================================================================== */
(function () {
'use strict';
const MG = window.MG, A = MG.art, W = 1280, H = 720, FL = 620;
const clamp = MG.clamp, lerp = MG.lerp, rand = MG.rand, ease = MG.ease;
const sfx = n => { try { MG.audio && MG.audio.sfx && MG.audio.sfx(n); } catch (e) {} };
const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const mix = (a, b, k) => { const x = hex(a), y = hex(b); return `rgb(${Math.round(lerp(x[0], y[0], k))},${Math.round(lerp(x[1], y[1], k))},${Math.round(lerp(x[2], y[2], k))})`; };
const cr = (v) => v; // no-op, claridad

/* ------------------------------ utilidades de dibujo ------------------------------ */
function mk(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
function inkStroke(c, lw) { c.strokeStyle = A.ink; c.lineWidth = lw || 4; c.lineJoin = 'round'; c.lineCap = 'round'; c.stroke(); }

function hairs(c, cx, cy, rx, ry, n, len, seed, col) {
  c.save(); c.strokeStyle = col || A.ink; c.lineWidth = 3.4; c.lineCap = 'round'; c.beginPath();
  for (let i = 0; i < n; i++) {
    const a = i / n * Math.PI * 2 + seed, j = A.j(i + seed * 7, 2.5);
    const x0 = cx + Math.cos(a) * rx * .96, y0 = cy + Math.sin(a) * ry * .96;
    const L = len * (.65 + .55 * Math.abs(Math.sin(i * 5.3 + seed))) + j;
    c.moveTo(x0, y0); c.lineTo(x0 + Math.cos(a + .12) * L + j * .6, y0 + Math.sin(a + .12) * L + j * .6);
  }
  c.stroke(); c.restore();
}
// sonrisa maliciosa con dientes. open: 0 cerrada … 1 de par en par
function grin(c, cx, cy, w, open) {
  const x0 = cx - w / 2, x1 = cx + w / 2, y0 = cy - w * .05, d = w * .2 + open * w * .34;
  const uy = y0 - w * .05 + open * w * .04;
  c.save();
  c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo(cx, y0 + d * 2, x1, y0); c.quadraticCurveTo(cx, uy * 2 - y0, x0, y0); c.closePath();
  c.fillStyle = '#4a0d12'; c.fill();
  c.save(); c.clip();
  c.fillStyle = '#ff7a8f'; c.beginPath(); c.ellipse(cx + w * .1, y0 + d * 1.15, w * .22, d * .45, 0, 0, 7); c.fill(); c.restore();
  const n = 6;
  for (let i = 0; i < n; i++) {
    const t = (i + .5) / n, px = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * cx + t * t * x1, py = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * (uy * 2 - y0) + t * t * y0;
    const th = w * .09 * (1 + open * .5) * (i % 2 ? .85 : 1.1);
    c.beginPath(); c.moveTo(px - w * .045, py - 1); c.lineTo(px + w * .045, py - 1); c.lineTo(px + (i % 2 ? 1 : -1), py + th); c.closePath();
    c.fillStyle = A.cream; c.fill(); c.lineWidth = 2; c.strokeStyle = A.ink; c.stroke();
  }
  c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo(cx, y0 + d * 2, x1, y0); c.quadraticCurveTo(cx, uy * 2 - y0, x0, y0); c.closePath();
  inkStroke(c, 4.5); c.restore();
}
function eyesA(c, x, y, size, lx, ly, angry) {
  A.eyes(c, x, y, size, lx, ly);
  if (!angry) return;
  const gap = size * 1.25; c.save(); c.strokeStyle = A.ink; c.lineWidth = 7.5; c.lineCap = 'round';
  for (const s of [-1, 1]) { const ex = x + s * gap / 2; c.beginPath(); c.moveTo(ex + s * size * .66, y - size * .92); c.lineTo(ex - s * size * .5, y - size * .26); c.stroke(); }
  c.restore();
}
function limb(c, pts, w, col) {
  for (let i = 0; i < pts.length - 1; i++) A.hose(c, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], 6, w, col);
  for (let i = 1; i < pts.length - 1; i++) A.blob(c, pts[i][0], pts[i][1], w * .62, w * .62, col, { wob: .5, lw: 3.5, shade: false, points: 10 });
}
function claw(c, x, y, ang, len, wid, glow) {      // uña/garra puntiaguda hacia ang
  c.save(); c.translate(x, y); c.rotate(ang);
  c.beginPath(); c.moveTo(-wid * .15, -wid * .55); c.quadraticCurveTo(len * .55, -wid * .6, len, wid * .15); c.quadraticCurveTo(len * .5, wid * .5, -wid * .15, wid * .55); c.closePath();
  c.fillStyle = glow > 0 ? mix('#f4e7c2', '#ffb347', glow) : '#f4e7c2'; c.fill(); inkStroke(c, 3.5);
  c.beginPath(); c.moveTo(len * .1, -wid * .25); c.quadraticCurveTo(len * .5, -wid * .3, len * .8, 0); c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 3; c.stroke();
  c.restore();
}

/* ------------------------------ escenario (baño art déco) ------------------------------ */
let BG = null;
function jar(g, x, y, w, h, col, lid, label) {
  rr(g, x, y - h, w, h, 8); g.fillStyle = col; g.fill(); inkStroke(g, 3);
  rr(g, x + 3, y - h - 11, w - 6, 13, 4); g.fillStyle = lid; g.fill(); inkStroke(g, 3);
  rr(g, x + 6, y - h * .68, w - 12, h * .34, 3); g.fillStyle = 'rgba(255,248,225,.92)'; g.fill(); g.lineWidth = 1.6; g.strokeStyle = A.ink; g.stroke();
  g.fillStyle = A.ink; g.font = "bold " + Math.round(w * .2) + "px 'Lilita One', Arial, sans-serif"; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(label, x + w / 2, y - h * .51);
  g.fillStyle = 'rgba(255,255,255,.4)'; g.fillRect(x + 6, y - h + 6, 5, h * .28);
}
function shelf(g, x, y, w) {
  rr(g, x, y, w, 14, 3); g.fillStyle = '#7b5a3c'; g.fill(); inkStroke(g, 4);
  for (const bx of [x + 18, x + w - 30]) { g.beginPath(); g.moveTo(bx, y + 14); g.lineTo(bx, y + 40); g.lineTo(bx + 14, y + 14); g.closePath(); g.fillStyle = '#c9a24a'; g.fill(); inkStroke(g, 3); }
}
function buildBG() {
  BG = {};
  // ---- capa lejana: pared + azulejos + piso en perspectiva
  const far = mk(1360, 720), g = far.getContext('2d'); g.translate(40, 0);
  let gr = g.createLinearGradient(0, 0, 0, 560); gr.addColorStop(0, '#4f7f7a'); gr.addColorStop(1, '#86b3a3');
  g.fillStyle = gr; g.fillRect(-40, 0, 1360, 570);
  for (let x = -40; x < 1320; x += 64) {
    g.fillStyle = 'rgba(255,240,200,.09)'; g.fillRect(x, 0, 32, 322);
    g.strokeStyle = 'rgba(242,193,78,.5)'; g.lineWidth = 2;
    for (let row = 0; row < 3; row++) for (let k = 1; k <= 3; k++) { g.beginPath(); g.arc(x + 32, 40 + row * 95 + (row % 2) * 0, k * 10, 0, Math.PI); g.stroke(); }
    g.beginPath(); g.moveTo(x + 32, 0); g.lineTo(x + 32, 322); g.strokeStyle = 'rgba(242,193,78,.25)'; g.stroke();
  }
  // moldura dorada
  g.fillStyle = '#c9a24a'; g.fillRect(-40, 318, 1360, 16); g.strokeStyle = A.ink; g.lineWidth = 4; g.strokeRect(-44, 318, 1368, 16);
  // azulejos
  for (let y = 336; y < 556; y += 44) for (let x = -40; x < 1320; x += 44) {
    g.fillStyle = ((x / 44 + y / 44) | 0) % 2 ? '#f1e8cd' : '#e8dcb9'; g.fillRect(x, y, 44, 44);
    g.strokeStyle = '#6e9a8c'; g.lineWidth = 3; g.strokeRect(x, y, 44, 44);
    g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(x + 4, y + 4, 12, 4);
  }
  for (let x = -40; x < 1320; x += 44) { g.fillStyle = (x / 44 | 0) % 2 ? '#1b120a' : '#c9a24a'; g.fillRect(x, 336, 44, 14); }
  g.fillStyle = '#2f5e5b'; g.fillRect(-40, 548, 1360, 16); g.strokeStyle = A.ink; g.lineWidth = 4; g.strokeRect(-44, 548, 1368, 16);
  // piso ajedrezado en perspectiva
  const vy = 250, N = 8, z0 = 1, z1 = (564 - vy) / (720 - vy);
  const yk = k => vy + (564 - vy) / (z0 + (z1 - z0) * k / N);
  for (let k = 0; k < N; k++) {
    const ya = yk(k), yb = yk(k + 1);
    for (let j = -9; j < 9; j++) {
      const xb = (jj, y) => 640 + (jj * 190) * (y - vy) / (720 - vy);
      g.beginPath(); g.moveTo(xb(j, ya), ya); g.lineTo(xb(j + 1, ya), ya); g.lineTo(xb(j + 1, yb), yb); g.lineTo(xb(j, yb), yb); g.closePath();
      g.fillStyle = (j + k) % 2 === 0 ? '#f1e7cf' : '#2f5e5b'; g.fill();
    }
  }
  g.strokeStyle = 'rgba(27,18,10,.55)'; g.lineWidth = 2;
  for (let k = 0; k <= N; k++) { g.beginPath(); g.moveTo(-40, yk(k)); g.lineTo(1320, yk(k)); g.stroke(); }
  gr = g.createLinearGradient(0, 564, 0, 720); gr.addColorStop(0, 'rgba(15,30,30,.55)'); gr.addColorStop(1, 'rgba(15,30,30,0)');
  g.fillStyle = gr; g.fillRect(-40, 564, 1360, 156);
  BG.far = far;

  // ---- capa media: espejo, repisas con frascos, bañera con patas
  const mid = mk(1360, 720), m = mid.getContext('2d'); m.translate(40, 0);
  // espejo sunburst
  m.save(); m.translate(640, 150);
  for (let i = 0; i < 18; i++) { m.rotate(Math.PI / 9); m.beginPath(); m.moveTo(120, -7); m.lineTo(172, 0); m.lineTo(120, 7); m.closePath(); m.fillStyle = '#e1b94e'; m.fill(); inkStroke(m, 2.5); }
  m.beginPath(); for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2 + Math.PI / 8; m[i ? 'lineTo' : 'moveTo'](Math.cos(a) * 118, Math.sin(a) * 118); } m.closePath();
  m.fillStyle = '#c9a24a'; m.fill(); inkStroke(m, 5);
  m.beginPath(); for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2 + Math.PI / 8; m[i ? 'lineTo' : 'moveTo'](Math.cos(a) * 96, Math.sin(a) * 96); } m.closePath();
  gr = m.createLinearGradient(-90, -90, 90, 90); gr.addColorStop(0, '#dff1ef'); gr.addColorStop(1, '#9ec7c4'); m.fillStyle = gr; m.fill(); inkStroke(m, 4);
  m.strokeStyle = 'rgba(255,255,255,.75)'; m.lineWidth = 9; m.beginPath(); m.moveTo(-60, 40); m.lineTo(-10, -30); m.stroke(); m.lineWidth = 4; m.beginPath(); m.moveTo(-30, 62); m.lineTo(20, -2); m.stroke();
  m.restore();
  // repisas con frascos de crema
  shelf(m, 20, 214, 330); shelf(m, 20, 318, 330); shelf(m, 930, 190, 330);
  const cols = ['#f6b9c4', '#a5d1c4', '#fff3d1', '#f2c14e', '#cfe3f0'];
  [[34, 214, 50, 62, 0, 'CREMA'], [96, 214, 40, 50, 1, 'ALOE'], [148, 214, 56, 74, 2, 'CREMA'], [220, 214, 44, 56, 4, 'PIEL'], [278, 214, 50, 66, 0, 'CREMA'],
   [34, 318, 46, 54, 1, 'ALOE'], [96, 318, 60, 70, 2, 'CREMA'], [172, 318, 42, 48, 3, 'MIEL'], [230, 318, 54, 62, 0, 'CREMA'], [296, 318, 40, 52, 4, 'PIEL'],
   [944, 190, 54, 64, 0, 'CREMA'], [1010, 190, 44, 52, 1, 'ALOE'], [1068, 190, 58, 76, 2, 'CREMA'], [1140, 190, 46, 58, 3, 'MIEL'], [1198, 190, 50, 62, 4, 'PIEL']
  ].forEach(j => jar(m, j[0], j[1], j[2], j[3], cols[j[4]], '#c9a24a', j[5]));
  // bañera con patas de garra
  for (const fx of [300, 560]) {
    m.beginPath(); m.ellipse(fx, 548, 24, 14, 0, 0, 7); m.fillStyle = '#c9a24a'; m.fill(); inkStroke(m, 4);
    for (const dx of [-14, 0, 14]) { m.beginPath(); m.ellipse(fx + dx, 560, 7, 10, 0, 0, 7); m.fillStyle = '#e1b94e'; m.fill(); inkStroke(m, 3); }
  }
  rr(m, 220, 420, 420, 124, 46); m.fillStyle = '#f4ecd8'; m.fill(); inkStroke(m, 5);
  rr(m, 210, 406, 440, 28, 14); m.fillStyle = '#e1b94e'; m.fill(); inkStroke(m, 5);
  m.strokeStyle = 'rgba(111,154,140,.5)'; m.lineWidth = 5;
  for (const lx of [300, 360, 420, 480, 540]) { m.beginPath(); m.moveTo(lx, 446); m.lineTo(lx, 520); m.stroke(); }
  m.fillStyle = 'rgba(255,255,255,.55)'; m.fillRect(236, 444, 10, 40);
  // grifo dorado
  m.beginPath(); m.moveTo(250, 406); m.lineTo(250, 352); m.quadraticCurveTo(250, 326, 282, 326); m.lineTo(300, 326); m.lineTo(300, 344); m.lineTo(284, 344); m.quadraticCurveTo(272, 344, 272, 356); m.lineTo(272, 406); m.closePath();
  m.fillStyle = '#e1b94e'; m.fill(); inkStroke(m, 4);
  m.beginPath(); m.arc(250, 340, 9, 0, 7); m.arc(272, 340, 9, 0, 7); m.fillStyle = '#c9a24a'; m.fill(); inkStroke(m, 3);
  BG.mid = mid;

  // ---- arañazos de la fase 3
  const sc = mk(W, H), s = sc.getContext('2d'); s.lineCap = 'round';
  for (const [x0, y0] of [[120, 60], [830, 40], [560, 330]]) for (let i = 0; i < 4; i++) {
    s.beginPath(); s.moveTo(x0 + i * 38, y0 + i * 6); s.quadraticCurveTo(x0 + i * 38 + 30, y0 + 160, x0 + i * 38 + 8, y0 + 300);
    s.strokeStyle = A.ink; s.lineWidth = 11; s.stroke(); s.strokeStyle = '#8a1c1c'; s.lineWidth = 5; s.stroke();
  }
  BG.scr = sc;
}

/* ------------------------------ el jefe ------------------------------ */
class Rasquina extends MG.Boss {
  constructor(arena, opts) {
    super(arena, { hp: 1300, phases: [.66, .33], difficulty: opts.difficulty, x: 940, y: FL });
    this.form = 'flea'; this.heat = 0; this.heatT = 0;
    this.sqx = 0; this.sqv = 0; this.charge = 0; this.tel = null; this.hitK = 0; this.mouth = 0; this.trans = null;
    this.hz = []; this.parts = []; this.steam = []; this.cream = []; this.deadT = 0; this.last = ''; this.shout = null; this.it = 0;
    this.sx = 1; this.sy = 1; this.scratchK = 1; this.crackK = 0; this.dripT = 1; this.drip = null; this.itch = 0;
    this.hand = { x: 940, y: 300, rot: 0, trot: 0, tx: 940, ty: 300, k: 5, sc: 0, ext: 0, extT: 0, extV: 2400, curl: 0, spread: 0, glow: 0, follow: false, slam: false, mouth: 0, stun: 0 };
    if (!BG) buildBG();
  }
  get TD() { return .62 / (.85 + .15 * this.difficulty); }
  get sp() { return .92 + .08 * this.difficulty; }
  pt(lx, ly) { return { x: this.x + lx * this.sx, y: FL + ly * this.sy }; }
  punch(v) { this.sqv += v; }
  tele(dur, fn) { this.tel = { t: 0, dur }; this.after(dur, () => { this.tel = null; fn(); }); }
  add(o) { o.t = 0; this.hz.push(o); return o; }
  kill() { this.arena.enemyProj.forEach(p => { p.dead = true; }); this.hz.length = 0; }
  takeDamage(n) { if (this.dead) return; super.takeDamage(n); this.hitK = 1; }

  /* ---- ciclo de ataques ---- */
  start() { this.after(.6, () => this.next()); }
  next() {
    if (this.dead || this.trans) return;
    const pool = this.form === 'hand' ? ['atkGolpe', 'atkDedo', 'atkGolpe'] : this.phase === 2 ? ['atkOla', 'atkLluvia', 'atkRonchas', 'atkOla', 'atkLluvia'] : ['atkRonchas', 'atkPulgas', 'atkUnas'];
    let a, n = 0; do { a = MG.pick(pool); n++; } while (a === this.last && n < 8);
    this.last = a; this[a]();
  }
  fin(sec) { this.after(sec, () => this.next()); }
  introUpdate(dt) {
    this.it += dt; this.t += dt;
    this.mouth = .55 + .45 * Math.sin(this.it * 15); if (Math.floor(this.it * 3.3) !== Math.floor((this.it - dt) * 3.3)) this.punch(2.6);
    this.spring(dt); this.calc(); this.boxes();
  }
  spring(dt) { this.sqv += (-150 * this.sqx - 8.5 * this.sqv) * dt; this.sqx = clamp(this.sqx + this.sqv * dt, -.42, .42); }
  calc() {
    const t = this.t, gr = 1.18 * (1 + .2 * clamp(this.heat, 0, 1) + (this.trans && this.trans.n === 3 ? .07 * this.trans.t : 0)) * (1 + .018 * this.heat * Math.sin(t * 11));
    this.sx = (1 - this.sqx * .6 + .02 * Math.sin(t * 3.1)) * gr * (1 + .08 * this.charge) - .025 * this.hitK;
    this.sy = (1 + this.sqx + .03 * Math.sin(t * 4.3 + 1)) * gr * (1 - .2 * this.charge) - .02 * this.hitK;
  }
  boxes() {
    const hb = [], xb = [];
    if (this.dead) { this.hurtboxes = []; this.hitboxes = []; return; }
    if (this.form === 'flea') {
      const k = (this.sx + this.sy) / 2, a = this.pt(60, -280), h = this.pt(-110, -250);
      const lg = this.pt(10, -95), lg2 = this.pt(-120, -120);
      hb.push({ x: a.x, y: a.y, r: 125 * k }, { x: h.x, y: h.y, r: 82 * k }, { x: lg.x, y: lg.y, r: 72 * k }, { x: lg2.x, y: lg2.y, r: 50 * k });
      xb.push({ x: a.x, y: a.y, r: 100 * k }, { x: h.x, y: h.y, r: 62 * k });
    } else if (this.hand.sc > .3) {
      const q = this.hand, c = Math.cos(q.rot), s = Math.sin(q.rot), L = (lx, ly) => ({ x: q.x + (lx * c - ly * s) * q.sc, y: q.y + (lx * s + ly * c) * q.sc });
      hb.push({ x: q.x, y: q.y, r: 92 * q.sc });
      if (q.ext < 30) { const fp = L(0, 140); hb.push({ x: fp.x, y: fp.y, r: 62 * q.sc }); }
      xb.push({ x: q.x, y: q.y, r: 62 * q.sc });
      for (const f of this.fingerTips()) { const p = L(f.x, f.y); xb.push({ x: p.x, y: p.y, r: 20 * q.sc }); }
      if (q.ext > 30) {   // el dedo largo (hand rotada hacia la izquierda)
        const bx = q.x - 58 * q.sc, tipx = q.x - (58 + q.ext) * q.sc;
        xb.push({ x: tipx, y: q.y - 22 * q.sc - 24, w: bx - tipx, h: 48 });
      }
    }
    if (this.hz.length) for (const o of this.hz) if (o.rect) { const r = o.rect(); if (r) xb.push(r); }
    this.hurtboxes = hb; this.hitboxes = xb;
  }
  update(dt) {
    this.baseUpdate(dt);
    const t = this.t;
    this.hitK = Math.max(0, this.hitK - dt * 9);
    this.spring(dt);
    this.charge = lerp(this.charge, this.tel ? 1 : 0, 1 - Math.exp(-dt * (this.tel ? 9 : 18)));
    if (this.tel) this.tel.t += dt;
    this.heat = lerp(this.heat, this.heatT, 1 - Math.exp(-dt * 2.2));
    this.mouth = Math.max(0, this.mouth - dt * 2.4);
    this.calc();
    // animación de transición
    if (this.trans) {
      this.trans.t += dt;
      if (this.trans.n === 2) { this.punch(Math.sin(this.trans.t * 30) * 1.2); this.itchBurst(dt); }
      else if (this.trans.n === 3) {
        if (this.form === 'flea') {
          this.crackK = clamp(this.trans.t / .85, 0, 1); this.punch(Math.sin(this.trans.t * 45) * 1.6);
          if (this.trans.t > .85) this.burst();
        }
      }
    }
    if (this.dead) { this.deadT += dt; this.dying(dt); this.parts = this.parts.filter(p => (p.t += dt) < p.life); this.updHz(dt); this.boxes(); return; }
    if (this.form === 'hand') this.updHand(dt);
    // vapor en fase 2+
    if (this.heat > .3 && this.form === 'flea' && Math.random() < dt * 9) this.steam.push({ x: this.x + rand(-60, 130), y: FL - 410 * this.sy, t: 0, life: 1.1, r: rand(10, 20) });
    this.steam = this.steam.filter(s => (s.t += dt) < s.life);
    this.parts = this.parts.filter(p => { p.t += dt; p.vy += (p.g || 0) * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += (p.spin || 0) * dt; return p.t < p.life; });
    this.updHz(dt);
    this.boxes();
  }
  itchBurst(dt) { if (Math.random() < dt * 25) this.parts.push({ x: this.x + rand(-170, 170), y: FL - rand(120, 420), vx: rand(-60, 60), vy: rand(-140, -40), t: 0, life: .6, type: 'zig' }); }
  updHz(dt) {
    for (const o of this.hz) { o.t += dt; if (o.upd && o.upd(dt, o) === false) o.dead = true; }
    this.hz = this.hz.filter(o => !o.dead);
  }
  /* ---- fase 1: la pulga ---- */
  atkRonchas() {
    this.tele(this.TD, () => {
      this.mouth = 1; this.punch(-4); sfx('shoot');
      const n = this.phase >= 2 ? 4 : 3;
      for (let i = 0; i < n; i++) this.after(i * .3, () => {
        if (this.dead) return;
        const o = this.pt(-170, -215); this.mouth = 1; this.punch(-1.6);
        const k = n > 1 ? i / (n - 1) : .5;
        const vx = -lerp(220, 430, k) * this.sp * rand(.92, 1.08), bn = MG.randi(2, 3);
        const p = this.spawn({ x: o.x, y: o.y, vx, vy: -rand(420, 520), r: 24, grav: 1350 });
        p.bn = 0; p.life = 9;
        p.onUpdate = (dt, ar) => {
          if (p.y + p.r > ar.floorY && p.vy > 0) { p.y = ar.floorY - p.r; p.vy *= -.82; p.bn++; if (p.bn > bn) { p.dead = true; ar.effects.push(MG.fx.starBurst(p.x, p.y, A.red)); } }
        };
        p.onDraw = ctx => {
          const st = clamp(Math.abs(p.vy) / 2600, 0, .3), x = p.x, y = p.y;
          ctx.save(); ctx.translate(x, y);
          A.blob(ctx, 0, 0, p.r * (1 - st), p.r * (1 + st), '#e0412b', { wob: 2, lw: 4, seed: 3 });
          ctx.fillStyle = '#9a1d14'; for (const [dx, dy, r] of [[-7, 5, 4], [8, 8, 3], [5, -8, 3.5]]) { ctx.beginPath(); ctx.arc(dx, dy, r, 0, 7); ctx.fill(); }
          ctx.fillStyle = '#ffd9cf'; ctx.beginPath(); ctx.ellipse(-8, -9, 6, 3.5, -.6, 0, 7); ctx.fill();
          ctx.restore();
        };
      });
      this.fin(.3 * n + 1.15);
    });
  }
  atkPulgas() {
    this.tele(this.TD, () => {
      this.punch(4); sfx('jump');
      for (let i = 0; i < 3; i++) this.after(i * .45, () => {
        if (this.dead) return; this.punch(2.2);
        const o = this.pt(-110 + i * 20, -340);
        const p = this.spawn({ x: o.x, y: o.y, vx: -(250 + i * 40), vy: -640, r: 21, grav: 1500 });
        p.st = 'air'; p.hops = 0; p.wait = 0; p.life = 14;
        p.onUpdate = (dt, ar) => {
          if (p.st === 'air') {
            if (p.y + p.r > ar.floorY && p.vy > 0) { p.y = ar.floorY - p.r; p.vy = 0; p.vx = 0; p.grav = 0; p.hops++; p.st = p.hops > 3 ? 'run' : 'squat'; p.wait = .5; if (p.st === 'run') { p.vx = -430; p.wait = 3; } }
          } else if (p.st === 'squat') {
            p.wait -= dt;
            if (p.wait <= 0) { const dx = ar.player.x - p.x; p.vx = clamp(dx / .85, -330, 330) * this.sp; p.vy = -740; p.grav = 1500; p.st = 'air'; }
          }
        };
        p.onDraw = ctx => {
          const sq = p.st === 'squat' ? clamp(1 - p.wait / .5, 0, 1) : 0, air = p.st === 'air' ? clamp(Math.abs(p.vy) / 900, 0, 1) : 0;
          ctx.save(); ctx.translate(p.x, p.y + sq * 5); ctx.scale(1 + sq * .3 - air * .12, 1 - sq * .3 + air * .2);
          for (const s of [-1, 1]) for (const dy of [-8, 3, 12]) { A.hose(ctx, s * 10, dy, s * (22 + (p.st === 'squat' ? 6 : 0)), dy + (air ? 10 : 6), 4 * s, 5, '#7a3320'); }
          A.blob(ctx, 0, 0, 20, 19, '#b3452b', { wob: 1.3, lw: 3.5 });
          A.eyes(ctx, 0, -3, 11, p.vx < 0 ? -1 : 1, 0, 'angry');
          ctx.restore();
        };
      });
      this.fin(1.35 + 2.4);
    });
  }
  atkUnas() {
    const warn = 1.05 / (.85 + .15 * this.difficulty), slots = [110, 280, 450, 620, 760];
    const px = this.arena.player.x; let near = 0; slots.forEach((s, i) => { if (Math.abs(s - px) < Math.abs(slots[near] - px)) near = i; });
    const pick = [near]; while (pick.length < 3) { const c = MG.randi(0, 4); if (!pick.includes(c)) pick.push(c); }
    this.tel = { t: 0, dur: this.TD, kind: 'nails' };
    this.after(this.TD, () => { this.tel = null; this.punch(3); });
    for (const i of pick) {
      const x = slots[i] + rand(-8, 8);
      this.add({ kind: 'shadow', x, dur: warn, upd: (dt, o) => o.t < o.dur + .02, draw: (ctx, o) => {
        const k = clamp(o.t / o.dur, 0, 1), bl = o.t > o.dur * .55 && Math.floor(o.t * 14) % 2 === 0;
        ctx.save(); ctx.globalAlpha = .35 + .4 * k; ctx.fillStyle = bl ? '#d8432e' : 'rgba(40,10,5,.8)';
        ctx.beginPath(); ctx.ellipse(o.x, FL + 6, 22 + 40 * k, 7 + 8 * k, 0, 0, 7); ctx.fill();
        ctx.globalAlpha = .12 + .2 * k; ctx.strokeStyle = A.ink; ctx.lineWidth = 3; ctx.setLineDash([8, 8]); ctx.lineDashOffset = -o.t * 40;
        ctx.beginPath(); ctx.moveTo(o.x, 0); ctx.lineTo(o.x, FL); ctx.stroke(); ctx.restore();
      } });
      this.after(warn, () => {
        if (this.dead) return;
        const o = this.add({ kind: 'nail', x, tip: -420, st: 0, stay: 0, draw: (ctx, o2) => this.drawNail(ctx, o2), upd: (dt, o2) => {
          if (o2.st === 0) { o2.tip += 2700 * dt; if (o2.tip >= FL) { o2.tip = FL; o2.st = 1; o2.stay = .55; MG.fx.shake(7, .22); this.parts.push({ x: o2.x, y: FL, t: 0, life: .5, type: 'dust' }); sfx('hit'); } }
          else if (o2.st === 1) { o2.stay -= dt; if (o2.stay <= 0) o2.st = 2; }
          else { o2.tip -= 1100 * dt; if (o2.tip < -430) return false; }
          return true;
        } });
        o.rect = () => o.tip > 0 ? ({ x: o.x - 30, y: -50, w: 60, h: o.tip + 50 }) : null;
      });
    }
    this.fin(warn + 1.9);
  }
  drawNail(ctx, o) {
    const x = o.x, tip = o.tip, bot = tip - 118;
    ctx.save();
    rr(ctx, x - 46, -100, 92, bot + 100, 44); ctx.fillStyle = '#e8957a'; ctx.fill(); inkStroke(ctx, 5.5);
    ctx.strokeStyle = 'rgba(150,50,35,.7)'; ctx.lineWidth = 4; ctx.beginPath(); for (let k = 0; k < 3; k++) { const y = bot - 40 - k * 46; ctx.moveTo(x - 24, y); ctx.quadraticCurveTo(x, y + 10, x + 24, y); } ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 36, bot - 62); ctx.quadraticCurveTo(x - 40, tip - 50, x + 4, tip); ctx.quadraticCurveTo(x + 42, tip - 50, x + 36, bot - 62); ctx.quadraticCurveTo(x, bot - 84, x - 36, bot - 62); ctx.closePath();
    ctx.fillStyle = '#f7ecc9'; ctx.fill(); inkStroke(ctx, 5);
    ctx.save(); ctx.clip(); ctx.fillStyle = 'rgba(210,60,40,.85)'; ctx.beginPath(); ctx.moveTo(x - 40, tip - 36); ctx.quadraticCurveTo(x, tip - 56, x + 42, tip - 36); ctx.lineTo(x + 42, tip + 4); ctx.lineTo(x - 40, tip + 4); ctx.fill(); ctx.restore();
    ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x - 18, bot - 56); ctx.lineTo(x - 18, tip - 70); ctx.stroke();
    ctx.restore();
  }
  /* ---- fase 2: la comezón ---- */
  atkOla() {
    this.tele(this.TD, () => {
      this.punch(-5); sfx('shoot'); MG.fx.shake(5, .2);
      const n = this.difficulty > 1.2 ? 3 : this.difficulty > .95 ? 2 : 1, sp = 410 * this.sp;
      for (let i = 0; i < n; i++) this.after(i * (.95 / this.sp), () => {
        if (this.dead) return;
        this.parts.push({ x: this.x - 190, y: FL - 30, t: 0, life: .4, type: 'dust' });
        this.add({ kind: 'wave', x: this.x - 180, vx: -sp, upd: (dt, o) => { o.x += o.vx * dt; return o.x > -160; },
          rect: null, draw: (ctx, o) => this.drawWave(ctx, o) });
        const o = this.hz[this.hz.length - 1]; o.rect = () => ({ x: o.x - 52, y: FL - 60, w: 104, h: 60 });
      });
      this.fin((n - 1) * .95 + 1.9);
    });
  }
  drawWave(ctx, o) {
    const x = o.x, t = o.t;
    ctx.save(); ctx.translate(x, FL); ctx.scale(1, 1.25);
    ctx.beginPath(); ctx.moveTo(-60, 0);
    for (let i = 0; i <= 8; i++) { const px = -60 + i * 15, py = -(i % 2 ? 46 + A.j(i, 6) : 14) * Math.sin(Math.PI * (i / 8)) - 8; ctx.lineTo(px, py - (i === 4 ? 14 : 0)); }
    ctx.lineTo(60, 0); ctx.closePath();
    ctx.fillStyle = '#e0412b'; ctx.fill(); inkStroke(ctx, 4.5);
    ctx.strokeStyle = '#ffd36e'; ctx.lineWidth = 4; ctx.beginPath();
    for (let i = 0; i < 5; i++) { const px = -40 + i * 20; ctx.moveTo(px, -4); ctx.lineTo(px + 6, -26 + Math.sin(t * 20 + i) * 4); ctx.lineTo(px - 4, -40 + Math.sin(t * 18 + i) * 4); }
    ctx.stroke(); ctx.restore();
  }
  atkLluvia() {
    this.tele(this.TD, () => {
      this.punch(5); sfx('shoot');
      const n = Math.round(11 + 3 * (this.difficulty - 1)), gap = .24 / this.sp;
      for (let i = 0; i < n; i++) this.after(i * gap, () => {
        if (this.dead) return;
        const cream = i % 4 === 2, x0 = rand(70, 780), ph = rand(0, 6);
        const p = this.spawn({ x: x0, y: -30, vx: 0, vy: cream ? 250 : 330 * this.sp, r: cream ? 18 : 12, pink: cream, life: 6 });
        p.onUpdate = (dt, ar) => { if (!cream) p.x = x0 + Math.sin(p.t * 7 + ph) * 40; else p.x = x0 + Math.sin(p.t * 3 + ph) * 12; if (p.y > ar.floorY - 6) { p.dead = true; ar.effects.push(MG.fx.starBurst(p.x, ar.floorY - 10, cream ? A.pink : A.gold)); } };
        p.onDraw = ctx => {
          if (cream) {
            ctx.save(); ctx.translate(p.x, p.y);
            ctx.beginPath(); ctx.moveTo(0, -26); ctx.quadraticCurveTo(22, 2, 0, 18); ctx.quadraticCurveTo(-22, 2, 0, -26); ctx.fillStyle = A.pink; ctx.fill(); inkStroke(ctx, 3.5);
            ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.beginPath(); ctx.ellipse(-6, 2, 3.5, 6, .3, 0, 7); ctx.fill(); ctx.restore();
          } else {
            ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(Math.sin(p.t * 7 + ph) * .5);
            ctx.beginPath(); ctx.moveTo(-3, -22); ctx.lineTo(9, -6); ctx.lineTo(-7, 2); ctx.lineTo(8, 22); ctx.lineTo(-10, 4); ctx.lineTo(5, -4); ctx.closePath();
            ctx.fillStyle = Math.floor(p.t * 12) % 2 ? '#ffd36e' : '#ff7a3c'; ctx.fill(); inkStroke(ctx, 3.5); ctx.restore();
          }
        };
      });
      this.fin(n * gap + 1.9);
    });
  }
  /* ---- fase 3: el Rasquido ---- */
  updHand(dt) {
    const q = this.hand, k = 1 - Math.exp(-dt * q.k);
    if (q.follow) { q.tx = clamp(this.arena.player.x, 150, 1130); }
    if (q.slam) { q.y += 3200 * dt; if (q.y >= 392) { q.y = 392; q.slam = false; this.impact(); } }
    else { q.x += (q.tx - q.x) * k; q.y += (q.ty - q.y) * k; }
    q.rot += (q.trot - q.rot) * k;
    q.ext += clamp(q.extT - q.ext, -q.extV * dt * (q.extT < q.ext ? .75 : 1), q.extV * dt);
    q.glow = lerp(q.glow, this.tel ? 1 : 0, 1 - Math.exp(-dt * 8));
    q.stun = Math.max(0, q.stun - dt); q.mouth = Math.max(0, q.mouth - dt * 2);
    if (q.grow) { q.sc = Math.min(1, q.sc + dt * 2.2); if (q.sc >= 1) q.grow = false; }
  }
  fingerTips() {
    const q = this.hand, out = [], L = [150, 172, 166, 138];
    for (let i = 0; i < 4; i++) {
      const bx = -66 + i * 44, by = 58, a = (i - 1.5) * .17 * (1 + q.spread * 1.2) - q.curl * (i - 1.5) * .22;
      let len = L[i] * (1 - .55 * q.curl);
      if (i === 1 && q.ext > 1) len = L[i] * .45 + q.ext;
      const wob = Math.sin(this.t * 3.2 + i * 1.3) * 7 * (1 - q.curl);
      out.push({ x: bx + Math.sin(a) * len + wob, y: by + Math.cos(a) * len, a: Math.PI / 2 - a + (q.curl ? 0 : 0), i, bx, by, len, ang: a });
    }
    return out;
  }
  impact() {
    const q = this.hand; MG.fx.shake(14, .45); sfx('hit'); this.mouth = 1; q.stun = .8; q.mouth = 1;
    const sp = 470 * this.sp;
    for (const d of [-1, 1]) {
      this.parts.push({ x: q.x + d * 90, y: FL, t: 0, life: .55, type: 'dust' });
      this.add({ kind: 'wave', x: q.x + d * 110, vx: d * sp, upd: (dt, o) => { o.x += o.vx * dt; return o.x > -160 && o.x < W + 160; }, draw: (ctx, o) => this.drawWave(ctx, o) });
      const o = this.hz[this.hz.length - 1]; o.rect = () => ({ x: o.x - 52, y: FL - 60, w: 104, h: 60 });
    }
    this.after(.85, () => { q.tx = 940; q.ty = 300; q.k = 5; });
  }
  atkGolpe() {
    const q = this.hand; q.k = 6; q.trot = 0; q.follow = true; q.ty = 165; q.spread = 1; q.curl = .3; q.extT = 0;
    const T = this.TD + .35, lockAt = T - .26;
    this.tel = { t: 0, dur: T };
    const sh = this.add({ kind: 'shadow2', x: q.x, upd: (dt, o) => { if (q.follow) o.x = q.tx; return o.t < T + .6; }, draw: (ctx, o) => {
      const k = clamp(o.t / T, 0, 1), bl = o.t > lockAt && Math.floor(o.t * 16) % 2 === 0;
      ctx.save(); ctx.globalAlpha = .3 + .5 * k; ctx.fillStyle = bl ? '#d8432e' : 'rgba(40,10,5,.85)';
      ctx.beginPath(); ctx.ellipse(o.x, FL + 6, 40 + 80 * k, 10 + 12 * k, 0, 0, 7); ctx.fill(); ctx.restore();
    } });
    this.after(lockAt, () => { q.follow = false; q.k = 14; });
    this.after(T, () => { this.tel = null; q.spread = .2; q.curl = 0; q.slam = true; q.mouth = 1; this.punch(2); });
    this.fin(T + 1.15 + 1.1);
    this.after(T + .9, () => { q.k = 5; });
  }
  atkDedo() {
    const q = this.hand, T = this.TD + .15; q.follow = false; q.k = 7; q.tx = 1295; q.ty = 542; q.trot = Math.PI / 2; q.curl = 1; q.spread = 0;
    this.tel = { t: 0, dur: T };
    this.add({ kind: 'band', upd: (dt, o) => o.t < T + .1, draw: (ctx, o) => {
      const k = clamp(o.t / T, 0, 1), on = Math.floor(o.t * 12) % 2 === 0;
      ctx.save(); ctx.globalAlpha = (.12 + .22 * k) * (on ? 1 : .6); ctx.fillStyle = '#d8432e'; ctx.fillRect(0, 492, W, 56);
      ctx.globalAlpha = .55; ctx.strokeStyle = A.ink; ctx.lineWidth = 3; ctx.setLineDash([22, 14]); ctx.lineDashOffset = o.t * 80;
      ctx.beginPath(); ctx.moveTo(0, 492); ctx.lineTo(W, 492); ctx.moveTo(0, 548); ctx.lineTo(W, 548); ctx.stroke(); ctx.restore();
    } });
    this.after(T, () => { this.tel = null; q.extT = 1060; q.extV = 2600; q.mouth = 1; MG.fx.shake(5, .3); sfx('shoot'); });
    this.after(T + .45 + .55, () => { q.extT = 0; q.extV = 1700; });
    this.after(T + 1.7, () => {
      q.curl = 0; q.trot = 0; q.tx = 940; q.ty = 300;
      for (let i = 0; i < 2; i++) this.after(i * .4, () => {   // crema pa' parry
        const x0 = rand(250, 600), p = this.spawn({ x: x0, y: -30, vy: 260, r: 18, pink: true, life: 6 });
        p.onUpdate = (dt, ar) => { p.x = x0 + Math.sin(p.t * 3) * 14; if (p.y > ar.floorY - 6) { p.dead = true; ar.effects.push(MG.fx.starBurst(p.x, ar.floorY - 10, A.pink)); } };
        p.onDraw = ctx => { ctx.save(); ctx.translate(p.x, p.y); ctx.beginPath(); ctx.moveTo(0, -26); ctx.quadraticCurveTo(22, 2, 0, 18); ctx.quadraticCurveTo(-22, 2, 0, -26); ctx.fillStyle = A.pink; ctx.fill(); inkStroke(ctx, 3.5); ctx.restore(); };
      });
    });
    this.fin(T + 1.7 + 1.5);
  }
  /* ---- fases ---- */
  onPhase(n) {
    this.kill(); this.tel = null; this.trans = { t: 0, n }; this.charge = 0;
    const q = this.hand; q.slam = false; q.follow = false;
    if (n === 2) { this.heatT = 1; this.punch(-6); this.shout = { txt: '¡QUÉ PICOR!', t: 0 }; this.after(1.1, () => { this.trans = null; this.next(); }); }
    else { this.heatT = 1; this.shout = null; this.after(1.45, () => { this.trans = null; this.next(); }); }
  }
  burst() {
    if (this.form === 'hand') return;
    this.form = 'hand'; const q = this.hand; q.sc = .15; q.grow = true; q.x = this.x; q.y = 330; q.tx = 940; q.ty = 300; q.k = 6; q.mouth = 1;
    MG.fx.shake(14, .5); MG.fx.flash('#fff6df', .22); sfx('phase');
    this.shout = { txt: '¡RASCA!', t: 0 };
    for (let i = 0; i < 16; i++) this.parts.push({ x: this.x + rand(-100, 120), y: FL - rand(120, 400), vx: rand(-420, 420), vy: rand(-620, -100), g: 1500, t: 0, life: 1.3, type: 'chunk', r: rand(12, 34), rot: rand(0, 6), spin: rand(-8, 8), col: pickCol() });
    this.punch(0);
  }
  onDeath() {
    this.kill(); this.tel = null; this.trans = null; this.deadT = 0;
    this.hand.slam = false; this.hand.follow = false; this.hand.extT = 0; this.hand.ext = 0; this.hand.curl = 0; this.hand.trot = 0; this.hand.rot = 0;
    this.deadCx = this.form === 'hand' ? this.hand.x : this.x; this.deadCy = this.form === 'hand' ? this.hand.y : FL - 250;
    sfx('death');
  }
  dying(dt) {
    const u = this.deadT;
    if (u > .7 && u < 2.6) for (let i = 0; i < 5; i++) this.cream.push({ x: rand(-20, W + 20), y: -20, vy: rand(180, 340), r: rand(8, 20), col: Math.random() < .45 ? '#ffb0cc' : '#fff1f3', t: 0 });
    this.cream = this.cream.filter(c => { c.y += c.vy * dt; c.vy += 300 * dt; return c.y < FL + 6; });
    if (u > .7 && u < 2.3 && Math.floor(u * 8) !== Math.floor((u - dt) * 8)) this.parts.push({ x: this.deadCx + rand(-30, 30), y: this.deadCy + rand(-30, 30), t: 0, life: .4, type: 'dust' });
  }
  deathXf(ctx) {
    const u = this.deadT, cx = this.deadCx, cy = this.deadCy; let s = 1, ox = 0, oy = 0, rot = 0, fy = 1;
    if (u < .7) { s = 1 + .38 * ease.outCubic(u / .7) + Math.sin(u * 70) * .025; rot = Math.sin(u * 40) * .05; }
    else {
      const f = clamp((u - .7) / 1.65, 0, 1);
      s = lerp(1.38, .2, ease.inOut(f)); ox = (Math.sin(f * 9) * 230 - 330 * f) * (.35 + f); oy = -Math.sin(f * Math.PI) * 210 + Math.sin(f * 17) * 40 * (1 - f); rot = Math.sin(f * 21) * .9;
      if (u > 2.35) { const g = clamp((u - 2.35) / .3, 0, 1); oy = lerp(oy, FL - 20 - cy, ease.outCubic(g)); fy = lerp(1, .35, g); rot *= 1 - g; }
    }
    ctx.translate(cx + ox, cy + oy); ctx.rotate(rot); ctx.scale(s, s * fy); ctx.translate(-cx, -cy);
  }
  /* ---- dibujo ---- */
  drawBackground(ctx, t) {
    const px = ((this.arena.player && this.arena.player.x) || 640) - 640;
    ctx.drawImage(BG.far, -40 - px * .012, 0);
    ctx.drawImage(BG.mid, -40 - px * .03, 0);
    // goteo del grifo
    const dt2 = (t * .8) % 1.6, gx = 290 - px * .03 + 0, gy = 344 + dt2 * dt2 * 90;
    if (dt2 > .15 && gy < 440) { ctx.fillStyle = '#7fc4e8'; ctx.beginPath(); ctx.ellipse(gx, gy, 5, 8, 0, 0, 7); ctx.fill(); ctx.strokeStyle = A.ink; ctx.lineWidth = 2; ctx.stroke(); }
    // vapor que sube (3 capas con distinto parallax)
    ctx.save();
    for (let i = 0; i < 9; i++) {
      const k = (t * .06 + i / 9) % 1, x = 120 + (i * 331 % 1100) - px * (.02 + (i % 3) * .015) + Math.sin(t * .9 + i) * 24, y = 600 - k * 560;
      ctx.globalAlpha = Math.sin(k * Math.PI) * .2; ctx.fillStyle = '#fff6df';
      ctx.beginPath(); ctx.arc(x, y, 38 + k * 40, 0, 7); ctx.arc(x + 30, y + 12, 28 + k * 30, 0, 7); ctx.arc(x - 28, y + 14, 26 + k * 28, 0, 7); ctx.fill();
    }
    ctx.restore();
    const sc = this.phase >= 3 || (this.form === 'hand') ? 1 : 0;
    if (sc) { ctx.save(); ctx.globalAlpha = .5; ctx.drawImage(BG.scr, 0, 0); ctx.restore(); }
    // tinte rojo de la comezón
    const hv = clamp(this.heat, 0, 1) * (this.dead ? clamp(1 - this.deadT / 2, 0, 1) : 1);
    if (hv > .01) { ctx.fillStyle = `rgba(210,50,30,${.1 * hv + .04 * hv * Math.sin(t * 5)})`; ctx.fillRect(0, 0, W, H); }
  }
  draw(ctx, t) {
    A.shadow(ctx, this.form === 'hand' ? this.hand.x : this.x, FL + 5, this.form === 'hand' ? 120 * this.hand.sc : 210 * this.sx);
    for (const o of this.hz) if (o.draw && o.kind !== 'nail') o.draw(ctx, o);
    if (this.form === 'flea' && !(this.dead && this.deadT > 2.9)) {
      ctx.save(); if (this.dead) this.deathXf(ctx); this.drawFlea(ctx, t); ctx.restore();
    } else if (this.form === 'hand' && this.hand.sc > .01 && !(this.dead && this.deadT > 2.95)) {
      ctx.save(); if (this.dead) this.deathXf(ctx); this.drawHand(ctx, t); ctx.restore();
    }
    for (const o of this.hz) if (o.kind === 'nail') o.draw(ctx, o);
  }
  drawFlea(ctx, t) {
    const hv = clamp(this.heat, 0, 1), cB = mix('#d4502f', '#ee2a1a', hv), cD = mix('#7a2f1c', '#a3140c', hv), cH = mix('#ea6d42', '#f85a30', hv);
    const fr = this.trans && this.trans.n === 3 ? 3.5 : 1;
    ctx.save(); ctx.translate(this.x, FL); ctx.scale(this.sx, this.sy);
    const sh = (this.trans ? 5 : 0) * Math.sin(t * 60) + (this.tel ? 2 * Math.sin(t * 50) : 0); ctx.translate(sh, 0);
    if (hv > .05) { ctx.globalAlpha = .28 * hv * (.7 + .3 * Math.sin(t * 9)); A.blob(ctx, 20, -265, 270, 245, '#ff6a3c', { line: false, shade: false, wob: 7 }); ctx.globalAlpha = 1; }
    const hips = [[-150, -170], [-85, -135], [-20, -112], [45, -108], [115, -118], [175, -142]], feet = [[-225, 0], [-150, 0], [-70, 0], [20, 0], [105, 0], [190, 0]];
    // patas traseras (más oscuras)
    for (let i = 0; i < 4; i++) { const h = hips[i + 2], fx = feet[i + 2][0] + 38; limb(ctx, [[h[0] + 12, h[1] - 6], [(h[0] + fx) / 2 + (i % 2 ? 40 : -34), -88], [fx, -4]], 12, cD); A.blob(ctx, fx, -2, 15, 7, '#2e120a', { wob: .5, lw: 3, shade: false, points: 10 }); }
    // abdomen
    hairs(ctx, 60, -280, 150, 135, 32, 26, 1.1, A.ink);
    A.blob(ctx, 60, -280, 150, 135, cB, { wob: 2.2, lw: 5.5, seed: 5 });
    ctx.save(); ctx.strokeStyle = 'rgba(60,10,5,.38)'; ctx.lineWidth = 7; ctx.lineCap = 'round';
    for (const k of [.52, .72, .9]) { ctx.beginPath(); ctx.ellipse(40, -280, 150 * k, 135 * .96, 0, -1.05, 1.05); ctx.stroke(); }
    ctx.restore();
    for (const [dx, dy, r] of [[85, -330, 12], [118, -245, 9], [62, -212, 10], [-8, -345, 8], [100, -290, 6]]) { A.blob(ctx, dx, dy, r, r, cD, { wob: .8, lw: 2.5, shade: false, points: 10 }); ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.beginPath(); ctx.arc(dx - 2, dy - 2, 2.4, 0, 7); ctx.fill(); }
    if (hv > .4) { ctx.strokeStyle = 'rgba(255,230,120,.85)'; ctx.lineWidth = 4; ctx.beginPath(); for (let i = 0; i < 4; i++) { const x = 60 + i * 30 - 30, y = -345; ctx.moveTo(x, y); ctx.lineTo(x + 8, y - 12); ctx.lineTo(x - 2, y - 24); } ctx.stroke(); }
    if (this.crackK > 0 && this.form === 'flea') {
      ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      const pts = [[40, -420], [60, -370], [28, -330], [76, -285], [30, -240], [72, -195], [50, -150]], n = Math.ceil(pts.length * this.crackK);
      ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < n; i++) ctx.lineTo(pts[i][0] + A.j(i, 3), pts[i][1]);
      ctx.strokeStyle = '#ffe9a0'; ctx.lineWidth = 14; ctx.stroke(); ctx.strokeStyle = A.ink; ctx.lineWidth = 6; ctx.stroke(); ctx.restore();
    }
    // pata que rasca el abdomen
    const nails = this.tel && this.tel.kind === 'nails' ? 1 : 0;
    const s1 = [96 + Math.sin(t * 15 * fr + 1) * 20, -300 + Math.cos(t * 12 * fr) * 12 - nails * 70];
    limb(ctx, [[40, -140], [-10 - nails * 20, -222 - nails * 30], [s1[0] - 14, s1[1] + 8]], 14, cD); A.glove(ctx, s1[0], s1[1], 16, -.9 + Math.sin(t * 15 * fr) * .5);
    // patas delanteras
    for (let i = 2; i < 6; i++) { const h = hips[i], f = feet[i], fx = f[0] + Math.sin(t * 2 + i) * 3; limb(ctx, [[h[0], h[1]], [(h[0] + fx) / 2 + (i < 4 ? -30 : 34), -84], [fx, -4]], 14, cD); A.blob(ctx, fx, -2, 21, 9, '#3b170d', { wob: .6, lw: 3.5, shade: false, points: 10 }); }
    // cabeza
    const hd = this.charge * 6;
    hairs(ctx, -110, -250, 108 + hd, 94 + hd, 22, 20, 2.3, A.ink);
    A.blob(ctx, -110, -250, 108 + hd, 94 + hd, cH, { wob: 2, lw: 5.5, seed: 11 });
    for (const s of [0, 1]) { const bx = -160 + s * 50, sw = Math.sin(t * 5 + s * 2) * 9 * fr; A.hose(ctx, bx, -332, bx - 8 + sw, -400 + Math.abs(sw) * .3, s ? 14 : -14, 7, cD); A.blob(ctx, bx - 8 + sw, -404, 9.5, 9.5, '#2e120a', { wob: .5, lw: 3, shade: false, points: 10 }); }
    const pl = this.arena.player, lx = clamp((pl.x - (this.x - 110)) / 400, -1, 1), ly = clamp((pl.y - 60 - (FL - 250)) / 250, -1, 1);
    eyesA(ctx, -124, -270, 48 + this.charge * 5, lx, ly, true);
    if (hv > .2) { ctx.strokeStyle = `rgba(215,20,20,${hv})`; ctx.lineWidth = 2.6; ctx.beginPath(); for (const s of [-1, 1]) { const ex = -124 + s * 30; for (let i = 0; i < 3; i++) { ctx.moveTo(ex + s * 19, -270 - 8 + i * 8); ctx.lineTo(ex + s * 6, -270 + i * 6 - 5); } } ctx.stroke(); }
    const open = clamp(Math.max(this.mouth, this.charge * .7), 0, 1);
    grin(ctx, -122, -204 + this.charge * 4, 128 + open * 10, open);
    if (hv > .35) { ctx.strokeStyle = '#8a1010'; ctx.lineWidth = 5.5; ctx.lineCap = 'round'; const vx = -56 + Math.sin(t * 8) * 1.5, vy = -318; ctx.beginPath(); ctx.moveTo(vx - 11, vy); ctx.quadraticCurveTo(vx, vy - 10, vx - 2, vy - 17); ctx.moveTo(vx + 11, vy); ctx.quadraticCurveTo(vx, vy + 10, vx + 2, vy + 17); ctx.stroke(); }
    // pata que rasca la cabeza
    const s0 = [-168 + Math.sin(t * 17 * fr) * 14, -338 + Math.cos(t * 13 * fr) * 10 - nails * 60];
    limb(ctx, [[-165, -176], [-262, -262 - nails * 20], [s0[0] - 6, s0[1] + 10]], 14, cD); A.glove(ctx, s0[0], s0[1], 16, -.6 + Math.sin(t * 17 * fr) * .5);
    ctx.strokeStyle = A.ink; ctx.lineWidth = 3.2; ctx.beginPath();
    for (const s of [s0, s1]) for (let i = 0; i < 3; i++) { const o = (Math.floor(t * 14) + i) % 3 - 1; ctx.moveTo(s[0] - 26 + i * 6, s[1] - 24 + o * 3); ctx.lineTo(s[0] - 14 + i * 6, s[1] - 12 + o * 3); } ctx.stroke();
    if (nails) { ctx.save(); ctx.globalAlpha = .5 * (.5 + .5 * Math.sin(t * 30)); for (const s of [s0, s1]) A.blob(ctx, s[0], s[1], 28, 28, '#ffe9a0', { wob: 2, line: false, shade: false }); ctx.restore(); }
    if (this.flash > 0) {
      ctx.globalAlpha = .4; A.blob(ctx, 60, -280, 150, 135, A.cream, { wob: 2.2, line: false, shade: false, seed: 5 }); A.blob(ctx, -110, -250, 108 + hd, 94 + hd, A.cream, { wob: 2, line: false, shade: false, seed: 11 }); ctx.globalAlpha = 1;
    }
    if (this.charge > .1) { ctx.globalAlpha = this.charge * .3 * (.6 + .4 * Math.sin(t * 40)); A.blob(ctx, -110, -250, 116, 102, '#ffd36e', { line: false, shade: false, wob: 3 }); ctx.globalAlpha = 1; }
    ctx.restore();
  }
  drawHand(ctx, t) {
    const q = this.hand, skin = mix('#e8957a', '#e0553a', clamp(this.heat, 0, 1) * .6 + q.glow * .4), skinD = '#b3402c';
    const tips = this.fingerTips();
    ctx.save(); ctx.translate(q.x, q.y);
    const stun = q.stun > 0 ? Math.sin(t * 60) * 3 : 0, bounce = 1 + this.sqx * .3;
    ctx.translate(stun, 0); ctx.rotate(q.rot); ctx.scale(q.sc * (1 - this.sqx * .2), q.sc * bounce);
    // brazo (viene de fuera de la pantalla)
    if (!(this.dead && this.deadT > .12)) A.hose(ctx, 0, -70, 20 * Math.sin(t * 1.4), -1000, 90, 74, skin);
    rr(ctx, -62, -128, 124, 40, 12); ctx.fillStyle = '#c9a24a'; ctx.fill(); inkStroke(ctx, 5);
    ctx.fillStyle = A.ink; ctx.fillRect(-62, -112, 124, 4); ctx.fillRect(-62, -100, 124, 4);
    // pulgar
    const th = [112, 12, 168 + Math.sin(t * 3) * 6, 96];
    A.hose(ctx, 80, 22, th[2], th[3], -14, 32, skin); claw(ctx, th[2] - 4, th[3] - 2, .95, 46, 26, q.glow);
    // dedos
    for (const f of tips) {
      A.hose(ctx, f.bx, f.by, f.x, f.y, (f.i % 2 ? 1 : -1) * 12, 38, skin);
      claw(ctx, f.x - Math.sin(f.ang) * 4, f.y - Math.cos(f.ang) * 4, Math.PI / 2 - f.ang, 52, 30, q.glow);
      ctx.strokeStyle = skinD; ctx.lineWidth = 3; ctx.beginPath(); const mx = (f.bx + f.x) / 2, my = (f.by + f.y) / 2; ctx.moveTo(mx - 8, my - 4); ctx.lineTo(mx + 8, my - 4); ctx.stroke();
    }
    // palma
    A.blob(ctx, 0, 0, 104, 94, skin, { wob: 2, lw: 5.5, seed: 21 });
    ctx.save(); ctx.strokeStyle = 'rgba(140,25,20,.75)'; ctx.lineWidth = 4.5; ctx.lineCap = 'round';
    for (const [x0, y0] of [[-70, -62], [40, -70], [58, 14]]) for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(x0 + i * 9, y0 + A.j(i, 1)); ctx.lineTo(x0 + 24 + i * 9, y0 + 28); ctx.stroke(); }
    ctx.restore();
    // cara (siempre derecha)
    ctx.save(); ctx.rotate(-q.rot); ctx.scale(1 / (1 - this.sqx * .2), 1 / bounce);
    const pl = this.arena.player, lx = clamp((pl.x - q.x) / 350, -1, 1), ly = clamp((pl.y - 60 - q.y) / 250, -1, 1);
    if (q.stun > 0) { for (const s of [-1, 1]) { const ex = s * 25; ctx.strokeStyle = A.ink; ctx.lineWidth = 4; ctx.beginPath(); for (let i = 0; i < 14; i++) { const a = i * .9 + t * 8, r = 3 + i * 1.5; ctx.lineTo(ex + Math.cos(a) * r, -14 + Math.sin(a) * r); } ctx.stroke(); } }
    else eyesA(ctx, 0, -16, 44 + q.glow * 4, lx, ly, true);
    grin(ctx, 0, 40, 100, Math.max(q.mouth, q.glow * .6));
    ctx.restore();
    if (this.flash > 0) { ctx.globalAlpha = .4; A.blob(ctx, 0, 0, 104, 94, A.cream, { wob: 2, line: false, shade: false, seed: 21 }); ctx.globalAlpha = 1; }
    ctx.restore();
  }
  drawForeground(ctx, t) {
    for (const s of this.steam) { ctx.save(); ctx.globalAlpha = (1 - s.t / s.life) * .6; A.blob(ctx, s.x, s.y - s.t * 70, s.r * (1 + s.t), s.r * (1 + s.t), '#fff6df', { wob: 1.5, lw: 2.5, shade: false }); ctx.restore(); }
    for (const p of this.parts) {
      const k = p.t / p.life;
      if (p.type === 'dust') { ctx.save(); ctx.globalAlpha = 1 - k; for (const d of [-1, 1]) A.blob(ctx, p.x + d * (24 + k * 70), p.y - 10 - k * 20, 16 + k * 22, 12 + k * 14, A.cream, { wob: 2, lw: 3, shade: false }); ctx.restore(); }
      else if (p.type === 'zig') { ctx.save(); ctx.globalAlpha = 1 - k; ctx.translate(p.x + p.vx * p.t, p.y + p.vy * p.t); ctx.strokeStyle = '#ffd36e'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(8, -10); ctx.lineTo(-4, -18); ctx.lineTo(6, -30); ctx.stroke(); ctx.restore(); }
      else if (p.type === 'chunk') { ctx.save(); ctx.globalAlpha = 1 - k * k; ctx.translate(p.x, p.y); ctx.rotate(p.rot); A.blob(ctx, 0, 0, p.r, p.r * .7, p.col, { wob: 2, lw: 3.5, points: 8 }); ctx.restore(); }
    }
    for (const c of this.cream) { ctx.fillStyle = c.col; ctx.beginPath(); ctx.moveTo(c.x, c.y - c.r * 1.5); ctx.quadraticCurveTo(c.x + c.r, c.y, c.x, c.y + c.r * .7); ctx.quadraticCurveTo(c.x - c.r, c.y, c.x, c.y - c.r * 1.5); ctx.fill(); ctx.strokeStyle = A.ink; ctx.lineWidth = 2; ctx.stroke(); }
    if (this.dead && this.deadT > 2.3) {   // charco de crema
      const k = clamp((this.deadT - 2.3) / .6, 0, 1); A.blob(ctx, this.deadCx - 200, FL + 6, 180 * k, 18 * k, '#ffd1df', { wob: 3, lw: 3.5, shade: false }); A.blob(ctx, this.deadCx - 330, FL + 6, 90 * k, 12 * k, '#fff1f3', { wob: 3, lw: 3, shade: false });
    }
    if (this.shout) {
      this.shout.t += 1 / 60; const s = this.shout, k = ease.outElastic(clamp(s.t / .5, 0, 1));
      if (s.t < 1.3) { ctx.save(); ctx.translate(W * .5, H * .32); ctx.rotate(-.07); ctx.scale(k, k); ctx.globalAlpha = clamp(1.3 - s.t, 0, 1) * 1.2; A.text(ctx, s.txt, 0, 0, 96, { fill: '#ffd36e', lw: 14 }); ctx.restore(); }
    }
  }
}
function pickCol() { return MG.pick(['#a9522f', '#e2301d', '#c0643c', '#6f2f1e']); }

MG.registerBoss({
  id: 'rasquina', nombre: 'La Rasquiña', area: 'Piel', intro: '¡Rasca, rasca, que no pasa nada!', music: 'rasquina', parTime: 110, color: '#d8432e',
  mapIcon(ctx, x, y, s, t) {
    t = t || 0; ctx.save(); ctx.translate(x, y + Math.sin(t * 3) * 2 * s); ctx.scale(s, s);
    for (const dx of [-24, -10, 6, 22]) { A.hose(ctx, dx, 12, dx + (dx < 0 ? -8 : 8), 30, dx % 12 ? 6 : -6, 6, '#6f2f1e'); }
    hairs(ctx, 6, 0, 30, 26, 14, 8, 1, A.ink);
    A.blob(ctx, 6, 0, 30, 26, '#d8432e', { wob: 1.2, lw: 4 });
    A.blob(ctx, -22, -6, 19, 17, '#ee6a43', { wob: 1, lw: 4 });
    A.eyes(ctx, -24, -9, 14, -.5, 0, 'angry');
    ctx.strokeStyle = A.ink; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(-24, 4, 8, .2, Math.PI - .2); ctx.stroke();
    ctx.restore();
  },
  create(arena, opts) { return new Rasquina(arena, opts); }
});
})();
