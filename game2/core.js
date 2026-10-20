/* ==========================================================================
   MILO · EL GRAN NOQUEO — motor del modo juego V8 (estilo dibujo animado 1930)
   --------------------------------------------------------------------------
   core.js = motor compartido. Lo usan player.js, boss_*.js, screens.js, audio.js
   Contrato completo en game2/CONTRATO_JUEGO.md
   - Lienzo lógico 1280×720, escalado con barras negras.
   - Bucle fijo a 60 Hz, escenas con transición de iris.
   - Entrada: teclado, mando y controles táctiles.
   - Efectos de película: grano, viñeta, rayas, parpadeo, tinte cálido, temblor.
   - Ayudas de dibujo "rubber hose" (líneas que hierven, manguera, guantes, ojos).
   - Puente con la app: stats del jugador y dificultad de jefes según tus datos.
   - Escena 'fight' (pelea de jefe) con intro, KO, derrota y pausa.
   ========================================================================== */
(function () {
'use strict';
const MG = window.MG = window.MG || {};
const W = MG.W = 1280, H = MG.H = 720;

/* ============================ utilidades ============================ */
MG.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
MG.lerp = (a, b, t) => a + (b - a) * t;
MG.rand = (a, b) => a + Math.random() * (b - a);
MG.randi = (a, b) => Math.floor(MG.rand(a, b + 1));
MG.pick = arr => arr[Math.floor(Math.random() * arr.length)];
MG.dist = (ax, ay, bx, by) => Math.hypot(bx - ax, by - ay);
MG.angle = (ax, ay, bx, by) => Math.atan2(by - ay, bx - ax);
MG.ease = {
  outBack: t => { const c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
  outCubic: t => 1 - Math.pow(1 - t, 3),
  inOut: t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
  outElastic: t => t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - .75) * (2 * Math.PI / 3)) + 1
};
// colisiones: círculos {x,y,r}; rectángulos {x,y,w,h}
MG.hitCC = (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2 < (a.r + b.r) ** 2;
MG.hitRC = (r, c) => {
  const nx = MG.clamp(c.x, r.x, r.x + r.w), ny = MG.clamp(c.y, r.y, r.y + r.h);
  return (c.x - nx) ** 2 + (c.y - ny) ** 2 < c.r * c.r;
};

/* ============================ arte ============================ */
const A = MG.art = {
  ink: '#1b120a', paper: '#f3e5c8', cream: '#fff6df', red: '#d8432e', orange: '#ee8a2c',
  milo: '#f0912e', miloDark: '#c86a17', pink: '#ff5fa2', gold: '#f2c14e', blue: '#4f8fc0',
  green: '#6aa84f', purple: '#7d5ba6', sky1: '#f6d9a0', sky2: '#e9b77a',
  frame: 0,                        // se incrementa en cada update
  boilSeed() { return Math.floor(A.frame / 5) % 3; },   // ~12 fps: las líneas "hierven"
  // ruido determinista para el hervor (mismo seed → misma forma durante 5 frames)
  j(i, amp) { const s = Math.sin((i + 1) * 12.9898 + A.boilSeed() * 78.233) * 43758.5453; return ((s - Math.floor(s)) - .5) * 2 * (amp == null ? 1.6 : amp); },
  // elipse temblorosa con contorno de tinta grueso
  blob(ctx, x, y, rx, ry, fill, opt) {
    opt = opt || {};
    const n = opt.points || 18, wob = opt.wob == null ? 1.6 : opt.wob, rot = opt.rot || 0;
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    const path = new Path2D();
    for (let i = 0; i <= n; i++) {
      const a = i / n * Math.PI * 2, k = i % n;
      const px = Math.cos(a) * (rx + A.j(k + (opt.seed || 0), wob)), py = Math.sin(a) * (ry + A.j(k + 7 + (opt.seed || 0), wob));
      if (i === 0) path.moveTo(px, py); else path.lineTo(px, py);
    }
    path.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(path); }
    if (opt.shade !== false && fill) {        // sombra interior tipo acuarela
      ctx.save(); ctx.clip(path);
      ctx.fillStyle = 'rgba(60,30,10,.18)';
      ctx.beginPath(); ctx.ellipse(rx * .35, ry * .4, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.22)';
      ctx.beginPath(); ctx.ellipse(-rx * .35, -ry * .45, rx * .35, ry * .22, -.5, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    if (opt.line !== false) { ctx.lineWidth = opt.lw || 4; ctx.strokeStyle = A.ink; ctx.lineJoin = 'round'; ctx.stroke(path); }
    ctx.restore();
  },
  // brazo/pierna de manguera (curva) — bend positivo dobla hacia un lado
  hose(ctx, x1, y1, x2, y2, bend, width, color) {
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1;
    const cx = mx - dy / len * bend, cy = my + dx / len * bend;
    ctx.save(); ctx.lineCap = 'round';
    ctx.strokeStyle = A.ink; ctx.lineWidth = width + 6;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.quadraticCurveTo(cx, cy, x2, y2); ctx.stroke();
    ctx.strokeStyle = color; ctx.lineWidth = width;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.quadraticCurveTo(cx, cy, x2, y2); ctx.stroke();
    ctx.restore();
  },
  // guante blanco de dibujo animado
  glove(ctx, x, y, r, ang) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang || 0);
    A.blob(ctx, 0, 0, r, r * .85, A.cream, { wob: .6, lw: 3, shade: false });
    for (let i = -1; i <= 1; i++) A.blob(ctx, r * .8, i * r * .45, r * .38, r * .26, A.cream, { wob: .3, lw: 2.5, shade: false, points: 10 });
    ctx.restore();
  },
  // ojos "pac-man" de los años 30
  eyes(ctx, x, y, size, lookX, lookY, mood) {
    const gap = size * 1.25;
    for (const s of [-1, 1]) {
      const ex = x + s * gap / 2;
      ctx.save();
      ctx.fillStyle = A.cream; ctx.strokeStyle = A.ink; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(ex, y, size * .45, size * .62, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      const px = ex + (lookX || 0) * size * .18, py = y + (lookY || 0) * size * .22;
      ctx.fillStyle = A.ink;
      ctx.beginPath(); ctx.moveTo(px, py);
      ctx.arc(px, py, size * .28, -Math.PI * .1 + Math.PI * 1.5, Math.PI * 1.5 - Math.PI * .1 + Math.PI * 1.8);
      ctx.closePath(); ctx.fill();
      if (mood === 'angry') {              // ceja enojada
        ctx.lineWidth = 5; ctx.beginPath();
        ctx.moveTo(ex - s * size * .5, y - size * .75); ctx.lineTo(ex + s * size * .35, y - size * .5); ctx.stroke();
      }
      ctx.restore();
    }
  },
  shadow(ctx, x, y, w) {
    ctx.save(); ctx.fillStyle = 'rgba(40,20,5,.28)';
    ctx.beginPath(); ctx.ellipse(x, y, w, w * .18, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  },
  // texto con contorno grueso. font: 'title' | 'ui'
  text(ctx, str, x, y, size, opt) {
    opt = opt || {};
    ctx.save();
    ctx.font = `${opt.weight || ''} ${size}px ${opt.font === 'ui' ? "'Lilita One', 'Arial Black', sans-serif" : "'Rye', 'Lilita One', Georgia, serif"}`;
    ctx.textAlign = opt.align || 'center'; ctx.textBaseline = opt.baseline || 'middle';
    ctx.lineJoin = 'round';
    if (opt.stroke !== false) { ctx.lineWidth = opt.lw || Math.max(4, size * .14); ctx.strokeStyle = opt.stroke || A.ink; ctx.strokeText(str, x, y); }
    ctx.fillStyle = opt.fill || A.cream; ctx.fillText(str, x, y);
    ctx.restore();
  },
  // estrella de 5 puntas (impactos, notas)
  star(ctx, x, y, r, fill, rot) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot || 0); ctx.beginPath();
    for (let i = 0; i < 10; i++) { const rr = i % 2 ? r * .45 : r, a = i / 10 * Math.PI * 2 - Math.PI / 2; ctx[i ? 'lineTo' : 'moveTo'](Math.cos(a) * rr, Math.sin(a) * rr); }
    ctx.closePath(); ctx.fillStyle = fill || A.gold; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = A.ink; ctx.stroke(); ctx.restore();
  },
  // nube de dibujo animado
  cloud(ctx, x, y, s, fill) {
    for (const [dx, dy, r] of [[-1, .2, .7], [0, -.25, 1], [1, .15, .75], [.45, .4, .6], [-.45, .45, .6]])
      A.blob(ctx, x + dx * s * 60, y + dy * s * 50, r * s * 55, r * s * 45, fill || A.cream, { wob: 1, lw: 3, seed: dx * 9 + dy });
  },
  // fondo pintado: degradado de cielo + sol radiante
  sky(ctx, top, bottom) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, top || A.sky1); g.addColorStop(1, bottom || A.sky2);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  },
  // rayos de "telón" detrás de los carteles
  rays(ctx, x, y, color, t) {
    ctx.save(); ctx.translate(x, y); ctx.rotate((t || 0) * .2); ctx.fillStyle = color;
    for (let i = 0; i < 16; i++) { ctx.rotate(Math.PI / 8); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(1400, -110); ctx.lineTo(1400, 110); ctx.closePath(); if (i % 2) ctx.fill(); }
    ctx.restore();
  },
  // nubecita de polvo/impacto
  puff(ctx, x, y, r, a) { ctx.save(); ctx.globalAlpha = a == null ? 1 : a; A.blob(ctx, x, y, r, r * .85, A.cream, { wob: r * .15, lw: 3, shade: false }); ctx.restore(); }
};

/* ============================ efectos de pantalla ============================ */
const FX = MG.fx = {
  shakeT: 0, shakeAmp: 0, flashT: 0, flashMax: 0, flashColor: '#fff', slowT: 0, slowScale: 1, hitstop: 0,
  shake(amp, time) { FX.shakeAmp = Math.max(FX.shakeAmp, amp); FX.shakeT = Math.max(FX.shakeT, time || .3); },
  flash(color, time) { FX.flashColor = color || '#fff'; FX.flashT = FX.flashMax = time || .15; },
  slowmo(scale, time) { FX.slowScale = scale; FX.slowT = time; },
  freeze(frames) { FX.hitstop = Math.max(FX.hitstop, frames); },
  grain: [], vignette: null,
  build() {
    for (let k = 0; k < 4; k++) {
      const c = document.createElement('canvas'); c.width = 320; c.height = 180;
      const x = c.getContext('2d'), id = x.createImageData(320, 180);
      for (let i = 0; i < id.data.length; i += 4) {
        const v = Math.random() * 255;
        id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = Math.random() < .5 ? 30 : 0;
      }
      x.putImageData(id, 0, 0);
      // motas de polvo y pelusas
      x.strokeStyle = 'rgba(20,10,0,.55)'; x.fillStyle = 'rgba(20,10,0,.6)';
      for (let i = 0; i < 6; i++) { x.beginPath(); x.arc(Math.random() * 320, Math.random() * 180, Math.random() * 1.4 + .3, 0, 7); x.fill(); }
      x.lineWidth = .6; x.beginPath(); const hx = Math.random() * 320, hy = Math.random() * 180;
      x.moveTo(hx, hy); x.bezierCurveTo(hx + 6, hy - 4, hx + 4, hy + 8, hx + 12, hy + 5); x.stroke();
      FX.grain.push(c);
    }
    const v = document.createElement('canvas'); v.width = W; v.height = H;
    const vx = v.getContext('2d'), g = vx.createRadialGradient(W / 2, H / 2, H * .35, W / 2, H / 2, H * .95);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(25,12,0,.62)');
    vx.fillStyle = g; vx.fillRect(0, 0, W, H);
    FX.vignette = v;
  },
  update(dt) {
    if (FX.shakeT > 0) { FX.shakeT -= dt; if (FX.shakeT <= 0) FX.shakeAmp = 0; }
    if (FX.flashT > 0) FX.flashT -= dt;
    if (FX.slowT > 0) { FX.slowT -= dt; if (FX.slowT <= 0) FX.slowScale = 1; }
  },
  offset() { return FX.shakeT > 0 ? [MG.rand(-1, 1) * FX.shakeAmp, MG.rand(-1, 1) * FX.shakeAmp] : [0, 0]; },
  // posproceso de "película de 1930"
  film(ctx) {
    const f = A.frame;
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = 'rgba(255,226,170,.22)'; ctx.fillRect(0, 0, W, H);   // tinte cálido
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = .55; ctx.imageSmoothingEnabled = false;
    ctx.drawImage(FX.grain[Math.floor(f / 2) % 4], 0, 0, W, H);
    ctx.imageSmoothingEnabled = true; ctx.globalAlpha = 1;
    // rayas verticales del rollo
    if ((f >> 3) % 7 < 3) {
      ctx.strokeStyle = 'rgba(30,15,0,.25)'; ctx.lineWidth = 1.2;
      const sx = (Math.sin(f * .37) * .5 + .5) * W; ctx.beginPath(); ctx.moveTo(sx, 0); ctx.lineTo(sx + 6, H); ctx.stroke();
    }
    ctx.drawImage(FX.vignette, 0, 0);
    // parpadeo de proyector
    const fl = .04 + Math.sin(f * 1.7) * .015 + (Math.random() < .03 ? .05 : 0);
    ctx.fillStyle = `rgba(20,10,0,${fl})`; ctx.fillRect(0, 0, W, H);
    if (FX.flashT > 0) { ctx.globalAlpha = MG.clamp(FX.flashT / FX.flashMax, 0, 1) * .8; ctx.fillStyle = FX.flashColor; ctx.fillRect(0, 0, W, H); }
    ctx.restore();
  }
};

/* ============================ entrada ============================ */
const ACTIONS = ['left', 'right', 'up', 'down', 'jump', 'shoot', 'dash', 'ex', 'lock', 'confirm', 'back', 'pause'];
const KEYMAP = {
  ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down',
  KeyZ: 'jump', Space: 'jump', KeyJ: 'jump', KeyX: 'shoot', KeyK: 'shoot', ShiftLeft: 'dash', KeyC: 'dash', KeyL: 'dash',
  KeyV: 'ex', KeyI: 'ex', KeyF: 'lock', Enter: 'confirm', Escape: 'pause', KeyP: 'pause', Backspace: 'back'
};
const I = MG.input = {
  down: {}, prev: {}, touch: {}, kb: {}, kbHit: {}, pad: {}, autoFire: false,
  lastDevice: (window.matchMedia && matchMedia('(pointer:coarse)').matches) ? 'touch' : 'kb',
  is(a) { return !!I.down[a]; },
  pressed(a) { return !!I.down[a] && !I.prev[a]; },
  released(a) { return !I.down[a] && !!I.prev[a]; },
  // confirmar sirve con Enter, salto o toque
  ok() { return I.pressed('confirm') || I.pressed('jump'); },
  poll() {
    I.prev = Object.assign({}, I.down);
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    const p = pads && [].slice.call(pads).find(x => x);
    I.pad = {};
    if (p) {
      const ax = p.axes[0] || 0, ay = p.axes[1] || 0, b = i => p.buttons[i] && p.buttons[i].pressed;
      I.pad = { left: ax < -.4 || b(14), right: ax > .4 || b(15), up: ay < -.5 || b(12), down: ay > .5 || b(13),
        jump: b(0), shoot: b(2) || b(7), dash: b(1) || b(6), ex: b(3), lock: b(5), pause: b(9), confirm: b(0), back: b(1) };
      if (Object.values(I.pad).some(Boolean)) I.lastDevice = 'pad';
    }
    // kbHit: una tecla tocada muy rápido (bajó y subió entre dos frames) igual cuenta una vez
    for (const a of ACTIONS) I.down[a] = !!(I.kb[a] || I.kbHit[a] || I.touch[a] || I.pad[a]);
    I.kbHit = {};
    if (I.autoFire && MG.scene.current === 'fight') I.down.shoot = true;
  },
  clear() { I.kb = {}; I.kbHit = {}; I.touch = {}; I.down = {}; I.prev = {}; }
};
addEventListener('keydown', e => {
  if (!MG.isOpen) return;
  const a = KEYMAP[e.code]; if (!a) return;
  I.kb[a] = true; I.kbHit[a] = true; I.lastDevice = 'kb'; e.preventDefault();
}, { capture: true });
addEventListener('keyup', e => { const a = KEYMAP[e.code]; if (a) I.kb[a] = false; }, { capture: true });
addEventListener('blur', () => { I.kb = {}; });

/* ============================ controles táctiles ============================ */
function buildTouch(root) {
  const t = document.createElement('div'); t.id = 'mg-touch';
  t.innerHTML = `
    <div class="mg-pad">
      <button data-a="up" class="mg-b mg-up" aria-label="Arriba">▲</button>
      <button data-a="left" class="mg-b mg-left" aria-label="Izquierda">◀</button>
      <button data-a="right" class="mg-b mg-right" aria-label="Derecha">▶</button>
      <button data-a="down" class="mg-b mg-down" aria-label="Abajo">▼</button>
    </div>
    <div class="mg-acts">
      <button data-a="ex" class="mg-b mg-ex">EX</button>
      <button data-a="dash" class="mg-b mg-dash">DASH</button>
      <button data-a="shoot" class="mg-b mg-shoot">DISPARO</button>
      <button data-a="jump" class="mg-b mg-jump">SALTO</button>
    </div>
    <button data-a="pause" class="mg-b mg-pause" aria-label="Pausa">II</button>
    <button class="mg-b mg-mute" data-mute aria-label="Sonido">♪</button>
    <button class="mg-b mg-auto" data-auto aria-pressed="false">AUTO</button>`;
  root.appendChild(t);
  const active = new Map();   // pointerId -> acción
  const setFrom = () => { I.touch = {}; active.forEach(a => { I.touch[a] = true; }); };
  const actAt = (x, y) => { const el = document.elementFromPoint(x, y); const b = el && el.closest && el.closest('[data-a]'); return b ? b.dataset.a : null; };
  t.addEventListener('pointerdown', e => {
    const mute = e.target.closest('[data-mute]');
    if (mute) { MG.toggleSound(); return; }
    const auto = e.target.closest('[data-auto]');
    if (auto) { I.autoFire = !I.autoFire; auto.setAttribute('aria-pressed', I.autoFire); auto.classList.toggle('on', I.autoFire); return; }
    const a = actAt(e.clientX, e.clientY); if (!a) return;
    e.preventDefault(); active.set(e.pointerId, a); setFrom(); I.lastDevice = 'touch';
    if (navigator.vibrate) try { navigator.vibrate(8); } catch (_) {}
  });
  t.addEventListener('pointermove', e => {
    if (!active.has(e.pointerId)) return;
    const a = actAt(e.clientX, e.clientY);
    // deslizar el dedo entre flechas cambia de dirección (no entre botones de acción)
    if (a && ['left', 'right', 'up', 'down'].includes(a) && ['left', 'right', 'up', 'down'].includes(active.get(e.pointerId))) { active.set(e.pointerId, a); setFrom(); }
  });
  const end = e => { if (active.delete(e.pointerId)) setFrom(); };
  t.addEventListener('pointerup', end); t.addEventListener('pointercancel', end); t.addEventListener('pointerleave', end);
  // tocar el lienzo = confirmar (menús)
  root.querySelector('#mg-canvas').addEventListener('pointerdown', e => {
    const r = e.target.getBoundingClientRect();
    MG.pointer = { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H, t: performance.now() };
    I.touch.confirm = true; setTimeout(() => { I.touch.confirm = false; }, 90);
  });
}

/* ============================ escenas ============================ */
const scenes = {};
MG.scene = function (name, def) { scenes[name] = def; };
MG.scene.current = null;
const TR = { phase: 'none', t: 0, dur: .45, next: null, params: null };
MG.go = function (name, params, opt) {
  if (!scenes[name]) { console.warn('[MG] escena no existe:', name); return; }
  if (opt && opt.cut || !MG.scene.current) { switchTo(name, params); return; }
  if (TR.phase !== 'none') return;
  TR.phase = 'close'; TR.t = 0; TR.next = name; TR.params = params;
  if (MG.audio && MG.audio.sfx) MG.audio.sfx('iris');
};
function switchTo(name, params) {
  const cur = scenes[MG.scene.current];
  if (cur && cur.exit) try { cur.exit(); } catch (e) { console.error(e); }
  MG.scene.current = name;
  if (root) root.dataset.scene = name;
  I.clear();
  try { scenes[name].enter && scenes[name].enter(params || {}); } catch (e) { console.error('[MG] enter', name, e); }
}
function drawIris(ctx, k) {          // k: 0 abierto → 1 cerrado
  if (k <= 0) return;
  const r = (1 - k) * Math.hypot(W, H) * .6;
  ctx.save(); ctx.fillStyle = '#000'; ctx.beginPath(); ctx.rect(0, 0, W, H);
  ctx.arc(W / 2, H / 2, Math.max(0, r), 0, Math.PI * 2, true); ctx.fill('evenodd');
  ctx.restore();
}

/* ============================ bucle ============================ */
let canvas, ctx, root, raf = 0, last = 0, acc = 0, paused = false;
const STEP = 1 / 60;
function frame(now) {
  raf = requestAnimationFrame(frame);
  if (!last) last = now;
  let dt = Math.min(.1, (now - last) / 1000); last = now;
  if (paused) { draw(); return; }
  acc += dt;
  let steps = 0;
  while (acc >= STEP && steps < 5) { update(STEP); acc -= STEP; steps++; }
  if (steps === 5) acc = 0;
  draw();
}
function update(dt) {
  I.poll();
  A.frame++;
  FX.update(dt);
  if (TR.phase === 'close') { TR.t += dt; if (TR.t >= TR.dur) { switchTo(TR.next, TR.params); TR.phase = 'open'; TR.t = 0; } return; }
  if (TR.phase === 'open') { TR.t += dt; if (TR.t >= TR.dur) TR.phase = 'none'; }
  if (FX.hitstop > 0) { FX.hitstop--; return; }
  const s = scenes[MG.scene.current];
  if (s && s.update) try { s.update(dt * FX.slowScale); } catch (e) { console.error('[MG] update', e); }
}
function draw() {
  const s = scenes[MG.scene.current];
  ctx.save();
  ctx.clearRect(0, 0, W, H);
  const [ox, oy] = FX.offset(); ctx.translate(ox, oy);
  if (s && s.draw) try { s.draw(ctx); } catch (e) { console.error('[MG] draw', e); }
  ctx.restore();
  if (!(s && s.noFilm)) FX.film(ctx);
  if (s && s.drawUI) try { s.drawUI(ctx); } catch (e) { console.error('[MG] drawUI', e); }
  if (TR.phase === 'close') drawIris(ctx, MG.ease.inOut(TR.t / TR.dur));
  else if (TR.phase === 'open') drawIris(ctx, 1 - MG.ease.inOut(TR.t / TR.dur));
}
function fit() {
  if (!canvas) return;
  const vw = innerWidth, vh = innerHeight, k = Math.min(vw / W, vh / H);
  canvas.style.width = Math.floor(W * k) + 'px'; canvas.style.height = Math.floor(H * k) + 'px';
  const dpr = Math.min(devicePixelRatio || 1, 2), q = Math.min(1, (W * k * dpr) / W);
  // resolución interna: 1280×720 (o menos en pantallas chicas para ir fluido)
  const scale = Math.max(.6, q);
  if (canvas.width !== Math.round(W * scale)) { canvas.width = Math.round(W * scale); canvas.height = Math.round(H * scale); }
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  root.classList.toggle('mg-portrait', vh > vw);
}

/* ============================ abrir / cerrar ============================ */
MG.isOpen = false;
MG.open = function (startScene, params) {
  if (MG.isOpen) return;
  MG.isOpen = true;
  root = document.createElement('div'); root.id = 'mg-root';
  root.innerHTML = '<canvas id="mg-canvas"></canvas><div class="mg-rotate">Gira el teléfono para jugar en horizontal<br><small>(o toca para jugar igual)</small></div>';
  document.body.appendChild(root);
  document.body.classList.add('mg-open');
  canvas = root.querySelector('#mg-canvas'); ctx = canvas.getContext('2d');
  // con setTransform en fit(), dibujar siempre en coordenadas 1280×720
  const origCtx = ctx;
  MG.ctx = origCtx;
  root.querySelector('.mg-rotate').addEventListener('pointerdown', () => root.classList.add('mg-force'));
  buildTouch(root);
  if (!FX.grain.length) FX.build();
  addEventListener('resize', fit); fit();
  last = 0; acc = 0; paused = false;
  if (MG.audio && MG.audio.unlock) MG.audio.unlock();
  try { if (window.MODO_JUEGO && MODO_JUEGO.aplicarMute) MODO_JUEGO.aplicarMute(); } catch (e) {}
  { const mb = root.querySelector('[data-mute]'); if (mb) mb.classList.toggle('off', !MG.soundOn()); }
  MG.scene.current = null;
  MG.go(startScene || 'title', params);
  raf = requestAnimationFrame(frame);
  document.addEventListener('visibilitychange', onVis);
};
function onVis() {
  if (!document.hidden || MG.scene.current !== 'fight' || !F || F.mode !== 'fight') return;
  F.mode = 'paused'; F.menu = 0;
  if (MG.audio && MG.audio.duck) MG.audio.duck(true);
}
// opts.keepMusic: no cortar la música (al ir al pueblo, el pueblo la cambia con un fundido)
MG.close = function (opts) {
  if (!MG.isOpen) return;
  const cur = scenes[MG.scene.current]; if (cur && cur.exit) try { cur.exit(); } catch (e) {}
  MG.isOpen = false; cancelAnimationFrame(raf);
  if (MG.audio && MG.audio.stop && !(opts && opts.keepMusic)) MG.audio.stop(.8);
  if (I.lastDevice !== 'kb') swallowGhostClick();
  removeEventListener('resize', fit); document.removeEventListener('visibilitychange', onVis);
  root && root.remove(); root = null; document.body.classList.remove('mg-open');
  MG.scene.current = null; I.clear();
  if (!(opts && opts.toTown) && window.App && App.refresh) App.refresh();
};
// un solo interruptor de sonido para el juego y el pueblo (state.game.sonido; en dev, el mute del audio)
MG.soundOn = function () {
  try { if (window.MODO_JUEGO && MODO_JUEGO.estado) return MODO_JUEGO.estado().sonido !== false; } catch (e) {}
  return !(MG.audio && MG.audio.muted);
};
MG.toggleSound = function () {
  const on = !MG.soundOn();
  try {
    if (window.MODO_JUEGO && MODO_JUEGO.estado) {
      MODO_JUEGO.estado().sonido = on;
      if (typeof saveState === 'function') saveState();
      MODO_JUEGO.aplicarMute();
    } else if (MG.audio) MG.audio.setMuted(!on);
  } catch (e) {}
  const b = root && root.querySelector('[data-mute]'); if (b) b.classList.toggle('off', !on);
  if (on && MG.audio) MG.audio.sfx('select');
  return on;
};
// tras cerrar con el dedo, el navegador manda un "click" al elemento que queda debajo: lo absorbemos
function swallowGhostClick() {
  const g = document.createElement('div');
  g.style.cssText = 'position:fixed;inset:0;z-index:99998;background:transparent;touch-action:none';
  let done = false;
  const kill = () => { if (done) return; done = true; g.remove(); };
  const eat = e => { e.preventDefault(); e.stopPropagation(); setTimeout(kill, 0); };
  g.addEventListener('click', eat, true);
  g.addEventListener('pointerup', e => { e.preventDefault(); setTimeout(kill, 350); }, true);
  document.body.appendChild(g);
  setTimeout(kill, 1200);
}
MG.pause = function (v) { paused = v == null ? !paused : v; if (MG.audio && MG.audio.duck) MG.audio.duck(paused); MG.paused = paused; };

/* ============================ amuletos ============================ */
MG.CHARMS = [
  { id: 'corazon', nombre: 'Corazón de repuesto', desc: '+1 de vida, pero tus disparos hacen 10\u00a0% menos', precio: 120 },
  { id: 'humo', nombre: 'Bomba de humo', desc: 'El dash te vuelve invencible y desaparece a Milo un instante', precio: 150 },
  { id: 'crema', nombre: 'Crema milagrosa', desc: 'El primer golpe de cada pelea se convierte en parry', precio: 180 },
  { id: 'cafe', nombre: 'Café cargado', desc: 'La barra de súper se llena sola, de a poco', precio: 140 }
];

/* ---- ataques (el disparo normal de Milo; uno equipado a la vez) ---- */
MG.SHOTS = [
  { id: 'dedazo', nombre: 'Dedazo', desc: 'El disparo de siempre: rápido, parejo y gratis', precio: 0 },
  { id: 'abanico', nombre: 'Abanico', desc: '3 balitas en abanico: ideal para pelear de cerca', precio: 200 },
  { id: 'buscadora', nombre: 'Gota buscadora', desc: 'Lenta, pero gira sola hacia el jefe', precio: 260 },
  { id: 'chorro', nombre: 'Chorro a presión', desc: 'Ráfaga potente que solo llega de cerca', precio: 220 }
];
/* ---- ropa (cosmética): una prenda por ranura, combinables ---- */
MG.SLOTS = ['cabeza', 'cara', 'cuello', 'espalda'];
MG.ROPA = [
  { id: 'gorro', nombre: 'Gorro de lana', desc: 'Con pompón y todo: abriga la cabeza', slot: 'cabeza', precio: 150 },
  { id: 'lentes', nombre: 'Lentes de sol', desc: 'Para pelear con estilo y sin entrecerrar', slot: 'cara', precio: 180 },
  { id: 'bufanda', nombre: 'Bufanda de rayas', desc: 'Ondea con cada paso que das', slot: 'cuello', precio: 120 },
  { id: 'capa', nombre: 'Capa de mandadero', desc: 'Cuelga detrás de la mochila y vuela al correr', slot: 'espalda', precio: 300 }
];

/* ============================ puente con la app ============================ */
const D = MG.data = {
  hasApp() { return typeof state !== 'undefined' && !!state; },
  motor() { try { return window.MODO_JUEGO && MODO_JUEGO.motor ? MODO_JUEGO.motor() : null; } catch (e) { return null; } },
  // estado propio del juego V8 (se guarda dentro de state.game, así sincroniza solo)
  store() {
    let g;
    if (D.hasApp()) { if (!state.game || typeof state.game !== 'object') state.game = {}; g = state.game; }
    else { D._dev = D._dev || JSON.parse(localStorage.getItem('mg-dev') || '{}'); g = D._dev; }
    if (!g.v8) g.v8 = { wins: {}, charms: [], equipped: null, map: { x: null, y: null }, seenIntro: false };
    const v = g.v8; v.wins = v.wins || {}; v.charms = v.charms || [];
    // ataques y ropa (los guardados antiguos no los traen)
    if (!Array.isArray(v.shots)) v.shots = [];
    if (!v.shots.includes('dedazo')) v.shots.unshift('dedazo');
    if (!v.shot || !v.shots.includes(v.shot) || !MG.SHOTS.some(s => s.id === v.shot)) v.shot = 'dedazo';
    if (!Array.isArray(v.ropa)) v.ropa = [];
    if (!v.vestido || typeof v.vestido !== 'object') v.vestido = {};
    for (const sl of MG.SLOTS) {
      const id = v.vestido[sl], it = id && MG.ROPA.find(r => r.id === id);
      if (!it || it.slot !== sl || !v.ropa.includes(id)) v.vestido[sl] = null;
    }
    return v;
  },
  persist() {
    if (D.hasApp()) { try { if (window.MODO_JUEGO && MODO_JUEGO.invalidar) MODO_JUEGO.invalidar(); saveState(); } catch (e) { console.error(e); } }
    else localStorage.setItem('mg-dev', JSON.stringify(D._dev || {}));
  },
  hoy() { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); },
  baros() { const M = D.motor(); if (M) return M.baros || 0; const v = D.store(); return v.devBaros == null ? 500 : v.devBaros; },
  // stats del jugador a partir de tus hábitos reales
  player() {
    const M = D.motor(), v = D.store();
    let forma = 5, conf = 0, xpSem = 0, nivel = 1;
    if (M) {
      const fs = Object.values(M.forma || {}).filter(x => typeof x === 'number');
      forma = fs.length ? fs.reduce((a, b) => a + b, 0) / fs.length : 5;
      conf = M.confianza || 0; xpSem = M.xpRegistroSemana || 0;
      if (MODO_JUEGO.CFG && MODO_JUEGO.CFG.curva) { let n = 1; while (MODO_JUEGO.CFG.curva(n + 1) <= M.xpTotal) n++; nivel = n; }
    }
    const charm = v.equipped || null;
    const shot = MG.SHOTS.find(x => x.id === v.shot) || MG.SHOTS[0];
    let maxHp = 3 + (forma >= 7 ? 1 : 0) + (charm === 'corazon' ? 1 : 0);
    let dmgMult = (1 + Math.min(conf, 100) / 250) * (charm === 'corazon' ? .9 : 1);
    return {
      maxHp, dmgMult, charm, nivel, shot: shot.id, vestido: Object.assign({}, v.vestido), puestos: D.puestos(),
      superStart: Math.min(2, Math.floor(xpSem / 40)),
      razones: [
        `Vida ${maxHp}` + (forma >= 7 ? ' (+1 por tu forma ' + forma.toFixed(1) + '/10)' : ' · forma ' + forma.toFixed(1) + '/10 (7 da +1)'),
        `Daño ×${dmgMult.toFixed(2)} por tu confianza del pueblo (${Math.round(conf)})`,
        `Súper inicial ${Math.min(2, Math.floor(xpSem / 40))} carta(s) por ${Math.round(xpSem)} XP de registro esta semana`,
        `Disparo: ${shot.nombre}`
      ]
    };
  },
  // dificultad de cada jefe según tus datos reales (0,8 fácil … 1,4 difícil)
  bossScale(id) {
    const ok = D.hasApp(), hoyK = D.hoy();
    const lastDays = n => { const out = []; const d = new Date(); for (let i = 0; i < n; i++) { const x = new Date(d); x.setDate(d.getDate() - i); out.push(x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0')); } return out; };
    const toMin = s => { if (!s) return null; const [h, m] = s.split(':').map(Number); return h * 60 + m; };
    try {
      if (id === 'rasquina') {
        const dias = ok && state.piel ? state.piel.dias || {} : {};
        const v = lastDays(7).map(k => dias[k] && dias[k].picor).filter(x => typeof x === 'number');
        if (!v.length) return { difficulty: 1, razon: 'Sin datos de picor esta semana: dificultad normal' };
        const p = v.reduce((a, b) => a + b, 0) / v.length;
        return { difficulty: MG.clamp(.8 + p * .06, .8, 1.4), razon: `Tu picor promedio de 7 días es ${p.toFixed(1)}/10: entre más te pica, más fuerte viene` };
      }
      if (id === 'pantallon') {
        const dias = ok && state.piel ? state.piel.dias || {} : {};
        const v = lastDays(7).map(k => { const r = dias[k]; if (!r) return null; let a = toMin(r.pantalla), b = toMin(r.acostado); if (a == null || b == null) return null; let m = b - a; if (m < -720) m += 1440; return m >= 0 && m < 360 ? m : null; }).filter(x => x != null);
        if (!v.length) return { difficulty: 1, razon: 'Sin horas de pantalla esta semana: dificultad normal' };
        const m = v.reduce((a, b) => a + b, 0) / v.length;
        return { difficulty: m < 15 ? 1.35 : m < 45 ? 1.1 : .85, razon: `Sueltas la pantalla ${Math.round(m)} min antes de acostarte en promedio` };
      }
      if (id === 'gaston') {
        const movs = ok && state.plata ? state.plata.movs || [] : [];
        const mes = hoyK.slice(0, 7), d = new Date(); d.setMonth(d.getMonth() - 1);
        const ant = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
        const dia = Number(hoyK.slice(8));
        const g = m => movs.filter(x => x.tipo === 'gasto' && x.fecha && x.fecha.slice(0, 7) === m && (m !== ant || Number(x.fecha.slice(8)) <= dia)).reduce((s, x) => s + (Number(x.montoCLP) || 0), 0);
        const a = g(mes), b = g(ant);
        if (!b) return { difficulty: 1, razon: 'Sin gastos del mes pasado para comparar: dificultad normal' };
        const r = a / b;
        return { difficulty: MG.clamp(.85 + (r - .7) * .6, .85, 1.35), razon: `Llevas gastado ${Math.round(r * 100)} % de lo que gastabas a esta altura del mes pasado` };
      }
      if (id === 'flojera') {
        const ses = ok && state.gym ? state.gym.sesiones || [] : [];
        const d = new Date(); const wd = (d.getDay() + 6) % 7; d.setDate(d.getDate() - wd);
        const lunes = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
        const n = ses.filter(s => s.fecha >= lunes && s.fecha <= hoyK).length;
        return { difficulty: [1.35, 1.2, 1.05, .85][Math.min(3, n)], razon: `Llevas ${n} de 3 entrenos esta semana` };
      }
    } catch (e) { console.error(e); }
    return { difficulty: 1, razon: '' };
  },
  equip(id) { const v = D.store(); v.equipped = v.equipped === id ? null : id; D.persist(); },
  // puestos del pueblo (sombreros, tinturas, aura): lectura defensiva, puede no existir (dev.html)
  puestos() {
    try { const e = window.MODO_JUEGO && MODO_JUEGO.estado && MODO_JUEGO.estado(); return e && Array.isArray(e.puestos) ? e.puestos.slice() : []; }
    catch (e) { return []; }
  },
  // aspecto de Milo fuera y dentro de la pelea: ropa del bazar + equipo del pueblo
  look() { return { vestido: D.store().vestido, puestos: D.puestos() }; },
  // compra con baros reales (entra al mismo registro de compras de Milo). Compartida por amuletos, ataques y ropa.
  // key: lista del store donde queda el ítem; after(v): equipar al comprar, antes de guardar
  buyItem(item, key, after) {
    const v = D.store();
    if (!item) return { ok: false, msg: 'No existe' };
    if (v[key].includes(item.id)) return { ok: false, msg: 'Ya es tuyo' };
    if (D.baros() < item.precio) return { ok: false, msg: 'Te faltan baros' };
    if (D.hasApp()) {
      if (!state.game.compras) state.game.compras = [];
      state.game.compras.push({ itemId: 'v8-' + item.id, nombre: item.nombre, baros: item.precio, hp: 0, fecha: D.hoy(), at: Date.now() });
    } else v.devBaros = D.baros() - item.precio;
    v[key].push(item.id);
    if (after) after(v);
    D.persist();
    return { ok: true };
  },
  buyCharm(id) { return D.buyItem(MG.CHARMS.find(x => x.id === id), 'charms', v => { if (!v.equipped) v.equipped = id; }); },
  buyShot(id) { return D.buyItem(MG.SHOTS.find(x => x.id === id), 'shots', v => { v.shot = id; }); },
  buyRopa(id) { const r = MG.ROPA.find(x => x.id === id); return D.buyItem(r, 'ropa', v => { v.vestido[r.slot] = id; }); },
  equipShot(id) { const v = D.store(); if (!v.shots.includes(id)) return false; v.shot = id; D.persist(); return true; },
  // pone o quita la prenda en su ranura (la de la misma ranura se reemplaza sola)
  toggleRopa(id) {
    const v = D.store(), r = MG.ROPA.find(x => x.id === id); if (!r || !v.ropa.includes(id)) return false;
    v.vestido[r.slot] = v.vestido[r.slot] === id ? null : id; D.persist(); return true;
  },
  // nota estilo Cuphead
  grade(r) {
    // r: {time, parTime, hpLeft, maxHp, parries, exUsed, difficulty}
    let pts = 0;
    pts += MG.clamp(1 - (r.time - r.parTime) / r.parTime, 0, 1) * 30;
    pts += r.hpLeft / r.maxHp * 30;
    pts += Math.min(3, r.parries) / 3 * 20;
    pts += Math.min(3, r.exUsed) / 3 * 10;
    pts += MG.clamp((r.difficulty - .8) / .6, 0, 1) * 10;
    const scale = [[95, 'S'], [88, 'A+'], [80, 'A'], [72, 'A-'], [64, 'B+'], [56, 'B'], [48, 'B-'], [40, 'C+'], [30, 'C'], [0, 'D']];
    return { pts: Math.round(pts), letra: scale.find(x => pts >= x[0])[1] };
  },
  // guardar resultado + premio de baros (una vez al día por jefe)
  saveResult(bossId, res) {
    const v = D.store(), hoyK = D.hoy();
    const w = v.wins[bossId] = v.wins[bossId] || { wins: 0, best: null, bestPts: 0, bestTime: null, lastReward: null, tries: 0 };
    w.tries++;
    let reward = 0;
    if (res.won) {
      w.wins++;
      if (res.pts > w.bestPts) { w.bestPts = res.pts; w.best = res.letra; }
      if (w.bestTime == null || res.time < w.bestTime) w.bestTime = res.time;
      if (w.lastReward !== hoyK) {
        reward = Math.round(25 + res.pts * .55);
        w.lastReward = hoyK;
        if (D.hasApp()) { state.game.jefesLog = state.game.jefesLog || []; state.game.jefesLog.push({ fecha: hoyK, recompensa: reward, fuente: 'v8-' + bossId }); }
        else v.devBaros = D.baros() + reward;
      }
    }
    D.persist();
    return { reward, record: w };
  }
};

/* ============================ jefes: registro y base ============================ */
MG.bosses = {};
MG.registerBoss = function (def) { MG.bosses[def.id] = def; };

// Proyectil genérico. Los jefes pueden pasar draw/update propios.
MG.Projectile = class {
  constructor(o) {
    Object.assign(this, { x: 0, y: 0, vx: 0, vy: 0, r: 14, grav: 0, life: 12, pink: false, damage: 1, dead: false, rot: 0, spin: 0, color: '#d8432e', t: 0, bounce: 0 }, o);
  }
  update(dt, arena) {
    this.t += dt; this.life -= dt;
    this.vy += this.grav * dt; this.x += this.vx * dt; this.y += this.vy * dt; this.rot += this.spin * dt;
    if (this.bounce && this.y + this.r > arena.floorY && this.vy > 0) { this.y = arena.floorY - this.r; this.vy *= -this.bounce; }
    if (this.onUpdate) this.onUpdate(dt, arena);
    if (this.life <= 0 || this.x < -200 || this.x > W + 200 || this.y > H + 200 || this.y < -400) this.dead = true;
  }
  draw(ctx) {
    if (this.onDraw) return this.onDraw(ctx);
    A.blob(ctx, this.x, this.y, this.r, this.r, this.pink ? A.pink : this.color, { wob: this.r * .1, lw: 3, rot: this.rot });
  }
};

// Clase base de jefe: vida, fases, temporizadores, hurtboxes (donde le pegas) y hitboxes (lo que te daña al tocarlo)
MG.Boss = class {
  constructor(arena, opts) {
    opts = opts || {};
    this.arena = arena; this.difficulty = opts.difficulty || 1;
    this.maxHp = Math.round((opts.hp || 1200) * this.difficulty);
    this.hp = this.maxHp; this.phase = 1; this.phases = opts.phases || [.66, .33]; // umbrales de vida para pasar de fase
    this.x = opts.x || 980; this.y = opts.y || 420; this.t = 0; this.flash = 0;
    this.hurtboxes = []; this.hitboxes = []; this.dead = false; this.timers = []; this.state = 'idle';
  }
  // agenda una función: this.after(1.2, () => ...)
  after(sec, fn) { this.timers.push({ t: sec, fn }); }
  every(sec, fn) { const tick = () => { if (!this.dead) { fn(); this.after(sec / this.difficulty, tick); } }; this.after(sec / this.difficulty, tick); }
  clearTimers() { this.timers = []; }
  spawn(o) { const p = o instanceof MG.Projectile ? o : new MG.Projectile(o); this.arena.enemyProj.push(p); return p; }
  fx(e) { this.arena.effects.push(e); }
  takeDamage(n) {
    if (this.dead) return;
    this.hp = Math.max(0, this.hp - n); this.flash = .06;
    const ratio = this.hp / this.maxHp;
    while (this.phase - 1 < this.phases.length && ratio <= this.phases[this.phase - 1]) {
      this.phase++; this.clearTimers(); FX.shake(10, .5); FX.flash('#fff', .2);
      if (MG.audio) MG.audio.sfx('phase');
      if (this.onPhase) this.onPhase(this.phase);
    }
    if (this.hp <= 0) { this.dead = true; this.clearTimers(); if (this.onDeath) this.onDeath(); }
  }
  baseUpdate(dt) {
    this.t += dt; if (this.flash > 0) this.flash -= dt;
    for (const tm of this.timers.slice()) { tm.t -= dt; if (tm.t <= 0) { const i = this.timers.indexOf(tm); if (i >= 0) this.timers.splice(i, 1); tm.fn(); } }
  }
  update(dt) { this.baseUpdate(dt); }
  draw(ctx) {}
  drawBackground(ctx) { A.sky(ctx); }
  drawForeground(ctx) {}
};

/* ============================ escena: PELEA ============================ */
const FLOOR = 620;
let F = null;          // estado de la pelea
function newArena(bossId) {
  const def = MG.bosses[bossId];
  const sc = D.bossScale(bossId), ps = D.player();
  const arena = { W, H, floorY: FLOOR, t: 0, enemyProj: [], playerProj: [], effects: [], player: null, boss: null,
    stats: { parries: 0, exUsed: 0, hitsTaken: 0 }, def, scale: sc, pstats: ps };
  arena.onParry = p => { arena.stats.parries++; p.dead = true; FX.freeze(5); FX.flash(A.pink, .12); if (MG.audio) MG.audio.sfx('parry');
    arena.effects.push(starBurst(p.x, p.y, A.pink)); };
  arena.addEffect = e => arena.effects.push(e);
  arena.player = new MG.Player(arena, ps);
  arena.boss = def.create(arena, { difficulty: sc.difficulty });
  return arena;
}
function starBurst(x, y, color) {
  return { t: 0, dur: .45, update(dt) { this.t += dt; return this.t < this.dur; },
    draw(ctx) { const k = this.t / this.dur; for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + k; A.star(ctx, x + Math.cos(a) * 60 * k, y + Math.sin(a) * 60 * k, 14 * (1 - k) + 4, color, k * 4); } } };
}
MG.fx.starBurst = starBurst;

MG.scene('fight', {
  enter(p) {
    const id = p.bossId && MG.bosses[p.bossId] ? p.bossId : Object.keys(MG.bosses)[0];
    if (!id) { MG.go('title'); return; }
    if (!MG.Player) { console.error('[MG] falta player.js'); MG.go('title'); return; }
    F = { id, arena: newArena(id), mode: 'intro', t: 0, time: 0, endT: 0, menu: 0, crema: true };
    F.crema = F.arena.pstats.charm === 'crema';
    if (MG.audio) { MG.audio.music(F.arena.def.music || id); MG.audio.sfx('announcer'); }
  },
  exit() { F = null; },
  update(dt) {
    if (!F) return;
    const a = F.arena, pl = a.player, b = a.boss;
    F.t += dt; a.t += dt;
    if (I.pressed('pause') && (F.mode === 'fight' || F.mode === 'paused')) { F.mode = F.mode === 'paused' ? 'fight' : 'paused'; F.menu = 0; if (MG.audio && MG.audio.duck) MG.audio.duck(F.mode === 'paused'); return; }
    if (F.mode === 'paused') { pauseMenu(); return; }
    if (F.mode === 'lost') { lostMenu(); updateFx(a, dt); return; }
    // jugador bloqueado durante la intro
    const frozen = F.mode === 'intro';
    if (F.mode === 'intro' && F.t > 2.1) { F.mode = 'fight'; if (b.start) b.start(); }
    if (F.mode === 'fight') F.time += dt;
    pl.update(dt, frozen ? {} : I);
    if (F.mode !== 'intro') b.update(dt);
    else if (b.introUpdate) b.introUpdate(dt);
    // proyectiles
    for (const p of a.playerProj) p.update(dt, a);
    for (const p of a.enemyProj) p.update(dt, a);
    // balas del jugador → jefe
    if (!b.dead) for (const p of a.playerProj) {
      if (p.dead) continue;
      for (const h of b.hurtboxes) if (MG.hitCC(p, h)) {
        const dmg = (p.dmg || 4) * a.pstats.dmgMult;
        b.takeDamage(dmg); p.dead = true; if (p.onHit) p.onHit(a);
        if (pl.onBulletHit) pl.onBulletHit(dmg, p);
        break;
      }
    }
    // jefe → jugador (proyectiles y contacto)
    if (!pl.dead && !b.dead && F.mode === 'fight') {
      const hurt = pl.hurtbox();
      for (const p of a.enemyProj) if (!p.dead && !p.harmless && hurt && MG.hitCC(p, hurt)) { hitPlayer(p); if (!p.pierce) p.dead = true; break; }
      for (const h of b.hitboxes) if (hurt && (h.w ? MG.hitRC(h, hurt) : MG.hitCC(h, hurt))) { hitPlayer(null); break; }
    }
    a.playerProj = a.playerProj.filter(p => !p.dead);
    a.enemyProj = a.enemyProj.filter(p => !p.dead);
    updateFx(a, dt);
    // fin de pelea
    if (b.dead && F.mode === 'fight') {
      F.mode = 'ko'; F.endT = 0; FX.slowmo(.25, 1.1); FX.shake(16, 1); FX.flash('#fff', .35);
      a.enemyProj.forEach(p => p.dead = true);
      if (MG.audio) { MG.audio.sfx('knockout'); MG.audio.music(null); }
    }
    if (F.mode === 'ko') {
      F.endT += dt;
      if (F.endT > 3.2) {
        const r = { bossId: F.id, won: true, time: F.time, parTime: (F.arena.def.parTime || 120), hpLeft: pl.hp, maxHp: pl.maxHp,
          parries: a.stats.parries, exUsed: a.stats.exUsed, difficulty: a.scale.difficulty };
        Object.assign(r, D.grade(r)); Object.assign(r, D.saveResult(F.id, r));
        F.mode = 'done'; MG.go('results', r);
      }
    }
    if (pl.dead && F.mode === 'fight') {
      F.mode = 'dying'; F.endT = 0; FX.shake(8, .4);
      if (MG.audio) { MG.audio.sfx('death'); MG.audio.music(null); }
    }
    if (F.mode === 'dying') { F.endT += dt; if (F.endT > 1.4) { F.mode = 'lost'; F.menu = 0; D.saveResult(F.id, { won: false }); } }
  },
  draw(ctx) {
    if (!F) return;
    const a = F.arena;
    a.boss.drawBackground(ctx, a.t);
    for (const e of a.effects) if (e.back && e.draw) e.draw(ctx);
    a.boss.draw(ctx, a.t);
    for (const p of a.enemyProj) p.draw(ctx);
    a.player.draw(ctx);
    for (const p of a.playerProj) p.draw(ctx);
    for (const e of a.effects) if (!e.back && e.draw) e.draw(ctx);
    a.boss.drawForeground(ctx, a.t);
  },
  drawUI(ctx) {
    if (!F) return;
    const a = F.arena;
    if (MG.hud) MG.hud.draw(ctx, a.player, a);
    if (F.mode === 'intro') introCard(ctx, F.t, a);
    if (F.mode === 'ko') koCard(ctx, F.endT);
    if (F.mode === 'lost' || F.mode === 'dying') lostCard(ctx, F, a);
    if (F.mode === 'paused') pauseCard(ctx, F.menu);
  }
});
function updateFx(a, dt) { a.effects = a.effects.filter(e => e.update ? e.update(dt, a) !== false : false); }
function hitPlayer(p) {
  const a = F.arena, pl = a.player;
  if (pl.invuln && pl.invuln > 0) return;
  if (F.crema) { F.crema = false; a.onParry(p || { x: pl.x, y: pl.y - 60 }); pl.invuln = 1; return; }
  pl.hit(); a.stats.hitsTaken++;
  FX.shake(9, .3); FX.freeze(4);
  if (MG.audio) MG.audio.sfx('hurt');
}
const CARDS_IN = ['¡A POR ÉL!', '¡A NOQUEAR!', '¡SIN MIEDO, MILO!'];
function introCard(ctx, t, a) {
  const def = a.def;
  if (t < 1.1) {
    const k = MG.ease.outBack(MG.clamp(t / .35, 0, 1));
    A.text(ctx, def.nombre.toUpperCase(), W / 2, H * .36, 64 * k, { fill: A.gold });
    if (def.intro) A.text(ctx, '«' + def.intro + '»', W / 2, H * .36 + 70, 26, { font: 'ui', fill: A.cream });
  } else if (t < 2.1) {
    const k = MG.ease.outElastic(MG.clamp((t - 1.1) / .5, 0, 1));
    ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(-.06); ctx.scale(k, k);
    A.text(ctx, CARDS_IN[(def.nombre.length) % CARDS_IN.length], 0, 0, 120, { fill: A.cream, lw: 16 });
    ctx.restore();
  }
}
function koCard(ctx, t) {
  const k = MG.ease.outElastic(MG.clamp(t / .6, 0, 1));
  ctx.save(); ctx.globalAlpha = MG.clamp(t / .2, 0, 1) * .35; A.rays(ctx, W / 2, H / 2, A.gold, t); ctx.restore();
  ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(-.08); ctx.scale(k, k);
  A.text(ctx, '¡NOQUEADO!', 0, 0, 150, { fill: A.red, stroke: A.ink, lw: 20 });
  ctx.restore();
}
function lostCard(ctx, F, a) {
  const t = F.endT, k = MG.clamp(t / .5, 0, 1);
  ctx.save(); ctx.fillStyle = `rgba(20,10,0,${.55 * k})`; ctx.fillRect(0, 0, W, H); ctx.restore();
  if (F.mode !== 'lost') { A.text(ctx, '¡PERDISTE!', W / 2, H * .45, 130 * MG.ease.outBack(k), { fill: A.cream }); return; }
  A.text(ctx, '¡PERDISTE!', W / 2, H * .22, 100, { fill: A.cream });
  // barra de progreso: cuánto le faltó al jefe (como en Cuphead)
  const prog = 1 - a.boss.hp / a.boss.maxHp, x0 = 340, x1 = 940, y = H * .45;
  ctx.save(); ctx.lineWidth = 6; ctx.strokeStyle = A.ink; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke();
  ctx.strokeStyle = A.cream; ctx.lineWidth = 2; ctx.setLineDash([10, 8]); ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke(); ctx.restore();
  A.blob(ctx, x0 + (x1 - x0) * prog, y, 18, 18, A.milo, { lw: 3 });
  A.star(ctx, x1, y, 22, A.gold);
  A.text(ctx, `Le bajaste ${Math.round(prog * 100)} % de la vida`, W / 2, y + 55, 30, { font: 'ui' });
  const opts = ['REINTENTAR', 'VOLVER AL MAPA'];
  opts.forEach((o, i) => A.text(ctx, (F.menu === i ? '► ' : '') + o, W / 2, H * .68 + i * 62, F.menu === i ? 46 : 38, { font: 'ui', fill: F.menu === i ? A.gold : A.cream }));
}
function lostMenu() {
  if (I.pressed('up') || I.pressed('down')) { F.menu = 1 - F.menu; if (MG.audio) MG.audio.sfx('tick'); }
  if (MG.pointer && performance.now() - MG.pointer.t < 120) { const p = MG.pointer; MG.pointer = null; if (p.y > H * .62 && p.y < H * .73) F.menu = 0; else if (p.y > H * .73 && p.y < H * .84) F.menu = 1; else return; doLost(); return; }
  if (I.ok()) doLost();
}
function doLost() { if (F.menu === 0) MG.go('fight', { bossId: F.id }); else MG.go('map'); }
const PAUSE = ['CONTINUAR', 'REINTENTAR', 'VOLVER AL MAPA', 'SALIR DEL JUEGO'];
function pauseCard(ctx, sel) {
  ctx.save(); ctx.fillStyle = 'rgba(20,10,0,.6)'; ctx.fillRect(0, 0, W, H); ctx.restore();
  A.blob(ctx, W / 2, H / 2, 300, 230, A.paper, { wob: 2, lw: 6 });
  A.text(ctx, 'PAUSA', W / 2, H / 2 - 160, 60, { fill: A.red });
  PAUSE.forEach((o, i) => A.text(ctx, (sel === i ? '► ' : '') + o, W / 2, H / 2 - 70 + i * 62, sel === i ? 40 : 34, { font: 'ui', fill: sel === i ? A.gold : A.cream }));
}
function pauseMenu() {
  if (I.pressed('down')) { F.menu = (F.menu + 1) % PAUSE.length; if (MG.audio) MG.audio.sfx('tick'); }
  if (I.pressed('up')) { F.menu = (F.menu + PAUSE.length - 1) % PAUSE.length; if (MG.audio) MG.audio.sfx('tick'); }
  if (MG.pointer && performance.now() - MG.pointer.t < 120) {
    const p = MG.pointer; MG.pointer = null;
    const i = Math.round((p.y - (H / 2 - 70)) / 62); if (i >= 0 && i < PAUSE.length && Math.abs(p.x - W / 2) < 280) { F.menu = i; doPause(); } return;
  }
  if (I.ok()) doPause();
}
function doPause() {
  if (MG.audio && MG.audio.duck) MG.audio.duck(false);
  if (F.menu === 0) F.mode = 'fight';
  else if (F.menu === 1) MG.go('fight', { bossId: F.id });
  else if (F.menu === 2) MG.go('map');
  else MG.close();
}

// escena mínima de respaldo por si screens.js no cargó
MG.scene('title', MG.scene.title || {
  enter() {}, update() { if (I.ok()) { const id = Object.keys(MG.bosses)[0]; if (id) MG.go('fight', { bossId: id }); } },
  draw(ctx) { A.sky(ctx); A.text(ctx, 'MILO · EL GRAN NOQUEO', W / 2, H / 2, 72); A.text(ctx, 'toca para empezar', W / 2, H / 2 + 80, 30, { font: 'ui' }); }
});

/* ============================ estilos del contenedor ============================ */
const css = document.createElement('style');
css.textContent = `
@import url('https://fonts.googleapis.com/css2?family=Rye&family=Lilita+One&display=swap');
body.mg-open{overflow:hidden}
#mg-root{position:fixed;inset:0;z-index:99999;background:#0b0704;display:flex;align-items:center;justify-content:center;touch-action:none;user-select:none;-webkit-user-select:none}
#mg-canvas{display:block;image-rendering:auto;box-shadow:0 0 0 2px #000}
#mg-touch{position:absolute;inset:0;pointer-events:none}
#mg-touch .mg-b{pointer-events:auto;position:absolute;border:3px solid #1b120a;background:rgba(243,229,200,.8);color:#1b120a;font:16px 'Lilita One',sans-serif;border-radius:50%;width:64px;height:64px;display:flex;align-items:center;justify-content:center;touch-action:none;box-shadow:0 3px 0 #1b120a}
#mg-touch .mg-b:active{transform:translateY(2px);box-shadow:0 1px 0 #1b120a}
.mg-pad{position:absolute;left:18px;bottom:18px;width:200px;height:200px}
.mg-up{left:68px;top:0}.mg-down{left:68px;bottom:0}.mg-left{left:0;top:68px}.mg-right{right:0;top:68px}
.mg-acts{position:absolute;right:18px;bottom:18px;width:220px;height:200px}
.mg-jump{right:0;bottom:30px;width:84px!important;height:84px!important;background:rgba(255,95,162,.85)!important}
.mg-shoot{right:96px;bottom:0;width:78px!important;height:78px!important;font-size:13px!important}
.mg-dash{right:100px;bottom:96px}.mg-ex{right:10px;bottom:128px;background:rgba(242,193,78,.9)!important}
#mg-touch .mg-pause{right:16px;top:14px;width:46px;height:46px;border-radius:12px}
#mg-touch .mg-auto{right:72px;top:14px;width:64px;height:46px;border-radius:12px;font-size:13px}
#mg-touch .mg-auto.on{background:#f2c14e}
#mg-touch .mg-mute{right:144px;top:14px;width:46px;height:46px;border-radius:12px;font-size:20px}
#mg-touch .mg-mute.off{text-decoration:line-through;background:#c9bfa6}
/* fuera de la pelea solo quedan las flechas, el salto y la pausa (en el bazar ni eso: se toca la pantalla) */
#mg-root:not([data-scene="fight"]) .mg-acts .mg-ex, #mg-root:not([data-scene="fight"]) .mg-acts .mg-dash,
#mg-root:not([data-scene="fight"]) .mg-acts .mg-shoot, #mg-root:not([data-scene="fight"]) .mg-auto{display:none}
#mg-root[data-scene="shop"] .mg-pad, #mg-root[data-scene="shop"] .mg-acts, #mg-root[data-scene="shop"] .mg-pause,
#mg-root[data-scene="title"] .mg-pad, #mg-root[data-scene="title"] .mg-acts,
#mg-root[data-scene="results"] .mg-pad, #mg-root[data-scene="results"] .mg-acts{display:none}
#mg-root:not([data-scene="fight"]) .mg-mute{right:72px}
@media (hover:hover) and (pointer:fine){#mg-touch{display:none}}
.mg-rotate{display:none;position:absolute;inset:0;align-items:center;justify-content:center;text-align:center;color:#f3e5c8;font:22px 'Lilita One',sans-serif;background:rgba(11,7,4,.92);z-index:2;padding:30px}
#mg-root.mg-portrait .mg-rotate{display:flex}
#mg-root.mg-portrait.mg-force .mg-rotate{display:none}
#mg-root.mg-portrait #mg-touch .mg-b{width:54px;height:54px}
#mg-touch .mg-b{opacity:.62}
@media (max-height:500px){
  #mg-touch .mg-b{width:50px;height:50px;font-size:13px}
  .mg-pad{left:10px;bottom:8px;width:156px;height:156px}
  .mg-up{left:53px;top:0}.mg-down{left:53px;bottom:0}.mg-left{left:0;top:53px}.mg-right{right:0;top:53px}
  .mg-acts{right:10px;bottom:8px;width:180px;height:160px}
  .mg-jump{width:66px!important;height:66px!important;bottom:22px}
  .mg-shoot{right:74px;width:60px!important;height:60px!important;font-size:11px!important}
  .mg-dash{right:80px;bottom:72px}.mg-ex{right:8px;bottom:98px}
  #mg-touch .mg-pause{width:40px;height:40px}#mg-touch .mg-auto{width:56px;height:40px;right:64px}
  #mg-touch .mg-mute{width:40px;height:40px;right:128px}
  #mg-root:not([data-scene="fight"]) #mg-touch .mg-mute{right:64px}
}
`;
document.head.appendChild(css);
})();
