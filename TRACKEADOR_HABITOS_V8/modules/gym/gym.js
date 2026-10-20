/* ============================================================
   V7 · Módulo GYM — pestañas ENTRENO · MEDIDAS · SEMANA dentro de CUERPO
   Datos: state.gym (ver CONTRATO_MODULOS.md). Sesión terminada = s.fin:true
   ============================================================ */
(function () {
'use strict';

const U = App.util;
const esc = U.esc;
const DAYS_L = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const DAYS_FULL = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
const MEAS_FIELDS = [['brazo', 'BRAZO'], ['pecho', 'PECHO'], ['muslo', 'MUSLO'], ['cintura', 'CINTURA']];
const MEAS_EVERY = 28;

// estado efímero de UI
let entDate = null;      // fecha de ENTRENO que se está viendo (null = hoy)
let selEx = null;        // ejercicio elegido en el gráfico de progreso
let planEdit = false;
let weekMon = null;      // lunes de la semana visible en SEMANA

/* ---------------- datos ---------------- */
function defaults() {
  const ej = [
    ['Sentadilla', 3, '8-10'], ['Press banca', 3, '8-10'], ['Remo con barra', 3, '8-10'],
    ['Press militar', 3, '8-10'], ['Peso muerto rumano', 3, '8-10'], ['Jalón al pecho', 3, '10-12'],
    ['Plancha', 3, '30-45 s']
  ].map((e, i) => ({ id: 'e' + (i + 1), nombre: e[0], series: e[1], reps: e[2] }));
  return { v: 1, plan: { dias: [1, 3, 5], ejercicios: ej }, sesiones: [], peso: [], medidas: [], semanas: {}, descargas: [] };
}
function G() {
  const g = App.data('gym');
  if (!g.plan) g.plan = defaults().plan;
  if (!Array.isArray(g.plan.dias)) g.plan.dias = [1, 3, 5];
  if (!Array.isArray(g.plan.ejercicios)) g.plan.ejercicios = [];
  ['sesiones', 'peso', 'medidas', 'descargas'].forEach(k => { if (!Array.isArray(g[k])) g[k] = []; });
  if (!g.semanas || typeof g.semanas !== 'object') g.semanas = {};
  return g;
}
function save(noRender) { App.save('gym', noRender ? { noRender: true } : undefined); }

/* ---------------- cálculos ---------------- */
const num = v => { if (v === '' || v == null) return null; const n = parseFloat(String(v).replace(',', '.')); return isNaN(n) ? null : n; };
const rm = (kg, reps) => kg * (1 + reps / 30);                    // Epley
const validSet = s => s && num(s.kg) > 0 && num(s.reps) > 0;
const f1 = n => U.fmtNum(n, 1);
const sign = n => (n > 0 ? '+' : n < 0 ? '−' : '') + U.fmtNum(Math.abs(n), 1);
function bestSet(sets) {            // mejor serie por 1RM estimado
  let b = null;
  (sets || []).forEach(s => { if (validSet(s)) { const r = rm(num(s.kg), num(s.reps)); if (!b || r > b.rm) b = { kg: num(s.kg), reps: num(s.reps), rm: r }; } });
  return b;
}
function maxKg(sets) { let m = 0; (sets || []).forEach(s => { if (validSet(s)) m = Math.max(m, num(s.kg)); }); return m || null; }
function sortedSess() { return G().sesiones.slice().sort((a, b) => a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : 0); }
function sessOn(fecha) { return G().sesiones.find(s => s.fecha === fecha); }
function itemOf(s, ejId) { return (s.items || []).find(i => i.ejId === ejId); }
function prevItem(ejId, fecha) {     // última sesión anterior con series válidas de ese ejercicio
  const list = sortedSess().filter(s => s.fecha < fecha).reverse();
  for (const s of list) { const it = itemOf(s, ejId); if (it && bestSet(it.sets)) return it; }
  return null;
}
function priorMaxRM(ejId, fecha) {
  let m = 0;
  G().sesiones.forEach(s => { if (s.fecha < fecha) { const it = itemOf(s, ejId); const b = it && bestSet(it.sets); if (b) m = Math.max(m, b.rm); } });
  return m;
}
function isRecord(s, it) {
  const b = bestSet(it.sets); if (!b) return false;
  const prior = priorMaxRM(it.ejId, s.fecha);
  return prior > 0 && b.rm > prior + 1e-9;
}
function recordCount(s) { return (s.items || []).filter(it => isRecord(s, it)).length; }
const sessCounts = s => !!s.fin || (s.items || []).some(it => bestSet(it.sets));
function isoDow(k) { return (U.parseKey(k).getDay() + 6) % 7 + 1; }     // 1=lunes … 7=domingo
function sessionsInWeek(mon) {
  const end = U.addDaysKey(mon, 6);
  return G().sesiones.filter(s => s.fecha >= mon && s.fecha <= end && sessCounts(s));
}
function fmtDate(k) {
  const d = U.parseKey(k);
  return d.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'short' }).replace('.', '');
}
const shortD = k => { const [, m, d] = k.split('-'); return +d + '/' + +m; };

/* peso: promedios por semana ISO (lunes–domingo) */
function pesoSemanas() {
  const map = {};
  G().peso.forEach(p => {
    const kg = num(p.kg); if (!(kg > 0)) return;
    const mon = U.mondayOf(p.fecha);
    (map[mon] = map[mon] || []).push(kg);
  });
  const arr = Object.keys(map).sort().map(mon => ({ mon, n: map[mon].length, prom: map[mon].reduce((a, b) => a + b, 0) / map[mon].length }));
  const by = {}; arr.forEach(w => by[w.mon] = w);
  arr.forEach(w => { const p = by[U.addDaysKey(w.mon, -7)]; w.cambio = p ? w.prom - p.prom : null; });
  return arr;
}
function pesajesSemana(mon) { return G().peso.filter(p => U.mondayOf(p.fecha) === mon).length; }

/* alertas del plan */
function alertas() {
  const out = [], info = [];
  const thisMon = U.mondayOf(U.todayKey());
  const ok = pesoSemanas().filter(w => w.n >= 2);
  const recent = ok.length && ok[ok.length - 1].mon >= U.addDaysKey(thisMon, -7);
  const consec = (a, b) => U.daysBetween(a.mon, b.mon) === 7;
  const last4 = ok.slice(-4);
  if (last4.length === 4 && recent && last4.every((w, i) => i === 0 || consec(last4[i - 1], w))) {
    const ch = [1, 2, 3].map(i => last4[i].prom - last4[i - 1].prom);
    if (ch.every(c => c < 0.2)) out.push({ cls: '', key: 'poco', text: 'Llevas 3 semanas subiendo menos de 0,2 kg/sem → come más (≈ +200 kcal/día)' });
  } else {
    info.push('Necesito 4 semanas seguidas con ≥2 pesajes para evaluar tu ritmo de subida (tienes ' + Math.min(ok.length, 4) + ' de 4).');
  }
  const l2 = ok.slice(-2);
  if (l2.length === 2 && recent && consec(l2[0], l2[1]) && (l2[1].prom - l2[0].prom) > 0.5) {
    out.push({ cls: 'bad', key: 'mucho', text: 'Subiste más de 0,5 kg esta semana → come un poco menos' });
  }
  // descarga
  const d = descargaInfo();
  if (d.sinDatos) info.push('Aún no hay sesiones registradas: no puedo calcular cuándo toca la semana de descarga.');
  else if (!d.activa) {
    if (d.semanas >= 8) out.push({ cls: 'bad', key: 'desc', text: 'Llevas ' + d.semanas + ' semanas sin descarga → descarga YA esta semana (baja el peso ~40 % o las series a la mitad)' });
    else if (d.semanas >= 6) out.push({ cls: '', key: 'desc', text: 'Toca semana de descarga (cada 6–8 semanas) · llevas ' + d.semanas + ' semanas' });
  }
  return { alerts: out, info };
}
function descargaInfo() {
  const g = G(), thisMon = U.mondayOf(U.todayKey());
  const activa = g.descargas.includes(thisMon);
  const last = g.descargas.slice().sort().pop();
  let base = last;
  if (!base) { const first = sortedSess().filter(sessCounts)[0]; if (first) base = first.fecha; }
  if (!base) return { sinDatos: true, activa };
  const semanas = Math.max(0, Math.round(U.daysBetween(U.mondayOf(base), thisMon) / 7));
  return { semanas, activa, desde: last ? 'tu última descarga' : 'tu primera sesión' };
}
function medidaInfo() {
  const l = G().medidas.slice().sort((a, b) => a.fecha < b.fecha ? -1 : 1).pop();
  if (!l) return { ultima: null, faltan: 0, tocan: true };
  const faltan = MEAS_EVERY - U.daysBetween(l.fecha, U.todayKey());
  return { ultima: l, faltan, tocan: faltan <= 0 };
}

/* ---------------- gráfico SVG genérico ---------------- */
// series: [{pts:[{x,y}], color, dash, line:true, dots:true, r}] · xLabels:[{x,t}]
function chart(series, xLabels, opts) {
  opts = opts || {};
  const W = 340, H = 190, L = 38, R = 10, T = 10, B = 24;
  const all = []; series.forEach(s => s.pts.forEach(p => all.push(p)));
  if (!all.length) return '<div class="m-sub">Sin datos todavía.</div>';
  let x0 = Math.min.apply(null, all.map(p => p.x)), x1 = Math.max.apply(null, all.map(p => p.x));
  let y0 = Math.min.apply(null, all.map(p => p.y)), y1 = Math.max.apply(null, all.map(p => p.y));
  if (x1 === x0) { x0 -= 1; x1 += 1; }
  if (y1 - y0 < 0.5) { y0 -= 1; y1 += 1; }
  const pad = (y1 - y0) * 0.1; y0 -= pad; y1 += pad;
  const X = x => L + (x - x0) / (x1 - x0) * (W - L - R);
  const Y = y => T + (1 - (y - y0) / (y1 - y0)) * (H - T - B);
  let svg = '<svg class="m-chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(opts.label || 'gráfico') + '">';
  for (let i = 0; i <= 3; i++) {
    const v = y0 + (y1 - y0) * i / 3, y = Y(v);
    svg += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y + '" y2="' + y + '" style="stroke:var(--cyan-line-soft)" stroke-width="1"/>' +
      '<text x="' + (L - 5) + '" y="' + (y + 3) + '" text-anchor="end" font-size="10" style="fill:var(--text-dim)">' + U.fmtNum(v, 1) + '</text>';
  }
  (xLabels || []).forEach(l => {
    svg += '<text x="' + X(l.x) + '" y="' + (H - 7) + '" text-anchor="' + (l.a || 'middle') + '" font-size="10" style="fill:var(--text-dim)">' + esc(l.t) + '</text>';
  });
  series.forEach(s => {
    const pts = s.pts.slice().sort((a, b) => a.x - b.x);
    if (s.line && pts.length > 1) {
      svg += '<polyline fill="none" stroke-width="2.2" stroke-linejoin="round" ' + (s.dash ? 'stroke-dasharray="5 4" ' : '') +
        'style="stroke:' + s.color + '" points="' + pts.map(p => X(p.x).toFixed(1) + ',' + Y(p.y).toFixed(1)).join(' ') + '"/>';
    }
    if (s.dots) pts.forEach(p => { svg += '<circle cx="' + X(p.x).toFixed(1) + '" cy="' + Y(p.y).toFixed(1) + '" r="' + (s.r || 3) + '" style="fill:' + s.color + '"/>'; });
  });
  return svg + '</svg>';
}
const legend = items => '<div class="m-legend">' + items.map(i =>
  '<span><svg width="22" height="8" style="vertical-align:middle"><line x1="0" x2="22" y1="4" y2="4" stroke-width="2.4" ' + (i.dash ? 'stroke-dasharray="5 4" ' : '') + 'style="stroke:' + i.color + '"/></svg> ' + esc(i.t) + '</span>').join('') + '</div>';

/* ============================================================
   ENTRENO
   ============================================================ */
function startSession(fecha) {
  const g = G();
  const s = { id: U.uid('s'), fecha, items: [], ts: Date.now() };
  g.plan.ejercicios.forEach(e => {
    const n = Math.max(1, parseInt(e.series, 10) || 1);
    s.items.push({ ejId: e.id, nombre: e.nombre, sets: Array.from({ length: n }, () => ({ kg: null, reps: null })) });
  });
  g.sesiones.push(s);
  save();
}
function e1Html(s, it) {
  const b = bestSet(it.sets);
  if (!b) return '<span class="m-dim">Fuerza estimada: —</span>';
  return 'Fuerza estimada (1RM): <b class="m-mono">' + f1(b.rm) + ' kg</b>' + (isRecord(s, it) ? ' <span class="gym-rec">RÉCORD</span>' : '');
}
function prevText(ejId, fecha) {
  const p = prevItem(ejId, fecha);
  if (!p) return 'primera vez';
  const b = bestSet(p.sets);
  return 'la vez pasada: ' + U.fmtNum(b.kg) + ' × ' + b.reps;
}
function renderExercise(s, it, idx) {
  const p = prevItem(it.ejId, s.fecha);
  const ps = p ? p.sets.filter(validSet) : [];
  const planEj = G().plan.ejercicios.find(e => e.id === it.ejId);
  const sets = it.sets.map((st, j) => {
    const ref = ps[j] || ps[ps.length - 1];
    const phK = ref ? U.fmtNum(num(ref.kg)) : 'kg', phR = ref ? ref.reps : 'reps';
    return '<div class="gym-set"><span class="gym-n">' + (j + 1) + '</span>' +
      '<input class="m-input num" inputmode="decimal" enterkeyhint="next" autocomplete="off" aria-label="kg serie ' + (j + 1) + '" placeholder="' + esc(phK) + '" value="' + (st.kg != null ? esc(String(st.kg).replace('.', ',')) : '') + '" data-i="' + idx + '" data-j="' + j + '" data-f="kg">' +
      '<span class="gym-x">×</span>' +
      '<input class="m-input num" inputmode="numeric" enterkeyhint="next" autocomplete="off" aria-label="reps serie ' + (j + 1) + '" placeholder="' + esc(phR) + '" value="' + (st.reps != null ? esc(String(st.reps)) : '') + '" data-i="' + idx + '" data-j="' + j + '" data-f="reps">' +
      '<button class="gym-del" data-a="delset" data-i="' + idx + '" data-j="' + j + '" aria-label="Quitar serie ' + (j + 1) + '">✕</button></div>';
  }).join('');
  return '<div class="m-card"><div class="gym-ex-head"><span class="gym-ex-name">' + esc(it.nombre) + '</span>' +
    '<span class="gym-prev">' + (planEj ? esc(planEj.series + '×' + planEj.reps) : '') + '</span></div>' +
    '<div class="gym-prev">' + esc(prevText(it.ejId, s.fecha)) + '</div>' +
    '<div class="gym-sets">' + sets + '</div>' +
    '<div class="gym-e1" data-e1="' + idx + '">' + e1Html(s, it) + '</div>' +
    '<div class="gym-actions"><button class="m-btn small ghost" data-a="addset" data-i="' + idx + '">+ SERIE</button></div></div>';
}
function progressCard() {
  const g = G();
  const opts = [], seen = {};
  g.plan.ejercicios.forEach(e => { if (!seen[e.id]) { seen[e.id] = 1; opts.push({ id: e.id, n: e.nombre }); } });
  g.sesiones.forEach(s => (s.items || []).forEach(i => { if (!seen[i.ejId]) { seen[i.ejId] = 1; opts.push({ id: i.ejId, n: i.nombre }); } }));
  if (!opts.length) return '';
  if (!selEx || !seen[selEx]) selEx = opts[0].id;
  const pts1 = [], pts2 = [];
  const sess = sortedSess().filter(s => itemOf(s, selEx));
  const base = sess.length ? sess[0].fecha : U.todayKey();
  const xs = [];
  sess.forEach(s => {
    const it = itemOf(s, selEx), b = bestSet(it.sets);
    if (!b) return;
    const x = U.daysBetween(base, s.fecha);
    pts1.push({ x, y: b.rm }); pts2.push({ x, y: maxKg(it.sets) }); xs.push({ x, f: s.fecha });
  });
  let body;
  if (!pts1.length) body = '<div class="m-sub">Aún no hay series registradas de este ejercicio.</div>';
  else {
    const labels = [{ x: xs[0].x, t: shortD(xs[0].f), a: xs.length > 1 ? 'start' : 'middle' }];
    if (xs.length > 1) labels.push({ x: xs[xs.length - 1].x, t: shortD(xs[xs.length - 1].f), a: 'end' });
    body = '<div class="gym-chart-wrap">' + chart([
      { pts: pts2, color: 'var(--warning)', dash: true, line: true, dots: true, r: 2.5 },
      { pts: pts1, color: 'var(--cyan)', line: true, dots: true, r: 3 }
    ], labels, { label: 'Progreso de ' + selEx }) + '</div>' +
      legend([{ t: '1RM estimado (kg)', color: 'var(--cyan)' }, { t: 'Kg máximo usado', color: 'var(--warning)', dash: true }]);
  }
  return '<div class="m-card"><div class="m-label hi">PROGRESO POR EJERCICIO</div>' +
    '<select class="m-select" data-a="selex" aria-label="Ejercicio">' + opts.map(o => '<option value="' + esc(o.id) + '"' + (o.id === selEx ? ' selected' : '') + '>' + esc(o.n) + '</option>').join('') + '</select>' +
    body + '</div>';
}
function planEditor() {
  const g = G();
  return '<div class="m-card accent"><div class="m-label hi">EDITAR PLAN</div>' +
    '<div class="m-sub">Días de entreno</div><div class="m-chips">' +
    DAYS_L.map((l, i) => '<button class="m-chip' + (g.plan.dias.includes(i + 1) ? ' on' : '') + '" data-a="pday" data-d="' + (i + 1) + '" aria-pressed="' + g.plan.dias.includes(i + 1) + '" aria-label="' + DAYS_FULL[i] + '">' + l + '</button>').join('') + '</div>' +
    '<div class="m-sub">Ejercicios · nombre · series · reps (texto)</div>' +
    '<div class="m-stack" style="gap:12px">' + g.plan.ejercicios.map((e, i) =>
      '<div class="m-stack" style="gap:6px"><div class="gym-plan-row">' +
      '<input class="m-input" data-p="nombre" data-i="' + i + '" value="' + esc(e.nombre) + '" aria-label="Nombre">' +
      '<input class="m-input num" inputmode="numeric" data-p="series" data-i="' + i + '" value="' + esc(e.series) + '" aria-label="Series">' +
      '<input class="m-input num" data-p="reps" data-i="' + i + '" value="' + esc(e.reps) + '" aria-label="Repeticiones"></div>' +
      '<div class="gym-plan-tools"><button class="m-btn small ghost" data-a="pup" data-i="' + i + '" aria-label="Subir">↑</button>' +
      '<button class="m-btn small ghost" data-a="pdown" data-i="' + i + '" aria-label="Bajar">↓</button>' +
      '<button class="m-btn small danger" data-a="pdel" data-i="' + i + '" aria-label="Quitar ejercicio">✕ QUITAR</button></div></div>').join('') + '</div>' +
    '<button class="m-btn" data-a="padd">+ AGREGAR EJERCICIO</button>' +
    '<button class="m-btn primary block" data-a="pdone">LISTO</button></div>';
}

function renderEntreno(el) {
  const today = U.todayKey();
  const fecha = entDate || today;
  const s = sessOn(fecha);
  let h = '<div class="m-stack">';
  if (planEdit) {
    h += planEditor() + '</div>';
    el.innerHTML = h; wireEntreno(el); return;
  }
  h += '<div class="m-card"><div class="gym-datenav">' +
    '<button class="m-btn" data-a="dprev" aria-label="Día anterior">◀</button>' +
    '<div class="gym-date">' + esc(fmtDate(fecha)) + (fecha === today ? ' · hoy' : '') + '</div>' +
    '<button class="m-btn" data-a="dnext" aria-label="Día siguiente"' + (fecha >= today ? ' disabled style="opacity:.35"' : '') + '>▶</button></div>';
  if (!s) {
    const plan = G().plan;
    h += '<div class="m-sub">' + (plan.dias.includes(isoDow(fecha)) ? 'Hoy es día de plan · ' : 'Sin sesión este día · ') + plan.ejercicios.length + ' ejercicios en el plan.</div>' +
      '<button class="m-btn primary block" data-a="start">EMPEZAR SESIÓN</button></div>';
  } else {
    const n = recordCount(s);
    h += '<div class="m-sub">' + (s.fin ? 'Sesión terminada ✓' : 'Sesión en curso') + (n ? ' · ' + n + (n === 1 ? ' récord' : ' récords') : '') + '</div></div>';
    h += s.items.map((it, i) => renderExercise(s, it, i)).join('');
    h += '<button class="m-btn primary block" data-a="finish">' + (s.fin ? 'ACTUALIZAR SESIÓN' : 'TERMINAR SESIÓN') + '</button>' +
      '<button class="gym-link" data-a="delsess">Borrar esta sesión</button>';
  }
  h += progressCard();
  h += '<button class="gym-link" data-a="pedit">Editar plan</button></div>';
  el.innerHTML = h;
  wireEntreno(el);
}

function wireEntreno(el) {
  el.oninput = e => {
    const t = e.target;
    if (t.dataset.f) {           // kg / reps de una serie
      const s = sessOn(entDate || U.todayKey()); if (!s) return;
      const st = s.items[+t.dataset.i].sets[+t.dataset.j];
      st[t.dataset.f] = t.dataset.f === 'kg' ? num(t.value) : (num(t.value) != null ? Math.round(num(t.value)) : null);
      save(true);
      const box = el.querySelector('[data-e1="' + t.dataset.i + '"]');
      if (box) box.innerHTML = e1Html(s, s.items[+t.dataset.i]);
    } else if (t.dataset.p) {    // edición del plan
      const ej = G().plan.ejercicios[+t.dataset.i]; if (!ej) return;
      if (t.dataset.p === 'series') ej.series = Math.max(1, parseInt(t.value, 10) || 1);
      else ej[t.dataset.p] = t.value;
      save(true);
    }
  };
  el.onchange = e => {
    const t = e.target;
    if (t.dataset.a === 'selex') { selEx = t.value; App.refresh(); }
    else if (t.dataset.p === 'nombre' && !t.value.trim()) { t.value = G().plan.ejercicios[+t.dataset.i].nombre; }
  };
  el.onclick = e => {
    const b = e.target.closest('[data-a]'); if (!b || b.tagName === 'SELECT') return;
    const a = b.dataset.a, g = G(), today = U.todayKey(), fecha = entDate || today;
    const s = sessOn(fecha), i = +b.dataset.i, j = +b.dataset.j;
    if (a === 'dprev') { entDate = U.addDaysKey(fecha, -1); App.refresh(); }
    else if (a === 'dnext') { if (fecha < today) { const n = U.addDaysKey(fecha, 1); entDate = n >= today ? null : n; App.refresh(); } }
    else if (a === 'start') { startSession(fecha); }
    else if (a === 'addset' && s) { s.items[i].sets.push({ kg: null, reps: null }); save(); }
    else if (a === 'delset' && s) { if (s.items[i].sets.length > 1) s.items[i].sets.splice(j, 1); else s.items[i].sets[0] = { kg: null, reps: null }; save(); }
    else if (a === 'finish' && s) {
      s.fin = true; s.ts = Date.now(); save();
      App.autoMarkHabit(/ejercicio|gym|entren/i, fecha);
      const n = recordCount(s);
      U.toast('Sesión guardada 💪' + (n ? ' · ' + n + (n === 1 ? ' récord' : ' récords') : ''));
    }
    else if (a === 'delsess' && s) { if (confirm('¿Borrar la sesión de este día?')) { g.sesiones = g.sesiones.filter(x => x !== s); save(); } }
    else if (a === 'pedit') { planEdit = true; App.refresh(); }
    else if (a === 'pdone') { planEdit = false; App.refresh(); }
    else if (a === 'pday') { const d = +b.dataset.d, ds = g.plan.dias; const k = ds.indexOf(d); if (k >= 0) ds.splice(k, 1); else ds.push(d); ds.sort(); save(); }
    else if (a === 'padd') { g.plan.ejercicios.push({ id: nextExId(), nombre: 'Nuevo ejercicio', series: 3, reps: '8-10' }); save(); }
    else if (a === 'pdel') { if (confirm('¿Quitar este ejercicio del plan? (tu historial se conserva)')) { g.plan.ejercicios.splice(i, 1); save(); } }
    else if (a === 'pup' && i > 0) { const l = g.plan.ejercicios; [l[i - 1], l[i]] = [l[i], l[i - 1]]; save(); }
    else if (a === 'pdown' && i < g.plan.ejercicios.length - 1) { const l = g.plan.ejercicios; [l[i + 1], l[i]] = [l[i], l[i + 1]]; save(); }
  };
}
function nextExId() {
  const used = {}; G().plan.ejercicios.forEach(e => used[e.id] = 1); G().sesiones.forEach(s => (s.items || []).forEach(i => used[i.ejId] = 1));
  let n = G().plan.ejercicios.length + 1; while (used['e' + n]) n++;
  return 'e' + n;
}

/* ============================================================
   MEDIDAS
   ============================================================ */
function renderMedidas(el) {
  const g = G(), today = U.todayKey(), thisMon = U.mondayOf(today);
  const hoyPeso = g.peso.find(p => p.fecha === today);
  const nSem = pesajesSemana(thisMon);
  const weeks = pesoSemanas();
  const last8 = weeks.slice(-8);
  const prevCh = {}; weeks.forEach(w => prevCh[w.mon] = w);
  let h = '<div class="m-stack">';

  // peso en ayunas
  h += '<div class="m-card"><div class="m-label hi">PESO EN AYUNAS</div>' +
    '<div class="m-row"><input class="m-input num" id="gym-peso" inputmode="decimal" autocomplete="off" aria-label="Peso en kg" placeholder="' + (hoyPeso ? f1(num(hoyPeso.kg)) : (g.peso.length ? f1(num(g.peso.slice().sort((a, b) => a.fecha < b.fecha ? -1 : 1).pop().kg)) : 'kg')) + '" value="">' +
    '<button class="m-btn primary" data-a="savepeso" style="white-space:nowrap">GUARDAR</button></div>' +
    '<div class="m-sub">' + (hoyPeso ? 'Hoy ya pesaste ' + f1(num(hoyPeso.kg)) + ' kg · guardar de nuevo lo reemplaza.' : 'Pésate al despertar, tras ir al baño y antes de comer.') + '</div>' +
    '<div class="m-alert' + (nSem >= 2 ? ' ok' : '') + '">Esta semana llevas <b>' + nSem + '</b> ' + (nSem === 1 ? 'pesaje' : 'pesajes') + ' · meta: 2–3 por semana' + (nSem >= 3 ? ' ✓' : '') + '</div></div>';

  // promedio semanal
  h += '<div class="m-card"><div class="m-label hi">PROMEDIO SEMANAL</div>';
  if (!last8.length) h += '<div class="m-sub">Registra tu primer peso para ver promedios por semana.</div>';
  else {
    h += '<div class="gym-scroll"><table class="gym-wk"><thead><tr><th>SEMANA</th><th>PROM</th><th>N</th><th>CAMBIO</th></tr></thead><tbody>' +
      last8.slice().reverse().map(w => {
        const c = w.cambio;
        const cls = c == null ? 'm-dim' : c < 0 ? 'm-bad' : c < 0.2 ? 'm-warn' : c <= 0.5 ? 'm-good' : 'm-warn';
        return '<tr><td>' + shortD(w.mon) + '</td><td>' + f1(w.prom) + ' kg</td><td' + (w.n < 2 ? ' class="m-warn"' : '') + '>' + w.n + '</td><td class="' + cls + '">' + (c == null ? '—' : sign(c) + ' kg') + '</td></tr>';
      }).join('') + '</tbody></table></div>' +
      '<div class="m-sub">Cambio vs la semana anterior. Ideal para subir: +0,2 a +0,5 kg/sem (verde). N&lt;2 = poco fiable.</div>';
    // gráfico
    const first = last8[0].mon;
    const dayPts = g.peso.filter(p => p.fecha >= first && num(p.kg) > 0).map(p => ({ x: U.daysBetween(first, p.fecha), y: num(p.kg) }));
    const avgPts = last8.map(w => ({ x: U.daysBetween(first, w.mon) + 3, y: w.prom }));
    const tot = U.daysBetween(first, U.addDaysKey(last8[last8.length - 1].mon, 6));
    h += '<div class="gym-chart-wrap">' + chart([
      { pts: dayPts, color: 'var(--text-dim)', dots: true, r: 2.5 },
      { pts: avgPts, color: 'var(--cyan)', line: true, dots: true, r: 3 }
    ], [{ x: 0, t: shortD(first), a: 'start' }, { x: tot, t: shortD(U.addDaysKey(first, tot)), a: 'end' }], { label: 'Peso diario y promedio semanal' }) + '</div>' +
      legend([{ t: 'Promedio semanal', color: 'var(--cyan)' }, { t: 'Pesajes diarios (puntos)', color: 'var(--text-dim)' }]);
  }
  h += '</div>';

  // últimos registros
  const recent = g.peso.slice().sort((a, b) => a.fecha < b.fecha ? 1 : -1).slice(0, 10);
  if (recent.length) h += '<div class="m-card"><div class="m-label">ÚLTIMOS REGISTROS</div><div class="m-list">' +
    recent.map(p => '<div class="gym-hist-row"><span>' + esc(fmtDate(p.fecha)) + '</span><span class="m-mono">' + f1(num(p.kg)) + ' kg</span>' +
      '<button class="m-btn small ghost danger" data-a="delpeso" data-f="' + p.fecha + '" aria-label="Borrar registro">✕</button></div>').join('') + '</div></div>';

  // circunferencias
  const mi = medidaInfo();
  const lastM = mi.ultima;
  h += '<div class="m-card"><div class="m-label hi">CIRCUNFERENCIAS · CADA 4 SEMANAS</div>' +
    '<div class="m-alert' + (mi.tocan ? '' : ' ok') + '">' + (!lastM ? 'Aún no tienes medidas: toma las primeras hoy.' :
      'Última: ' + esc(fmtDate(lastM.fecha)) + ' · ' + (mi.tocan ? (mi.faltan === 0 ? 'toca hoy' : 'toca desde hace ' + (-mi.faltan) + ' días') : 'faltan ' + mi.faltan + ' días para la próxima')) + '</div>' +
    '<div class="gym-meas-grid">' + MEAS_FIELDS.map(f => '<label class="m-field">' + f[1] + ' (cm)<input class="m-input num" inputmode="decimal" autocomplete="off" data-m="' + f[0] + '" placeholder="' + (lastM && lastM[f[0]] != null ? U.fmtNum(lastM[f[0]], 1) : 'cm') + '"></label>').join('') + '</div>' +
    '<button class="gym-toggle" id="gym-fotos" data-a="fotos" aria-pressed="false"><span class="box"></span><span class="t">Fotos hechas</span></button>' +
    '<button class="m-btn primary block" data-a="savemeas">GUARDAR MEDIDAS DE HOY</button>';
  const ms = g.medidas.slice().sort((a, b) => a.fecha < b.fecha ? -1 : 1);
  if (ms.length) {
    h += '<div class="gym-scroll"><table class="gym-wk"><thead><tr><th>FECHA</th>' + MEAS_FIELDS.map(f => '<th>' + f[1].slice(0, 3) + '</th>').join('') + '<th class="c">FOTO</th></tr></thead><tbody>' +
      ms.map((m, k) => '<tr><td>' + shortD(m.fecha) + '</td>' + MEAS_FIELDS.map(f => {
        const v = m[f[0]], pv = k ? ms[k - 1][f[0]] : null;
        const d = (v != null && pv != null) ? v - pv : null;
        const up = f[0] !== 'cintura';       // brazo/pecho/muslo suben = bien; cintura sube = ojo
        const dc = d == null || d === 0 ? 'm-dim' : ((d > 0) === up ? 'm-good' : 'm-warn');
        return '<td>' + (v != null ? U.fmtNum(v, 1) : '—') + (d != null && d !== 0 ? '<br><small class="' + dc + '">' + sign(d) + '</small>' : '') + '</td>';
      }).join('') + '<td class="c">' + (m.fotos ? '✓' : '·') + '</td></tr>').reverse().join('') + '</tbody></table></div>';
  }
  h += '</div></div>';
  el.innerHTML = h;

  let fotos = false;
  el.onclick = e => {
    const b = e.target.closest('[data-a]'); if (!b) return;
    const a = b.dataset.a;
    if (a === 'fotos') {
      fotos = !fotos; b.classList.toggle('on', fotos); b.setAttribute('aria-pressed', fotos);
      b.querySelector('.box').textContent = fotos ? '✓' : '';
    } else if (a === 'savepeso') {
      const v = num(el.querySelector('#gym-peso').value);
      if (!(v >= 20 && v <= 400)) { U.toast('Escribe un peso válido en kg'); return; }
      const i = g.peso.findIndex(p => p.fecha === today);
      if (i >= 0) g.peso[i].kg = v; else g.peso.push({ fecha: today, kg: v });
      g.peso.sort((a, b2) => a.fecha < b2.fecha ? -1 : 1);
      save(); U.toast('Peso guardado: ' + f1(v) + ' kg');
    } else if (a === 'delpeso') {
      if (confirm('¿Borrar este registro de peso?')) { g.peso = g.peso.filter(p => p.fecha !== b.dataset.f); save(); }
    } else if (a === 'savemeas') {
      const rec = { fecha: today, fotos };
      let any = false;
      el.querySelectorAll('[data-m]').forEach(inp => { const v = num(inp.value); rec[inp.dataset.m] = v; if (v != null) any = true; });
      if (!any) { U.toast('Escribe al menos una medida'); return; }
      const i = g.medidas.findIndex(m => m.fecha === today);
      if (i >= 0) g.medidas[i] = rec; else g.medidas.push(rec);
      save(); U.toast('Medidas guardadas');
    }
  };
}

/* ============================================================
   SEMANA
   ============================================================ */
const MANUAL = [['proteina', 'Proteína (meta diaria)'], ['sueno', 'Sueño 8–9 h'], ['movilidad', 'Movilidad'], ['cerro', 'Cerro']];
function renderSemana(el) {
  const g = G(), today = U.todayKey(), thisMon = U.mondayOf(today);
  if (!weekMon || weekMon > thisMon) weekMon = thisMon;
  const wk = U.weekKey(weekMon);
  const sw = g.semanas[wk] || {};
  const ses = sessionsInWeek(weekMon).length;
  const meta = 3;
  const al = alertas();
  const d = descargaInfo();
  let h = '<div class="m-stack">';

  h += '<div class="m-card"><div class="gym-datenav"><button class="m-btn" data-a="wprev" aria-label="Semana anterior">◀</button>' +
    '<div class="gym-date">' + (weekMon === thisMon ? 'Esta semana' : 'Semana del ' + shortD(weekMon)) + '<div class="m-sub" style="font-weight:400;text-transform:none">' + shortD(weekMon) + ' – ' + shortD(U.addDaysKey(weekMon, 6)) + '</div></div>' +
    '<button class="m-btn" data-a="wnext" aria-label="Semana siguiente"' + (weekMon >= thisMon ? ' disabled style="opacity:.35"' : '') + '>▶</button></div>' +
    '<div class="gym-toggle auto' + (ses >= meta ? ' on' : '') + '"><span class="box">' + (ses >= meta ? '✓' : '') + '</span><span class="t">3 sesiones de gym <b class="m-mono">' + ses + '/' + meta + '</b> <span class="m-dim">(automático)</span></span></div>' +
    '<div class="m-bar"><i style="width:' + Math.min(100, ses / meta * 100) + '%"></i></div>' +
    MANUAL.map(m => '<button class="gym-toggle' + (sw[m[0]] ? ' on' : '') + '" data-a="tog" data-k="' + m[0] + '" aria-pressed="' + !!sw[m[0]] + '"><span class="box">' + (sw[m[0]] ? '✓' : '') + '</span><span class="t">' + m[1] + '</span></button>').join('') + '</div>';

  // alertas
  h += '<div class="m-card"><div class="m-label hi">ALERTAS DEL PLAN</div>';
  if (!al.alerts.length && !al.info.length) h += '<div class="m-alert ok">Todo en rango: ritmo de peso y descarga al día.</div>';
  al.alerts.forEach(a => { h += '<div class="m-alert' + (a.cls ? ' ' + a.cls : '') + '">' + esc(a.text) + '</div>'; });
  al.info.forEach(t => { h += '<div class="m-sub">· ' + esc(t) + '</div>'; });
  if (d.activa) h += '<div class="m-alert ok">Semana de descarga activa: baja el peso o las series a la mitad.</div>';
  else h += '<button class="m-btn block" data-a="descarga">EMPIEZO DESCARGA ESTA SEMANA</button>';
  if (!d.sinDatos) h += '<div class="m-sub">Semanas desde ' + esc(d.desde || 'la última descarga') + ': <b class="m-mono">' + d.semanas + '</b></div>';
  h += '</div>';

  // historial 8 semanas
  const rows = [];
  for (let k = 0; k < 8; k++) rows.push(U.addDaysKey(thisMon, -7 * k));
  h += '<div class="m-card"><div class="m-label hi">ÚLTIMAS 8 SEMANAS</div><div class="gym-scroll"><table class="gym-wk"><thead><tr><th>SEM</th><th class="c">GYM</th><th class="c">PRO</th><th class="c">SUE</th><th class="c">MOV</th><th class="c">CER</th></tr></thead><tbody>' +
    rows.map(mon => {
      const w = g.semanas[U.weekKey(mon)] || {}, n = sessionsInWeek(mon).length;
      const dot = on => '<span class="gym-dot' + (on ? ' on' : '') + '"></span>';
      const gym = '<span class="gym-dot' + (n >= meta ? ' on' : n > 0 ? ' part' : '') + '"></span>';
      return '<tr><td>' + shortD(mon) + (g.descargas.includes(mon) ? ' <span class="m-warn" title="descarga">D</span>' : '') + '</td><td class="c">' + gym + ' <small class="m-dim">' + n + '</small></td>' +
        MANUAL.map(m => '<td class="c">' + dot(w[m[0]]) + '</td>').join('') + '</tr>';
    }).join('') + '</tbody></table></div><div class="m-sub">Gym: lleno = 3+ sesiones, ámbar = 1–2. D = semana de descarga.</div></div></div>';
  el.innerHTML = h;

  el.onclick = e => {
    const b = e.target.closest('[data-a]'); if (!b) return;
    const a = b.dataset.a;
    if (a === 'wprev') { weekMon = U.addDaysKey(weekMon, -7); App.refresh(); }
    else if (a === 'wnext') { if (weekMon < thisMon) { weekMon = U.addDaysKey(weekMon, 7); App.refresh(); } }
    else if (a === 'tog') { const o = g.semanas[wk] = g.semanas[wk] || {}; o[b.dataset.k] = !o[b.dataset.k]; save(); }
    else if (a === 'descarga') { if (!g.descargas.includes(thisMon)) { g.descargas.push(thisMon); g.descargas.sort(); } save(); U.toast('Descarga registrada para esta semana'); }
  };
}

/* ============================================================
   HOY · exportar
   ============================================================ */
function hoyCards() {
  const g = G(), out = [], today = U.todayKey();
  const s = sessOn(today);
  const toca = g.plan.dias.includes(isoDow(today));
  if (toca && !(s && s.fin)) {
    out.push({ order: 20, area: 'Cuerpo', titulo: 'Hoy toca gym', sub: 'Full-body · ' + g.plan.ejercicios.length + ' ejercicios' + (s ? ' · sesión en curso' : ' precargados'), xp: 20, go: 'cuerpo/entreno' });
  }
  if (pesajesSemana(U.mondayOf(today)) < 2 && new Date().getHours() < 12 && !g.peso.some(p => p.fecha === today)) {
    out.push({ order: 25, area: 'Medidas', titulo: 'Pésate en ayunas', sub: 'Llevas ' + pesajesSemana(U.mondayOf(today)) + ' esta semana', xp: 3, go: 'cuerpo/medidas' });
  }
  if (medidaInfo().tocan) {
    out.push({ order: 26, area: 'Medidas', titulo: 'Medidas y fotos del mes', sub: 'Brazo, pecho, muslo y cintura', xp: 10, go: 'cuerpo/medidas' });
  }
  const al = alertas().alerts;
  if (al.length) {
    out.push({ order: 27, area: 'Plan gym', titulo: al[0].text, sub: al.length > 1 ? '+' + (al.length - 1) + ' alerta más' : 'Toca para ver el detalle', xp: 0, go: 'cuerpo/semana', tone: 'warn' });
  }
  return out;
}
// para HOY: estado del registro rápido
function hoyResumen() {
  const g = G(), today = U.todayKey(), s = sessOn(today);
  return { entrenoHoy: !!(s && s.fin), tocaHoy: g.plan.dias.includes(isoDow(today)), pesajesSemana: pesajesSemana(U.mondayOf(today)) };
}
function exportData() {
  const g = G();
  const pw = pesoSemanas().map(w => ({ semana: U.weekKey(w.mon), lunes: w.mon, promedio: +w.prom.toFixed(2), n: w.n, cambio: w.cambio == null ? null : +w.cambio.toFixed(2) }));
  return {
    _leeme: {
      plan: 'Rutina full-body: dias (1=lunes…7=domingo) y ejercicios {id,nombre,series,reps}',
      sesiones: 'Sesiones de gym: items por ejercicio con sets {kg,reps}; rm1_estimado = mejor serie por Epley kg×(1+reps/30); fin=true si la terminó',
      peso: 'Peso en ayunas {fecha, kg}',
      promediosSemanales: 'Promedio de peso por semana ISO (lunes–domingo); cambio = diferencia en kg vs la semana anterior; n = pesajes',
      medidas: 'Circunferencias en cm cada 4 semanas {brazo,pecho,muslo,cintura} y si hubo fotos',
      semanas: 'Checklist manual por semana ISO: proteina, sueno, movilidad, cerro (las sesiones de gym se cuentan solas)',
      descargas: 'Lunes de inicio de cada semana de descarga'
    },
    plan: g.plan,
    sesiones: sortedSess().map(s => ({
      fecha: s.fecha, fin: !!s.fin,
      items: (s.items || []).map(it => { const b = bestSet(it.sets); return { ejercicio: it.nombre, ejId: it.ejId, sets: it.sets, rm1_estimado: b ? +b.rm.toFixed(1) : null, kg_max: maxKg(it.sets) }; })
    })),
    peso: g.peso, promediosSemanales: pw, medidas: g.medidas, semanas: g.semanas, descargas: g.descargas
  };
}
function exportCSV() {
  const rows = [];
  sortedSess().forEach(s => (s.items || []).forEach(it => it.sets.forEach((st, j) => {
    if (!validSet(st)) return;
    rows.push({ fecha: s.fecha, ejercicio: it.nombre, serie: j + 1, kg: num(st.kg), reps: num(st.reps), rm_estimado: +rm(num(st.kg), num(st.reps)).toFixed(1) });
  })));
  const g = G();
  return {
    'gym_series.csv': U.toCSV(rows, ['fecha', 'ejercicio', 'serie', 'kg', 'reps', 'rm_estimado']),
    'peso.csv': U.toCSV(g.peso.slice().sort((a, b) => a.fecha < b.fecha ? -1 : 1), ['fecha', 'kg']),
    'medidas.csv': U.toCSV(g.medidas.slice().sort((a, b) => a.fecha < b.fecha ? -1 : 1), ['fecha', 'brazo', 'pecho', 'muslo', 'cintura', 'fotos'])
  };
}

App.register({
  id: 'gym',
  defaults,
  subviews: [
    { parent: 'cuerpo', id: 'entreno', label: 'ENTRENO', order: 2, render: renderEntreno },
    { parent: 'cuerpo', id: 'medidas', label: 'MEDIDAS', order: 3, render: renderMedidas },
    { parent: 'cuerpo', id: 'semana', label: 'SEMANA', order: 4, render: renderSemana }
  ],
  hoyCards, hoyResumen, exportData, exportCSV
});
})();
