/* ============================================================
   V7 · HOY (v2) — la puerta única, con solo 3 bloques:
   1) Ahora te toca: solo lo pendiente; cada tarjeta se va al cumplirla
   2) Hábitos de hoy: anillo + lista (los automáticos se marcan solos)
   3) Registro rápido: + Gasto · + Entreno · + Peso
   Milo vive en una franja arriba (no es un bloque más): nivel, forma,
   XP y el botón para cambiar al MODO JUEGO completo.
   ============================================================ */
(function () {
'use strict';
const U = App.util;
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
let showAllHabits = false;

// hábitos que otro módulo marca solo (sin doble registro)
const AUTO = [
  { re: /ejercicio|gym|entren/i, tag: 'AUTO · GYM' },
  { re: /dorm|sueñ/i, tag: 'AUTO · CHECK-IN' },
  { re: /tratamiento|piel|crema/i, tag: 'AUTO · PIEL' }
];
const autoTag = name => { const a = AUTO.find(x => x.re.test(name || '')); return a ? a.tag : ''; };

function mod(id) { return App.modules().find(m => m.id === id); }
function resumen(id) { const m = mod(id); try { return m && m.hoyResumen ? m.hoyResumen() : null; } catch (e) { return null; } }

/* ---------------- Milo ---------------- */
function miloStrip(pendientes) {
  let nivel = '—', forma = null, baros = 0, xpSem = null;
  try {
    if (window.MODO_JUEGO && MODO_JUEGO.motor) {
      const M = MODO_JUEGO.motor();
      if (MODO_JUEGO.CFG && MODO_JUEGO.CFG.curva) { let n = 1; while (MODO_JUEGO.CFG.curva(n + 1) <= M.xpTotal) n++; nivel = n; }
      const fs = Object.values(M.forma || {}).filter(v => typeof v === 'number');
      forma = fs.length ? Math.round(fs.reduce((a, b) => a + b, 0) / fs.length) : null;
      baros = M.baros || 0;
      xpSem = M.xpRegistroSemana;
    }
  } catch (e) { /* el juego es opcional: HOY funciona igual */ }
  const frase = pendientes === 0
    ? 'Encargos del día cumplidos. Milo vuelve al pueblo.'
    : `${pendientes} encargo${pendientes > 1 ? 's' : ''} pendiente${pendientes > 1 ? 's' : ''} para Milo`;
  return `
    <div class="hoy-milo">
      <button class="hoy-milo-main" data-hoy-juego aria-label="Abrir el mundo de Milo">
        <img src="game/assets/milo_front.png" alt="" class="hoy-milo-img">
        <span class="hoy-milo-info">
          <span class="m-row" style="font-size:14px"><b class="hoy-milo-name">MILO · Nv ${nivel}</b>
            <span class="m-mono m-dim" style="font-size:12px">${U.fmtNum(baros, 0)} baros</span></span>
          ${forma == null ? '' : `<span class="hoy-milo-forma"><span class="m-sub">Forma</span><span class="m-bar" style="flex:1"><i style="width:${forma * 10}%"></i></span><span class="m-mono m-sub">${forma}/10</span></span>`}
          <span class="m-sub">${frase}${xpSem ? ' · +' + U.fmtNum(xpSem, 0) + ' XP esta semana' : ''}</span>
        </span>
      </button>
      <button class="m-btn small hoy-juego-btn" data-hoy-juego>⚔ MODO JUEGO</button>
    </div>`;
}

/* ---------------- 1 · Ahora te toca ---------------- */
function cardHTML(c) {
  if (c.html && !c.titulo) return c.html;          // compatibilidad: tarjeta antigua en HTML
  const tone = c.tone === 'accent' ? ' accent' : c.tone === 'warn' ? ' warn' : '';
  return `<button class="m-card hoy-card hoy-tile${tone}" data-go="${U.esc(c.go || 'hoy')}">
      <span class="m-row"><span class="m-label hi">${U.esc(c.area || '')}</span>${c.xp ? `<span class="m-mono m-good" style="font-size:12px">+${c.xp} XP</span>` : ''}</span>
      <span class="hoy-tile-t">${U.esc(c.titulo)}</span>
      <span class="m-sub">${U.esc(c.sub || '')}</span>
    </button>`;
}

/* ---------------- 2 · Hábitos de hoy ---------------- */
function habitsBlock() {
  const today = startOfDay(new Date());
  const hs = state.habits || [];
  const done = hs.filter(h => isDone(h.id, today)).length;
  const pct = hs.length ? Math.round(done / hs.length * 100) : 0;
  const C = 2 * Math.PI * 34;
  const sorted = hs.slice().sort((a, b) => isDone(a.id, today) - isDone(b.id, today));
  const list = showAllHabits ? sorted : sorted.slice(0, 6);
  return `
    <div class="m-card hoy-habits">
      <div class="hoy-ring" role="img" aria-label="${done} de ${hs.length} hábitos hechos hoy">
        <svg viewBox="0 0 80 80" width="80" height="80" aria-hidden="true">
          <circle cx="40" cy="40" r="34" fill="none" stroke="var(--cyan-line)" stroke-width="7"></circle>
          <circle cx="40" cy="40" r="34" fill="none" stroke="var(--cyan)" stroke-width="7" stroke-linecap="round"
            stroke-dasharray="${(C * pct / 100).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 40 40)"></circle>
        </svg>
        <span class="hoy-ring-n"><b>${done}/${hs.length}</b><small>${pct}%</small></span>
      </div>
      <div class="hoy-habits-list">
        <div class="m-row" style="margin-bottom:2px"><span class="m-title" style="font-size:15px">Hábitos de hoy</span>
          <button class="m-btn small ghost" onclick="App.go('habitos')">Ver todos</button></div>
        ${hs.length ? list.map(h => {
          const on = isDone(h.id, today), tag = autoTag(h.name);
          return `<button class="hoy-habit${on ? ' done' : ''}" data-hoy-habit="${U.esc(h.id)}" aria-pressed="${on}">
            <i class="box" aria-hidden="true"></i><span>${U.esc(h.name)}</span>
            ${tag ? `<small class="m-mono m-dim hoy-auto">${tag}</small>` : ''}</button>`;
        }).join('') : '<div class="m-sub">Aún no tienes hábitos. Créalos en HÁBITOS.</div>'}
        ${hs.length > 6 ? `<button class="m-btn small ghost" data-hoy-more>${showAllHabits ? 'VER MENOS' : '+ ' + (hs.length - 6) + ' MÁS'}</button>` : ''}
      </div>
    </div>`;
}

/* ---------------- 3 · Registro rápido ---------------- */
function quickBlock() {
  const p = resumen('plata'), g = resumen('gym');
  const capGasto = p ? 'hoy ' + U.fmtCLP(p.gastadoHoy) : '';
  const capEntreno = g ? (g.entrenoHoy ? 'hecho ✓' : g.tocaHoy ? 'toca hoy' : 'hoy descanso') : '';
  const capPeso = g ? g.pesajesSemana + ' esta semana' : '';
  const b = (go, label, cap) => `<button class="m-btn hoy-quick" data-go="${go}"><span>${label}</span><small class="m-mono m-dim">${cap}</small></button>`;
  return `
    <div class="m-stack" style="gap:8px">
      <span class="m-title" style="font-size:15px">Registro rápido</span>
      <div class="m-grid3">${b('plata', '+ Gasto', capGasto)}${b('cuerpo/entreno', '+ Entreno', capEntreno)}${b('cuerpo/medidas', '+ Peso', capPeso)}</div>
    </div>`;
}

function render(el) {
  const now = new Date();
  const cards = App.hoyCards();
  el.innerHTML = `
    <div class="m-stack hoy-v2">
      <div class="hoy-head">
        <div><h2>Hola, Josu</h2><div class="m-sub">${DIAS[now.getDay()]} ${now.getDate()} de ${MESES[now.getMonth()]}</div></div>
      </div>
      ${miloStrip(cards.length)}
      <div class="m-stack" style="gap:8px">
        <div class="m-row"><span class="m-title" style="font-size:17px">Ahora te toca</span>
          <span class="m-mono m-dim" style="font-size:12px">${cards.length ? cards.length + ' pendiente' + (cards.length > 1 ? 's' : '') : 'nada pendiente'}</span></div>
        ${cards.length
          ? `<div class="hoy-tiles">${cards.map(cardHTML).join('')}</div>`
          : `<div class="m-alert ok"><b>Todo al día.</b> Lo próximo aparece solo cuando toque.</div>`}
      </div>
      ${habitsBlock()}
      ${quickBlock()}
    </div>`;
  if (!el.dataset.wired) {
    el.dataset.wired = '1';
    el.addEventListener('click', e => {
      const hb = e.target.closest('[data-hoy-habit]');
      if (hb) { toggleDone(hb.dataset.hoyHabit, startOfDay(new Date())); return; }
      if (e.target.closest('[data-hoy-more]')) { showAllHabits = !showAllHabits; render(el); return; }
      if (e.target.closest('[data-hoy-juego]')) { if (window.MG && MG.open) MG.open(); else if (window.MODO_JUEGO) MODO_JUEGO.entrar(); }
    });
  }
}

App.register({
  id: 'hoy',
  defaults() { return { v: 1 }; },
  view: { id: 'hoy', render }
});
})();
