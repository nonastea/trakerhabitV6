/* ============================================================
   V7 · Módulo DATOS — exportar para Claude, cruces rápidos y hub «Más».
   ============================================================ */
(function () {
'use strict';

const U = () => App.util;
const esc = s => App.util.esc(s);
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const SENSITIVE_RE = /token|api[_-]?key|secret|password|^key$|_key$/i;

let rango = '30';            // '30' | '90' | 'todo'  (UI efímera)
let showSueno = true, showPicor = true;

/* ---------------- utilidades ---------------- */
function today() { return U().todayKey(); }
function rangeBounds() {
  const hasta = today();
  if (rango === 'todo') return { desde: '', hasta };
  return { desde: U().addDaysKey(hasta, -(Number(rango) - 1)), hasta };
}
function earliestHabitDate() {
  let min = null;
  Object.values(state.completions || {}).forEach(o => Object.keys(o || {}).forEach(k => { if (DATE_RE.test(k) && (!min || k < min)) min = k; }));
  return min;
}
function daysList(desde, hasta) {
  const out = []; let k = desde, n = 0;
  while (k <= hasta && n++ < 4000) { out.push(k); k = U().addDaysKey(k, 1); }
  return out;
}
function toKey(v) {
  if (v == null || v === '') return null;
  if (typeof v === 'string' && DATE_RE.test(v)) return v;
  const d = new Date(v); if (isNaN(d)) return null;
  return U().keyOf(d);
}
function inRange(k, b) { return !!k && (!b.desde || k >= b.desde) && k <= b.hasta; }

// copia profunda: quita claves sensibles y filtra por fecha (arrays con .fecha, diccionarios con claves fecha)
function clean(v, b) {
  if (Array.isArray(v)) {
    return v.filter(x => !(x && typeof x === 'object' && typeof x.fecha === 'string' && DATE_RE.test(x.fecha) && !inRange(x.fecha, b)))
            .map(x => clean(x, b));
  }
  if (v && typeof v === 'object') {
    const keys = Object.keys(v);
    const dateDict = keys.length > 0 && keys.every(k => DATE_RE.test(k));
    const o = {};
    keys.forEach(k => {
      if (SENSITIVE_RE.test(k)) return;
      if (dateDict && !inRange(k, b)) return;
      o[k] = clean(v[k], b);
    });
    return o;
  }
  return v;
}

function habitPctByDay(days) {
  const hs = state.habits || [];
  return days.map(k => {
    let n = 0;
    hs.forEach(h => { if (state.completions[h.id] && state.completions[h.id][k]) n++; });
    return { fecha: k, hechos: n, total: hs.length, pct: hs.length ? Math.round(n / hs.length * 100) : 0 };
  });
}

function hace(ts) {
  if (!ts) return 'nunca';
  const m = Math.round((Date.now() - ts) / 60000);
  if (m < 1) return 'hace un momento';
  if (m < 60) return 'hace ' + m + ' min';
  const h = Math.round(m / 60);
  if (h < 24) return 'hace ' + h + ' h';
  const d = Math.round(h / 24);
  return 'hace ' + d + (d === 1 ? ' día' : ' días');
}

/* ---------------- paquete de exportación ---------------- */
const LEEME = 'Exportación de mi app de hábitos (V7). Áreas: habitos (lista, marcas hechas por día y cumplimiento diario), tareas (activas y completadas), '
  + 'eventos (calendario), modulos (piel, gym, plata… cada uno con su propio _leeme), milo (resumen del juego). '
  + 'Convenciones: todas las fechas son locales en formato YYYY-MM-DD y las horas HH:MM (24 h); el rango pedido está en «rango». '
  + 'En el módulo piel, la fecha de cada registro es la MAÑANA del check-in y los campos picor/sueño/horas describen la NOCHE ANTERIOR; '
  + 'los tratamientos (trat) son los aplicados ese mismo día (M=mañana, T=tarde, N=noche). '
  + 'En habitos.marcas solo aparecen los hábitos hechos; cumplimientoDiario es hechos/total de la lista actual de hábitos. '
  + 'Los montos de plata están en CLP salvo que se indique otra moneda. Las fotos NO viven en la app (solo hay un indicador si se sacaron). '
  + 'Se excluyen claves, tokens y configuración sensible.';

function buildPackage() {
  const b = rangeBounds();
  const hasta = b.hasta;
  let desdeEf = b.desde;
  if (!desdeEf) desdeEf = earliestHabitDate() || U().addDaysKey(hasta, -29);
  const days = daysList(desdeEf, hasta);
  const hs = state.habits || [];
  const marcas = [];
  days.forEach(k => hs.forEach(h => { if (state.completions[h.id] && state.completions[h.id][k]) marcas.push({ fecha: k, habitoId: h.id, habito: h.name }); }));
  const catName = id => ((state.categories || []).find(c => c.id === id) || {}).name || id;

  const completadas = (state.taskLog || []).map(t => ({ fecha: toKey(t.completedAt), texto: t.text }))
    .filter(t => inRange(t.fecha, b));
  const activas = (state.tasks || []).map(t => clean({ texto: t.text, creada: toKey(t.createdAt), fechaLimite: t.dueDate || t.due || undefined, prioridad: t.priority }, { desde: '', hasta: '9999-12-31' }));
  const eventos = (state.events || []).filter(e => inRange(e.date, b)).map(e => ({ fecha: e.date, hora: e.time || null, texto: e.text }));

  const modulos = {};
  App.modules().forEach(m => {
    if (typeof m.exportData !== 'function') return;
    try { modulos[m.id] = clean(m.exportData(), b); }
    catch (e) { modulos[m.id] = { error: 'no se pudo exportar: ' + e.message }; }
  });

  return {
    _formato: 'habitos-v7-export', _version: 1,
    exportadoEl: new Date().toISOString(),
    rango: { opcion: rango === 'todo' ? 'todo' : 'ultimos_' + rango + '_dias', desde: desdeEf, hasta },
    _leeme: { general: LEEME },
    habitos: {
      lista: hs.map(h => ({ id: h.id, nombre: h.name, detalle: h.sub || '', categoria: catName(h.category) })),
      marcas,
      cumplimientoDiario: habitPctByDay(days)
    },
    tareas: { activas, completadas },
    eventos,
    modulos,
    milo: { resumen: miloResumen() }
  };
}

function miloResumen() {
  try {
    if (!(window.MODO_JUEGO && MODO_JUEGO.motor)) return null;
    const M = MODO_JUEGO.motor(); if (!M) return null;
    const r = { xpTotal: M.xpTotal, confianza: M.confianza, baros: M.baros };
    try {
      const C = MODO_JUEGO.CFG;
      if (C && typeof C.curva === 'function') { let n = 1; while (C.curva(n + 1) <= M.xpTotal && n < 999) n++; r.nivel = n; }
    } catch (e) {}
    return r;
  } catch (e) { return null; }
}

function buildClaudeText() {
  const pkg = buildPackage();
  const head = '# Exportación de mi app de hábitos\n\n'
    + 'Estos son mis datos de la app de hábitos (V7): hábitos, tareas, piel, gimnasio y plata.\n'
    + '- Exportado: ' + pkg.exportadoEl + '\n'
    + '- Rango: ' + pkg.rango.desde + ' a ' + pkg.rango.hasta + '\n'
    + '- Cómo leerlo: el bloque JSON de abajo trae un campo `_leeme` con las convenciones (fechas locales YYYY-MM-DD; en piel, la fecha es la mañana y habla de la noche anterior). '
    + 'Cada módulo tiene además su propio `_leeme`.\n\n'
    + 'Analízalo con estos datos y dime qué patrones ves.\n\n';
  return head + '```json\n' + JSON.stringify(pkg) + '\n```\n';
}

function stamp() { state.datos.ultimaExport = Date.now(); App.save('datos', { noRender: true }); const el = document.getElementById('datosUlt'); if (el) el.textContent = 'Última exportación: ' + hace(state.datos.ultimaExport); }
function kb(s) { return Math.round(new Blob([s]).size / 1024); }

async function doCopy() {
  const text = buildClaudeText(); const size = kb(text);
  const ok = await U().copyText(text);
  if (ok) {
    stamp();
    U().toast('COPIADO · ' + size + ' KB' + (size > 400 ? ' · ES GRANDE: MEJOR USA EL ARCHIVO' : ''));
  } else U().toast('NO SE PUDO COPIAR · USA EL ARCHIVO');
  const w = document.getElementById('datosWarn'); if (w) { w.hidden = size <= 400; w.textContent = size > 400 ? 'El paquete pesa ' + size + ' KB: puede no caber al pegarlo en un chat. Descarga el archivo y adjúntalo.' : ''; }
}

async function shareOrDownload(files, fallback) {
  try {
    if (navigator.canShare && navigator.canShare({ files })) {
      await navigator.share({ files });
      return true;
    }
  } catch (e) { if (e && e.name === 'AbortError') return true; }
  fallback(); return true;
}

function doJSON() {
  const pkg = buildPackage(); const text = JSON.stringify(pkg, null, 1);
  const name = 'habitos_export_' + today() + '.json';
  stamp();
  let file = null;
  try { file = new File([text], name, { type: 'application/json' }); } catch (e) {}
  const dl = () => U().downloadFile(name, text, 'application/json');
  if (file) shareOrDownload([file], dl); else dl();
  U().toast('ARCHIVO · ' + kb(text) + ' KB');
}

function collectCSV() {
  const files = {};
  App.modules().forEach(m => {
    if (typeof m.exportCSV !== 'function') return;
    try { Object.assign(files, m.exportCSV() || {}); } catch (e) { console.error('[datos] csv ' + m.id, e); }
  });
  const b = rangeBounds();
  const desde = b.desde || earliestHabitDate() || U().addDaysKey(b.hasta, -29);
  const days = daysList(desde, b.hasta);
  const rows = [];
  const catName = id => ((state.categories || []).find(c => c.id === id) || {}).name || id;
  days.forEach(k => (state.habits || []).forEach(h => rows.push({ fecha: k, habito: h.name, categoria: catName(h.category), hecho: (state.completions[h.id] && state.completions[h.id][k]) ? 1 : 0 })));
  files['habitos_marcas.csv'] = U().toCSV(rows, ['fecha', 'habito', 'categoria', 'hecho']);
  files['tareas_completadas.csv'] = U().toCSV((state.taskLog || []).map(t => ({ fecha: toKey(t.completedAt), tarea: t.text })).filter(t => inRange(t.fecha, b)), ['fecha', 'tarea']);
  return files;
}

function doCSV() {
  const files = collectCSV(); const names = Object.keys(files);
  stamp();
  const dl = () => names.forEach((n, i) => setTimeout(() => U().downloadFile(n, files[n], 'text/csv'), i * 300));
  let list = null;
  try { list = names.map(n => new File([files[n]], n, { type: 'text/csv' })); } catch (e) {}
  if (list) shareOrDownload(list, dl); else dl();
  U().toast(names.length + ' ARCHIVOS CSV');
}

/* ---------------- gráficos ---------------- */
const MIN_NOTE = n => `<div class="m-sub">Aún faltan datos (mín. ${n} días)</div>`;

function minutes(hhmm) { if (!hhmm || !/^\d{1,2}:\d{2}$/.test(hhmm)) return null; const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; }
function wrapDiff(a, b) { // minutos de a → b cruzando medianoche si hace falta
  let d = b - a; if (d < -720) d += 1440; if (d > 720 && a > b) d -= 1440; return d;
}

function pielDias() { const p = state.piel; return p && p.dias && typeof p.dias === 'object' ? p.dias : null; }

function cardPantalla() {
  const dias = pielDias(); const g = [[], [], []];
  let total = 0;
  if (dias) Object.keys(dias).forEach(k => {
    const r = dias[k]; if (!r || r.picor == null) return;
    const p = minutes(r.pantalla), a = minutes(r.acostado); if (p == null || a == null) return;
    let d = wrapDiff(p, a); if (d < 0) d = 0;
    g[d < 15 ? 0 : d <= 45 ? 1 : 2].push(Number(r.picor)); total++;
  });
  const head = '<div class="m-label hi">Pantalla → cama vs picor</div>';
  if (total < 6) return `<div class="m-card">${head}${MIN_NOTE(6)}</div>`;
  const labels = ['< 15 min', '15–45 min', '> 45 min'];
  const avg = g.map(a => a.length ? a.reduce((s, x) => s + x, 0) / a.length : null);
  const max = Math.max(1, Math.ceil(Math.max(...avg.filter(v => v != null))));
  const W = 300, H = 150, bx = [40, 125, 210], bw = 50, top = 16, base = 120;
  let svg = `<svg class="m-chart datos-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Picor promedio según margen pantalla a cama">`;
  svg += `<line class="datos-axis" x1="24" y1="${base}" x2="${W - 8}" y2="${base}"/>`;
  [0, max].forEach(v => { const y = base - (v / max) * (base - top); svg += `<text class="datos-tick" x="20" y="${y + 4}" text-anchor="end">${v}</text>`; });
  avg.forEach((v, i) => {
    if (v != null) {
      const h = (v / max) * (base - top);
      svg += `<rect class="datos-bar" x="${bx[i]}" y="${base - h}" width="${bw}" height="${h}" rx="3"/>`;
      svg += `<text class="datos-val" x="${bx[i] + bw / 2}" y="${base - h - 4}" text-anchor="middle">${U().fmtNum(v, 1)}</text>`;
    } else svg += `<text class="datos-tick" x="${bx[i] + bw / 2}" y="${base - 6}" text-anchor="middle">—</text>`;
    svg += `<text class="datos-tick" x="${bx[i] + bw / 2}" y="${base + 14}" text-anchor="middle">${labels[i]}</text>`;
    svg += `<text class="datos-tick" x="${bx[i] + bw / 2}" y="${base + 26}" text-anchor="middle">n=${g[i].length}</text>`;
  });
  svg += '</svg>';
  return `<div class="m-card">${head}${svg}<div class="m-sub">Picor promedio (0–10) del mismo registro, según los minutos entre la pantalla y acostarte.</div></div>`;
}

function lineChart(series, days) {
  const W = 320, H = 150, L = 26, R = 8, T = 10, B = 20;
  const vis = series.filter(s => s.on);
  let vals = []; vis.forEach(s => s.vals.forEach(v => { if (v != null) vals.push(v); }));
  if (!vals.length) return '<div class="m-sub">Activa al menos una serie.</div>';
  let lo = Math.min(...vals), hi = Math.max(...vals);
  if (hi - lo < 1) { lo -= 0.5; hi += 0.5; }
  lo = Math.max(0, Math.floor(lo)); hi = Math.ceil(hi);
  const N = days.length, x = i => L + (N <= 1 ? 0 : i / (N - 1)) * (W - L - R), y = v => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);
  let svg = `<svg class="m-chart datos-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Sueño y picor, 30 días">`;
  [lo, (lo + hi) / 2, hi].forEach(v => { svg += `<line class="datos-grid" x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/><text class="datos-tick" x="${L - 4}" y="${y(v) + 3}" text-anchor="end">${U().fmtNum(v, hi - lo >= 10 ? 0 : 1)}</text>`; });
  [0, Math.floor((N - 1) / 2), N - 1].forEach(i => { svg += `<text class="datos-tick" x="${x(i)}" y="${H - 5}" text-anchor="${i === 0 ? 'start' : i === N - 1 ? 'end' : 'middle'}">${days[i].slice(8)}/${days[i].slice(5, 7)}</text>`; });
  vis.forEach(s => {
    let d = '', pen = false;
    s.vals.forEach((v, i) => { if (v == null) { pen = false; return; } d += (pen ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1); pen = true; });
    svg += `<path class="datos-line ${s.cls}"${s.dash ? ' stroke-dasharray="5 4"' : ''} d="${d}"/>`;
    s.vals.forEach((v, i) => { if (v != null) svg += `<circle class="datos-dot ${s.cls}" cx="${x(i).toFixed(1)}" cy="${y(v).toFixed(1)}" r="2"/>`; });
  });
  return svg + '</svg>';
}

function cardSueno() {
  const dias = pielDias(); const head = '<div class="m-label hi">Horas de sueño vs picor · 30 días</div>';
  const days = daysList(U().addDaysKey(today(), -29), today());
  const sue = [], pic = []; let n = 0;
  days.forEach(k => {
    const r = dias && dias[k];
    let h = null;
    if (r) { const a = minutes(r.acostado), l = minutes(r.levantado); if (a != null && l != null) { h = wrapDiff(a, l) / 60; if (h < 0) h += 24; } }
    const p = r && r.picor != null ? Number(r.picor) : null;
    sue.push(h != null ? Math.round(h / 12 * 100) / 10 : null); // 0–12 h → 0–10
    pic.push(p);
    if (h != null && p != null) n++;
  });
  if (n < 5) return `<div class="m-card">${head}${MIN_NOTE(5)}</div>`;
  const series = [
    { cls: 'datos-c1', label: 'Sueño (0–12 h → 0–10)', vals: sue, on: showSueno, key: 'sueno' },
    { cls: 'datos-c2', label: 'Picor (0–10)', vals: pic, on: showPicor, dash: true, key: 'picor' }
  ];
  const leg = series.map(s => `<button class="m-chip datos-leg${s.on ? ' on' : ''}" data-toggle="${s.key}" aria-pressed="${s.on}"><svg width="22" height="8" aria-hidden="true"><line class="datos-line ${s.cls}" x1="0" y1="4" x2="22" y2="4"${s.dash ? ' stroke-dasharray="5 4"' : ''}/></svg> ${esc(s.label)}</button>`).join('');
  return `<div class="m-card">${head}${lineChart(series, days)}<div class="m-chips">${leg}</div><div class="m-sub">Sueño = acostado → levantado del registro. Sólida: sueño · segmentada: picor.</div></div>`;
}

function cardHabitos() {
  const head = '<div class="m-label hi">Cumplimiento de hábitos · 30 días</div>';
  if (!(state.habits || []).length) return `<div class="m-card">${head}${MIN_NOTE(1)}</div>`;
  const days = daysList(U().addDaysKey(today(), -29), today());
  const pct = habitPctByDay(days).map(d => d.pct);
  if (!pct.some(v => v > 0)) return `<div class="m-card">${head}${MIN_NOTE(1)}</div>`;
  // racha: si hoy aún no llega a 80 %, cuenta desde ayer
  const all = habitPctByDay(daysList(U().addDaysKey(today(), -400), today())).map(d => d.pct);
  let i = all.length - 1; if (all[i] < 80) i--;
  let racha = 0; while (i >= 0 && all[i] >= 80) { racha++; i--; }
  const avg = Math.round(pct.reduce((s, v) => s + v, 0) / pct.length);
  const chart = lineChart([{ cls: 'datos-c1', vals: pct, on: true }], days);
  return `<div class="m-card">${head}${chart}
    <div class="m-grid2"><div class="m-stat"><div class="v">${racha}</div><div class="m-sub">racha de días ≥ 80 %</div></div>
    <div class="m-stat"><div class="v">${avg}%</div><div class="m-sub">promedio 30 días</div></div></div></div>`;
}

function cardGasto() {
  const head = '<div class="m-label hi">Gasto del mes vs anterior</div>';
  const movs = state.plata && Array.isArray(state.plata.movs) ? state.plata.movs.filter(m => m && m.tipo === 'gasto') : null;
  if (!movs || !movs.length) return `<div class="m-card">${head}${MIN_NOTE(1)}</div>`;
  const mk = U().monthKey(today());
  const prev = U().monthKey(U().addDaysKey(mk + '-01', -1));
  const sum = m => movs.filter(x => (x.fecha || '').slice(0, 7) === m).reduce((s, x) => s + (Number(x.montoCLP) || 0), 0);
  const cur = sum(mk), pr = sum(prev);
  const cats = {}; movs.filter(x => (x.fecha || '').slice(0, 7) === mk).forEach(x => { const c = x.categoria || 'Sin categoría'; cats[c] = (cats[c] || 0) + (Number(x.montoCLP) || 0); });
  const top = Object.entries(cats).sort((a, b) => b[1] - a[1]).slice(0, 3);
  let delta = '';
  if (pr > 0) { const d = Math.round((cur - pr) / pr * 100); delta = `<span class="${d > 0 ? 'm-bad' : 'm-good'}">${d > 0 ? '+' : ''}${d}%</span>`; }
  const rows = top.length ? top.map(([c, v]) => {
    const w = cur ? Math.round(v / cur * 100) : 0;
    return `<div><div class="m-row"><span>${esc(c)}</span><span class="m-mono">${U().fmtCLP(v)}</span></div><div class="m-bar"><i style="width:${w}%"></i></div></div>`;
  }).join('') : '<div class="m-sub">Sin gastos este mes aún.</div>';
  return `<div class="m-card">${head}
    <div class="m-grid2"><div class="m-stat"><div class="v">${U().fmtCLP(cur)}</div><div class="m-sub">este mes ${delta}</div></div>
    <div class="m-stat"><div class="v">${U().fmtCLP(pr)}</div><div class="m-sub">mes anterior</div></div></div>
    <div class="m-list">${rows}</div></div>`;
}

/* ---------------- vista ---------------- */
const CHEV = '<svg class="mas-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="9 6 15 12 9 18"/></svg>';
const ICO = {
  estadisticas: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="20" x2="6" y2="12"/><line x1="12" y1="20" x2="12" y2="5"/><line x1="18" y1="20" x2="18" y2="9"/></svg>',
  calendario: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
  tareas: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></svg>',
  ajustes: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/></svg>'
};
const MAS = [
  ['estadisticas', 'ESTADÍSTICAS', 'Estadísticas por hábito'],
  ['ajustes', 'AJUSTES', 'Tema, nube, categorías, respaldo']
];

// Tareas y Calendario van arriba, con lo que tienen hoy (no escondidos al fondo)
function organizarBlock() {
  const order = { urgent: 0, important: 1, trivial: 2 };
  const ts = (state.tasks || []).slice().sort((a, b) => (order[a.priority] ?? 2) - (order[b.priority] ?? 2));
  const urg = ts.filter(t => t.priority === 'urgent').length;
  const hoyK = U().todayKey();
  const ev = (state.events || []).filter(e => e.date >= hoyK)
    .sort((a, b) => (a.date + (a.time || '99')) < (b.date + (b.time || '99')) ? -1 : 1);
  const evHoy = ev.filter(e => e.date === hoyK).length;
  const prox = ev[0];
  const fmtF = k => { const [y, m, d] = k.split('-'); return k === hoyK ? 'hoy' : d + '/' + m; };
  return `
    <div>
      <div class="m-label" style="margin:2px 0 8px">Organizar</div>
      <div class="m-grid2">
        <button class="m-card datos-org" data-mas="tareas">
          <span class="m-label hi">Tareas</span>
          <span class="m-big">${ts.length}</span>
          <span class="m-sub">${ts.length ? (urg ? urg + ' urgente' + (urg > 1 ? 's' : '') + ' · ' : '') + esc(ts[0].text) : 'Sin pendientes'}</span>
        </button>
        <button class="m-card datos-org" data-mas="calendario">
          <span class="m-label hi">Calendario</span>
          <span class="m-big">${evHoy}<small class="m-sub" style="font-size:12px"> hoy</small></span>
          <span class="m-sub">${prox ? 'Próximo: ' + esc(prox.text) + ' · ' + fmtF(prox.date) + (prox.time ? ' ' + esc(prox.time) : '') : 'Sin eventos próximos'}</span>
        </button>
      </div>
    </div>`;
}

function render(el) {
  const ult = state.datos && state.datos.ultimaExport;
  const seg = [['30', 'ÚLTIMOS 30 DÍAS'], ['90', '90 DÍAS'], ['todo', 'TODO']]
    .map(([v, l]) => `<button class="${rango === v ? 'on' : ''}" data-rango="${v}" aria-pressed="${rango === v}">${l}</button>`).join('');
  el.innerHTML = `
    <div class="section-title-row"><h2 class="section-title">DATOS</h2></div>
    <div class="m-stack">
      ${safe(organizarBlock)}
      <div class="m-card ok">
        <div class="m-label hi">Exportar para Claude</div>
        <div class="m-sub">Junta hábitos, tareas, piel, gym y plata en un paquete que Claude entiende sin preguntarte nada.</div>
        <div class="m-seg datos-seg" role="group" aria-label="Rango">${seg}</div>
        <button class="m-btn primary block" data-act="copy">COPIAR PARA PEGAR EN CLAUDE</button>
        <div class="m-alert" id="datosWarn" hidden></div>
        <button class="m-btn block" data-act="json">DESCARGAR ARCHIVO .json</button>
        <button class="m-btn ghost block" data-act="csv">DESCARGAR CSV</button>
        <div class="m-sub" id="datosUlt">Última exportación: ${esc(hace(ult))}</div>
      </div>

      <div>
        <div class="m-label" style="margin:2px 0 8px">Cruces rápidos</div>
        <div class="m-cols datos-cruces">${safe(cardPantalla)}${safe(cardSueno)}${safe(cardHabitos)}${safe(cardGasto)}</div>
      </div>

      <div>
        <div class="m-label" style="margin:2px 0 0">Más</div>
        <div class="mas-list">${MAS.map(([v, n, d]) =>
          `<button class="mas-item" data-mas="${v}">${ICO[v]}<div class="mas-info"><div class="mas-name">${n}</div><div class="mas-desc">${esc(d)}</div></div>${CHEV}</button>`).join('')}</div>
      </div>
    </div>`;
  el.onclick = onClick;
}
function safe(fn) { try { return fn(); } catch (e) { console.error('[datos]', e); return '<div class="m-card"><div class="m-sub">No se pudo calcular este cruce.</div></div>'; } }

function onClick(e) {
  const t = e.target.closest('button'); if (!t) return;
  if (t.dataset.rango) { rango = t.dataset.rango; App.refresh(); return; }
  if (t.dataset.toggle) { if (t.dataset.toggle === 'sueno') showSueno = !showSueno; else showPicor = !showPicor; App.refresh(); return; }
  if (t.dataset.mas) { switchView(t.dataset.mas); return; }
  if (t.dataset.act === 'copy') doCopy();
  else if (t.dataset.act === 'json') doJSON();
  else if (t.dataset.act === 'csv') doCSV();
}

App.register({
  id: 'datos',
  defaults() { return { v: 1, ultimaExport: 0 }; },
  view: { id: 'datos', render }
});
})();
