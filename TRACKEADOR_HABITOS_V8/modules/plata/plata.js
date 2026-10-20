/* ============================================================
   V7 · PLATA — finanzas personales (CLP + USD)
   Datos: state.plata (ver CONTRATO_MODULOS.md)
   ============================================================ */
(function () {
'use strict';

const U = App.util;
const esc = U.esc;
const TIPOS = [['gasto', 'GASTO'], ['ingreso', 'INGRESO'], ['inversion', 'INVERSIÓN']];
const TIPO_NOMBRE = { gasto: 'Gasto', ingreso: 'Ingreso', inversion: 'Inversión' };
const MESES = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
const MESES_CORTO = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const DOLAR_KEY = 'habitos-v7:dolar';
const UI_KEY = 'habitos-v7:plata-ui';

/* ---------------- estado de UI (efímero) ---------------- */
let root = null;
let mes = U.monthKey();
let addingCat = false;
let confirmDel = false;
const ui = lsGet(UI_KEY) || {};
ui.cat = ui.cat || {};
ui.monInv = ui.monInv === 'USD' ? 'USD' : 'CLP';
const form = nuevoForm('gasto');
let dolarInfo = null;      // {fecha, valor, manual?}
let dolarTried = false;

function lsGet(k) { try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : null; } catch (e) { return null; } }
function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

function nuevoForm(tipo) {
  return { tipo, monto: '', moneda: tipo === 'inversion' ? ui.monInv : 'CLP', cat: '', fecha: U.todayKey(), nota: '', editId: null };
}

/* ---------------- datos ---------------- */
function D() {
  const d = App.data('plata');
  d.movs = d.movs || [];
  d.categorias = d.categorias || {};
  const def = catsDefault();
  ['gasto', 'ingreso', 'inversion'].forEach(t => { if (!Array.isArray(d.categorias[t]) || !d.categorias[t].length) d.categorias[t] = def[t]; });
  d.fondoPermisos = d.fondoPermisos || {};
  d.metaInversion = d.metaInversion || {};
  return d;
}
function catsDefault() {
  return {
    gasto: ['Comida', 'Transporte', 'Piel / farmacia', 'Gym', 'Salidas', 'Compras', 'Suscripciones', 'Estudios', 'Otros', 'Permisos Milo'],
    ingreso: ['Sueldo', 'Trabajos', 'Regalos', 'Otros'],
    inversion: ['Acciones/ETF', 'Cripto', 'Ahorro', 'Otros']
  };
}
function catFor(tipo) {
  const list = D().categorias[tipo];
  const last = ui.cat[tipo];
  return list.indexOf(last) >= 0 ? last : list[0];
}
function movsDe(m) { return D().movs.filter(x => (x.fecha || '').slice(0, 7) === m); }
function sum(arr) { return arr.reduce((a, x) => a + (Number(x.montoCLP) || 0), 0); }
function totales(m) {
  const mv = movsDe(m);
  const ing = mv.filter(x => x.tipo === 'ingreso');
  const gas = mv.filter(x => x.tipo === 'gasto');
  const inv = mv.filter(x => x.tipo === 'inversion');
  return {
    ingresos: sum(ing), gastos: sum(gas), invertido: sum(inv),
    invertidoUSD: inv.filter(x => x.moneda === 'USD').reduce((a, x) => a + (Number(x.monto) || 0), 0),
    gastosMov: gas
  };
}
function esMilo(x) { return x.tipo === 'gasto' && (x.origen === 'milo' || x.categoria === 'Permisos Milo'); }
function mesDesplazado(m, n) {
  const [y, mm] = m.split('-').map(Number);
  const d = new Date(y, mm - 1 + n, 1, 12);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
}
function nombreMes(m) { const [y, mm] = m.split('-').map(Number); return MESES[mm - 1] + ' ' + y; }
const clp = n => U.fmtCLP(n);

/* ---------------- números ---------------- */
function parseMonto(s, moneda) {
  s = String(s || '').trim().replace(/[^\d.,]/g, '');
  if (!s) return 0;
  if (s.indexOf(',') >= 0) s = s.replace(/\./g, '').replace(',', '.');
  else if (moneda === 'USD' && /^\d+\.\d{1,2}$/.test(s)) { /* decimal con punto */ }
  else s = s.replace(/\./g, '');
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}
function limpiaMonto(s) { return String(s || '').replace(/[^\d.,]/g, ''); }

/* ---------------- dólar del día ---------------- */
function cargaDolar() {
  const c = lsGet(DOLAR_KEY);
  if (c && c.valor > 0) dolarInfo = c;
  const hoy = U.todayKey();
  const fresco = dolarInfo && dolarInfo.fecha === hoy && !dolarInfo.manual;
  if (fresco || dolarTried) return;
  dolarTried = true;
  if (typeof fetch !== 'function') return;
  let ctl = null, timer = null;
  try { ctl = new AbortController(); timer = setTimeout(() => ctl.abort(), 7000); } catch (e) {}
  fetch('https://mindicador.cl/api/dolar', ctl ? { signal: ctl.signal } : undefined)
    .then(r => { if (!r.ok) throw new Error('http ' + r.status); return r.json(); })
    .then(j => {
      const v = j && j.serie && j.serie[0] && Number(j.serie[0].valor);
      if (!(v > 0)) throw new Error('sin valor');
      dolarInfo = { fecha: U.todayKey(), valor: v };
      lsSet(DOLAR_KEY, dolarInfo);
      pintaDolar();
    })
    .catch(() => { dolarTried = true; pintaDolar(); })
    .then(() => { if (timer) clearTimeout(timer); });
}
function dolar() { return dolarInfo && dolarInfo.valor > 0 ? dolarInfo.valor : null; }
function dolarTexto() {
  const v = dolar();
  if (!v) return '';
  const hoy = U.todayKey();
  let t = 'Dólar usado: $' + U.fmtNum(v, 2);
  if (dolarInfo.manual && dolarInfo.fecha === hoy) t += ' (manual, hoy)';
  else if (dolarInfo.fecha !== hoy) { const p = dolarInfo.fecha.split('-'); t += ' (último guardado, ' + p[2] + '/' + p[1] + ')'; }
  else t += ' (de hoy)';
  return t;
}
function dolarHtml() {
  if (form.moneda !== 'USD') return '';
  const v = dolar();
  if (v) return '<div class="m-sub plata-dolar" id="plata-dolar">' + esc(dolarTexto()) + '</div>';
  return '<label class="m-field" id="plata-dolar">Dólar de hoy (CLP) · obligatorio para USD' +
    '<input class="m-input num" inputmode="decimal" data-f="dolarManual" placeholder="Ej: 950" autocomplete="off"></label>';
}
function pintaDolar() {
  if (!root) return;
  const el = root.querySelector('#plata-dolar');
  if (!el || form.moneda !== 'USD') return;
  const tmp = document.createElement('div');
  tmp.innerHTML = dolarHtml();
  const nuevo = tmp.firstElementChild;
  if (!nuevo) return;
  if (nuevo.tagName === 'LABEL' && el.tagName === 'LABEL') return; // no pisar el input manual
  el.replaceWith(nuevo);
  pintaPreview();
}

/* ---------------- vista ---------------- */
function render(el) {
  root = el;
  D();
  if (!form.cat || D().categorias[form.tipo].indexOf(form.cat) < 0) form.cat = catFor(form.tipo);
  cargaDolar();
  el.innerHTML = html();
  el.onclick = onClick;
  el.oninput = onInput;
  el.onchange = onChange;
  el.onkeydown = e => {
    if (e.key === 'Enter' && e.target.dataset && e.target.dataset.f === 'newcat') { e.preventDefault(); agregaCat(); }
  };
}
function redraw() { if (root) render(root); }

function html() {
  const t = totales(mes);
  const queda = t.ingresos - t.gastos - t.invertido;
  return `<div class="m-stack plata">
    <div class="section-title-row"><h2 class="section-title">PLATA</h2></div>
    ${htmlMes(t, queda)}
    ${htmlForm()}
    ${htmlFondo(t)}
    ${htmlMeta(t)}
    ${htmlEnQue(t)}
    ${htmlMovs()}
  </div>`;
}

function htmlMes(t, queda) {
  return `<div class="m-card">
    <div class="m-row">
      <button class="m-btn small ghost" data-a="mes" data-v="-1" aria-label="Mes anterior">◀</button>
      <div class="m-q plata-mes">${esc(nombreMes(mes))}</div>
      <button class="m-btn small ghost" data-a="mes" data-v="1" aria-label="Mes siguiente">▶</button>
    </div>
    <div class="m-grid3">
      <div class="m-stat"><div class="m-label">Entró</div><div class="v m-good plata-kpi">${clp(t.ingresos)}</div></div>
      <div class="m-stat"><div class="m-label">Salió</div><div class="v m-bad plata-kpi">${clp(t.gastos)}</div></div>
      <div class="m-stat"><div class="m-label">Invertido</div><div class="v plata-kpi plata-inv">${clp(t.invertido)}</div>
        ${t.invertidoUSD > 0 ? `<div class="m-sub plata-usd">${esc(U.fmtUSD(t.invertidoUSD))}</div>` : ''}</div>
    </div>
    <div class="m-row"><span class="m-sub">Te quedó</span><span class="m-big ${queda < 0 ? 'm-bad' : 'm-good'}" id="plata-queda">${queda < 0 ? '−' : ''}${clp(Math.abs(queda))}</span></div>
  </div>`;
}

function htmlForm() {
  const f = form, d = D();
  const editando = !!f.editId;
  const cats = d.categorias[f.tipo];
  return `<div class="m-card accent" id="plata-form">
    <div class="m-row"><span class="m-label hi">${editando ? 'Editando movimiento' : 'Registro rápido'}</span>
      ${editando ? '<button class="m-btn small ghost" data-a="cancelar">CANCELAR</button>' : ''}</div>
    <div class="m-seg" role="group" aria-label="Tipo">${TIPOS.map(([k, l]) =>
      `<button class="${f.tipo === k ? 'on' : ''}" data-a="tipo" data-v="${k}">${l}</button>`).join('')}</div>
    <input class="m-input num plata-monto" inputmode="decimal" data-f="monto" placeholder="0" value="${esc(f.monto)}" autocomplete="off" aria-label="Monto">
    <div class="m-sub plata-preview" id="plata-preview">${esc(previewTxt())}</div>
    <div class="m-seg" role="group" aria-label="Moneda">
      <button class="${f.moneda === 'CLP' ? 'on' : ''}" data-a="mon" data-v="CLP">CLP $</button>
      <button class="${f.moneda === 'USD' ? 'on' : ''}" data-a="mon" data-v="USD">USD US$</button>
    </div>
    ${dolarHtml()}
    <div class="m-label">Categoría</div>
    <div class="m-chips">${cats.map(c => `<button class="m-chip ${f.cat === c ? 'on' : ''}" data-a="cat" data-v="${esc(c)}">${esc(c)}</button>`).join('')}
      <button class="m-chip" data-a="addcat" aria-label="Agregar categoría">+</button></div>
    ${addingCat ? `<div class="m-row plata-newcat">
      <input class="m-input" data-f="newcat" placeholder="Nueva categoría de ${esc(TIPO_NOMBRE[f.tipo].toLowerCase())}" maxlength="30" autocomplete="off">
      <button class="m-btn small" data-a="savecat">AGREGAR</button>
      <button class="m-btn small ghost" data-a="nocat">✕</button></div>` : ''}
    <div class="m-grid2">
      <label class="m-field">Fecha<input class="m-input" type="date" data-f="fecha" value="${esc(f.fecha)}"></label>
      <label class="m-field">Nota (opcional)<input class="m-input" data-f="nota" value="${esc(f.nota)}" maxlength="80" autocomplete="off"></label>
    </div>
    <button class="m-btn primary block" data-a="guardar">${editando ? 'ACTUALIZAR' : 'GUARDAR'}</button>
    ${editando ? `<button class="m-btn danger block" data-a="borrar">${confirmDel ? '¿SEGURO? TOCA DE NUEVO PARA BORRAR' : 'BORRAR'}</button>` : ''}
  </div>`;
}

function previewTxt() {
  const n = parseMonto(form.monto, form.moneda);
  if (!n) return form.moneda === 'USD' ? 'Escribe el monto en dólares' : 'Escribe el monto en pesos';
  if (form.moneda === 'CLP') return clp(n);
  const tc = (form.editId && editTc()) || dolar();
  return U.fmtUSD(n) + (tc ? ' ≈ ' + clp(n * tc) : '');
}
function editTc() {
  const o = D().movs.find(x => x.id === form.editId);
  return o && o.moneda === 'USD' && o.tc ? o.tc : null;
}
function pintaPreview() {
  const p = root && root.querySelector('#plata-preview');
  if (p) p.textContent = previewTxt();
}

function htmlFondo(t) {
  const fondo = D().fondoPermisos[mes];
  const gastado = sum(movsDe(mes).filter(esMilo));
  return `<div class="m-card" id="plata-fondo">
    <div class="m-label hi">Fondo de permisos · ${esc(MESES[+mes.slice(5) - 1])}</div>
    <label class="m-field">Monto del fondo (CLP)
      <input class="m-input num" inputmode="decimal" data-f="fondo" value="${fondo != null ? esc(String(fondo)) : ''}" placeholder="Ej: 30000" autocomplete="off"></label>
    <div id="plata-fondo-det">${fondoDet(fondo, gastado)}</div>
    <div class="m-sub">Lo que Milo te deja comprar en la tienda sale de aquí.</div>
  </div>`;
}
function fondoDet(fondo, gastado) {
  if (fondo == null) return `<div class="m-sub">Gastado en permisos: ${clp(gastado)}. Define el fondo para ver cuánto queda.</div>`;
  const rest = fondo - gastado;
  const pct = fondo > 0 ? Math.min(100, Math.round(gastado / fondo * 100)) : (gastado > 0 ? 100 : 0);
  return `<div class="m-row"><span>Gastado ${clp(gastado)}</span><span class="${rest < 0 ? 'm-bad' : 'm-good'}">Queda ${rest < 0 ? '−' : ''}${clp(Math.abs(rest))}</span></div>
    <div class="m-bar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><i style="width:${pct}%;${rest < 0 ? 'background:var(--danger)' : ''}"></i></div>`;
}

function htmlMeta(t) {
  const meta = D().metaInversion[mes];
  return `<div class="m-card" id="plata-meta">
    <div class="m-label hi">Meta de inversión · ${esc(MESES[+mes.slice(5) - 1])}</div>
    <label class="m-field">Meta del mes (CLP equivalentes)
      <input class="m-input num" inputmode="decimal" data-f="meta" value="${meta != null ? esc(String(meta)) : ''}" placeholder="Ej: 100000" autocomplete="off"></label>
    <div id="plata-meta-det">${metaDet(meta, t.invertido)}</div>
  </div>`;
}
function metaDet(meta, inv) {
  if (!(meta > 0)) return `<div class="m-sub">Llevas invertido ${clp(inv)} este mes. Fija una meta para ver el avance.</div>`;
  const pct = Math.round(inv / meta * 100);
  return `<div class="m-row"><span>${clp(inv)} de ${clp(meta)}</span><span class="${pct >= 100 ? 'm-good' : ''}">${pct}%</span></div>
    <div class="m-bar" role="progressbar" aria-valuenow="${Math.min(pct, 100)}" aria-valuemin="0" aria-valuemax="100"><i style="width:${Math.min(100, pct)}%"></i></div>`;
}

function htmlEnQue(t) {
  const porCat = {};
  t.gastosMov.forEach(x => { const c = x.categoria || 'Sin categoría'; porCat[c] = (porCat[c] || 0) + (Number(x.montoCLP) || 0); });
  const filas = Object.keys(porCat).map(c => [c, porCat[c]]).sort((a, b) => b[1] - a[1]);
  const total = t.gastos;
  const barras = filas.length ? filas.map(([c, v]) => {
    const pct = total > 0 ? v / total * 100 : 0;
    return `<div class="plata-cat"><div class="m-row"><span class="plata-cat-n">${esc(c)}</span><span class="m-mono">${clp(v)} · ${Math.round(pct)}%</span></div>
      <div class="m-bar"><i style="width:${Math.max(2, pct).toFixed(1)}%;background:var(--danger)"></i></div></div>`;
  }).join('') : '<div class="m-sub">Aún no hay gastos este mes.</div>';
  return `<div class="m-card">
    <div class="m-label hi">En qué se fue</div>
    <div class="m-stack plata-cats">${barras}</div>
    <div class="m-label">Últimos 6 meses</div>
    ${chart6()}
  </div>`;
}

function chart6() {
  const meses = []; for (let i = 5; i >= 0; i--) meses.push(mesDesplazado(mes, -i));
  const tt = meses.map(totales);
  const series = [
    { k: 'ingresos', n: 'Ingresos', c: 'var(--success)', dash: '' },
    { k: 'gastos', n: 'Gastos', c: 'var(--danger)', dash: '7 4' },
    { k: 'invertido', n: 'Invertido', c: 'var(--cyan)', dash: '1.5 4' }
  ];
  let mn = Infinity, mx = -Infinity;
  tt.forEach(t => series.forEach(s => { mn = Math.min(mn, t[s.k]); mx = Math.max(mx, t[s.k]); }));
  if (!(mx > 0)) return '<div class="m-sub">Sin movimientos en estos meses todavía.</div>';
  if (mx === mn) { mn = Math.max(0, mn - mx * 0.1); mx = mx * 1.1; }
  const pad = (mx - mn) * 0.1;
  const lo = Math.max(0, mn - pad), hi = mx + pad;
  const W = 340, H = 170, L = 46, R = 10, T = 10, B = 24;
  const X = i => L + (W - L - R) * i / 5;
  const Y = v => T + (H - T - B) * (1 - (v - lo) / (hi - lo));
  const abrev = v => v >= 1e6 ? (v / 1e6).toFixed(1).replace('.0', '') + 'M' : v >= 1e3 ? Math.round(v / 1e3) + 'k' : String(Math.round(v));
  let g = '';
  for (let i = 0; i <= 3; i++) {
    const v = lo + (hi - lo) * i / 3, y = Y(v);
    g += `<line x1="${L}" x2="${W - R}" y1="${y}" y2="${y}" stroke="var(--cyan-line-soft)" stroke-width="1"/>
      <text x="${L - 5}" y="${y + 4}" text-anchor="end" font-size="10" fill="var(--text-dim)">${abrev(v)}</text>`;
  }
  meses.forEach((m, i) => { g += `<text x="${X(i)}" y="${H - 7}" text-anchor="middle" font-size="10" fill="var(--text-dim)">${MESES_CORTO[+m.slice(5) - 1]}</text>`; });
  series.forEach(s => {
    const pts = tt.map((t, i) => X(i).toFixed(1) + ',' + Y(t[s.k]).toFixed(1)).join(' ');
    g += `<polyline points="${pts}" fill="none" stroke="${s.c}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"${s.dash ? ` stroke-dasharray="${s.dash}"` : ''}/>`;
    tt.forEach((t, i) => { g += `<circle cx="${X(i).toFixed(1)}" cy="${Y(t[s.k]).toFixed(1)}" r="2.6" fill="${s.c}"/>`; });
  });
  const leg = series.map(s => `<span class="plata-leg"><svg width="26" height="8" aria-hidden="true"><line x1="1" x2="25" y1="4" y2="4" stroke="${s.c}" stroke-width="2.2" stroke-linecap="round"${s.dash ? ` stroke-dasharray="${s.dash}"` : ''}/></svg>${s.n}</span>`).join('');
  return `<svg class="m-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Ingresos, gastos e inversión de los últimos 6 meses">${g}</svg><div class="m-legend">${leg}</div>`;
}

function htmlMovs() {
  const lista = movsDe(mes).slice().sort((a, b) => (b.fecha || '').localeCompare(a.fecha || '') || String(b.id).localeCompare(String(a.id)));
  const filas = lista.map(x => {
    const p = x.fecha.split('-');
    const col = x.tipo === 'ingreso' ? 'var(--success)' : x.tipo === 'gasto' ? 'var(--danger)' : 'var(--cyan)';
    const signo = x.tipo === 'ingreso' ? '+' : x.tipo === 'gasto' ? '−' : '';
    const monto = x.moneda === 'USD' ? `${esc(U.fmtUSD(x.monto))} · ${clp(x.montoCLP)}` : clp(x.montoCLP);
    return `<button class="plata-mov${form.editId === x.id ? ' sel' : ''}" data-a="edit" data-v="${esc(x.id)}">
      <span class="plata-mov-f m-mono">${p[2]}/${p[1]}</span>
      <span class="plata-mov-c"><b>${esc(x.categoria || '—')}</b>${x.origen === 'milo' ? ' <i class="m-dim">· Milo</i>' : ''}${x.nota ? `<small>${esc(x.nota)}</small>` : ''}</span>
      <span class="plata-mov-m m-mono" style="color:${col}">${signo}${monto}</span></button>`;
  }).join('');
  return `<div class="m-card">
    <div class="m-label hi">Movimientos del mes · ${lista.length}</div>
    ${lista.length ? `<div class="m-list">${filas}</div>` : '<div class="m-sub">Nada anotado este mes. Usa el registro rápido de arriba.</div>'}
    ${lista.length ? '<div class="m-sub">Toca un movimiento para editarlo o borrarlo.</div>' : ''}
  </div>`;
}

/* ---------------- eventos ---------------- */
function onInput(e) {
  const f = e.target.dataset && e.target.dataset.f;
  if (!f) return;
  if (f === 'monto') {
    const v = limpiaMonto(e.target.value);
    if (v !== e.target.value) e.target.value = v;
    form.monto = v; pintaPreview();
  } else if (f === 'nota') form.nota = e.target.value;
  else if (f === 'fecha') form.fecha = e.target.value;
}
function onChange(e) {
  const f = e.target.dataset && e.target.dataset.f;
  if (!f) return;
  const d = D();
  if (f === 'fecha') { form.fecha = e.target.value || U.todayKey(); return; }
  if (f === 'fondo') {
    const n = parseMonto(e.target.value, 'CLP');
    if (e.target.value.trim() === '') delete d.fondoPermisos[mes]; else d.fondoPermisos[mes] = Math.round(n);
    App.save('plata', { noRender: true });
    const det = root.querySelector('#plata-fondo-det');
    if (det) det.innerHTML = fondoDet(d.fondoPermisos[mes], sum(movsDe(mes).filter(esMilo)));
  } else if (f === 'meta') {
    const n = parseMonto(e.target.value, 'CLP');
    if (e.target.value.trim() === '') delete d.metaInversion[mes]; else d.metaInversion[mes] = Math.round(n);
    App.save('plata', { noRender: true });
    const det = root.querySelector('#plata-meta-det');
    if (det) det.innerHTML = metaDet(d.metaInversion[mes], totales(mes).invertido);
  } else if (f === 'dolarManual') {
    const n = parseMonto(e.target.value, 'CLP');
    if (n > 0) {
      dolarInfo = { fecha: U.todayKey(), valor: n, manual: true };
      lsSet(DOLAR_KEY, dolarInfo);
      pintaDolar(); pintaPreview();
    }
  }
}

function onClick(e) {
  const b = e.target.closest('[data-a]');
  if (!b || !root.contains(b)) return;
  const a = b.dataset.a, v = b.dataset.v;
  if (a === 'mes') { mes = mesDesplazado(mes, +v); confirmDel = false; redraw(); }
  else if (a === 'tipo') {
    if (form.tipo !== v) {
      form.tipo = v; form.cat = catFor(v);
      form.moneda = v === 'inversion' ? ui.monInv : 'CLP';
      addingCat = false;
    }
    redraw();
  }
  else if (a === 'mon') { form.moneda = v; if (form.tipo === 'inversion') { ui.monInv = v; lsSet(UI_KEY, ui); } redraw(); }
  else if (a === 'cat') { form.cat = v; ui.cat[form.tipo] = v; lsSet(UI_KEY, ui); redraw(); }
  else if (a === 'addcat') { addingCat = true; redraw(); const i = root.querySelector('[data-f="newcat"]'); if (i) i.focus(); }
  else if (a === 'nocat') { addingCat = false; redraw(); }
  else if (a === 'savecat') agregaCat();
  else if (a === 'guardar') guardar();
  else if (a === 'cancelar') { limpiaEdicion(); redraw(); }
  else if (a === 'borrar') borrar();
  else if (a === 'edit') editar(v);
}

function agregaCat() {
  const i = root.querySelector('[data-f="newcat"]');
  const nombre = i ? i.value.trim() : '';
  if (!nombre) { U.toast('ESCRIBE UN NOMBRE'); return; }
  const lista = D().categorias[form.tipo];
  const ya = lista.find(c => c.toLowerCase() === nombre.toLowerCase());
  if (!ya) lista.push(nombre);
  form.cat = ya || nombre; ui.cat[form.tipo] = form.cat; lsSet(UI_KEY, ui);
  addingCat = false;
  App.save('plata');
}

function guardar() {
  const d = D(), f = form;
  const monto = parseMonto(f.monto, f.moneda);
  if (!(monto > 0)) { U.toast('PON UN MONTO'); return; }
  if (!f.cat) { U.toast('ELIGE UNA CATEGORÍA'); return; }
  const fecha = /^\d{4}-\d{2}-\d{2}$/.test(f.fecha) ? f.fecha : U.todayKey();
  const orig = f.editId ? d.movs.find(x => x.id === f.editId) : null;
  let tc = null, montoCLP, m = monto;
  if (f.moneda === 'USD') {
    tc = orig && orig.moneda === 'USD' && orig.tc ? orig.tc : dolar();
    if (!(tc > 0)) { U.toast('FALTA EL DÓLAR DE HOY'); return; }
    m = Math.round(monto * 100) / 100;
    montoCLP = Math.round(m * tc);
  } else { m = Math.round(monto); montoCLP = m; }
  const reg = { id: orig ? orig.id : U.uid('m'), fecha, tipo: f.tipo, monto: m, moneda: f.moneda, tc, montoCLP,
    categoria: f.cat, nota: f.nota.trim(), origen: orig ? (orig.origen || '') : '' };
  if (orig) d.movs[d.movs.indexOf(orig)] = reg; else d.movs.push(reg);
  ui.cat[f.tipo] = f.cat; if (f.tipo === 'inversion') ui.monInv = f.moneda; lsSet(UI_KEY, ui);
  const eraEdicion = !!orig;
  f.monto = ''; f.nota = '';
  if (eraEdicion) { f.editId = null; f.fecha = U.todayKey(); f.moneda = f.tipo === 'inversion' ? ui.monInv : 'CLP'; }
  else f.fecha = U.todayKey();
  confirmDel = false;
  const mm = fecha.slice(0, 7);
  if (mm !== mes && eraEdicion === false) mes = mm; // muestra el mes donde quedó anotado
  App.save('plata');
  U.toast(eraEdicion ? 'Actualizado' : 'Anotado');
}

function editar(id) {
  const x = D().movs.find(m => m.id === id);
  if (!x) return;
  Object.assign(form, { tipo: x.tipo, monto: String(x.monto).replace('.', x.moneda === 'USD' ? '.' : ''), moneda: x.moneda || 'CLP', cat: x.categoria, fecha: x.fecha, nota: x.nota || '', editId: x.id });
  if (D().categorias[x.tipo].indexOf(x.categoria) < 0) D().categorias[x.tipo].push(x.categoria);
  confirmDel = false; addingCat = false;
  redraw();
  const card = root.querySelector('#plata-form');
  if (card && card.scrollIntoView) card.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function limpiaEdicion() {
  Object.assign(form, nuevoForm(form.tipo), { cat: catFor(form.tipo) });
  confirmDel = false;
}
function borrar() {
  if (!form.editId) return;
  if (!confirmDel) { confirmDel = true; redraw(); return; }
  const d = D();
  d.movs = d.movs.filter(x => x.id !== form.editId);
  limpiaEdicion();
  App.save('plata');
  U.toast('Borrado');
}

/* ---------------- exportar ---------------- */
function movsOrdenados() {
  return D().movs.slice().sort((a, b) => (a.fecha || '').localeCompare(b.fecha || '') || String(a.id).localeCompare(String(b.id)));
}
function exportData() {
  const d = D();
  const meses = {};
  d.movs.forEach(x => { meses[(x.fecha || '').slice(0, 7)] = 1; });
  const resumen = Object.keys(meses).filter(Boolean).sort().map(m => {
    const t = totales(m);
    const porCategoria = {};
    t.gastosMov.forEach(x => { porCategoria[x.categoria] = (porCategoria[x.categoria] || 0) + (Number(x.montoCLP) || 0); });
    return { mes: m, ingresos: t.ingresos, gastos: t.gastos, invertidoCLP: t.invertido, invertidoUSD: Math.round(t.invertidoUSD * 100) / 100, porCategoria };
  });
  return {
    _leeme: {
      convencion: 'montoCLP siempre está en pesos chilenos; tc = pesos (CLP) por 1 USD del día del registro (null si fue en CLP).',
      movs: 'tipo: gasto | ingreso | inversion. monto está en la moneda indicada (CLP o USD). origen "milo" = compra hecha con el fondo de permisos del juego.',
      resumenMensual: 'Por mes: ingresos, gastos e inversión en CLP; invertidoUSD es el monto original en dólares; porCategoria suma solo los gastos en CLP.',
      fondoPermisos: 'Monto en CLP que Josué fija cada mes para los permisos de Milo ("YYYY-MM").',
      metaInversion: 'Meta de inversión del mes en CLP equivalentes ("YYYY-MM").'
    },
    movs: movsOrdenados(),
    resumenMensual: resumen,
    fondoPermisos: d.fondoPermisos,
    metaInversion: d.metaInversion
  };
}
function exportCSV() {
  const cols = ['fecha', 'tipo', 'categoria', 'monto', 'moneda', 'tc', 'monto_clp', 'nota', 'origen'];
  const filas = movsOrdenados().map(x => ({ fecha: x.fecha, tipo: x.tipo, categoria: x.categoria, monto: x.monto, moneda: x.moneda, tc: x.tc, monto_clp: x.montoCLP, nota: x.nota, origen: x.origen }));
  return { 'plata_movimientos.csv': U.toCSV(filas, cols) };
}

/* ---------------- HOY ---------------- */
function hoyCards() {
  const hoy = U.todayKey(), m = U.monthKey(hoy);
  if (D().fondoPermisos[m] == null && Number(hoy.slice(8)) <= 5) {
    return [{ order: 38, area: 'Plata', titulo: 'Define tu fondo de permisos', sub: 'Es lo que Milo te deja gastar este mes', xp: 0, go: 'plata', tone: 'warn' }];
  }
  return [];
}
// para HOY: gastado hoy (solo el dato, sin presupuesto diario)
function hoyResumen() {
  const hoy = U.todayKey();
  const gh = D().movs.filter(x => x.tipo === 'gasto' && x.fecha === hoy);
  return { gastadoHoy: sum(gh), nGastos: gh.length };
}

App.register({
  id: 'plata',
  defaults() { return { v: 1, movs: [], categorias: catsDefault(), fondoPermisos: {}, metaInversion: {} }; },
  view: { id: 'plata', render },
  hoyCards, hoyResumen, exportData, exportCSV
});
})();
