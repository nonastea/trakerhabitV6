/* ==========================================================================
   LA FLOJERA — jefe de «Cuerpo» (la flojera de ir al gimnasio).
   3 fases: sillón viviente → sillón de resortes que rebota → La Flojera de verdad,
   un perezoso/babosa gigante hecho de frazada. Todo dibujado con código (MG.art).
   Escenario: un living gigante visto desde el tamaño de un juguete, con el
   gimnasio iluminado al otro lado de la calle (se enciende del todo al ganar).
   ========================================================================== */
(function () {
'use strict';
const MG = window.MG, A = MG.art, W = MG.W, H = MG.H, FLOOR = 620;
const clamp = MG.clamp, lerp = MG.lerp, rand = MG.rand, pick = MG.pick, TAU = Math.PI * 2;
const TEAL = '#5f9f95', TEAL_L = '#7cb9ad', TEAL_D = '#3f6f6a', TEAL_M = '#4d8a80';
const WOOD = '#7a4a2a', WOOD_L = '#a06a3c';
const SKIN = '#d9b98f';
const SOFT = 'rgba(60,32,14,.5)';
const sfx = n => { try { MG.audio && MG.audio.sfx && MG.audio.sfx(n); } catch (e) {} };
const mkc = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };
let _s = 11; const rnd = () => (_s = (_s * 16807) % 2147483647, (_s - 1) / 2147483646);
const ri = () => Math.floor(Math.random() * 1000);
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
// contorno de blob correcto (el A.blob del motor traza el contorno sobre el brillo interior cuando hay sombra)
function bpath(rx, ry, opt) {
  opt = opt || {}; const n = opt.points || 18, wob = opt.wob == null ? 1.6 : opt.wob, sd = opt.seed || 0, p = new Path2D();
  for (let i = 0; i <= n; i++) {
    const a = i / n * TAU, k = i % n, px = Math.cos(a) * (rx + A.j(k + sd, wob)), py = Math.sin(a) * (ry + A.j(k + 7 + sd, wob));
    if (i === 0) p.moveTo(px, py); else p.lineTo(px, py);
  }
  p.closePath(); return p;
}
function blob(ctx, x, y, rx, ry, fill, opt) {
  opt = opt || {}; const p = bpath(rx, ry, opt);
  ctx.save(); ctx.translate(x, y); ctx.rotate(opt.rot || 0);
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

/* ---------- estampado de frazada (patchwork) ---------- */
let QUILT = null;
function quiltPattern(ctx) {
  if (!QUILT) {
    const [c, x] = mkc(96, 96); const cols = ['#7a9a6a', '#d9a441', '#b9573a', '#efe0c4'];
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { x.fillStyle = cols[(i * 2 + j + (i ? 1 : 0)) % 4]; x.fillRect(i * 48, j * 48, 48, 48); }
    x.strokeStyle = 'rgba(255,255,255,.35)'; x.lineWidth = 3; for (let k = 0; k < 4; k++) { x.beginPath(); x.moveTo(0, k * 24 + 12); x.lineTo(96, k * 24 + 12); x.stroke(); }
    x.strokeStyle = 'rgba(40,20,10,.35)'; x.lineWidth = 2; x.setLineDash([5, 5]); x.strokeRect(2, 2, 44, 44); x.strokeRect(50, 2, 44, 44); x.strokeRect(2, 50, 44, 44); x.strokeRect(50, 50, 44, 44);
    x.fillStyle = 'rgba(40,20,10,.35)'; for (let i = 0; i < 4; i++) { x.beginPath(); x.arc(24 + (i % 2) * 48, 24 + (i >> 1) * 48, 3, 0, TAU); x.fill(); }
    QUILT = ctx.createPattern(c, 'repeat');
  }
  return QUILT;
}

/* ============================ escenario ============================ */
let BG = null;
const WIN = { x: 200, y: 62, w: 450, h: 372 };
function buildBG() {
  const M = 80, WW = W + M * 2;
  /* ---- calle + cielo (se dibuja detrás de la pared, solo lo estático) ---- */
  const [sky, s] = mkc(WIN.w, WIN.h);
  let g = s.createLinearGradient(0, 0, 0, WIN.h); g.addColorStop(0, '#6f5b8f'); g.addColorStop(.45, '#e9a07a'); g.addColorStop(1, '#f6cf94');
  s.fillStyle = g; s.fillRect(0, 0, WIN.w, WIN.h);
  s.fillStyle = 'rgba(80,55,90,.55)';
  for (let i = 0; i < 9; i++) { const bx = i * 56 - 10, bh = 70 + rnd() * 90; s.fillRect(bx, 330 - bh, 48, bh); }
  s.fillStyle = '#4a3b52'; s.fillRect(0, 322, WIN.w, 60);                      // calle
  s.fillStyle = '#5d4a62'; s.fillRect(0, 322, WIN.w, 8);
  s.fillStyle = '#e8d7a0'; for (let i = 0; i < 9; i++) s.fillRect(i * 56 + 6, 352, 30, 5);
  for (let i = 0; i < 20; i++) { s.fillStyle = 'rgba(255,240,200,.7)'; s.fillRect(rnd() * WIN.w, rnd() * 130, 2, 2); }
  /* ---- pared con el hueco de la ventana ---- */
  const [wall, w] = mkc(WW, H); w.translate(M, 0);
  w.fillStyle = '#c99a63'; w.fillRect(-M, 0, WW, H);
  for (let x = -M; x < W + M; x += 64) { w.fillStyle = ((x / 64) | 0) % 2 ? 'rgba(160,100,50,.2)' : 'rgba(255,230,170,.12)'; w.fillRect(x, 0, 32, 600); }
  for (let y = 40; y < 470; y += 118) for (let x = -M + 30; x < W + M; x += 128) {      // flores de damasco
    w.fillStyle = 'rgba(120,70,30,.22)'; const ox = ((y / 118) | 0) % 2 ? 64 : 0;
    for (let k = 0; k < 4; k++) { w.beginPath(); w.ellipse(x + ox + Math.cos(k * 1.57) * 12, y + Math.sin(k * 1.57) * 12, 10, 6, k * 1.57, 0, TAU); w.fill(); }
    w.beginPath(); w.arc(x + ox, y, 5, 0, TAU); w.fill();
  }
  box(w, -M, 468, WW, 14, WOOD_L, 4, 2, SOFT);                                    // moldura
  w.fillStyle = WOOD; w.fillRect(-M, 482, WW, 100); w.fillStyle = 'rgba(0,0,0,.18)'; w.fillRect(-M, 482, WW, 100);
  for (let x = -M + 10; x < W + M; x += 110) box(w, x, 496, 92, 70, null, 3, 3, 'rgba(30,15,5,.45)');
  box(w, -M, 566, WW, 22, '#4b2c17', 4, 2, SOFT);                                // zócalo
  // ventana: recortar el hueco
  w.save(); w.globalCompositeOperation = 'destination-out'; w.fillRect(WIN.x, WIN.y, WIN.w, WIN.h); w.restore();
  box(w, WIN.x - 14, WIN.y - 14, WIN.w + 28, WIN.h + 28, null, 10, 4, A.ink);
  w.lineWidth = 16; w.strokeStyle = '#8a5a35'; w.strokeRect(WIN.x - 12, WIN.y - 12, WIN.w + 24, WIN.h + 24);
  w.lineWidth = 12; w.strokeStyle = A.ink; w.beginPath(); w.moveTo(WIN.x, WIN.y + WIN.h * .88); w.lineTo(WIN.x + WIN.w, WIN.y + WIN.h * .88); w.stroke();
  w.lineWidth = 7; w.strokeStyle = '#8a5a35'; w.stroke();
  box(w, WIN.x - 26, WIN.y + WIN.h + 4, WIN.w + 52, 22, '#8a5a35', 5, 3);        // alféizar
  // cortinas pesadas y cenefa
  for (const sd of [-1, 1]) {
    const cx = sd < 0 ? WIN.x - 40 : WIN.x + WIN.w + 40;
    poly(w, [[cx - 44, WIN.y - 30], [cx + 44, WIN.y - 30], [cx + 54 * sd, WIN.y + WIN.h + 20], [cx - 54 * sd, WIN.y + WIN.h + 20]], '#8e3b3b', 5);
    w.strokeStyle = 'rgba(40,10,10,.4)'; w.lineWidth = 4; for (let k = -2; k <= 2; k++) { w.beginPath(); w.moveTo(cx + k * 16, WIN.y - 24); w.quadraticCurveTo(cx + k * 18 + 8, WIN.y + 190, cx + k * 20 + 4 * sd, WIN.y + WIN.h + 16); w.stroke(); }
    box(w, cx - 10 * sd - 8, WIN.y + 200, 16, 38, BRASS, 3, 5);               // alzapaños
  }
  poly(w, [[WIN.x - 90, WIN.y - 52], [WIN.x + WIN.w + 90, WIN.y - 52], [WIN.x + WIN.w + 80, WIN.y - 12], [WIN.x - 80, WIN.y - 12]], '#a64848', 5);
  for (let x = WIN.x - 70; x < WIN.x + WIN.w + 80; x += 28) { w.fillStyle = BRASS; w.beginPath(); w.arc(x, WIN.y - 10, 6, 0, TAU); w.fill(); w.stroke(); }
  // cuadros y reloj en la pared derecha
  box(w, 790, 74, 150, 112, '#8a5a35', 6, 4); box(w, 800, 84, 130, 92, '#e8d7a0', 3, 2);
  blob(w, 865, 140, 38, 26, '#d99c5c', { wob: 1, lw: 3, shade: false }); blob(w, 835, 126, 14, 14, '#d99c5c', { wob: .5, lw: 3, shade: false });
  w.strokeStyle = A.ink; w.lineWidth = 3; w.beginPath(); w.moveTo(845, 138); w.quadraticCurveTo(852, 144, 860, 138); w.moveTo(824, 126); w.lineTo(830, 128); w.stroke();
  A.text(w, 'z z', 880, 116, 18, { font: 'ui', fill: A.cream, lw: 3 });
  box(w, 970, 90, 200, 80, '#8a5a35', 6, 4); box(w, 980, 99, 180, 62, A.cream, 3, 2);
  A.text(w, 'CAMPEÓN DE LA SIESTA', 1070, 120, 14, { font: 'ui', fill: A.red, lw: 3 }); A.text(w, '★ 2026 ★', 1070, 144, 18, { font: 'ui', fill: BRASS, lw: 3 });
  blob(w, 1070, 250, 44, 44, A.cream, { wob: 1, lw: 6, shade: false, points: 22 }); blob(w, 1070, 250, 36, 36, '#f6ecd2', { wob: .4, lw: 2.5, shade: false });
  w.strokeStyle = A.ink; w.lineWidth = 4; w.lineCap = 'round'; w.beginPath(); w.moveTo(1070, 250); w.lineTo(1070, 226); w.moveTo(1070, 250); w.lineTo(1086, 252); w.stroke();
  for (let k = 0; k < 12; k++) { w.beginPath(); w.moveTo(1070 + Math.cos(k * TAU / 12) * 31, 250 + Math.sin(k * TAU / 12) * 31); w.lineTo(1070 + Math.cos(k * TAU / 12) * 35, 250 + Math.sin(k * TAU / 12) * 35); w.stroke(); }
  w.fillStyle = 'rgba(40,20,5,.16)'; w.fillRect(-M, 0, WW, H);
  /* ---- muebles: biblioteca, mesita con radio, lámpara de pie, calcetín gigante ---- */
  const [fur, f] = mkc(WW, H); f.translate(M, 0);
  box(f, -20, 100, 190, 470, '#6b3f22', 6, 4);
  for (let r = 0; r < 4; r++) {
    const ty = 140 + r * 112; box(f, -8, ty + 82, 166, 12, WOOD_L, 4, 2);
    let bx = -2; const cols = ['#a64848', '#4f7d9c', '#d9a441', '#6d8f4e', '#7d5ba6', '#b9573a', '#3f6f6a'];
    for (let i = 0; i < 7 && bx < 148; i++) { const bw = 18 + rnd() * 14, bh = 52 + rnd() * 28, lean = (r === 1 && i === 5) ? .22 : 0;
      f.save(); f.translate(bx + bw / 2, ty + 82); f.rotate(lean); box(f, -bw / 2, -bh, bw, bh, cols[(i + r * 3) % 7], 3, 2);
      f.fillStyle = 'rgba(255,240,200,.65)'; f.fillRect(-bw / 2 + 3, -bh + 10, bw - 6, 5); f.fillRect(-bw / 2 + 3, -bh + 20, bw - 6, 3); f.restore(); bx += bw + 3; }
  }
  box(f, 700, 478, 170, 18, WOOD_L, 5, 3); for (const x of [716, 836]) box(f, x, 496, 16, 80, WOOD, 4, 3); box(f, 706, 560, 160, 14, WOOD, 4, 3);
  box(f, 720, 376, 130, 104, '#9a5a30', 6, 14); box(f, 732, 388, 70, 80, '#d7b878', 3, 8);
  f.strokeStyle = 'rgba(60,30,10,.55)'; f.lineWidth = 2.5; for (let i = 0; i < 6; i++) { f.beginPath(); f.moveTo(740, 398 + i * 12); f.lineTo(796, 398 + i * 12); f.stroke(); }
  box(f, 812, 396, 28, 28, '#2b1d12', 3, 14); box(f, 812, 436, 28, 28, '#2b1d12', 3, 14);
  f.strokeStyle = A.ink; f.lineWidth = 4; f.beginPath(); f.moveTo(780, 376); f.lineTo(760, 330); f.stroke();
  f.fillStyle = A.red; f.beginPath(); f.arc(760, 328, 6, 0, TAU); f.fill();
  // lámpara de pie con pantalla de flecos
  const lx = 1195; box(f, lx - 46, 600, 92, 18, '#3a2a20', 5, 8); f.strokeStyle = A.ink; f.lineWidth = 12; f.beginPath(); f.moveTo(lx, 604); f.lineTo(lx, 290); f.stroke(); f.strokeStyle = BRASS; f.lineWidth = 6; f.stroke();
  poly(f, [[lx - 54, 170], [lx + 54, 170], [lx + 88, 296], [lx - 88, 296]], '#e8c982', 6);
  f.fillStyle = 'rgba(255,255,255,.25)'; f.fillRect(lx - 40, 176, 18, 112);
  for (let x = lx - 84; x <= lx + 84; x += 14) { f.strokeStyle = A.ink; f.lineWidth = 3; f.beginPath(); f.moveTo(x, 296); f.lineTo(x - 1, 316); f.stroke(); }
  // calcetín gigante rayado con agujero, tirado al frente
  f.save(); f.translate(180, 598); f.rotate(-.04);
  poly(f, [[-60, 0], [30, 0], [60, 28], [70, 64], [-90, 64], [-90, 18]], '#efe0c4', 5);
  for (let i = 0; i < 4; i++) { f.fillStyle = i % 2 ? '#b9573a' : '#4f7d9c'; f.fillRect(-88 + i * 4, 4 + i * 14, 150, 8); }
  blob(f, 40, 50, 16, 11, '#f0b49e', { wob: 1, lw: 3, shade: false });
  f.restore();
  f.fillStyle = 'rgba(40,20,5,.1)'; f.fillRect(-M, 0, WW, H);
  /* ---- piso de madera con alfombra y flecos ---- */
  const [flo, fl] = mkc(WW, H); fl.translate(M, 0);
  const vx = 640, vy = 300;
  fl.fillStyle = '#8a5a35'; fl.fillRect(-M, 575, WW, 160);
  for (let c = -16; c < 18; c++) { fl.strokeStyle = 'rgba(40,20,5,.35)'; fl.lineWidth = 2; fl.beginPath(); fl.moveTo(vx + c * 90 * (575 - vy) / 320, 575); fl.lineTo(vx + c * 90 * (735 - vy) / 320, 735); fl.stroke(); }
  for (const y of [596, 620, 652, 690]) { fl.strokeStyle = 'rgba(40,20,5,.25)'; fl.beginPath(); fl.moveTo(-M, y); fl.lineTo(W + M, y); fl.stroke(); }
  fl.fillStyle = 'rgba(60,30,10,.22)'; fl.fillRect(-M, 575, WW, 16);
  // alfombra
  poly(fl, [[90, 598], [1190, 598], [1380, 735], [-100, 735]], '#8e3b3b', 0);
  poly(fl, [[120, 606], [1160, 606], [1330, 735], [-50, 735]], '#a64848', 0);
  fl.save(); fl.beginPath(); fl.moveTo(120, 606); fl.lineTo(1160, 606); fl.lineTo(1330, 735); fl.lineTo(-50, 735); fl.closePath(); fl.clip();
  for (let r = 0; r < 4; r++) for (let c = -2; c < 12; c++) {
    const k = (610 + r * 36 - vy) / 320, y = 610 + r * 36 + 14 * k, cx2 = vx + (c * 130 - 640 + (r % 2 ? 65 : 0)) * k;
    poly(fl, [[cx2, y - 24 * k], [cx2 + 40 * k, y], [cx2, y + 24 * k], [cx2 - 40 * k, y]], r % 2 ? '#efe0c4' : '#d9a441', 3, 'rgba(40,10,10,.7)');
  }
  fl.restore();
  fl.strokeStyle = 'rgba(30,8,8,.8)'; fl.lineWidth = 4; fl.beginPath(); fl.moveTo(90, 598); fl.lineTo(1190, 598); fl.stroke();
  for (let x = 96; x < 1186; x += 14) { fl.strokeStyle = A.ink; fl.lineWidth = 6; fl.beginPath(); fl.moveTo(x, 598); fl.quadraticCurveTo(x + (rnd() - .5) * 8, 592, x + (rnd() - .5) * 14, 584); fl.stroke(); fl.strokeStyle = '#efe0c4'; fl.lineWidth = 3; fl.stroke(); }
  fl.strokeStyle = A.ink; fl.lineWidth = 4; fl.beginPath(); fl.moveTo(-M, 620); fl.lineTo(0, 620); fl.moveTo(W, 620); fl.lineTo(W + M, 620); fl.stroke();
  // brillo de la lámpara en el suelo + migajas gigantes
  for (let i = 0; i < 14; i++) blob(fl, 80 + rnd() * 1100, 640 + rnd() * 60, 5 + rnd() * 7, 4 + rnd() * 5, '#d4a35e', { wob: .8, lw: 2.5, shade: false, seed: i });
  /* ---- halo de la lámpara (cacheado) ---- */
  const [glow, gl] = mkc(420, 420); const gg = gl.createRadialGradient(210, 210, 10, 210, 210, 210);
  gg.addColorStop(0, 'rgba(255,230,150,.7)'); gg.addColorStop(.5, 'rgba(255,200,110,.22)'); gg.addColorStop(1, 'rgba(255,200,110,0)'); gl.fillStyle = gg; gl.fillRect(0, 0, 420, 420);
  const [beam, bm] = mkc(700, 800); const bg = bm.createLinearGradient(0, 200, 700, 400); bg.addColorStop(0, 'rgba(255,230,140,.6)'); bg.addColorStop(1, 'rgba(255,230,140,0)');
  bm.fillStyle = bg; bm.beginPath(); bm.moveTo(0, 185); bm.lineTo(700, 0); bm.lineTo(700, 800); bm.lineTo(0, 215); bm.closePath(); bm.fill();
  BG = { sky, wall, fur, flo, glow, beam, M };
}
const BRASS = '#d9a441';
const KS = .93;                    // escala de La Flojera (fase 3)

/* ============================ piezas ============================ */
function drawCushion(ctx, x, y, rot, pink, v, r) {
  r = r || 30;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  const col = pink ? A.pink : ['#e3c565', '#e69a5a', '#efe0c4'][v % 3];
  box(ctx, -r, -r, r * 2, r * 2, col, 4, r * .45);
  ctx.strokeStyle = pink ? '#ffd0e4' : 'rgba(80,40,10,.4)'; ctx.lineWidth = 2; ctx.setLineDash([4, 4]); rr(ctx, -r + 6, -r + 6, r * 2 - 12, r * 2 - 12, r * .35); ctx.stroke(); ctx.setLineDash([]);
  blob(ctx, 0, 0, 6, 6, pink ? '#ffd0e4' : '#b9573a', { wob: .3, lw: 2.5, shade: false });
  for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { ctx.strokeStyle = A.ink; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(sx * r, sy * r); ctx.lineTo(sx * (r + 8), sy * (r + 8)); ctx.stroke(); blob(ctx, sx * (r + 10), sy * (r + 10), 4, 4, BRASS, { wob: .2, lw: 2, shade: false, points: 8 }); }
  if (pink) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(-14, -16); ctx.quadraticCurveTo(-24, -26, -14, -30); ctx.fill(); }
  ctx.restore();
}
function drawChip(ctx, x, y, rot) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  blob(ctx, 0, 0, 19, 14, '#f0cd5a', { wob: 2.2, lw: 3.5, points: 12, shade: false, seed: 3 });
  ctx.fillStyle = 'rgba(160,90,20,.55)'; for (const [a, b] of [[-6, -3], [5, 2], [-2, 5], [8, -5]]) { ctx.beginPath(); ctx.arc(a, b, 1.8, 0, TAU); ctx.fill(); }
  ctx.restore();
}
function drawDumbbell(ctx, x, y, rot, t) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.fillStyle = 'rgba(255,95,162,.3)'; ctx.beginPath(); ctx.arc(0, 0, 46 + Math.sin(t * 9) * 3, 0, TAU); ctx.fill();
  box(ctx, -30, -6, 60, 12, '#d9d2c4', 3.5, 4);
  for (const s of [-1, 1]) { box(ctx, s * 24 - 8, -24, 16, 48, A.pink, 4, 6); box(ctx, s * 38 - 5, -16, 10, 32, '#ff8fbf', 3.5, 4); }
  ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillRect(-30, -22, 3, 20);
  A.star(ctx, -34, -30, 7, A.cream, t * 3); A.star(ctx, 36, 28, 6, A.cream, -t * 3);
  ctx.restore();
}
function drawZ(ctx, x, y, rot, pink, t) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  if (pink) { ctx.fillStyle = 'rgba(255,95,162,.3)'; ctx.beginPath(); ctx.arc(0, 0, 34, 0, TAU); ctx.fill(); }
  A.text(ctx, 'Z', 0, 0, 46, { fill: pink ? A.pink : '#c9bcf0', lw: 8 });
  A.text(ctx, 'z', 20, -22, 22, { fill: pink ? '#ffd0e4' : '#e4dcfa', lw: 5 });
  ctx.restore();
}
function drawRemote(ctx, x, y, rot, t, sq, lookX) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(1 + sq, 1 - sq);
  box(ctx, -44, -19, 88, 38, '#3c3c46', 4.5, 10);
  box(ctx, -38, -13, 40, 26, '#2a2a32', 2, 5);
  for (let i = 0; i < 4; i++) blob(ctx, 12 + (i % 2) * 14, -7 + (i >> 1) * 14, 5, 5, ['#d8432e', '#6aa84f', '#e3c565', '#4f8fc0'][i], { wob: .2, lw: 1.5, shade: false, points: 8 });
  blob(ctx, -28, 0, 7, 7, A.red, { wob: .2, lw: 2, shade: false, points: 8 });
  for (const sx of [-24, -4]) { blob(ctx, sx, -22, 11, 11, A.cream, { wob: .2, lw: 3, shade: false, points: 10 }); blob(ctx, sx + (lookX || -1) * 3, -22, 4.5, 4.5, A.ink, { wob: .1, lw: 1, shade: false, points: 8 }); }
  ctx.restore();
}
function drawSpring(ctx, x, yTop, yBot, wid, turns) {
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const pts = []; for (let i = 0; i <= turns * 2; i++) pts.push([x + (i % 2 ? wid : -wid), yTop + (yBot - yTop) * i / (turns * 2)]);
  for (const [w, c] of [[11, A.ink], [6, '#b9c0c4']]) { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); pts.forEach((p, i) => ctx[i ? 'lineTo' : 'moveTo'](p[0], p[1])); ctx.stroke(); }
  ctx.restore();
}

/* ============================ el jefe ============================ */
class Flojera extends MG.Boss {
  constructor(arena, opts) {
    super(arena, { hp: 1450, phases: [.66, .33], difficulty: opts.difficulty, x: 950, y: FLOOR });
    Object.assign(this, { pose: 'idle', poseT: 0, sq: 0, sqv: 0, cx: 950, air: 0, last: '', warn: 0, introT: 0, deadT: 0, transT: 0, mouth: 0, lids: .55,
      armL: { x: -195, y: -60 }, armR: { x: 195, y: -60 }, hold: null, suck: 0, springOut: 0, sp: 0, shards: [], sheets: [], zones: [], gymLit: 0, revealK: 0,
      slamT: 0, tilt: 0, bubble: 0, slimeT: 0, deflate: 0, dumb: 0, hop: null });
    this.state = 'intro';
  }
  get W_() { return Math.max(.5, .68 - (this.difficulty - 1) * .25); }
  kick(v) { this.sqv += v; }
  takeDamage(n) { super.takeDamage(n); if (n > 0 && !this.dead && this.state === 'fight') this.sqv += 1.1; }
  spring(dt) { this.sqv += (-this.sq * 200 - this.sqv * 10) * dt; this.sq += this.sqv * dt; }

  introUpdate(dt) {
    this.introT += dt; this.t += dt; this.poseT += dt; this.spring(dt);
    this.lids = lerp(this.lids, this.introT > 1.2 ? .2 : .7, 1 - Math.exp(-dt * 4));
    if (this.introT > 1.2 && !this.said) { this.said = true; this.pose = 'yawn'; this.poseT = 0; this.kick(-4); }
    this.layout();
  }
  start() { this.state = 'fight'; this.pose = 'idle'; this.after(.6, () => this.pick()); }
  pick() {
    if (this.dead || this.state !== 'fight') return;
    const list = [null, ['cush', 'suck', 'remote'], ['slam', 'snack', 'slam', 'cush'], ['wave', 'zzz', 'wave', 'zzz']][this.phase];
    let a, n = 0; do { a = pick(list); } while (a === this.last && n++ < 8); this.last = a; this['atk_' + a]();
  }
  rest(s) { this.pose = 'idle'; this.poseT = 0; this.hold = null; this.suck = 0; this.after((s || 1.2) / Math.sqrt(this.difficulty), () => this.pick()); }

  onPhase(n) {
    this.clearTimers(); this.state = 'trans'; this.transT = 0; this.pose = 'idle'; this.poseT = 0; this.warn = 0; this.hold = null; this.suck = 0; this.hop = null; this.zones = [];
    this.arena.enemyProj.forEach(p => { if (!p.pink) p.dead = true; });
    this.sheets.length = 0;
    if (n === 2) {
      this.kick(-6); this.pose = 'yawn';
      this.after(.5, () => { this.springOut = 1; this.kick(9); MG.fx.shake(10, .35); sfx('phase'); this.fluff(this.cx, 400, 16); this.air = 0; });
      this.after(1.2, () => { this.state = 'fight'; this.pick(); });
    } else {
      this.kick(-7);
      this.after(.6, () => {                                       // el sillón revienta y sale La Flojera
        this.burst = true; MG.fx.shake(16, .5); MG.fx.flash('#fff', .2); sfx('phase'); this.fluff(this.cx, 400, 28);
        for (let i = 0; i < 12; i++) this.shards.push({ x: this.cx + rand(-120, 120), y: 380 + rand(-100, 60), vx: rand(-420, 420), vy: rand(-900, -300), r: rand(16, 34), rot: rand(0, 6), vr: rand(-8, 8), c: [TEAL, TEAL_L, WOOD, TEAL_D][i % 4], rest: false });
        this.cx = 990; this.revealT = 0;
      });
      this.after(1.8, () => { this.state = 'fight'; this.pick(); });
    }
  }
  onDeath() {
    this.state = 'dead'; this.deadT = 0; this.clearTimers(); this.suck = 0; this.sheets.length = 0; this.zones = [];
    this.fluff(this.cx, 450, 20); sfx('phase');
  }

  /* ---------- efectos ---------- */
  fluff(x, y, n) {
    for (let i = 0; i < n; i++) {
      const a = rand(0, TAU), sp = rand(80, 360);
      this.fx({ t: 0, dur: rand(.6, 1.2), x: x + rand(-40, 40), y: y + rand(-40, 40), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 140, r: rand(10, 22),
        update(dt) { this.t += dt; this.vy += 380 * dt; this.x += this.vx * dt; this.y += this.vy * dt; this.vx *= .985; return this.t < this.dur; },
        draw(ctx) { const k = this.t / this.dur; ctx.save(); ctx.globalAlpha = 1 - k * k; blob(ctx, this.x, this.y, this.r, this.r * .8, A.cream, { wob: this.r * .2, lw: 2.5, shade: false, points: 10 }); ctx.restore(); } });
    }
  }
  dust(x, n) {
    for (let i = 0; i < n; i++) {
      const s = i % 2 ? 1 : -1;
      this.fx({ t: 0, dur: rand(.4, .7), x: x + rand(-60, 60), y: FLOOR - 6, vx: s * rand(80, 280), vy: rand(-90, -20), r: rand(14, 26),
        update(dt) { this.t += dt; this.x += this.vx * dt; this.y += this.vy * dt; return this.t < this.dur; },
        draw(ctx) { const k = this.t / this.dur; A.puff(ctx, this.x, this.y, this.r * (.6 + k * .7), 1 - k); } });
    }
  }
  telegraph(x, w, dur) {                  // sombra de aviso en el piso (inofensiva)
    return this.spawn({ x, y: FLOOR, r: 1, harmless: true, life: dur, vx: 0, vy: 0, w,
      onDraw(ctx) { const k = clamp(this.t / dur, 0, 1), bl = (Math.floor(this.t * 12) % 2) ? 1 : .6;
        ctx.save(); ctx.globalAlpha = bl * (.35 + k * .4); ctx.fillStyle = '#7a2a2a'; ctx.beginPath(); ctx.ellipse(this.x, FLOOR + 2, this.w * (.55 + k * .45), 22 + k * 8, 0, 0, TAU); ctx.fill();
        ctx.globalAlpha = 1; ctx.strokeStyle = A.red; ctx.lineWidth = 5; ctx.setLineDash([14, 10]); ctx.beginPath(); ctx.ellipse(this.x, FLOOR + 2, this.w, 28, 0, 0, TAU); ctx.stroke(); ctx.setLineDash([]); ctx.restore(); } });
  }

  /* ---------- ataques: fase 1 y 2 ---------- */
  atk_cush() {
    const W_ = this.W_, d = this.difficulty, p = this.arena.player;
    this.pose = 'cush'; this.poseT = 0; this.warn = W_; this.kick(-3); this.hold = 'cush';
    this.after(W_, () => {
      this.pose = 'cthrow'; this.poseT = 0; this.kick(6); this.hold = null; sfx('hit');
      const n = d > 1.2 ? 4 : 3, pinkI = ri() % n;
      for (let i = 0; i < n; i++) this.after(i * .3, () => {
        const px = p ? p.x : 260, x0 = this.cx - 170, y0 = this.baseY() - 230, T = .85 + i * .06, tx = clamp(px + (i - 1) * 140 + rand(-50, 50), 90, 780), g = 1500;
        this.spawn({ x: x0, y: y0, vx: (tx - x0) / T, vy: (FLOOR - 30 - y0) / T - g * T / 2, grav: g, bounce: .8, r: 30, pink: i === pinkI, life: 8, spin: rand(-6, 6), v: ri(),
          onDraw(ctx) { drawCushion(ctx, this.x, this.y, this.rot, this.pink, this.v, 29); } });
      });
      this.after(n * .3 + .6, () => this.rest(1.1));
    });
  }
  atk_suck() {
    const W_ = this.W_ + .25, d = this.difficulty, p = this.arena.player;
    this.pose = 'yawn'; this.poseT = 0; this.warn = W_; this.kick(-5); this.mouthT = 1;
    this.after(W_, () => {
      this.pose = 'suck'; this.poseT = 0; this.suck = 1.5; sfx('hit'); this.kick(5);
      const crumbs = d > 1.2 ? 6 : 5;
      for (let i = 0; i < crumbs; i++) this.after(.15 + i * .26, () => {
        const px = p ? p.x : 260, x0 = this.cx - 150, y0 = this.baseY() - 210, T = .8, g = 1000;
        this.spawn({ x: x0, y: y0, vx: (clamp(px, 100, 800) - x0) / T, vy: (FLOOR - 14 - y0) / T - g * T / 2, grav: g, r: 10, life: 3, spin: rand(-8, 8), seed: i,
          onDraw(ctx) { blob(ctx, this.x, this.y, 10, 8, '#d4a35e', { wob: 1.2, lw: 3, shade: false, points: 9, rot: this.rot, seed: this.seed }); ctx.fillStyle = '#8c5a22'; ctx.fillRect(this.x - 3, this.y - 1, 3, 2); } });
      });
      this.after(1.55, () => { this.suck = 0; this.kick(-3); this.rest(.9); });
    });
  }
  atk_remote() {
    const W_ = this.W_, d = this.difficulty;
    this.pose = 'remote'; this.poseT = 0; this.warn = W_; this.kick(-3); this.hold = 'remote';
    this.after(W_, () => {
      this.pose = 'rthrow'; this.poseT = 0; this.kick(5); this.hold = null; sfx('hit');
      const self = this, x0 = this.cx - 150, y0 = this.baseY() - 250, hopT = d > 1.2 ? .22 : .32;
      this.spawn({ x: x0, y: y0, vx: -230, vy: -150, grav: 1700, r: 27, life: 9, mode: 'fall', wait: 0, hops: 0, sq: 0,
        onUpdate(dt, ar) {
          const pl = ar.player;
          if (this.mode !== 'wait' && this.y + this.r >= FLOOR && this.vy > 0) { this.y = FLOOR - this.r; this.vy = 0; this.vx = 0; this.mode = 'wait'; this.wait = 0; self.dust(this.x, 2); }
          if (this.mode === 'wait') { this.wait += dt; this.vy = 0; this.y = FLOOR - this.r; this.sq = Math.sin(clamp(this.wait / hopT, 0, 1) * Math.PI) * .25;
            if (this.wait >= hopT) { this.mode = 'air'; this.vy = -600; this.vx = -(260 + Math.min(80, this.hops * 20)); this.hops++; this.sq = 0; } }
          else this.sq = lerp(this.sq, this.vy < 0 ? -.1 : .1, .2);
          this.look = pl ? Math.sign(pl.x - this.x) : -1;
        },
        onDraw(ctx) { drawRemote(ctx, this.x, this.y, this.mode === 'air' ? Math.sin(this.t * 10) * .15 : 0, this.t, this.sq, this.look); } });
      this.after(.8, () => this.rest(1.6));
    });
  }
  atk_slam() {
    const W_ = this.W_ + .4, d = this.difficulty, p = this.arena.player;
    const px = p ? p.x : 260, x1 = clamp(px + rand(-60, 60), 420, 960), T = .75, x0 = this.cx;
    this.pose = 'jumpwind'; this.poseT = 0; this.warn = W_; this.kick(-9);
    this.telegraph(x1, 175, W_ + T + .05);
    this.after(W_, () => {
      this.pose = 'air'; this.poseT = 0; this.kick(8); sfx('hit');
      this.hop = { t: 0, T, x0, x1, h: 330 };
      this.after(T, () => {
        this.hop = null; this.air = 0; this.cx = x1; this.pose = 'land'; this.poseT = 0; this.kick(-10); this.dust(x1, 8); MG.fx.shake(10, .3); sfx('phase');
        this.after(.9 / Math.sqrt(d), () => {                                         // regreso a su lugar
          this.pose = 'jumpwind'; this.poseT = 0; this.warn = .35;
          this.after(.4, () => { const xb = x1; this.hop = { t: 0, T: .8, x0: xb, x1: 950, h: 220 }; this.pose = 'air'; this.kick(7);
            this.after(.8, () => { this.hop = null; this.air = 0; this.cx = 950; this.pose = 'land'; this.kick(-8); this.dust(950, 6); MG.fx.shake(6, .2); this.after(.4, () => this.rest(.7)); }); });
        });
      });
    });
  }
  atk_snack() {
    const W_ = this.W_, d = this.difficulty;
    this.pose = 'squat'; this.poseT = 0; this.warn = W_; this.kick(-8);
    this.after(W_, () => {
      this.kick(8); sfx('coin'); this.pose = 'idle';
      const n = d > 1.2 ? 7 : 6, x0 = this.cx - 150, y0 = this.baseY() - 200;
      for (let i = 0; i < n; i++) this.after(i * .12, () => {
        const T = .9 + i * .09, tx = 150 + i * (600 / (n - 1)) + rand(-30, 30), g = 1300;
        this.spawn({ x: x0, y: y0, vx: (tx - x0) / T, vy: (FLOOR - 18 - y0) / T - g * T / 2, grav: g, r: 16, life: T + .02, spin: rand(-9, 9), onUpdate() { if (this.t >= T) this.dead = true; },
          onDraw(ctx) { drawChip(ctx, this.x, this.y, this.rot); } });
      });
      this.after(.35, () => {                                                       // ¡la motivación!
        const T = 1.6, g = 900, tx = 330 + rand(0, 200);
        this.spawn({ x: x0, y: y0, vx: (tx - x0) / T, vy: (FLOOR - 30 - y0) / T - g * T / 2, grav: g, r: 28, pink: true, life: 5, spin: 1.5, bounce: .5,
          onDraw(ctx) { drawDumbbell(ctx, this.x, this.y, this.rot, this.t); } });
      });
      this.after(n * .12 + 1.3, () => this.rest(.9));
    });
  }

  /* ---------- ataques: fase 3 ---------- */
  atk_wave() {
    const d = this.difficulty, both = d > 1.25 && Math.random() < .5, side = Math.random() < .5 ? 'L' : 'R';
    const zones = both ? [[30, 390], [810, 1250]] : side === 'L' ? [[30, 590]] : [[740, 1250]];
    const wind = 1.4, W_ = wind / Math.sqrt(Math.max(1, d * .9));
    this.pose = 'wave'; this.poseT = 0; this.warn = Math.min(W_, .9); this.kick(-5);
    this.zones = zones.map(z => ({ a: z[0], b: z[1], k: 0 }));
    this.after(.5, () => { this.pose = 'wthrow'; this.poseT = 0; this.kick(6); sfx('hit'); });
    this.after(W_, () => {
      sfx('phase'); MG.fx.shake(10, .3);
      this.sheets = zones.map(z => ({ a: z[0], b: z[1], t: 0, y: -420, hit: false }));
      this.zones = [];
      this.after(2.1, () => { this.sheets = []; this.rest(.9); });
    });
  }
  atk_zzz() {
    const W_ = this.W_ + .1, d = this.difficulty;
    this.pose = 'yawn'; this.poseT = 0; this.warn = W_; this.kick(-4); this.mouthT = 1;
    this.after(W_, () => {
      this.pose = 'zzz'; this.poseT = 0; sfx('hit'); this.kick(4);
      const n = d > 1.2 ? 30 : 24, dir = Math.random() < .5 ? 1 : -1, step = .095 / Math.sqrt(d);
      for (let i = 0; i < n; i++) this.after(i * step, () => {
        const a = Math.PI + (-.1 + .55 * Math.sin(i * .62 + (dir > 0 ? 0 : 2))), sp = 250, pinkZ = i % 9 === 4;
        this.spawn({ x: this.cx - 110, y: this.baseY() - 255, ang: a, w: dir * .35, sp, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: 18, pink: pinkZ, life: 6,
          onUpdate(dt) { this.ang += this.w * dt; this.vx = Math.cos(this.ang) * this.sp; this.vy = Math.sin(this.ang) * this.sp; this.rot = Math.sin(this.t * 5) * .3; },
          onDraw(ctx) { drawZ(ctx, this.x, this.y, this.rot, this.pink, this.t); } });
      });
      this.after(n * step + 1.0, () => this.rest(1.0));
    });
  }

  /* ---------- actualización ---------- */
  baseY() { return FLOOR - this.air - this.sp; }
  update(dt) {
    this.baseUpdate(dt); this.poseT += dt; this.spring(dt);
    if (this.warn > 0) this.warn -= dt;
    const T = this.t, ph = this.phase;
    if (this.state === 'trans') this.transT += dt;
    if (this.state === 'dead') this.deadT += dt;
    // mandíbula: bostezo
    const mTarget = (this.pose === 'yawn' || this.pose === 'suck' || this.pose === 'zzz' ? 1 : 0) * (this.pose === 'yawn' ? clamp(this.poseT / (this.W_ * .9), 0, 1) : 1);
    this.mouth = lerp(this.mouth, this.state === 'dead' ? 0 : mTarget, 1 - Math.exp(-dt * 8));
    // párpados: sueño → atención
    const awake = this.pose === 'idle' ? 0 : 1;
    this.lids = lerp(this.lids, ph === 1 ? (this.pose === 'idle' ? .55 + Math.sin(T * .8) * .12 : .25) : ph === 2 ? .0 : .5, 1 - Math.exp(-dt * 6));
    if (this.state === 'dead') this.lids = lerp(this.lids, .95, 1 - Math.exp(-dt * 3));
    // resortes (fase 2)
    this.sp = ph === 2 && this.springOut > .1 && !this.burst ? lerp(this.sp, 96, 1 - Math.exp(-dt * 10)) : lerp(this.sp, 0, 1 - Math.exp(-dt * 10));
    // vuelo del salto
    if (this.hop) {
      const h = this.hop; h.t += dt; const u = clamp(h.t / h.T, 0, 1);
      this.cx = lerp(h.x0, h.x1, MG.ease.inOut(u)); this.air = 4 * h.h * u * (1 - u);
    } else if (ph === 2 && this.state === 'fight' && this.pose === 'idle') { this.air = Math.max(0, Math.sin(T * 5)) * 10; }
    // succión
    if (this.suck > 0) {
      this.suck -= dt; const p = this.arena.player;
      if (p && !p.dead) { const lim = this.cx - 250; if (p.x < lim) p.x = Math.min(lim, p.x + 215 * dt); }
    }
    // reveal de la Flojera / deflate al morir
    if (this.burst) { this.revealT = (this.revealT || 0) + dt; this.revealK = MG.ease.outElastic(clamp(this.revealT / 1.0, 0, 1)); }
    if (this.state === 'dead') { this.deflate = lerp(this.deflate, 1, 1 - Math.exp(-dt * 2.2)); this.dumb = clamp((this.deadT - .9) / .8, 0, 1); this.gymLit = lerp(this.gymLit, this.deadT > .8 ? 1 : 0, 1 - Math.exp(-dt * 1.6)); }
    // sábanas (ola de frazada)
    for (const s of this.sheets) { s.t += dt; s.y = s.t < .3 ? lerp(-420, 0, MG.ease.inOut(s.t / .3)) : 0; if (s.t >= .3 && !s.landed) { s.landed = true; this.dust((s.a + s.b) / 2, 8); MG.fx.shake(8, .25); } }
    for (const z of this.zones) z.k = Math.min(1, z.k + dt * 2.2);
    for (const s of this.shards) if (!s.rest) {
      s.vy += 1800 * dt; s.x += s.vx * dt; s.y += s.vy * dt; s.rot += s.vr * dt;
      if (s.y > FLOOR - s.r * .4) { s.y = FLOOR - s.r * .4; s.vy *= -.35; s.vx *= .6; s.vr *= .5; if (Math.abs(s.vy) < 90) { s.rest = true; s.vy = 0; } }
    }
    this.layout();
  }
  layout() {
    const ph = this.phase, x = this.cx, s = this.sq;
    this.hurtboxes = []; this.hitboxes = [];
    if (this.state === 'dead') return;
    if (this.burst || ph === 3 && this.state !== 'trans') {
      if (!this.burst) return;
      const k = this.revealK; if (k < .5) return;
      const bx = this.cx, by = 460 - s * 30;
      this.hurtboxes.push({ x: bx, y: by + 30, r: 140 }, { x: bx - 70, y: by - 100, r: 80 }, { x: bx - 20, y: 575, r: 85 }, { x: bx + 100, y: by + 50, r: 92 });
      this.hitboxes.push({ x: bx, y: by + 40, r: 92 });
      for (const sh of this.sheets) if (sh.t > .22) this.hitboxes.push({ x: sh.a, y: 480, w: sh.b - sh.a, h: 140 });
    } else {
      const fy = FLOOR - this.air - this.sp, k = 1 - s * .5;
      this.hurtboxes.push({ x: x, y: fy - 265, r: 125 }, { x: x, y: fy - 125, r: 140 }, { x: x - 135, y: fy - 120, r: 70 });
      if (this.sp > 20) this.hurtboxes.push({ x: x, y: FLOOR - this.air - this.sp * .5, r: 52 });
      else this.hurtboxes.push({ x: x, y: 560, r: 66 });
      if (ph === 1) this.hitboxes.push({ x: x, y: 430, r: 92 });
      else this.hitboxes.push({ x: x, y: fy - 250, r: 108 }, { x: x, y: fy - 110, r: 124 }, { x: x, y: FLOOR - this.air - this.sp * .5, r: 38 });
    }
  }

  /* ---------- dibujo ---------- */
  draw(ctx, t) {
    const ph = this.phase, intro = this.state === 'intro';
    for (const s of this.shards) this.drawShard(ctx, s);
    if (this.burst) {
      // sombra y baba
      A.shadow(ctx, this.cx - 10, FLOOR + 8, 230);
      this.drawSloth(ctx);
    } else {
      A.shadow(ctx, this.cx - 6, FLOOR + 6, 190 * (this.air > 20 ? .75 : 1));
      ctx.save();
      if (intro) { const dy = (1 - clamp(this.introT / .6, 0, 1)) * -620; ctx.translate(0, dy); }
      this.drawChair(ctx);
      ctx.restore();
    }
    // líneas de succión
    if (this.suck > 0 && !this.burst) {
      ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 4; ctx.lineCap = 'round';
      const mx = this.cx - 80, my = this.baseY() - 205;
      for (let i = 0; i < 18; i++) {
        const k = (t * 1.6 + i * .37) % 1, y0 = my + ((i * 61) % 240 - 120) * (1 - k * .6), x0 = mx - 80 - 620 * (1 - k) * (1 - k) * 1;
        ctx.globalAlpha = k * .8; ctx.beginPath(); ctx.moveTo(x0 - 50 * k, y0); ctx.quadraticCurveTo(x0, y0 + (my - y0) * .15, x0 + 40 * k, y0 + (my - y0) * .2); ctx.stroke();
      }
      ctx.restore();
    }
    // zonas de peligro de la ola
    for (const z of this.zones) {
      ctx.save(); ctx.beginPath(); ctx.rect(z.a, FLOOR - 4, z.b - z.a, 110); ctx.clip();
      ctx.globalAlpha = .35 + .2 * Math.sin(t * 14); ctx.fillStyle = '#7a2a2a'; ctx.fillRect(z.a, FLOOR - 4, z.b - z.a, 110);
      ctx.globalAlpha = .75; ctx.strokeStyle = A.red; ctx.lineWidth = 12; ctx.beginPath(); for (let x = z.a - 120 + (t * 80) % 40; x < z.b + 60; x += 40) { ctx.moveTo(x, FLOOR + 110); ctx.lineTo(x + 100, FLOOR - 4); } ctx.stroke();
      ctx.globalAlpha = 1; A.text(ctx, '¡ZZZ!', (z.a + z.b) / 2, FLOOR + 50, 46, { fill: A.red, lw: 8, font: 'ui' });
      ctx.restore();
      ctx.save(); ctx.globalAlpha = .5 * z.k; const dg = ctx.createLinearGradient(0, 330, 0, FLOOR); dg.addColorStop(0, 'rgba(60,20,60,0)'); dg.addColorStop(1, 'rgba(60,20,60,.55)'); ctx.fillStyle = dg; ctx.fillRect(z.a, 330, z.b - z.a, FLOOR - 330); ctx.restore();
    }
    for (const s of this.sheets) this.drawSheet(ctx, s, t);
    // aviso "!"
    if (this.warn > 0 && this.state === 'fight') {
      const bx = this.cx - 20, by = (this.burst ? 205 : this.phase === 2 ? 70 + 0 : 110) + Math.sin(t * 30) * 3;
      ctx.save(); ctx.translate(bx, Math.max(40, by - this.air)); const sc = 1 + Math.sin(t * 24) * .08; ctx.scale(sc, sc);
      blob(ctx, 0, 0, 24, 28, A.red, { wob: .8, lw: 4, shade: false }); A.text(ctx, '!', 0, 1, 40, { fill: A.cream, lw: 6 }); ctx.restore();
    }
    // pesita dorada al morir
    if (this.state === 'dead' && this.dumb > 0) this.drawGoldDumbbell(ctx, t);
  }
  drawShard(ctx, s) {
    ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.rot); const r = s.r;
    poly(ctx, [[-r, -r * .4], [-r * .2, -r], [r, -r * .5], [r * .7, r * .6], [-r * .5, r * .8]], s.c, 4);
    ctx.restore();
  }
  armTargets() {
    const p = this.pose, T = this.poseT, sin = Math.sin(this.t * 1.6);
    let L = { x: -200, y: -62 + sin * 4 }, R = { x: 200, y: -62 - sin * 4 };
    if (p === 'cush') { L = { x: -215, y: -250 }; R = { x: 215, y: -250 }; }
    else if (p === 'cthrow') { L = { x: -270, y: -200 }; R = { x: -250, y: -270 }; }
    else if (p === 'remote') { R = { x: 235, y: -285 + Math.sin(T * 40) * 3 }; }
    else if (p === 'rthrow') { R = { x: -210, y: -230 }; }
    else if (p === 'yawn') { L = { x: -175, y: -400 }; R = { x: 175, y: -400 }; }
    else if (p === 'suck') { L = { x: -270, y: -230 }; R = { x: 270, y: -230 }; }
    else if (p === 'squat') { L = { x: -245, y: -110 }; R = { x: 245, y: -110 }; }
    return { L, R };
  }
  drawChair(ctx) {
    const ph = this.phase, T = this.t, sq = this.sq, sp = this.sp, air = this.air, x = this.cx;
    const fy = FLOOR - air - sp, k = 1;
    const sx = 1 - sq * .9 + (this.suck > 0 ? .06 : 0) + (this.pose === 'yawn' ? clamp(this.poseT / .6, 0, 1) * .06 : 0), sy = 1 + sq;
    // resorte
    if (sp > 6 || this.springOut > 0) {
      const sh = Math.max(14, FLOOR - air - fy);
      if (sh > 10) {
        box(ctx, x - 62, FLOOR - air - 14, 124, 14, '#9aa3a8', 4, 6);
        drawSpring(ctx, x, fy - 6, FLOOR - air - 14, 46, 6);
      }
    }
    ctx.save(); ctx.translate(x, fy); ctx.scale(sx, sy);
    ctx.rotate((this.pose === 'cush' ? .05 : this.pose === 'yawn' ? -.05 : 0) + (ph === 2 ? Math.sin(T * 5) * .03 : Math.sin(T * 1.1) * .012));
    const intro = this.state === 'intro';
    // patas
    for (const [lx, ly, rw] of [[-132, -8, 22], [132, -8, 22], [-76, -14, 16], [76, -14, 16]]) blob(ctx, lx, ly, rw, 13, WOOD, { wob: .8, lw: 4, shade: false });
    // falda
    box(ctx, -168, -104, 336, 90, TEAL_D, 5, 14);
    for (let i = -7; i <= 7; i++) { ctx.strokeStyle = A.ink; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(i * 22, -16); ctx.lineTo(i * 22 + A.j(i, 1.5), -3); ctx.stroke(); }
    // respaldo mullido
    ctx.save(); ctx.translate(0, -250); const bp = bpath(152, 190, { points: 26, wob: 2.2, seed: 5 });
    ctx.fillStyle = TEAL; ctx.fill(bp); ctx.save(); ctx.clip(bp);
    ctx.strokeStyle = 'rgba(30,70,64,.5)'; ctx.lineWidth = 3;
    for (let i = -8; i <= 8; i++) { ctx.beginPath(); ctx.moveTo(i * 38, -200); ctx.lineTo(i * 38 + 220, 200); ctx.stroke(); ctx.beginPath(); ctx.moveTo(i * 38, -200); ctx.lineTo(i * 38 - 220, 200); ctx.stroke(); }
    ctx.fillStyle = 'rgba(60,30,10,.16)'; ctx.beginPath(); ctx.ellipse(60, 80, 200, 200, 0, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.2)'; ctx.beginPath(); ctx.ellipse(-70, -120, 60, 30, -.5, 0, TAU); ctx.fill();
    ctx.restore(); ctx.lineWidth = 5.5; ctx.strokeStyle = A.ink; ctx.lineJoin = 'round'; ctx.stroke(bp);
    for (const [bx, by] of [[-76, -100], [0, -100], [76, -100], [-38, -40], [38, -40], [-76, 20], [0, 20], [76, 20], [-38, 80], [38, 80]]) blob(ctx, bx, by, 6, 6, TEAL_D, { wob: .3, lw: 2.5, shade: false, points: 8 });
    ctx.restore();
    // doily de la cabeza
    blob(ctx, 0, -432, 36, 12, A.cream, { wob: 1.2, lw: 3.5, shade: false, points: 14 }); for (let i = -2; i <= 2; i++) blob(ctx, i * 14, -420, 6, 6, A.cream, { wob: .3, lw: 2.5, shade: false, points: 8 });
    // asiento y brazos
    blob(ctx, 0, -118, 140, 46, TEAL_L, { wob: 1.5, lw: 5, points: 22 });
    ctx.strokeStyle = 'rgba(30,70,64,.55)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-110, -112); ctx.quadraticCurveTo(0, -92, 110, -112); ctx.stroke();
    for (const s of [-1, 1]) {
      blob(ctx, s * 160, -128, 50, 80, TEAL_M, { wob: 1.5, lw: 5.5, points: 22, seed: s });
      ctx.strokeStyle = TEAL_D; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(s * 160, -92, 22, 0, TAU * .8); ctx.stroke();
    }
    // cara
    const ex = 0, ey = -292, es = 32, lid = clamp(this.lids, 0, 1), p = this.arena.player;
    const lookX = p ? clamp((p.x - x) / 500, -1, 1) : -1, wide = ph === 2;
    A.eyes(ctx, ex, ey, es, lookX, ph === 2 ? Math.sin(T * 13) * .6 : .4, '');
    for (const s of [-1, 1]) {
      const cx2 = ex + s * es * .625, rxE = es * .45, ryE = es * .62;
      ctx.save(); ctx.beginPath(); ctx.ellipse(cx2, ey, rxE + 1, ryE + 1, 0, 0, TAU); ctx.clip();
      ctx.fillStyle = TEAL_M; ctx.fillRect(cx2 - 20, ey - 26, 40, 2 * ryE * lid + 4);
      ctx.restore();
      ctx.strokeStyle = A.ink; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(cx2 - rxE - 1, ey - ryE + 2 * ryE * lid); ctx.lineTo(cx2 + rxE + 1, ey - ryE + 2 * ryE * lid); ctx.stroke();
      ctx.strokeStyle = '#6a4a7a'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(cx2, ey + 4, rxE + 4, .2, Math.PI - .2); ctx.stroke();       // ojeras
      ctx.strokeStyle = A.ink; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(cx2 - s * rxE - 2, ey - ryE - 10 - (ph === 2 ? 4 : -2)); ctx.lineTo(cx2 + s * rxE + 6, ey - ryE - 8 + (ph === 2 ? -3 : 4)); ctx.stroke();
    }
    // nariz y burbuja de mocos
    blob(ctx, 0, -248, 12, 9, TEAL_D, { wob: .5, lw: 3, shade: false });
    if (ph === 1 && this.pose === 'idle') {
      const b = (Math.sin(T * 1.4) * .5 + .5), rb = 6 + b * 22; ctx.save(); ctx.fillStyle = 'rgba(200,235,255,.55)'; ctx.strokeStyle = A.ink; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(22 + rb * .5, -244, rb, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.beginPath(); ctx.arc(22 + rb * .2, -244 - rb * .4, rb * .22, 0, TAU); ctx.fill(); ctx.restore();
    }
    // boca de cojín / cremallera
    const m = this.mouth, my = -205;
    if (ph === 2 && m < .3) {                           // fase 2: sonrisa de cierre
      ctx.strokeStyle = A.ink; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-70, my - 10); ctx.quadraticCurveTo(0, my + 30 + Math.sin(T * 9) * 3, 70, my - 10); ctx.stroke();
      ctx.strokeStyle = '#d9d2c4'; ctx.lineWidth = 3; ctx.setLineDash([4, 5]); ctx.stroke(); ctx.setLineDash([]);
      box(ctx, -8, my + 14, 16, 22, '#d9d2c4', 3, 3);
    } else if (m < .15) {
      ctx.strokeStyle = A.ink; ctx.lineWidth = 22; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-58, my); ctx.quadraticCurveTo(0, my + 14, 58, my); ctx.stroke();
      ctx.strokeStyle = TEAL_L; ctx.lineWidth = 14; ctx.stroke(); ctx.strokeStyle = 'rgba(30,70,64,.6)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-48, my + 2); ctx.quadraticCurveTo(0, my + 12, 48, my + 2); ctx.stroke();
    } else {
      const rx = 30 + m * 34, ry = 12 + m * 52;
      ctx.save(); ctx.translate(0, my + ry * .3); blob(ctx, 0, 0, rx + 12, ry + 11, TEAL_L, { wob: 1.2, lw: 5, shade: false });
      blob(ctx, 0, 2, rx, ry, '#3a1a2a', { wob: 1, lw: 4, shade: false });
      ctx.save(); ctx.beginPath(); ctx.ellipse(0, 2, rx, ry, 0, 0, TAU); ctx.clip(); blob(ctx, 0, ry * .75, rx * .75, ry * .5, '#c4586a', { wob: 1, lw: 3, shade: false }); ctx.restore(); ctx.restore();
    }
    // resortes que se salen (fase 2)
    if (ph === 2 || this.burst) {
      for (const [sx2, sy2, dir, len] of [[-100, -420, -1, 80], [90, -415, 1, 70], [205, -190, 1, 60]]) {
        ctx.save(); ctx.translate(sx2, sy2); ctx.rotate(dir * (.3 + Math.sin(T * 7 + sx2) * .12)); drawSpring(ctx, 0, 0, -len, 11, 5); blob(ctx, 0, -len - 6, 8, 8, '#b9c0c4', { wob: .3, lw: 3, shade: false }); ctx.restore();
      }
      for (const [fx2, fy2] of [[-60, -170], [130, -300], [-120, -330]]) blob(ctx, fx2, fy2, 18, 12, A.cream, { wob: 3, lw: 3, shade: false, points: 10, seed: fx2 });
      ctx.strokeStyle = A.ink; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(40, -360); ctx.lineTo(70, -330); ctx.lineTo(50, -318); ctx.moveTo(-130, -240); ctx.lineTo(-100, -222); ctx.stroke();
    }
    // migajas y pelusa en el asiento
    if (ph === 1) for (const [mx, my2] of [[-60, -140], [30, -146], [80, -138], [-20, -128]]) blob(ctx, mx, my2, 5, 4, '#d4a35e', { wob: .8, lw: 2, shade: false, points: 8, seed: mx });
    // control remoto asomando
    if (ph === 1 && this.hold !== 'remote' && !(this.pose === 'rthrow')) { ctx.save(); ctx.translate(-92, -140); ctx.rotate(-.5); box(ctx, -20, -7, 40, 14, '#3c3c46', 3, 4); blob(ctx, 8, 0, 3, 3, A.red, { wob: .1, lw: 1, shade: false, points: 6 }); ctx.restore(); }
    // brazos de manguera
    const tg = this.armTargets(); for (const [a, b] of [[this.armL, tg.L], [this.armR, tg.R]]) { a.x = lerp(a.x, b.x, .2); a.y = lerp(a.y, b.y, .2); }
    const shL = { x: -165, y: -165 }, shR = { x: 165, y: -165 };
    A.hose(ctx, shL.x, shL.y, this.armL.x, this.armL.y, 40, 17, A.cream); A.hose(ctx, shR.x, shR.y, this.armR.x, this.armR.y, -40, 17, A.cream);
    A.glove(ctx, this.armL.x, this.armL.y, 22, Math.atan2(this.armL.y - shL.y, this.armL.x - shL.x));
    A.glove(ctx, this.armR.x, this.armR.y, 22, Math.atan2(this.armR.y - shR.y, this.armR.x - shR.x));
    if (this.hold === 'cush') { drawCushion(ctx, this.armL.x - 6, this.armL.y - 16, -.3, false, 0, 26); drawCushion(ctx, this.armR.x + 6, this.armR.y - 16, .3, false, 1, 26); }
    if (this.hold === 'remote') drawRemote(ctx, this.armR.x + 4, this.armR.y - 22, -.5, 0, 0, -1);
    if (this.flash > 0) { ctx.save(); ctx.globalAlpha = .3; ctx.translate(0, -250); ctx.fillStyle = '#fff'; ctx.fill(bpath(152, 190, { points: 26, wob: 0 })); ctx.restore(); }
    ctx.restore();
    // estrellitas de mareo al aterrizar
    if (this.pose === 'land' && this.poseT < .8) for (let i = 0; i < 3; i++) A.star(ctx, x + Math.cos(T * 8 + i * 2.1) * 90, fy - 450 + Math.sin(T * 8 + i * 2.1) * 14, 12, A.gold, T * 3);
  }
  drawSloth(ctx) {
    const T = this.t, sq = this.sq, dead = this.state === 'dead', rk = this.revealK, df = this.deflate;
    const sxx = (1 - sq * .8) * (1 + df * .45) * rk, syy = (1 + sq) * (1 - df * .85) * rk;
    if (rk < .02) return;
    ctx.save(); ctx.translate(this.cx, FLOOR); ctx.scale(KS * sxx * (1 + Math.sin(T * 1.8) * .012), KS * syy * (1 + Math.sin(T * 1.8) * .02));
    // charco de baba
    ctx.fillStyle = 'rgba(130,200,180,.45)'; ctx.beginPath(); ctx.ellipse(0, 6, 250, 20, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.ellipse(-60, 2, 70, 5, 0, 0, TAU); ctx.fill();
    // brazos que cuelgan (detrás)
    const sway = Math.sin(T * 1.2) * 10, wv = this.pose === 'wave' || this.pose === 'wthrow';
    const aL = wv ? { x: -230, y: -330 + sway } : this.pose === 'zzz' || this.pose === 'yawn' ? { x: -170, y: -380 } : { x: -215 + sway, y: -40 };
    const aR = wv ? { x: 200, y: -340 - sway } : this.pose === 'zzz' || this.pose === 'yawn' ? { x: 170, y: -370 } : { x: 235 - sway, y: -30 };
    this.aL = this.aL || { x: aL.x, y: aL.y }; this.aR = this.aR || { x: aR.x, y: aR.y };
    this.aL.x = lerp(this.aL.x, aL.x, .1); this.aL.y = lerp(this.aL.y, aL.y, .1); this.aR.x = lerp(this.aR.x, aR.x, .1); this.aR.y = lerp(this.aR.y, aR.y, .1);
    const claw = (hx, hy, dir) => { for (let i = -1; i <= 1; i++) { ctx.strokeStyle = A.ink; ctx.lineWidth = 11; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(hx + i * 13, hy + 8); ctx.quadraticCurveTo(hx + i * 18 + dir * 6, hy + 40, hx + i * 12 + dir * 12, hy + 56); ctx.stroke(); ctx.strokeStyle = '#efe0c4'; ctx.lineWidth = 5; ctx.stroke(); } };
    A.hose(ctx, 160, -210, this.aR.x, this.aR.y, -50, 44, '#b0814e');
    blob(ctx, this.aR.x, this.aR.y, 30, 26, SKIN, { wob: 1, lw: 4, shade: false }); claw(this.aR.x, this.aR.y, 1);
    // cuerpo de frazada (patchwork)
    ctx.save(); ctx.translate(0, -150); const bp = bpath(208, 158, { points: 28, wob: 2.4, seed: 2 });
    ctx.fillStyle = quiltPattern(ctx); ctx.fill(bp);
    ctx.save(); ctx.clip(bp); ctx.fillStyle = 'rgba(60,30,10,.2)'; ctx.beginPath(); ctx.ellipse(80, 90, 230, 190, 0, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.beginPath(); ctx.ellipse(-80, -90, 90, 40, -.4, 0, TAU); ctx.fill(); ctx.restore();
    ctx.lineWidth = 6; ctx.strokeStyle = A.ink; ctx.lineJoin = 'round'; ctx.stroke(bp); ctx.restore();
    // flecos y baba chorreando por abajo
    for (let i = -9; i <= 9; i++) { const dl = 14 + ((i * 7) & 7) * 3 + Math.sin(T * 2 + i) * 4; ctx.strokeStyle = A.ink; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(i * 22, -4); ctx.lineTo(i * 22, dl - 4); ctx.stroke(); ctx.strokeStyle = '#efe0c4'; ctx.lineWidth = 3.5; ctx.stroke(); }
    ctx.fillStyle = 'rgba(150,215,190,.6)'; for (const dx of [-120, -40, 70, 150]) { ctx.beginPath(); ctx.ellipse(dx, -2, 10, 24 + Math.sin(T * 2 + dx) * 6, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(40,90,70,.7)'; ctx.lineWidth = 2.5; ctx.stroke(); }
    // cabeza de perezoso con antifaz oscuro y gorro de dormir
    ctx.save(); ctx.translate(-78, -302 + Math.sin(T * 1.3) * 4); ctx.rotate(.12 + (this.pose === 'yawn' ? -.2 : 0));
    // gorro
    ctx.save(); ctx.translate(14, -62); poly(ctx, [[-62, 6], [64, 6], [48, -30], [100, -58 + Math.sin(T * 2) * 5], [30, -84]], '#4f7d9c', 5); ctx.restore();
    ctx.save(); ctx.translate(14, -62); ctx.strokeStyle = A.cream; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(-40, -6); ctx.lineTo(44, -22); ctx.stroke(); ctx.restore();
    blob(ctx, 112, -122 + Math.sin(T * 2) * 5, 14, 14, A.cream, { wob: 1, lw: 3.5, shade: false, points: 12 });
    blob(ctx, 0, 0, 96, 82, SKIN, { wob: 2, lw: 5.5, points: 22, seed: 8 });
    ctx.strokeStyle = 'rgba(120,80,40,.5)'; ctx.lineWidth = 2.5; for (let i = 0; i < 9; i++) { const a = -2.4 + i * .25, rx = Math.cos(a) * 82, ry = Math.sin(a) * 68; ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx * .9, ry * .88 + 5); ctx.stroke(); }
    for (const s of [-1, 1]) {                       // antifaz oscuro
      blob(ctx, s * 38, -6, 30, 20, '#5a3d2b', { wob: .8, lw: 3.5, rot: s * .45, shade: false });
      const o = this.pose === 'idle' ? 0 : 1;
      if (dead) { ctx.strokeStyle = '#efe0c4'; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.arc(s * 38, -6, 9, .2, Math.PI - .2); ctx.stroke(); }
      else { blob(ctx, s * 38, -6, 9, 7 + o * 3, '#efe0c4', { wob: .2, lw: 2.5, shade: false, points: 10 }); ctx.fillStyle = A.ink; ctx.beginPath(); ctx.arc(s * 38 + 2 * Math.sign(-1), -4 + o, 3.2, 0, TAU); ctx.fill();
        ctx.fillStyle = '#5a3d2b'; ctx.fillRect(s * 38 - 11, -16, 22, 8 + 2 * (1 - o)); ctx.strokeStyle = A.ink; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(s * 38 - 11, -8 - 2 * (1 - o) + 2); ctx.lineTo(s * 38 + 11, -8 - 2 * (1 - o) + 2); ctx.stroke(); }
    }
    blob(ctx, -4, 22, 15, 11, '#3a2a20', { wob: .6, lw: 3, shade: false });
    const m = this.mouth;
    if (m > .15) { blob(ctx, -4, 50, 28 + m * 14, 10 + m * 34, '#3a1a2a', { wob: 1, lw: 4, shade: false }); blob(ctx, -4, 64 + m * 10, 18, 9 + m * 8, '#c4586a', { wob: .8, lw: 2.5, shade: false }); }
    else { ctx.strokeStyle = A.ink; ctx.lineWidth = 4.5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-30, 44); ctx.quadraticCurveTo(-4, 58 + (dead ? -14 : 0), 22, 44); ctx.stroke(); }
    ctx.restore();
    // brazo izquierdo al frente
    A.hose(ctx, -165, -205, this.aL.x, this.aL.y, 50, 44, '#b0814e');
    blob(ctx, this.aL.x, this.aL.y, 30, 26, SKIN, { wob: 1, lw: 4, shade: false }); claw(this.aL.x, this.aL.y, -1);
    // zzz flotando
    if (!dead && this.pose === 'idle') for (let i = 0; i < 3; i++) { const k = ((T * .4 + i / 3) % 1); ctx.save(); ctx.globalAlpha = Math.sin(k * Math.PI); A.text(ctx, i === 1 ? 'Z' : 'z', -150 + k * 40, -420 - k * 80, 22 + i * 8, { font: 'ui', fill: '#d9cdf5', lw: 5 }); ctx.restore(); }
    if (this.flash > 0) { ctx.save(); ctx.globalAlpha = .3; ctx.translate(0, -150); ctx.fillStyle = '#fff'; ctx.fill(bpath(208, 158, { points: 28, wob: 0 })); ctx.restore(); }
    ctx.restore();
  }
  drawSheet(ctx, s, t) {
    const x0 = s.a, x1 = s.b, k = clamp(s.t / .3, 0, 1), fade = s.t > 1.7 ? clamp(1 - (s.t - 1.7) / .4, 0, 1) : 1, hTop = 150;
    ctx.save(); ctx.globalAlpha = fade; ctx.translate(0, s.y);
    ctx.beginPath(); ctx.moveTo(x0, FLOOR + 14);
    for (let x = x0; x <= x1; x += 12) { const e = Math.min((x - x0) / 80, (x1 - x) / 80, 1); ctx.lineTo(x, FLOOR - hTop * (.45 + .55 * Math.sqrt(clamp(e, 0, 1))) * (.82 + .18 * Math.sin(x * .035 + t * 7))); }
    ctx.lineTo(x1, FLOOR + 14); ctx.closePath();
    ctx.fillStyle = quiltPattern(ctx); ctx.fill(); ctx.fillStyle = 'rgba(60,30,10,.18)'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = A.ink; ctx.lineJoin = 'round'; ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 3; ctx.setLineDash([8, 7]); ctx.beginPath(); for (let x = x0 + 10; x <= x1 - 10; x += 12) { const e = Math.min((x - x0) / 80, (x1 - x) / 80, 1); const yy = FLOOR - hTop * (.45 + .55 * Math.sqrt(clamp(e, 0, 1))) * (.82 + .18 * Math.sin(x * .035 + t * 7)) + 14; ctx[x === x0 + 10 ? 'moveTo' : 'lineTo'](x, yy); } ctx.stroke(); ctx.setLineDash([]);
    for (let x = x0 + 8; x < x1; x += 20) { ctx.strokeStyle = A.ink; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x, FLOOR + 14); ctx.lineTo(x, FLOOR + 26); ctx.stroke(); }
    ctx.restore();
  }
  drawGoldDumbbell(ctx, t) {
    const k = this.dumb, x = this.cx - 10, y = FLOOR - 24 - MG.ease.outBack(k) * 36 - Math.sin(t * 3) * 6;
    ctx.save(); ctx.translate(x, y);
    A.rays(ctx, 0, 0, 'rgba(255,232,140,.16)', t); ctx.restore();
    ctx.save(); ctx.translate(x, y); ctx.scale(MG.ease.outBack(k), MG.ease.outBack(k)); ctx.rotate(Math.sin(t * 2) * .08);
    ctx.fillStyle = 'rgba(255,232,140,.35)'; ctx.beginPath(); ctx.arc(0, 0, 60 + Math.sin(t * 5) * 4, 0, TAU); ctx.fill();
    box(ctx, -36, -7, 72, 14, '#f6dc82', 4, 5);
    for (const s of [-1, 1]) { box(ctx, s * 30 - 10, -28, 20, 56, BRASS, 5, 7); box(ctx, s * 46 - 6, -19, 12, 38, '#f6dc82', 4, 5); ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillRect(s * 30 - 6, -22, 4, 22); }
    for (let i = 0; i < 4; i++) A.star(ctx, Math.cos(t * 2.2 + i * 1.6) * 52, Math.sin(t * 2.2 + i * 1.6) * 36, 6 + (i % 2) * 3, A.cream, t * 2 + i);
    ctx.restore();
  }

  /* ---------- fondo ---------- */
  drawBackground(ctx, t) {
    if (!BG) buildBG();
    const p = this.arena.player, px = p ? clamp((p.x - 640) / 640, -1, 1) : 0, M = BG.M, lit = this.gymLit;
    // calle y gimnasio (detrás de la pared)
    ctx.save(); ctx.translate(-px * 6, 0); ctx.beginPath(); ctx.rect(WIN.x - 12, WIN.y - 12, WIN.w + 24, WIN.h + 24); ctx.clip();
    ctx.drawImage(BG.sky, WIN.x, WIN.y);
    ctx.translate(WIN.x, WIN.y);
    // gimnasio
    ctx.fillStyle = '#5a3f4a'; ctx.fillRect(130, 150, 262, 176); ctx.strokeStyle = A.ink; ctx.lineWidth = 5; ctx.strokeRect(130, 150, 262, 176);
    ctx.fillStyle = '#6f4e5a'; ctx.fillRect(122, 138, 278, 16); ctx.strokeRect(122, 138, 278, 16);
    for (let r = 0; r < 2; r++) for (let c = 0; c < 5; c++) {
      const wx = 146 + c * 48, wy = 170 + r * 62;
      ctx.fillStyle = lit > .02 ? `rgb(${Math.round(lerp(40, 255, lit))},${Math.round(lerp(34, 215, lit))},${Math.round(lerp(50, 110, lit))})` : '#2a2230'; ctx.fillRect(wx, wy, 34, 44);
      ctx.strokeStyle = A.ink; ctx.lineWidth = 3; ctx.strokeRect(wx, wy, 34, 44);
      if (lit > .5) { ctx.fillStyle = `rgba(40,20,10,${.5 * lit})`; ctx.beginPath(); ctx.arc(wx + 17, wy + 20, 6, 0, TAU); ctx.fill(); ctx.fillRect(wx + 12, wy + 24, 10, 20); }
    }
    ctx.fillStyle = lit > .02 ? '#ffd777' : '#3a2f3c'; ctx.fillRect(238, 262, 42, 64); ctx.strokeRect(238, 262, 42, 64);
    // letrero GIMNASIO (neón)
    const fl = lit > .5 ? 1 : (.7 + .3 * (Math.sin(t * 3) > -.5 ? 1 : .35 + (Math.sin(t * 17) > 0 ? .3 : 0)));
    box(ctx, 142, 96, 238, 44, '#2a2230', 5, 8);
    ctx.save(); ctx.globalAlpha = fl; A.text(ctx, 'GIMNASIO', 261, 119, 34, { fill: lit > .3 ? '#fff1a8' : '#ff9ec0', stroke: lit > .3 ? '#b86a10' : '#a8183c', lw: 6 }); ctx.restore();
    for (let i = 0; i < 12; i++) { ctx.fillStyle = (i + Math.floor(t * 3)) % 2 ? '#fff2b0' : '#a8783c'; ctx.beginPath(); ctx.arc(150 + i * 20, 102, 3.2, 0, TAU); ctx.fill(); }
    // mancuerna de neón en el techo del gimnasio
    ctx.save(); ctx.translate(261, 72); ctx.globalAlpha = lit > .3 ? 1 : .75 * fl; ctx.strokeStyle = lit > .3 ? '#fff1a8' : '#ff9ec0'; ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-28, 0); ctx.lineTo(28, 0); ctx.moveTo(-28, -14); ctx.lineTo(-28, 14); ctx.moveTo(-40, -9); ctx.lineTo(-40, 9); ctx.moveTo(28, -14); ctx.lineTo(28, 14); ctx.moveTo(40, -9); ctx.lineTo(40, 9); ctx.stroke(); ctx.restore();
    // corredor que pasa por la calle (la tentación)
    const rx = ((t * 38) % 560) - 60; ctx.save(); ctx.translate(rx, 340); ctx.fillStyle = '#2a1f30'; ctx.strokeStyle = '#2a1f30'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(0, -28, 6, 0, TAU); ctx.fill(); ctx.fillRect(-4, -22, 8, 16); const lg = Math.sin(t * 12) * 9;
    ctx.beginPath(); ctx.moveTo(0, -6); ctx.lineTo(lg, 8); ctx.moveTo(0, -6); ctx.lineTo(-lg, 8); ctx.moveTo(0, -20); ctx.lineTo(-lg * .8, -10); ctx.moveTo(0, -20); ctx.lineTo(lg * .8, -10); ctx.stroke(); ctx.restore();
    if (lit > .02) { ctx.fillStyle = `rgba(255,225,130,${.25 * lit})`; ctx.fillRect(0, 0, WIN.w, WIN.h); for (let i = 0; i < 6; i++) A.star(ctx, 120 + ((i * 97 + t * 40) % 280), 130 + ((i * 53) % 150), 5 + (i % 3) * 2, A.cream, t * 2 + i); }
    ctx.restore();
    ctx.drawImage(BG.wall, -M - px * 10, 0);
    // rayos de luz del gimnasio al ganar
    if (lit > .02) { ctx.save(); ctx.globalAlpha = lit * .75 * (.85 + .15 * Math.sin(t * 4)); ctx.drawImage(BG.beam, 420 - px * 10, 60); ctx.restore(); }
    ctx.drawImage(BG.fur, -M - px * 20, 0);
    // radio: dial que brilla y notas musicales
    const gl = .55 + Math.sin(t * 2.2) * .2; ctx.save(); ctx.translate(-px * 20, 0);
    ctx.fillStyle = `rgba(255,170,60,${gl})`; ctx.fillRect(735, 402, 64, 14); ctx.strokeStyle = A.ink; ctx.lineWidth = 3; ctx.strokeRect(735, 402, 64, 14);
    ctx.fillStyle = A.red; ctx.fillRect(735 + ((t * 20) % 56), 400, 3, 18);
    for (let i = 0; i < 2; i++) { const k = (t * .5 + i * .5) % 1; ctx.save(); ctx.globalAlpha = Math.sin(k * Math.PI); A.text(ctx, i ? '♪' : '♫', 780 + Math.sin(k * 6 + i) * 24, 350 - k * 120, 28, { fill: A.cream, lw: 5, font: 'ui' }); ctx.restore(); }
    // halo de la lámpara
    ctx.globalAlpha = .75 + Math.sin(t * 6) * .04 + (Math.random() < .01 ? -.2 : 0); ctx.drawImage(BG.glow, 1195 - 210, 240 - 210);
    ctx.restore();
    ctx.drawImage(BG.flo, -M - px * 5, 0);
    // polvo flotando en la luz
    ctx.save(); ctx.fillStyle = 'rgba(255,240,200,.55)'; for (let i = 0; i < 26; i++) { const x = ((i * 137.5) % W + Math.sin(t * .6 + i) * 30 + W) % W, y = (((i * 91) % 500) + t * (6 + i % 5) + Math.sin(t + i) * 10) % 560; ctx.beginPath(); ctx.arc(x, y + 40, 1.6 + (i % 3) * .5, 0, TAU); ctx.fill(); } ctx.restore();
  }
  drawForeground(ctx, t) {
    // oscurece un poquito los bordes inferiores: se siente acogedor y pesado
    const g = this._fg || (this._fg = (() => { const [c, x] = mkc(8, H); const gr = x.createLinearGradient(0, H - 130, 0, H); gr.addColorStop(0, 'rgba(40,15,10,0)'); gr.addColorStop(1, 'rgba(40,15,10,.38)'); x.fillStyle = gr; x.fillRect(0, 0, 8, H); return c; })());
    ctx.drawImage(g, 0, 0, W, H);
  }
}

/* ============================ registro ============================ */
MG.registerBoss({
  id: 'flojera', nombre: 'La Flojera', area: 'Cuerpo', intro: 'Mañana vas al gym... ¿cierto?',
  music: 'flojera', parTime: 125, color: TEAL,
  mapIcon(ctx, x, y, s, t) {
    const k = s > 8 ? s / 90 : (s || 1); t = t || 0;
    ctx.save(); ctx.translate(x, y); ctx.scale(k, k); const br = Math.sin(t * 1.6) * .03; ctx.scale(1 - br, 1 + br);
    for (const sx of [-1, 1]) blob(ctx, sx * 40, 14, 15, 26, TEAL_M, { wob: .8, lw: 3.5 });
    box(ctx, -40, 18, 80, 24, TEAL_D, 4, 8);
    blob(ctx, 0, -8, 40, 44, TEAL, { wob: 1.2, lw: 4.5, points: 20 });
    blob(ctx, 0, 22, 44, 17, TEAL_L, { wob: 1, lw: 4 });
    for (const sx of [-1, 1]) { blob(ctx, sx * 13, -18, 9, 12, A.cream, { wob: .3, lw: 2.5, shade: false, points: 10 }); blob(ctx, sx * 13 + 1, -14, 3.5, 3.5, A.ink, { wob: .2, lw: 1, shade: false, points: 8 }); ctx.fillStyle = TEAL_M; ctx.fillRect(sx * 13 - 10, -32, 20, 17); ctx.strokeStyle = A.ink; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(sx * 13 - 10, -16); ctx.lineTo(sx * 13 + 10, -16); ctx.stroke(); }
    ctx.strokeStyle = A.ink; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-20, 6); ctx.quadraticCurveTo(0, 14, 20, 6); ctx.stroke(); ctx.strokeStyle = TEAL_L; ctx.lineWidth = 4; ctx.stroke();
    blob(ctx, 0, -52, 17, 6, A.cream, { wob: .5, lw: 2.5, shade: false, points: 10 });
    const z = (Math.sin(t * 1.5) * .5 + .5); ctx.globalAlpha = .5 + z * .5; A.text(ctx, 'Z', 38, -34 - z * 10, 20, { font: 'ui', fill: '#d9cdf5', lw: 4 }); A.text(ctx, 'z', 52, -48 - z * 10, 14, { font: 'ui', fill: '#d9cdf5', lw: 3 });
    ctx.restore();
  },
  create(arena, opts) { return new Flojera(arena, opts || {}); }
});
})();
