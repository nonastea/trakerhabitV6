/* ==========================================================================
   EL PANTALLÓN — jefe 2 (Sueño). Un televisor viejo con patas de manguera que
   se raja en un ojo insomne y acaba como despertador monstruoso.
   ========================================================================== */
(function () {
'use strict';
const MG = window.MG, A = MG.art, W = 1280, H = 720, FL = 620;
const clamp = MG.clamp, lerp = MG.lerp, rand = MG.rand, ease = MG.ease;
const sfx = n => { try { MG.audio && MG.audio.sfx && MG.audio.sfx(n); } catch (e) {} };
const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const mix = (a, b, k) => { const x = hex(a), y = hex(b); return `rgb(${Math.round(lerp(x[0], y[0], k))},${Math.round(lerp(x[1], y[1], k))},${Math.round(lerp(x[2], y[2], k))})`; };
const BLUE = '#5cc8ff', PINK = A.pink;

/* ------------------------------ utilidades de dibujo ------------------------------ */
function mk(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
function inkStroke(c, lw) { c.strokeStyle = A.ink; c.lineWidth = lw || 4; c.lineJoin = 'round'; c.lineCap = 'round'; c.stroke(); }
// superelipse temblorosa (forma de tele CRT)
function sup(c, cx, cy, a, b, n, seed, wob) {
  const N = 44; c.beginPath();
  for (let i = 0; i <= N; i++) {
    const th = i / N * Math.PI * 2, ct = Math.cos(th), st = Math.sin(th), k = i % N;
    const x = cx + a * Math.sign(ct) * Math.pow(Math.abs(ct), 2 / n) + A.j(k + seed, wob), y = cy + b * Math.sign(st) * Math.pow(Math.abs(st), 2 / n) + A.j(k + seed + 9, wob);
    i ? c.lineTo(x, y) : c.moveTo(x, y);
  }
  c.closePath();
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
function shoe(c, x, y, s, col) { A.blob(c, x, y, 34 * s, 15 * s, col, { wob: .8, lw: 4, points: 12 }); A.blob(c, x + 12 * s, y - 4 * s, 12 * s, 5 * s, 'rgba(255,255,255,.5)', { line: false, shade: false, wob: 0, points: 8 }); }
// boca de estática (misma forma que la sonrisa)
let NOISE = null;
function staticMouth(c, cx, cy, w, open, off) {
  const x0 = cx - w / 2, x1 = cx + w / 2, y0 = cy - w * .05, d = w * .17 + open * w * .3, uy = y0 - w * .06 + open * w * .04;
  c.save(); c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo(cx, y0 + d * 2, x1, y0); c.quadraticCurveTo(cx, uy * 2 - y0, x0, y0); c.closePath();
  c.fillStyle = '#222'; c.fill(); c.clip();
  c.drawImage(NOISE, cx - w / 2 - off[0], cy - 36 - off[1], 256, 128);
  c.restore();
  c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo(cx, y0 + d * 2, x1, y0); c.quadraticCurveTo(cx, uy * 2 - y0, x0, y0); c.closePath(); inkStroke(c, 4.5);
}
// ---- iconos de notificación
function notif(c, kind, x, y, s, t) {
  c.save(); c.translate(x, y); c.scale(s, s);
  if (kind === 'heart') {
    c.beginPath(); c.moveTo(0, 18); c.bezierCurveTo(-34, -4, -22, -30, 0, -14); c.bezierCurveTo(22, -30, 34, -4, 0, 18); c.closePath();
    c.fillStyle = PINK; c.fill(); inkStroke(c, 4.5); c.fillStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.ellipse(-12, -13, 5, 3, -.7, 0, 7); c.fill();
  } else if (kind === 'bell') {
    c.rotate(Math.sin(t * 18) * .25);
    c.beginPath(); c.moveTo(-22, 14); c.quadraticCurveTo(-18, -24, 0, -24); c.quadraticCurveTo(18, -24, 22, 14); c.closePath(); c.fillStyle = '#f2c14e'; c.fill(); inkStroke(c, 4.5);
    c.beginPath(); c.ellipse(0, 17, 25, 6, 0, 0, 7); c.fillStyle = '#e1a92e'; c.fill(); inkStroke(c, 3.5);
    c.beginPath(); c.arc(0, 24, 5, 0, 7); c.fillStyle = A.ink; c.fill();
    c.beginPath(); c.arc(0, -26, 4, 0, 7); c.fillStyle = '#f2c14e'; c.fill(); inkStroke(c, 3);
    c.fillStyle = 'rgba(255,255,255,.6)'; c.fillRect(-12, -14, 4, 18);
    c.beginPath(); c.arc(17, -20, 11, 0, 7); c.fillStyle = A.red; c.fill(); inkStroke(c, 3); c.fillStyle = '#fff'; c.font = "bold 13px 'Lilita One', Arial"; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('1', 17, -19);
  } else if (kind === 'chat') {
    c.beginPath(); c.moveTo(-26, -16); c.quadraticCurveTo(-26, -24, -18, -24); c.lineTo(18, -24); c.quadraticCurveTo(26, -24, 26, -16); c.lineTo(26, 6); c.quadraticCurveTo(26, 14, 18, 14); c.lineTo(-6, 14); c.lineTo(-18, 26); c.lineTo(-16, 14); c.lineTo(-18, 14); c.quadraticCurveTo(-26, 14, -26, 6); c.closePath();
    c.fillStyle = '#4f8fc0'; c.fill(); inkStroke(c, 4.5); c.fillStyle = '#fff';
    for (const dx of [-12, 0, 12]) { c.beginPath(); c.arc(dx, -5 + Math.sin(t * 10 + dx) * 2, 3.6, 0, 7); c.fill(); }
  } else {   // +99
    rr(c, -30, -17, 60, 34, 17); c.fillStyle = A.red; c.fill(); inkStroke(c, 4.5);
    c.fillStyle = '#fff'; c.font = "bold 22px 'Lilita One', Arial"; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = 3; c.strokeStyle = A.ink; c.strokeText('+99', 0, 1); c.fillText('+99', 0, 1);
  }
  c.restore();
}
function sheep(c, x, y, s, t, num) {
  c.save(); c.translate(x, y); c.scale(s, s);
  for (const dx of [-14, 10]) { const l = Math.sin(t * 14 + dx) * 3; A.hose(c, dx, 14, dx + l, 28, 0, 5, A.ink); }
  for (const [dx, dy, r] of [[-18, 2, 17], [0, -10, 20], [18, 0, 17], [-4, 10, 17], [12, 11, 14]]) A.blob(c, dx, dy, r, r, '#ffc3d9', { wob: 1, lw: 3.5, shade: false, points: 12, seed: dx });
  A.blob(c, -26, 0, 12, 14, '#5b3a4a', { wob: .6, lw: 3, shade: false, points: 10 });
  c.fillStyle = '#fff'; c.beginPath(); c.arc(-30, -3, 3, 0, 7); c.fill(); c.fillStyle = A.ink; c.beginPath(); c.arc(-31, -3, 1.5, 0, 7); c.fill();
  c.restore();
  if (num) { c.save(); c.globalAlpha = .95; A.text(c, String(num), x, y - 42 * s, 22, { font: 'ui', fill: '#fff', lw: 5 }); c.restore(); }
}
function zzz(c, x, y, s, t) {
  c.save(); c.translate(x, y); c.rotate(Math.sin(t * 4) * .2); c.scale(s, s);
  A.text(c, 'Z', 0, 0, 52, { fill: PINK, lw: 8 }); c.restore();
}

/* ------------------------------ escenario ------------------------------ */
let BG = null;
const STARS = []; for (let i = 0; i < 46; i++) STARS.push([150 + Math.random() * 240, 70 + Math.random() * 270, Math.random() * 6, .6 + Math.random() * 1.6]);
function buildBG() {
  BG = {};
  NOISE = mk(128, 64); { const g = NOISE.getContext('2d'), id = g.createImageData(128, 64); for (let i = 0; i < id.data.length; i += 4) { const v = Math.random() < .5 ? 255 : 30 + Math.random() * 90; id.data[i] = v; id.data[i + 1] = v; id.data[i + 2] = Math.min(255, v + 25); id.data[i + 3] = 255; } g.putImageData(id, 0, 0); }
  // ---- pared + piso
  const far = mk(1360, 720), g = far.getContext('2d'); g.translate(40, 0);
  let gr = g.createLinearGradient(0, 0, 0, 560); gr.addColorStop(0, '#16206a'); gr.addColorStop(1, '#2c408f'); g.fillStyle = gr; g.fillRect(-40, 0, 1360, 570);
  for (let x = -40; x < 1320; x += 76) { g.fillStyle = 'rgba(150,170,255,.05)'; g.fillRect(x, 0, 38, 556); }
  for (let y = 30; y < 540; y += 70) for (let x = -10 + ((y / 70) % 2) * 38; x < 1320; x += 76) { g.fillStyle = 'rgba(190,205,255,.16)'; g.beginPath(); for (let i = 0; i < 10; i++) { const a = i / 10 * 6.283 - 1.57, r = i % 2 ? 3 : 7; g[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * r, y + Math.sin(a) * r); } g.fill(); }
  g.fillStyle = '#2d2347'; g.fillRect(-40, 546, 1360, 20); g.strokeStyle = A.ink; g.lineWidth = 4; g.strokeRect(-44, 546, 1368, 20);
  const vy = 230, N = 8, z1 = (566 - vy) / (720 - vy), yk = k => vy + (566 - vy) / (1 + (z1 - 1) * k / N);
  g.fillStyle = '#2a2038'; g.fillRect(-40, 566, 1360, 160);
  for (let j = -12; j < 12; j++) {
    const xb = (jj, y) => 640 + jj * 150 * (y - vy) / (720 - vy);
    g.beginPath(); g.moveTo(xb(j, 566), 566); g.lineTo(xb(j + 1, 566), 566); g.lineTo(xb(j + 1, 720), 720); g.lineTo(xb(j, 720), 720); g.closePath(); g.fillStyle = j % 2 ? '#34294d' : '#2b2140'; g.fill();
    g.strokeStyle = 'rgba(10,6,20,.8)'; g.lineWidth = 2.5; g.stroke();
  }
  g.strokeStyle = 'rgba(10,6,20,.35)'; g.lineWidth = 2;
  for (let k = 1; k < N; k += 2) { g.beginPath(); g.moveTo(-40, yk(k)); g.lineTo(1320, yk(k)); g.stroke(); }
  gr = g.createLinearGradient(0, 566, 0, 720); gr.addColorStop(0, 'rgba(5,5,25,.5)'); gr.addColorStop(1, 'rgba(5,5,25,0)'); g.fillStyle = gr; g.fillRect(-40, 566, 1360, 154);
  // ventana (hueco)
  rr(g, 150, 70, 240, 270, 10); g.fillStyle = '#142560'; g.fill();
  // reloj de pared: 3:00
  g.save(); g.translate(660, 118);
  g.beginPath(); g.arc(0, 0, 64, 0, 7); g.fillStyle = '#c9a24a'; g.fill(); inkStroke(g, 5);
  g.beginPath(); g.arc(0, 0, 52, 0, 7); g.fillStyle = '#f3e5c8'; g.fill(); inkStroke(g, 4);
  for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; g.beginPath(); g.moveTo(Math.cos(a) * 42, Math.sin(a) * 42); g.lineTo(Math.cos(a) * 49, Math.sin(a) * 49); g.lineWidth = i % 3 ? 3 : 5; g.strokeStyle = A.ink; g.stroke(); }
  g.lineCap = 'round'; g.strokeStyle = A.ink; g.lineWidth = 6; g.beginPath(); g.moveTo(0, 0); g.lineTo(30, 0); g.stroke(); g.lineWidth = 4; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -40); g.stroke();
  g.beginPath(); g.arc(0, 0, 5, 0, 7); g.fillStyle = A.red; g.fill();
  g.restore();
  BG.far = far;
  // ---- marco de la ventana + cortinas (capa con transparencia)
  const win = mk(1360, 720), w = win.getContext('2d'); w.translate(40, 0);
  w.strokeStyle = '#6b4a2e'; w.lineWidth = 16; rr(w, 150, 70, 240, 270, 10); w.stroke(); w.strokeStyle = A.ink; w.lineWidth = 3; rr(w, 142, 62, 256, 286, 12); w.stroke(); rr(w, 158, 78, 224, 254, 6); w.stroke();
  w.fillStyle = '#6b4a2e'; w.fillRect(262, 72, 16, 266); w.fillRect(152, 196, 236, 14); w.strokeStyle = A.ink; w.lineWidth = 3; w.strokeRect(262, 72, 16, 266); w.strokeRect(152, 196, 236, 14);
  rr(w, 130, 340, 280, 22, 6); w.fillStyle = '#7b5a3c'; w.fill(); inkStroke(w, 4);
  for (const [x0, dir] of [[96, 1], [444, -1]]) {
    w.beginPath(); w.moveTo(x0, 50); w.quadraticCurveTo(x0 + dir * 50, 120, x0 + dir * 30, 250); w.quadraticCurveTo(x0 + dir * 40, 330, x0 + dir * 8, 400); w.lineTo(x0 - dir * 40, 400); w.lineTo(x0 - dir * 40, 50); w.closePath();
    w.fillStyle = '#6e2f5e'; w.fill(); inkStroke(w, 4.5);
    w.strokeStyle = 'rgba(30,5,30,.45)'; w.lineWidth = 5; for (const k of [-.5, .1]) { w.beginPath(); w.moveTo(x0 + dir * k * 40, 60); w.quadraticCurveTo(x0 + dir * (k * 40 + 24), 200, x0 + dir * (k * 40 + 8), 390); w.stroke(); }
  }
  w.beginPath(); w.moveTo(60, 56); w.lineTo(480, 56); w.lineWidth = 12; w.strokeStyle = '#c9a24a'; w.stroke(); w.lineWidth = 3; w.strokeStyle = A.ink; w.beginPath(); w.moveTo(60, 48); w.lineTo(480, 48); w.moveTo(60, 64); w.lineTo(480, 64); w.stroke();
  BG.win = win;
  // ---- cama gigante al fondo
  const mid = mk(1360, 720), m = mid.getContext('2d'); m.translate(40, 0);
  rr(m, 470, 236, 440, 240, 40); m.fillStyle = '#6b4a2e'; m.fill(); inkStroke(m, 5.5);
  rr(m, 490, 256, 400, 200, 30); m.fillStyle = '#7b5a3c'; m.fill(); inkStroke(m, 3.5);
  for (const bx of [520, 860]) { rr(m, bx - 16, 196, 32, 60, 10); m.fillStyle = '#6b4a2e'; m.fill(); inkStroke(m, 5); m.beginPath(); m.arc(bx, 192, 15, 0, 7); m.fillStyle = '#c9a24a'; m.fill(); inkStroke(m, 4); }
  // almohada
  m.beginPath(); m.moveTo(520, 440); m.quadraticCurveTo(500, 340, 600, 330); m.quadraticCurveTo(700, 305, 800, 335); m.quadraticCurveTo(880, 350, 850, 440); m.quadraticCurveTo(690, 462, 520, 440); m.closePath();
  m.fillStyle = '#f3ecdf'; m.fill(); inkStroke(m, 5.5); m.strokeStyle = 'rgba(120,130,190,.5)'; m.lineWidth = 4; m.beginPath(); m.moveTo(560, 400); m.quadraticCurveTo(690, 380, 820, 400); m.moveTo(570, 360); m.quadraticCurveTo(690, 345, 800, 360); m.stroke();
  // cobija
  m.beginPath(); m.moveTo(430, 450); m.quadraticCurveTo(440, 420, 520, 424); m.quadraticCurveTo(700, 450, 880, 424); m.quadraticCurveTo(960, 420, 970, 450); m.lineTo(985, 556); m.lineTo(416, 556); m.closePath();
  m.fillStyle = '#4a6fc0'; m.fill(); inkStroke(m, 5.5);
  m.save(); m.clip(); for (let r = 0; r < 5; r++) for (let c = 0; c < 12; c++) { const x = 420 + c * 50 + (r % 2) * 25, y = 440 + r * 28; m.beginPath(); m.moveTo(x, y - 14); m.lineTo(x + 25, y); m.lineTo(x, y + 14); m.lineTo(x - 25, y); m.closePath(); m.fillStyle = (r + c) % 2 ? '#7aa0e8' : '#3c5aa8'; m.fill(); m.lineWidth = 2; m.strokeStyle = 'rgba(10,10,40,.6)'; m.stroke(); } m.restore();
  m.fillStyle = '#f3e5c8'; m.beginPath(); m.moveTo(416, 450); m.quadraticCurveTo(700, 470, 985, 450); m.lineTo(988, 480); m.quadraticCurveTo(700, 502, 413, 480); m.closePath(); m.fill(); inkStroke(m, 4.5);
  for (const bx of [450, 950]) { rr(m, bx - 18, 540, 36, 26, 8); m.fillStyle = '#6b4a2e'; m.fill(); inkStroke(m, 4.5); }
  BG.mid = mid;
  // ---- sprites de luz (se dibujan sin crear degradados por cuadro)
  const gl = mk(256, 256), q = gl.getContext('2d'); gr = q.createRadialGradient(128, 128, 5, 128, 128, 128); gr.addColorStop(0, 'rgba(110,205,255,.8)'); gr.addColorStop(.35, 'rgba(70,160,255,.34)'); gr.addColorStop(1, 'rgba(40,90,255,0)'); q.fillStyle = gr; q.fillRect(0, 0, 256, 256); BG.glow = gl;
  const gf = mk(512, 128), q2 = gf.getContext('2d'); q2.scale(1, .25); gr = q2.createRadialGradient(256, 256, 10, 256, 256, 256); gr.addColorStop(0, 'rgba(120,210,255,.75)'); gr.addColorStop(1, 'rgba(60,130,255,0)'); q2.fillStyle = gr; q2.fillRect(0, 0, 512, 512); BG.floorGlow = gf;
  const bm = mk(64, 720), q3 = bm.getContext('2d'); gr = q3.createLinearGradient(0, 0, 0, 720); gr.addColorStop(0, 'rgba(160,230,255,0)'); gr.addColorStop(.35, 'rgba(190,240,255,.85)'); gr.addColorStop(.5, 'rgba(255,255,255,1)'); gr.addColorStop(.65, 'rgba(190,240,255,.85)'); gr.addColorStop(1, 'rgba(160,230,255,0)'); q3.fillStyle = gr; q3.fillRect(0, 0, 64, 720); BG.beam = bm;
  const wk = mk(256, 256), q4 = wk.getContext('2d'); gr = q4.createRadialGradient(128, 128, 5, 128, 128, 128); gr.addColorStop(0, 'rgba(255,215,120,.85)'); gr.addColorStop(1, 'rgba(255,150,60,0)'); q4.fillStyle = gr; q4.fillRect(0, 0, 256, 256); BG.warm = wk;
}

/* ------------------------------ el jefe ------------------------------ */
class Pantallon extends MG.Boss {
  constructor(arena, opts) {
    super(arena, { hp: 1400, phases: [.66, .33], difficulty: opts.difficulty, x: 960, y: FL });
    if (!BG) buildBG();
    this.bx = 960; this.by = 0; this.form = 'tv'; this.sqx = 0; this.sqv = 0; this.charge = 0; this.tel = null; this.hitK = 0; this.mouth = 0; this.trans = null;
    this.hz = []; this.parts = []; this.smoke = []; this.deadT = 0; this.last = ''; this.shout = null; this.it = 0; this.sx = 1; this.sy = 1;
    this.crack = 0; this.eyeOpen = 0; this.lid = 0; this.blinkT = 2; this.look = { x: 0, y: 0 }; this.noiseOff = [0, 0]; this.nz = 0;
    this.clockSc = 0; this.ring = 0; this.mv = null; this.stars = 0; this.hide = false; this.dazed = 0; this.light = 1; this.sheepN = 0;
  }
  get TD() { return .62 / (.85 + .15 * this.difficulty); }
  get sp() { return .92 + .08 * this.difficulty; }
  pt(lx, ly) { return { x: this.bx + lx * this.sx, y: FL + this.by + ly * this.sy }; }
  punch(v) { this.sqv += v; }
  tele(dur, fn, kind) { this.tel = { t: 0, dur, kind }; this.after(dur, () => { this.tel = null; fn(); }); }
  add(o) { o.t = 0; this.hz.push(o); return o; }
  kill() { this.arena.enemyProj.forEach(p => { p.dead = true; }); this.hz.length = 0; this.mv = null; }
  takeDamage(n) { if (this.dead) return; super.takeDamage(n); this.hitK = 1; }
  get faceC() { return this.form === 'clock' ? [0, -290] : [-34, -266]; }

  start() { this.after(.6, () => this.next()); }
  next() {
    if (this.dead || this.trans) return;
    const pool = this.form === 'clock' ? ['atkOndas', 'atkSalto', 'atkZzz', 'atkOndas'] : this.phase === 2 ? ['atkScroll', 'atkNotifs', 'atkOvejas', 'atkScroll'] : ['atkNotifs', 'atkRayo', 'atkPopups'];
    let a, n = 0; do { a = MG.pick(pool); n++; } while (a === this.last && n < 8);
    this.last = a; this[a]();
  }
  fin(sec) { this.after(sec, () => this.next()); }
  introUpdate(dt) {
    this.it += dt; this.t += dt; this.mouth = .5 + .5 * Math.sin(this.it * 17);
    if (Math.floor(this.it * 3.1) !== Math.floor((this.it - dt) * 3.1)) this.punch(2.6);
    this.spring(dt); this.calc(); this.boxes();
  }
  spring(dt) { this.sqv += (-150 * this.sqx - 8.5 * this.sqv) * dt; this.sqx = clamp(this.sqx + this.sqv * dt, -.45, .45); }
  calc() {
    const t = this.t, sc = (this.form === 'clock' ? this.clockSc * 1.1 : 1.12);
    this.sx = (1 - this.sqx * .6 + .02 * Math.sin(t * 3.1)) * (1 + .08 * this.charge) * sc - .025 * this.hitK + (this.trans ? .02 * Math.sin(t * 70) : 0);
    this.sy = (1 + this.sqx + .03 * Math.sin(t * 4.3 + 1)) * (1 - .18 * this.charge) * sc - .02 * this.hitK;
  }
  boxes() {
    const hb = [], xb = [];
    if (this.dead) { this.hurtboxes = []; this.hitboxes = []; return; }
    const k = (this.sx + this.sy) / 2;
    if (this.form === 'tv') {
      const a = this.pt(-34, -266), b = this.pt(70, -230);
      const lg = this.pt(0, -70);
      hb.push({ x: a.x, y: a.y, r: 118 * k }, { x: b.x, y: b.y, r: 80 * k }, { x: lg.x, y: lg.y, r: 66 * k });
      xb.push({ x: a.x, y: a.y, r: 96 * k }, { x: b.x, y: b.y, r: 62 * k });
    } else if (this.clockSc > .3 && !this.hide) {
      const a = this.pt(0, -290);
      const lg = this.pt(0, -70);
      hb.push({ x: a.x, y: a.y, r: 138 * k }, { x: lg.x, y: lg.y, r: 62 * k });
      xb.push({ x: a.x, y: a.y, r: 118 * k });
    }
    for (const o of this.hz) if (o.rect) { const r = o.rect(); if (r) { if (r.length) xb.push(...r); else xb.push(r); } }
    this.hurtboxes = hb; this.hitboxes = xb;
  }
  update(dt) {
    this.baseUpdate(dt);
    const t = this.t;
    this.hitK = Math.max(0, this.hitK - dt * 9);
    this.spring(dt);
    this.charge = lerp(this.charge, this.tel ? 1 : 0, 1 - Math.exp(-dt * (this.tel ? 9 : 18)));
    if (this.tel) this.tel.t += dt;
    this.mouth = Math.max(0, this.mouth - dt * 2.4);
    this.ring = Math.max(0, this.ring - dt * 1.6);
    this.dazed = Math.max(0, this.dazed - dt);
    if (Math.random() < .4) this.noiseOff = [Math.random() * 120, Math.random() * 60];
    // movimiento programado (saltos del despertador)
    if (this.mv) {
      const m = this.mv; m.t += dt; const k = clamp(m.t / m.dur, 0, 1), e = m.ease ? m.ease(k) : k;
      this.bx = lerp(m.x0, m.x1, e); this.by = lerp(m.y0, m.y1, e) - (m.arc || 0) * Math.sin(Math.PI * k);
      if (k >= 1) { const fn = m.done; this.mv = null; fn && fn(); }
    }
    // mirada del ojo (fase 2)
    const pl = this.arena.player, c = this.faceC, fx = this.bx + c[0], fy = FL + this.by + c[1];
    this.look.x = lerp(this.look.x, clamp((pl.x - fx) / 420, -1, 1), 1 - Math.exp(-dt * 6)); this.look.y = lerp(this.look.y, clamp((pl.y - 60 - fy) / 260, -1, 1), 1 - Math.exp(-dt * 6));
    this.blinkT -= dt; if (this.blinkT < -.22) this.blinkT = rand(2.4, 4.2); this.lid = this.blinkT < 0 ? Math.sin(clamp(-this.blinkT / .22, 0, 1) * Math.PI) : 0;
    this.calc();
    if (this.trans) {
      this.trans.t += dt;
      if (this.trans.n === 2) {
        this.crack = clamp(this.trans.t / .7, 0, 1); this.punch(Math.sin(this.trans.t * 40) * 1.2);
        if (this.trans.t > .6) this.eyeOpen = clamp((this.trans.t - .6) / .5, 0, 1);
        if (Math.random() < dt * 20) this.parts.push({ type: 'spark', x: this.bx + rand(-120, 80), y: FL - rand(160, 380), vx: rand(-200, 200), vy: rand(-300, -50), g: 900, t: 0, life: .5 });
      } else if (this.trans.n === 3) {
        this.punch(Math.sin(this.trans.t * 55) * 1.8);
        if (Math.random() < dt * 30) this.smoke.push({ x: this.bx + rand(-100, 100), y: FL - rand(250, 420), t: 0, life: 1.1, r: rand(14, 28) });
        if (this.form === 'tv' && this.trans.t > .85) this.burst();
        if (this.form === 'clock') this.clockSc = Math.min(1, this.clockSc + dt * 2.4);
      }
    } else if (this.form === 'clock' && !this.dead) this.clockSc = Math.min(1, this.clockSc + dt * 3);
    if (this.dead) { this.deadT += dt; this.light = clamp(1 - this.deadT / 1.4, 0, 1); }
    else if (this.crack >= 1 && this.form === 'tv' && Math.random() < dt * 5) this.smoke.push({ x: this.bx + rand(-60, 100), y: FL - 410 * this.sy, t: 0, life: 1.4, r: rand(10, 20) });
    this.smoke = this.smoke.filter(s => (s.t += dt) < s.life);
    this.parts = this.parts.filter(p => { p.t += dt; p.vy = (p.vy || 0) + (p.g || 0) * dt; p.x += (p.vx || 0) * dt; p.y += p.vy * dt; p.rot = (p.rot || 0) + (p.spin || 0) * dt; return p.t < p.life; });
    for (const o of this.hz) { o.t += dt; if (o.upd && o.upd(dt, o) === false) o.dead = true; }
    this.hz = this.hz.filter(o => !o.dead);
    this.boxes();
  }

  /* ---- fase 1: el televisor ---- */
  bubble(kind, x, y, ang, spd, pink) {
    const p = this.spawn({ x, y, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd, r: 29, pink: !!pink, life: 7 });
    p.onUpdate = (dt, ar) => { if (p.y > ar.floorY - 10) { p.dead = true; ar.effects.push(MG.fx.starBurst(p.x, ar.floorY - 14, pink ? A.pink : BLUE)); } };
    p.onDraw = ctx => {
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(Math.sin(p.t * 6) * .12);
      A.blob(ctx, 0, 0, 42, 38, pink ? '#ffe6f0' : '#f3f7ff', { wob: 1.5, lw: 4.5, shade: false });
      ctx.restore(); notif(ctx, kind, p.x, p.y + 1, 1.2, p.t);
    };
    return p;
  }
  atkNotifs() {
    this.tele(this.TD, () => {
      this.punch(-4); this.mouth = 1; sfx('shoot');
      const rounds = this.phase >= 2 || this.difficulty > 1.15 ? 2 : 1, n = this.phase >= 2 ? 5 : 5;
      for (let r = 0; r < rounds; r++) this.after(r * 1.0, () => {
        if (this.dead) return; this.punch(-2); this.mouth = 1;
        const o = this.pt(-150, -262), pl = this.arena.player, base = Math.atan2(pl.y - 70 - o.y, pl.x - o.x) + (r ? .13 : 0), K = ['bell', 'chat', 'plus', 'bell', 'chat'];
        const pinkAt = r ? 3 : 1;
        for (let i = 0; i < n; i++) { const ang = base + (i - (n - 1) / 2) * (.27 - .02 * this.difficulty); this.bubble(i === pinkAt ? 'heart' : K[(i + r * 2) % K.length], o.x, o.y, ang, 330 * this.sp, i === pinkAt); }
      });
      this.fin(rounds * 1.0 + 1.25);
    }, 'notif');
  }
  atkRayo() {
    const warn = 1.0 / (.85 + .15 * this.difficulty), spd = 330 * this.sp, pl = this.arena.player;
    let hx = MG.randi(150, 700); for (let i = 0; i < 8 && Math.abs(hx - pl.x) < 190; i++) hx = MG.randi(150, 700);
    const hw = 240, x0 = hx - hw / 2, x1 = hx + hw / 2;
    this.tel = { t: 0, dur: this.TD, kind: 'beam' }; this.after(this.TD, () => { this.tel = null; this.punch(3); });
    this.add({ kind: 'warn', upd: (dt, o) => o.t < warn + .05, draw: (ctx, o) => {
      const k = clamp(o.t / warn, 0, 1), on = Math.floor(o.t * 12) % 2 === 0, y = 34 + 6 * Math.sin(o.t * 20);
      ctx.save(); ctx.strokeStyle = '#bfeaff'; ctx.lineWidth = 3; ctx.globalAlpha = .55 + .35 * k;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(x0, y); ctx.moveTo(x1, y); ctx.lineTo(W, y); ctx.stroke();
      ctx.setLineDash([12, 12]); ctx.lineDashOffset = -o.t * 60; ctx.globalAlpha = .3 + .4 * k; ctx.strokeStyle = on ? '#fff' : BLUE;
      ctx.beginPath(); ctx.moveTo(x0, 0); ctx.lineTo(x0, FL); ctx.moveTo(x1, 0); ctx.lineTo(x1, FL); ctx.stroke(); ctx.setLineDash([]);
      ctx.globalAlpha = .1 + .12 * k; ctx.fillStyle = '#9fe0ff'; ctx.fillRect(x0, 0, hw, FL);
      ctx.globalAlpha = 1; ctx.fillStyle = on ? '#fff' : '#9fe0ff'; for (let i = 0; i < 3; i++) { const yy = 90 + ((o.t * 260 + i * 120) % 360); ctx.beginPath(); ctx.moveTo(hx - 16, yy - 16); ctx.lineTo(hx + 16, yy - 16); ctx.lineTo(hx, yy + 6); ctx.closePath(); ctx.globalAlpha = .6; ctx.fill(); }
      ctx.restore();
    } });
    this.after(warn, () => {
      if (this.dead) return; MG.fx.shake(4, .25); sfx('shoot');
      const o = this.add({ kind: 'beam', y: -50, h: 66, front: true, upd: (dt, o2) => { o2.y += spd * dt; return o2.y < FL + 30; }, draw: (ctx, o2) => {
        ctx.save(); ctx.globalAlpha = .95;
        const yy = o2.y - 105; for (const [a, b] of [[-40, x0], [x1, W + 40]]) { if (b > a) { ctx.drawImage(BG.beam, 0, 0, 64, 720, a, yy, b - a, 210); ctx.fillStyle = 'rgba(190,240,255,.85)'; ctx.fillRect(a, o2.y - 26, b - a, 52); ctx.fillStyle = '#fff'; ctx.fillRect(a, o2.y - 10, b - a, 20); } }
        ctx.strokeStyle = 'rgba(30,110,200,.55)'; ctx.lineWidth = 2; const so = (o2.t * 90) % 10; for (let l = 0; l < 6; l++) { const yl = o2.y - 28 + l * 10 + so; ctx.beginPath(); ctx.moveTo(-40, yl); ctx.lineTo(x0, yl); ctx.moveTo(x1, yl); ctx.lineTo(W, yl); ctx.stroke(); }
        ctx.fillStyle = '#fff'; for (const ex of [x0, x1]) { ctx.fillRect(ex - 4, o2.y - 36, 8, 72); }
        ctx.restore();
      } });
      o.rect = () => [{ x: -50, y: o.y - 33, w: x0 + 50, h: 66 }, { x: x1, y: o.y - 33, w: W + 60 - x1, h: 66 }];
    });
    this.fin(warn + (FL + 80) / spd + 1.0);
  }
  atkPopups() {
    this.tele(this.TD, () => {
      this.punch(3); sfx('jump');
      const pl = this.arena.player, n = 3, xs = [];
      xs.push(clamp(pl.x + rand(-60, 60), 140, 740)); let tries = 0; while (xs.length < n && tries++ < 60) { const x = rand(140, 740); if (xs.every(v => Math.abs(v - x) > 250)) xs.push(x); }
      xs.forEach((x, i) => this.after(i * .55, () => {
        if (this.dead) return; const warn = .8 / (.85 + .15 * this.difficulty);
        this.add({ kind: 'shadow', dur: warn, upd: (dt, o) => o.t < warn + .02, draw: (ctx, o) => {
          const k = clamp(o.t / warn, 0, 1), bl = o.t > warn * .5 && Math.floor(o.t * 14) % 2 === 0;
          ctx.save(); ctx.globalAlpha = .3 + .45 * k; ctx.fillStyle = bl ? '#9fe0ff' : 'rgba(5,5,30,.8)'; ctx.beginPath(); ctx.ellipse(x, FL + 6, 30 + 52 * k, 8 + 8 * k, 0, 0, 7); ctx.fill(); ctx.restore();
        } });
        this.after(warn, () => {
          if (this.dead) return;
          const o = this.add({ kind: 'popup', x, y: -140, vy: 0, st: 0, stay: 3.4 / (.9 + .1 * this.difficulty), front: true, draw: (ctx, o2) => this.drawPopup(ctx, o2), upd: (dt, o2) => {
            if (o2.st === 0) { o2.vy = Math.min(o2.vy + 2600 * dt, 1500); o2.y += o2.vy * dt; if (o2.y >= FL - 104) { o2.y = FL - 104; o2.st = 1; MG.fx.shake(6, .2); sfx('hit'); this.parts.push({ type: 'puff', x: o2.x, y: FL, t: 0, life: .45 }); } }
            else { o2.stay -= dt; if (o2.stay <= 0) { this.parts.push({ type: 'pop', x: o2.x, y: o2.y + 50, t: 0, life: .35 }); return false; } }
            return true;
          } });
          o.rect = () => ({ x: o.x - 76, y: o.y, w: 152, h: 104 });
        });
      }));
      this.fin(1.1 + 1.9);
    }, 'popup');
  }
  drawPopup(ctx, o) {
    const blink = o.st === 1 && o.stay < .8 && Math.floor(o.t * 12) % 2 === 0, sq = o.st === 0 ? 1 : 1 + .06 * Math.max(0, 1 - (o.t - 0) * 0);
    ctx.save(); ctx.translate(o.x, o.y + 52); if (o.st === 0) ctx.rotate(Math.sin(o.t * 9) * .08); ctx.globalAlpha = blink ? .45 : 1;
    rr(ctx, -76, -52, 152, 104, 8); ctx.fillStyle = '#f3f7ff'; ctx.fill(); inkStroke(ctx, 5);
    rr(ctx, -76, -52, 152, 28, 8); ctx.fillStyle = '#2f5fb0'; ctx.fill(); inkStroke(ctx, 4.5);
    ctx.fillStyle = A.red; rr(ctx, 50, -48, 22, 20, 4); ctx.fill(); inkStroke(ctx, 3); ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(56, -44); ctx.lineTo(66, -32); ctx.moveTo(66, -44); ctx.lineTo(56, -32); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.font = "bold 12px 'Lilita One', Arial"; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText('Pantallón.exe', -68, -38);
    ctx.fillStyle = A.ink; ctx.font = "bold 20px 'Lilita One', Arial"; ctx.textAlign = 'center'; ctx.fillText('¿SEGUIR', 0, -8); ctx.fillText('VIENDO?', 0, 12);
    rr(ctx, -30, 24, 60, 22, 6); ctx.fillStyle = '#6aa84f'; ctx.fill(); inkStroke(ctx, 3.5); ctx.fillStyle = '#fff'; ctx.font = "bold 14px 'Lilita One', Arial"; ctx.fillText('SÍ', 0, 36);
    ctx.restore();
  }
  /* ---- fase 2: el ojo insomne ---- */
  atkScroll() {
    this.tele(this.TD, () => {
      this.punch(-4); this.mouth = 1; sfx('shoot');
      const v = 350 * this.sp, S = 600, x0 = W + 130, rows = [{ y: FL - 52, h: 104, off: 0, n: 4 }, { y: FL - 228, h: 92, off: S / 2, n: 3 }];
      const icons = ['sun', 'face', 'cat', 'bars', 'play'];
      for (const row of rows) for (let i = 0; i < row.n; i++) {
        const cx = x0 + row.off + i * S, ic = icons[MG.randi(0, 4)], tone = MG.randi(0, 3);
        const o = this.add({ kind: 'card', x: cx, y: row.y, front: true, upd: (dt, o2) => { o2.x -= v * dt; return o2.x > -150; }, draw: (ctx, o2) => this.drawCard(ctx, o2, ic, tone) });
        o.rect = () => ({ x: o.x - 62, y: row.y - row.h / 2, w: 124, h: row.h });
      }
      // fila decorativa inofensiva arriba (el "scroll" sigue y sigue)
      for (let i = 0; i < 6; i++) { const cx = x0 - 200 + i * 300; this.add({ kind: 'deco', x: cx, y: 96, upd: (dt, o2) => { o2.x -= v * .7 * dt; return o2.x > -150; }, draw: (ctx, o2) => { ctx.save(); ctx.globalAlpha = .35; this.drawCard(ctx, { x: o2.x, y: o2.y, t: o2.t }, 'face', i % 4, .8); ctx.restore(); } }); }
      this.fin(3 * S / v + 1.8);
    }, 'scroll');
  }
  drawCard(ctx, o, ic, tone, sc) {
    const cols = ['#ffb36b', '#7be0c0', '#b79bff', '#ff8aa8'], c = cols[tone % 4];
    ctx.save(); ctx.translate(o.x, o.y); ctx.scale(sc || 1, sc || 1);
    rr(ctx, -62, -50, 124, 100, 10); ctx.fillStyle = '#f3f7ff'; ctx.fill(); inkStroke(ctx, 5);
    rr(ctx, -54, -42, 108, 66, 6); ctx.fillStyle = c; ctx.fill(); inkStroke(ctx, 3.5);
    ctx.fillStyle = '#fff'; ctx.strokeStyle = A.ink; ctx.lineWidth = 3;
    if (ic === 'sun') { ctx.beginPath(); ctx.arc(0, -9, 16, 0, 7); ctx.fillStyle = '#ffe36b'; ctx.fill(); ctx.stroke(); }
    else if (ic === 'face') { ctx.beginPath(); ctx.arc(0, -9, 18, 0, 7); ctx.fillStyle = '#fff1d0'; ctx.fill(); ctx.stroke(); ctx.fillStyle = A.ink; ctx.beginPath(); ctx.arc(-6, -13, 2.5, 0, 7); ctx.arc(6, -13, 2.5, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(0, -6, 7, .2, 2.9); ctx.stroke(); }
    else if (ic === 'cat') { ctx.beginPath(); ctx.moveTo(-18, 6); ctx.lineTo(-16, -22); ctx.lineTo(-6, -12); ctx.lineTo(6, -12); ctx.lineTo(16, -22); ctx.lineTo(18, 6); ctx.quadraticCurveTo(0, 14, -18, 6); ctx.fillStyle = '#4a3a5a'; ctx.fill(); ctx.stroke(); ctx.fillStyle = '#ffe36b'; ctx.beginPath(); ctx.arc(-7, -5, 3, 0, 7); ctx.arc(7, -5, 3, 0, 7); ctx.fill(); }
    else if (ic === 'bars') { for (let i = 0; i < 4; i++) { ctx.fillStyle = '#fff'; ctx.fillRect(-36 + i * 20, 12 - (i % 2 ? 30 : 18) - i * 2, 14, (i % 2 ? 30 : 18) + i * 2); ctx.strokeRect(-36 + i * 20, 12 - (i % 2 ? 30 : 18) - i * 2, 14, (i % 2 ? 30 : 18) + i * 2); } }
    else { ctx.beginPath(); ctx.moveTo(-10, -26); ctx.lineTo(16, -9); ctx.lineTo(-10, 8); ctx.closePath(); ctx.fillStyle = '#fff'; ctx.fill(); ctx.stroke(); }
    ctx.fillStyle = A.ink; ctx.fillRect(-48, 31, 70, 5); ctx.fillStyle = 'rgba(30,30,60,.4)'; ctx.fillRect(-48, 40, 46, 4);
    ctx.restore();
  }
  atkOvejas() {
    this.tele(this.TD, () => {
      this.punch(3); this.mouth = 1; sfx('jump');
      const n = 4, o = this.pt(-150, -250);
      for (let i = 0; i < n; i++) this.after(i * .75 / this.sp, () => {
        if (this.dead) return;
        const p = this.spawn({ x: o.x, y: FL - 30, vx: -300 * this.sp, vy: 0, r: 27, pink: true, life: 8 });
        const ph = rand(0, 3);
        p.onUpdate = (dt, ar) => { p.y = FL - 30 - Math.abs(Math.sin(p.t * 3.4 + ph)) * 125; };
        p.onDraw = ctx => sheep(ctx, p.x, p.y, 1, p.t, i + 1);
      });
      this.fin(n * .75 / this.sp + 1.7);
    }, 'sheep');
  }
  /* ---- fase 3: el despertador ---- */
  atkOndas() {
    this.tele(this.TD, () => {
      this.ring = 1; this.punch(-4); MG.fx.shake(6, .3); sfx('phase');
      this.shout = { txt: '¡RIIING!', t: 0 };
      const pl = this.arena.player, rings = this.difficulty > 1.15 ? 4 : 3;
      for (let i = 0; i < rings; i++) this.after(i * .5 / this.sp, () => {
        if (this.dead) return; this.ring = 1; this.punch(-1.5);
        const c = this.pt(0, -290), phiP = Math.atan2(pl.y - 60 - c.y, pl.x - c.x), gapH = lerp(.46, .32, clamp((this.difficulty - .8) / .6, 0, 1)), gapC = phiP + (i % 2 ? 1 : -1) * (i === 0 ? 0 : gapH + .1 + .04 * i);
        const p = this.spawn({ x: -100, y: -100, r: 0, pierce: true, life: 5 });
        p.R = 60; p.cx = c.x; p.cy = c.y;
        p.onUpdate = (dt, ar) => {
          p.R += 410 * this.sp * dt;
          const hurt = ar.player.hurtbox(); p.x = -100; p.y = -100; p.r = 0;
          if (hurt) {
            const d = Math.hypot(hurt.x - p.cx, hurt.y - p.cy), an = Math.atan2(hurt.y - p.cy, hurt.x - p.cx);
            let da = Math.abs(((an - gapC + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
            if (Math.abs(d - p.R) < 12 + hurt.r * .55 && da > gapH * (1 - .0) && !p.harmless) { p.x = hurt.x; p.y = hurt.y; p.r = 8; }
          }
          if (p.R > 1500) p.dead = true;
        };
        p.onDraw = ctx => {
          ctx.save(); ctx.lineCap = 'round';
          const a0 = gapC + gapH, a1 = gapC - gapH + Math.PI * 2;
          for (const [lw, col] of [[30, A.ink], [20, '#ffd36e'], [8, '#fff6df']]) { ctx.beginPath(); ctx.arc(p.cx, p.cy, p.R, a0, a1); ctx.lineWidth = lw; ctx.strokeStyle = col; ctx.stroke(); }
          ctx.restore();
        };
      });
      this.fin(rings * .5 / this.sp + 2.3);
    }, 'ring');
  }
  atkSalto() {
    this.tele(this.TD, () => {
      sfx('jump'); this.punch(5);
      const up = .36;
      this.mv = { t: 0, dur: up, x0: this.bx, x1: this.bx, y0: 0, y1: -950, ease: k => k * k * k, done: () => {
        this.hide = true; if (this.dead) return;
        const pl = this.arena.player, track = .5, lock = .7 / (.9 + .1 * this.difficulty); let lx = clamp(pl.x, 130, 1150), locked = false;
        const sh = this.add({ kind: 'shadow', upd: (dt, o) => { if (!locked) lx += (clamp(pl.x, 130, 1150) - lx) * (1 - Math.exp(-dt * 7)); return o.t < track + lock + .05; }, draw: (ctx, o) => {
          const k = clamp(o.t / (track + lock), 0, 1), bl = locked && Math.floor(o.t * 16) % 2 === 0;
          ctx.save(); ctx.globalAlpha = .35 + .45 * k; ctx.fillStyle = bl ? '#ff5a6e' : 'rgba(5,5,30,.85)'; ctx.beginPath(); ctx.ellipse(lx, FL + 6, 110 + 40 * k, 20 + 8 * k, 0, 0, 7); ctx.fill();
          ctx.globalAlpha = locked ? 1 : .6; ctx.strokeStyle = bl ? '#fff' : A.ink; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(lx, FL + 6, 110 + 40 * k, 20 + 8 * k, 0, 0, 7); ctx.stroke();
          ctx.restore(); if (locked) A.text(ctx, '!', lx, FL - 40, 70, { fill: '#ff5a6e', lw: 10 });
        } });
        this.after(track, () => { locked = true; });
        this.after(track + lock, () => {
          if (this.dead) return; this.hide = false; this.bx = lx;
          this.mv = { t: 0, dur: .2, x0: lx, x1: lx, y0: -950, y1: 0, ease: k => k * k, done: () => {
            MG.fx.shake(18, .5); sfx('hit'); this.punch(-6); this.dazed = 1.1;
            for (const d of [-1, 1]) this.parts.push({ type: 'puff', x: this.bx + d * 130, y: FL, t: 0, life: .55 });
            this.after(1.15, () => { if (this.dead) return; this.mv = { t: 0, dur: .95, x0: this.bx, x1: 960, y0: 0, y1: 0, arc: 360, ease: ease.inOut, done: () => { this.punch(-3); } }; });
            this.fin(1.15 + .95 + .7);
          } };
        });
      } };
    }, 'jump');
  }
  atkZzz() {
    this.tele(this.TD, () => {
      this.punch(-3); this.mouth = 1; sfx('shoot');
      const n = 5;
      for (let i = 0; i < n; i++) this.after(i * .42 / this.sp, () => {
        if (this.dead) return;
        const o = this.pt(-120 + rand(-20, 20), -330), pl = this.arena.player, ang = Math.atan2(pl.y - 90 - o.y, pl.x - o.x) + rand(-.35, .35), ph = rand(0, 6);
        const p = this.spawn({ x: o.x, y: o.y, vx: Math.cos(ang) * 230 * this.sp, vy: Math.sin(ang) * 230 * this.sp, r: 24, pink: true, life: 7 });
        const bx = p.vx, by = p.vy;
        p.onUpdate = (dt, ar) => { const nx = -by / 230, ny = bx / 230; p.x += nx * Math.sin(p.t * 5 + ph) * 90 * dt; p.y += ny * Math.sin(p.t * 5 + ph) * 90 * dt; if (p.y > ar.floorY - 6) { p.dead = true; ar.effects.push(MG.fx.starBurst(p.x, ar.floorY - 14, A.pink)); } };
        p.onDraw = ctx => zzz(ctx, p.x, p.y, 1 + .15 * Math.sin(p.t * 8), p.t);
      });
      this.fin(n * .42 / this.sp + 2.0);
    }, 'zzz');
  }
  /* ---- fases ---- */
  onPhase(n) {
    this.kill(); this.tel = null; this.trans = { t: 0, n }; this.charge = 0; this.hide = false; this.bx = 960; this.by = 0;
    if (n === 2) { this.punch(-6); this.shout = { txt: '¡UNO MÁS!', t: 0 }; sfx('shoot'); this.after(1.15, () => { this.trans = null; this.next(); }); }
    else { this.shout = { txt: '¡RIIING!', t: 0 }; this.after(1.5, () => { this.trans = null; this.next(); }); }
  }
  burst() {
    if (this.form === 'clock') return;
    this.form = 'clock'; this.clockSc = .2; this.crack = 0; this.eyeOpen = 0; this.ring = 1; this.punch(6);
    MG.fx.shake(14, .5); MG.fx.flash('#ffffff', .25); sfx('phase');
    for (let i = 0; i < 18; i++) this.parts.push({ type: 'chunk', x: this.bx + rand(-100, 100), y: FL - rand(150, 400), vx: rand(-460, 460), vy: rand(-700, -120), g: 1500, t: 0, life: 1.3, r: rand(12, 36), rot: rand(0, 6), spin: rand(-9, 9), col: MG.pick(['#a86b3f', '#7b4a2a', '#2b1c14', '#6a6f86']) });
  }
  onDeath() {
    this.kill(); this.tel = null; this.trans = null; this.deadT = 0; this.form = 'tv'; this.crack = 0; this.eyeOpen = 0; this.bx = 960; this.by = 0; this.hide = false; this.clockSc = 1; this.stars = 1;
    this.parts.push({ type: 'puff', x: this.bx, y: FL, t: 0, life: .6 }); sfx('death');
  }
  /* ---- dibujo ---- */
  drawBackground(ctx, t) {
    const pl = this.arena.player, px = ((pl && pl.x) || 640) - 640, dd = this.dead ? this.deadT : 0, wake = this.dead ? clamp((dd - .9) / 1.4, 0, 1) : 0;
    ctx.drawImage(BG.far, -40 - px * .01, 0);
    // cielo de la ventana + estrellas + luna
    const ox = -px * .01;
    ctx.save(); ctx.translate(ox, 0); rr(ctx, 150, 70, 240, 270, 10); ctx.clip();
    ctx.fillStyle = wake > 0 ? mix('#142560', '#f2a86b', wake * .55) : '#142560'; ctx.fillRect(140, 60, 260, 290);
    for (const s of STARS) { const k = .5 + .5 * Math.sin(t * s[3] * 2.2 + s[2]); ctx.globalAlpha = (.35 + .65 * k) * (1 - wake * .8); ctx.fillStyle = '#fff6df'; const r = 1 + k * 2.2; ctx.beginPath(); ctx.moveTo(s[0], s[1] - r * 1.8); ctx.lineTo(s[0] + r * .6, s[1]); ctx.lineTo(s[0], s[1] + r * 1.8); ctx.lineTo(s[0] - r * .6, s[1]); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(s[0] - r * 1.8, s[1]); ctx.lineTo(s[0], s[1] + r * .6); ctx.lineTo(s[0] + r * 1.8, s[1]); ctx.lineTo(s[0], s[1] - r * .6); ctx.closePath(); ctx.fill(); }
    ctx.globalAlpha = 1; this.drawMoon(ctx, 268, 200, t, wake); ctx.restore();
    ctx.drawImage(BG.win, 80, 30, 520, 400, 40 + ox, 30, 520, 400);
    ctx.drawImage(BG.mid, 420, 170, 640, 410, 380 - px * .02, 170, 640, 410);
    // luz azul de la pantalla, parpadeante
    const L = this.light, fl = Math.floor(t * 18), noise = ((Math.sin(fl * 12.9898) * 43758.5453) % 1 + 1) % 1, cx = this.bx - 30 - px * .01, cy = FL - 260 + this.by;
    if (L > .01 && this.form !== 'clock') { ctx.save(); ctx.globalAlpha = Math.min(1, L * (.85 + .12 * Math.sin(t * 11) + .16 * (noise > .86 ? 1 : 0)) * (this.form === 'tv' && this.crack > 0 ? .8 : 1)); ctx.drawImage(BG.glow, cx - 480, cy - 480, 960, 960); ctx.globalAlpha *= .9; ctx.drawImage(BG.floorGlow, cx - 380, FL - 30, 760, 140); ctx.restore(); }
    if (this.form === 'clock' && !this.dead) { const flick = .35 + .25 * (Math.sin(t * 22) > 0 ? 1 : .4) * (this.ring + .3); ctx.save(); ctx.globalAlpha = clamp(flick, 0, .7); ctx.drawImage(BG.warm, this.bx - 400, FL - 290 + this.by - 400, 800, 800); ctx.restore(); }
    if (wake > 0) { ctx.save(); ctx.globalAlpha = wake * .38; ctx.drawImage(BG.warm, 270 - 380 + ox, 200 - 380, 760, 760); ctx.fillStyle = 'rgba(255,200,130,.16)'; ctx.globalAlpha = wake; ctx.fillRect(0, 0, W, H); ctx.restore(); }
    // tinte azul general (la pantalla tiñe todo)
    ctx.fillStyle = `rgba(40,110,230,${.1 * L + .02})`; ctx.fillRect(0, 0, W, H);
  }
  drawMoon(c, x, y, t, wake) {
    const R = 70, bite = lerp(.5, 1.7, wake);
    c.save(); c.translate(x, y);
    if (wake > 0) { c.globalAlpha = wake * .5; c.fillStyle = '#ffe9a0'; c.beginPath(); c.arc(0, 0, R * 1.5, 0, 7); c.fill(); c.globalAlpha = 1; }
    c.beginPath(); c.arc(0, 0, R, 0, 7); c.fillStyle = '#fff1b8'; c.fill(); inkStroke(c, 4);
    c.save(); c.clip(); c.beginPath(); c.arc(R * bite, -R * .1 * (1 - wake), R * .9, 0, 7); c.fillStyle = wake > 0 ? mix('#142560', '#f2a86b', wake * .55) : '#142560'; c.fill(); c.restore();
    c.beginPath(); c.arc(0, 0, R, 0, 7); inkStroke(c, 4);
    if (wake < .5) {   // dormida
      c.strokeStyle = A.ink; c.lineWidth = 3.5; c.lineCap = 'round'; c.beginPath(); c.arc(-26, -6, 9, .15, Math.PI - .15); c.stroke();
      c.beginPath(); c.arc(-27, 20, 7, .3, Math.PI - .3); c.stroke();
      c.fillStyle = 'rgba(255,120,150,.5)'; c.beginPath(); c.ellipse(-44, 8, 9, 5, 0, 0, 7); c.fill();
      const zt = (t * .5) % 1; c.globalAlpha = Math.sin(zt * Math.PI); c.fillStyle = '#cfe0ff'; c.font = "bold 26px 'Lilita One', Arial"; c.fillText('z', 28 + zt * 30, -30 - zt * 40); c.globalAlpha = 1;
    } else {   // despierta y sonríe
      c.fillStyle = A.cream; c.strokeStyle = A.ink; c.lineWidth = 3.5;
      for (const ex of [-18, 18]) { c.beginPath(); c.ellipse(ex - 8, -8, 10, 13, 0, 0, 7); c.fill(); c.stroke(); c.fillStyle = A.ink; c.beginPath(); c.arc(ex - 8, -6, 5, 0, 7); c.fill(); c.fillStyle = A.cream; }
      c.beginPath(); c.arc(-8, 12, 20, .15, Math.PI - .15); c.fillStyle = '#7a1c2a'; c.fill(); c.stroke();
      c.fillStyle = 'rgba(255,120,150,.6)'; for (const ex of [-40, 22]) { c.beginPath(); c.ellipse(ex, 10, 9, 5, 0, 0, 7); c.fill(); }
    }
    c.restore();
  }
  draw(ctx, t) {
    const cx = this.bx;
    A.shadow(ctx, cx, FL + 5, (this.form === 'clock' ? 170 : 215) * this.sx * (this.hide ? 0 : 1 - clamp(-this.by / 700, 0, .6)));
    for (const o of this.hz) if (o.draw && !o.front) o.draw(ctx, o);
    // cable con enchufe
    if (!this.hide) {
      if (this.form === 'tv') { ctx.save(); ctx.translate(this.bx, FL); ctx.scale(this.sx, this.sy); this.drawTV(ctx, t); ctx.restore(); }
      else if (this.form === 'clock' && this.clockSc > .02) { ctx.save(); ctx.translate(this.bx, FL + this.by); ctx.scale(this.sx, this.sy); this.drawClock(ctx, t); ctx.restore(); }
    }
    for (const o of this.hz) if (o.draw && o.front) o.draw(ctx, o);
  }
  screenGlass(ctx, t, fn) { ctx.save(); sup(ctx, -34, -268, 122, 106, 3.6, 31, 1.2); ctx.clip(); fn(); ctx.restore(); }
  drawTV(ctx, t) {
    const atk = this.tel ? this.tel.t / this.tel.dur : 0, dying = this.dead, u = this.deadT, shake = (this.trans ? 4 : 0) * Math.sin(t * 66) + (this.tel ? 1.6 * Math.sin(t * 55) : 0) + (dying && u < .3 ? 3 * Math.sin(t * 80) : 0);
    const raise = clamp(this.charge, 0, 1) * (this.tel && (this.tel.kind === 'notif' || this.tel.kind === 'sheep') ? 1 : .6), slump = dying ? clamp(u / 1.2, 0, 1) : 0;
    ctx.translate(shake, slump * 10); ctx.scale(1, 1 - slump * .06);
    // cable
    ctx.save(); A.hose(ctx, 150, -150, 240 + Math.sin(t * 2) * 6, -60, -40, 10, '#2b1c14'); rr(ctx, 232 + Math.sin(t * 2) * 6, -72, 34, 24, 6); ctx.fillStyle = '#d8d8d8'; ctx.fill(); inkStroke(ctx, 3.5); ctx.fillStyle = A.ink; ctx.fillRect(266, -66, 14, 4); ctx.fillRect(266, -56, 14, 4); ctx.restore();
    // piernas
    for (const s of [-1, 1]) { const wob = Math.sin(t * 3 + s) * 3 + (dying ? slump * s * 14 : 0); limb(ctx, [[s * 78, -134], [s * 98 + wob, -72], [s * 104 + wob, -20]], 22, '#e8d9b0'); shoe(ctx, s * 104 + wob + 8, -12, 1.2, s < 0 ? '#c8503a' : '#3c5aa8'); }
    // brazos con guantes
    const wave = Math.sin(t * 4) * 12, ar = dying ? 0 : raise;
    const lg = [-262 - ar * 10 + wave * .4, -204 - ar * 140 + wave + slump * 90], rg = [262 + ar * 6 + Math.sin(t * 4 + 2) * 6, -196 - ar * 150 + Math.sin(t * 4 + 2) * 10 + slump * 90];
    limb(ctx, [[-164, -252], [-232, -250 + slump * 50], lg], 18, '#e8d9b0'); A.glove(ctx, lg[0], lg[1], 24, -2.7 + wave * .02);
    limb(ctx, [[164, -252], [232, -250 + slump * 50], rg], 18, '#e8d9b0'); A.glove(ctx, rg[0], rg[1], 24, -.4);
    // antena
    const sw = Math.sin(t * 6) * 4 * (this.trans ? 3 : 1) + (this.crack > 0 ? 14 : 0), tipA = [-80 + sw, -522 + (this.crack > 0 ? 24 : 0)], tipB = [72 - sw, -532];
    A.hose(ctx, -6, -394, tipA[0], tipA[1], 8, 8, '#b8b8c8'); A.hose(ctx, 8, -394, tipB[0], tipB[1], -8, 8, '#b8b8c8');
    for (const tp of [tipA, tipB]) A.blob(ctx, tp[0], tp[1], 11, 11, '#e1b94e', { wob: .5, lw: 3.5, shade: false, points: 10 });
    if (!dying && (this.charge > .1 || Math.floor(t * 9) % 5 === 0)) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(tipA[0] + 10, tipA[1] - 4); const n = 6; for (let i = 1; i <= n; i++) ctx.lineTo(tipA[0] + 10 + (tipB[0] - tipA[0] - 20) * i / n, tipA[1] + (tipB[1] - tipA[1]) * i / n + (i % 2 ? -14 : 14) * (.5 + this.charge)); ctx.stroke(); ctx.strokeStyle = BLUE; ctx.lineWidth = 8; ctx.globalAlpha = .4; ctx.stroke(); ctx.globalAlpha = 1; }
    // gabinete
    sup(ctx, 0, -262, 178, 142, 3.3, 5, 1.8); ctx.fillStyle = this.crack > 0 ? '#8e5a35' : '#a86b3f'; ctx.fill();
    ctx.save(); ctx.clip(); ctx.fillStyle = 'rgba(255,225,170,.28)'; ctx.fillRect(-190, -410, 380, 40); ctx.fillStyle = 'rgba(40,15,5,.3)'; ctx.fillRect(-190, -160, 380, 40);
    ctx.strokeStyle = 'rgba(60,25,8,.25)'; ctx.lineWidth = 3; for (let i = 0; i < 7; i++) { ctx.beginPath(); ctx.moveTo(-180, -390 + i * 36 + Math.sin(i) * 4); ctx.quadraticCurveTo(0, -380 + i * 36 + Math.cos(i * 2) * 8, 180, -392 + i * 36); ctx.stroke(); }
    if (this.crack > 0) { ctx.fillStyle = 'rgba(20,10,5,.35)'; for (const [dx, dy, r] of [[120, -380, 26], [-150, -170, 22], [130, -160, 18]]) { ctx.beginPath(); ctx.arc(dx, dy, r, 0, 7); ctx.fill(); } }
    ctx.restore(); sup(ctx, 0, -262, 178, 142, 3.3, 5, 1.8); inkStroke(ctx, 6);
    // botones y bocina
    for (const dy of [-330, -282, -234]) { A.blob(ctx, 138, dy, 17, 17, '#e1b94e', { wob: .6, lw: 3.5, points: 10 }); ctx.strokeStyle = A.ink; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(138, dy); ctx.lineTo(138 + Math.cos(dy) * 11, dy + Math.sin(dy) * 11); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(30,12,4,.7)'; ctx.lineWidth = 4; ctx.lineCap = 'round'; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(118, -196 + i * 14); ctx.lineTo(158, -196 + i * 14); ctx.stroke(); }
    // bisel y pantalla
    sup(ctx, -34, -268, 130, 114, 3.5, 17, 1.4); ctx.fillStyle = '#3a2216'; ctx.fill(); inkStroke(ctx, 5);
    this.screenGlass(ctx, t, () => {
      if (dying) { this.drawCRTOff(ctx, t, u); return; }
      const hit = this.flash > 0 ? .5 : 0;
      ctx.fillStyle = this.crack > 0 && this.eyeOpen > 0 ? '#0e1a38' : '#2e86d0'; ctx.fillRect(-170, -390, 270, 250);
      if (this.eyeOpen < 1) { ctx.globalAlpha = 1 - this.eyeOpen; ctx.drawImage(BG.glow, -34 - 150, -268 - 130, 300, 260); ctx.globalAlpha = 1; this.drawTVFace(ctx, t); }
      if (this.eyeOpen > 0) { ctx.globalAlpha = this.eyeOpen; this.drawEye(ctx, t); ctx.globalAlpha = 1; }
      // líneas de barrido
      ctx.fillStyle = 'rgba(0,20,60,.16)'; for (let y = -380; y < -150; y += 6) ctx.fillRect(-170, y + (t * 30 % 6), 270, 2.5);
      ctx.fillStyle = 'rgba(255,255,255,.14)'; ctx.beginPath(); ctx.ellipse(-92, -340, 46, 14, -.5, 0, 7); ctx.fill();
      if (this.charge > .05 || hit) { ctx.globalAlpha = Math.min(1, this.charge * .55 * (.6 + .4 * Math.sin(t * 50)) + hit); ctx.fillStyle = '#fff'; ctx.fillRect(-170, -390, 270, 250); ctx.globalAlpha = 1; }
      if (this.crack > 0) this.drawCracks(ctx);
    });
    sup(ctx, -34, -268, 122, 106, 3.6, 31, 1.2); inkStroke(ctx, 4);
    if (this.flash > 0) { ctx.globalAlpha = .4; sup(ctx, 0, -262, 178, 142, 3.3, 5, 1.8); ctx.fillStyle = A.cream; ctx.fill(); ctx.globalAlpha = 1; }
    if (this.crack > .3 && !dying) { ctx.strokeStyle = 'rgba(30,20,10,.9)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(110, -380); ctx.lineTo(96, -350); ctx.lineTo(110, -330); ctx.stroke(); }
  }
  drawTVFace(ctx, t) {
    const lx = this.look.x, ly = this.look.y, open = clamp(Math.max(this.mouth, this.charge * .8), 0, 1);
    // ojos brillantes
    ctx.save(); ctx.globalAlpha = .5; for (const s of [-1, 1]) A.blob(ctx, -34 + s * 36, -296, 36, 42, '#e8fbff', { wob: 2, line: false, shade: false }); ctx.restore();
    eyesA(ctx, -34, -298, 54 + this.charge * 6, lx, ly, true);
    staticMouth(ctx, -34, -222 + this.charge * 4, 150 + open * 10, open, this.noiseOff);
    // mejillas de "ruido"
    ctx.fillStyle = 'rgba(255,255,255,.25)'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(-34 + s * 84, -250, 12, 7, 0, 0, 7); ctx.fill(); }
  }
  drawEye(ctx, t) {
    const cx = -34, cy = -266, op = this.eyeOpen, wide = this.charge, lid = Math.max(this.lid, 1 - op);
    // esclerótica
    ctx.save(); ctx.beginPath(); ctx.ellipse(cx, cy, 112, 90 * (1 - lid * .9), 0, 0, 7); ctx.fillStyle = '#f0f4ff'; ctx.fill(); inkStroke(ctx, 5); ctx.clip();
    ctx.strokeStyle = 'rgba(210,30,40,.75)'; ctx.lineWidth = 2.4;
    ctx.beginPath(); for (let i = 0; i < 16; i++) { const a = i / 16 * 6.283 + .2, r0 = 112, r1 = 62 + (i % 3) * 8; ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0 * .8); ctx.quadraticCurveTo(cx + Math.cos(a + .2) * (r0 + r1) / 2, cy + Math.sin(a + .2) * (r0 + r1) / 2 * .8 + A.j(i, 3), cx + Math.cos(a) * r1, cy + Math.sin(a) * r1 * .8); } ctx.stroke();
    // iris + pupila (siguen a Milo)
    const ix = cx + this.look.x * 38, iy = cy + this.look.y * 24, ir = 52 - wide * 8;
    A.blob(ctx, ix, iy, ir, ir, '#5bc9a0', { wob: 1.2, lw: 4, shade: false }); ctx.strokeStyle = 'rgba(20,90,70,.6)'; ctx.lineWidth = 2; ctx.beginPath(); for (let i = 0; i < 14; i++) { const a = i / 14 * 6.283; ctx.moveTo(ix + Math.cos(a) * ir * .45, iy + Math.sin(a) * ir * .45); ctx.lineTo(ix + Math.cos(a) * ir * .95, iy + Math.sin(a) * ir * .95); } ctx.stroke();
    const pr = 22 - wide * 8 + Math.sin(t * 5) * 1.2; ctx.beginPath(); ctx.arc(ix, iy, pr, 0, 7); ctx.fillStyle = A.ink; ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ix - 9, iy - 10, 7, 0, 7); ctx.fill();
    ctx.restore();
    // párpado superior caído (insomne) y ojeras
    const drop = (.2 - wide * .14 + lid * .9);
    ctx.save(); ctx.beginPath(); ctx.ellipse(cx, cy, 112, 90, 0, 0, 7); ctx.clip();
    ctx.beginPath(); ctx.moveTo(cx - 130, cy - 130); ctx.lineTo(cx + 130, cy - 130); ctx.lineTo(cx + 130, cy - 90 + drop * 180); ctx.quadraticCurveTo(cx, cy - 90 + drop * 180 + 36, cx - 130, cy - 90 + drop * 180); ctx.closePath(); ctx.fillStyle = '#5a4690'; ctx.fill(); inkStroke(ctx, 5);
    ctx.restore();
    ctx.beginPath(); ctx.moveTo(cx - 100, cy + 70); ctx.quadraticCurveTo(cx, cy + 126, cx + 100, cy + 70); ctx.quadraticCurveTo(cx, cy + 104, cx - 100, cy + 70); ctx.fillStyle = '#6a56a8'; ctx.fill(); inkStroke(ctx, 4);
  }
  drawCracks(ctx) {
    const k = this.crack;
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const lines = [[[40, -380], [10, -340], [30, -300], [-20, -262], [-10, -220], [-60, -180], [-80, -142]], [[10, -340], [-50, -330], [-96, -350], [-140, -330]], [[-20, -262], [60, -250], [96, -270]], [[-60, -180], [-120, -200], [-160, -190]]];
    for (const L of lines) { const n = Math.max(2, Math.ceil(L.length * k)); ctx.beginPath(); ctx.moveTo(L[0][0], L[0][1]); for (let i = 1; i < n; i++) ctx.lineTo(L[i][0] + A.j(i, 1.5), L[i][1]); ctx.strokeStyle = 'rgba(200,245,255,.95)'; ctx.lineWidth = 7; ctx.stroke(); ctx.strokeStyle = A.ink; ctx.lineWidth = 3; ctx.stroke(); }
    ctx.restore();
  }
  drawCRTOff(ctx, t, u) {
    ctx.fillStyle = '#05070f'; ctx.fillRect(-170, -390, 270, 250);
    const cx = -34, cy = -266;
    if (u < .25) { ctx.fillStyle = '#fff'; ctx.globalAlpha = 1 - u / .25 * .3; ctx.fillRect(-170, -390, 270, 250); ctx.globalAlpha = 1; }
    else if (u < .7) { const k = ease.inOut((u - .25) / .45), h = lerp(236, 5, k); ctx.fillStyle = '#f4fbff'; ctx.fillRect(cx - 136, cy - h / 2, 272, h); ctx.globalAlpha = .4; ctx.fillStyle = BLUE; ctx.fillRect(cx - 136, cy - h / 2 - 8, 272, h + 16); ctx.globalAlpha = 1; }
    else if (u < 1.25) { const k = ease.inOut((u - .7) / .55), w = lerp(272, 8, k); ctx.fillStyle = '#fff'; ctx.fillRect(cx - w / 2, cy - 3, w, 6); ctx.globalAlpha = .35; ctx.fillStyle = BLUE; ctx.fillRect(cx - w / 2 - 4, cy - 8, w + 8, 16); ctx.globalAlpha = 1; }
    else { const k = clamp((u - 1.25) / 1.0, 0, 1), r = 5 * (1 - k * .6) + Math.sin(u * 40) * .6; if (k < 1) { ctx.fillStyle = '#fff'; ctx.globalAlpha = 1 - k * k; ctx.beginPath(); ctx.arc(cx, cy, r + 4, 0, 7); ctx.fill(); ctx.globalAlpha = .5 * (1 - k); ctx.fillStyle = BLUE; ctx.beginPath(); ctx.arc(cx, cy, r + 14, 0, 7); ctx.fill(); ctx.globalAlpha = 1; } }
  }
  drawClock(ctx, t) {
    const ring = this.ring, vib = ring > 0 ? Math.sin(t * 80) * (3 + 6 * ring) : 0, atk = this.charge, hit = this.flash > 0;
    ctx.translate(vib * .6 + (this.trans ? 3 * Math.sin(t * 60) : 0), 0);
    const walk = Math.sin(t * 6) * 4;
    // patas y zapatos
    for (const s of [-1, 1]) { limb(ctx, [[s * 74, -150], [s * 92 + walk * s, -80], [s * 96, -22]], 22, '#e8d9b0'); shoe(ctx, s * 96 + 8, -14, 1.3, s < 0 ? '#c8503a' : '#3c5aa8'); }
    // brazos
    const raise = this.tel ? atk : 0, wave = Math.sin(t * 5) * 10 + (ring > 0 ? Math.sin(t * 60) * 8 : 0);
    const lg = [-262 - raise * 10, -250 - raise * 130 + wave], rg = [262 + raise * 10, -250 - raise * 130 - wave * .6];
    limb(ctx, [[-150, -290], [-222, -290], lg], 18, '#e8d9b0'); A.glove(ctx, lg[0], lg[1], 24, -2.7);
    limb(ctx, [[150, -290], [222, -290], rg], 18, '#e8d9b0'); A.glove(ctx, rg[0], rg[1], 24, -.4);
    // campanas
    for (const s of [-1, 1]) {
      ctx.save(); ctx.translate(s * 104, -430); ctx.scale(1.25, 1.25); ctx.rotate(s * .5 + (ring > 0 ? Math.sin(t * 70 + s) * .14 * (.4 + ring) : Math.sin(t * 3 + s) * .03));
      ctx.beginPath(); ctx.moveTo(-62, 10); ctx.bezierCurveTo(-64, -62, 64, -62, 62, 10); ctx.closePath(); ctx.fillStyle = '#e1b94e'; ctx.fill(); inkStroke(ctx, 5.5);
      ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.ellipse(-26, -22, 14, 22, -.5, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.ellipse(0, 12, 64, 9, 0, 0, 7); ctx.fillStyle = '#b8892a'; ctx.fill(); inkStroke(ctx, 4);
      ctx.restore();
      if (ring > 0.05) { ctx.save(); ctx.globalAlpha = ring; ctx.strokeStyle = A.ink; ctx.lineWidth = 4; ctx.lineCap = 'round'; for (let i = 0; i < 3; i++) { const o = 80 + i * 18 + (t * 120 % 18); ctx.beginPath(); ctx.arc(s * 98, -430, o, s > 0 ? -.9 : Math.PI - .5 + .0, s > 0 ? -.4 : Math.PI + .1 + (-.4) + .4); ctx.stroke(); } ctx.restore(); }
    }
    // martillito
    const hs = ring > 0 ? Math.sin(t * 44) * 34 : Math.sin(t * 2) * 6;
    ctx.strokeStyle = A.ink; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, -424); ctx.lineTo(hs * .6, -476); ctx.stroke(); ctx.strokeStyle = '#c8c8d8'; ctx.lineWidth = 4; ctx.stroke();
    A.blob(ctx, hs * .7, -484, 16, 14, '#6a6f86', { wob: .6, lw: 4, points: 10 });
    // cuerpo
    const pulse = 1 + (ring > 0 ? Math.sin(t * 70) * .02 * ring : 0);
    A.blob(ctx, 0, -290, 160 * pulse, 160 * pulse, '#e0594a', { wob: 2.2, lw: 6, seed: 3 });
    A.blob(ctx, 0, -290, 128, 128, '#fff3d6', { wob: 1.5, lw: 4.5, seed: 8, shade: false });
    ctx.strokeStyle = A.ink; ctx.lineCap = 'round';
    for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; ctx.lineWidth = i % 3 ? 3 : 6; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 104, -290 + Math.sin(a) * 104); ctx.lineTo(Math.cos(a) * 118, -290 + Math.sin(a) * 118); ctx.stroke(); }
    // manecillas (marcan las 3:00 y enloquecen al sonar)
    const spin = ring > 0.05 ? t * 12 * ring : 0;
    ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(0, -250); ctx.lineTo(Math.cos(spin) * 58, -250 + Math.sin(spin) * 58); ctx.stroke(); ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(0, -250); ctx.lineTo(Math.cos(spin * 3 - 1.57) * 78, -250 + Math.sin(spin * 3 - 1.57) * 78); ctx.stroke();
    A.blob(ctx, 0, -250, 9, 9, A.red, { wob: .3, lw: 3, shade: false, points: 8 });
    const pl = this.arena.player, lx = clamp((pl.x - this.bx) / 420, -1, 1), ly = clamp((pl.y - 60 - (FL + this.by - 300)) / 260, -1, 1);
    if (this.dazed > 0) { for (const s of [-1, 1]) { ctx.strokeStyle = A.ink; ctx.lineWidth = 4; ctx.beginPath(); for (let i = 0; i < 14; i++) { const a = i * .9 + t * 8, r = 3 + i * 1.6; ctx.lineTo(s * 32 + Math.cos(a) * r, -326 + Math.sin(a) * r); } ctx.stroke(); } }
    else eyesA(ctx, 0, -330, 50 + atk * 6, lx, ly, true);
    // sonrisa con dientes (reutiliza la de estática pero blanca)
    const open = clamp(Math.max(this.mouth, atk * .7, ring), 0, 1), w = 120 + open * 14, y0 = -262 + atk * 5, d = w * .17 + open * w * .32;
    ctx.beginPath(); ctx.moveTo(-w / 2, y0); ctx.quadraticCurveTo(0, y0 + d * 2, w / 2, y0); ctx.quadraticCurveTo(0, y0 - 6, -w / 2, y0); ctx.closePath(); ctx.fillStyle = '#4a0d12'; ctx.fill(); inkStroke(ctx, 4.5);
    ctx.save(); ctx.clip(); ctx.fillStyle = '#ff7a8f'; ctx.beginPath(); ctx.ellipse(w * .1, y0 + d * 1.15, w * .22, d * .45, 0, 0, 7); ctx.fill(); ctx.restore();
    if (this.stars) { }
    if (hit) { ctx.globalAlpha = .4; A.blob(ctx, 0, -290, 160 * pulse, 160 * pulse, A.cream, { wob: 2.2, line: false, shade: false, seed: 3 }); ctx.globalAlpha = 1; }
    if (atk > .1) { ctx.globalAlpha = atk * .35 * (.6 + .4 * Math.sin(t * 40)); A.blob(ctx, 0, -290, 172, 172, '#ffd36e', { line: false, shade: false, wob: 3 }); ctx.globalAlpha = 1; }
    if (this.dazed > 0) { for (let i = 0; i < 4; i++) { const a = t * 5 + i * 1.57; A.star(ctx, Math.cos(a) * 120, -460 + Math.sin(a) * 22, 14, A.gold, a); } }
  }
  drawForeground(ctx, t) {
    for (const s of this.smoke) { ctx.save(); ctx.globalAlpha = (1 - s.t / s.life) * .55; A.blob(ctx, s.x, s.y - s.t * 60, s.r * (1 + s.t), s.r * (1 + s.t), '#6b6f86', { wob: 1.5, lw: 2.5, shade: false }); ctx.restore(); }
    for (const p of this.parts) {
      const k = p.t / p.life;
      if (p.type === 'puff') { ctx.save(); ctx.globalAlpha = 1 - k; for (const d of [-1, 1]) A.blob(ctx, p.x + d * (24 + k * 70), p.y - 10 - k * 20, 16 + k * 22, 12 + k * 14, '#cfd6ee', { wob: 2, lw: 3, shade: false }); ctx.restore(); }
      else if (p.type === 'pop') { ctx.save(); ctx.globalAlpha = 1 - k; A.star(ctx, p.x, p.y, 20 + k * 60, '#ffffff', k * 3); ctx.restore(); }
      else if (p.type === 'spark') { ctx.save(); ctx.globalAlpha = 1 - k; ctx.strokeStyle = '#9fe0ff'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx * .04, p.y - p.vy * .04); ctx.stroke(); ctx.restore(); }
      else if (p.type === 'chunk') { ctx.save(); ctx.globalAlpha = 1 - k * k; ctx.translate(p.x, p.y); ctx.rotate(p.rot); A.blob(ctx, 0, 0, p.r, p.r * .7, p.col, { wob: 2, lw: 3.5, points: 8 }); ctx.restore(); }
    }
    // polvo de luz azul flotando
    if (this.light > .1) { ctx.save(); ctx.fillStyle = '#bfe9ff'; for (let i = 0; i < 14; i++) { const x = (i * 197 + t * (8 + i % 4 * 4)) % 1300, y = 80 + (i * 83 + Math.sin(t * .6 + i) * 30) % 520; ctx.globalAlpha = (.15 + .15 * Math.sin(t * 2 + i)) * this.light; ctx.beginPath(); ctx.arc(x, y, 2 + i % 3, 0, 7); ctx.fill(); } ctx.restore(); }
    if (this.shout) {
      this.shout.t += 1 / 60; const s = this.shout, k = ease.outElastic(clamp(s.t / .5, 0, 1));
      if (s.t < 1.2) { ctx.save(); ctx.translate(W * .45, H * .3); ctx.rotate(-.06); ctx.scale(k, k); ctx.globalAlpha = clamp(1.2 - s.t, 0, 1) * 1.2; A.text(ctx, s.txt, 0, 0, 92, { fill: '#9fe0ff', lw: 14 }); ctx.restore(); }
    }
    if (this.dead && this.deadT > 1.6) { const k = clamp((this.deadT - 1.6) / .6, 0, 1); ctx.save(); ctx.globalAlpha = k; ctx.fillStyle = 'rgba(255,225,160,.12)'; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  }
}

MG.registerBoss({
  id: 'pantallon', nombre: 'El Pantallón', area: 'Sueño', intro: '¿Un capítulo más? ¡Uno solito!', music: 'pantallon', parTime: 120, color: '#4f8fc0',
  mapIcon(ctx, x, y, s, t) {
    t = t || 0; ctx.save(); ctx.translate(x, y + Math.sin(t * 3) * 2 * s); ctx.scale(s, s);
    for (const sd of [-1, 1]) { A.hose(ctx, sd * 14, 20, sd * 18, 36, 0, 6, '#e8d9b0'); A.blob(ctx, sd * 20, 38, 11, 5, sd < 0 ? '#c8503a' : '#3c5aa8', { wob: .4, lw: 3, shade: false, points: 8 }); }
    A.hose(ctx, -8, -24, -22, -44, 4, 4, '#b8b8c8'); A.hose(ctx, 8, -24, 20, -45, -4, 4, '#b8b8c8');
    for (const [ax, ay] of [[-22, -46], [20, -47]]) A.blob(ctx, ax, ay, 5, 5, '#e1b94e', { wob: .3, lw: 2.5, shade: false, points: 8 });
    ctx.beginPath(); for (let i = 0; i <= 28; i++) { const th = i / 28 * 6.283, c = Math.cos(th), sn = Math.sin(th); ctx[i ? 'lineTo' : 'moveTo'](Math.sign(c) * Math.pow(Math.abs(c), .6) * 36 + A.j(i, .8), Math.sign(sn) * Math.pow(Math.abs(sn), .6) * 30 + A.j(i + 5, .8)); } ctx.closePath();
    ctx.fillStyle = '#a86b3f'; ctx.fill(); inkStroke(ctx, 4);
    A.blob(ctx, -3, 0, 24, 20, '#5cc8ff', { wob: 1, lw: 3.5, shade: false });
    A.eyes(ctx, -3, -4, 14, 0, 0, null);
    ctx.strokeStyle = A.ink; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-14, 10); for (let i = 0; i < 6; i++) ctx.lineTo(-14 + i * 5.6, 10 + (i % 2 ? -3 : 3)); ctx.stroke();
    ctx.restore();
  },
  create(arena, opts) { return new Pantallon(arena, opts); }
});
})();
