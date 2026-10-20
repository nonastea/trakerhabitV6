/* ============================================================
   V7 · App — registro de módulos, almacenamiento por módulo,
   navegación (HOY · HÁBITOS · CUERPO · PLATA · DATOS) y utilidades.
   Se carga DESPUÉS de core/core.js y ANTES de los módulos.
   Los módulos llaman App.register({...}); index.html llama App.boot().
   Contrato completo: CONTRATO_MODULOS.md
   ============================================================ */
(function () {
'use strict';

const MOD_PREFIX = 'habitos-v7:';
const mods = [];          // módulos registrados
const listeners = {};     // eventos
const subviews = {};      // parentId -> [{id,label,order,render,mod}]
let currentSub = {};      // parentId -> subId activo
let booted = false;

/* ---------------- utilidades ---------------- */
const pad = n => String(n).padStart(2, '0');
function keyOf(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
function todayKey() { return keyOf(new Date()); }
function parseKey(k) { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d, 12); }
function addDaysKey(k, n) { const d = parseKey(k); d.setDate(d.getDate() + n); return keyOf(d); }
function daysBetween(a, b) { return Math.round((parseKey(b) - parseKey(a)) / 86400000); }
function mondayOf(k) { const d = parseKey(k); const wd = (d.getDay() + 6) % 7; d.setDate(d.getDate() - wd); return keyOf(d); }
function weekKey(k) { // ISO 8601: 'YYYY-Www'
  const d = parseKey(k); const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day + 3);
  const firstThu = new Date(d.getFullYear(), 0, 4, 12);
  const wk = 1 + Math.round(((d - firstThu) / 86400000 - 3 + ((firstThu.getDay() + 6) % 7)) / 7);
  return `${d.getFullYear()}-W${pad(wk)}`;
}
function monthKey(k) { return (k || todayKey()).slice(0, 7); }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function uid(p) { return (p || 'x') + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
function fmtNum(n, dec) { if (n == null || isNaN(n)) return '—'; return Number(n).toLocaleString('es-CL', { minimumFractionDigits: dec || 0, maximumFractionDigits: dec == null ? 1 : dec }); }
function fmtCLP(n) { if (n == null || isNaN(n)) return '—'; return '$' + Math.round(n).toLocaleString('es-CL'); }
function fmtUSD(n) { if (n == null || isNaN(n)) return '—'; return 'US$' + Number(n).toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function toast(msg) { if (typeof showToast === 'function') showToast(msg); }
function downloadFile(name, text, mime) {
  const blob = new Blob([text], { type: mime || 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}
async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; }
  catch (e) {
    const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta);
    ta.select(); let ok = false; try { ok = document.execCommand('copy'); } catch (_) {}
    ta.remove(); return ok;
  }
}
// csv: filas = array de objetos; columnas = array de nombres (orden fijo)
function toCSV(rows, cols) {
  const q = v => { if (v == null) return ''; const s = String(v); return /[",\n;]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  return [cols.join(',')].concat(rows.map(r => cols.map(c => q(r[c])).join(','))).join('\n');
}

/* ---------------- eventos ---------------- */
function on(evt, fn) { (listeners[evt] = listeners[evt] || []).push(fn); }
function emit(evt, payload) { (listeners[evt] || []).forEach(fn => { try { fn(payload); } catch (e) { console.error(e); } }); }

/* ---------------- datos por módulo ---------------- */
// Cada módulo vive en state[id] y en localStorage 'habitos-v7:<id>'.
// state[id]._mod = timestamp del último cambio (lo usa la sincronización).
function loadModule(m) {
  let d = null;
  try { const raw = localStorage.getItem(MOD_PREFIX + m.id); if (raw) d = JSON.parse(raw); } catch (e) { console.error(e); }
  const def = m.defaults ? m.defaults() : {};
  state[m.id] = Object.assign(def, d || {});
  if (!state[m.id]._mod) state[m.id]._mod = 0;
}
function data(id) { return state[id]; }
function persist(id) {
  try { localStorage.setItem(MOD_PREFIX + id, JSON.stringify(state[id])); }
  catch (e) { toast('ERROR AL GUARDAR ' + id.toUpperCase()); }
}
// save(id): guarda, marca para sincronizar, avisa a todos (HOY, Milo, Datos)
function save(id, opts) {
  opts = opts || {};
  if (!state[id]) return;
  if (!opts.silent) state[id]._mod = Date.now();
  persist(id);
  if (!opts.silent && window.Sync) Sync.markDirty(id);
  try { if (window.MODO_JUEGO && MODO_JUEGO.invalidar) MODO_JUEGO.invalidar(); } catch (e) {}
  emit('change', id);
  if (!opts.noRender) refreshVisible();
}
// para que sync.js reemplace los datos de un módulo con los de la nube
function replaceModuleData(id, d) {
  const m = mods.find(x => x.id === id);
  const def = m && m.defaults ? m.defaults() : {};
  state[id] = Object.assign(def, d || {});
  persist(id);
  emit('change', id);
}

/* ---------------- hábitos automáticos ---------------- */
// Marca (sin desmarcar) el primer hábito cuyo nombre calce con el regex.
function autoMarkHabit(regex, dateKey) {
  try {
    const h = (state.habits || []).find(x => regex.test(x.name || ''));
    if (!h) return false;
    const k = dateKey || todayKey();
    if (state.completions[h.id] && state.completions[h.id][k]) return false;
    if (typeof toggleDone === 'function') { toggleDone(h.id, startOfDay(parseKey(k))); return true; }
  } catch (e) { console.error(e); }
  return false;
}

/* ---------------- navegación ---------------- */
const ICONS = {
  hoy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
  habitos: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
  cuerpo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="5" r="2.5"/><path d="M12 8v7M8 22l4-7 4 7M6 11l6-2 6 2"/></svg>',
  plata: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="13" rx="2"/><circle cx="12" cy="12.5" r="2.5"/><path d="M6 9.5h.01M18 15.5h.01"/></svg>',
  datos: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="20" x2="6" y2="12"/><line x1="12" y1="20" x2="12" y2="5"/><line x1="18" y1="20" x2="18" y2="9"/></svg>'
};
// vistas principales de la barra inferior (móvil) y lateral (escritorio)
const MAIN_TABS = [
  { view: 'hoy', label: 'HOY' },
  { view: 'habitos', label: 'HÁBITOS' },
  { view: 'cuerpo', label: 'CUERPO' },
  { view: 'plata', label: 'PLATA' },
  { view: 'datos', label: 'DATOS' }
];
// vistas antiguas que en la barra inferior se agrupan bajo DATOS
const UNDER_DATOS = ['datos', 'mas', 'estadisticas', 'calendario', 'tareas', 'ajustes', 'resumen'];

function ensureSection(id) {
  let sec = document.getElementById('view-' + id);
  if (!sec) {
    sec = document.createElement('section');
    sec.id = 'view-' + id;
    sec.className = 'hidden v7-view';
    document.querySelector('main.content').appendChild(sec);
  }
  return sec;
}

function buildNav() {
  // Barra inferior (móvil): se reemplaza entera
  const bn = document.getElementById('bottomNav');
  if (bn) {
    bn.innerHTML = MAIN_TABS.map(t =>
      `<button class="bn-item" data-view="${t.view}" onclick="App.go('${t.view}')">${ICONS[t.view] || ''}<span>${t.label}</span></button>`
    ).join('');
  }
  // Barra lateral (escritorio): HOY arriba; CUERPO/PLATA/DATOS después de HÁBITOS
  const nav = document.getElementById('nav');
  if (nav && !nav.querySelector('[data-view="hoy"]')) {
    const mk = (v, label) => {
      const d = document.createElement('div');
      d.className = 'nav-item'; d.dataset.view = v;
      d.innerHTML = `${ICONS[v]}<span>${label}</span>`;
      return d;
    };
    nav.insertBefore(mk('hoy', 'HOY'), nav.firstChild);
    const hab = nav.querySelector('[data-view="habitos"]');
    const after = hab ? hab.nextSibling : null;
    nav.insertBefore(mk('cuerpo', 'CUERPO'), after);
    nav.insertBefore(mk('plata', 'PLATA'), after);
    nav.insertBefore(mk('datos', 'DATOS'), after);
  }
}

// En móvil, Tareas/Calendario/Estadísticas/Ajustes viven dentro de DATOS: botón para volver
const SUB_DATOS = ['tareas', 'calendario', 'estadisticas', 'ajustes'];
function ensureBackButton(view) {
  if (!SUB_DATOS.includes(view)) return;
  const sec = document.getElementById('view-' + view);
  if (!sec || sec.querySelector('.v7-back')) return;
  const b = document.createElement('button');
  b.className = 'm-btn small ghost v7-back'; b.textContent = '‹ DATOS';
  b.onclick = () => go('datos');
  sec.insertBefore(b, sec.firstChild);
}

// Llamado por switchView() de core.js al final
function afterSwitch(view) {
  ensureBackButton(view);
  document.querySelectorAll('.bn-item').forEach(el => {
    const v = el.dataset.view;
    const active = v === view || (v === 'datos' && UNDER_DATOS.includes(view));
    el.classList.toggle('active', active);
  });
  renderView(view);
}

// go('cuerpo') · go('cuerpo/piel') · go('habitos')
function go(target) {
  const [view, sub] = String(target).split('/');
  if (sub) currentSub[view] = sub;
  if (typeof switchView === 'function') switchView(view);
}

/* ---------------- render ---------------- */
function viewOwner(view) { return mods.find(m => m.view && m.view.id === view); }

function renderView(view) {
  if (subviews[view]) { renderParent(view); return; }
  const m = viewOwner(view);
  if (m && m.view.render) {
    try { m.view.render(ensureSection(view)); } catch (e) { console.error('[' + m.id + ']', e); }
  }
}

// Vista con pestañas internas (CUERPO: PIEL · ENTRENO · MEDIDAS · SEMANA)
function renderParent(view) {
  const sec = ensureSection(view);
  const list = (subviews[view] || []).slice().sort((a, b) => a.order - b.order);
  if (!list.length) return;
  if (!list.find(s => s.id === currentSub[view])) currentSub[view] = list[0].id;
  const title = (MAIN_TABS.find(t => t.view === view) || {}).label || view.toUpperCase();
  sec.innerHTML = `
    <div class="section-title-row"><h2 class="section-title">${esc(title)}</h2></div>
    <div class="m-tabs" role="tablist">${list.map(s =>
      `<button role="tab" class="m-tab${s.id === currentSub[view] ? ' on' : ''}" aria-selected="${s.id === currentSub[view]}" onclick="App.go('${view}/${s.id}')">${esc(s.label)}</button>`).join('')}</div>
    <div class="m-subview" id="sub-${view}"></div>`;
  const s = list.find(x => x.id === currentSub[view]);
  try { s.render(sec.querySelector('#sub-' + view)); } catch (e) { console.error('[' + s.mod + ']', e); }
}

function refreshVisible() {
  if (!booted) return;
  renderView(state.view);
}

// Tarjetas que los módulos ofrecen para HOY: [{order, html}] — los enlaces
// usan data-go="cuerpo/piel" y App los resuelve con un solo listener.
function hoyCards() {
  const out = [];
  mods.forEach(m => {
    if (!m.hoyCards) return;
    try { (m.hoyCards() || []).forEach(c => out.push(Object.assign({ order: 50, mod: m.id }, c))); }
    catch (e) { console.error('[' + m.id + '] hoyCards', e); }
  });
  return out.sort((a, b) => a.order - b.order);
}

document.addEventListener('click', e => {
  const t = e.target.closest('[data-go]');
  if (t) { e.preventDefault(); go(t.dataset.go); }
});

/* ---------------- registro y arranque ---------------- */
function register(m) {
  if (!m || !m.id) throw new Error('módulo sin id');
  if (mods.find(x => x.id === m.id)) return;
  mods.push(m);
  (m.subviews || []).forEach(s => {
    (subviews[s.parent] = subviews[s.parent] || []).push(Object.assign({ order: 50, mod: m.id }, s));
  });
  if (booted) { loadModule(m); }
}

function boot() {
  buildNav();
  // datos de cada módulo ANTES de init() para que Milo y HOY los vean
  mods.forEach(loadModule);
  Object.keys(subviews).forEach(ensureSection);
  mods.forEach(m => { if (m.view) ensureSection(m.view.id); });
  booted = true;
  mods.forEach(m => { try { if (m.init) m.init(); } catch (e) { console.error('[' + m.id + '] init', e); } });
  init();              // core.js
  // cualquier cambio del núcleo (marcar hábito, tarea...) refresca la vista de módulo abierta (p. ej. HOY)
  const origRenderAll = window.renderAll;
  window.renderAll = function () { const r = origRenderAll.apply(this, arguments); refreshVisible(); return r; };
  if (window.Sync) Sync.start();
  emit('boot');
}

window.App = {
  register, boot, data, save, replaceModuleData, on, emit, go, hoyCards, afterSwitch,
  autoMarkHabit, refresh: refreshVisible,
  modules: () => mods.slice(),
  util: { keyOf, todayKey, parseKey, addDaysKey, daysBetween, mondayOf, weekKey, monthKey,
          esc, uid, fmtNum, fmtCLP, fmtUSD, toast, downloadFile, copyText, toCSV },
  MOD_PREFIX
};
})();
