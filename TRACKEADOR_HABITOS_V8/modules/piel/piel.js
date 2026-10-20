/* ============================================================
   V7 · Módulo PIEL — check-in matutino de dermatitis atópica
   Datos: state.piel.dias['YYYY-MM-DD'] (ver CONTRATO_MODULOS.md)
   ============================================================ */
(function () {
'use strict';

const U = () => App.util;
const esc = s => App.util.esc(s);
const DRUGS = [
  { id: 'emoliente', label: 'Emoliente', ini: 'E' },
  { id: 'tacrolimus', label: 'Tacrolimus', ini: 'T' },
  { id: 'corticoide', label: 'Corticoide', ini: 'C' },
  { id: 'hipoclorito', label: 'Hipoclorito', ini: 'H' }
];
const SLOTS = [ { id: 'M', label: 'MAÑANA' }, { id: 'T', label: 'TARDE' }, { id: 'N', label: 'NOCHE' } ];
const LEGACY_LABELS = {
  tratamiento: 'Tratamiento', hipoclorito: 'Hipoclorito', metodo_hipoclorito: 'Método del hipoclorito',
  sueno_texto: 'Sueño', piel_texto: 'Piel', picor_texto: 'Picor', adicional: 'Algo adicional', reloj: 'Reloj (sueño)'
};

let sel = null;                       // fecha que se está editando
let host = null;                      // contenedor actual
const serieOn = { picor: true, piel: true, sueno: true };
let importing = false;

/* ---------------- datos ---------------- */
const D = () => App.data('piel');
const dias = () => D().dias || (D().dias = {});
const getDia = k => dias()[k] || null;
function blank() {
  return { picor: null, piel: null, sueno: null, pantalla: '', acostado: '', levantado: '',
    trat: { emoliente: [], tacrolimus: [], corticoide: [], hipoclorito: [] },
    nota: '', fotos: false, legacy: null, ts: Date.now() };
}
function normTrat(t) {
  const o = {};
  DRUGS.forEach(d => { o[d.id] = Array.isArray(t && t[d.id]) ? t[d.id].slice() : []; });
  return o;
}
function ensure(k) {
  let r = dias()[k];
  if (!r) r = dias()[k] = blank();
  r.trat = normTrat(r.trat);
  r.ts = Date.now();
  return r;
}
const isNum = v => typeof v === 'number' && !isNaN(v);
const completo = r => !!r && isNum(r.picor) && isNum(r.piel) && isNum(r.sueno);

/* ---------------- cálculos de horas ---------------- */
function mins(hhmm) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm || '');
  return m ? (+m[1]) * 60 + (+m[2]) : null;
}
function horasSueno(r) {
  const a = mins(r && r.acostado), l = mins(r && r.levantado);
  if (a == null || l == null) return null;
  let d = l - a; if (d <= 0) d += 1440;
  if (d > 16 * 60) return null;
  return d / 60;
}
function margenPantalla(r) {
  const p = mins(r && r.pantalla), a = mins(r && r.acostado);
  if (p == null || a == null) return null;
  let d = a - p; if (d < -720) d += 1440;
  if (d < 0 || d > 360) return null;
  return d;
}
const fmtH = h => h == null ? '—' : (Math.floor(h) + ' h ' + String(Math.round((h % 1) * 60)).padStart(2, '0') + ' min');
const fmtM = m => m == null ? '—' : m + ' min';

/* ---------------- tratamiento: letras ---------------- */
function tratLetras(r) {
  if (!r || !r.trat) return '';
  return DRUGS.map(d => {
    const a = (r.trat[d.id] || []);
    if (!a.length) return '';
    const s = ['M', 'T', 'N'].filter(x => a.includes(x)).join('') + (a.includes('?') ? '?' : '');
    return d.ini + '·' + s;
  }).filter(Boolean).join(' ');
}
function tratCSV(r, id) {
  const a = (r.trat && r.trat[id]) || [];
  return ['M', 'T', 'N', '?'].filter(x => a.includes(x)).join('+');
}
function legacyText(r) {
  if (!r || !r.legacy) return '';
  return Object.keys(r.legacy).map(k => r.legacy[k]).filter(v => v != null && String(v).trim() !== '').join(' | ');
}

/* ---------------- importación del historial ---------------- */
function importar() {
  if (importing || D().legacyImportado) return;
  importing = true;
  fetch('data/piel-historial.json').then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(j => {
      const src = (j && j.dias) || {};
      const d = dias();
      Object.keys(src).forEach(k => {
        if (d[k]) return;
        const x = src[k] || {};
        d[k] = Object.assign(blank(), x, { trat: normTrat(x.trat), ts: x.ts || Date.now() });
      });
      D().legacyImportado = true;
      App.save('piel');
    })
    .catch(e => { console.warn('[piel] no se pudo importar el historial (se reintentará)', e && e.message); })
    .then(() => { importing = false; });
}

/* ---------------- tratamiento: alternar ---------------- */
function toggleTrat(k, drug, slot) {
  const r = ensure(k);
  const a = r.trat[drug];
  const i = a.indexOf(slot);
  if (i >= 0) a.splice(i, 1); else a.push(slot);
  App.save('piel');
  if (i < 0 && k === U().todayKey()) App.autoMarkHabit(/tratamiento|piel|crema/i, k);
}

/* ---------------- hallazgo tacrolimus ↔ sueño ---------------- */
function hallazgo() {
  const con = [], sin = [];
  const d = dias();
  Object.keys(d).forEach(k => {
    const r = d[k];
    if (!isNum(r.sueno)) return;
    const prev = d[U().addDaysKey(k, -1)];
    if (!prev || !prev.trat) return;
    ((prev.trat.tacrolimus || []).includes('N') ? con : sin).push(r.sueno);
  });
  const avg = a => a.reduce((s, x) => s + x, 0) / a.length;
  return { con: con.length, sin: sin.length, avgCon: con.length ? avg(con) : null, avgSin: sin.length ? avg(sin) : null,
    ok: con.length >= 3 && sin.length >= 3 };
}

/* ---------------- vista ---------------- */
function shortDate(k) {
  const dt = U().parseKey(k);
  return dt.toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short' }).replace(/\./g, '');
}
function scale(key, min, val) {
  const n = min === 0 ? 11 : 10;
  let h = '';
  for (let i = 0; i < n; i++) {
    const v = min + i;
    h += `<button type="button" data-scale="${key}" data-v="${v}" class="${val === v ? 'on' : ''}" aria-pressed="${val === v}" aria-label="${key} ${v}">${v}</button>`;
  }
  return `<div class="m-scale${min === 1 ? ' s10' : ''}">${h}</div>`;
}

function render(el) {
  host = el;
  const today = U().todayKey();
  if (!sel || sel > today) sel = today;
  const r = getDia(sel) || blank();
  const hs = horasSueno(r), mp = margenPantalla(r);
  const comp = completo(r);
  const esHoy = sel === today;

  const tratRows = DRUGS.map(d => `
    <div class="piel-trat-row">
      <div class="piel-trat-name">${d.label}</div>
      <div class="m-chips piel-chips">${SLOTS.map(s => {
        const on = (r.trat[d.id] || []).includes(s.id);
        return `<button type="button" class="m-chip${on ? ' on' : ''}" data-trat="${d.id}|${s.id}" aria-pressed="${on}">${s.label}</button>`;
      }).join('')}${(r.trat[d.id] || []).includes('?') ? '<span class="m-sub piel-q">+ aplicado sin hora</span>' : ''}</div>
    </div>`).join('');

  const legacy = r.legacy ? `
    <details class="piel-legacy">
      <summary>Lo que escribiste ese día (Excel)</summary>
      <div class="m-sub">El puntaje de sueño antiguo mezclaba el picor con el sueño; por eso el picor de esos días puede estar vacío.</div>
      ${Object.keys(r.legacy).filter(k => r.legacy[k] != null && String(r.legacy[k]).trim() !== '').map(k =>
        `<div class="piel-legacy-item"><span class="m-label">${esc(LEGACY_LABELS[k] || k.replace(/_/g, ' '))}</span><div>${esc(r.legacy[k])}</div></div>`).join('')}
    </details>` : '';

  const h = hallazgo();
  const hallTxt = h.ok
    ? `<div class="m-grid2">
         <div class="m-stat"><div class="v">${App.util.fmtNum(h.avgCon, 1)}</div><div class="m-sub">con tacrolimus de noche (${h.con} d)</div></div>
         <div class="m-stat"><div class="v">${App.util.fmtNum(h.avgSin, 1)}</div><div class="m-sub">sin él (${h.sin} d)</div></div>
       </div>
       <div class="m-sub">${h.avgCon > h.avgSin ? 'Duermes mejor' : (h.avgCon < h.avgSin ? 'Duermes peor' : 'Duermes igual')} la noche siguiente a usarlo (${App.util.fmtNum(Math.abs(h.avgCon - h.avgSin), 1)} pts). Es una asociación, no prueba causa.</div>`
    : `<div class="m-sub">Faltan datos: se necesitan al menos 3 días con y 3 sin tacrolimus de noche (hay ${h.con} y ${h.sin}).</div>`;

  el.innerHTML = `
  <div class="m-stack piel-root">
    <div class="m-card">
      <div class="piel-datenav">
        <button type="button" class="m-btn small" data-nav="-1" aria-label="Día anterior">◀</button>
        <div class="piel-date"><div class="m-label hi">CHECK-IN DE LA MAÑANA</div><div class="m-q">${esc(shortDate(sel))}${esHoy ? ' · hoy' : ''}</div></div>
        <button type="button" class="m-btn small" data-nav="1" aria-label="Día siguiente" ${esHoy ? 'disabled' : ''}>▶</button>
      </div>
      <div id="piel-badge">${comp ? '<div class="m-alert ok">Check-in completo</div>' : '<div class="m-alert">Falta: ' +
        [!isNum(r.picor) ? 'picor' : '', !isNum(r.piel) ? 'piel' : '', !isNum(r.sueno) ? 'sueño' : ''].filter(Boolean).join(', ') + '</div>'}</div>

      <div class="piel-block"><div class="m-label">PICOR · 0–10</div>
        <div class="m-sub">Cuánto te rascaste o te picó en la noche.</div>${scale('picor', 0, r.picor)}</div>
      <div class="piel-block"><div class="m-label">PIEL · 0–10</div>
        <div class="m-sub">Cómo se ve hoy: rojez, sequedad, inflamación. (Va separado del picor a propósito.)</div>${scale('piel', 0, r.piel)}</div>
      <div class="piel-block"><div class="m-label">SUEÑO · 1–10</div>
        <div class="m-sub">Qué tan bien dormiste.</div>${scale('sueno', 1, r.sueno)}</div>

      <div class="m-grid3 piel-times">
        <label class="m-field">Solté la pantalla<input class="m-input num" type="time" data-time="pantalla" value="${esc(r.pantalla)}"></label>
        <label class="m-field">Me acosté<input class="m-input num" type="time" data-time="acostado" value="${esc(r.acostado)}"></label>
        <label class="m-field">Me levanté<input class="m-input num" type="time" data-time="levantado" value="${esc(r.levantado)}"></label>
      </div>
      <div class="m-grid2">
        <div class="m-stat"><div class="v" id="piel-horas">${fmtH(hs)}</div><div class="m-sub">horas de sueño</div></div>
        <div class="m-stat"><div class="v" id="piel-margen">${fmtM(mp)}</div><div class="m-sub">pantalla → cama</div></div>
      </div>
    </div>

    <div class="m-card">
      <div class="m-label hi">TRATAMIENTO ${esHoy ? 'DE HOY' : 'DE ESE DÍA'}</div>
      <div class="m-sub">Marca lo que te aplicas; puedes ir completándolo durante el día.</div>
      ${tratRows}
    </div>

    <div class="m-card">
      <label class="m-field"><span class="m-label">NOTA</span>
        <textarea class="m-input piel-nota" rows="2" maxlength="200" data-nota placeholder="Algo que notaste (máx. 200 caracteres)">${esc(r.nota)}</textarea></label>
      <div class="m-row piel-fotos">
        <button type="button" class="m-chip${r.fotos ? ' on' : ''}" data-fotos aria-pressed="${!!r.fotos}">${r.fotos ? '✓ ' : ''}Fotos hechas</button>
        <a class="m-btn small" href="shortcuts://run-shortcut?name=Foto%20piel">ABRIR ATAJO FOTO PIEL</a>
      </div>
      <div class="m-sub">Las fotos viven en Archivos, no en la app.</div>
      ${legacy}
    </div>

    <div class="m-card">
      <div class="m-label hi">TACROLIMUS Y SUEÑO</div>
      ${hallTxt}
    </div>

    ${histHTML()}
  </div>`;
  wire(el);
}

function chartSVG() {
  const today = U().todayKey();
  const N = 30, W = 360, H = 180, L = 24, R = 8, T = 8, B = 20;
  const keys = []; for (let i = N - 1; i >= 0; i--) keys.push(U().addDaysKey(today, -i));
  const x = i => L + (W - L - R) * i / (N - 1);
  const y = v => T + (H - T - B) * (1 - v / 10);
  let g = '';
  [0, 5, 10].forEach(v => { g += `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" stroke="var(--cyan-line)" stroke-width="1" ${v === 5 ? 'stroke-dasharray="2 4"' : ''}/><text x="${L - 4}" y="${y(v) + 4}" font-size="10" text-anchor="end" fill="var(--text-dim)">${v}</text>`; });
  keys.forEach((k, i) => { if (i % 7 === 0 || i === N - 1) { const p = k.split('-'); g += `<text x="${x(i)}" y="${H - 5}" font-size="10" text-anchor="middle" fill="var(--text-dim)">${+p[2]}/${+p[1]}</text>`; } });
  const defs = [
    { id: 'picor', color: 'var(--danger)', dash: '' },
    { id: 'piel', color: 'var(--warning)', dash: '8 4' },
    { id: 'sueno', color: 'var(--cyan)', dash: '1.5 4' }
  ];
  defs.forEach(s => {
    if (!serieOn[s.id]) return;
    let path = '', pen = false, dots = '';
    keys.forEach((k, i) => {
      const r = getDia(k); const v = r && r[s.id];
      if (!isNum(v)) { pen = false; return; }
      path += (pen ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1) + ' '; pen = true;
      dots += `<circle cx="${x(i).toFixed(1)}" cy="${y(v).toFixed(1)}" r="2.2" fill="${s.color}"/>`;
    });
    g += `<path d="${path}" fill="none" stroke="${s.color}" stroke-width="2" ${s.dash ? `stroke-dasharray="${s.dash}" stroke-linecap="round"` : ''}/>${dots}`;
  });
  return `<svg class="m-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Picor, piel y sueño de los últimos 30 días">${g}</svg>`;
}

function histHTML() {
  const today = U().todayKey();
  const names = { picor: 'Picor', piel: 'Piel', sueno: 'Sueño' };
  const sw = { picor: ['var(--danger)', ''], piel: ['var(--warning)', '8 4'], sueno: ['var(--cyan)', '1.5 4'] };
  const legend = Object.keys(names).map(id => `
    <button type="button" class="m-chip piel-leg${serieOn[id] ? ' on' : ''}" data-serie="${id}" aria-pressed="${serieOn[id]}">
      <svg width="26" height="8" aria-hidden="true"><line x1="1" x2="25" y1="4" y2="4" stroke="${sw[id][0]}" stroke-width="2.5" ${sw[id][1] ? `stroke-dasharray="${sw[id][1]}"` : ''} stroke-linecap="round"/></svg> ${names[id]}</button>`).join('');
  let rows = '';
  for (let i = 0; i < 14; i++) {
    const k = U().addDaysKey(today, -i), r = getDia(k);
    const c = v => isNum(v) ? v : '—';
    rows += `<tr data-fecha="${k}" tabindex="0" class="${k === sel ? 'sel' : ''}">
      <td>${esc(shortDate(k).replace(/^(\S+)\s/, '$1 '))}</td><td>${r ? c(r.picor) : '—'}</td><td>${r ? c(r.piel) : '—'}</td><td>${r ? c(r.sueno) : '—'}</td>
      <td>${r && horasSueno(r) != null ? App.util.fmtNum(horasSueno(r), 1) : '—'}</td><td class="piel-tl">${r ? esc(tratLetras(r)) || '—' : '—'}</td></tr>`;
  }
  return `
    <div class="m-card">
      <div class="m-label hi">ÚLTIMOS 30 DÍAS</div>
      ${chartSVG()}
      <div class="m-legend">${legend}</div>
    </div>
    <div class="m-card">
      <div class="m-label hi">ÚLTIMOS 14 DÍAS</div>
      <div class="piel-tablewrap"><table class="piel-table">
        <thead><tr><th>Día</th><th>Picor</th><th>Piel</th><th>Sueño</th><th>Horas</th><th>Trat.</th></tr></thead>
        <tbody>${rows}</tbody></table></div>
      <div class="m-sub">Trat.: E emoliente · T tacrolimus · C corticoide · H hipoclorito; M mañana, T tarde, N noche. Toca una fila para abrir ese día.</div>
    </div>`;
}

/* actualiza horas, margen e indicador sin re-renderizar (mientras escribes) */
function paintLive() {
  if (!host) return;
  const r = getDia(sel) || blank();
  const a = host.querySelector('#piel-horas'), b = host.querySelector('#piel-margen');
  if (a) a.textContent = fmtH(horasSueno(r));
  if (b) b.textContent = fmtM(margenPantalla(r));
}

function wire(el) {
  el.onclick = e => {
    const t = e.target.closest('[data-scale],[data-trat],[data-nav],[data-fotos],[data-serie],tr[data-fecha]');
    if (!t || !el.contains(t)) return;
    if (t.dataset.scale) {
      const r = ensure(sel), v = +t.dataset.v;
      r[t.dataset.scale] = r[t.dataset.scale] === v ? null : v;
      App.save('piel');
    } else if (t.dataset.trat) {
      const p = t.dataset.trat.split('|'); toggleTrat(sel, p[0], p[1]);
    } else if (t.dataset.nav) {
      const n = U().addDaysKey(sel, +t.dataset.nav);
      if (n > U().todayKey()) return;
      sel = n; render(el);
    } else if (t.hasAttribute('data-fotos')) {
      const r = ensure(sel); r.fotos = !r.fotos; App.save('piel');
    } else if (t.dataset.serie) {
      serieOn[t.dataset.serie] = !serieOn[t.dataset.serie]; render(el);
    } else if (t.dataset.fecha) {
      sel = t.dataset.fecha; render(el); el.scrollIntoView && window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  el.onkeydown = e => {
    if (e.key === 'Enter' && e.target.matches && e.target.matches('tr[data-fecha]')) { sel = e.target.dataset.fecha; render(el); }
  };
  el.oninput = e => {
    const t = e.target;
    if (t.dataset.time) {
      const r = ensure(sel); r[t.dataset.time] = t.value || '';
      App.save('piel', { noRender: true }); paintLive();
    } else if (t.hasAttribute('data-nota')) {
      const r = ensure(sel); r.nota = t.value.slice(0, 200);
      App.save('piel', { noRender: true });
    }
  };
}

/* ---------------- tarjetas de HOY ---------------- */
function slotAhora() { const h = new Date().getHours(); return h < 12 ? 'M' : (h < 19 ? 'T' : 'N'); }
function hoyCards() {
  const k = U().todayKey(), r = getDia(k);
  if (!completo(r)) {
    return [{ order: 10, area: 'Piel · sueño', titulo: 'Check-in de la mañana', sub: 'Picor, piel, sueño y horas · 1 min', xp: 15, go: 'cuerpo/piel', tone: 'accent' }];
  }
  const out = [];
  const algunTrat = DRUGS.some(d => (r.trat[d.id] || []).length);
  if (!algunTrat && new Date().getHours() >= 12) {
    out.push({ order: 12, area: 'Piel', titulo: 'Tratamiento de hoy', sub: 'Marca qué te aplicaste y a qué hora', xp: 5, go: 'cuerpo/piel' });
  }
  if (!r.fotos) {
    out.push({ order: 14, area: 'Piel', titulo: 'Fotos de la piel', sub: 'Con el atajo; quedan en Archivos', xp: 5, go: 'cuerpo/piel' });
  }
  return out;
}
// "Dormir 8–9 h" se marca solo cuando el check-in de hoy dice que dormiste 8 h o más
App.on('change', id => {
  if (id !== 'piel') return;
  const k = U().todayKey(), r = getDia(k);
  if (!r || !r.trat) return;
  if (DRUGS.some(d => (r.trat[d.id] || []).length)) App.autoMarkHabit(/tratamiento|piel|crema/i, k);
  if (!completo(r)) return;
  const h = horasSueno(r);
  if (h != null && h >= 8) App.autoMarkHabit(/dorm|sueñ/i, k);
});
document.addEventListener('click', e => {
  const t = e.target.closest('[data-piel-trat]');
  if (!t) return;
  e.preventDefault();
  const p = t.dataset.pielTrat.split('|');
  toggleTrat(U().todayKey(), p[0], p[1]);
});

/* ---------------- exportación ---------------- */
function filas() {
  const d = dias();
  return Object.keys(d).sort().map(k => {
    const r = d[k];
    return { fecha: k, r, hs: horasSueno(r), mp: margenPantalla(r) };
  });
}
function exportData() {
  return {
    _leeme: {
      convencion_fechas: 'Cada registro está en la fecha de la MAÑANA del check-in. picor, sueno y las horas hablan de la noche anterior (entre fecha-1 y fecha); el tratamiento (trat) es lo aplicado ese mismo día.',
      picor: '0-10, cuánto se rascó/picó en la noche. Null en datos antiguos (venía mezclado en el puntaje de sueño).',
      piel: '0-10, cómo se ve la piel (rojez, sequedad, inflamación).',
      sueno: '1-10, calidad del sueño de la noche anterior. En datos antiguos del Excel mezclaba el picor.',
      pantalla: 'HH:MM en que soltó la pantalla.', acostado: 'HH:MM en que se acostó.', levantado: 'HH:MM en que se levantó.',
      horasSueno: 'Horas entre acostado y levantado (cruza medianoche), calculado.',
      margenPantallaMin: 'Minutos entre soltar la pantalla y acostarse, calculado (null si es raro).',
      trat: 'Por fármaco, franjas aplicadas ese día: M mañana, T tarde, N noche, ? aplicado sin hora conocida.',
      nota: 'Texto libre corto.', fotos: 'true si hizo las fotos del día (viven en Archivos, no en la app).',
      legacy: 'Textos originales del Excel (solo días importados), o null.'
    },
    dias: filas().map(f => Object.assign({ fecha: f.fecha }, JSON.parse(JSON.stringify(f.r)),
      { horasSueno: f.hs == null ? null : Math.round(f.hs * 100) / 100, margenPantallaMin: f.mp }))
  };
}
function exportCSV() {
  const cols = ['fecha', 'picor', 'piel', 'sueno', 'pantalla', 'acostado', 'levantado', 'horas_sueno', 'margen_pantalla_min',
    'emoliente', 'tacrolimus', 'corticoide', 'hipoclorito', 'fotos', 'nota', 'legacy'];
  const rows = filas().map(f => ({
    fecha: f.fecha, picor: f.r.picor, piel: f.r.piel, sueno: f.r.sueno, pantalla: f.r.pantalla, acostado: f.r.acostado,
    levantado: f.r.levantado, horas_sueno: f.hs == null ? '' : f.hs.toFixed(2), margen_pantalla_min: f.mp == null ? '' : f.mp,
    emoliente: tratCSV(f.r, 'emoliente'), tacrolimus: tratCSV(f.r, 'tacrolimus'), corticoide: tratCSV(f.r, 'corticoide'),
    hipoclorito: tratCSV(f.r, 'hipoclorito'), fotos: f.r.fotos ? 1 : 0, nota: f.r.nota, legacy: legacyText(f.r)
  }));
  return { 'piel_diario.csv': App.util.toCSV(rows, cols) };
}

App.register({
  id: 'piel',
  defaults() { return { v: 1, legacyImportado: false, dias: {} }; },
  init() { importar(); },
  subviews: [{ parent: 'cuerpo', id: 'piel', label: 'PIEL', order: 1, render }],
  hoyCards, exportData, exportCSV
});
})();
