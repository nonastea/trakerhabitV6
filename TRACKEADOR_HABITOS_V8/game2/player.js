/* ==========================================================================
   MILO · EL GRAN NOQUEO — player.js : MG.Player + MG.hud
   Milo (frijol naranja, mochila enorme, brazos de manguera) dibujado por código.
   ========================================================================== */
(function () {
'use strict';
const MG = window.MG = window.MG || {};
const A = MG.art, W = MG.W || 1280, H = MG.H || 720;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const sfx = n => { try { MG.audio && MG.audio.sfx && MG.audio.sfx(n); } catch (e) {} };
const HOSE = A.hose ? '#f5d9a8' : '#f5d9a8';   // color de manguera (crema cálido)
const SHOE = '#2b1c14';
const PACK = '#8a5a2b', PACKD = '#5b3a1c';

/* ----------------------------- efectos sueltos ----------------------------- */
function sparkFx(x, y, color, big) {
  return { t: 0, dur: big ? .35 : .22,
    update(dt) { this.t += dt; return this.t < this.dur; },
    draw(ctx) {
      const k = this.t / this.dur, n = big ? 7 : 5, R = (big ? 40 : 24) * k + 4;
      ctx.save(); ctx.lineCap = 'round';
      for (let i = 0; i < n; i++) {
        const a = i / n * Math.PI * 2 + 0.4, r1 = R * .5, r2 = R * (1 + .4 * (i % 2));
        ctx.strokeStyle = A.ink; ctx.lineWidth = 7 * (1 - k) + 2;
        ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * r1, y + Math.sin(a) * r1); ctx.lineTo(x + Math.cos(a) * r2, y + Math.sin(a) * r2); ctx.stroke();
        ctx.strokeStyle = color || A.cream; ctx.lineWidth = 4 * (1 - k) + 1;
        ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * r1, y + Math.sin(a) * r1); ctx.lineTo(x + Math.cos(a) * r2, y + Math.sin(a) * r2); ctx.stroke();
      }
      ctx.restore();
    } };
}

/* ----------------------------- balas (ataques) ----------------------------- */
// El núcleo las trata igual: (x, y, r, dmg, dead, update(dt, arena), onHit(arena), draw(ctx)).
function fadeFx(x, y, color, r) {           // fin de alcance: se desinfla sin hacer daño
  return { t: 0, dur: .16, update(dt) { this.t += dt; return this.t < this.dur; },
    draw(ctx) { const k = this.t / this.dur; ctx.save(); ctx.globalAlpha = 1 - k; ctx.strokeStyle = A.ink; ctx.lineWidth = 3;
      ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, r * (1 - k * .5), 0, 7); ctx.fill(); ctx.stroke(); ctx.restore(); } };
}
function dropsFx(x, y, color) {              // salpicadura del chorro
  const ds = []; for (let i = 0; i < 7; i++) { const a = -Math.PI * (.1 + .8 * Math.random()) + (Math.random() - .5) * .6; const v = 160 + Math.random() * 190; ds.push({ vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: 3 + Math.random() * 3 }); }
  return { t: 0, dur: .34, update(dt) { this.t += dt; return this.t < this.dur; },
    draw(ctx) { const t = this.t; ctx.save(); ctx.lineWidth = 2.4; ctx.strokeStyle = A.ink; ctx.fillStyle = color;
      for (const d of ds) { ctx.globalAlpha = 1 - t / this.dur; ctx.beginPath(); ctx.arc(x + d.vx * t, y + d.vy * t + 900 * t * t, d.r * (1 - t / this.dur * .4), 0, 7); ctx.fill(); ctx.stroke(); }
      ctx.restore(); } };
}
class Bullet {                                // "dedazo": el disparo de siempre
  constructor(x, y, ang, spd) {
    this.x = x; this.y = y; this.r = 10; this.dmg = 4; this.dead = false;
    this.vx = Math.cos(ang) * spd; this.vy = Math.sin(ang) * spd; this.ang = ang; this.t = 0;
    this.seed = Math.random() * 50 | 0;
  }
  update(dt, arena) {
    this.t += dt; this.x += this.vx * dt; this.y += this.vy * dt;
    if (this.x < -60 || this.x > W + 60 || this.y < -60 || this.y > H + 60) this.dead = true;
    else if (this.y > arena.floorY && this.vy > 0) { this.dead = true; this.onHit(arena); }
  }
  onHit(arena) { arena.effects.push(sparkFx(this.x, this.y, A.gold)); }
  draw(ctx) { ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.ang); this.drawBody(ctx); ctx.restore(); }
  drawBody(ctx) {
    const r = this.r, w = A.j(this.seed, 1.2);
    // cola de gota
    ctx.beginPath(); ctx.moveTo(-r * 2.6, w); ctx.quadraticCurveTo(-r * .9, -r * 1.05, r * .2, -r); ctx.lineTo(r * .2, r); ctx.quadraticCurveTo(-r * .9, r * 1.05, -r * 2.6, w); ctx.closePath();
    ctx.fillStyle = A.cream; ctx.fill(); ctx.lineWidth = 3.5; ctx.strokeStyle = A.ink; ctx.lineJoin = 'round'; ctx.stroke();
    A.blob(ctx, r * .2, 0, r, r * .92, A.cream, { wob: .9, lw: 3.5, shade: false, seed: this.seed, points: 12 });
    ctx.fillStyle = A.gold; ctx.beginPath(); ctx.arc(r * .35, 0, r * .42, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.beginPath(); ctx.arc(r * .05, -r * .35, r * .2, 0, 7); ctx.fill();
  }
}
// bala con alcance limitado: muere al recorrer `range` px
class RangedBullet extends Bullet {
  constructor(x, y, ang, spd, range) { super(x, y, ang, spd); this.range = range; this.trav = 0; }
  update(dt, arena) {
    const x0 = this.x, y0 = this.y;
    super.update(dt, arena); if (this.dead) return;
    this.trav += Math.hypot(this.x - x0, this.y - y0);
    if (this.trav >= this.range) { this.dead = true; this.fizzle(arena); }
  }
  fizzle(arena) { arena.effects.push(fadeFx(this.x, this.y, A.cream, this.r)); }
}
// ABANICO: pétalos rosados, tres a la vez
class FanBullet extends RangedBullet {
  constructor(x, y, ang, spd) { super(x, y, ang, spd, 620); this.r = 9; this.dmg = 1.7; }
  onHit(arena) { arena.effects.push(sparkFx(this.x, this.y, A.pink)); }
  fizzle(arena) { arena.effects.push(fadeFx(this.x, this.y, A.pink, this.r)); }
  drawBody(ctx) {
    const r = this.r, w = A.j(this.seed, 1);
    ctx.beginPath(); ctx.moveTo(-r * 2.5, w); ctx.quadraticCurveTo(-r * .7, -r * 1.3, r * 1.2, 0); ctx.quadraticCurveTo(-r * .7, r * 1.3, -r * 2.5, w); ctx.closePath();
    ctx.fillStyle = A.pink; ctx.fill(); ctx.lineWidth = 3.2; ctx.strokeStyle = A.ink; ctx.lineJoin = 'round'; ctx.stroke();
    ctx.fillStyle = '#ffd3e6'; ctx.beginPath(); ctx.ellipse(-r * .5, -r * .12, r * .85, r * .38, 0, 0, 7); ctx.fill();
    ctx.fillStyle = A.cream; ctx.beginPath(); ctx.arc(r * .45, 0, r * .28, 0, 7); ctx.fill();
  }
}
// GOTA BUSCADORA: lenta, gira suavemente hacia la hurtbox más cercana
class SeekBullet extends Bullet {
  constructor(x, y, ang, spd) { super(x, y, ang, spd); this.r = 11; this.dmg = 3.2; this.spd = spd; this.age = 0; this.trail = []; }
  update(dt, arena) {
    this.age += dt;
    const b = arena.boss; let tg = null, bd = 1e12;
    if (b && !b.dead && b.hurtboxes) for (const h of b.hurtboxes) { const d = (h.x - this.x) ** 2 + (h.y - this.y) ** 2; if (d < bd) { bd = d; tg = h; } }
    if (tg) {
      let da = Math.atan2(tg.y - this.y, tg.x - this.x) - this.ang; da = Math.atan2(Math.sin(da), Math.cos(da));
      const m = 4 * dt; this.ang += clamp(da, -m, m);
      this.vx = Math.cos(this.ang) * this.spd; this.vy = Math.sin(this.ang) * this.spd;
    }
    this.trail.push(this.x, this.y); if (this.trail.length > 14) this.trail.splice(0, 2);
    super.update(dt, arena);
    if (!this.dead && this.age > 3.2) { this.dead = true; arena.effects.push(fadeFx(this.x, this.y, '#8fd0e6', this.r)); }
  }
  onHit(arena) { arena.effects.push(sparkFx(this.x, this.y, '#8fd0e6')); }
  draw(ctx) {
    ctx.save();
    for (let i = 0, n = this.trail.length / 2; i < n; i++) {
      const k = (i + 1) / n; ctx.globalAlpha = k * .5; ctx.fillStyle = '#9fd8ea'; ctx.beginPath(); ctx.arc(this.trail[i * 2], this.trail[i * 2 + 1], this.r * .75 * k, 0, 7); ctx.fill();
    }
    ctx.restore();
    super.draw(ctx);
  }
  drawBody(ctx) {
    const r = this.r, w = A.j(this.seed, 1);
    ctx.beginPath(); ctx.moveTo(-r * 2.4, w); ctx.quadraticCurveTo(-r * .9, -r * 1.1, r * 1.1, -r * .1); ctx.arc(r * .1, 0, r * 1.05, -.2, .2, false);
    ctx.quadraticCurveTo(-r * .9, r * 1.1, -r * 2.4, w); ctx.closePath();
    ctx.fillStyle = '#4fa3c7'; ctx.fill(); ctx.lineWidth = 3.4; ctx.strokeStyle = A.ink; ctx.lineJoin = 'round'; ctx.stroke();
    ctx.fillStyle = '#bfeaf6'; ctx.beginPath(); ctx.ellipse(-r * .15, -r * .35, r * .55, r * .24, -.3, 0, 7); ctx.fill();
    ctx.strokeStyle = A.cream; ctx.lineWidth = 2.2; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(r * .2, r * .05, r * .42, 2.4, 5.4); ctx.stroke();   // espiral
    ctx.fillStyle = A.ink; ctx.beginPath(); ctx.arc(r * .55, r * .15, r * .13, 0, 7); ctx.fill();
  }
}
// CHORRO A PRESIÓN: cápsula de agua, corto alcance
class JetBullet extends RangedBullet {
  constructor(x, y, ang, spd) { super(x, y, ang, spd, 380); this.r = 11; this.dmg = 5.2; }
  onHit(arena) { arena.effects.push(dropsFx(this.x, this.y, '#8fd3ea')); }
  fizzle(arena) { arena.effects.push(dropsFx(this.x, this.y, '#8fd3ea')); }
  drawBody(ctx) {
    const r = this.r, w = A.j(this.seed, 1.4);
    ctx.beginPath(); ctx.moveTo(-r * 3.4, w * .6); ctx.quadraticCurveTo(-r * 1.5, -r * 1.2, r * .4, -r * 1.05); ctx.arc(r * .4, 0, r * 1.05, -Math.PI / 2, Math.PI / 2);
    ctx.quadraticCurveTo(-r * 1.5, r * 1.2, -r * 3.4, w * .6); ctx.closePath();
    ctx.fillStyle = '#7fc9e6'; ctx.fill(); ctx.lineWidth = 3.4; ctx.strokeStyle = A.ink; ctx.lineJoin = 'round'; ctx.stroke();
    ctx.strokeStyle = '#e9fbff'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-r * 2.6, -r * .45); ctx.lineTo(r * .5, -r * .5); ctx.stroke();
    ctx.fillStyle = '#e9fbff'; ctx.strokeStyle = A.ink; ctx.lineWidth = 2;
    for (const [dx, dy, rr] of [[-r * 3.2, -r * .9 + w, 2.6], [-r * 4.2, r * .6 - w, 2.2]]) { ctx.beginPath(); ctx.arc(dx, dy, rr, 0, 7); ctx.fill(); ctx.stroke(); }
  }
}
// especificación de cada ataque: cadencia, color de la chispa de la boca y cómo se dispara
const SHOT = {
  dedazo: { gap: 1 / 9, col: A.gold, fire(ar, m, ang) { ar.playerProj.push(new Bullet(m.x, m.y, ang + MG.rand(-.025, .025), 1100)); } },
  abanico: { gap: 1 / 9, col: A.pink, fire(ar, m, ang) { const j = MG.rand(-.02, .02); for (const d of [-.22, 0, .22]) ar.playerProj.push(new FanBullet(m.x, m.y, ang + d + j, 1100)); } },
  buscadora: { gap: 1 / 7, col: '#8fd0e6', fire(ar, m, ang) { ar.playerProj.push(new SeekBullet(m.x, m.y, ang + MG.rand(-.05, .05), 700)); } },
  chorro: { gap: 1 / 10, col: '#8fd3ea', fire(ar, m, ang) { ar.playerProj.push(new JetBullet(m.x, m.y, ang + MG.rand(-.04, .04), 1000)); } }
};
// ícono para la tienda: dibuja el ataque centrado en el origen apuntando a la derecha
const ICON = {};
MG.shotIcon = function (ctx, id, s, t) {
  s = s || 1;
  const mk = () => ({ dedazo: () => new Bullet(0, 0, 0, 0), abanico: () => new FanBullet(0, 0, 0, 0), buscadora: () => new SeekBullet(0, 0, 0, 0), chorro: () => new JetBullet(0, 0, 0, 0) })[id];
  const f = mk(); if (!f) return;
  const b = ICON[id] || (ICON[id] = f());
  ctx.save(); ctx.scale(s, s);
  if (id === 'dedazo') { ctx.translate(11, 0); fingerHand(ctx, -34, 3, 0); ctx.translate(16 + Math.sin((t || 0) * 6) * 3, 0); b.drawBody(ctx); }
  else if (id === 'abanico') { for (const d of [-.5, 0, .5]) { ctx.save(); ctx.translate(-16, 0); ctx.rotate(d); ctx.translate(18, 0); b.drawBody(ctx); ctx.restore(); } }
  else if (id === 'buscadora') { for (let i = 1; i <= 4; i++) { ctx.globalAlpha = .12 + i * .1; ctx.fillStyle = '#9fd8ea'; ctx.beginPath(); ctx.arc(-12 - (5 - i) * 7, Math.sin(((t || 0) * 3) + i) * 3, 3 + i * 1.6, 0, 7); ctx.fill(); } ctx.globalAlpha = 1; ctx.translate(22, 0); b.drawBody(ctx); }
  else { ctx.translate(14, 0); b.drawBody(ctx); }
  ctx.restore();
};

/* ----------------------------- EX: el mochilazo ----------------------------- */
// El núcleo solo prueba (x,y,r) contra el jefe y marca dead=true; aquí lo esquivamos:
// la posición real es (px,py); mientras "enfría" x,y se esconden lejos y al pegar revivimos la mochila.
class Pack {
  constructor(x, y, dir) {
    this.px = x; this.py = y; this.x = x; this.y = y; this.r = 40; this.dmg = 36; this.dead = false;
    this.vx = dir * 820; this.dir = dir; this.rot = 0; this.cool = 0; this.t = 0; this.noCharge = true; this.life = 2.4;
  }
  update(dt, arena) {
    this.t += dt; this.life -= dt; this.px += this.vx * dt; this.rot += dt * 16 * this.dir;
    if (this.cool > 0) this.cool -= dt;
    if (this.cool > 0) { this.x = -9999; this.y = -9999; } else { this.x = this.px; this.y = this.py; }
    if (this.px < -150 || this.px > W + 150 || this.life <= 0) this.dead = true;
  }
  onHit(arena) {
    this.dead = false; this.cool = .22;
    arena.effects.push(sparkFx(this.px, this.py, A.gold, true));
    MG.fx.shake(7, .15); MG.fx.freeze(3);
  }
  draw(ctx) {
    const x = this.px, y = this.py;
    ctx.save(); ctx.strokeStyle = 'rgba(255,246,223,.8)'; ctx.lineCap = 'round';
    for (let i = 0; i < 4; i++) { ctx.lineWidth = 5 - i; const yy = y - 36 + i * 24; ctx.beginPath(); ctx.moveTo(x - this.dir * 50, yy); ctx.lineTo(x - this.dir * (110 + i * 18 + A.j(i, 8)), yy); ctx.stroke(); }
    ctx.restore();
    ctx.save(); ctx.translate(x, y); ctx.rotate(this.rot);
    A.blob(ctx, 0, 0, 34, 42, PACK, { wob: 1.6, lw: 5, seed: 3 });
    A.blob(ctx, 0, -14, 28, 17, PACKD, { wob: 1, lw: 3.5, shade: false, seed: 9, points: 14 });
    ctx.fillStyle = A.gold; ctx.strokeStyle = A.ink; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.rect(-6, -6, 12, 12); ctx.fill(); ctx.stroke();
    ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-34, 4); ctx.quadraticCurveTo(-48, 18, -34, 32); ctx.stroke();
    ctx.restore();
  }
}

/* ----------------------------- SÚPER: rayo enorme ----------------------------- */
// Hace su propio daño por ticks (el núcleo mataría un proyectil al primer contacto).
class Beam {
  constructor(player, x, y, dir) {
    this.pl = player; this.bx = x; this.by = y; this.dir = dir; this.x = -9999; this.y = -9999; this.r = 1; this.dmg = 0;
    this.dead = false; this.t = 0; this.dur = 1.2; this.tick = 0; this.noCharge = true;
  }
  band() { const k = this.t / this.dur, grow = clamp(this.t / .1, 0, 1), fade = clamp((this.dur - this.t) / .2, 0, 1);
    return 70 * grow * Math.min(1, fade + .15) * (1 + Math.sin(this.t * 40) * .06); }
  update(dt, arena) {
    this.t += dt; this.tick -= dt;
    this.by = this.pl.y - 68 - this.pl.lift; this.bx = this.pl.x + this.dir * 56;
    if (this.tick <= 0) {
      this.tick = .08; const b = arena.boss, h2 = this.band() / 2 + 6;
      if (b && !b.dead) for (const hb of b.hurtboxes) {
        const ahead = this.dir > 0 ? hb.x + hb.r > this.bx : hb.x - hb.r < this.bx;
        if (ahead && Math.abs(hb.y - this.by) < hb.r + h2) {
          b.takeDamage(13 * (arena.pstats.dmgMult || 1)); arena.effects.push(sparkFx(hb.x - this.dir * hb.r * .6, this.by + MG.rand(-30, 30), A.gold));
          MG.fx.shake(4, .1); break;
        }
      }
    }
    if (this.t >= this.dur) this.dead = true;
  }
  onHit() {}
  draw(ctx) {
    const hh = this.band() / 2; if (hh < 2) return;
    const x0 = this.bx, x1 = this.dir > 0 ? W + 40 : -40, y = this.by;
    const lay = [[hh, A.ink, 6], [hh - 4, A.red, 0], [hh * .72, A.orange, 0], [hh * .5, A.gold, 0], [hh * .26, A.cream, 0]];
    ctx.save();
    for (const [h, col] of lay) {
      ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x0, y - h);
      const n = 14; for (let i = 0; i <= n; i++) { const xx = x0 + (x1 - x0) * i / n; ctx.lineTo(xx, y - h + A.j(i + (h | 0), 3.5)); }
      for (let i = n; i >= 0; i--) { const xx = x0 + (x1 - x0) * i / n; ctx.lineTo(xx, y + h + A.j(i + 20 + (h | 0), 3.5)); }
      ctx.closePath(); ctx.fill();
    }
    ctx.lineWidth = 5; ctx.strokeStyle = A.ink; ctx.lineJoin = 'round';
    for (const s of [-1, 1]) { ctx.beginPath(); for (let i = 0; i <= 14; i++) { const xx = x0 + (x1 - x0) * i / 14, yy = y + s * (hh + 2) + A.j(i + 40, 3); i ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); } ctx.stroke(); }
    A.blob(ctx, x0, y, hh * 1.25, hh * 1.25, A.cream, { wob: 4, lw: 5, shade: false });
    A.blob(ctx, x0, y, hh * .8, hh * .8, A.gold, { wob: 3, lw: 0, line: false, shade: false });
    for (let i = 0; i < 6; i++) { const xx = x0 + this.dir * ((this.t * 900 + i * 230) % (W + 100)); A.star(ctx, xx, y + Math.sin(i * 7 + this.t * 20) * hh * 1.4, 10, i % 2 ? A.gold : A.cream, this.t * 6 + i); }
    ctx.restore();
  }
}

/* ============================== ROPA Y EQUIPO (MG.wear) ============================== */
// Prendas dibujadas en el sistema de coordenadas del cuerpo de Milo de la pelea: origen = centro del cuerpo,
// mirando a la derecha (rx 38, ry 42; ojos en (8,-12) y (26,-9)). screens.js las reutiliza escaladas (.83) en drawMilo.
const WEAR = MG.wear = {};
const TINTS = {
  'tint-blue': { body: '#4c93cf', dark: '#2b5f93', belly: 'rgba(205,232,255,.55)' },
  'tint-green': { body: '#79b94e', dark: '#46802f', belly: 'rgba(225,250,190,.55)' }
};
// colores del cuerpo según las tinturas del pueblo (el mechón usa el tono oscuro)
WEAR.palette = function (puestos) {
  puestos = puestos || [];
  for (const k of ['tint-blue', 'tint-green']) if (puestos.indexOf(k) > -1) return TINTS[k];
  return { body: A.milo, dark: A.miloDark, belly: 'rgba(255,214,150,.55)' };
};
// qué va en la cabeza: el gorro del bazar gana al sombrero/corona del pueblo
WEAR.headgear = function (ves, puestos) {
  if (ves && ves.cabeza === 'gorro') return 'gorro';
  puestos = puestos || [];
  if (puestos.indexOf('hat-gold') > -1) return 'gold';
  if (puestos.indexOf('hat-brown') > -1) return 'brown';
  return null;
};
let AURA = null;
WEAR.aura = function (ctx, t) {            // halo morado suave (sprite cacheado, sin gradientes por frame)
  if (!AURA) {
    AURA = document.createElement('canvas'); AURA.width = AURA.height = 256;
    const x = AURA.getContext('2d'), g = x.createRadialGradient(128, 128, 14, 128, 128, 126);
    g.addColorStop(0, 'rgba(186,126,240,.78)'); g.addColorStop(.5, 'rgba(164,99,214,.36)'); g.addColorStop(1, 'rgba(164,99,214,0)');
    x.fillStyle = g; x.fillRect(0, 0, 256, 256);
  }
  const k = 1 + Math.sin(t * 3) * .05, sz = 236 * k;
  ctx.save(); ctx.globalAlpha = .8 + Math.sin(t * 3) * .12; ctx.drawImage(AURA, -sz / 2, -sz / 2, sz, sz);
  ctx.globalAlpha = .85; ctx.fillStyle = '#e4ccff';
  for (let i = 0; i < 5; i++) { const a = t * 1.3 + i * 1.2566, rr2 = 62 + Math.sin(t * 2 + i) * 6; ctx.beginPath(); ctx.arc(Math.cos(a) * rr2, Math.sin(a) * rr2 * .9, 2.6 + (i % 2), 0, 7); ctx.fill(); }
  ctx.restore();
};
WEAR.hat = function (ctx, kind, o) {
  o = o || {}; const sway = o.sway || 0;
  ctx.save(); ctx.lineJoin = 'round'; ctx.strokeStyle = A.ink; ctx.lineWidth = 4;
  if (kind === 'gorro') {
    ctx.translate(3, -33); ctx.rotate(.05);
    const dome = new Path2D(); dome.moveTo(-29, 3); dome.bezierCurveTo(-34, -36, 34, -36, 29, 3); dome.closePath();
    ctx.fillStyle = '#3f7fb5'; ctx.fill(dome); ctx.stroke(dome);
    ctx.save(); ctx.clip(dome); ctx.strokeStyle = 'rgba(255,255,255,.3)'; ctx.lineWidth = 3;
    for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(k * 11, 4); ctx.quadraticCurveTo(k * 9, -14, k * 5, -30); ctx.stroke(); }
    ctx.fillStyle = 'rgba(40,20,10,.14)'; ctx.fillRect(8, -40, 40, 50); ctx.restore();
    rr(ctx, -31, -3, 62, 14, 6); ctx.fillStyle = A.cream; ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(27,18,10,.3)'; ctx.lineWidth = 2; for (let k = -3; k <= 3; k++) { ctx.beginPath(); ctx.moveTo(k * 8.5, -1); ctx.lineTo(k * 8.5, 9); ctx.stroke(); }
    // pompón
    const px = 1 + sway * .5, py = -37 + Math.abs(sway) * -.25;
    ctx.strokeStyle = A.ink; ctx.lineWidth = 3.5; ctx.fillStyle = '#d8432e'; ctx.beginPath(); ctx.arc(px, py, 9.5, 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.beginPath(); ctx.arc(px - 3, py - 3, 3, 0, 7); ctx.fill();
  } else if (kind === 'brown') {
    ctx.translate(3, -29); ctx.rotate(-.04);
    ctx.fillStyle = '#6b4326'; ctx.beginPath(); ctx.ellipse(0, 3, 45, 9.5, 0, 0, 7); ctx.fill(); ctx.stroke();
    const crown = new Path2D(); crown.moveTo(-25, 2); crown.quadraticCurveTo(-28, -24, -12, -30); crown.quadraticCurveTo(0, -24, 12, -30); crown.quadraticCurveTo(28, -24, 25, 2); crown.closePath();
    ctx.fillStyle = '#7d5230'; ctx.fill(crown); ctx.stroke(crown);
    ctx.save(); ctx.clip(crown); ctx.fillStyle = '#2b1a0e'; ctx.fillRect(-30, -12, 60, 9); ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(-20, -30, 7, 24); ctx.restore();
    ctx.fillStyle = A.gold; ctx.lineWidth = 2.4; rr(ctx, -5, -12, 10, 9, 2); ctx.fill(); ctx.stroke();
  } else if (kind === 'gold') {
    ctx.translate(3, -29); ctx.rotate(-.05);
    ctx.beginPath(); ctx.moveTo(-27, 5); ctx.lineTo(-29, -28); ctx.lineTo(-14, -13); ctx.lineTo(0, -38); ctx.lineTo(14, -13); ctx.lineTo(29, -28); ctx.lineTo(27, 5); ctx.closePath();
    ctx.fillStyle = A.gold; ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(-24, -8, 48, 4);
    ctx.lineWidth = 2.4;
    for (const [gx, col] of [[-14, A.red], [0, A.blue], [14, A.green]]) { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(gx, 0, 4, 0, 7); ctx.fill(); ctx.stroke(); }
    ctx.fillStyle = A.cream; for (const [gx, gy] of [[-29, -29], [0, -39], [29, -29]]) { ctx.beginPath(); ctx.arc(gx, gy, 4, 0, 7); ctx.fill(); ctx.stroke(); }
  }
  ctx.restore();
};
WEAR.glasses = function (ctx, o) {
  ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.strokeStyle = A.ink; ctx.lineWidth = 4.5; ctx.beginPath(); ctx.moveTo(-2, -14); ctx.lineTo(-17, -20); ctx.stroke();   // patilla
  for (const [x, y, rx, ry] of [[9, -12, 12, 10.5], [27.5, -9, 10, 9.2]]) {
    ctx.fillStyle = '#242b3d'; ctx.strokeStyle = A.ink; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, 7); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(x - rx * .5, y - ry * .15); ctx.lineTo(x - rx * .1, y - ry * .55); ctx.stroke();
  }
  ctx.strokeStyle = A.ink; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(19, -15); ctx.quadraticCurveTo(21.5, -17, 19, -9); ctx.stroke();   // puente
  ctx.restore();
};
WEAR.scarf = function (ctx, o) {
  const t = o.t || 0, b = o.b || 0, v = o.v || 0, w = Math.sin(t * 8) * (1 + b * 3);
  const ex = -34 - b * 26 + w, ey = 36 - v * 12 + (1 - b) * 3;
  const band = () => { ctx.beginPath(); ctx.moveTo(-36, 6); ctx.quadraticCurveTo(0, 26, 37, 5); };
  const tail = () => { ctx.beginPath(); ctx.moveTo(-22, 14); ctx.quadraticCurveTo(-32 - b * 12, 22 + w, ex, ey); };
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.strokeStyle = A.ink; ctx.lineWidth = 17; band(); ctx.stroke(); tail(); ctx.stroke();
  ctx.strokeStyle = '#5f9e47'; ctx.lineWidth = 11; band(); ctx.stroke(); tail(); ctx.stroke();
  ctx.lineCap = 'butt'; ctx.strokeStyle = A.cream; ctx.lineWidth = 11; ctx.setLineDash([5, 8]); band(); ctx.stroke(); tail(); ctx.stroke(); ctx.setLineDash([]);
  ctx.strokeStyle = A.ink; ctx.lineWidth = 3; ctx.lineCap = 'round';      // flecos
  for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(ex + i * 4, ey + 4); ctx.lineTo(ex + i * 5 + w * .3, ey + 12); ctx.stroke(); }
  ctx.restore();
};
WEAR.cape = function (ctx, o) {
  const t = o.t || 0, b = o.b || 0, v = o.v || 0;
  const w1 = Math.sin(t * 7) * (2 + b * 5), w2 = Math.sin(t * 7 + 1.3) * (3 + b * 6), lift = -v * 14;
  ctx.save(); ctx.lineJoin = 'round';
  const bx = -78 - b * 40 + w2, by = 32 + lift;
  ctx.beginPath(); ctx.moveTo(-6, -36);
  ctx.bezierCurveTo(-44 - b * 8, -38, -72 - b * 22 + w1, -8, bx, by);
  ctx.quadraticCurveTo(-60 - b * 26, 54 + lift + w1, -38 - b * 14, 46 + lift * .7 + w2 * .3);
  ctx.quadraticCurveTo(-18 - b * 8, 52 + lift * .6, 2, 38 + lift * .4);
  ctx.lineTo(4, -10); ctx.closePath();
  ctx.fillStyle = '#c8402c'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = A.ink; ctx.stroke();
  ctx.save(); ctx.clip();
  ctx.fillStyle = 'rgba(70,10,5,.22)'; ctx.beginPath(); ctx.moveTo(-30, -30); ctx.lineTo(-50 - b * 20 + w1, 60 + lift); ctx.lineTo(10, 60); ctx.lineTo(10, -30); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(255,200,170,.35)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-26, -30); ctx.quadraticCurveTo(-60 - b * 14, 0, -66 - b * 30 + w1, 34 + lift); ctx.stroke();
  ctx.restore();
  ctx.strokeStyle = A.gold; ctx.lineWidth = 3.5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(bx + 2, by + 6); ctx.quadraticCurveTo(-60 - b * 26, 54 + lift + w1, -38 - b * 14, 46 + lift * .7 + w2 * .3); ctx.stroke();   // ribete dorado
  ctx.restore();
};

/* ============================== PLAYER ============================== */
const SPEED = 430, GRAV = 2500, JUMP_V = 960, FALL_MAX = 1350;
const DASH_T = .22, DASH_DIST = 260, DASH_CD = .32;

class Player {
  constructor(arena, pstats) {
    this.arena = arena; this.pstats = pstats || {};
    this.x = 220; this.y = arena.floorY; this.vx = 0; this.vy = 0; this.facing = 1;
    this.maxHp = this.pstats.maxHp || 3; this.hp = this.maxHp; this.invuln = 0; this.dead = false;
    this.superMeter = this.pstats.superStart || 0; this.onGround = true;
    // estado interno
    this.t = 0; this.coyote = 0; this.jbuf = 0; this.ducking = false; this.lift = 0;
    this.dashT = 0; this.dashCd = 0; this.dashDir = 1; this.airDash = true; this.parryOk = true;
    this.shootCd = 0; this.shots = 0; this.muzzle = 0; this.aim = 0; this.aiming = false; this.aimT = 0;
    this.sq = 0; this.sqv = 0; this.runPh = 0; this.blinkT = 2.4; this.blink = 0;
    this.hurtT = 0; this.stun = 0; this.spinT = 0; this.packGone = 0; this.throwT = 0;
    this.superT = 0; this.superWind = 0; this.deathT = 0; this.parts = []; this.lines = []; this.lean = 0;
    this.jumping = false; this.stepAcc = 0; this.hair = 0; this.hairv = 0;
    // ataque equipado y aspecto (ropa del bazar + equipo del pueblo)
    this.shotKind = SHOT[this.pstats.shot] ? this.pstats.shot : 'dedazo'; this.muzzleCol = SHOT[this.shotKind].col;
    this.ves = this.pstats.vestido || {}; this.puestos = this.pstats.puestos || [];
    this.pal = MG.wear.palette(this.puestos); this.hat = MG.wear.headgear(this.ves, this.puestos);
  }
  get charm() { return this.pstats.charm; }
  hurtbox() {
    if (this.dead || this.superT > 0) return null;
    if (this.dashT > 0 && this.charm === 'humo') return null;
    if (this.ducking) return { x: this.x, y: this.y - 26, r: 26 };
    return { x: this.x, y: this.y - 62, r: 33 };
  }
  puff(x, y, r, vx, vy, dur) { this.parts.push({ k: 'puff', x, y, r, vx: vx || 0, vy: vy || 0, t: 0, dur: dur || .4 }); }
  hit() {
    if (this.invuln > 0 || this.dead) return;
    this.hp--; this.invuln = 1.6; this.hurtT = .5; this.stun = .22; this.dashT = 0; this.throwT = 0;
    this.vx = -this.facing * 340; this.vy = -430; this.onGround = false; this.sq = -.3; this.sqv = 0; this.ducking = false;
    this.arena.effects.push(sparkFx(this.x, this.y - 70, A.red, true));
    if (this.hp <= 0) { this.hp = 0; this.dead = true; this.deathT = 0; this.invuln = 0; this.superT = 0; sfx('death'); }
    else sfx('hurt');
  }
  onBulletHit(dmg, p) {
    if (p && p.noCharge) return;
    this.superMeter = clamp(this.superMeter + (dmg || 0) / 90, 0, 5);
  }
  addCard(n) { this.superMeter = clamp(this.superMeter + n, 0, 5); }

  update(dt, inp) {
    inp = inp || {};
    const is = a => !!(inp.is && inp.is(a)), pr = a => !!(inp.pressed && inp.pressed(a)), rel = a => !!(inp.released && inp.released(a));
    const ar = this.arena; this.t += dt;
    // partículas y líneas
    for (const p of this.parts) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; }
    this.parts = this.parts.filter(p => p.t < p.dur);
    for (const l of this.lines) l.t += dt;
    this.lines = this.lines.filter(l => l.t < .25);
    // spring squash/stretch
    const tgt = this.ducking ? .38 : this.onGround ? Math.sin(this.t * 3.4) * .018 : (this.vy < 0 ? this.vy / 3200 : Math.min(.16, this.vy / 6500));
    this.sqv += (-(this.sq - tgt) * 420 - this.sqv * 15) * dt; this.sq += this.sqv * dt;
    // mechón con inercia
    this.hairv += (-this.hair * 190 - this.hairv * 8 - this.vx * .35 + this.vy * -.05) * dt; this.hair += this.hairv * dt; this.hair = clamp(this.hair, -14, 14);
    // parpadeo
    this.blinkT -= dt; if (this.blinkT <= 0) { this.blink = .13; this.blinkT = 2.6 + Math.random() * 1.2; }
    if (this.blink > 0) this.blink -= dt;
    if (this.invuln > 0) this.invuln = Math.max(0, this.invuln - dt);
    if (this.hurtT > 0) this.hurtT -= dt;
    if (this.spinT > 0) this.spinT -= dt;
    if (this.packGone > 0) this.packGone -= dt;
    if (this.throwT > 0) this.throwT -= dt;
    if (this.muzzle > 0) this.muzzle -= dt;
    if (this.charm === 'cafe' && !this.dead) this.superMeter = clamp(this.superMeter + .08 * dt, 0, 5);

    /* ---- muerte: fantasmita ---- */
    if (this.dead) {
      this.deathT += dt; this.vx = 0;
      return;
    }
    /* ---- súper en curso ---- */
    if (this.superT > 0) {
      this.superT -= dt; this.vx = 0; this.vy = 0;
      const k = 1 - this.superT / 1.5;
      this.lift = Math.sin(clamp(k * 3, 0, 1) * Math.PI / 2) * 26 * (this.superT > .25 ? 1 : this.superT / .25);
      if (this.superWind > 0) { this.superWind -= dt;
        if (this.superWind <= 0) { ar.playerProj.push(new Beam(this, this.x, this.y, this.facing)); MG.fx.shake(9, 1.1); sfx('ex'); } }
      if (this.superT <= 0) { this.lift = 0; this.invuln = Math.max(this.invuln, .4); this.sq = .3; this.vy = 0; }
      return;
    }
    this.lift = 0;
    if (this.stun > 0) this.stun -= dt;
    const canAct = this.stun <= 0;

    /* ---- lectura de entrada ---- */
    const L = is('left'), R = is('right'), U = is('up'), D = is('down'), lock = is('lock') && canAct;
    let dirx = canAct ? (R ? 1 : 0) - (L ? 1 : 0) : 0;
    this.ducking = this.onGround && D && canAct && this.dashT <= 0 && !lock;

    /* ---- dash ---- */
    if (this.dashCd > 0) this.dashCd -= dt;
    if (canAct && pr('dash') && this.dashT <= 0 && this.dashCd <= 0 && (this.onGround || this.airDash)) {
      this.dashT = DASH_T; this.dashDir = dirx || this.facing; this.facing = this.dashDir; this.dashCd = DASH_T + DASH_CD;
      if (!this.onGround) this.airDash = false;
      this.ducking = false; sfx('dash'); this.sq = -.25; this.sqv = 0;
      for (let i = 0; i < 4; i++) this.puff(this.x - this.dashDir * (10 + i * 10), this.y - 8 - i * 3, 12 + i * 2, -this.dashDir * 120, -20 - i * 12, .35);
    }
    if (this.dashT > 0) {
      this.dashT -= dt; this.vx = this.dashDir * DASH_DIST / DASH_T; this.vy = 0;
      if (Math.random() < .9) this.lines.push({ x: this.x - this.dashDir * MG.rand(10, 50), y: this.y - MG.rand(20, 110), len: MG.rand(50, 110), t: 0, dir: this.dashDir });
      if (this.dashT <= 0) { this.vx = this.dashDir * SPEED * .55; this.puff(this.x, this.y - 40, 18, 0, -30, .3); }
    } else if (canAct) {
      /* ---- movimiento horizontal ---- */
      const moving = !lock && !this.ducking;
      const target = moving ? dirx * SPEED : 0;
      const acc = this.onGround ? 5200 : 3400;
      if (this.vx < target) this.vx = Math.min(target, this.vx + acc * dt); else if (this.vx > target) this.vx = Math.max(target, this.vx - acc * dt);
    } else {
      this.vx *= Math.pow(.02, dt);          // retroceso se frena
    }

    /* ---- orientación y puntería ---- */
    let ax = (R ? 1 : 0) - (L ? 1 : 0), ay = (D ? 1 : 0) - (U ? 1 : 0);
    if (this.ducking) ay = 0;
    if (ax && this.dashT <= 0 && canAct) this.facing = ax;
    if (!ax && !ay) ax = this.facing;
    if (!ax && ay) ax = 0;                   // apunta recto arriba/abajo
    const ang = Math.atan2(ay, ax || 0);
    this.aim = ang; this.aiming = (is('shoot') && canAct) || lock;
    if (this.aiming) this.aimT = .25; else if (this.aimT > 0) this.aimT -= dt;

    /* ---- salto / coyote / buffer / parry ---- */
    if (this.onGround) this.coyote = .08; else this.coyote -= dt;
    if (pr('jump') && canAct) this.jbuf = .1; else this.jbuf -= dt;
    if (this.jbuf > 0 && this.coyote > 0 && this.dashT <= 0) {
      this.vy = -JUMP_V; this.onGround = false; this.coyote = 0; this.jbuf = 0; this.jumping = true; this.parryOk = true;
      this.sq = -.38; this.sqv = 0; sfx('jump'); this.ducking = false;
      for (const s of [-1, 1]) this.puff(this.x + s * 20, this.y - 4, 13, s * 90, -20, .35);
    } else if (this.jbuf > 0 && !this.onGround && this.parryOk && pr('jump')) {
      // intento de parry
      let best = null, bd = 70;
      for (const p of ar.enemyProj) if (p.pink && !p.dead) {
        const d = Math.hypot(p.x - this.x, p.y - (this.y - 60)) - (p.r || 0) * .4;
        if (d < bd) { bd = d; best = p; }
      }
      if (best) {
        if (ar.onParry) ar.onParry(best);
        this.vy = -820; this.spinT = .45; this.addCard(1); this.parryOk = true; this.airDash = true; this.jbuf = 0; this.jumping = true;
        this.sq = -.3; this.sqv = 0;
        ar.effects.push(sparkFx(best.x, best.y, A.pink, true));
      }
    }
    // salto variable
    if (this.jumping && rel('jump') && this.vy < -300) { this.vy *= .42; this.jumping = false; }
    if (this.vy >= 0) this.jumping = false;

    /* ---- gravedad e integración ---- */
    if (this.dashT <= 0) {
      this.vy += GRAV * (this.vy > 0 ? 1.18 : 1) * dt; if (this.vy > FALL_MAX) this.vy = FALL_MAX;
    }
    this.x += this.vx * dt; this.y += this.vy * dt;
    this.x = clamp(this.x, 40, 1240);
    if (this.y >= ar.floorY) {
      if (!this.onGround && this.vy > 0) {            // aterrizaje
        const f = clamp(this.vy / 1100, .3, 1);
        this.sq = .14 + .24 * f; this.sqv = 0;
        for (const s of [-1, 1]) this.puff(this.x + s * 18, this.y - 6, 14 + 6 * f, s * (180 + 140 * f), -30, .45);
      }
      this.y = ar.floorY; this.vy = 0; this.onGround = true; this.airDash = true; this.parryOk = true; this.jumping = false;
    } else this.onGround = false;

    /* ---- animación de carrera / polvo de pasos ---- */
    if (this.onGround && Math.abs(this.vx) > 30 && this.dashT <= 0) {
      this.runPh += Math.abs(this.vx) * dt * .036;
      this.stepAcc += Math.abs(this.vx) * dt;
      if (this.stepAcc > 78) { this.stepAcc = 0; this.puff(this.x - Math.sign(this.vx) * 20, this.y - 5, 10, -Math.sign(this.vx) * 60, -28, .4); }
    } else if (this.onGround) this.runPh += (Math.round(this.runPh / Math.PI) * Math.PI - this.runPh) * Math.min(1, dt * 12);
    this.lean += ((this.dashT > 0 ? .5 : clamp(this.vx / SPEED, -1, 1) * .22) * this.facing * Math.sign(this.facing) - this.lean) * Math.min(1, dt * 14);

    /* ---- disparo ---- */
    if (this.shootCd > 0) this.shootCd -= dt;
    if (canAct && this.dashT <= 0 && this.packGone <= 0 && this.aiming && is('shoot') && this.shootCd <= 0) {
      const sp = SHOT[this.shotKind];
      this.shootCd = sp.gap; this.muzzle = .06;
      sp.fire(ar, this.muzzlePos(), ang);
      if (this.shots++ % 3 === 0) sfx('shoot');
    }
    /* ---- EX / SÚPER ---- */
    if (canAct && pr('ex') && this.dashT <= 0 && this.superMeter >= 1 && this.packGone <= 0) {
      if (this.superMeter >= 5 - 1e-6) this.startSuper(); else this.startEx();
    }
  }
  shoulder() { return { x: this.x + this.facing * 20, y: this.y - (this.ducking ? 42 : 76) }; }
  muzzlePos() {
    const s = this.shoulder(), a = this.aim, R = 74;
    return { x: s.x + Math.cos(a) * R, y: s.y + Math.sin(a) * R };
  }
  startEx() {
    this.superMeter = Math.max(0, this.superMeter - 1); this.arena.stats.exUsed++;
    const s = this.shoulder();
    this.arena.playerProj.push(new Pack(s.x + this.facing * 30, this.y - (this.ducking ? 40 : 70), this.facing));
    this.packGone = .55; this.throwT = .35; this.sq = -.2; this.sqv = 0;
    MG.fx.freeze(6); MG.fx.flash('#fff6df', .12); MG.fx.shake(6, .2); sfx('ex');
  }
  startSuper() {
    this.superMeter = 0; this.arena.stats.exUsed++;
    this.superT = 1.5; this.superWind = .3; this.dashT = 0; this.ducking = false; this.spinT = 0;
    MG.fx.freeze(14); MG.fx.flash(A.gold, .3); MG.fx.shake(8, .5); sfx('ex');
    this.sq = -.3;
  }
}

/* ============================== DIBUJO DE MILO ============================== */
function fingerHand(ctx, x, y, ang) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
  A.blob(ctx, 17, 0, 15, 5.5, A.cream, { wob: .4, lw: 3, shade: false, points: 10, seed: 4 });       // índice
  A.blob(ctx, 0, 0, 12, 11, A.cream, { wob: .5, lw: 3.5, shade: false, seed: 2 });                  // puño
  A.blob(ctx, 2, -10, 6.5, 4.5, A.cream, { wob: .3, lw: 2.5, shade: false, points: 8, rot: -.5 });  // pulgar
  ctx.strokeStyle = A.ink; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-3, 3); ctx.lineTo(6, 3); ctx.moveTo(-3, 8); ctx.lineTo(5, 7); ctx.stroke();
  ctx.restore();
}
Player.prototype.legPose = function (i, hx, hy, mode) {
  const t = this.t; let fx, fy;
  if (mode === 'run') { const ph = this.runPh + i * Math.PI; fx = hx + Math.sin(ph) * 30; fy = -18 + Math.cos(ph) * 8.5; }
  else if (mode === 'duck') { fx = hx + (i ? 24 : -20); fy = -10; }
  else if (mode === 'dash') { fx = hx - 26; fy = -26 + (i ? 7 : -4); }
  else if (mode === 'up') { fx = hx + (i ? 10 : -8); fy = -32 + (i ? 5 : 0); }
  else if (mode === 'down') { fx = hx + (i ? 20 : -16); fy = -17 + Math.sin(t * 22 + i * 2) * 3; }
  else { fx = hx + (i ? 8 : -6); fy = -10; }
  return [fx, fy];
};
Player.prototype.draw = function (ctx) {
  const ar = this.arena, t = this.t;
  // sombra
  const hgt = Math.max(0, ar.floorY - this.y + this.lift);
  if (!this.dead) A.shadow(ctx, this.x, ar.floorY, Math.max(14, 40 - hgt * .08) * (this.ducking ? 1.1 : 1));
  for (const l of this.lines) { ctx.save(); ctx.globalAlpha = 1 - l.t / .25; ctx.strokeStyle = A.ink; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(l.x, l.y); ctx.lineTo(l.x - l.dir * l.len, l.y); ctx.stroke(); ctx.strokeStyle = A.cream; ctx.lineWidth = 1.6; ctx.stroke(); ctx.restore(); }
  for (const p of this.parts) { const k = p.t / p.dur; A.puff(ctx, p.x, p.y, p.r * (.6 + .8 * k), (1 - k) * .95); }
  if (this.dead) return this.drawGhost(ctx);
  // humo: Milo se vuelve nube
  if (this.dashT > 0 && this.charm === 'humo') return this.drawSmoke(ctx);
  const f = this.facing;
  let alpha = 1; if (this.invuln > 0 && this.hurtT <= 0) alpha = (Math.floor(t * 16) % 2) ? .38 : 1;
  ctx.save(); ctx.globalAlpha = alpha;
  ctx.translate(this.x, this.y - this.lift);
  // inflado del súper
  let infl = 0; if (this.superT > 0) { const el = 1.5 - this.superT; infl = clamp(el / .3, 0, 1) * (this.superT < .3 ? this.superT / .3 : 1); }
  const dashK = this.dashT > 0 ? 1 : 0, sq = this.sq;
  ctx.scale((1 + sq * .9 + dashK * .35) * (1 + infl * .5), (1 - sq - dashK * .22) * (1 + infl * .5));
  if (this.spinT > 0) { ctx.translate(0, -62); ctx.rotate((1 - this.spinT / .45) * Math.PI * 2 * f); ctx.translate(0, 62); }
  ctx.scale(f, 1);
  ctx.translate(0, -34); ctx.rotate(this.lean + (infl ? Math.sin(t * 60) * .03 : 0)); ctx.translate(0, 34);
  if (this.hurtT > 0) ctx.translate(A.j(1, 4), A.j(2, 2));
  const air = !this.onGround;
  const mode = this.dashT > 0 ? 'dash' : this.ducking ? 'duck' : air ? (this.vy < 0 ? 'up' : 'down') : Math.abs(this.vx) > 30 ? 'run' : 'idle';
  const breathe = mode === 'idle' ? Math.sin(t * 3.2) : 0;          // respiración
  const bob = mode === 'run' ? Math.abs(Math.sin(this.runPh)) * -6 : 0;
  const hipY = (mode === 'duck' ? -22 : -42) + bob;
  // --- brazo de atrás (detrás del cuerpo)
  const sh = { x: 28, y: this.ducking ? -48 : -72 + bob }, shB = { x: -24, y: sh.y + 2 };
  const aimOn = this.aimT > 0 || this.throwT > 0;
  const la = f > 0 ? this.aim : Math.PI - this.aim;
  const swing = mode === 'run' ? Math.sin(this.runPh) : 0;
  const hand = (front) => {
    if (front && aimOn) { const reach = this.throwT > 0 ? 50 : 44, a = this.throwT > 0 ? -.35 : la; return { x: sh.x + Math.cos(a) * reach, y: sh.y + Math.sin(a) * reach, a: a, point: true }; }
    const s = front ? 1 : -1;
    if (mode === 'run') return { x: (front ? 14 : -12) + s * -swing * 26 + 6, y: sh.y + 24 - Math.abs(swing) * 6, a: s * -swing * .6 };
    if (mode === 'up') return { x: s * 34, y: sh.y - 20 + Math.sin(t * 14 + s) * 3, a: -1 };
    if (mode === 'down') return { x: s * 40, y: sh.y - 6 + Math.sin(t * 18 + s) * 5, a: -.5 };
    if (mode === 'dash') return { x: front ? 38 : -30, y: sh.y + 4, a: front ? -.1 : .2 };
    if (mode === 'duck') return { x: s * 36, y: sh.y + 22, a: 0 };
    return { x: s * 30 + Math.sin(t * 2 + s) * 3, y: sh.y + 36 + breathe * 2, a: s * .2 };
  };
  const hB = hand(false), hF = hand(true);
  // aura del pueblo y capa del bazar (detrás de la mochila)
  const WR = MG.wear, fwd = this.dashT > 0 ? 1.2 : clamp(this.vx * f / SPEED, -1, 1);
  const wo = { t, b: fwd > 0 ? fwd : fwd * .35, v: clamp(this.vy / 900, -1, 1) };
  if (this.puestos.indexOf('aura') > -1) { ctx.save(); ctx.translate(0, -77 + bob); WR.aura(ctx, t); ctx.restore(); }
  if (this.ves.espalda === 'capa') { ctx.save(); ctx.translate(0, -77 + bob + breathe * -1.2); WR.cape(ctx, wo); ctx.restore(); }
  // mochila
  if (this.packGone <= 0 || this.throwT > 0 && false) {
    ctx.save(); ctx.translate(-37, -70 + bob + breathe * -1); ctx.rotate(-this.lean * .8 + (air ? clamp(this.vy / 3000, -.2, .25) : 0) + Math.sin(this.runPh * 2) * (mode === 'run' ? .05 : 0));
    A.blob(ctx, 0, 0, 26, 36, PACK, { wob: 1.5, lw: 5, seed: 11 });
    A.blob(ctx, -1, -17, 22, 14, PACKD, { wob: 1, lw: 3.5, shade: false, seed: 5, points: 14 });
    A.blob(ctx, -2, 14, 15, 11, PACKD, { wob: .8, lw: 3, shade: false, seed: 6, points: 12 });
    ctx.fillStyle = A.gold; ctx.strokeStyle = A.ink; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.rect(-6, -10, 9, 8); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
  // piernas
  for (let i = 0; i < 2; i++) {
    const hx = i ? 11 : -11, [fx, fy] = this.legPose(i, hx, hipY, mode);
    A.hose(ctx, hx, hipY, fx - 2, fy - 3, i ? -7 : 7, 9, HOSE);
    A.blob(ctx, fx + 6, fy, 18, 10.5, SHOE, { wob: .9, lw: 4, shade: false, seed: 20 + i, rot: mode === 'down' ? .12 : mode === 'up' ? -.18 : 0 });
    ctx.fillStyle = 'rgba(255,246,223,.35)'; ctx.beginPath(); ctx.ellipse(fx + 10, fy - 4, 7, 2.8, -.1, 0, 7); ctx.fill();
  }
  // brazo trasero
  A.hose(ctx, shB.x, shB.y, hB.x, hB.y, -8, 9, HOSE); A.glove(ctx, hB.x, hB.y, 10.5, hB.a);
  // cuerpo
  const by = -77 + bob + breathe * -1.2, ry = 40 + breathe * 1.3;
  A.blob(ctx, 0, by, 38, ry + 2, this.pal.body, { wob: 1.7, lw: 5, seed: 1, points: 22 });
  ctx.save(); ctx.fillStyle = this.pal.belly; ctx.beginPath(); ctx.ellipse(8, by + 12, 17, 19, .1, 0, 7); ctx.fill(); ctx.restore();
  // correa de la mochila
  ctx.save(); ctx.lineCap = 'round'; ctx.strokeStyle = A.ink; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(-20, by - 36); ctx.quadraticCurveTo(-27, by, -10, by + 34); ctx.stroke();
  ctx.strokeStyle = '#b58a52'; ctx.lineWidth = 4.5; ctx.stroke(); ctx.restore();
  if (this.ves.cuello === 'bufanda') { ctx.save(); ctx.translate(0, by); WR.scarf(ctx, wo); ctx.restore(); }
  // mechón (bajo un gorro o sombrero no se ve)
  const sway = Math.sin(t * 3) * 3.5 + this.hair * .9 - (mode === 'up' ? 5 : 0) + (mode === 'down' ? 6 : 0);
  if (!this.hat) {
    ctx.save(); ctx.lineCap = 'round'; ctx.translate(4, by - ry + 5);
    for (const [dx, h, col, w] of [[-5, 20, A.ink, 7], [3, 26, A.ink, 7], [10, 17, A.ink, 6]]) {
      ctx.strokeStyle = A.ink; ctx.lineWidth = w + 3; ctx.beginPath(); ctx.moveTo(dx, 0); ctx.quadraticCurveTo(dx - 3 + sway * .3, -h * .6, dx + 3 + sway, -h); ctx.stroke();
      ctx.strokeStyle = this.pal.dark; ctx.lineWidth = w - 1.5; ctx.stroke();
    }
    ctx.restore();
  }
  // ojos
  const sc = this.hurtT > 0 || (infl > 0 && false);
  const lookx = clamp(this.vx / 400, -1, 1) * .6 + (aimOn ? Math.cos(la) * .9 : .5), looky = aimOn ? Math.sin(la) * .8 : (air ? (this.vy < 0 ? -.4 : .5) : 0);
  if (sc) {
    for (const [ex, ey, r] of [[6, by - 12, 12], [27, by - 9, 10.5]]) {
      ctx.fillStyle = A.cream; ctx.strokeStyle = A.ink; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(ex, ey, r, r * 1.2, 0, 0, 7); ctx.fill(); ctx.stroke();
      ctx.fillStyle = A.ink; ctx.beginPath(); ctx.arc(ex + 1 + A.j(ex, 1.5), ey + A.j(ey, 1.5), 2.6, 0, 7); ctx.fill();
    }
  } else {
    const bl = this.blink > 0 ? .12 : 1;
    for (const [ex, ey, r] of [[8, by - 12, 7.2], [26, by - 9, 6]]) {
      ctx.fillStyle = A.ink; ctx.beginPath(); ctx.ellipse(ex + lookx * 2, ey + looky * 2, r * .95, r * 1.25 * bl, 0, 0, 7); ctx.fill();
      if (bl > .5) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ex + lookx * 2 - 1.5, ey + looky * 2 - 2.5, 1.7, 0, 7); ctx.fill(); }
    }
    if (infl > .3) { ctx.strokeStyle = A.ink; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-1, by - 28); ctx.lineTo(14, by - 22); ctx.moveTo(34, by - 22); ctx.lineTo(19, by - 22); ctx.stroke(); }
  }
  // lentes y gorro (sobre los ojos y el mechón)
  if (this.ves.cara === 'lentes') { ctx.save(); ctx.translate(0, by); WR.glasses(ctx, wo); ctx.restore(); }
  if (this.hat) { ctx.save(); ctx.translate(0, by - breathe * 1.3); WR.hat(ctx, this.hat, { t, sway: this.hair * .9 + Math.sin(t * 3) * 3 }); ctx.restore(); }
  // brazo delantero
  A.hose(ctx, sh.x, sh.y, hF.x, hF.y, 6, 9, HOSE);
  if (hF.point) fingerHand(ctx, hF.x, hF.y, hF.a); else A.glove(ctx, hF.x, hF.y, 10.5, hF.a);
  // destello del disparo
  if (this.muzzle > 0 && hF.point && this.throwT <= 0) {
    const mx = sh.x + Math.cos(la) * 74, my = sh.y + Math.sin(la) * 74;
    A.star(ctx, mx, my, 15 + A.j(3, 4), this.muzzleCol, t * 30); A.blob(ctx, mx, my, 6, 6, A.cream, { wob: .6, lw: 2, shade: false, points: 8 });
  }
  ctx.restore();
};
Player.prototype.drawSmoke = function (ctx) {
  const t = this.t;
  for (let i = 0; i < 6; i++) {
    const k = i / 5, px = this.x - this.dashDir * (k * 70) , py = this.y - 56 + Math.sin(t * 30 + i) * 6 + k * 10, r = 38 - k * 20;
    A.blob(ctx, px, py, r, r * .85, i % 2 ? '#e9dfce' : '#d6cab5', { wob: 4, lw: 4, seed: i * 3, points: 14 });
  }
  const ex = this.x + this.dashDir * 6;
  ctx.fillStyle = A.ink; for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(ex + s * 8, this.y - 60, 4, 0, 7); ctx.fill(); }
};
Player.prototype.drawGhost = function (ctx) {
  const d = this.deathT, t = this.t;
  const gx = this.x + Math.sin(d * 5) * 22, gy = this.y - 64 - d * d * 60 - d * 190;
  const fade = clamp(1.7 - d * .5, .4, 1);
  if (d < .25) { ctx.save(); ctx.globalAlpha = 1 - d / .25; A.star(ctx, this.x, this.y - 60, 60 * (d / .25) + 20, A.cream, d * 8); ctx.restore(); }
  ctx.save(); ctx.globalAlpha = fade; ctx.translate(gx, gy);
  const fl = Math.sin(t * 18) * .5;
  for (const s of [-1, 1]) {           // alitas
    ctx.save(); ctx.scale(s, 1); ctx.rotate(-.3 + fl * .5);
    A.blob(ctx, 46, -8, 26, 14, A.cream, { wob: 1, lw: 4, shade: false, rot: -.4, seed: s > 0 ? 3 : 8 }); ctx.restore();
  }
  // cuerpo de fantasma con falda ondulante
  ctx.beginPath(); ctx.moveTo(-32, 10);
  ctx.bezierCurveTo(-40, -50, 40, -50, 32, 10);
  for (let i = 0; i <= 4; i++) { const xx = 32 - i * 16; ctx.quadraticCurveTo(xx - 4, 22 + (i % 2 ? -4 : 14) + Math.sin(t * 10 + i) * 3, xx - 8, 14 + Math.sin(t * 10 + i) * 3); }
  ctx.closePath(); ctx.fillStyle = 'rgba(255,246,223,.93)'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = A.ink; ctx.lineJoin = 'round'; ctx.stroke();
  ctx.fillStyle = A.ink; for (const [ex, r] of [[-9, 6], [10, 5]]) { ctx.beginPath(); ctx.ellipse(ex, -14, r, r * 1.3, 0, 0, 7); ctx.fill(); }
  ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, 14 - 6, 7, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
  // aureola
  ctx.strokeStyle = A.ink; ctx.lineWidth = 11; ctx.beginPath(); ctx.ellipse(0, -52 + Math.sin(t * 8) * 3, 24, 7, 0, 0, 7); ctx.stroke();
  ctx.strokeStyle = A.gold; ctx.lineWidth = 5; ctx.stroke();
  ctx.restore();
};
MG.Player = Player;

/* ============================== HUD ============================== */
function rr(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
}
function heart(ctx, x, y, s, fill) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.beginPath(); ctx.moveTo(0, 8);
  ctx.bezierCurveTo(-14, -2, -10, -14, 0, -6); ctx.bezierCurveTo(10, -14, 14, -2, 0, 8); ctx.closePath();
  ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = 2 / s * 1.6; ctx.strokeStyle = A.ink; ctx.stroke(); ctx.restore();
}
function card(ctx, x, y, w, h, fill, border) {
  rr(ctx, x, y, w, h, 8); ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = A.ink; ctx.lineJoin = 'round'; ctx.stroke();
  rr(ctx, x + 5, y + 5, w - 10, h - 10, 4); ctx.lineWidth = 1.6; ctx.strokeStyle = border || A.red; ctx.stroke();
}
const hud = MG.hud = {
  flip: [0, 0, 0, 0, 0], last: 0,
  draw(ctx, player, arena) {
    if (!player) return;
    const now = performance.now(), dt = Math.min(.05, (now - hud.last) / 1000 || .016); hud.last = now;
    const tm = now / 1000, touch = MG.input && MG.input.lastDevice === 'touch';
    const bx = 24, by = touch ? 14 : H - 24 - 96;
    ctx.save();
    // ---- carta de vida
    const hp = player.hp, low = hp <= 1 && !player.dead;
    const pulse = low ? 1 + Math.abs(Math.sin(tm * 7)) * .09 : 1;
    ctx.save(); ctx.translate(bx + 35, by + 48); ctx.rotate(-.04); ctx.scale(pulse, pulse);
    card(ctx, -35, -48, 70, 96, low ? '#f7b8a6' : A.cream, A.red);
    A.text(ctx, 'HP', -21, -33, 15, { font: 'ui', fill: A.red, lw: 3 });
    ctx.save(); ctx.translate(21, 33); ctx.rotate(Math.PI); A.text(ctx, 'HP', 0, 0, 15, { font: 'ui', fill: A.red, lw: 3 }); ctx.restore();
    A.text(ctx, String(hp), 0, 2, 56, { font: 'ui', fill: low ? A.red : A.ink, stroke: low ? A.ink : A.cream, lw: low ? 8 : 6 });
    heart(ctx, 0, -33, 1, low ? A.red : '#e0674f'); heart(ctx, 0, 36, .8, low ? A.red : '#e0674f');
    ctx.restore();
    // ---- cartas de súper
    const m = player.superMeter, cw = 42, ch = 60, gap = 8, sx0 = bx + 84, sy = by + 96 - ch;
    for (let i = 0; i < 5; i++) {
      const fr = clamp(m - i, 0, 1), full = fr >= .999;
      hud.flip[i] += ((full ? 1 : 0) - hud.flip[i]) * Math.min(1, dt * 9);
      const fl = hud.flip[i], cx = sx0 + i * (cw + gap) + cw / 2, cy = sy + ch / 2 + (i - 2) * 0 + Math.abs(i - 2) * 1.5;
      const bounce = full ? Math.sin(tm * 3 + i) * 1.5 : 0;
      ctx.save(); ctx.translate(cx, cy + bounce); ctx.rotate((i - 2) * .035);
      if (i === 4 && full) {            // brillo dorado de la quinta
        for (let k = 0; k < 8; k++) { ctx.save(); ctx.rotate(tm * .6 + k * Math.PI / 4); ctx.fillStyle = 'rgba(242,193,78,.55)'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-7, -46 - Math.sin(tm * 6 + k) * 5); ctx.lineTo(7, -46 - Math.sin(tm * 6 + k) * 5); ctx.closePath(); ctx.fill(); ctx.restore(); }
        A.star(ctx, 0, 0, 44 + Math.sin(tm * 8) * 3, 'rgba(242,193,78,.5)', tm);
      }
      const kx = Math.max(.06, Math.abs(Math.cos(fl * Math.PI)));
      ctx.scale(kx, 1);
      if (fl < .5) {                    // reverso: se llena de abajo hacia arriba
        card(ctx, -cw / 2, -ch / 2, cw, ch, '#e9dcc0', A.blue);
        if (fr > 0) { ctx.save(); rr(ctx, -cw / 2 + 5, -ch / 2 + 5, cw - 10, ch - 10, 4); ctx.clip();
          const hh = (ch - 10) * fr; ctx.fillStyle = A.blue; ctx.fillRect(-cw / 2, ch / 2 - 5 - hh, cw, hh + 2);
          ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(-cw / 2, ch / 2 - 5 - hh, cw, 3); ctx.restore(); }
        ctx.strokeStyle = 'rgba(27,18,10,.35)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(0, -8); ctx.lineTo(6, 0); ctx.lineTo(0, 8); ctx.closePath(); ctx.stroke();
      } else {                          // anverso: carta completa
        const gold = i === 4;
        card(ctx, -cw / 2, -ch / 2, cw, ch, gold ? '#ffe9a3' : A.cream, gold ? '#b8860b' : A.blue);
        A.star(ctx, 0, 0, 14, gold ? A.gold : A.blue, tm * (gold ? 2 : 0));
        A.text(ctx, gold ? 'S' : 'EX', -cw / 2 + 11, -ch / 2 + 13, 11, { font: 'ui', fill: gold ? '#b8860b' : A.blue, lw: 2.5 });
      }
      ctx.restore();
    }
    ctx.restore();
    // ---- jefe: nombre y barrita fina
    const b = arena && arena.boss;
    if (b && b.maxHp) {
      const bw = 300, x0 = W / 2 - bw / 2, y0 = 36, k = clamp(b.hp / b.maxHp, 0, 1);
      A.text(ctx, (arena.def && arena.def.nombre || 'Jefe').toUpperCase(), W / 2, 18, 17, { font: 'ui', fill: A.cream, lw: 4 });
      ctx.save(); rr(ctx, x0, y0, bw, 9, 4.5); ctx.fillStyle = 'rgba(27,18,10,.55)'; ctx.fill();
      if (k > 0) { ctx.save(); rr(ctx, x0, y0, bw, 9, 4.5); ctx.clip(); ctx.fillStyle = b.flash > 0 ? '#fff' : A.cream; ctx.fillRect(x0, y0, bw * k, 9); ctx.fillStyle = 'rgba(200,106,23,.45)'; ctx.fillRect(x0, y0 + 5, bw * k, 4); ctx.restore(); }
      rr(ctx, x0, y0, bw, 9, 4.5); ctx.lineWidth = 3; ctx.strokeStyle = A.ink; ctx.stroke();
      ctx.restore();
    }
  }
};
})();
