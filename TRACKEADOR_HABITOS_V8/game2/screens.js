/* ==========================================================================
   MILO · EL GRAN NOQUEO — pantallas: title, map, shop, results
   Todo dibujado con código (MG.art). Depende de core.js.
   ========================================================================== */
(function () {
'use strict';
const MG = window.MG, A = MG.art, I = MG.input, W = MG.W, H = MG.H;
const clamp = MG.clamp, lerp = MG.lerp, ease = MG.ease, TAU = Math.PI * 2;

/* ============================ utilidades ============================ */
const snd = n => { try { MG.audio && MG.audio.sfx && MG.audio.sfx(n); } catch (e) {} };
const music = n => { try { MG.audio && MG.audio.music && MG.audio.music(n); } catch (e) {} };
function rng(seed) { let a = seed >>> 0; return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function mk(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
// clic/toque fresco (MG.pointer) → lo consume
function click() {
  const p = MG.pointer; if (!p) return null;
  MG.pointer = null;
  return performance.now() - p.t < 160 ? p : null;
}
const inR = (p, x, y, w, h) => p && p.x >= x && p.x <= x + w && p.y >= y && p.y <= y + h;
const fmtTime = s => { s = Math.max(0, Math.round(s)); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); };
const isTouch = () => I.lastDevice === 'touch';
const FONT_UI = "'Lilita One', 'Arial Black', sans-serif";
function wrapText(ctx, str, size, maxW) {
  ctx.save(); ctx.font = size + 'px ' + FONT_UI;
  const words = String(str).split(/\s+/), lines = []; let cur = '';
  for (const w of words) {
    const test = cur ? cur + ' ' + w : w;
    if (ctx.measureText(test).width > maxW && cur) { lines.push(cur); cur = w; } else cur = test;
  }
  if (cur) lines.push(cur);
  ctx.restore(); return lines;
}
// A.blob del core tiene un bug: con shade activo el contorno se dibuja sobre la elipse del brillo.
// Aquí dibujamos el contorno con shade:false y ponemos la sombra de acuarela encima, recortada.
function B(ctx, x, y, rx, ry, fill, opt) {
  opt = opt || {};
  A.blob(ctx, x, y, rx, ry, fill, Object.assign({}, opt, { shade: false }));
  if (opt.shade !== false && fill) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(opt.rot || 0);
    ctx.beginPath(); ctx.ellipse(0, 0, Math.max(1, rx - 2.5), Math.max(1, ry - 2.5), 0, 0, TAU); ctx.clip();
    ctx.fillStyle = 'rgba(60,30,10,.18)'; ctx.beginPath(); ctx.ellipse(rx * .35, ry * .4, rx, ry, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.22)'; ctx.beginPath(); ctx.ellipse(-rx * .35, -ry * .45, rx * .35, ry * .22, -.5, 0, TAU); ctx.fill();
    ctx.restore();
  }
}
const txt = (ctx, s, x, y, size, o) => A.text(ctx, s, x, y, size, Object.assign({ font: 'ui' }, o));
const ink = (ctx, s, x, y, size, o) => A.text(ctx, s, x, y, size, Object.assign({ font: 'ui', fill: A.ink, stroke: false }, o));
function rr(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
function panel(ctx, x, y, w, h, fill, r) {
  ctx.save();
  rr(ctx, x + 5, y + 7, w, h, r || 16); ctx.fillStyle = 'rgba(30,15,0,.35)'; ctx.fill();
  rr(ctx, x, y, w, h, r || 16); ctx.fillStyle = fill || A.paper; ctx.fill();
  ctx.lineWidth = 5; ctx.strokeStyle = A.ink; ctx.lineJoin = 'round'; ctx.stroke();
  ctx.restore();
}
function button(ctx, label, x, y, w, h, sel, fill) {
  panel(ctx, x, y, w, h, sel ? A.gold : (fill || A.cream), 14);
  ink(ctx, label, x + w / 2, y + h / 2 + 2, Math.min(30, h * .52));
}
function heart(ctx, x, y, s, fill, line) {
  ctx.save(); ctx.beginPath(); ctx.moveTo(x, y + s * .85);
  ctx.bezierCurveTo(x - s * 1.25, y + s * .05, x - s * .8, y - s * .95, x, y - s * .3);
  ctx.bezierCurveTo(x + s * .8, y - s * .95, x + s * 1.25, y + s * .05, x, y + s * .85);
  ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = line || A.ink; ctx.lineJoin = 'round'; ctx.stroke(); ctx.restore();
}
function skull(ctx, x, y, r, on) {
  ctx.save(); ctx.globalAlpha = on ? 1 : .25;
  B(ctx, x, y + r * .75, r * .55, r * .38, A.cream, { wob: .3, lw: 2.5, shade: false, points: 10 });
  B(ctx, x, y, r, r * .9, A.cream, { wob: .4, lw: 2.5, shade: false, points: 14 });
  ctx.fillStyle = A.ink;
  ctx.beginPath(); ctx.ellipse(x - r * .38, y + r * .05, r * .27, r * .3, 0, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x + r * .38, y + r * .05, r * .27, r * .3, 0, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x, y + r * .3); ctx.lineTo(x - r * .1, y + r * .5); ctx.lineTo(x + r * .1, y + r * .5); ctx.closePath(); ctx.fill();
  ctx.lineWidth = 2; ctx.strokeStyle = A.ink; ctx.beginPath();
  for (let i = -1; i <= 1; i++) { ctx.moveTo(x + i * r * .22, y + r * .62); ctx.lineTo(x + i * r * .22, y + r * 1.0); }
  ctx.stroke(); ctx.restore();
}
function coin(ctx, x, y, r, rot) {
  const k = Math.abs(Math.cos(rot || 0));
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = A.gold; ctx.strokeStyle = A.ink; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.ellipse(0, 0, Math.max(1.5, r * k), r, 0, 0, TAU); ctx.fill(); ctx.stroke();
  if (k > .35) { ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(120,70,0,.7)'; ctx.beginPath(); ctx.ellipse(0, 0, Math.max(1, r * k * .6), r * .6, 0, 0, TAU); ctx.stroke(); }
  ctx.restore();
}
const diffStars = d => clamp(Math.round(1 + (d - .8) / .6 * 4), 1, 5);
const diffName = n => ['', 'Paseo', 'Fácil', 'Normal', 'Difícil', 'Pesadilla'][n];
function bossList() { return Object.keys(MG.bosses || {}); }

/* ============================ Milo (versión chica) ============================ */
// Milo mirando a la derecha en coordenadas locales; origen = pies. o: {t, facing, walk, wave, cheer, lift, blink}
function drawMilo(ctx, x, y, s, o) {
  o = o || {};
  const t = o.t || 0, f = o.facing || 1, walk = o.walk || 0, wave = o.wave || 0, cheer = o.cheer || 0, lift = o.lift || 0;
  const ph = t * 13;
  // aspecto: ropa del bazar + equipo del pueblo (o.look sirve para probar prendas sin tenerlas)
  let look = o.look; if (!look) { try { look = MG.data.look(); } catch (e) { look = null; } }
  const ves = (look && look.vestido) || {}, pue = (look && look.puestos) || [], WR = MG.wear;
  const pal = WR ? WR.palette(pue) : { body: A.milo, dark: A.miloDark, belly: '' };
  const hat = WR ? WR.headgear(ves, pue) : null;
  const bob = walk ? -Math.abs(Math.sin(ph)) * 5 : Math.sin(t * 3) * 1.6;
  const sq = walk ? 1 + Math.sin(ph * 2) * .05 : 1 + Math.sin(t * 3) * .018;
  A.shadow(ctx, x, y, 30 * s * (1 - clamp(lift / (220 * s), 0, 1) * .45));
  ctx.save(); ctx.translate(x, y - lift); ctx.scale(f * s, s);
  const amp = walk * 9;
  // las prendas se dibujan con la geometría de Milo de la pelea (centro del cuerpo = origen) a escala .83
  const wear = fn => { ctx.save(); ctx.translate(-2, -58 + bob); ctx.scale(.83, .83); fn(); ctx.restore(); };
  const wo = { t, b: walk * .7, v: lift > 0 ? -.4 : 0 };
  // piernas de manguera + zapatos
  for (const side of [-1, 1]) {
    const sw = Math.sin(ph + (side > 0 ? 0 : Math.PI)) * amp;
    const fx = side * 12 + sw, fy = -5 - Math.max(0, Math.cos(ph + (side > 0 ? 0 : Math.PI))) * 6 * walk;
    A.hose(ctx, side * 10, -26 + bob * .5, fx, fy - 4, side * 3, 9, pal.dark);
    B(ctx, fx + 4, fy, 13, 6.5, '#3b2a1c', { wob: .5, lw: 3, shade: false, points: 10 });
  }
  if (WR && pue.indexOf('aura') > -1) wear(() => WR.aura(ctx, t));
  if (WR && ves.espalda === 'capa') wear(() => WR.cape(ctx, wo));
  // mochila (atrás)
  B(ctx, -25, -62 + bob, 25, 34, '#8a5a32', { wob: 1.1, lw: 4, rot: -.12, seed: 3 });
  B(ctx, -27, -86 + bob, 21, 11, '#6e4524', { wob: .8, lw: 3.5, shade: false, seed: 5 });
  B(ctx, -22, -76 + bob, 5, 5, A.gold, { wob: .3, lw: 2, shade: false, points: 8 });
  // brazo lejano
  const armBack = cheer ? [-44, -108 + Math.sin(t * 9 + 1) * 5] : [-30, -34 - Math.sin(ph) * walk * 5];
  A.hose(ctx, -22, -52 + bob, armBack[0], armBack[1], -8, 8, pal.dark);
  A.glove(ctx, armBack[0], armBack[1], 9, cheer ? -1.9 : 1.2);
  // cuerpo
  B(ctx, 0, -58 + bob, 31 / sq, 36 * sq, pal.body, { wob: 1.4, lw: 4.5, seed: 1 });
  // correas
  ctx.strokeStyle = '#6e4524'; ctx.lineWidth = 5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-14, -88 + bob); ctx.quadraticCurveTo(-4, -62 + bob, -17, -36 + bob); ctx.stroke();
  if (WR && ves.cuello === 'bufanda') wear(() => WR.scarf(ctx, wo));
  // mechón (bajo gorro o sombrero no se ve)
  if (!hat) {
    ctx.strokeStyle = A.ink; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(0, -93 + bob); ctx.quadraticCurveTo(-6, -108 + bob, 4, -106 + bob); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(4, -93 + bob); ctx.quadraticCurveTo(12, -105 + bob, 14, -98 + bob); ctx.stroke();
  }
  // ojos-punto (sin boca)
  const bl = (Math.floor(t * 1.2) % 4 === 3 && (t * 1.2 % 1) < .12) ? .15 : 1;
  ctx.fillStyle = A.ink;
  for (const ex of [4, 19]) {
    ctx.beginPath(); ctx.ellipse(ex, -66 + bob, 4.6, 6.6 * bl, 0, 0, TAU); ctx.fill();
    if (bl > .5) { ctx.fillStyle = A.cream; ctx.beginPath(); ctx.arc(ex + 1.5, -69 + bob, 1.6, 0, TAU); ctx.fill(); ctx.fillStyle = A.ink; }
  }
  if (WR && ves.cara === 'lentes') wear(() => WR.glasses(ctx, wo));
  if (WR && hat) wear(() => WR.hat(ctx, hat, { t, sway: Math.sin(t * 3) * 3 + (walk ? Math.sin(ph) * 3 : 0) }));
  // brazo cercano
  let hx, hy, bend = 8;
  if (cheer) { hx = 44; hy = -108 + Math.sin(t * 9) * 5; bend = 10; }
  else if (wave) { hx = 40 + Math.sin(t * 11) * 9; hy = -100 + Math.cos(t * 11) * 5; bend = 14; }
  else { hx = 30 + Math.sin(ph + Math.PI) * walk * 8; hy = -34 + Math.cos(ph) * walk * 3; }
  A.hose(ctx, 24, -52 + bob, hx, hy, bend, 8, pal.body);
  A.glove(ctx, hx, hy, 9.5, (wave || cheer) ? -1.3 + Math.sin(t * 11) * (wave ? .4 : .1) : 1.1);
  ctx.restore();
}
MG.screensMilo = drawMilo;

/* ============================ fondos y recursos comunes ============================ */
let COMMON = null;
function common() {
  if (COMMON) return COMMON;
  const C = COMMON = {};
  // fondo de cartel (cielo dorado)
  let c = mk(W, H), x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#f8dea6'); g.addColorStop(.65, '#eeb675'); g.addColorStop(1, '#d6844a');
  x.fillStyle = g; x.fillRect(0, 0, W, H); C.sky = c;
  // telón (mitad)
  c = mk(640, H); x = c.getContext('2d');
  x.fillStyle = '#a3281f'; x.fillRect(0, 0, 640, H);
  const folds = 10, fw = 640 / folds;
  for (let i = 0; i < folds; i++) {
    const lg = x.createLinearGradient(i * fw, 0, (i + 1) * fw, 0);
    lg.addColorStop(0, 'rgba(50,5,0,.55)'); lg.addColorStop(.4, 'rgba(255,120,90,.18)'); lg.addColorStop(.6, 'rgba(255,150,110,.22)'); lg.addColorStop(1, 'rgba(50,5,0,.6)');
    x.fillStyle = lg; x.fillRect(i * fw, 0, fw, H);
    x.strokeStyle = 'rgba(30,0,0,.35)'; x.lineWidth = 2; x.beginPath(); x.moveTo(i * fw, 0); x.lineTo(i * fw, H); x.stroke();
  }
  x.fillStyle = A.gold; x.fillRect(0, H - 26, 640, 10);
  x.strokeStyle = A.ink; x.lineWidth = 3;
  for (let i = 0; i < 64; i++) { x.beginPath(); x.moveTo(i * 10 + 5, H - 16); x.lineTo(i * 10 + 5, H - 2); x.strokeStyle = i % 2 ? '#c99a2e' : '#f2c14e'; x.lineWidth = 4; x.stroke(); }
  C.curtain = c;
  // cenefa superior con flecos
  c = mk(W, 150); x = c.getContext('2d');
  x.fillStyle = '#8f2018'; x.fillRect(0, 0, W, 78);
  for (let i = 0; i < 12; i++) {
    const cx = i * (W / 12) + W / 24;
    x.fillStyle = '#b32d22'; x.strokeStyle = A.ink; x.lineWidth = 4;
    x.beginPath(); x.arc(cx, 78, W / 24 + 2, 0, Math.PI); x.fill(); x.stroke();
    x.strokeStyle = A.gold; x.lineWidth = 3;
    for (let k = -3; k <= 3; k++) { x.beginPath(); x.moveTo(cx + k * 9, 78 + W / 24 * Math.sqrt(Math.max(0, 1 - (k * 9 / (W / 24)) ** 2)) - 2); x.lineTo(cx + k * 9, 124 - Math.abs(k) * 3); x.stroke(); }
    x.fillStyle = A.gold; x.beginPath(); x.arc(cx, 52, 7, 0, TAU); x.fill(); x.lineWidth = 2; x.strokeStyle = A.ink; x.stroke();
  }
  x.fillStyle = A.gold; x.fillRect(0, 0, W, 12); x.strokeStyle = A.ink; x.lineWidth = 4; x.beginPath(); x.moveTo(0, 12); x.lineTo(W, 12); x.stroke();
  C.valance = c;
  return C;
}

/* ============================ 1) TÍTULO ============================ */
const BOSS_IDS = ['rasquina', 'pantallon', 'gaston', 'flojera'];
let S = null;   // estado del título
function silhouette(id) {
  const c = mk(240, 240), x = c.getContext('2d'), def = MG.bosses[id];
  x.save();
  try {
    if (def && def.mapIcon) def.mapIcon(x, 120, 130, 1.5, 0);
    else { B(x, 120, 130, 70, 80, '#fff', { wob: 3 }); }
  } catch (e) { B(x, 120, 130, 70, 80, '#fff', { wob: 3 }); }
  x.restore();
  x.globalCompositeOperation = 'source-in'; x.fillStyle = '#1d1209'; x.fillRect(0, 0, 240, 240);
  return c;
}
const CARDS = [
  'Milo, el mandadero del pueblo, tenía un problema...',
  'Cuatro malos hábitos se habían adueñado de las islas.',
  '¡Solo cumpliendo sus encargos podrá noquearlos!'
];
function ornFrame(ctx, x, y, w, h) {
  ctx.save(); ctx.strokeStyle = '#d9c9a0'; ctx.lineJoin = 'round';
  ctx.lineWidth = 8; ctx.strokeRect(x, y, w, h);
  ctx.lineWidth = 2.5; ctx.strokeRect(x + 16, y + 16, w - 32, h - 32);
  ctx.lineWidth = 1.5; ctx.strokeRect(x + 24, y + 24, w - 48, h - 48);
  for (const [cx, cy, sx, sy] of [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]]) {
    ctx.save(); ctx.translate(cx, cy); ctx.scale(sx, sy);
    ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(34, 34); ctx.bezierCurveTo(90, 30, 100, 90, 60, 90); ctx.bezierCurveTo(30, 90, 36, 60, 56, 62); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(34, 34); ctx.bezierCurveTo(30, 90, 90, 100, 90, 60); ctx.bezierCurveTo(90, 30, 60, 36, 62, 56); ctx.stroke();
    ctx.fillStyle = '#d9c9a0'; ctx.beginPath(); ctx.arc(34, 34, 7, 0, TAU); ctx.fill();
    ctx.restore();
  }
  // florón central superior e inferior
  for (const yy of [y + 14, y + h - 14]) {
    ctx.fillStyle = '#d9c9a0'; ctx.beginPath(); ctx.moveTo(x + w / 2, yy - 14); ctx.lineTo(x + w / 2 + 12, yy); ctx.lineTo(x + w / 2, yy + 14); ctx.lineTo(x + w / 2 - 12, yy); ctx.closePath(); ctx.fill();
    ctx.fillRect(x + w / 2 - 110, yy - 1.5, 80, 3); ctx.fillRect(x + w / 2 + 30, yy - 1.5, 80, 3);
  }
  ctx.restore();
}

MG.scene('title', {
  enter() {
    common();
    S = { t: 0, mode: 'title', card: 0, cardT: 0, sil: {}, leaving: false, lines: [] };
    for (const id of BOSS_IDS) S.sil[id] = silhouette(id);
    MG.pointer = null;
    music('title');
  },
  exit() { S = null; },
  update(dt) {
    if (!S) return;
    S.t += dt;
    const p = click(), ok = I.ok() || !!p;
    if (S.leaving) return;
    // Esc / Retroceso en el título o en la historia: salir a la app
    if (I.pressed('pause') || I.pressed('back')) { S.leaving = true; snd('select'); MG.close(); return; }
    if (S.mode === 'title') {
      if (ok && S.t > .7) {
        snd('select');
        const st = MG.data.store();
        if (!st.seenIntro) { S.mode = 'cards'; S.card = 0; S.cardT = 0; S.lines = []; }
        else { S.leaving = true; MG.go('map'); }
      }
    } else {
      S.cardT += dt;
      const full = CARDS[S.card].length / 38 + .15;
      if (ok && S.cardT > .25) {
        if (S.cardT < full) { S.cardT = full + .01; snd('tick'); }
        else {
          snd('tick');
          if (S.card < CARDS.length - 1) { S.card++; S.cardT = 0; S.lines = []; }
          else {
            const st = MG.data.store(); st.seenIntro = true; MG.data.persist();
            S.leaving = true; MG.go('map');
          }
        }
      }
    }
  },
  draw(ctx) {
    if (!S) return;
    const C = common(), t = S.t;
    if (S.mode === 'cards') {
      ctx.fillStyle = '#0b0805'; ctx.fillRect(0, 0, W, H);
      ctx.save(); ctx.globalAlpha = .1 + Math.sin(t * 40) * .03; ctx.fillStyle = '#fff3d0'; ctx.fillRect(0, 0, W, H); ctx.restore();
      ornFrame(ctx, 90, 70, W - 180, H - 140);
      const yb = 560, k = S.card;
      if (k === 0) drawMilo(ctx, W / 2, yb, 1.5, { t, facing: 1, walk: 1 });
      if (k === 1) BOSS_IDS.forEach((id, i) => { ctx.save(); ctx.translate(W / 2 + (i - 1.5) * 190, yb - 10 + Math.sin(t * 2 + i) * 6); ctx.scale(.9, .9); ctx.drawImage(S.sil[id], -120, -170); ctx.restore(); });
      if (k === 2) drawMilo(ctx, W / 2, yb, 1.6, { t, cheer: 1, lift: Math.abs(Math.sin(t * 3)) * 25 });
      return;
    }
    ctx.drawImage(C.sky, 0, 0);
    A.rays(ctx, W / 2, 470, 'rgba(255,244,200,.34)', t);
    // tablado
    ctx.fillStyle = '#7b4c28'; ctx.beginPath(); ctx.moveTo(0, 650); ctx.lineTo(W, 650); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill();
    ctx.strokeStyle = A.ink; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(0, 650); ctx.lineTo(W, 650); ctx.stroke();
    ctx.strokeStyle = 'rgba(30,15,0,.45)'; ctx.lineWidth = 2;
    for (let i = 0; i < 14; i++) { ctx.beginPath(); ctx.moveTo(i * 100 + 20, 650); ctx.lineTo(i * 100 - 60 + (i - 6.5) * 18, H); ctx.stroke(); }
    // jefes asomándose en silueta (se mecen)
    const open = ease.inOut(clamp((t - .5) / 1.8, 0, 1));
    const pos = [[170, 0], [400, 1], [885, 2], [1110, 3]];
    pos.forEach(([bx, i]) => {
      const id = BOSS_IDS[i]; if (!S.sil[id]) return;
      const rise = ease.outBack(clamp((t - 1.6 - i * .25) / .7, 0, 1));
      ctx.save(); ctx.translate(bx, 668 - rise * 28 + Math.sin(t * 2 + i * 1.7) * 7); ctx.rotate(Math.sin(t * 1.4 + i) * .06 + (bx < W / 2 ? -.05 : .05)); ctx.scale(1.15, 1.15);
      ctx.drawImage(S.sil[id], -120, -215);
      ctx.fillStyle = '#ffe27a'; const bl2 = Math.sin(t * 1.3 + i * 2) > .96 ? .1 : 1;
      for (const ex of [-14, 14]) { ctx.beginPath(); ctx.ellipse(ex, -92, 7, 11 * bl2, 0, 0, TAU); ctx.fill(); }
      ctx.restore();
    });
    // Milo saluda
    drawMilo(ctx, W / 2 - 30, 654, 2.1, { t, wave: 1, facing: 1 });
    // telón que se abre + cenefa
    const edge = lerp(W / 2, 96, open);
    ctx.drawImage(C.curtain, 0, 0, 640, H, 0, 0, edge, H);
    ctx.save(); ctx.translate(W, 0); ctx.scale(-1, 1); ctx.drawImage(C.curtain, 0, 0, 640, H, 0, 0, edge, H); ctx.restore();
    ctx.drawImage(C.valance, 0, 0);
  },
  drawUI(ctx) {
    if (!S || S.mode === 'cards' && false) return;
    const t = S.t;
    if (S.mode === 'cards') {
      const full = CARDS[S.card].length / 38 + .15;
      const lines = wrapText(ctx, CARDS[S.card], 52, 820);
      const total = lines.join('').length;
      let shown = Math.min(total, Math.floor(S.cardT * 38)), yy = 290 - (lines.length - 1) * 38;
      for (const ln of lines) {
        const part = ln.slice(0, Math.max(0, shown)); shown -= ln.length;
        A.text(ctx, part, W / 2, yy, 52, { font: 'ui', fill: '#f0e4c4', stroke: false, align: 'center' });
        yy += 76;
      }
      if (S.cardT > full && Math.floor(t * 2.2) % 2 === 0) txt(ctx, isTouch() ? 'TOCA ▶' : 'SALTO ▶', W - 230, H - 112, 28, { fill: '#d9c9a0', stroke: false, align: 'right' });
      for (let i = 0; i < CARDS.length; i++) { ctx.fillStyle = i === S.card ? '#f0e4c4' : '#6d6450'; ctx.beginPath(); ctx.arc(W / 2 + (i - 1) * 26, H - 108, 6, 0, TAU); ctx.fill(); }
      return;
    }
    const open = ease.inOut(clamp((t - .5) / 1.8, 0, 1)), a = clamp((open - .35) / .5, 0, 1);
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha = a;
    const pop = ease.outElastic(clamp((t - 1.2) / 1.0, 0, 1)), bounce = 1 + Math.sin(t * 3.2) * .022;
    // MILO gigante
    ctx.save(); ctx.translate(W / 2, 168); ctx.scale(pop * bounce, pop / bounce); ctx.rotate(Math.sin(t * 1.6) * .015);
    A.text(ctx, 'MILO', 9, 12, 250, { fill: A.red, stroke: A.ink, lw: 26 });
    A.text(ctx, 'MILO', 0, 0, 250, { fill: A.gold, stroke: A.ink, lw: 26 });
    ctx.restore();
    // cinta del subtítulo
    const sp = ease.outBack(clamp((t - 1.7) / .5, 0, 1));
    ctx.save(); ctx.translate(W / 2, 330); ctx.rotate(-.025); ctx.scale(sp, sp);
    ctx.fillStyle = A.red; ctx.strokeStyle = A.ink; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(-420, -38); ctx.lineTo(420, -38); ctx.lineTo(450, 0); ctx.lineTo(420, 38); ctx.lineTo(-420, 38); ctx.lineTo(-450, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    A.text(ctx, 'EL GRAN NOQUEO', 0, 3, 60, { fill: A.cream, lw: 9 });
    ctx.restore();
    txt(ctx, '— un dibujo animado hecho con tus hábitos reales —', W / 2, 384, 22, { fill: A.ink, stroke: false });
    if (t > 2.2 && Math.floor(t * 2.4) % 2 === 0)
      txt(ctx, isTouch() ? 'TOCA PARA EMPEZAR' : 'PRESIONA SALTO / TOCA PARA EMPEZAR', W / 2, H - 30, 34, { fill: A.cream, lw: 7 });
    ctx.restore();
  }
});

/* ============================ 2) MAPA ============================ */
const WW = 2400, WH = 1500;
const ISL = {
  pueblo: { x: 1200, y: 750, rx: 370, ry: 255 },
  piel: { x: 420, y: 340, rx: 310, ry: 215 },
  suenio: { x: 1980, y: 340, rx: 310, ry: 215 },
  plata: { x: 420, y: 1160, rx: 310, ry: 215 },
  cuerpo: { x: 1980, y: 1160, rx: 310, ry: 215 }
};
const BRIDGES = [['pueblo', 'piel'], ['pueblo', 'suenio'], ['pueblo', 'plata'], ['pueblo', 'cuerpo'], ['piel', 'plata'], ['suenio', 'cuerpo']];
const BOSS_ISLAND = { rasquina: 'piel', pantallon: 'suenio', gaston: 'plata', flojera: 'cuerpo' };
const BRIDGE_W = 46;   // semiancho
function segDist(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy;
  const t = l2 ? clamp(((px - ax) * dx + (py - ay) * dy) / l2, 0, 1) : 0;
  return Math.hypot(px - (ax + dx * t), py - (ay + dy * t));
}
function inIsland(x, y, e, m) { return ((x - e.x) / (e.rx - m)) ** 2 + ((y - e.y) / (e.ry - m)) ** 2 <= 1; }
// ¿se puede caminar aquí? tierra = elipses de islas + puentes (cápsulas)
function isLand(x, y) {
  if (x < 20 || y < 20 || x > WW - 20 || y > WH - 20) return false;
  for (const k in ISL) if (inIsland(x, y, ISL[k], 8)) return true;
  for (const [a, b] of BRIDGES) if (segDist(x, y, ISL[a].x, ISL[a].y, ISL[b].x, ISL[b].y) <= BRIDGE_W) return true;
  return false;
}
MG.mapIsLand = isLand;
MG.screensDebug = { world: () => WORLD, map: () => M, isLand, findPath };
const nearRoad = (x, y, m) => BRIDGES.some(([a, b]) => segDist(x, y, ISL[a].x, ISL[a].y, ISL[b].x, ISL[b].y) < m);
function clearLine(ax, ay, bx, by) {
  const L = Math.hypot(bx - ax, by - ay), n = Math.ceil(L / 14);
  for (let i = 0; i <= n; i++) if (!isLand(lerp(ax, bx, i / n), lerp(ay, by, i / n))) return false;
  return true;
}
// camino: Dijkstra sobre {inicio, destino, centros de isla}
function findPath(sx, sy, tx, ty) {
  if (clearLine(sx, sy, tx, ty)) return [{ x: tx, y: ty }];
  const N = [{ x: sx, y: sy }, { x: tx, y: ty }].concat(Object.keys(ISL).map(k => ({ x: ISL[k].x, y: ISL[k].y })));
  const n = N.length, d = new Array(n).fill(Infinity), prev = new Array(n).fill(-1), done = new Array(n).fill(false);
  d[0] = 0;
  for (let it = 0; it < n; it++) {
    let u = -1; for (let i = 0; i < n; i++) if (!done[i] && (u < 0 || d[i] < d[u])) u = i;
    if (u < 0 || d[u] === Infinity) break; done[u] = true;
    for (let v = 0; v < n; v++) {
      if (done[v] || v === u) continue;
      const w = Math.hypot(N[u].x - N[v].x, N[u].y - N[v].y);
      if (d[u] + w < d[v] && clearLine(N[u].x, N[u].y, N[v].x, N[v].y)) { d[v] = d[u] + w; prev[v] = u; }
    }
  }
  if (prev[1] < 0) return [];
  const out = []; for (let v = 1; v >= 0 && v !== 0; v = prev[v]) out.unshift({ x: N[v].x, y: N[v].y });
  return out;
}

const THEME = {
  pueblo: { sand: '#ecdcae', grass: '#a8c56c', hi: '#dcef9c', trees: ['#5f9340', '#79ac4b'], trunk: '#7a4b26' },
  piel: { sand: '#f3d9c9', grass: '#b8d8a4', hi: '#eaf8cf', trees: ['#76b07a', '#8cc58e'], trunk: '#86563a' },
  suenio: { sand: '#8d93c6', grass: '#41508b', hi: '#7384c4', trees: ['#2c3c6f', '#3b4e8a'], trunk: '#2a2044' },
  plata: { sand: '#eadb9d', grass: '#c4c27c', hi: '#ece9a8', trees: ['#8a9a3e', '#a3b04c'], trunk: '#6d4a22' },
  cuerpo: { sand: '#e6c298', grass: '#cfa57a', hi: '#efd0a6', trees: ['#789a46', '#8fb256'], trunk: '#6a4426' }
};
const POOL = [[170, 70], [235, -30], [105, 135], [-70, 125], [-175, 75], [170, -115], [250, 60], [20, 155], [-30, -165], [185, 150]];

let M = null;          // estado del mapa
let WORLD = null;      // canvas estático del mundo (se arma una sola vez)
let DECOR = null;      // decoración animada / árboles (posiciones)

function drawHouse(x, px, py, s, wall, roof) {
  B(x, px + 5 * s, py + 30 * s, 40 * s, 10 * s, 'rgba(30,50,40,.3)', { wob: 1, line: false, shade: false, points: 12 });
  x.save(); x.translate(px, py);
  x.fillStyle = wall; x.strokeStyle = A.ink; x.lineWidth = 4; x.lineJoin = 'round';
  rr(x, -32 * s, -14 * s, 64 * s, 44 * s, 4); x.fill(); x.stroke();
  x.fillStyle = roof; x.beginPath(); x.moveTo(-42 * s, -12 * s); x.lineTo(0, -52 * s); x.lineTo(42 * s, -12 * s); x.closePath(); x.fill(); x.stroke();
  x.fillStyle = '#6b4020'; rr(x, -8 * s, 6 * s, 16 * s, 24 * s, 3); x.fill(); x.stroke();
  x.fillStyle = '#bfe3ee'; rr(x, 14 * s, -4 * s, 12 * s, 12 * s, 2); x.fill(); x.lineWidth = 3; x.stroke();
  x.fillStyle = '#bfe3ee'; rr(x, -26 * s, -4 * s, 12 * s, 12 * s, 2); x.fill(); x.stroke();
  x.restore();
}
function drawBath(x, px, py, s) {
  B(x, px + 8, py + 18, 56 * s, 14 * s, 'rgba(30,50,40,.28)', { line: false, shade: false, points: 12 });
  for (const sx of [-1, 1]) B(x, px + sx * 38 * s, py + 22 * s, 8 * s, 8 * s, A.gold, { wob: .4, lw: 3, shade: false, points: 8 });
  B(x, px, py, 54 * s, 28 * s, '#f6efe2', { wob: 1, lw: 4.5 });
  B(x, px, py - 2 * s, 44 * s, 19 * s, '#8cc4dc', { wob: .8, lw: 3, shade: false });
  x.strokeStyle = 'rgba(255,255,255,.8)'; x.lineWidth = 3;
  for (const [bx, by, br] of [[-14, -4, 7], [6, -8, 5], [20, 0, 8], [-2, 3, 4]]) { x.beginPath(); x.arc(px + bx * s, py + by * s, br * s, 0, TAU); x.stroke(); }
  x.strokeStyle = A.ink; x.lineWidth = 5; x.lineCap = 'round'; x.beginPath(); x.moveTo(px + 46 * s, py - 18 * s); x.lineTo(px + 46 * s, py - 44 * s); x.quadraticCurveTo(px + 46 * s, py - 52 * s, px + 36 * s, py - 50 * s); x.stroke();
}
function drawStall(x, px, py, s) {
  B(x, px + 6, py + 26 * s, 46 * s, 10 * s, 'rgba(30,40,20,.3)', { line: false, shade: false, points: 12 });
  x.save(); x.translate(px, py); x.lineJoin = 'round';
  x.fillStyle = '#8a5a32'; x.strokeStyle = A.ink; x.lineWidth = 4; rr(x, -34 * s, -2 * s, 68 * s, 30 * s, 3); x.fill(); x.stroke();
  for (let i = 0; i < 6; i++) { x.fillStyle = i % 2 ? A.cream : A.red; x.beginPath(); x.moveTo(-40 * s + i * 13.3 * s, -34 * s); x.lineTo(-40 * s + (i + 1) * 13.3 * s, -34 * s); x.lineTo(-40 * s + (i + 1) * 13.3 * s + 2 * s, -6 * s); x.lineTo(-40 * s + i * 13.3 * s + 2 * s, -6 * s); x.closePath(); x.fill(); }
  x.lineWidth = 4; x.beginPath(); x.moveTo(-40 * s, -34 * s); x.lineTo(40 * s, -34 * s); x.lineTo(42 * s, -6 * s); x.lineTo(-38 * s, -6 * s); x.closePath(); x.stroke();
  x.restore();
  for (let i = -1; i <= 1; i++) coin(x, px + i * 18 * s, py + 12 * s, 7 * s, 0);
}
function drawSofa(x, px, py, s, col) {
  B(x, px + 5, py + 24 * s, 62 * s, 10 * s, 'rgba(40,20,10,.28)', { line: false, shade: false, points: 12 });
  x.save(); x.translate(px, py); x.lineJoin = 'round'; x.strokeStyle = A.ink; x.lineWidth = 4;
  x.fillStyle = col; rr(x, -50 * s, -34 * s, 100 * s, 30 * s, 10 * s); x.fill(); x.stroke();      // respaldo
  x.fillStyle = 'rgba(255,255,255,.2)'; rr(x, -44 * s, -30 * s, 88 * s, 8 * s, 4 * s); x.fill();
  x.fillStyle = col; rr(x, -42 * s, -12 * s, 84 * s, 30 * s, 8 * s); x.fill(); x.stroke();           // asiento
  x.fillStyle = 'rgba(0,0,0,.14)'; x.fillRect(-1 * s, -10 * s, 2 * s, 26 * s);
  for (const sx of [-1, 1]) { x.fillStyle = col; rr(x, sx * 58 * s - 11 * s, -26 * s, 22 * s, 48 * s, 9 * s); x.fill(); x.stroke(); }
  x.restore();
}
function drawGym(x, px, py, s) {
  B(x, px + 8, py + 36 * s, 64 * s, 12 * s, 'rgba(40,20,10,.3)', { line: false, shade: false, points: 12 });
  x.save(); x.translate(px, py); x.lineJoin = 'round'; x.strokeStyle = A.ink; x.lineWidth = 4.5;
  x.fillStyle = '#b8b4a6'; rr(x, -58 * s, -22 * s, 116 * s, 62 * s, 4); x.fill(); x.stroke();
  x.fillStyle = '#8a4a2c'; rr(x, -64 * s, -34 * s, 128 * s, 18 * s, 3); x.fill(); x.stroke();
  x.fillStyle = '#4a3b30'; rr(x, -12 * s, 8 * s, 24 * s, 32 * s, 3); x.fill(); x.stroke();
  // mancuerna del letrero
  x.fillStyle = A.cream; rr(x, -44 * s, -16 * s, 88 * s, 22 * s, 4); x.fill(); x.lineWidth = 3; x.stroke();
  x.fillStyle = A.ink; x.fillRect(-20 * s, -6 * s, 40 * s, 4 * s);
  for (const sx of [-1, 1]) { x.fillRect(sx * 24 * s - 5 * s, -13 * s, 10 * s, 18 * s); x.fillRect(sx * 32 * s - 3 * s, -10 * s, 6 * s, 12 * s); }
  x.restore();
}
function drawMoon(x, px, py, r) {
  x.save(); x.translate(px, py);
  x.fillStyle = 'rgba(255,240,170,.16)'; x.beginPath(); x.arc(0, 0, r * 1.7, 0, TAU); x.fill();
  x.beginPath(); x.arc(0, 0, r * 1.35, 0, TAU); x.fill();
  const dx = r * .5, dy = -r * .15, rc = r * .86, d = Math.hypot(dx, dy), th = Math.atan2(dy, dx);
  const aa = (r * r - rc * rc + d * d) / (2 * d), ph = Math.acos(clamp(aa / r, -1, 1));
  const p1 = [Math.cos(th + ph) * r, Math.sin(th + ph) * r], p2 = [Math.cos(th - ph) * r, Math.sin(th - ph) * r];
  x.beginPath(); x.arc(0, 0, r, th + ph, th - ph + TAU, false);
  const s2 = Math.atan2(p2[1] - dy, p2[0] - dx), s1 = Math.atan2(p1[1] - dy, p1[0] - dx);
  let dl = s1 - s2; while (dl > Math.PI) dl -= TAU; while (dl < -Math.PI) dl += TAU;
  const mid = s2 + dl / 2; if (Math.cos(mid - (th + Math.PI)) < 0) dl += dl > 0 ? -TAU : TAU;
  for (let i = 1; i <= 24; i++) x.lineTo(dx + Math.cos(s2 + dl * i / 24) * rc, dy + Math.sin(s2 + dl * i / 24) * rc);
  x.closePath(); x.fillStyle = '#f7e9a8'; x.fill(); x.lineWidth = 5; x.strokeStyle = A.ink; x.lineJoin = 'round'; x.stroke();
  x.fillStyle = A.ink; x.beginPath(); x.arc(-r * .55, -r * .1, 3, 0, TAU); x.fill();
  x.restore();
}
function drawTree(ctx, px, py, s, pal, trunk, sway) {
  A.shadow(ctx, px, py + 2, 26 * s);
  B(ctx, px, py - 10 * s, 6 * s, 17 * s, trunk, { wob: .5, lw: 3, shade: false, points: 10 });
  B(ctx, px - 7 * s + sway, py - 40 * s, 24 * s, 21 * s, pal[0], { wob: 1.2, lw: 3.5, seed: px * .1, shade: false });
  B(ctx, px + 8 * s + sway, py - 44 * s, 22 * s, 19 * s, pal[1], { wob: 1.2, lw: 3.5, seed: px * .1 + 5 });
  B(ctx, px + sway * 1.3, py - 58 * s, 17 * s, 15 * s, pal[1], { wob: 1, lw: 3.5, seed: px * .1 + 9, shade: false });
}

function buildWorld() {
  const c = mk(WW, WH), x = c.getContext('2d'), r = rng(11);
  const g = x.createLinearGradient(0, 0, 0, WH);
  g.addColorStop(0, '#78b6b0'); g.addColorStop(.5, '#6aa9a8'); g.addColorStop(1, '#5a96a0');
  x.fillStyle = g; x.fillRect(0, 0, WW, WH);
  for (let i = 0; i < 70; i++) {
    x.fillStyle = r() < .5 ? 'rgba(255,255,255,.05)' : 'rgba(20,70,90,.07)';
    x.beginPath(); x.ellipse(r() * WW, r() * WH, 60 + r() * 160, 30 + r() * 80, 0, 0, TAU); x.fill();
  }
  for (const k in ISL) {
    const e = ISL[k];
    for (let j = 5; j >= 1; j--) { x.fillStyle = 'rgba(200,240,225,.13)'; x.beginPath(); x.ellipse(e.x, e.y, e.rx + j * 24, e.ry + j * 24, 0, 0, TAU); x.fill(); }
  }
  // puentes (tablones sobre el mar)
  for (const [a, b] of BRIDGES) {
    const A0 = ISL[a], B0 = ISL[b], dx = B0.x - A0.x, dy = B0.y - A0.y, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
    x.lineCap = 'butt';
    x.strokeStyle = 'rgba(20,50,60,.3)'; x.lineWidth = 104; x.beginPath(); x.moveTo(A0.x + 10, A0.y + 18); x.lineTo(B0.x + 10, B0.y + 18); x.stroke();
    x.strokeStyle = A.ink; x.lineWidth = 102; x.beginPath(); x.moveTo(A0.x, A0.y); x.lineTo(B0.x, B0.y); x.stroke();
    x.strokeStyle = '#b8814a'; x.lineWidth = 92; x.beginPath(); x.moveTo(A0.x, A0.y); x.lineTo(B0.x, B0.y); x.stroke();
    for (let d = 0, i = 0; d < L; d += 17, i++) {
      const px = A0.x + ux * d, py = A0.y + uy * d;
      x.strokeStyle = i % 2 ? 'rgba(70,35,10,.5)' : 'rgba(255,230,170,.18)'; x.lineWidth = i % 2 ? 3 : 8;
      x.beginPath(); x.moveTo(px + nx * 45, py + ny * 45); x.lineTo(px - nx * 45, py - ny * 45); x.stroke();
    }
    for (const sd of [-1, 1]) {
      x.strokeStyle = A.ink; x.lineWidth = 7; x.beginPath(); x.moveTo(A0.x + nx * 52 * sd, A0.y + ny * 52 * sd); x.lineTo(B0.x + nx * 52 * sd, B0.y + ny * 52 * sd); x.stroke();
      x.strokeStyle = '#d9a766'; x.lineWidth = 3; x.stroke();
      for (let d = 30; d < L - 20; d += 76) {
        const px = A0.x + ux * d + nx * 52 * sd, py = A0.y + uy * d + ny * 52 * sd;
        if (!Object.keys(ISL).some(k => inIsland(px, py, ISL[k], 0))) B(x, px, py, 8, 8, '#9a6a3a', { wob: .5, lw: 3, shade: false, points: 8 });
      }
    }
  }
  // islas
  for (const k in ISL) {
    const e = ISL[k], th = THEME[k];
    x.fillStyle = 'rgba(25,55,65,.3)'; x.beginPath(); x.ellipse(e.x + 16, e.y + 24, e.rx + 6, e.ry + 6, 0, 0, TAU); x.fill();
    B(x, e.x, e.y, e.rx, e.ry, th.sand, { wob: 7, points: 54, lw: 6, shade: false, seed: e.x });
    B(x, e.x, e.y, e.rx - 26, e.ry - 26, th.grass, { wob: 5, points: 54, lw: 4, shade: false, seed: e.y });
    x.save(); x.globalAlpha = .28; x.fillStyle = th.hi; x.beginPath(); x.ellipse(e.x - e.rx * .12, e.y - e.ry * .2, e.rx * .62, e.ry * .5, 0, 0, TAU); x.fill(); x.restore();
    x.strokeStyle = 'rgba(30,50,20,.2)'; x.lineWidth = 2.5; x.lineCap = 'round';
    for (let i = 0; i < 70; i++) {
      const a = r() * TAU, rad = Math.sqrt(r()) * .82, gx = e.x + Math.cos(a) * (e.rx - 30) * rad, gy = e.y + Math.sin(a) * (e.ry - 30) * rad;
      x.beginPath(); x.moveTo(gx, gy); x.lineTo(gx - 3, gy - 8); x.moveTo(gx + 3, gy); x.lineTo(gx + 4, gy - 7); x.stroke();
    }
    if (k === 'suenio') { x.fillStyle = 'rgba(15,20,70,.3)'; x.beginPath(); x.ellipse(e.x, e.y, e.rx + 4, e.ry + 4, 0, 0, TAU); x.fill(); }
  }
  // caminos de tierra sobre las islas
  for (const [a, b] of BRIDGES) {
    const A0 = ISL[a], B0 = ISL[b], L = Math.hypot(B0.x - A0.x, B0.y - A0.y);
    for (let d = 0; d <= L; d += 15) {
      const px = lerp(A0.x, B0.x, d / L), py = lerp(A0.y, B0.y, d / L);
      if (Object.keys(ISL).some(k => inIsland(px, py, ISL[k], 20))) { x.fillStyle = 'rgba(235,214,160,.92)'; x.beginPath(); x.arc(px, py, 41 + Math.sin(d * .3) * 3, 0, TAU); x.fill(); }
    }
  }
  // plaza del pueblo
  x.fillStyle = 'rgba(235,214,160,.95)'; x.beginPath(); x.ellipse(1200, 750, 100, 70, 0, 0, TAU); x.fill();
  x.strokeStyle = 'rgba(120,80,40,.4)'; x.lineWidth = 3; x.setLineDash([10, 8]); x.beginPath(); x.ellipse(1200, 750, 100, 70, 0, 0, TAU); x.stroke(); x.setLineDash([]);

  /* --- decoración temática (estática) --- */
  DECOR = { trees: [], bubbles: [], stars: [], coins: [], free: [] };
  const used = [];   // posiciones ocupadas
  const okPos = (px, py, m) => !nearRoad(px, py, m || 85) && !used.some(u => Math.hypot(u[0] - px, u[1] - py) < (u[2] || 70)) && Object.keys(ISL).some(k => inIsland(px, py, ISL[k], 52));
  const place = (e, k, n, drawFn, rad, skipFirst) => {
    const ox = e.x < ISL.pueblo.x ? -1 : 1, oy = e.y < ISL.pueblo.y ? -1 : 1;
    let cnt = 0;
    for (const [a, b] of POOL) {
      if (cnt >= n) break;
      const px = e.x + a * ox, py = e.y + b * oy;
      if (!okPos(px, py, 90)) continue;
      drawFn(px, py, cnt); used.push([px, py, rad || 80]); cnt++;
    }
  };
  // pueblo: casitas
  const wallCols = ['#f1dfb5', '#e8c9a0', '#d9e3c0', '#f0d0c0'], roofCols = ['#c4513a', '#4f7fae', '#7a9a45', '#a46a3a'];
  const homes = [[950, 760], [1450, 760], [1120, 572], [1280, 572], [1075, 940], [1325, 940], [1000, 880], [1400, 880]];
  let hi = 0;
  for (const [hx, hy] of homes) {
    if (nearRoad(hx, hy, 78) || !inIsland(hx, hy, ISL.pueblo, 46)) continue;
    if (Math.hypot(hx - 1200, hy - 640) < 85 || Math.hypot(hx - 1200, hy - 925) < 105) continue;
    drawHouse(x, hx, hy, 1.05, wallCols[hi % 4], roofCols[hi % 4]); used.push([hx, hy, 80]); hi++;
  }
  used.push([1200, 640, 110], [1200, 915, 130], [1200, 750, 130]);
  // Piel: bañeras
  place(ISL.piel, 'piel', 4, (px, py, i) => drawBath(x, px, py, .95 + (i % 2) * .15), 85);
  // Sueño: luna y estrellas fijas
  { const e = ISL.suenio; drawMoon(x, e.x + 150, e.y - 120, 52); used.push([e.x + 150, e.y - 120, 90]);
    place(e, 'suenio', 3, (px, py, i) => { B(x, px, py, 40, 17, '#d9d2f0', { wob: .8, lw: 3.5 }); B(x, px - 4, py - 12, 30, 15, '#fff6df', { wob: .8, lw: 3.5, shade: false }); x.fillStyle = A.ink; x.fillRect(px - 5, py - 18, 3, 3); }, 80); }
  // Plata: puestos
  place(ISL.plata, 'plata', 4, (px, py, i) => drawStall(x, px, py, .95), 85);
  // Cuerpo: gimnasio y sillones
  { const e = ISL.cuerpo, ox = 1, oy = 1; const gx = e.x + 190, gy = e.y + 40; if (okPos(gx, gy, 80)) { drawGym(x, gx, gy, 1.15); used.push([gx, gy, 110]); }
    const cols = ['#4f7fae', '#b04a3a', '#6a9a5a']; place(e, 'cuerpo', 3, (px, py, i) => drawSofa(x, px, py, .95, cols[i % 3]), 85); }
  // árboles dinámicos (y-ordenados)
  for (const k in ISL) {
    const e = ISL[k], want = k === 'pueblo' ? 16 : 9; let tries = 0, got = 0;
    while (got < want && tries++ < 400) {
      const a = r() * TAU, rad = .35 + r() * .55, px = e.x + Math.cos(a) * (e.rx - 40) * rad, py = e.y + Math.sin(a) * (e.ry - 40) * rad;
      if (!okPos(px, py, 70)) continue;
      if (DECOR.trees.some(t2 => Math.hypot(t2.x - px, t2.y - py) < 70)) continue;
      DECOR.trees.push({ x: px, y: py, s: .85 + r() * .4, k, ph: r() * 6 }); got++;
    }
  }
  // animados
  for (let i = 0; i < 18; i++) { const a = r() * TAU, rad = Math.sqrt(r()) * .75; DECOR.bubbles.push({ x: ISL.piel.x + Math.cos(a) * ISL.piel.rx * rad, y: ISL.piel.y + Math.sin(a) * ISL.piel.ry * rad, ph: r() * 10, s: 5 + r() * 8 }); }
  for (let i = 0; i < 26; i++) { const a = r() * TAU, rad = Math.sqrt(r()) * .8; DECOR.stars.push({ x: ISL.suenio.x + Math.cos(a) * ISL.suenio.rx * rad, y: ISL.suenio.y + Math.sin(a) * ISL.suenio.ry * rad, ph: r() * 10, s: 5 + r() * 7 }); }
  for (let i = 0; i < 14; i++) { const a = r() * TAU, rad = Math.sqrt(r()) * .8; DECOR.coins.push({ x: ISL.plata.x + Math.cos(a) * ISL.plata.rx * rad, y: ISL.plata.y + Math.sin(a) * ISL.plata.ry * rad, ph: r() * 10 }); }
  // olitas del mar (solo sobre agua)
  DECOR.waves = [];
  let tries = 0;
  while (DECOR.waves.length < 170 && tries++ < 3000) {
    const px = r() * WW, py = r() * WH;
    if (Object.keys(ISL).some(k => inIsland(px, py, { x: ISL[k].x, y: ISL[k].y, rx: ISL[k].rx + 60, ry: ISL[k].ry + 60 }, 0)) || nearRoad(px, py, 80)) continue;
    DECOR.waves.push({ x: px, y: py, ph: r() * 10, w: 16 + r() * 18 });
  }
  DECOR.clouds = [];
  for (let i = 0; i < 7; i++) DECOR.clouds.push({ x: r() * WW, y: 100 + r() * (WH - 200), s: .9 + r() * .9, v: 14 + r() * 18 });
  return c;
}

/* ---------- nodos del mapa ---------- */
function buildNodes() {
  const nodes = [];
  for (const id of bossList()) {
    const isl = BOSS_ISLAND[id]; if (!isl) continue;
    const def = MG.bosses[id], sc = MG.data.bossScale(id);
    nodes.push({ type: 'boss', id, def, x: ISL[isl].x, y: ISL[isl].y, label: def.nombre || id, scale: sc, color: def.color || A.red, ph: nodes.length * 1.3 });
  }
  nodes.push({ type: 'shop', x: 1200, y: 925, label: 'TIENDA', color: A.gold, ph: 2 });
  nodes.push({ type: 'town', x: 1200, y: 640, label: 'EL PUEBLO', color: A.blue, ph: 4 });
  return nodes;
}
function drawNode(ctx, n, t, near) {
  const x = n.x, y = n.y, pul = near ? 1 + Math.sin(t * 8) * .06 : 1;
  if (n.type === 'shop') {
    // casita con toldo
    B(ctx, x + 6, y - 20, 70, 14, 'rgba(30,20,10,.3)', { line: false, shade: false, points: 12 });
    ctx.save(); ctx.translate(x, y - 20); ctx.lineJoin = 'round'; ctx.strokeStyle = A.ink; ctx.lineWidth = 5;
    ctx.fillStyle = '#d9a46a'; rr(ctx, -62, -76, 124, 82, 6); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#6b4020'; rr(ctx, -14, -38, 28, 44, 4); ctx.fill(); ctx.lineWidth = 4; ctx.stroke();
    ctx.fillStyle = '#bfe3ee'; rr(ctx, 26, -58, 24, 24, 3); ctx.fill(); ctx.stroke(); rr(ctx, -50, -58, 24, 24, 3); ctx.fill(); ctx.stroke();
    for (let i = 0; i < 7; i++) {
      ctx.fillStyle = i % 2 ? A.cream : A.red;
      const x0 = -76 + i * 21.7; ctx.beginPath(); ctx.moveTo(x0, -112); ctx.lineTo(x0 + 21.7, -112); ctx.lineTo(x0 + 21.7, -80 + Math.sin(t * 2 + i) * 1.5); ctx.arc(x0 + 10.85, -80, 10.85, 0, Math.PI); ctx.lineTo(x0, -112); ctx.fill();
    }
    ctx.lineWidth = 5; ctx.strokeRect(-76, -112, 152, 32);
    ctx.restore();
    ctx.save(); ctx.translate(x, y - 150 + Math.sin(t * 3) * 3); ctx.scale(pul, pul);
    B(ctx, 0, 0, 44, 26, A.cream, { wob: .8, lw: 4, shade: false });
    A.text(ctx, '$', 0, 2, 34, { fill: A.red, lw: 5, font: 'ui' }); ctx.restore();
    // letrero del suelo
    txt(ctx, 'EL BAZAR', x, y + 14, 22, { lw: 5 });
    return;
  }
  if (n.type === 'town') {
    B(ctx, x, y, 66, 20, 'rgba(30,20,10,.3)', { line: false, shade: false, points: 12 });
    ctx.save(); ctx.translate(x, y); ctx.strokeStyle = A.ink; ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-34, 0); ctx.lineTo(-34, -86); ctx.moveTo(34, 0); ctx.lineTo(34, -86); ctx.stroke();
    ctx.strokeStyle = '#8a5a32'; ctx.lineWidth = 3; ctx.stroke();
    ctx.translate(0, -100 + Math.sin(t * 2) * 2); ctx.scale(pul, pul);
    B(ctx, 0, 0, 78, 30, '#c9935a', { wob: .8, lw: 4.5, shade: false });
    A.text(ctx, 'EL PUEBLO', 0, 2, 30, { font: 'ui', lw: 6 });
    // insignia con los encargos de hoy (tus hábitos marcados / activos)
    const e = M && M.enc;
    if (e && e.total) {
      const done = e.hechos >= e.total;
      ctx.translate(86, -26 + Math.sin(t * 3 + 1) * 2);
      B(ctx, 0, 0, 34, 24, done ? '#8fd16a' : A.cream, { wob: .6, lw: 4, shade: false });
      ink(ctx, e.hechos + '/' + e.total, 0, -2, 22);
      ink(ctx, 'HOY', 0, 16, 12, { fill: '#6b4a2a' });
    }
    ctx.restore();
    return;
  }
  // jefe: plataforma + mástil + medallón con ícono
  const won = MG.data.store().wins[n.id] && MG.data.store().wins[n.id].wins > 0;
  B(ctx, x, y + 4, 76, 30, 'rgba(30,20,10,.3)', { line: false, shade: false, points: 14 });
  B(ctx, x, y, 62, 24, '#d9c59a', { wob: 1, lw: 4.5, shade: false });
  B(ctx, x, y - 2, 46, 16, '#b8a276', { wob: .8, lw: 3, shade: false });
  ctx.save(); ctx.translate(x, y - 4); ctx.lineCap = 'round';
  ctx.strokeStyle = A.ink; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -118); ctx.stroke();
  ctx.strokeStyle = '#a0723e'; ctx.lineWidth = 4; ctx.stroke();
  // banderín ondeando
  ctx.fillStyle = n.color; ctx.strokeStyle = A.ink; ctx.lineWidth = 4; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(2, -112);
  for (let i = 0; i <= 8; i++) ctx.lineTo(2 + i * 8, -112 + Math.sin(t * 5 + i * .6 + n.ph) * 5 + i * 1.2);
  ctx.lineTo(70, -84); for (let i = 8; i >= 0; i--) ctx.lineTo(2 + i * 8, -88 + Math.sin(t * 5 + i * .6 + n.ph) * 5 + i * 1.2 - 4 + (i > 6 ? 2 : 0));
  ctx.closePath(); ctx.fill(); ctx.stroke();
  // medallón
  ctx.translate(0, -172 + Math.sin(t * 3 + n.ph) * 4); ctx.scale(pul, pul);
  B(ctx, 0, 0, 56, 56, A.cream, { wob: .8, lw: 5, shade: false });
  ctx.fillStyle = n.color; ctx.globalAlpha = .55; ctx.beginPath(); ctx.arc(0, 0, 46, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
  try { if (n.def.mapIcon) n.def.mapIcon(ctx, 0, 0, 1, t); } catch (e) {}
  ctx.restore();
  if (won) A.star(ctx, x + 56, y - 205, 20, A.gold, Math.sin(t * 2) * .2);
  txt(ctx, String(n.label).toUpperCase(), x, y + 34, 24, { lw: 6 });
}

// encargos de hoy: hábitos marcados hoy / hábitos activos (sin los graduados)
function encargosHoy() {
  try {
    const J = window.MODO_JUEGO; if (!J || !J.motor || typeof state === 'undefined' || !state) return null;
    const R = J.motor(), gr = R.graduados || {}, hs = (state.habits || []).filter(h => !gr[h.id]);
    const d = new Date(), k = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    const ids = (R.porDia && R.porDia[k]) || [];
    return { hechos: ids.filter(id => !gr[id]).length, total: hs.length };
  } catch (e) { return null; }
}
function softCloud(ctx, x, y, s) {
  ctx.fillStyle = '#fff8ea';
  for (const [dx, dy, r] of [[-1, .2, .7], [0, -.25, 1], [1, .15, .75], [.45, .4, .6], [-.45, .45, .6]]) { ctx.beginPath(); ctx.ellipse(x + dx * s * 60, y + dy * s * 50, r * s * 55, r * s * 42, 0, 0, TAU); ctx.fill(); }
}
MG.scene('map', {
  enter() {
    common();
    if (!WORLD) WORLD = buildWorld();
    const st = MG.data.store(), nodes = buildNodes();
    let sx = st.map && st.map.x, sy = st.map && st.map.y;
    if (sx == null || sy == null || !isLand(sx, sy)) { sx = 1090; sy = 780; }
    M = { t: 0, x: sx, y: sy, face: 1, walk: 0, camX: 0, camY: 0, nodes, near: null, cardK: 0, path: [], target: null, menu: null, open: false,
      ps: MG.data.player(), baros: MG.data.baros(), leaving: false, hint: 9, clicked: false, enc: encargosHoy() };
    M.camX = clamp(sx - W / 2, 0, WW - W); M.camY = clamp(sy - H / 2 - 40, 0, WH - H);
    MG.pointer = null;
    music('map');
  },
  exit() {
    if (!M) return;
    try { const st = MG.data.store(); st.map = { x: Math.round(M.x), y: Math.round(M.y) }; MG.data.persist(); } catch (e) {}
    M = null;
  },
  update(dt) {
    if (!M || M.leaving) return;
    M.t += dt; M.hint = Math.max(0, M.hint - dt);
    if (Math.floor(M.t * 4) !== Math.floor((M.t - dt) * 4)) M.baros = MG.data.baros();
    if (Math.floor(M.t) !== Math.floor(M.t - dt)) M.enc = encargosHoy();
    const p = click();
    // --- menú de pausa del mapa ---
    if (M.menu) {
      const items = ['CONTINUAR', 'SALIR DEL JUEGO'];
      if (I.pressed('up') || I.pressed('down')) { M.menu.sel = 1 - M.menu.sel; snd('tick'); }
      let act = false;
      if (p) {
        for (let i = 0; i < 2; i++) if (inR(p, W / 2 - 230, H / 2 - 20 + i * 76, 460, 64)) { M.menu.sel = i; act = true; }
        if (!act && !inR(p, W / 2 - 270, H / 2 - 120, 540, 330)) { M.menu = null; return; }
      } else if (I.ok()) act = true;
      if (I.pressed('pause') || I.pressed('back')) { M.menu = null; return; }
      if (act) { snd('select'); if (M.menu.sel === 0) M.menu = null; else { M.leaving = true; MG.close(); } }
      return;
    }
    if (I.pressed('pause')) { M.menu = { sel: 0 }; snd('tick'); return; }
    if (I.pressed('back')) { M.menu = { sel: 1 }; snd('tick'); return; }      // Retroceso pregunta antes de salir
    if (I.pressed('shoot') || I.pressed('ex')) { M.open = !M.open; snd('tick'); }
    let used = false;
    if (p) {
      if (inR(p, 14, 10, 380, M.open ? 270 : 118)) { M.open = !M.open; snd('tick'); used = true; }
      else if (inR(p, W - 400, 16, 168, 52)) { snd('select'); M.leaving = true; MG.close(); return; }
      else if (M.near && M.cardK > .8 && inR(p, W / 2 - 300, H - 272, 600, 252)) { activate(M.near); return; }
      else {
        used = true;
        const wx = p.x + M.camX, wy = p.y + M.camY;
        let tx = wx, ty = wy;
        if (!isLand(tx, ty)) {       // buscar tierra más cercana en el entorno del toque
          let best = null, bd = 1e9;
          for (let a = 0; a < 24; a++) for (let rr2 = 30; rr2 <= 260; rr2 += 30) {
            const cx = wx + Math.cos(a / 24 * TAU) * rr2, cy = wy + Math.sin(a / 24 * TAU) * rr2;
            if (isLand(cx, cy) && rr2 < bd) { bd = rr2; best = [cx, cy]; }
          }
          if (best) { tx = best[0]; ty = best[1]; } else tx = ty = null;
        }
        if (tx != null) { M.path = findPath(M.x, M.y, tx, ty); M.target = { x: tx, y: ty, t: 0 }; }
      }
    }
    // --- movimiento ---
    let dx = (I.is('right') ? 1 : 0) - (I.is('left') ? 1 : 0), dy = (I.is('down') ? 1 : 0) - (I.is('up') ? 1 : 0);
    if (dx || dy) { M.path = []; M.target = null; const l = Math.hypot(dx, dy); dx /= l; dy /= l; }
    else if (M.path.length) {
      const w = M.path[0], d = Math.hypot(w.x - M.x, w.y - M.y);
      if (d < 10) { M.path.shift(); if (!M.path.length) M.target = null; } else { dx = (w.x - M.x) / d; dy = (w.y - M.y) / d; }
    }
    const moving = !!(dx || dy), spd = 300;
    if (moving) {
      const nx = M.x + dx * spd * dt, ny = M.y + dy * spd * dt;
      if (isLand(nx, ny)) { M.x = nx; M.y = ny; }
      else if (isLand(nx, M.y)) { M.x = nx; }
      else if (isLand(M.x, ny)) { M.y = ny; }
      else if (M.path.length) { M.path = []; M.target = null; }
      if (Math.abs(dx) > .15) M.face = dx > 0 ? 1 : -1;
    }
    M.walk = lerp(M.walk, moving ? 1 : 0, .25);
    if (M.target) M.target.t += dt;
    // cámara
    M.camX = lerp(M.camX, clamp(M.x - W / 2, 0, WW - W), .1);
    M.camY = lerp(M.camY, clamp(M.y - H / 2 - 30, 0, WH - H), .1);
    // nodo cercano
    let near = null, bd = 82;
    for (const n of M.nodes) { const d = Math.hypot(n.x - M.x, n.y - (M.y)); if (d < bd) { bd = d; near = n; } }
    if (near !== M.near && near) snd('tick');
    M.near = near;
    M.cardK = lerp(M.cardK, near ? 1 : 0, .2);
    if (!used && near && I.ok() && !p) activate(near);
  },
  draw(ctx) {
    if (!M) return;
    const t = M.t, cx = Math.round(M.camX), cy = Math.round(M.camY);
    ctx.drawImage(WORLD, cx, cy, W, H, 0, 0, W, H);
    ctx.save(); ctx.translate(-cx, -cy);
    const vis = (x, y, m) => x > cx - m && x < cx + W + m && y > cy - m && y < cy + H + m;
    // olitas y espuma
    ctx.lineCap = 'round';
    for (const w of DECOR.waves) {
      if (!vis(w.x, w.y, 40)) continue;
      const k = (Math.sin(t * 1.4 + w.ph) + 1) / 2;
      ctx.strokeStyle = `rgba(255,255,255,${.25 + k * .35})`; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(w.x - w.w, w.y); ctx.quadraticCurveTo(w.x - w.w / 2, w.y - 7 - k * 3, w.x, w.y); ctx.quadraticCurveTo(w.x + w.w / 2, w.y + 7 + k * 3, w.x + w.w, w.y); ctx.stroke();
    }
    for (const k in ISL) {
      const e = ISL[k]; if (!vis(e.x, e.y, 500)) continue;
      const pr = Math.sin(t * 1.2 + e.x) * 9;
      ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.ellipse(e.x, e.y, e.rx + 34 + pr, e.ry + 34 + pr, 0, 0, TAU); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,.2)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(e.x, e.y, e.rx + 58 - pr, e.ry + 58 - pr, 0, 0, TAU); ctx.stroke();
    }
    // animaciones temáticas
    for (const b of DECOR.bubbles) {
      if (!vis(b.x, b.y, 80)) continue;
      const u = ((t * 14 + b.ph * 17) % 120) / 120;
      ctx.strokeStyle = `rgba(255,255,255,${.85 * (1 - u)})`; ctx.fillStyle = `rgba(190,230,255,${.3 * (1 - u)})`; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(b.x + Math.sin(t * 2 + b.ph) * 8, b.y - u * 90, b.s * (.6 + u * .5), 0, TAU); ctx.fill(); ctx.stroke();
    }
    for (const s of DECOR.stars) {
      if (!vis(s.x, s.y, 40)) continue;
      const k = (Math.sin(t * 3 + s.ph) + 1) / 2; ctx.save(); ctx.globalAlpha = .35 + k * .65; A.star(ctx, s.x, s.y, s.s * (.7 + k * .5), '#f7e9a8', t + s.ph); ctx.restore();
    }
    for (const c2 of DECOR.coins) { if (vis(c2.x, c2.y, 40)) coin(ctx, c2.x, c2.y - Math.abs(Math.sin(t * 2 + c2.ph)) * 10, 11, t * 3 + c2.ph); }
    // sombras de nubes
    for (const c2 of DECOR.clouds) {
      c2.x += c2.v * (1 / 60); if (c2.x > WW + 200) c2.x = -200;
      if (vis(c2.x + 70, c2.y + 110, 260)) { ctx.fillStyle = 'rgba(20,40,50,.11)'; ctx.beginPath(); ctx.ellipse(c2.x + 70, c2.y + 120, 110 * c2.s, 48 * c2.s, 0, 0, TAU); ctx.fill(); }
    }
    // objetos ordenados por y
    const list = [];
    for (const tr of DECOR.trees) if (vis(tr.x, tr.y, 90)) list.push({ y: tr.y, f: () => drawTree(ctx, tr.x, tr.y, tr.s, THEME[tr.k].trees, THEME[tr.k].trunk, Math.sin(t * 1.5 + tr.ph) * 2) });
    for (const n of M.nodes) if (vis(n.x, n.y, 220)) list.push({ y: n.y, f: () => drawNode(ctx, n, t, n === M.near) });
    list.push({ y: M.y, f: () => {
      if (M.target && !M.leaving) {
        const k = M.target.t; ctx.save(); ctx.strokeStyle = A.red; ctx.lineWidth = 5; ctx.globalAlpha = clamp(1.4 - k * .25, .3, 1);
        const r2 = 16 + Math.sin(k * 8) * 3; ctx.beginPath(); ctx.moveTo(M.target.x - r2, M.target.y - r2); ctx.lineTo(M.target.x + r2, M.target.y + r2); ctx.moveTo(M.target.x + r2, M.target.y - r2); ctx.lineTo(M.target.x - r2, M.target.y + r2); ctx.stroke(); ctx.restore();
      }
      drawMilo(ctx, M.x, M.y, 1, { t, facing: M.face, walk: M.walk });
    } });
    list.sort((a, b) => a.y - b.y);
    for (const o of list) o.f();
    // nubes
    ctx.save(); ctx.globalAlpha = .4;
    for (const c2 of DECOR.clouds) if (vis(c2.x, c2.y, 220)) softCloud(ctx, c2.x, c2.y, c2.s);
    ctx.restore();
    ctx.restore();
  },
  drawUI(ctx) {
    if (!M) return;
    const t = M.t, ps = M.ps;
    // ficha de Milo
    let fh = 108, rzL = null;
    if (M.open) {      // la ficha crece lo que pidan las razones (ahora hay una más: el disparo)
      rzL = ps.razones.map(rz => wrapText(ctx, rz, 20, 346));
      fh = Math.max(262, 126 + rzL.reduce((a, l) => a + l.length * 24 + 6, 0) + 4);
    }
    panel(ctx, 14, 10, 380, fh, A.paper, 16);
    B(ctx, 56, 56, 28, 31, A.milo, { wob: .8, lw: 3.5 });
    ctx.fillStyle = A.ink; ctx.beginPath(); ctx.ellipse(49, 52, 3.5, 5, 0, 0, TAU); ctx.ellipse(63, 52, 3.5, 5, 0, 0, TAU); ctx.fill();
    ink(ctx, 'MILO · NIVEL ' + ps.nivel, 96, 34, 27, { align: 'left' });
    coin(ctx, 108, 66, 12, 0); ink(ctx, String(M.baros), 128, 67, 28, { align: 'left' });
    heart(ctx, 232, 66, 11, A.red); ink(ctx, '×' + ps.maxHp + ' en la pelea', 250, 67, 21, { align: 'left' });
    ink(ctx, M.open ? '▲ ocultar' : (isTouch() ? '▼ toca: ¿por qué esa vida?' : '▼ X: ¿por qué esa vida?'), 204, 95, 18, { fill: '#6b4a2a' });
    if (M.open) {
      let yy = 126;
      rzL.forEach(lines => { for (const ln of lines) { ink(ctx, ln, 30, yy, 20, { align: 'left' }); yy += 24; } yy += 6; });
    }
    // SALIR
    button(ctx, 'SALIR', W - 400, 16, 168, 52, false);
    // pista
    if (M.hint > 0 && !M.near && !M.menu) {
      ctx.save(); ctx.globalAlpha = clamp(M.hint, 0, 1);
      txt(ctx, isTouch() ? 'Toca el mapa para caminar · acércate a una bandera' : 'Flechas / WASD para caminar · acércate a una bandera', W / 2, H - 34, 26, { lw: 6 });
      ctx.restore();
    }
    // cartel de cine del nodo cercano
    if (M.near && M.cardK > .02) {
      const n = M.near, k = ease.outCubic(clamp(M.cardK, 0, 1)), bx = W / 2 - 300, by = H - 272 + (1 - k) * 300;
      ctx.save();
      panel(ctx, bx, by, 600, 252, '#f6ead0', 18);
      ctx.lineWidth = 2.5; ctx.strokeStyle = '#a07a3a'; rr(ctx, bx + 10, by + 10, 580, 232, 12); ctx.stroke();
      const go = isTouch() ? 'TOCA AQUÍ para ' : 'SALTO para ';
      if (n.type === 'boss') {
        const wn = MG.data.store().wins[n.id], d = n.scale.difficulty, ns = diffStars(d);
        A.text(ctx, String(n.def.nombre || n.id).toUpperCase(), bx + 300, by + 40, 44, { fill: A.gold, lw: 10 });
        ink(ctx, 'Área: ' + (n.def.area || '—'), bx + 300, by + 80, 24, { fill: '#6b4a2a' });
        ink(ctx, 'DIFICULTAD', bx + 40, by + 118, 22, { align: 'left' });
        for (let i = 0; i < 5; i++) skull(ctx, bx + 196 + i * 40, by + 116, 15, i < ns);
        ink(ctx, diffName(ns) + '  ×' + d.toFixed(2), bx + 418, by + 118, 22, { align: 'left' });
        const rz = wrapText(ctx, n.scale.razon || '', 20, 540);
        rz.slice(0, 2).forEach((ln, i) => ink(ctx, ln, bx + 300, by + 152 + i * 23, 20, { fill: '#4a3a2a' }));
        const rec = wn && wn.wins > 0 ? `Mejor nota ${wn.best || '—'} · ${wn.bestTime != null ? fmtTime(wn.bestTime) : '--:--'} · ${wn.wins} victoria${wn.wins > 1 ? 's' : ''}` : (wn && wn.tries ? `Aún sin victoria · ${wn.tries} intento${wn.tries > 1 ? 's' : ''}` : 'Aún sin victoria. ¡Estrena el ring!');
        ink(ctx, rec, bx + 300, by + 205 - 0, 21, { fill: '#2f6d2f' });
        if (Math.floor(t * 2.2) % 2 === 0) txt(ctx, go + 'PELEAR', bx + 300, by + 233, 26, { fill: A.red, lw: 6 });
      } else if (n.type === 'shop') {
        A.text(ctx, 'EL BAZAR DE LA TÍA TORTUGA', bx + 300, by + 44, 28, { fill: A.gold, lw: 9 });
        ink(ctx, 'Amuletos, ataques y ropa para Milo.', bx + 300, by + 100, 24);
        ink(ctx, 'Tienes ' + M.baros + ' baros.', bx + 300, by + 134, 26, { fill: '#2f6d2f' });
        ink(ctx, 'Todo se paga con baros de tus hábitos reales.', bx + 300, by + 172, 20, { fill: '#4a3a2a' });
        if (Math.floor(t * 2.2) % 2 === 0) txt(ctx, go + 'ENTRAR', bx + 300, by + 226, 26, { fill: A.red, lw: 6 });
      } else {
        A.text(ctx, 'EL PUEBLO', bx + 300, by + 44, 40, { fill: A.gold, lw: 10 });
        ink(ctx, 'Los encargos de Milo: tus hábitos de hoy', bx + 300, by + 100, 26);
        ink(ctx, 'Tiendita de permisos, golpes, crónica y mochila', bx + 300, by + 136, 22, { fill: '#4a3a2a' });
        ink(ctx, 'Vuelves al mapa con el botón MAPA del pueblo.', bx + 300, by + 172, 20, { fill: '#6b4a2a' });
        if (Math.floor(t * 2.2) % 2 === 0) txt(ctx, go + 'IR AL PUEBLO', bx + 300, by + 226, 26, { fill: A.red, lw: 6 });
      }
      ctx.restore();
    }
    // menú de pausa
    if (M.menu) {
      ctx.save(); ctx.fillStyle = 'rgba(20,10,0,.55)'; ctx.fillRect(0, 0, W, H); ctx.restore();
      panel(ctx, W / 2 - 270, H / 2 - 120, 540, 330, A.paper, 20);
      A.text(ctx, 'PAUSA', W / 2, H / 2 - 66, 56, { fill: A.red });
      ['CONTINUAR', 'SALIR DEL JUEGO'].forEach((o, i) => button(ctx, (M.menu.sel === i ? '► ' : '') + o, W / 2 - 230, H / 2 - 20 + i * 76, 460, 64, M.menu.sel === i));
    }
  }
});
function activate(n) {
  if (!M || M.leaving) return;
  M.leaving = true; snd('select');
  if (n.type === 'boss') MG.go('fight', { bossId: n.id });
  else if (n.type === 'shop') MG.go('shop');
  else {
    // al pueblo: la música no se corta (el pueblo hace el fundido a su tema) y desde ahí se vuelve al mapa
    if (window.MODO_JUEGO) { MG.close({ keepMusic: true, toTown: true }); MODO_JUEGO.entrar({ desdeJuego: true }); }
    else { M.leaving = false; snd('tick'); }
  }
}

/* ============================ 3) TIENDA ============================ */
const SHOP_EXIT = { x: W - 196, y: 16, w: 168, h: 52 };   // a la derecha del letrero, sin taparlo
let SH = null, SHBG = null;
const JAR_X = [410, 630, 850, 1070], JAR_BASE = 308;
const TORT = { x: 178, y: 500 };
function buildShopBg() {
  const c = mk(W, H), x = c.getContext('2d'), r = rng(5);
  x.fillStyle = '#b3774a'; x.fillRect(0, 0, W, H);
  for (let i = 0; i < 22; i++) {
    const px = i * 60;
    x.fillStyle = i % 2 ? 'rgba(90,50,20,.12)' : 'rgba(255,220,160,.08)'; x.fillRect(px, 0, 60, 520);
    x.strokeStyle = 'rgba(50,25,8,.5)'; x.lineWidth = 3; x.beginPath(); x.moveTo(px, 0); x.lineTo(px, 520); x.stroke();
    for (let k = 0; k < 3; k++) { x.strokeStyle = 'rgba(60,30,10,.18)'; x.lineWidth = 1.5; x.beginPath(); const ly = r() * 500, lx = px + 8 + r() * 40; x.moveTo(lx, ly); x.lineTo(lx + 2, ly + 40 + r() * 60); x.stroke(); }
  }
  // ventana con el mar
  x.fillStyle = A.ink; rr(x, 34, 56, 216, 190, 8); x.fill();
  const g = x.createLinearGradient(0, 66, 0, 236); g.addColorStop(0, '#f6d9a0'); g.addColorStop(.55, '#f1c07c'); g.addColorStop(.56, '#6aa9a8'); g.addColorStop(1, '#4f8e98');
  x.fillStyle = g; x.fillRect(46, 68, 192, 166);
  x.fillStyle = '#fff2bd'; x.beginPath(); x.arc(170, 130, 22, 0, TAU); x.fill();
  x.strokeStyle = 'rgba(255,255,255,.7)'; x.lineWidth = 3; for (let i = 0; i < 4; i++) { x.beginPath(); x.moveTo(70 + i * 40, 190 + (i % 2) * 14); x.quadraticCurveTo(82 + i * 40, 184 + (i % 2) * 14, 94 + i * 40, 190 + (i % 2) * 14); x.stroke(); }
  x.strokeStyle = A.ink; x.lineWidth = 7; x.beginPath(); x.moveTo(142, 66); x.lineTo(142, 236); x.moveTo(46, 150); x.lineTo(238, 150); x.stroke();
  x.strokeStyle = '#7a4a24'; x.lineWidth = 3; x.stroke();
  x.fillStyle = '#7a4a24'; x.strokeStyle = A.ink; x.lineWidth = 4; rr(x, 22, 240, 240, 16, 4); x.fill(); x.stroke();
  // repisa
  x.fillStyle = '#7a4a24'; x.strokeStyle = A.ink; x.lineWidth = 5;
  rr(x, 300, JAR_BASE, 920, 20, 4); x.fill(); x.stroke();
  x.fillStyle = 'rgba(0,0,0,.18)'; x.fillRect(306, JAR_BASE + 22, 908, 10);
  for (const sx of [330, 1190]) { x.fillStyle = '#5a3418'; x.beginPath(); x.moveTo(sx - 10, JAR_BASE + 20); x.lineTo(sx + 10, JAR_BASE + 20); x.lineTo(sx, JAR_BASE + 56); x.closePath(); x.fill(); x.stroke(); }
  // mostrador
  const cg = x.createLinearGradient(0, 500, 0, H); cg.addColorStop(0, '#8a5530'); cg.addColorStop(1, '#5e3519');
  x.fillStyle = cg; x.fillRect(0, 508, W, H - 508);
  for (let i = 0; i < 12; i++) { x.strokeStyle = 'rgba(30,12,2,.45)'; x.lineWidth = 3; x.beginPath(); x.moveTo(i * 110, 530); x.lineTo(i * 110, H); x.stroke(); }
  x.fillStyle = '#a3693c'; x.fillRect(0, 490, W, 26); x.strokeStyle = A.ink; x.lineWidth = 5; x.beginPath(); x.moveTo(0, 490); x.lineTo(W, 490); x.moveTo(0, 516); x.lineTo(W, 516); x.stroke();
  x.fillStyle = 'rgba(255,230,180,.25)'; x.fillRect(0, 492, W, 6);
  return c;
}
function drawTortuga(ctx, x, y, t, talk) {
  const sway = Math.sin(t * 1.3) * 2, mouth = talk ? Math.abs(Math.sin(t * 14)) : 0;
  ctx.save(); ctx.translate(x, y);
  // caparazón detrás
  B(ctx, 0, -92 + sway * .3, 92, 84, '#6f8a47', { wob: 1.2, lw: 5, seed: 2 });
  ctx.strokeStyle = 'rgba(30,45,15,.55)'; ctx.lineWidth = 3.5;
  for (const [hx, hy] of [[-48, -108], [0, -138], [48, -108], [-26, -66], [26, -66]]) { ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + .5; ctx[i ? 'lineTo' : 'moveTo'](hx + Math.cos(a) * 24, hy + Math.sin(a) * 21); } ctx.closePath(); ctx.stroke(); }
  // chal
  B(ctx, 0, -14, 108, 52, '#b4546e', { wob: 1.4, lw: 5, seed: 4 });
  ctx.strokeStyle = '#e8b6c4'; ctx.lineWidth = 3.5; ctx.setLineDash([10, 9]);
  ctx.beginPath(); ctx.moveTo(-88, -30); ctx.quadraticCurveTo(0, -4, 88, -30); ctx.stroke(); ctx.setLineDash([]);
  ctx.strokeStyle = '#f3dba0'; ctx.lineWidth = 3;
  for (let i = -10; i <= 10; i++) { const fx = i * 9; ctx.beginPath(); ctx.moveTo(fx, 22 - Math.abs(i) * .6); ctx.lineTo(fx + Math.sin(t * 2 + i) * 1.5, 34 - Math.abs(i) * .6); ctx.stroke(); }
  // cuello y cabeza
  B(ctx, 0, -64 + sway, 27, 34, '#9ab36a', { wob: .8, lw: 4.5, shade: false });
  B(ctx, 0, -112 + sway, 50, 43, '#a9c47a', { wob: 1, lw: 5, seed: 6 });
  // arrugas
  ctx.strokeStyle = 'rgba(50,70,20,.45)'; ctx.lineWidth = 2.5;
  for (const sx of [-1, 1]) { ctx.beginPath(); ctx.arc(sx * 36, -100 + sway, 11, sx > 0 ? 2.1 : -.9, sx > 0 ? 3.7 : .7); ctx.stroke(); }
  // moño de abuela
  B(ctx, 0, -158 + sway, 16, 11, '#efe9e0', { wob: .8, lw: 3.5, shade: false, points: 12 });
  B(ctx, 0, -152 + sway, 9, 7, '#d8d0c6', { wob: .5, lw: 2.5, shade: false, points: 10 });
  // pico
  ctx.fillStyle = '#c9b673'; ctx.strokeStyle = A.ink; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.ellipse(0, -90 + sway, 20, 11 + mouth * 5, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = A.ink; ctx.beginPath(); ctx.ellipse(-6, -96 + sway, 2.4, 2.8, 0, 0, TAU); ctx.ellipse(6, -96 + sway, 2.4, 2.8, 0, 0, TAU); ctx.fill();
  if (mouth > .15) { ctx.fillStyle = '#7a2a2a'; ctx.beginPath(); ctx.ellipse(0, -87 + sway + mouth * 2, 12, mouth * 5, 0, 0, TAU); ctx.fill(); }
  // anteojos
  const lookX = Math.sin(t * .8) * 2;
  for (const sx of [-1, 1]) {
    const ex = sx * 22, ey = -122 + sway;
    ctx.fillStyle = 'rgba(235,250,255,.95)'; ctx.strokeStyle = A.ink; ctx.lineWidth = 4.5;
    ctx.beginPath(); ctx.arc(ex, ey, 17, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = A.ink; ctx.beginPath(); ctx.arc(ex + lookX, ey + 1, 5.5, 0, TAU); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ex + lookX + 2, ey - 2, 1.8, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#efe9e0'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(ex - 12, ey - 24); ctx.quadraticCurveTo(ex, ey - 30, ex + 12, ey - 22); ctx.stroke();
  }
  ctx.strokeStyle = A.ink; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-6, -122 + sway); ctx.lineTo(6, -122 + sway); ctx.moveTo(-39, -124 + sway); ctx.lineTo(-48, -128 + sway); ctx.moveTo(39, -124 + sway); ctx.lineTo(48, -128 + sway); ctx.stroke();
  ctx.restore();
  // manos sobre el mostrador + ovillo de lana
  B(ctx, x - 62, y - 2, 21, 13, '#9ab36a', { wob: .8, lw: 4, shade: false });
  B(ctx, x + 62, y - 2, 21, 13, '#9ab36a', { wob: .8, lw: 4, shade: false });
  B(ctx, x + 138, y - 12, 24, 22, '#d8574a', { wob: .8, lw: 4 });
  ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.arc(x + 138, y - 12, 13, .3, 2.6); ctx.stroke(); ctx.beginPath(); ctx.arc(x + 138, y - 12, 7, 3.4, 5.6); ctx.stroke();
  ctx.strokeStyle = '#d8574a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x + 150, y - 4); ctx.quadraticCurveTo(x + 190, y + 6, x + 215, y - 6); ctx.stroke();
}
function drawJar(ctx, id, x, yb, t, st) {   // st: {sel, owned, equipped}
  const bob = st.sel ? Math.abs(Math.sin(t * 5)) * -7 : 0, sc = st.sel ? 1.12 : 1;
  ctx.save(); ctx.translate(x, yb + bob); ctx.scale(sc, sc);
  ctx.lineJoin = 'round';
  if (st.equipped) { ctx.save(); ctx.globalAlpha = .45 + Math.sin(t * 4) * .15; B(ctx, 0, -52, 74, 78, A.gold, { wob: 3, line: false, shade: false }); ctx.restore(); }
  A.shadow(ctx, 0, 2, 44);
  // contenido
  if (id === 'corazon') {
    heart(ctx, 0, -48 + Math.sin(t * 4) * 3, 32 + Math.sin(t * 8) * 1.8, A.red);
    ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.ellipse(-14, -64, 6, 3.5, -.6, 0, TAU); ctx.fill();
  } else if (id === 'humo') {
    for (let i = 0; i < 3; i++) { const u = ((t * .6 + i / 3) % 1); ctx.globalAlpha = (1 - u) * .8; B(ctx, Math.sin(u * 5 + i) * 12, -96 - u * 34, 9 + u * 12, 8 + u * 10, '#d8d2c8', { wob: 1, lw: 2.5, shade: false, points: 10 }); }
    ctx.globalAlpha = 1;
    B(ctx, 0, -38, 30, 30, '#2e2823', { wob: .8, lw: 4 });
    ctx.strokeStyle = A.ink; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(8, -66); ctx.quadraticCurveTo(18, -80, 8, -84); ctx.stroke();
    ctx.fillStyle = Math.sin(t * 20) > 0 ? A.gold : A.orange; ctx.beginPath(); ctx.arc(8, -85, 5, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.ellipse(-12, -48, 6, 9, .5, 0, TAU); ctx.fill();
  } else if (id === 'crema') {
    B(ctx, 0, -28, 35, 20, '#f6c7d6', { wob: .8, lw: 3.5 });
    B(ctx, 0, -48, 24, 15, '#fbd9e3', { wob: .8, lw: 3.5, shade: false });
    B(ctx, 0, -64, 14, 10, '#fff0f4', { wob: .6, lw: 3, shade: false });
    ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(-10, -38, 7, 3.3, 5.2); ctx.stroke();
    for (const [dx, dy] of [[-8, -80], [10, -90], [2, -100]]) { ctx.fillStyle = '#ffd9e6'; ctx.globalAlpha = .6 + Math.sin(t * 4 + dx) * .3; A.star(ctx, dx, dy, 5, '#fff', t); } ctx.globalAlpha = 1;
  } else {
    for (const [bx, by, br] of [[-14, -22, .3], [10, -26, -.5], [-2, -40, .8], [18, -46, .1], [-18, -52, -.3]]) { ctx.fillStyle = '#5a3418'; ctx.strokeStyle = A.ink; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.ellipse(bx, by, 11, 7.5, br, 0, TAU); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(bx - 7 * Math.cos(br), by - 7 * Math.sin(br)); ctx.lineTo(bx + 7 * Math.cos(br), by + 7 * Math.sin(br)); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
    for (let i = 0; i < 2; i++) { const u = (t * .7 + i * .5) % 1; ctx.globalAlpha = 1 - u; ctx.beginPath(); ctx.moveTo(-8 + i * 16, -88 - u * 6); ctx.bezierCurveTo(-16 + i * 16, -100 - u * 14, 0 + i * 16, -108 - u * 14, -6 + i * 16, -120 - u * 22); ctx.stroke(); }
    ctx.globalAlpha = 1;
  }
  // frasco de vidrio
  ctx.fillStyle = 'rgba(210,235,240,.32)'; ctx.strokeStyle = A.ink; ctx.lineWidth = 4.5;
  rr(ctx, -40, -100, 80, 98, 18); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.4)'; rr(ctx, -32, -92, 8, 66, 4); ctx.fill();
  ctx.fillStyle = '#8a5a32'; rr(ctx, -30, -116, 60, 20, 6); ctx.fill(); ctx.stroke();
  ctx.restore();
}
/* ---- estantes: AMULETOS · ATAQUES · ROPA ---- */
const SHELVES = [
  { id: 'amuletos', tab: 'AMULETOS', list: () => MG.CHARMS, hello: 'Los amuletos, mijito: uno solo a la vez.' },
  { id: 'ataques', tab: 'ATAQUES', list: () => MG.SHOTS, hello: 'Aquí guardo los disparos, mijito. Uno solo a la vez, y ojo con el alcance.' },
  { id: 'ropa', tab: 'ROPA', list: () => MG.ROPA, hello: 'Mira cuánta lana, Milo. Pruébate lo que quieras en el espejo: probarse es gratis.' }
];
const TAB = { x: 1152, w: 118, h: 44, y0: 150, dy: 48 };
const STATS = {
  dedazo: 'Daño 4 · 9 disparos/s · llega lejos',
  abanico: '3 balas de 1,7 · 9/s · alcance corto',
  buscadora: 'Daño 3,2 · 7/s · persigue al jefe',
  chorro: 'Daño 5,2 · 10/s · alcance corto'
};
const SAY = {
  dedazo: 'El dedazo de toda la vida, mijito: gratis y siempre tuyo.',
  abanico: '«Abanico»: tres balitas de una sola vez. Pelea cerquita, mijito.',
  buscadora: '«Gota buscadora»: va lentita, pero ella solita busca al jefe.',
  chorro: '«Chorro a presión»: pega fuerte y rápido, pero solo de cerquita.',
  gorro: 'Un «gorro de lana» con pompón, tejido por mí... digo, de fábrica.',
  lentes: 'Unos «lentes de sol», para que el malo no vea que cierras los ojos.',
  bufanda: 'Mi «bufanda de rayas»: ondea con cada paso que das.',
  capa: 'La «capa de mandadero»: cuelga detrás de la mochila y es lo más fino.'
};
const FEM = { buscadora: 1, bufanda: 1, capa: 1 }, PLU = { lentes: 1 };
const gTuyo = id => PLU[id] ? 'tuyos' : FEM[id] ? 'tuya' : 'tuyo';
const gEs = id => PLU[id] ? 'son' : 'es';
const gLo = id => PLU[id] ? 'los' : FEM[id] ? 'la' : 'lo';
const gPuesto = id => PLU[id] ? 'puestos' : FEM[id] ? 'puesta' : 'puesto';
const shelf = () => SHELVES[SH.shelf];
const items = () => shelf().list();
const cur = () => items()[SH.sels[SH.shelf]];
function iState(k, it, st) {
  if (k === 0) return { owned: st.charms.includes(it.id), eq: st.equipped === it.id };
  if (k === 1) return { owned: st.shots.includes(it.id), eq: st.shot === it.id };
  return { owned: st.ropa.includes(it.id), eq: st.vestido[it.slot] === it.id };
}
function setShelf(k) {
  if (k === SH.shelf) return;
  SH.shelf = k; snd('tick'); SH.tabPop = 1;
  shopSay(shelf().hello);
}
function pickItem(i) { SH.sels[SH.shelf] = i; snd('tick'); shopSay(describe()); }
function shopAction() {
  const k = SH.shelf, it = cur(); if (!it) return;
  const st = MG.data.store(), S = iState(k, it, st), before = MG.data.baros();
  if (S.owned) {
    if (k === 0) {
      MG.data.equip(it.id); snd('select');
      shopSay(S.eq ? 'Lo guardo en el cajón. Sin amuleto, Milo pelea a pelo.' : '¡Listo! Con «' + it.nombre + '» puesto. Uno solo a la vez, mijito.');
    } else if (k === 1) {
      if (S.eq) shopSay('Ese ya lo traes, mijito. Elige otro disparo si quieres cambiar.');
      else { MG.data.equipShot(it.id); snd('select'); shopSay('¡Listo! Ahora disparas con «' + it.nombre + '». Uno solo a la vez, mijito.'); }
    } else {
      const prev = !S.eq && st.vestido[it.slot] && MG.ROPA.find(r => r.id === st.vestido[it.slot]);
      MG.data.toggleRopa(it.id); snd('select');
      shopSay(S.eq ? 'La cuelgo de vuelta. Milo sin ' + it.nombre.toLowerCase() + ' también es guapo.'
        : prev ? 'Cambié «' + prev.nombre + '» por «' + it.nombre + '». Una prenda por ranura, mijito.' : 'Te queda precioso, Milo. «' + it.nombre + '» ' + gPuesto(it.id) + '.');
    }
  } else {
    const res = k === 0 ? MG.data.buyCharm(it.id) : k === 1 ? MG.data.buyShot(it.id) : MG.data.buyRopa(it.id);
    if (res.ok) {
      snd('buy'); SH.coinBurst = 1.2;
      const now = iState(k, it, MG.data.store());
      shopSay(k === 0 ? '¡Trato hecho! Ahora «' + it.nombre + '» es tuyo.' + (now.eq ? ' Ya te lo puse.' : ' Confirma otra vez para equiparlo.')
        : k === 1 ? '¡Trato hecho! «' + it.nombre + '» es tuyo y ya lo traes puesto, mijito.'
        : '¡Qué elegancia, mijito! «' + it.nombre + '» ' + (PLU[it.id] ? 'son tuyos' : FEM[it.id] ? 'es tuya' : 'es tuyo') + ' y ya te ' + gLo(it.id) + ' puse.');
    }
    else if (res.msg === 'Te faltan baros') shopSay('Te faltan ' + (it.precio - before) + ' baros, mijito. Vuelve cuando cumplas tus hábitos.');
    else shopSay(res.msg === 'Ya es tuyo' ? 'Pero si ya es ' + gTuyo(it.id) + ', Milo.' : 'Eso no lo tengo.');
  }
  SH.baros = MG.data.baros();
}
/* vitrina de ATAQUES: campana de vidrio sobre un plato con el disparo flotando */
const ICON_K = { dedazo: 1.2, abanico: 1.6, buscadora: 1.3, chorro: 1.4 };
function drawCloche(ctx, id, x, yb, t, st) {
  const bob = st.sel ? Math.abs(Math.sin(t * 5)) * -7 : 0, sc = st.sel ? 1.12 : 1;
  ctx.save(); ctx.translate(x, yb + bob); ctx.scale(sc, sc); ctx.lineJoin = 'round';
  if (st.equipped) { ctx.save(); ctx.globalAlpha = .45 + Math.sin(t * 4) * .15; B(ctx, 0, -52, 74, 78, A.gold, { wob: 3, line: false, shade: false }); ctx.restore(); }
  A.shadow(ctx, 0, 2, 46);
  ctx.fillStyle = '#8a5a32'; ctx.strokeStyle = A.ink; ctx.lineWidth = 4.5; ctx.beginPath(); ctx.ellipse(0, -6, 47, 10, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(210,235,240,.26)'; ctx.beginPath(); ctx.moveTo(-38, -8); ctx.lineTo(-38, -68); ctx.arc(0, -68, 38, Math.PI, 0); ctx.lineTo(38, -8); ctx.closePath(); ctx.fill();
  ctx.save(); ctx.translate(0, -56 + Math.sin(t * 3) * 4); ctx.rotate(-.22 + Math.sin(t * 2) * .07);
  if (MG.shotIcon) MG.shotIcon(ctx, id, ICON_K[id] || 1, t);
  ctx.restore();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.42)'; rr(ctx, -30, -92, 7, 58, 4); ctx.fill();
  ctx.fillStyle = '#8a5a32'; ctx.beginPath(); ctx.arc(0, -110, 8, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.restore();
}
/* percha de ROPA: la prenda cuelga de una varilla con un hilo */
const ROPA_TOP = { gorro: 44, lentes: 30, bufanda: 30, capa: 54 };
function drawRopaItem(ctx, id, t) {          // centrado en el origen
  const W2 = MG.wear; if (!W2) return;
  ctx.save();
  if (id === 'gorro') { ctx.scale(1.45, 1.45); ctx.translate(-2, 51); W2.hat(ctx, 'gorro', { sway: Math.sin(t * 2) * 3 }); }
  else if (id === 'lentes') { ctx.scale(1.9, 1.9); ctx.translate(-10, 11); W2.glasses(ctx, {}); }
  else if (id === 'bufanda') { ctx.scale(1.5, 1.5); ctx.translate(10, -22); W2.scarf(ctx, { t, b: 0, v: 0 }); }
  else if (id === 'capa') {                  // capa colgada: cuello con broche arriba, dobladillo ondulado abajo
    const wv = Math.sin(t * 2) * 2;
    ctx.beginPath(); ctx.moveTo(-26, -42); ctx.quadraticCurveTo(0, -50, 26, -42); ctx.bezierCurveTo(40, -10, 52, 20, 54 + wv, 46);
    for (let i = 0; i < 4; i++) ctx.quadraticCurveTo(54 - (i * 27 + 13.5), 56 + (i % 2 ? -4 : 6) + wv, 54 - (i + 1) * 27, 46 + (i % 2 ? 4 : -2) * 0 + wv * (i % 2 ? -1 : 1) * .5);
    ctx.bezierCurveTo(-52, 20, -40, -10, -26, -42); ctx.closePath();
    ctx.fillStyle = '#c8402c'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = A.ink; ctx.lineJoin = 'round'; ctx.stroke();
    ctx.save(); ctx.clip(); ctx.strokeStyle = 'rgba(70,10,5,.3)'; ctx.lineWidth = 4;
    for (const fx of [-22, 0, 22]) { ctx.beginPath(); ctx.moveTo(fx * .5, -40); ctx.quadraticCurveTo(fx * 1.2, 0, fx * 1.5, 56); ctx.stroke(); }
    ctx.fillStyle = 'rgba(255,200,170,.25)'; ctx.fillRect(-60, -50, 30, 120); ctx.restore();
    ctx.strokeStyle = A.gold; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-24, -41); ctx.quadraticCurveTo(0, -49, 24, -41); ctx.stroke();
    ctx.fillStyle = A.gold; ctx.strokeStyle = A.ink; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, -44, 6.5, 0, TAU); ctx.fill(); ctx.stroke();
  }
  ctx.restore();
}
function drawPercha(ctx, id, x, t, st) {
  const sway = Math.sin(t * 1.6) * (st.sel ? .05 : .03), top = ROPA_TOP[id] || 40;
  ctx.save(); ctx.translate(x, 132); ctx.rotate(sway);
  ctx.strokeStyle = A.ink; ctx.lineWidth = 3;
  const cy = 120 + (st.sel ? Math.abs(Math.sin(t * 5)) * -7 : 0);
  if (id === 'lentes') { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-30, cy - top + 4); ctx.moveTo(0, 0); ctx.lineTo(30, cy - top + 4); ctx.stroke(); }
  else { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, cy - top + 2); ctx.stroke(); }
  ctx.translate(0, cy); const sc = st.sel ? 1.12 : 1; ctx.scale(sc, sc);
  if (st.equipped) { ctx.save(); ctx.globalAlpha = .45 + Math.sin(t * 4) * .15; B(ctx, 0, 0, 66, 66, A.gold, { wob: 3, line: false, shade: false }); ctx.restore(); }
  drawRopaItem(ctx, id, t);
  ctx.restore();
}
function drawRod(ctx) {
  ctx.fillStyle = '#7a4a24'; ctx.strokeStyle = A.ink; ctx.lineWidth = 4; rr(ctx, 330, 128, 800, 9, 4); ctx.fill(); ctx.stroke();
  for (const bx of [338, 1122]) { ctx.fillStyle = '#5a3418'; rr(ctx, bx - 8, 120, 16, 26, 4); ctx.fill(); ctx.stroke(); }
}
/* espejo de pie con Milo probándose la prenda seleccionada (y la que ya lleva) */
function drawMirror(ctx, x, t) {
  const cy = 436;
  ctx.strokeStyle = A.ink; ctx.lineWidth = 5; ctx.lineCap = 'round';
  for (const lx of [-46, 46]) { ctx.beginPath(); ctx.moveTo(x + lx * .7, cy + 50); ctx.lineTo(x + lx, 494); ctx.stroke(); }
  ctx.fillStyle = '#7a4a24'; ctx.beginPath(); ctx.ellipse(x, cy, 92, 72, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#d6ecec'; ctx.beginPath(); ctx.ellipse(x, cy, 80, 62, 0, 0, TAU); ctx.fill(); ctx.lineWidth = 3; ctx.stroke();
  ctx.save(); ctx.beginPath(); ctx.ellipse(x, cy, 78, 60, 0, 0, TAU); ctx.clip();
  const st = MG.data.store(), it = SH.shelf === 2 ? cur() : null, ves = Object.assign({}, st.vestido);
  if (it) ves[it.slot] = it.id;
  drawMilo(ctx, x, 489, .76, { t, facing: 1, look: { vestido: ves, puestos: MG.data.puestos() } });
  ctx.fillStyle = 'rgba(255,255,255,.28)'; ctx.beginPath(); ctx.moveTo(x - 60, cy - 10); ctx.lineTo(x - 36, cy - 50); ctx.lineTo(x - 22, cy - 50); ctx.lineTo(x - 46, cy - 10); ctx.closePath(); ctx.fill();
  ctx.restore();
  ctx.lineCap = 'butt';
}
function shopSay(msg) { SH.msg = msg; SH.msgT = 0; SH.talk = 1.2; }
const GREET = ['Pasa, pasa, mijito. Aquí todo se paga en baros.', '¿Otra vez por aquí, Milo? Mira lo que tejí... digo, lo que tengo.', 'Ay, cuántos años llevo en el negocio. Elige con calma.'];
MG.scene('shop', {
  enter() {
    common(); if (!SHBG) SHBG = buildShopBg();
    SH = { t: 0, shelf: 0, sels: [0, 0, 0], tabPop: 0, msg: '', msgT: 0, talk: 0, baros: MG.data.baros(), dBaros: MG.data.baros(), leaving: false, coinBurst: 0, parts: [] };
    shopSay(MG.pick(GREET));
    MG.pointer = null;
    music('shop');
  },
  exit() { SH = null; },
  update(dt) {
    if (!SH || SH.leaving) return;
    SH.t += dt; SH.msgT += dt; SH.talk = Math.max(0, SH.talk - dt); SH.tabPop = Math.max(0, SH.tabPop - dt * 4);
    if (SH.msgT * 34 < SH.msg.length) SH.talk = Math.max(SH.talk, .1);
    SH.dBaros += (SH.baros - SH.dBaros) * Math.min(1, dt * 8); if (Math.abs(SH.baros - SH.dBaros) < .5) SH.dBaros = SH.baros;
    if (SH.coinBurst > 0) {
      SH.coinBurst -= dt;
      if (Math.random() < .5) SH.parts.push({ x: 120 + Math.random() * 40, y: 62, vx: MG.rand(40, 240), vy: MG.rand(-420, -200), r: MG.rand(9, 13), ph: Math.random() * 6, life: 1.1 });
    }
    for (const p of SH.parts) { p.vy += 1100 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; }
    SH.parts = SH.parts.filter(p => p.life > 0);
    const p = click(), n = items().length;
    if (I.pressed('back') || I.pressed('pause')) { snd('select'); SH.leaving = true; MG.go('map'); return; }
    if (I.pressed('up')) setShelf((SH.shelf + SHELVES.length - 1) % SHELVES.length);
    else if (I.pressed('down')) setShelf((SH.shelf + 1) % SHELVES.length);
    else if (I.pressed('left')) pickItem((SH.sels[SH.shelf] + n - 1) % n);
    else if (I.pressed('right')) pickItem((SH.sels[SH.shelf] + 1) % n);
    if (p) {
      if (inR(p, SHOP_EXIT.x, SHOP_EXIT.y, SHOP_EXIT.w, SHOP_EXIT.h)) { snd('select'); SH.leaving = true; MG.go('map'); return; }
      let tab = -1;
      SHELVES.forEach((_, i) => { if (inR(p, TAB.x - 18, TAB.y0 + i * TAB.dy, TAB.w + 18, TAB.h)) tab = i; });
      if (tab >= 0) { setShelf(tab); return; }
      let hit = -1;
      JAR_X.forEach((jx, i) => { if (i < n && inR(p, jx - 100, 140, Math.min(200, TAB.x - 4 - (jx - 100)), 240)) hit = i; });
      if (hit >= 0) { if (hit === SH.sels[SH.shelf]) shopAction(); else pickItem(hit); }
      else if (inR(p, 745, 574, 235, 82)) shopAction();
    } else if (I.ok()) shopAction();
  },
  draw(ctx) {
    if (!SH) return;
    const t = SH.t, st = MG.data.store();
    ctx.drawImage(SHBG, 0, 0);
    // lámpara
    ctx.strokeStyle = A.ink; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(1180, 0); ctx.lineTo(1180, 62 + Math.sin(t * 1.5) * 2); ctx.stroke();
    ctx.save(); ctx.translate(1180, 80 + Math.sin(t * 1.5) * 2); ctx.rotate(Math.sin(t * 1.5) * .04);
    ctx.fillStyle = 'rgba(255,225,150,.2)'; ctx.beginPath(); ctx.arc(0, 8, 70 + Math.sin(t * 7) * 2, 0, TAU); ctx.fill();
    B(ctx, 0, 8, 22, 26, '#ffe9a0', { wob: .8, lw: 4, shade: false });
    ctx.fillStyle = '#6a4020'; rr(ctx, -16, -22, 32, 14, 3); ctx.fill(); ctx.lineWidth = 3.5; ctx.stroke(); ctx.restore();
    // letrero colgante
    ctx.strokeStyle = A.ink; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(560, 0); ctx.lineTo(580, 44); ctx.moveTo(1020, 0); ctx.lineTo(1000, 44); ctx.stroke();
    ctx.save(); ctx.translate(790, 84); ctx.rotate(Math.sin(t * 1.2) * .012);
    ctx.fillStyle = '#e9d3a2'; ctx.strokeStyle = A.ink; ctx.lineWidth = 5; rr(ctx, -250, -34, 500, 68, 10); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#a0723e'; ctx.lineWidth = 2; rr(ctx, -240, -26, 480, 52, 6); ctx.stroke(); ctx.restore();
    // tortuga y estante actual
    drawTortuga(ctx, TORT.x, TORT.y, t, SH.talk > 0);
    if (SH.shelf === 2) drawRod(ctx);
    items().forEach((it, i) => {
      const S = iState(SH.shelf, it, st), sel = i === SH.sels[SH.shelf], x = JAR_X[i];
      if (SH.shelf === 0) drawJar(ctx, it.id, x, JAR_BASE, t + i, { sel, owned: S.owned, equipped: S.eq });
      else if (SH.shelf === 1) drawCloche(ctx, it.id, x, JAR_BASE, t + i, { sel, owned: S.owned, equipped: S.eq });
      else drawPercha(ctx, it.id, x, t + i, { sel, owned: S.owned, equipped: S.eq });
      // etiquetita colgante
      ctx.save(); ctx.translate(x, JAR_BASE + 38); ctx.rotate(Math.sin(t * 2 + i) * .04);
      ctx.fillStyle = S.eq ? A.gold : '#f1e2bc'; ctx.strokeStyle = A.ink; ctx.lineWidth = 3.5; rr(ctx, -52, -14, 104, 28, 6); ctx.fill(); ctx.stroke();
      ctx.restore();
      if (sel) { ctx.save(); ctx.translate(x, 156 + Math.abs(Math.sin(t * 5)) * -8); ctx.fillStyle = A.red; ctx.strokeStyle = A.ink; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-16, -12); ctx.lineTo(16, -12); ctx.lineTo(0, 14); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); }
    });
    if (SH.shelf === 2) drawMirror(ctx, 1135, t);
    // monedas al comprar
    for (const p of SH.parts) coin(ctx, p.x, p.y, p.r, t * 12 + p.ph);
    // mostrador: tarjeta pergamino
    ctx.save(); ctx.translate(660, 612); ctx.rotate(-.012);
    ctx.fillStyle = 'rgba(30,12,2,.4)'; rr(ctx, -318, -86, 640, 178, 12); ctx.fill();
    ctx.fillStyle = '#f2e4c2'; ctx.strokeStyle = A.ink; ctx.lineWidth = 5; rr(ctx, -320, -92, 640, 178, 12); ctx.fill(); ctx.stroke();
    ctx.restore();
  },
  drawUI(ctx) {
    if (!SH) return;
    const t = SH.t, st = MG.data.store(), c = cur(), S = iState(SH.shelf, c, st), owned = S.owned, eq = S.eq, k = SH.shelf;
    // letrero
    A.text(ctx, 'EL BAZAR DE LA TÍA TORTUGA', 790, 86, 28, { fill: A.red, lw: 6 });
    // baros
    panel(ctx, 16, 14, 270, 62, A.paper, 14);
    coin(ctx, 52, 45, 15, t * 3); ink(ctx, String(Math.round(SH.dBaros)) + ' baros', 78, 46, 30, { align: 'left' });
    button(ctx, 'SALIR', SHOP_EXIT.x, SHOP_EXIT.y, SHOP_EXIT.w, SHOP_EXIT.h, false);
    // pestañas de estante (letreros de madera colgados junto a la repisa)
    SHELVES.forEach((sh, i) => {
      const on = i === k, x = TAB.x - (on ? 16 : 0) + (on ? Math.sin(SH.tabPop * 12) * 3 * SH.tabPop : 0), y = TAB.y0 + i * TAB.dy, w = TAB.w + (on ? 16 : 0);
      ctx.save();
      ctx.fillStyle = 'rgba(30,12,2,.35)'; rr(ctx, x + 3, y + 5, w, TAB.h, 9); ctx.fill();
      ctx.fillStyle = on ? A.gold : '#d9b98a'; ctx.strokeStyle = A.ink; ctx.lineWidth = 4; rr(ctx, x, y, w, TAB.h, 9); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = on ? '#b8860b' : '#9a7448'; ctx.lineWidth = 2; rr(ctx, x + 5, y + 5, w - 10, TAB.h - 10, 5); ctx.stroke();
      ctx.restore();
      ink(ctx, sh.tab, x + w / 2, y + TAB.h / 2 + 2, 20, { fill: on ? A.ink : '#5a3b1e' });
    });
    // etiquetas de precio
    items().forEach((cc, i) => {
      const s2 = iState(k, cc, st), o = s2.owned, e = s2.eq, x = JAR_X[i];
      const lab = e ? 'EQUIPADO' : o ? 'TUYO' : cc.precio + ' baros';
      ink(ctx, lab, x, JAR_BASE + 40, e || o ? 20 : 21, { fill: !o && SH.baros < cc.precio ? '#a33a2a' : A.ink });
      if (e) A.star(ctx, x + 44, 214, 17, A.gold, .2);
      else if (o) { ctx.save(); ctx.translate(x + 44, 214); B(ctx, 0, 0, 15, 15, '#6aa84f', { wob: .5, lw: 3, shade: false }); ctx.strokeStyle = A.cream; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(-1, 6); ctx.lineTo(7, -6); ctx.stroke(); ctx.restore(); }
    });
    // globo de texto de la tortuga
    const bw = 470, bx = 300, by = 376, shown = SH.msg.slice(0, Math.floor(SH.msgT * 34));
    ctx.save();
    ctx.fillStyle = 'rgba(30,12,2,.35)'; rr(ctx, bx + 4, by + 6, bw, 100, 22); ctx.fill();
    ctx.fillStyle = A.cream; ctx.strokeStyle = A.ink; ctx.lineWidth = 5; rr(ctx, bx, by, bw, 100, 22); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(bx + 4, by + 52); ctx.lineTo(bx - 40, by + 66); ctx.lineTo(bx + 5, by + 80); ctx.closePath(); ctx.fillStyle = A.cream; ctx.fill(); ctx.stroke();
    ctx.fillStyle = A.cream; ctx.fillRect(bx - 1, by + 54, 8, 24);
    ctx.restore();
    const lines = wrapText(ctx, SH.msg, 23, bw - 40); let left = shown.length;
    lines.forEach((ln, i) => { ink(ctx, ln.slice(0, Math.max(0, left)), bx + 22, by + 32 + i * 28 + (lines.length < 3 ? 6 : 0), 23, { align: 'left' }); left -= ln.length + 1; });
    // tarjeta del ítem seleccionado
    const cx0 = 358;
    ink(ctx, c.nombre, cx0, 543, 30, { align: 'left' });
    const dl = wrapText(ctx, c.desc, 21, 370), extra = k === 1 ? STATS[c.id] : k === 2 ? 'Ranura: ' + c.slot : '';
    dl.slice(0, extra ? 2 : 3).forEach((ln, i) => ink(ctx, ln, cx0, 578 + i * 25, 21, { align: 'left', fill: '#4a3a2a' }));
    if (extra) ink(ctx, extra, cx0, 578 + Math.min(2, dl.length) * 25, 19, { align: 'left', fill: '#6b4a2a' });
    ink(ctx, owned ? (eq ? (k === 2 ? 'Puesto ahora' : 'Equipado ahora') : 'Ya es ' + gTuyo(c.id)) : 'Precio: ' + c.precio + ' baros', cx0, 656, 22, { align: 'left', fill: owned ? '#2f6d2f' : (SH.baros >= c.precio ? '#2f6d2f' : '#a33a2a') });
    const lab = owned ? (eq ? (k === 1 ? 'EN USO' : 'QUITAR') : 'EQUIPAR') : 'COMPRAR';
    const can = (owned && !(k === 1 && eq)) || (!owned && SH.baros >= c.precio);
    panel(ctx, 755, 578, 224, 76, can ? (Math.floor(t * 2.5) % 2 ? A.gold : '#f7d37a') : '#c9bfa6', 14);
    ink(ctx, lab, 867, 616, 32, { fill: can ? A.ink : '#7d725c' });
    if (!isTouch()) { txt(ctx, '◀ ▶ elegir', 170, 578, 24, { lw: 5 }); txt(ctx, '▲ ▼ cambiar estante', 170, 610, 20, { lw: 5 }); txt(ctx, 'SALTO = comprar / equipar', 170, 642, 20, { lw: 5 }); }
    txt(ctx, 'Los baros se ganan cumpliendo tus hábitos reales', 660, 708, 20, { fill: '#f3e5c8', lw: 5 });
  }
});
function describe() {
  const c = cur(), st = MG.data.store(), k = SH.shelf, S = iState(k, c, st);
  if (k === 0) {
    if (S.eq) return '«' + c.nombre + '»: el que llevas puesto.';
    if (S.owned) return '«' + c.nombre + '»: ya es tuyo, equípalo si quieres.';
    return '«' + c.nombre + '». Son ' + c.precio + ' baros, mijito.';
  }
  const base = SAY[c.id] || '«' + c.nombre + '».';
  if (S.eq) return base + (k === 1 ? ' Es el que traes ahora.' : ' Ya ' + gLo(c.id) + ' llevas ' + gPuesto(c.id) + '.');
  if (S.owned) return base + ' Ya ' + gEs(c.id) + ' ' + gTuyo(c.id) + '.';
  return base + ' Son ' + c.precio + ' baros.';
}

/* ============================ 4) RESULTADOS ============================ */
let R = null;
const ROWS = ['TIEMPO', 'VIDA', 'DESVÍOS', 'SÚPER USADO', 'DIFICULTAD'];
const ROW_T0 = .55, ROW_DT = .72, ROW_CNT = .55;
function rowLayout(i) { return 218 + i * 64; }
MG.scene('results', {
  enter(p) {
    common();
    p = p || {};
    const def = MG.bosses[p.bossId] || {};
    R = { p, def, t: 0, rows: ROWS.map(() => ({ shown: false, tickT: 0 })), stampDone: false, stampT: -1, coinsDone: false, fx: [], coins: [], confetti: [], leaving: false,
      tStamp: ROW_T0 + 5 * ROW_DT + .35, reward: p.reward || 0, rewardShown: 0, coinT: 0, coinN: 0, done: false, shaken: false };
    R.tReward = R.tStamp + 1.1; R.tEnd = R.tReward + (R.reward > 0 ? 1.8 : 1.0);
    for (let i = 0; i < 70; i++) R.confetti.push({ x: Math.random() * W, y: -Math.random() * H, vy: MG.rand(60, 160), vx: MG.rand(-30, 30), c: MG.pick([A.red, A.gold, A.pink, A.blue, A.green]), r: Math.random() * 6, w: MG.rand(6, 12) });
    MG.pointer = null;
    music('results');
  },
  exit() { R = null; },
  update(dt) {
    if (!R || R.leaving) return;
    const p = R.p, ok = I.ok() || !!click();
    R.t += dt;
    if (ok) {
      if (R.t < R.tEnd) { R.t = R.tEnd; for (const r of R.rows) r.shown = true; R.stampDone = true; R.stampT = Math.max(R.stampT, 1); R.rewardShown = R.reward; R.coinsDone = true; R.shaken = true; R.done = true; snd('tick'); }
      else { snd('select'); R.leaving = true; MG.go('map'); return; }
    }
    // filas
    R.rows.forEach((r, i) => {
      const t0 = ROW_T0 + i * ROW_DT;
      if (!r.shown && R.t >= t0) { r.shown = true; snd('tick'); }
      if (R.t >= t0 && R.t < t0 + ROW_CNT) { r.tickT += dt; if (r.tickT > .09) { r.tickT = 0; snd('tick'); } }
    });
    // estampado
    if (!R.shaken && R.t >= R.tStamp) {
      R.shaken = true; R.stampT = 0;
      MG.fx.shake(16, .45); MG.fx.flash('#fff', .15);
      const big = /^(S|A)/.test(p.letra || '');
      snd(big ? 'knockout' : 'select');
      R.fx.push(MG.fx.starBurst(1085, 355, A.gold));
    }
    if (R.stampT >= 0) R.stampT += dt;
    // monedas
    if (R.reward > 0 && R.t >= R.tReward && !R.coinsDone) {
      R.coinT -= dt;
      if (R.coinT <= 0 && R.coinN < 16) { R.coinT = .09; R.coinN++; snd('coin'); R.coins.push({ x: 640 + Math.random() * 40, y: 600, vx: MG.rand(60, 260), vy: MG.rand(-640, -380), r: 13, ph: Math.random() * 6, b: 0 }); R.rewardShown = Math.round(R.reward * R.coinN / 16); }
      if (R.coinN >= 16) { R.coinsDone = true; R.rewardShown = R.reward; }
    }
    for (const c of R.coins) { c.vy += 1500 * dt; c.x += c.vx * dt; c.y += c.vy * dt; if (c.y > 668 && c.vy > 0 && c.b < 2) { c.y = 668; c.vy *= -.5; c.vx *= .8; c.b++; } }
    R.coins = R.coins.filter(c => c.x < W + 30 && !(c.b >= 2 && Math.abs(c.vy) < 30 && false));
    R.fx = R.fx.filter(e => e.update(dt) !== false);
    for (const c of R.confetti) { c.y += c.vy * dt; c.x += c.vx * dt + Math.sin(R.t * 3 + c.r) * .6; c.r += dt * 4; if (c.y > H + 20) { c.y = -20; c.x = Math.random() * W; } }
    if (R.t >= R.tEnd) R.done = true;
  },
  draw(ctx) {
    if (!R) return;
    const C = common(), t = R.t, p = R.p;
    ctx.drawImage(C.sky, 0, 0);
    A.rays(ctx, 640, 360, 'rgba(255,244,200,.38)', t);
    for (const c of R.confetti) { ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.r); ctx.fillStyle = c.c; ctx.strokeStyle = A.ink; ctx.lineWidth = 1.5; ctx.fillRect(-c.w / 2, -3, c.w, 6); ctx.strokeRect(-c.w / 2, -3, c.w, 6); ctx.restore(); }
    // Milo celebrando
    const hop = p.won === false ? 0 : Math.abs(Math.sin(t * 4.2));
    drawMilo(ctx, 215, 640, 3, { t, cheer: p.won === false ? 0 : 1, lift: hop * 80, facing: 1 });
    // marco de cartel
    ctx.save(); ctx.translate(830, 420); ctx.rotate(.004);
    ctx.fillStyle = 'rgba(30,12,2,.4)'; rr(ctx, -401, -259, 802, 530, 18); ctx.fill();
    ctx.fillStyle = '#f6ead0'; ctx.strokeStyle = A.ink; ctx.lineWidth = 8; rr(ctx, -410, -270, 820, 540, 18); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#a07a3a'; ctx.lineWidth = 3; rr(ctx, -394, -254, 788, 508, 10); ctx.stroke();
    ctx.setLineDash([2, 9]); ctx.strokeStyle = '#a07a3a'; ctx.lineWidth = 3; rr(ctx, -382, -242, 764, 484, 8); ctx.stroke(); ctx.setLineDash([]);
    ctx.restore();
    // sello de la nota
    if (R.stampT >= 0) {
      const k = clamp(R.stampT / .22, 0, 1), sc = lerp(3.4, 1, ease.outBack(k)), a = clamp(R.stampT / .08, 0, 1);
      ctx.save(); ctx.translate(1085, 355); ctx.rotate(-.2); ctx.scale(sc, sc); ctx.globalAlpha = a;
      const col = /^S/.test(p.letra) ? '#c9971b' : /^A/.test(p.letra) ? '#b3261e' : /^B/.test(p.letra) ? '#2f6d8a' : '#6b4a2a';
      ctx.strokeStyle = col; ctx.lineWidth = 10; ctx.beginPath(); ctx.arc(0, 0, 118, 0, TAU); ctx.stroke();
      ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, 100, 0, TAU); ctx.stroke();
      ctx.restore();
    }
    for (const e of R.fx) e.draw(ctx);
    for (const c of R.coins) coin(ctx, c.x, c.y, c.r, R.t * 12 + c.ph);
  },
  drawUI(ctx) {
    if (!R) return;
    const t = R.t, p = R.p, def = R.def;
    const pop = ease.outBack(clamp(t / .4, 0, 1));
    // título
    ctx.save(); ctx.translate(W / 2 + 60, 78); ctx.scale(pop, pop); ctx.rotate(-.02);
    const ttl = p.won === false ? '¡CASI, MILO!' : (def.nombre ? '¡' + String(def.nombre).toUpperCase() + (/^la /i.test(def.nombre) ? ' NOQUEADA!' : ' NOQUEADO!') : '¡NOQUEADO!');
    A.text(ctx, ttl, 0, 0, ttl.length > 16 ? 58 : 72, { fill: p.won === false ? A.cream : A.red, lw: 14 });
    ctx.restore();
    // filas
    const dif = p.difficulty || 1, ns = diffStars(dif), par = p.parTime || 120;
    ROWS.forEach((lab, i) => {
      const r = R.rows[i], y = rowLayout(i), t0 = ROW_T0 + i * ROW_DT;
      if (!r.shown) return;
      const u = clamp((t - t0) / ROW_CNT, 0, 1), ap = ease.outBack(clamp((t - t0) / .25, 0, 1));
      ctx.save(); ctx.translate(0, (1 - ap) * 16); ctx.globalAlpha = clamp(ap * 1.4, 0, 1);
      ink(ctx, lab, 444, y, 28, { align: 'left' });
      ctx.strokeStyle = 'rgba(120,80,40,.4)'; ctx.lineWidth = 2; ctx.setLineDash([3, 8]); ctx.beginPath(); ctx.moveTo(444, y + 28); ctx.lineTo(1240, y + 28); ctx.stroke(); ctx.setLineDash([]);
      const vx = 700;
      if (i === 0) {
        const good = p.time <= par;
        ink(ctx, fmtTime(p.time * u), vx, y, 36, { align: 'left', fill: good ? '#2f6d2f' : '#a33a2a' });
        ink(ctx, 'par ' + fmtTime(par), vx + 130, y + 2, 22, { align: 'left', fill: '#6b4a2a' });
        if (u >= 1 && good) ink(ctx, '¡bajo el par!', vx + 130, y - 22, 17, { align: 'left', fill: '#2f6d2f' });
      } else if (i === 1) {
        const n = p.maxHp || 3;
        for (let h = 0; h < n; h++) { const hp = ease.outBack(clamp(u * n - h, 0, 1)); ctx.save(); ctx.translate(vx + 18 + h * 46, y); ctx.scale(hp, hp); heart(ctx, 0, 0, 17, h < p.hpLeft ? A.red : '#d8ccb0', A.ink); ctx.restore(); }
      } else if (i === 2) {
        const v = Math.min(3, p.parries || 0);
        for (let s = 0; s < 3; s++) { const sp = ease.outBack(clamp(u * 3 - s, 0, 1)); ctx.save(); ctx.translate(vx + 20 + s * 46, y); ctx.scale(sp, sp); ctx.globalAlpha *= 1; A.star(ctx, 0, 0, 18, s < v ? A.pink : '#d8ccb0'); ctx.restore(); }
        ink(ctx, (p.parries || 0) + '/3', vx + 160, y + 2, 28, { align: 'left' });
      } else if (i === 3) {
        const v = Math.min(3, p.exUsed || 0);
        for (let s = 0; s < 3; s++) { const sp = ease.outBack(clamp(u * 3 - s, 0, 1)); ctx.save(); ctx.translate(vx + 20 + s * 46, y); ctx.scale(sp, sp); ctx.rotate(-.1 + s * .1); ctx.fillStyle = s < v ? A.gold : '#d8ccb0'; ctx.strokeStyle = A.ink; ctx.lineWidth = 3; rr(ctx, -13, -18, 26, 36, 4); ctx.fill(); ctx.stroke(); if (s < v) A.star(ctx, 0, 0, 7, A.red); ctx.restore(); }
        ink(ctx, (p.exUsed || 0) + '/3', vx + 160, y + 2, 28, { align: 'left' });
      } else {
        for (let s = 0; s < 5; s++) skull(ctx, vx + 18 + s * 38, y, 14, s < ns * clamp(u * 1.2, 0, 1));
        ink(ctx, diffName(ns) + ' ×' + dif.toFixed(2), vx + 210, y + 2, 22, { align: 'left' });
      }
      ctx.restore();
    });
    // la nota
    if (R.stampT >= 0 && R.stampT > .12) {
      const col = /^S/.test(p.letra) ? '#c9971b' : /^A/.test(p.letra) ? '#b3261e' : /^B/.test(p.letra) ? '#2f6d8a' : '#6b4a2a';
      ctx.save(); ctx.translate(1085, 355); ctx.rotate(-.2);
      A.text(ctx, p.letra || '?', 0, 6, (p.letra || '').length > 1 ? 150 : 175, { fill: col, stroke: A.ink, lw: 12 });
      ink(ctx, (p.pts != null ? p.pts : '') + ' pts', 0, 84, 26, { fill: col });
      ctx.restore();
      const rec = p.record || {};
      let badge = null;
      if (rec.wins === 1) badge = '¡PRIMERA VICTORIA!';
      else if (rec.bestPts && rec.bestPts === p.pts && rec.wins > 1) badge = '¡MEJOR NOTA!';
      else if (rec.bestTime != null && Math.abs(rec.bestTime - p.time) < .01 && rec.wins > 1) badge = '¡MEJOR TIEMPO!';
      if (badge) {
        const bp = ease.outElastic(clamp((R.stampT - .45) / .5, 0, 1));
        ctx.save(); ctx.translate(1085, 205); ctx.rotate(.07); ctx.scale(bp, bp);
        ctx.fillStyle = A.red; ctx.strokeStyle = A.ink; ctx.lineWidth = 4; rr(ctx, -112, -20, 224, 40, 8); ctx.fill(); ctx.stroke();
        txt(ctx, badge, 0, 2, 24, { lw: 5 }); ctx.restore();
      }
    }
    // recompensa
    if (t >= R.tReward) {
      const k = ease.outBack(clamp((t - R.tReward) / .35, 0, 1));
      ctx.save(); ctx.translate(830, 575); ctx.scale(k, k);
      if (p.won === false) ink(ctx, 'Los baros se ganan con victorias. ¡Otra vez!', 0, 0, 26, {});
      else if (R.reward > 0) {
        coin(ctx, -190, 0, 18, t * 4);
        txt(ctx, '+' + R.rewardShown + ' baros para Milo', 30, 2, 40, { fill: A.gold, lw: 9 });
      } else ink(ctx, 'Hoy ya cobraste este jefe — vuelve mañana', 0, 0, 27, { fill: '#6b4a2a' });
      ctx.restore();
    }
    if (R.done && Math.floor(t * 2.3) % 2 === 0) txt(ctx, isTouch() ? 'TOCA PARA VOLVER AL MAPA' : 'SALTO PARA VOLVER AL MAPA', 830, 665, 30, { lw: 7 });
    else if (!R.done) ink(ctx, isTouch() ? 'toca para saltar' : 'SALTO para saltar la animación', 1100, 692, 15, { fill: '#6b4a2a' });
  }
});
})();
