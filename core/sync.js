/* ============================================================
   V7 · Sincronización en la nube con un GIST SECRETO de GitHub
   ------------------------------------------------------------
   Por qué no JSONBin: el plan gratis tiene 100 KB por bin y 10.000
   solicitudes EN TOTAL (no se renuevan). Solo el historial de la piel
   ya pesa ~55 KB. Un Gist secreto es gratis, aguanta MB por archivo y
   permite 5.000 solicitudes por HORA con token.

   - Un archivo por área: core.json (hábitos, tareas, eventos, ajustes,
     Milo) + <módulo>.json (piel, gym, plata, datos).
   - Solo se suben los archivos que cambiaron (un PATCH para todos).
   - Al abrir y al volver a la app se baja el Gist (1 GET) y por archivo
     gana el más nuevo. Las marcas de hábitos se MEZCLAN: nunca se pierde
     una marca hecha en otro dispositivo.
   - settings.cloudBinId = id del Gist · settings.cloudApiKey = token.
   ============================================================ */
(function () {
'use strict';

const API = 'https://api.github.com/gists';
const DIRTY_KEY = 'habitos-v7:sync-dirty';
const PUSH_DELAY = 4000;
const PULL_THROTTLE = 30000;

let dirty = new Set();
try { JSON.parse(localStorage.getItem(DIRTY_KEY) || '[]').forEach(x => dirty.add(x)); } catch (e) {}
let busy = false, pushTimer = null, lastPull = 0, started = false;

function persistDirty() { try { localStorage.setItem(DIRTY_KEY, JSON.stringify([...dirty])); } catch (e) {} }

/* ---------- configuración ---------- */
function looksLikeJsonbinKey(k) { return /^\$2[aby]\$/.test(k || ''); }

// La V6 dejaba credenciales de JSONBin en los ajustes: se apartan para no confundirlas con las del Gist
function migrateLegacySettings() {
  const s = state.settings;
  if (looksLikeJsonbinKey(s.cloudApiKey)) {
    s.legacyJsonbinId = s.cloudBinId; s.legacyJsonbinKey = s.cloudApiKey;
    s.cloudBinId = ''; s.cloudApiKey = ''; s.cloudAutoSync = false;
    saveState(false);
  }
  const row = document.getElementById('legacyJsonbinRow');
  if (row) row.style.display = s.legacyJsonbinKey ? '' : 'none';
}

window.cloudConfigured = function () {
  return !!(state.settings.cloudBinId && state.settings.cloudApiKey && !looksLikeJsonbinKey(state.settings.cloudApiKey));
};
function headers() {
  return { 'Authorization': 'Bearer ' + state.settings.cloudApiKey, 'Accept': 'application/vnd.github+json', 'Content-Type': 'application/json' };
}

/* ---------- payloads ---------- */
function mergeCompletions(local, remote) {
  const out = JSON.parse(JSON.stringify(local || {}));
  if (!remote || typeof remote !== 'object') return out;
  for (const hid in remote) {
    out[hid] = out[hid] || {};
    for (const day in remote[hid]) if (remote[hid][day]) out[hid][day] = true;
  }
  return out;
}
const SECRET_SETTINGS = ['cloudApiKey', 'cloudBinId', 'lastSyncAt', 'legacyJsonbinId', 'legacyJsonbinKey', 'cloudKeyType'];
function corePayload() {
  const st = Object.assign({}, state.settings);
  SECRET_SETTINGS.forEach(k => delete st[k]);
  return {
    habits: state.habits, completions: state.completions, tasks: state.tasks,
    archivedTasks: state.archivedTasks, taskLog: state.taskLog, events: state.events,
    categories: state.categories, settings: st, game: state.game || {},
    _syncMeta: { modifiedAt: state.dataModifiedAt || Date.now(), schema: 7 }
  };
}
function applyCore(d) {
  const keep = {}; SECRET_SETTINGS.forEach(k => { keep[k] = state.settings[k]; });
  keep.cloudAutoSync = state.settings.cloudAutoSync;
  state.habits = d.habits || [];
  state.tasks = d.tasks || [];
  state.archivedTasks = d.archivedTasks || [];
  state.taskLog = d.taskLog || [];
  state.events = d.events || [];
  state.categories = d.categories || state.categories;
  state.settings = Object.assign({}, state.settings, d.settings || {}, keep);
  state.game = d.game || state.game || {};
}
function moduleIds() { return App.modules().map(m => m.id).filter(id => state[id]); }
function fileFor(id) {
  if (id === 'core') return JSON.stringify(corePayload());
  return JSON.stringify(state[id]);
}

/* ---------- red ---------- */
async function getGist() {
  const r = await fetch(`${API}/${state.settings.cloudBinId}`, { headers: headers(), cache: 'no-store' });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  const g = await r.json();
  const files = {};
  for (const name in (g.files || {})) {
    const f = g.files[name];
    let txt = f.content;
    if (f.truncated && f.raw_url) txt = await (await fetch(f.raw_url, { cache: 'no-store' })).text();
    try { files[name] = JSON.parse(txt); } catch (e) { /* archivo ajeno o corrupto: se ignora */ }
  }
  return files;
}

async function push(opts) {
  opts = opts || {};
  if (!cloudConfigured() || busy || !dirty.size) return { ok: true, skipped: true };
  busy = true;
  const sending = [...dirty];
  const files = {};
  sending.forEach(id => { if (id === 'core' || state[id]) files[id + '.json'] = { content: fileFor(id) }; });
  try {
    const body = JSON.stringify({ files });
    // keepalive (para subir al cerrar la app) solo admite cuerpos < 64 KB
    const r = await fetch(`${API}/${state.settings.cloudBinId}`, {
      method: 'PATCH', headers: headers(), body, keepalive: !!opts.keepalive && body.length < 60000
    });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    sending.forEach(id => dirty.delete(id)); persistDirty();
    state.settings.lastSyncAt = Date.now(); saveState(false);
    renderCloudStatus();
    return { ok: true };
  } catch (e) {
    renderCloudStatus('ERROR AL SUBIR: ' + e.message);
    return { ok: false, msg: e.message };
  } finally { busy = false; }
}

async function pull() {
  if (!cloudConfigured() || busy) return { ok: false };
  busy = true;
  let applied = false;
  try {
    const files = await getGist();
    // núcleo
    const c = files['core.json'];
    if (c) {
      const merged = mergeCompletions(state.completions, c.completions);
      const changedMarks = JSON.stringify(merged) !== JSON.stringify(state.completions || {});
      const remoteMod = (c._syncMeta && c._syncMeta.modifiedAt) || 0;
      if (remoteMod > (state.dataModifiedAt || 0)) {
        applyCore(c);
        if (typeof migrateTasksV3 === 'function') migrateTasksV3();
        state.completions = merged; state.dataModifiedAt = remoteMod; applied = true;
        if (changedMarks || JSON.stringify(merged) !== JSON.stringify(c.completions || {})) dirty.add('core');
      } else if (changedMarks) {
        state.completions = merged; applied = true; dirty.add('core');
      } else if (remoteMod < (state.dataModifiedAt || 0)) dirty.add('core');
      saveState(false);
    } else dirty.add('core');
    // módulos: gana el más nuevo
    moduleIds().forEach(id => {
      const remote = files[id + '.json'];
      const localMod = (state[id] && state[id]._mod) || 0;
      const remoteMod = (remote && remote._mod) || 0;
      if (remote && remoteMod > localMod) { App.replaceModuleData(id, remote); applied = true; dirty.delete(id); }
      else if (localMod > remoteMod) dirty.add(id);
    });
    persistDirty();
    state.settings.lastSyncAt = Date.now(); saveState(false);
    if (applied) {
      if (typeof applyTheme === 'function') applyTheme(state.settings.theme);
      if (typeof applyBrandFromSettings === 'function') applyBrandFromSettings();
      try { if (window.MODO_JUEGO && MODO_JUEGO.invalidar) MODO_JUEGO.invalidar(); } catch (e) {}
      renderAll();
    }
    renderCloudStatus();
    return { ok: true, applied };
  } catch (e) {
    renderCloudStatus('ERROR AL BAJAR: ' + e.message);
    return { ok: false, msg: e.message };
  } finally {
    busy = false;
    if (dirty.size && state.settings.cloudAutoSync) schedule();
  }
}

function schedule() {
  if (!cloudConfigured() || !state.settings.cloudAutoSync) return;
  clearTimeout(pushTimer);
  pushTimer = setTimeout(() => push(), PUSH_DELAY);
}

/* ---------- ganchos que llama el núcleo ---------- */
window.scheduleCloudSync = function () { dirty.add('core'); persistDirty(); schedule(); };

window.cloudSyncNow = async function () {
  if (!cloudConfigured()) { showToast('CONFIGURA LA NUBE PRIMERO'); return; }
  showToast('SINCRONIZANDO...');
  const p = await pull();
  if (!p.ok) { showToast('FALLÓ LA SINCRONIZACIÓN'); return; }
  const u = await push();
  showToast(u.ok ? (p.applied ? 'DATOS ACTUALIZADOS Y SINCRONIZADOS' : 'SINCRONIZADO') : 'FALLÓ AL SUBIR');
};

window.cloudTestAndSave = async function () {
  let gistId = document.getElementById('setCloudBin').value.trim();
  const token = document.getElementById('setCloudKey').value.trim();
  if (!token) { showToast('FALTA EL TOKEN DE GITHUB'); return; }
  if (looksLikeJsonbinKey(token)) { showToast('ESA ES UNA KEY DE JSONBIN, NO DE GITHUB'); return; }
  showToast('PROBANDO CONEXIÓN...');
  const prev = { id: state.settings.cloudBinId, key: state.settings.cloudApiKey };
  state.settings.cloudApiKey = token;
  try {
    if (!gistId) {
      const files = { 'core.json': { content: fileFor('core') } };
      moduleIds().forEach(id => { files[id + '.json'] = { content: fileFor(id) }; });
      const r = await fetch(API, { method: 'POST', headers: headers(),
        body: JSON.stringify({ description: 'Trackeador de hábitos V7 · datos (privado)', public: false, files }) });
      if (!r.ok) throw new Error('HTTP ' + r.status + (r.status === 401 ? ' (token inválido)' : r.status === 403 || r.status === 404 ? ' (al token le falta el permiso gist)' : ''));
      gistId = (await r.json()).id;
      document.getElementById('setCloudBin').value = gistId;
      state.settings.cloudBinId = gistId;
      dirty.clear(); persistDirty();
    } else {
      state.settings.cloudBinId = gistId;
      await getGist();          // prueba de lectura
    }
    state.settings.cloudAutoSync = true;
    const cAuto = document.getElementById('setCloudAuto'); if (cAuto) cAuto.checked = true;
    saveState(false);
    renderCloudStatus('CONEXIÓN OK · GIST ' + gistId.slice(0, 8) + '… · copia este ID al otro dispositivo');
    showToast('NUBE CONECTADA');
    pull();
  } catch (e) {
    state.settings.cloudBinId = prev.id; state.settings.cloudApiKey = prev.key;
    renderCloudStatus('ERROR: ' + e.message);
    showToast('CONEXIÓN FALLIDA');
  }
};

window.toggleCloudAutoSync = function () {
  state.settings.cloudAutoSync = document.getElementById('setCloudAuto').checked;
  saveState(false);
  renderCloudStatus();
  if (state.settings.cloudAutoSync && cloudConfigured()) cloudSyncNow();
};

function fmtSyncTime(ms) {
  if (!ms) return 'nunca';
  const min = Math.floor((Date.now() - ms) / 60000);
  if (min < 1) return 'recién';
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = new Date(ms);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}
window.renderCloudStatus = function (msg) {
  const stEl = document.getElementById('cloudStatusText');
  const dotEl = document.getElementById('cloudStatusDot');
  if (!stEl) return;
  if (msg) stEl.textContent = msg;
  else if (!cloudConfigured()) stEl.textContent = 'SIN CONFIGURAR — pega tu token de GitHub';
  else stEl.textContent = `CONECTADO · ${state.settings.cloudAutoSync ? 'AUTO ON' : 'AUTO OFF'} · ÚLTIMA SYNC: ${fmtSyncTime(state.settings.lastSyncAt)}${dirty.size ? ' · ' + dirty.size + ' PENDIENTE(S)' : ''}`;
  if (dotEl) dotEl.style.background = cloudConfigured() ? 'var(--success)' : 'var(--text-fade)';
};

/* ---------- importar una vez desde la V6 (JSONBin) ---------- */
async function importLegacyJsonbin() {
  const s = state.settings;
  if (!s.legacyJsonbinId || !s.legacyJsonbinKey) { showToast('NO HAY DATOS DE JSONBIN'); return; }
  showToast('BAJANDO DESDE JSONBIN...');
  try {
    let r = await fetch(`https://api.jsonbin.io/v3/b/${s.legacyJsonbinId}/latest`, { headers: { 'X-Master-Key': s.legacyJsonbinKey } });
    if (r.status === 401 || r.status === 403) r = await fetch(`https://api.jsonbin.io/v3/b/${s.legacyJsonbinId}/latest`, { headers: { 'X-Access-Key': s.legacyJsonbinKey } });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const rec = (await r.json()).record || {};
    state.completions = mergeCompletions(state.completions, rec.completions);
    const remoteMod = (rec._syncMeta && rec._syncMeta.modifiedAt) || 0;
    if (remoteMod > (state.dataModifiedAt || 0)) { applyCore(rec); if (typeof migrateTasksV3 === 'function') migrateTasksV3(); }
    saveState();
    renderAll();
    showToast('PROGRESO DE LA V6 IMPORTADO');
  } catch (e) { showToast('NO SE PUDO: ' + e.message); }
}

/* ---------- arranque ---------- */
function start() {
  if (started) return; started = true;
  migrateLegacySettings();
  App.on('change', () => renderCloudStatus());
  renderCloudStatus();
  if (cloudConfigured()) pull().then(r => { if (r && r.applied) showToast('PROGRESO ACTUALIZADO DESDE LA NUBE'); });
  document.addEventListener('visibilitychange', () => {
    if (!cloudConfigured()) return;
    if (document.hidden) { if (dirty.size) { clearTimeout(pushTimer); push({ keepalive: true }); } return; }
    const now = Date.now();
    if (now - lastPull > PULL_THROTTLE) { lastPull = now; pull(); }
  });
  window.addEventListener('online', () => { if (cloudConfigured()) cloudSyncNow(); });
  window.addEventListener('offline', () => renderCloudStatus('SIN CONEXIÓN — los cambios se suben al volver la red'));
}

window.Sync = {
  start, pull, push, importLegacyJsonbin,
  markDirty(id) { dirty.add(id); persistDirty(); schedule(); },
  pending: () => [...dirty]
};
})();
