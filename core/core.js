'use strict';

/* ============================================================
   ICON LIBRARY - SVG paths (stroked, currentColor)
   ============================================================ */
const ICONS = {
  water:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>',
  dumbbell:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="6.5" y1="6.5" x2="17.5" y2="17.5"/><path d="M3.5 9.5L5 8l3 3-1.5 1.5z"/><path d="M14.5 20.5L13 19l3-3 1.5 1.5z" transform="translate(3 -1)"/><line x1="2" y1="11" x2="4" y2="9"/><line x1="20" y1="15" x2="22" y2="13"/></svg>',
  book:       '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>',
  meditation: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="5" r="2.2"/><path d="M12 8v4"/><path d="M5 21c2-5 5-7 7-7s5 2 7 7"/><path d="M5 17c2 0 3 1 3 1"/><path d="M19 17c-2 0-3 1-3 1"/></svg>',
  apple:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 7c0-2 2-4 4-4 0 2-2 4-4 4z"/><path d="M8 8c-3 0-5 2-5 6 0 5 4 8 5 8 1 0 2-1 4-1s3 1 4 1c1 0 5-3 5-8 0-4-2-6-5-6-2 0-3 1-4 1S10 8 8 8z"/></svg>',
  moon:       '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
  notebook:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="3" width="14" height="18" rx="1"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></svg>',
  heart:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
  pill:       '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 8l8 8M10 4a4 4 0 1 1-4 6"/><rect x="2" y="2" width="20" height="20" rx="10" transform="rotate(45 12 12)"/></svg>',
  coffee:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 8h1a4 4 0 0 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4z"/><line x1="6" y1="2" x2="6" y2="5"/><line x1="10" y1="2" x2="10" y2="5"/><line x1="14" y1="2" x2="14" y2="5"/></svg>',
  music:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>',
  bike:       '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/></svg>',
  leaf:       '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 4 13c0-4 5-9 7-11 2 2 7 7 7 11a7 7 0 0 1-7 7z"/><path d="M12 4v16"/></svg>',
  target:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1" fill="currentColor"/></svg>',
  star:       '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
  zap:        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>'
};
const ICON_KEYS = Object.keys(ICONS);

/* ============================================================
   WEATHER ICONS by Open-Meteo code
   ============================================================ */
const WEATHER = {
  0:  { txt: 'Despejado',       svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4.5"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="6.34" y2="6.34"/><line x1="17.66" y1="17.66" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="6.34" y2="17.66"/><line x1="17.66" y1="6.34" x2="19.07" y2="4.93"/></svg>' },
  1:  { txt: 'Mayormente despejado', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="10" cy="10" r="4"/><path d="M16 14a4 4 0 0 1 0 8H8a5 5 0 0 1-1-9.9"/></svg>' },
  2:  { txt: 'Parcialmente nublado', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="10" cy="10" r="4"/><path d="M16 14a4 4 0 0 1 0 8H8a5 5 0 0 1-1-9.9"/></svg>' },
  3:  { txt: 'Nublado',         svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 10a5 5 0 1 1-5-7 6 6 0 0 1 6 5"/><path d="M16 14a4 4 0 1 1 0 8H6a5 5 0 1 1 2-9.6"/></svg>' },
  45: { txt: 'Niebla',           svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="8" x2="21" y2="8"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="16" x2="21" y2="16"/></svg>' },
  48: { txt: 'Niebla densa',     svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="8" x2="21" y2="8"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="16" x2="21" y2="16"/></svg>' },
  51: { txt: 'Llovizna',         svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16 13a4 4 0 1 1 0 8H6a5 5 0 1 1 2-9.6"/><line x1="8" y1="22" x2="8" y2="20"/><line x1="12" y1="22" x2="12" y2="20"/><line x1="16" y1="22" x2="16" y2="20"/></svg>' },
  61: { txt: 'Lluvia',           svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16 13a4 4 0 1 1 0 8H6a5 5 0 1 1 2-9.6"/><line x1="8" y1="22" x2="8" y2="20"/><line x1="12" y1="22" x2="12" y2="20"/><line x1="16" y1="22" x2="16" y2="20"/></svg>' },
  71: { txt: 'Nieve',            svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16 13a4 4 0 1 1 0 8H6a5 5 0 1 1 2-9.6"/><line x1="8" y1="22" x2="8" y2="20"/><line x1="12" y1="22" x2="12" y2="20"/><line x1="16" y1="22" x2="16" y2="20"/></svg>' },
  80: { txt: 'Chubascos',        svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16 13a4 4 0 1 1 0 8H6a5 5 0 1 1 2-9.6"/><line x1="8" y1="22" x2="8" y2="20"/><line x1="12" y1="22" x2="12" y2="20"/><line x1="16" y1="22" x2="16" y2="20"/></svg>' },
  95: { txt: 'Tormenta',         svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16 13a4 4 0 1 1 0 8H6a5 5 0 1 1 2-9.6"/><polyline points="11 14 9 18 13 18 11 22"/></svg>' }
};
function weatherFromCode(code) {
  // Aproximación: agrupar
  if (code === 0) return WEATHER[0];
  if (code === 1) return WEATHER[1];
  if (code === 2) return WEATHER[2];
  if (code === 3) return WEATHER[3];
  if (code === 45 || code === 48) return WEATHER[45];
  if (code >= 51 && code <= 57) return WEATHER[51];
  if (code >= 61 && code <= 67) return WEATHER[61];
  if (code >= 71 && code <= 77) return WEATHER[71];
  if (code >= 80 && code <= 82) return WEATHER[80];
  if (code >= 95) return WEATHER[95];
  return WEATHER[1];
}

/* ============================================================
   DEFAULTS
   ============================================================ */
const DEFAULTS = {
  version: 1,
  categories: [
    { id: 'salud',         name: 'SALUD',         color: '#00d4ff' },
    { id: 'mente',         name: 'MENTE',         color: '#4de4ff' },
    { id: 'productividad', name: 'PRODUCTIVIDAD', color: '#80edff' },
    { id: 'otros',         name: 'OTROS',         color: '#ffaa00' }
  ],
  habits: [
    { id: 'h1', name: 'Beber agua',      sub: '2L al día', icon: 'water',      category: 'salud' },
    { id: 'h2', name: 'Ejercicio',       sub: '30 min',    icon: 'dumbbell',   category: 'salud' },
    { id: 'h3', name: 'Meditación',      sub: '10 min',    icon: 'meditation', category: 'mente' },
    { id: 'h4', name: 'Leer',            sub: '20 min',    icon: 'book',       category: 'mente' },
    { id: 'h5', name: 'Comer saludable', sub: '',          icon: 'apple',      category: 'salud' },
    { id: 'h6', name: 'Dormir 7-8h',     sub: '',          icon: 'moon',       category: 'salud' },
    { id: 'h7', name: 'Escribir diario', sub: '5 min',     icon: 'notebook',   category: 'mente' }
  ],
  tasks: [],
  settings: {
    theme: 'hud-cyan',
    // V6.4 — defaults genéricos para uso público (vacío = no se muestra)
    city: '',
    latitude: null,
    longitude: null,
    motivationText: 'Pequeños pasos cada día construyen grandes cambios',
    // V4.5 — branding editable
    brandTitle: 'MIS HÁBITOS',
    brandSub: '',
    hebrewMark: '',
    advancedOpen: false,
    // V5 — tema visual ('futurista' | 'minimalista' | 'elegante' | 'pinki' | 'grafiti')
    theme: 'futurista',
    // V6 — sincronización en la nube (JSONBin)
    cloudBinId: '',
    cloudApiKey: '',
    cloudAutoSync: false,
    lastSyncAt: 0
  }
};

const THEME_LIST = ['futurista', 'minimalista', 'elegante', 'pinki', 'grafiti'];

/* ============================================================
   STATE & STORAGE
   ============================================================ */
const STORAGE_KEY = 'habitos-v7';
const LEGACY_STORAGE_KEY = 'habitos-explosivos-v6';

const state = {
  habits: [],
  completions: {},   // { habitId: { 'YYYY-MM-DD': true } }
  tasks: [],         // ACTIVAS (pendientes)
  archivedTasks: [], // V4: completadas visibles en el panel ARCHIVADAS
  taskLog: [],       // V4: log inmutable {eventId, taskId, text, completedAt}
  events: [],        // V4.4: eventos del calendario {id, text, date, time|null, allDay, createdAt}
  categories: [],
  settings: {},
  view: 'resumen',
  editingId: null,
  modalIcon: 'water',
  modalCategory: 'salud',
  calCursor: new Date(),
  // V3: controles de UI
  taskRange: 'week',   // 'week' | 'month' | 'year' — gráfico de tareas
  statsUnit: 'week',   // 'week' | 'month' | 'year' — pestaña Estadísticas
  // V4: UI archivadas + undo
  archivedOpen: true,
  undo: null,          // { taskId, timer, eventId }
  // V4.4: drawer del día seleccionado
  drawerDate: null,    // 'YYYY-MM-DD' o null
  // V6: timestamp del último cambio de datos (para sincronización)
  dataModifiedAt: 0,
  cloudBusy: false,    // evita sincronizaciones solapadas
  game: {}             // V1: capa de juego (Los encargos de Milo)
};

function uid() { return 'h' + Math.random().toString(36).slice(2, 10); }

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    if (raw) {
      const d = JSON.parse(raw);
      state.habits        = d.habits        || [];
      state.completions   = d.completions   || {};
      state.tasks         = d.tasks         || [];
      state.archivedTasks = d.archivedTasks || [];
      state.taskLog       = d.taskLog       || [];
      state.events        = d.events        || [];
      state.categories    = d.categories    || DEFAULTS.categories;
      state.settings      = Object.assign({}, DEFAULTS.settings, d.settings || {});
      state.dataModifiedAt= d.dataModifiedAt || 0;
      state.game          = d.game          || {};
    } else {
      seedDefaults();
      saveState();
    }
  } catch (e) {
    console.error('Error al cargar:', e);
    seedDefaults();
  }
}

// touchModified=true marca un cambio nuevo (actualiza timestamp + agenda sync).
// Se pasa false sólo cuando guardamos tras un pull de la nube (los datos no son "nuevos").
function saveState(touchModified = true) {
  if (touchModified) state.dataModifiedAt = Date.now();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      habits: state.habits,
      completions: state.completions,
      tasks: state.tasks,
      archivedTasks: state.archivedTasks,
      taskLog: state.taskLog,
      events: state.events,
      categories: state.categories,
      settings: state.settings,
      dataModifiedAt: state.dataModifiedAt,
      game: state.game
    }));
  } catch (e) {
    showToast('Error al guardar');
  }
  if (touchModified) scheduleCloudSync();
}

function seedDefaults() {
  state.habits        = JSON.parse(JSON.stringify(DEFAULTS.habits));
  state.completions   = {};
  state.tasks         = [];
  state.archivedTasks = [];
  state.taskLog       = [];
  state.events        = [];
  state.categories    = JSON.parse(JSON.stringify(DEFAULTS.categories));
  state.settings      = JSON.parse(JSON.stringify(DEFAULTS.settings));
  state.game          = {};
}

/* ============================================================
   DATE HELPERS
   ============================================================ */
const MESES = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];
const MESES_LARGO = ['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO','JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE'];
const DIAS_LETRA = ['L','M','M','J','V','S','D'];

function fmtDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function fmtClock(d) {
  return [d.getHours(), d.getMinutes(), d.getSeconds()].map(n => String(n).padStart(2,'0')).join(':');
}
function fmtHeaderDate(d) {
  return `${String(d.getDate()).padStart(2,'0')} ${MESES[d.getMonth()]} ${d.getFullYear()}`;
}
function startOfDay(d) { const x = new Date(d); x.setHours(0,0,0,0); return x; }
function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }

function getWeekDates(ref = new Date()) {
  const d = startOfDay(ref);
  const dow = d.getDay();
  const shift = dow === 0 ? -6 : 1 - dow;
  const monday = addDays(d, shift);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

/* ============================================================
   COMPLETION LOGIC
   ============================================================ */
function isDone(habitId, date) {
  const k = fmtDate(date);
  return !!(state.completions[habitId] && state.completions[habitId][k]);
}
function toggleDone(habitId, date) {
  const today = startOfDay(new Date());
  if (date.getTime() > today.getTime()) return;
  const k = fmtDate(date);
  if (!state.completions[habitId]) state.completions[habitId] = {};
  if (state.completions[habitId][k]) delete state.completions[habitId][k];
  else state.completions[habitId][k] = true;
  saveState();
  renderAll();
}

/* ============================================================
   STATS
   ============================================================ */
function streakOf(habitId) {
  const today = startOfDay(new Date());
  let cursor = today;
  let streak = 0;
  if (!isDone(habitId, cursor)) cursor = addDays(cursor, -1);
  while (isDone(habitId, cursor)) {
    streak++;
    cursor = addDays(cursor, -1);
    if (streak > 365 * 5) break;
  }
  return streak;
}
function maxStreakEver(habitId) {
  const dates = Object.keys(state.completions[habitId] || {}).sort();
  if (dates.length === 0) return 0;
  let max = 1, cur = 1;
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i-1]);
    const cu = new Date(dates[i]);
    const diff = (cu - prev) / 86400000;
    if (diff === 1) cur++;
    else cur = 1;
    if (cur > max) max = cur;
  }
  return max;
}
function totalCompletions(habitId) {
  return Object.keys(state.completions[habitId] || {}).length;
}
function completionRate(habitId, days = 30) {
  const today = startOfDay(new Date());
  let done = 0;
  for (let i = 0; i < days; i++) {
    if (isDone(habitId, addDays(today, -i))) done++;
  }
  return Math.round((done / days) * 100);
}

function todayCount() {
  const today = new Date();
  return state.habits.filter(h => isDone(h.id, today)).length;
}

function weekStats() {
  // hábitos completados esta semana hasta hoy
  const week = getWeekDates();
  const today = startOfDay(new Date());
  let done = 0, total = 0;
  for (const h of state.habits) {
    for (const d of week) {
      if (d.getTime() > today.getTime()) continue;
      total++;
      if (isDone(h.id, d)) done++;
    }
  }
  return { done, total, pct: total === 0 ? 0 : Math.round(100 * done / total) };
}

function maxStreakAll() {
  if (state.habits.length === 0) return { streak: 0, name: '—' };
  let best = { streak: 0, name: '—' };
  for (const h of state.habits) {
    const s = streakOf(h.id);
    if (s > best.streak) best = { streak: s, name: h.name };
  }
  return best;
}
function bestStreakEverAll() {
  if (state.habits.length === 0) return { streak: 0, name: '—' };
  let best = { streak: 0, name: '—' };
  for (const h of state.habits) {
    const s = maxStreakEver(h.id);
    if (s > best.streak) best = { streak: s, name: h.name };
  }
  return best;
}
function activeHabits() {
  // Hábitos con al menos 1 check en los últimos 7 días
  const today = startOfDay(new Date());
  return state.habits.filter(h => {
    for (let i = 0; i < 7; i++) {
      if (isDone(h.id, addDays(today, -i))) return true;
    }
    return false;
  }).length;
}

/* ============================================================
   ANIMATIONS
   ============================================================ */
function animateNumber(el, from, to, duration = 1200) {
  if (!el) return;
  const start = performance.now();
  function step(now) {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = Math.round(from + (to - from) * eased);
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}
function animateRing(id, pct) {
  const c = 2 * Math.PI * 42;
  const ring = document.getElementById(id);
  if (!ring) return;
  ring.setAttribute('stroke-dasharray', c.toFixed(2));
  // Forzar reflow para que la animación se vea siempre
  void ring.getBoundingClientRect();
  ring.setAttribute('stroke-dashoffset', (c * (1 - Math.max(0, Math.min(100, pct)) / 100)).toFixed(2));
}

/* ============================================================
   RENDER
   ============================================================ */
function renderAll() {
  renderHeader();
  renderKPIs();
  renderHabitsTable();
  renderManageGrid();
  renderStatsView();
  renderCalendar();
  renderTasks();
  renderTaskCounter();
  renderTaskChart();
  renderSettings();
  renderWeather();
  renderBarChart();
  renderDonut();
  renderBestStreak();
  renderMobileHabits(); // V6.2 — vista mobile de hábitos
  const mt = document.getElementById('motivationText');
  if (mt) mt.textContent = `"${state.settings.motivationText}"`;
}

function renderHeader() {
  const now = new Date();
  document.getElementById('dateDisplay').textContent = fmtHeaderDate(now);
  document.getElementById('clockDisplay').textContent = fmtClock(now);
}
function tickClock() {
  const now = new Date();
  document.getElementById('clockDisplay').textContent = fmtClock(now);
  document.getElementById('dateDisplay').textContent = fmtHeaderDate(now);
}

function renderKPIs() {
  const week = weekStats();
  const streakInfo = maxStreakAll();
  const bestEver = bestStreakEverAll();
  const active = activeHabits();

  document.getElementById('kpiCompletedTotal').textContent = week.total;
  animateNumber(document.getElementById('kpiCompletedNum'), 0, week.done, 1200);
  document.getElementById('kpiCompletedPct').textContent = week.pct;
  animateRing('ring1', week.pct);

  animateNumber(document.getElementById('kpiStreakNum'), 0, streakInfo.streak, 1200);
  document.getElementById('kpiBestStreak').textContent = bestEver.streak;
  animateRing('ring2', Math.min(100, (streakInfo.streak / Math.max(30, bestEver.streak)) * 100));

  animateNumber(document.getElementById('kpiSuccessNum'), 0, week.pct, 1200);
  animateRing('ring3', week.pct);

  animateNumber(document.getElementById('kpiActiveNum'), 0, active, 1200);
  animateRing('ring4', Math.min(100, (active / 10) * 100));
}

function renderHabitsTable() {
  const body = document.getElementById('habitsTableBody');
  body.innerHTML = '';
  if (state.habits.length === 0) {
    body.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:40px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.18em;">— SIN HÁBITOS — <span class="kpi-add" onclick="openHabitModal()">+ AÑADIR</span></td></tr>`;
    return;
  }
  const week = getWeekDates();
  const today = startOfDay(new Date());
  for (const h of state.habits) {
    const tr = document.createElement('tr');
    let cells = `
      <td>
        <div class="habit-info">
          <div class="habit-icon-box">${ICONS[h.icon] || ICONS.target}</div>
          <div>
            <div class="habit-name">${escapeHtml(h.name)}</div>
            ${h.sub ? `<div class="habit-sub">${escapeHtml(h.sub)}</div>` : ''}
          </div>
        </div>
      </td>`;
    for (const d of week) {
      const future = d.getTime() > today.getTime();
      const todayCls = d.getTime() === today.getTime() ? ' today' : '';
      const doneCls = isDone(h.id, d) ? ' done' : '';
      cells += `<td class="day-cell">
        <button class="check-orb${doneCls}${todayCls}" ${future ? 'disabled' : ''} onclick="toggleDone('${h.id}', new Date(${d.getFullYear()}, ${d.getMonth()}, ${d.getDate()}))">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </button>
      </td>`;
    }
    cells += `<td><div class="streak-val">${streakOf(h.id)}</div></td>`;
    tr.innerHTML = cells;
    body.appendChild(tr);
  }
}

function renderManageGrid() {
  const grid = document.getElementById('manageGrid');
  grid.innerHTML = '';
  for (const h of state.habits) {
    const cat = state.categories.find(c => c.id === h.category) || state.categories[0];
    const card = document.createElement('div');
    card.className = 'manage-card';
    card.innerHTML = `
      <div class="habit-icon-box">${ICONS[h.icon] || ICONS.target}</div>
      <div class="info">
        <div class="habit-name">${escapeHtml(h.name)}</div>
        <div class="habit-sub">${cat ? cat.name : ''}${h.sub ? ' · ' + escapeHtml(h.sub) : ''}</div>
      </div>
      <div class="manage-actions">
        <button class="icon-btn" onclick="openHabitModal('${h.id}')" title="Editar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>
        </button>
        <button class="icon-btn danger" onclick="deleteHabit('${h.id}')" title="Eliminar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </button>
      </div>`;
    grid.appendChild(card);
  }
  const newCard = document.createElement('div');
  newCard.className = 'new-habit-card';
  newCard.onclick = () => openHabitModal();
  newCard.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
    NUEVO HÁBITO`;
  grid.appendChild(newCard);
}

function completionsInLastDays(habitId, days) {
  const today = startOfDay(new Date());
  let done = 0;
  for (let i = 0; i < days; i++) {
    if (isDone(habitId, addDays(today, -i))) done++;
  }
  return done;
}

function statsUnitMeta() {
  // Devuelve días, etiquetas según la unidad
  switch (state.statsUnit) {
    case 'month': return { days: 30,  rateLbl: 'TASA · MES',    countLbl: 'COMPL. · MES',    spanLbl: 'ÚLTIMOS 30 DÍAS',  heatLbl: 'HISTORIAL · 30 DÍAS' };
    case 'year':  return { days: 365, rateLbl: 'TASA · AÑO',    countLbl: 'COMPL. · AÑO',    spanLbl: 'ÚLTIMOS 365 DÍAS', heatLbl: 'HISTORIAL · 365 DÍAS' };
    default:      return { days: 7,   rateLbl: 'TASA · SEMANA', countLbl: 'COMPL. · SEMANA', spanLbl: 'ÚLTIMOS 7 DÍAS',   heatLbl: 'HISTORIAL · 7 DÍAS' };
  }
}

function renderStatsView() {
  const wrap = document.getElementById('statsContainer');
  if (state.habits.length === 0) {
    wrap.innerHTML = `<div class="empty">— CREA HÁBITOS PARA VER ESTADÍSTICAS —</div>`;
    return;
  }
  const meta = statsUnitMeta();
  wrap.innerHTML = '';
  const grid = document.createElement('div');
  grid.className = 'stats-grid';
  for (const h of state.habits) {
    const card = document.createElement('div');
    card.className = 'stats-card full';
    const rate = completionRate(h.id, meta.days);
    const count = completionsInLastDays(h.id, meta.days);
    card.innerHTML = `
      <div style="display:flex; align-items:center; gap:14px; margin-bottom:14px;">
        <div class="habit-icon-box">${ICONS[h.icon] || ICONS.target}</div>
        <div>
          <div class="stats-title" style="margin:0">${escapeHtml(h.name).toUpperCase()}</div>
          ${h.sub ? `<div class="habit-sub">${escapeHtml(h.sub)}</div>` : ''}
        </div>
        <div style="margin-left:auto; font-family: var(--font-mono); font-size:10px; letter-spacing:0.2em; color: var(--text-dim);">${meta.spanLbl}</div>
      </div>
      <div class="per-habit-stats">
        <div class="mini-stat"><div class="lbl">RACHA ACTUAL</div><div class="val">${streakOf(h.id)}</div></div>
        <div class="mini-stat"><div class="lbl">MEJOR RACHA</div><div class="val">${maxStreakEver(h.id)}</div></div>
        <div class="mini-stat"><div class="lbl">${meta.rateLbl}</div><div class="val">${rate}%</div></div>
        <div class="mini-stat"><div class="lbl">${meta.countLbl}</div><div class="val">${count}</div></div>
        <div class="mini-stat"><div class="lbl">TOTAL HISTÓRICO</div><div class="val">${totalCompletions(h.id)}</div></div>
      </div>
      <div class="card-label">${meta.heatLbl}</div>
      <div class="heatmap-wrap">${renderHeatmap(h.id, meta.days)}</div>
      <div class="heat-legend">
        MENOS
        <span class="heat-cell"></span>
        <span class="heat-cell l1"></span>
        <span class="heat-cell l2"></span>
        <span class="heat-cell l3"></span>
        <span class="heat-cell l4"></span>
        MÁS
      </div>
    `;
    grid.appendChild(card);
  }
  wrap.appendChild(grid);

  // V4.1: chart global de % promedio al final
  const globalCard = document.createElement('div');
  globalCard.className = 'stats-card full global-rate-card';
  globalCard.innerHTML = `
    <div class="stats-title" style="display:flex; align-items:center; gap:10px;">
      <span>% CUMPLIMIENTO PROMEDIO · TODOS LOS HÁBITOS</span>
      <span style="margin-left:auto; font-family: var(--font-mono); font-size:10px; letter-spacing:0.2em; color: var(--text-dim);">${meta.spanLbl}</span>
    </div>
    <div class="task-chart-svg-wrap" id="globalRateChartWrap"></div>
  `;
  wrap.appendChild(globalCard);
  renderGlobalRateChart();
}

function renderHeatmap(habitId, days = 365) {
  const today = startOfDay(new Date());

  // V4.2 — semanal y mensual: una sola fila horizontal, sin alineamiento por día de semana
  if (days <= 31) {
    const cells = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = addDays(today, -i);
      const done = isDone(habitId, d);
      cells.push(`<div class="heat-cell ${done ? 'l4' : ''}" title="${fmtDate(d)}"></div>`);
    }
    return `<div class="heatmap-grid row">${cells.join('')}</div>`;
  }

  // Anual: comportamiento original (grid 7 filas × N columnas, alineado por lunes)
  const end = today;
  const start = addDays(end, -(days - 1));
  const startDow = start.getDay();
  const shiftStart = startDow === 0 ? -6 : 1 - startDow;
  const gridStart = addDays(start, shiftStart);
  const cells = [];
  let cursor = new Date(gridStart);
  while (cursor.getTime() <= end.getTime() + 6 * 86400000) {
    const future = cursor.getTime() > today.getTime();
    const beforeRange = cursor.getTime() < start.getTime();
    if (future || beforeRange) {
      cells.push('<div class="heat-cell future"></div>');
    } else {
      const done = isDone(habitId, cursor);
      cells.push(`<div class="heat-cell ${done ? 'l4' : ''}" title="${fmtDate(cursor)}"></div>`);
    }
    cursor = addDays(cursor, 1);
  }
  return `<div class="heatmap-grid">${cells.join('')}</div>`;
}

/* ============================================================
   V4.1 — Chart global: % promedio cumplimiento de TODOS los hábitos
   ============================================================ */
function avgHabitsRateOnDate(date) {
  if (state.habits.length === 0) return 0;
  let done = 0;
  for (const h of state.habits) if (isDone(h.id, date)) done++;
  return Math.round((done / state.habits.length) * 100);
}

function buildGlobalRateSeries(days) {
  const today = startOfDay(new Date());
  const arr = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = addDays(today, -i);
    arr.push({
      label: `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`,
      shortLabel: String(d.getDate()).padStart(2, '0'),
      value: avgHabitsRateOnDate(d),
      isToday: d.getTime() === today.getTime()
    });
  }
  return arr;
}

function renderGlobalRateChart() {
  const wrap = document.getElementById('globalRateChartWrap');
  if (!wrap) return;
  const meta = statsUnitMeta();
  const series = buildGlobalRateSeries(meta.days);
  const n = series.length;

  if (state.habits.length === 0 || n === 0) {
    wrap.innerHTML = `<div class="task-chart-empty">— SIN HÁBITOS REGISTRADOS —</div>`;
    return;
  }

  // Eje Y fijo 0–100%
  const maxV = 100;
  const W = 900;
  const H = 220;
  const pad = { top: 14, right: 18, bottom: 28, left: 36 };
  const innerW = W - pad.left - pad.right;
  const innerH = H - pad.top - pad.bottom;
  const stepX = n > 1 ? innerW / (n - 1) : 0;

  const ticks = [0, 25, 50, 75, 100];

  function xAt(i) { return pad.left + i * stepX; }
  function yAt(v) { return pad.top + innerH - (v / maxV) * innerH; }

  let linePath = '';
  for (let i = 0; i < n; i++) {
    const x = xAt(i);
    const y = yAt(series[i].value);
    linePath += (i === 0 ? `M ${x.toFixed(2)} ${y.toFixed(2)}` : ` L ${x.toFixed(2)} ${y.toFixed(2)}`);
  }
  const areaPath = n > 0 ? linePath + ` L ${xAt(n - 1).toFixed(2)} ${(pad.top + innerH).toFixed(2)} L ${xAt(0).toFixed(2)} ${(pad.top + innerH).toFixed(2)} Z` : '';

  let labelEvery = 1;
  if (n <= 7)        labelEvery = 1;
  else if (n <= 30)  labelEvery = 3;
  else if (n <= 100) labelEvery = 14;
  else               labelEvery = 30;

  const dotsHtml = (n <= 31) ? series.map((p, i) => {
    return `<circle class="dot${p.isToday ? ' today' : ''}" cx="${xAt(i).toFixed(2)}" cy="${yAt(p.value).toFixed(2)}" r="3.5"><title>${p.label}: ${p.value}%</title></circle>`;
  }).join('') : '';

  const xLabelsHtml = series.map((p, i) => {
    if (i % labelEvery !== 0 && i !== n - 1) return '';
    return `<text class="axis-label" x="${xAt(i).toFixed(2)}" y="${(H - 8).toFixed(2)}" text-anchor="middle">${n > 31 ? p.label : p.shortLabel}</text>`;
  }).join('');

  const yLabelsHtml = ticks.map(v => {
    const y = yAt(v);
    return `
      <line class="grid-line" x1="${pad.left}" x2="${W - pad.right}" y1="${y.toFixed(2)}" y2="${y.toFixed(2)}"/>
      <text class="axis-label" x="${pad.left - 6}" y="${(y + 3).toFixed(2)}" text-anchor="end">${v}%</text>
    `;
  }).join('');

  wrap.innerHTML = `
    <svg class="task-chart-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
      <defs>
        <linearGradient id="globalRateGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stop-color="rgba(0, 212, 255, 0.35)"/>
          <stop offset="100%" stop-color="rgba(0, 212, 255, 0)"/>
        </linearGradient>
      </defs>
      ${yLabelsHtml}
      <line class="axis-line" x1="${pad.left}" x2="${W - pad.right}" y1="${(pad.top + innerH).toFixed(2)}" y2="${(pad.top + innerH).toFixed(2)}"/>
      <path d="${areaPath}" fill="url(#globalRateGradient)" opacity="0.7"/>
      <path class="line-path" d="${linePath}"/>
      ${dotsHtml}
      ${xLabelsHtml}
    </svg>
  `;
}

function renderCalendar() {
  const ref = state.calCursor;
  const year = ref.getFullYear();
  const month = ref.getMonth();
  document.getElementById('calMonthLabel').textContent = `${MESES_LARGO[month]} ${year}`;
  const grid = document.getElementById('calGrid');
  grid.innerHTML = '';
  // Header days
  for (const d of ['L','M','M','J','V','S','D']) {
    grid.insertAdjacentHTML('beforeend', `<div class="cal-day-head">${d}</div>`);
  }
  // First day of month, Monday-based
  const firstDay = new Date(year, month, 1);
  let firstDow = firstDay.getDay();
  firstDow = firstDow === 0 ? 6 : firstDow - 1;
  for (let i = 0; i < firstDow; i++) {
    grid.insertAdjacentHTML('beforeend', '<div class="cal-cell empty"></div>');
  }
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = startOfDay(new Date());
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month, day);
    const future = d.getTime() > today.getTime();
    const isToday = d.getTime() === today.getTime();
    const dateKey = fmtDate(d);
    let done = 0;
    for (const h of state.habits) if (isDone(h.id, d)) done++;
    const total = state.habits.length;
    const pct = total === 0 ? 0 : Math.round((done / total) * 100);

    // V4.4 — eventos del día
    const dayEvents = eventsOnDate(dateKey);
    const evCount = dayEvents.length;
    let dotsHtml = '';
    if (evCount > 0) {
      const dotsToShow = Math.min(3, evCount);
      let dots = '';
      for (let k = 0; k < dotsToShow; k++) dots += '<span class="cal-event-dot"></span>';
      const more = evCount > 3 ? `<span class="cal-event-more">+${evCount - 3}</span>` : '';
      dotsHtml = `<div class="cal-events">${dots}${more}</div>`;
    }

    grid.insertAdjacentHTML('beforeend', `
      <div class="cal-cell${isToday ? ' today' : ''}${future ? ' future' : ''}${evCount > 0 ? ' has-event' : ''}" data-date="${dateKey}" onclick="openDayDrawer('${dateKey}')">
        <div class="cal-num">${day}</div>
        ${future ? '' : `
          <div class="cal-bar"><div class="cal-bar-fill" style="width:${pct}%"></div></div>
          <div class="cal-pct">${done}/${total}</div>
        `}
        ${dotsHtml}
      </div>
    `);
  }
}
function changeCalMonth(delta) {
  state.calCursor = new Date(state.calCursor.getFullYear(), state.calCursor.getMonth() + delta, 1);
  renderCalendar();
}

/* ============================================================
   V4.4 — EVENTOS DEL CALENDARIO (separados de tareas)
   ============================================================ */
function eventsOnDate(dateKey) {
  return state.events
    .filter(e => e.date === dateKey)
    .sort((a, b) => {
      if (a.allDay && !b.allDay) return -1;
      if (!a.allDay && b.allDay) return 1;
      if (a.time && b.time) return a.time.localeCompare(b.time);
      return (a.createdAt || 0) - (b.createdAt || 0);
    });
}

function fmtEventDay(dateKey) {
  // Devuelve { dayName: 'MIÉRCOLES', dateBig: '20 FEB 2026' }
  const [y, m, d] = dateKey.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  const dayNames = ['DOMINGO','LUNES','MARTES','MIÉRCOLES','JUEVES','VIERNES','SÁBADO'];
  return {
    dayName: dayNames[dt.getDay()],
    dateBig: `${String(d).padStart(2, '0')} ${MESES[m - 1]} ${y}`
  };
}

/* --- MODAL NUEVO EVENTO --- */
let eventModalPrefilledDate = null;

function openEventModal(prefilledDate) {
  eventModalPrefilledDate = prefilledDate || null;
  const modal = document.getElementById('eventModal');
  const dateInput = document.getElementById('evDate');
  const textInput = document.getElementById('evText');
  const allDayInput = document.getElementById('evAllDay');
  const timeInput = document.getElementById('evTime');
  const timeGroup = document.getElementById('evTimeGroup');

  // Preset de fecha: la pasada, o hoy
  const seed = prefilledDate || fmtDate(new Date());
  dateInput.value = seed;
  textInput.value = '';
  allDayInput.checked = true;
  timeInput.value = '09:00';
  timeGroup.style.display = 'none';

  // toggle hora
  allDayInput.onchange = () => {
    timeGroup.style.display = allDayInput.checked ? 'none' : '';
  };

  modal.classList.add('show');
  setTimeout(() => textInput.focus(), 50);
}

function openEventModalForDate() {
  // Llamado desde el drawer
  openEventModal(state.drawerDate || fmtDate(new Date()));
}

function closeEventModal() {
  document.getElementById('eventModal').classList.remove('show');
  eventModalPrefilledDate = null;
}

function saveEventModal() {
  const text = document.getElementById('evText').value.trim();
  const date = document.getElementById('evDate').value;
  const allDay = document.getElementById('evAllDay').checked;
  const time = allDay ? null : document.getElementById('evTime').value;

  if (!text) { showToast('NECESITAS UN TEXTO'); return; }
  if (!date) { showToast('NECESITAS UNA FECHA'); return; }

  state.events.push({
    id: 'ev' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
    text,
    date,
    time,
    allDay,
    createdAt: Date.now()
  });
  saveState();
  closeEventModal();
  renderCalendar();
  // Si el drawer está abierto en ese día, refrescarlo
  if (state.drawerDate === date) renderDrawerEvents();
  showToast('EVENTO AGREGADO');
}

function deleteEvent(id) {
  state.events = state.events.filter(e => e.id !== id);
  saveState();
  renderCalendar();
  renderDrawerEvents();
  showToast('EVENTO ELIMINADO');
}

/* --- DRAWER DEL DÍA --- */
function openDayDrawer(dateKey) {
  state.drawerDate = dateKey;
  const drawer = document.getElementById('dayDrawer');
  const overlay = document.getElementById('drawerOverlay');
  const { dayName, dateBig } = fmtEventDay(dateKey);
  document.getElementById('drawerDayName').textContent = dayName;
  document.getElementById('drawerDateBig').textContent = dateBig;
  renderDrawerEvents();
  drawer.classList.add('show');
  drawer.setAttribute('aria-hidden', 'false');
  overlay.classList.add('show');
}

function closeDayDrawer() {
  state.drawerDate = null;
  document.getElementById('dayDrawer').classList.remove('show');
  document.getElementById('dayDrawer').setAttribute('aria-hidden', 'true');
  document.getElementById('drawerOverlay').classList.remove('show');
}

function renderDrawerEvents() {
  const list = document.getElementById('drawerEventsList');
  const countEl = document.getElementById('drawerEventCount');
  if (!list || !state.drawerDate) return;
  const events = eventsOnDate(state.drawerDate);
  countEl.textContent = events.length;
  list.innerHTML = '';
  if (events.length === 0) {
    list.innerHTML = `<div class="drawer-empty">— SIN EVENTOS EN ESTE DÍA —</div>`;
    return;
  }
  for (const ev of events) {
    const timeStr = ev.allDay ? 'TODO DÍA' : (ev.time || '--:--');
    const timeCls = ev.allDay ? 'ev-time allday' : 'ev-time';
    const div = document.createElement('div');
    div.className = 'drawer-event';
    div.innerHTML = `
      <div class="${timeCls}">${timeStr}</div>
      <div class="ev-text">${escapeHtml(ev.text)}</div>
      <button class="ev-del" onclick="deleteEvent('${ev.id}')" title="Eliminar evento">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="6" y1="18" x2="18" y2="6"/></svg>
      </button>`;
    list.appendChild(div);
  }
}

/* ============================================================
   V4 — TAREAS (modelo: tasks activas, archivedTasks visibles, taskLog inmutable)
   V6.3 — añadida prioridad (urgent | important | trivial)
   ============================================================ */

/* Orden de prioridad y labels (V6.3) */
const PRI_ORDER = { urgent: 0, important: 1, trivial: 2 };
const PRI_LABEL = { urgent: 'URGENTE', important: 'IMPORTANTE', trivial: 'TRIVIAL' };
const PRI_DEFAULT = 'urgent';

/* Estado UI de la prioridad seleccionada en el form (no se persiste) */
let selectedTaskPriority = PRI_DEFAULT;

function selectTaskPriority(pri) {
  if (!PRI_ORDER.hasOwnProperty(pri)) return;
  selectedTaskPriority = pri;
  const picker = document.getElementById('taskPriorityPicker');
  if (!picker) return;
  for (const btn of picker.querySelectorAll('.priority-pill')) {
    btn.classList.toggle('active', btn.dataset.pri === pri);
  }
}

function resetTaskPriorityPicker() {
  selectTaskPriority(PRI_DEFAULT);
}

function renderTasks() {
  renderActiveTasks();
  renderArchivedTasks();
}

function renderActiveTasks() {
  const list = document.getElementById('taskList');
  if (!list) return;
  list.innerHTML = '';
  if (state.tasks.length === 0) {
    list.innerHTML = `<div class="empty">— SIN TAREAS PENDIENTES —</div>`;
    return;
  }
  // V6.3 — ordenar por prioridad (urgent → important → trivial),
  // dentro del mismo grupo mantener orden de inserción (más nuevas arriba).
  const sorted = [...state.tasks].sort((a, b) => {
    const pa = PRI_ORDER[a.priority] ?? PRI_ORDER.trivial;
    const pb = PRI_ORDER[b.priority] ?? PRI_ORDER.trivial;
    return pa - pb;
  });
  for (const t of sorted) {
    const pri = (t.priority && PRI_ORDER.hasOwnProperty(t.priority)) ? t.priority : 'trivial';
    const div = document.createElement('div');
    div.className = 'task-item pri-' + pri;
    div.dataset.id = t.id;
    div.innerHTML = `
      <button class="check-orb" onclick="completeTask('${t.id}')" title="Completar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
      </button>
      <div class="task-text">${escapeHtml(t.text)}</div>
      <span class="pri-badge ${pri}"><span class="pb-dot"></span>${PRI_LABEL[pri]}</span>
      <button class="icon-btn danger" onclick="deleteTask('${t.id}')" title="Eliminar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="6" y1="18" x2="18" y2="6"/></svg>
      </button>`;
    list.appendChild(div);
  }
}

function renderArchivedTasks() {
  const panel = document.getElementById('archivedPanel');
  const list = document.getElementById('archivedList');
  const countEl = document.getElementById('archivedCount');
  const clearBtn = document.getElementById('clearArchivedBtn');
  if (!panel || !list || !countEl) return;

  const items = [...state.archivedTasks].sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));
  countEl.textContent = items.length;
  clearBtn.style.display = items.length === 0 ? 'none' : '';

  // estado collapsable
  panel.classList.toggle('collapsed', !state.archivedOpen);

  list.innerHTML = '';
  if (items.length === 0) {
    list.innerHTML = `<div class="empty small">— SIN TAREAS ARCHIVADAS —</div>`;
    return;
  }
  for (const t of items) {
    const div = document.createElement('div');
    div.className = 'task-item archived';
    div.innerHTML = `
      <span class="archived-check" title="Completada">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
      </span>
      <div class="task-text strike">${escapeHtml(t.text)}</div>
      <div class="archived-time">${fmtArchivedTime(t.completedAt)}</div>
      <button class="icon-btn" onclick="reopenTask('${t.id}')" title="Reabrir tarea">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7"/><polyline points="3 3 3 9 9 9"/></svg>
      </button>`;
    list.appendChild(div);
  }
}

function fmtArchivedTime(ms) {
  if (!ms) return '';
  const d = new Date(ms);
  const today = startOfDay(new Date()).getTime();
  const that = startOfDay(d).getTime();
  const diffDays = Math.round((today - that) / 86400000);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  if (diffDays === 0) return `HOY ${hh}:${mm}`;
  if (diffDays === 1) return `AYER ${hh}:${mm}`;
  if (diffDays < 7) {
    const dia = ['DOM','LUN','MAR','MIE','JUE','VIE','SAB'][d.getDay()];
    return `${dia} ${hh}:${mm}`;
  }
  return `${String(d.getDate()).padStart(2,'0')} ${MESES[d.getMonth()]} ${hh}:${mm}`;
}

function toggleArchivedPanel() {
  state.archivedOpen = !state.archivedOpen;
  renderArchivedTasks();
}

function addTask() {
  const input = document.getElementById('taskInput');
  const v = input.value.trim();
  if (!v) return;
  const pri = (selectedTaskPriority && PRI_ORDER.hasOwnProperty(selectedTaskPriority))
    ? selectedTaskPriority
    : PRI_DEFAULT;
  state.tasks.unshift({
    id: 't' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
    text: v,
    priority: pri,
    createdAt: Date.now()
  });
  input.value = '';
  resetTaskPriorityPicker();
  saveState();
  renderTasks();
  renderTaskCounter();
  renderTaskChart();
  showToast('TAREA AÑADIDA');
}

function completeTask(id) {
  const idx = state.tasks.findIndex(x => x.id === id);
  if (idx === -1) return;
  const t = state.tasks[idx];

  // 1) Animación fade
  const row = document.querySelector(`#taskList .task-item[data-id="${id}"]`);
  if (row) row.classList.add('completing');

  const now = Date.now();
  const eventId = 'e' + now.toString(36) + Math.random().toString(36).slice(2, 6);

  // 2) Log inmutable
  state.taskLog.push({ eventId, taskId: t.id, text: t.text, completedAt: now });

  // 3) Mover a archivadas (V6.3 — preserva priority)
  state.archivedTasks.unshift({ id: t.id, text: t.text, priority: t.priority || 'trivial', createdAt: t.createdAt, completedAt: now });
  state.tasks.splice(idx, 1);
  saveState();

  // 4) Esperar a que termine la animación antes de re-render
  setTimeout(() => {
    renderActiveTasks();
    renderArchivedTasks();
    renderTaskCounter();
    renderTaskChart();
  }, 320);

  // 5) Toast con DESHACER (5s)
  showUndoToast('TAREA COMPLETADA', () => undoComplete(eventId));
}

function undoComplete(eventId) {
  const ev = state.taskLog.find(e => e.eventId === eventId);
  if (!ev) return;
  // Quitar evento del log
  state.taskLog = state.taskLog.filter(e => e.eventId !== eventId);
  // Sacar de archivedTasks (la más reciente que coincida)
  const archIdx = state.archivedTasks.findIndex(t => t.id === ev.taskId && t.completedAt === ev.completedAt);
  let restored;
  if (archIdx !== -1) {
    restored = state.archivedTasks[archIdx];
    state.archivedTasks.splice(archIdx, 1);
  }
  // Volver a tareas activas (V6.3 — preserva priority)
  state.tasks.unshift({
    id: (restored && restored.id) || ev.taskId,
    text: ev.text,
    priority: (restored && restored.priority) || 'trivial',
    createdAt: (restored && restored.createdAt) || ev.completedAt
  });
  saveState();
  renderTasks();
  renderTaskCounter();
  renderTaskChart();
  showToast('TAREA RESTAURADA');
}

function reopenTask(id) {
  // Saca la archivada y elimina su último evento del log (no se cuenta como realizada)
  const archIdx = state.archivedTasks.findIndex(t => t.id === id);
  if (archIdx === -1) return;
  const t = state.archivedTasks[archIdx];
  // Quitar el evento más reciente para este taskId
  for (let i = state.taskLog.length - 1; i >= 0; i--) {
    if (state.taskLog[i].taskId === id) {
      state.taskLog.splice(i, 1);
      break;
    }
  }
  state.archivedTasks.splice(archIdx, 1);
  state.tasks.unshift({ id: t.id, text: t.text, priority: t.priority || 'trivial', createdAt: t.createdAt });
  saveState();
  renderTasks();
  renderTaskCounter();
  renderTaskChart();
  showToast('TAREA REABIERTA');
}

function clearArchived() {
  if (state.archivedTasks.length === 0) return;
  if (!confirm('¿Vaciar tareas archivadas? Las métricas se conservan (el log queda intacto).')) return;
  state.archivedTasks = [];
  saveState();
  renderArchivedTasks();
  showToast('ARCHIVADAS VACIADAS');
}

function deleteTask(id) {
  // Sólo elimina de pendientes — no toca el log
  state.tasks = state.tasks.filter(x => x.id !== id);
  saveState();
  renderActiveTasks();
  renderTaskCounter();
  renderTaskChart();
}

/* ============================================================
   V4 — TASK COUNTER + LINE CHART (fuente: taskLog inmutable)
   ============================================================ */
function weekRangeMs(ref = new Date()) {
  const week = getWeekDates(ref);
  const start = startOfDay(week[0]).getTime();
  const end = startOfDay(week[6]).getTime() + 86400000 - 1;
  return { start, end };
}

function tasksDoneInRange(start, end) {
  return state.taskLog.filter(e => e.completedAt >= start && e.completedAt <= end).length;
}

function renderTaskCounter() {
  const { start, end } = weekRangeMs();
  const done = tasksDoneInRange(start, end);
  // "No realizadas" = tareas pendientes actuales en el tablero (state.tasks ya sólo son activas)
  const pending = state.tasks.length;
  const totalConsidered = done + pending;
  const rate = totalConsidered === 0 ? 0 : Math.round((done / totalConsidered) * 100);

  const elDone = document.getElementById('tcDone');
  const elMiss = document.getElementById('tcMiss');
  const elRate = document.getElementById('tcRate');
  const elRateSub = document.getElementById('tcRateSub');
  if (!elDone) return;
  elDone.textContent = done;
  elMiss.textContent = pending;
  elRate.textContent = rate + '%';
  if (totalConsidered === 0) {
    elRateSub.textContent = 'SIN ACTIVIDAD';
  } else if (rate >= 80) {
    elRateSub.textContent = 'EXCELENTE';
  } else if (rate >= 50) {
    elRateSub.textContent = 'EN BUEN RITMO';
  } else {
    elRateSub.textContent = 'A RECUPERAR';
  }
}

function buildTaskChartSeries(range) {
  // Devuelve array de { label, value, isToday, dateKey }
  const today = startOfDay(new Date());
  if (range === 'week') {
    // 7 puntos, lunes a domingo de la semana actual
    const week = getWeekDates();
    return week.map((d, i) => {
      const dayStart = startOfDay(d).getTime();
      const dayEnd = dayStart + 86400000 - 1;
      return {
        label: DIAS_LETRA[i],
        value: tasksDoneInRange(dayStart, dayEnd),
        isToday: dayStart === today.getTime(),
        future: dayStart > today.getTime()
      };
    });
  }
  if (range === 'month') {
    // 30 puntos diarios, terminando hoy
    const arr = [];
    for (let i = 29; i >= 0; i--) {
      const d = addDays(today, -i);
      const dayStart = d.getTime();
      const dayEnd = dayStart + 86400000 - 1;
      arr.push({
        label: String(d.getDate()).padStart(2, '0'),
        value: tasksDoneInRange(dayStart, dayEnd),
        isToday: dayStart === today.getTime(),
        future: false
      });
    }
    return arr;
  }
  // year: 52 semanas, agregadas
  const arr = [];
  // Empezamos en el lunes de hace 51 semanas
  const thisMonday = getWeekDates()[0];
  for (let i = 51; i >= 0; i--) {
    const monday = addDays(startOfDay(thisMonday), -i * 7);
    const start = monday.getTime();
    const end = start + 7 * 86400000 - 1;
    arr.push({
      label: MESES[monday.getMonth()],
      value: tasksDoneInRange(start, end),
      isToday: false,
      future: false
    });
  }
  return arr;
}

function renderTaskChart() {
  const wrap = document.getElementById('taskChartWrap');
  if (!wrap) return;
  const range = state.taskRange;
  const series = buildTaskChartSeries(range);
  const maxV = Math.max(1, ...series.map(p => p.value));

  // Dimensiones del SVG (viewBox)
  const W = 900;
  const H = 220;
  const pad = { top: 14, right: 18, bottom: 28, left: 32 };
  const innerW = W - pad.left - pad.right;
  const innerH = H - pad.top - pad.bottom;
  const n = series.length;
  const stepX = n > 1 ? innerW / (n - 1) : 0;

  // Y ticks (0, mid, max)
  const ticks = [0, Math.round(maxV / 2), maxV];

  function xAt(i) { return pad.left + i * stepX; }
  function yAt(v) { return pad.top + innerH - (v / maxV) * innerH; }

  // Path
  let linePath = '';
  let areaPath = '';
  for (let i = 0; i < n; i++) {
    const x = xAt(i);
    const y = yAt(series[i].value);
    linePath += (i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`);
  }
  if (n > 0) {
    areaPath = linePath + ` L ${xAt(n - 1)} ${pad.top + innerH} L ${xAt(0)} ${pad.top + innerH} Z`;
  }

  // Etiquetas de X — decidir densidad
  let labelEvery = 1;
  if (range === 'month') labelEvery = 5;
  if (range === 'year') labelEvery = 4;

  // Dots — sólo si <= ~31 puntos para no saturar
  const dotsHtml = (n <= 31) ? series.map((p, i) => {
    return `<circle class="dot${p.isToday ? ' today' : ''}" cx="${xAt(i).toFixed(2)}" cy="${yAt(p.value).toFixed(2)}" r="3.5"><title>${p.label}: ${p.value} tarea(s)</title></circle>`;
  }).join('') : '';

  const xLabelsHtml = series.map((p, i) => {
    if (i % labelEvery !== 0 && i !== n - 1) return '';
    return `<text class="axis-label" x="${xAt(i).toFixed(2)}" y="${(H - 8).toFixed(2)}" text-anchor="middle">${p.label}</text>`;
  }).join('');

  const yLabelsHtml = ticks.map(v => {
    const y = yAt(v);
    return `
      <line class="grid-line" x1="${pad.left}" x2="${W - pad.right}" y1="${y.toFixed(2)}" y2="${y.toFixed(2)}"/>
      <text class="axis-label" x="${pad.left - 6}" y="${(y + 3).toFixed(2)}" text-anchor="end">${v}</text>
    `;
  }).join('');

  const totalDone = series.reduce((a, p) => a + p.value, 0);
  if (totalDone === 0) {
    wrap.innerHTML = `<div class="task-chart-empty">— SIN TAREAS COMPLETADAS EN ESTE RANGO —</div>`;
    return;
  }

  wrap.innerHTML = `
    <svg class="task-chart-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
      <defs>
        <linearGradient id="taskGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="rgba(0, 212, 255, 0.35)"/>
          <stop offset="100%" stop-color="rgba(0, 212, 255, 0)"/>
        </linearGradient>
      </defs>
      ${yLabelsHtml}
      <line class="axis-line" x1="${pad.left}" x2="${W - pad.right}" y1="${(pad.top + innerH).toFixed(2)}" y2="${(pad.top + innerH).toFixed(2)}"/>
      <path class="area-path" d="${areaPath}"/>
      <path class="line-path" d="${linePath}"/>
      ${dotsHtml}
      ${xLabelsHtml}
    </svg>
  `;
}

function renderSettings() {
  document.getElementById('setCity').value = state.settings.city || '';
  document.getElementById('setLat').value  = state.settings.latitude;
  document.getElementById('setLon').value  = state.settings.longitude;
  document.getElementById('setMotivation').value = state.settings.motivationText || '';

  // V4.5 — branding inputs
  const sBT = document.getElementById('setBrandTitle');
  const sBS = document.getElementById('setBrandSub');
  const sHM = document.getElementById('setHebrewMark');
  if (sBT) sBT.value = state.settings.brandTitle ?? 'MIS HÁBITOS';
  if (sBS) sBS.value = state.settings.brandSub ?? '';
  if (sHM) sHM.value = state.settings.hebrewMark ?? '';

  // V4.5 — acordeón estado abierto/cerrado
  const advWrap = document.getElementById('advancedSettings');
  const advRow = document.getElementById('advToggleRow');
  if (advWrap && advRow) {
    advWrap.classList.toggle('open', !!state.settings.advancedOpen);
    advRow.classList.toggle('open', !!state.settings.advancedOpen);
  }

  // V4.5 — editor de categorías
  renderCategoriesEditor();

  // V6 — sincronización en la nube
  const cBin = document.getElementById('setCloudBin');
  const cKey = document.getElementById('setCloudKey');
  const cAuto = document.getElementById('setCloudAuto');
  if (cBin)  cBin.value  = state.settings.cloudBinId || '';
  if (cKey)  cKey.value  = state.settings.cloudApiKey || '';
  if (cAuto) cAuto.checked = !!state.settings.cloudAutoSync;
  renderCloudStatus();
}
function saveCitySettings() {
  const city = document.getElementById('setCity').value.trim();
  const lat  = parseFloat(document.getElementById('setLat').value);
  const lon  = parseFloat(document.getElementById('setLon').value);
  if (!city) { showToast('INGRESA EL NOMBRE DE TU CIUDAD'); return; }
  if (isNaN(lat) || isNaN(lon)) { showToast('LATITUD/LONGITUD INVÁLIDA'); return; }
  state.settings.city = city;
  state.settings.latitude = lat;
  state.settings.longitude = lon;
  saveState();
  showToast('CIUDAD ACTUALIZADA');
  fetchWeather();
}
function saveMotivation() {
  const v = document.getElementById('setMotivation').value.trim();
  if (!v) return;
  state.settings.motivationText = v;
  saveState();
  document.getElementById('motivationText').textContent = `"${v}"`;
  showToast('FRASE ACTUALIZADA');
}

/* ============================================================
   V4.5 — AJUSTES AVANZADOS: branding + categorías
   ============================================================ */
function applyBrandFromSettings() {
  const title = state.settings.brandTitle || 'MIS HÁBITOS';
  const sub   = state.settings.brandSub   || '';
  const hebrew= state.settings.hebrewMark ?? '';

  const tEl = document.getElementById('brandTitleEl');
  const sEl = document.getElementById('brandSubEl');
  const hEl = document.getElementById('hebrewMarkEl');
  if (tEl) tEl.textContent = title;
  if (sEl) sEl.textContent = sub;
  if (hEl) {
    hEl.textContent = hebrew;
    hEl.style.display = hebrew.trim() === '' ? 'none' : '';
  }
  document.title = `${title} · ${sub}`;
}

/* ============================================================
   V5 — Sistema de TEMAS visuales
   ============================================================ */
function applyTheme(themeName) {
  const valid = THEME_LIST.includes(themeName) ? themeName : 'futurista';
  // Quitar todas las clases theme-*
  for (const t of THEME_LIST) document.body.classList.remove('theme-' + t);
  document.body.classList.add('theme-' + valid);
  state.settings.theme = valid;

  // Actualizar tarjetas del picker
  document.querySelectorAll('#themePicker .theme-card').forEach(c => {
    c.classList.toggle('active', c.dataset.theme === valid);
  });
}

function wireThemePicker() {
  const picker = document.getElementById('themePicker');
  if (!picker) return;
  picker.addEventListener('click', e => {
    const card = e.target.closest('.theme-card');
    if (!card) return;
    const theme = card.dataset.theme;
    applyTheme(theme);
    saveState();
    showToast(`ESTILO: ${theme.toUpperCase()}`);
  });
}

/* Sincronización en la nube: ver core/sync.js (V7 · GitHub Gist) */

function toggleAdvancedSettings() {
  state.settings.advancedOpen = !state.settings.advancedOpen;
  saveState();
  document.getElementById('advancedSettings').classList.toggle('open', state.settings.advancedOpen);
  document.getElementById('advToggleRow').classList.toggle('open', state.settings.advancedOpen);
}

function saveBrandTitle() {
  const v = document.getElementById('setBrandTitle').value.trim();
  if (!v) {
    showToast('NECESITAS UN TÍTULO');
    document.getElementById('setBrandTitle').value = state.settings.brandTitle || 'MIS HÁBITOS';
    return;
  }
  state.settings.brandTitle = v;
  saveState();
  applyBrandFromSettings();
  showToast('TÍTULO ACTUALIZADO');
}
function saveBrandSub() {
  const v = document.getElementById('setBrandSub').value;
  state.settings.brandSub = v;
  saveState();
  applyBrandFromSettings();
  showToast('SUBTÍTULO ACTUALIZADO');
}
function saveHebrewMark() {
  const v = document.getElementById('setHebrewMark').value;
  state.settings.hebrewMark = v;
  saveState();
  applyBrandFromSettings();
  showToast(v.trim() === '' ? 'MARCA OCULTADA' : 'MARCA ACTUALIZADA');
}

/* --- Editor de categorías --- */
function renderCategoriesEditor() {
  const wrap = document.getElementById('catEditor');
  if (!wrap) return;
  wrap.innerHTML = '';
  for (const cat of state.categories) {
    const row = document.createElement('div');
    row.className = 'cat-row';
    row.innerHTML = `
      <label class="cat-swatch" style="background:${cat.color};box-shadow: 0 0 4px ${cat.color}">
        <input type="color" value="${cat.color}" data-cat-id="${cat.id}" data-field="color">
      </label>
      <input type="text" class="cat-name-input" value="${escapeHtml(cat.name)}" data-cat-id="${cat.id}" data-field="name">
    `;
    wrap.appendChild(row);
  }
  // Wire change listeners
  wrap.querySelectorAll('input[data-cat-id]').forEach(inp => {
    inp.addEventListener('change', e => {
      const id = e.target.dataset.catId;
      const field = e.target.dataset.field;
      const val = e.target.value;
      const cat = state.categories.find(c => c.id === id);
      if (!cat) return;
      if (field === 'name') {
        cat.name = (val || '').trim().toUpperCase() || cat.name;
      } else if (field === 'color') {
        cat.color = val;
      }
      saveState();
      // Re-render impactos visuales
      applyCategoryChanges();
      // Refresca el editor para el swatch
      renderCategoriesEditor();
      showToast('CATEGORÍA ACTUALIZADA');
    });
  });
}

function applyCategoryChanges() {
  // Lo que depende de categorías: donut + manage grid + tablas con sub category
  renderDonut();
  renderManageGrid();
  renderHabitsTable();
}

/* ============================================================
   SIDEBAR DERECHA: WEATHER + BAR + DONUT + BEST
   ============================================================ */
async function fetchWeather() {
  const { latitude, longitude } = state.settings;
  // V6.4 — si no hay ciudad configurada, no hacer fetch
  if (latitude == null || longitude == null || isNaN(latitude) || isNaN(longitude)) {
    const wDesc = document.getElementById('wDesc');
    const wTemp = document.getElementById('wTemp');
    if (wDesc) wDesc.textContent = 'Configura tu ciudad';
    if (wTemp) wTemp.textContent = '—';
    return;
  }
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,apparent_temperature,weather_code,is_day&timezone=auto`;
  try {
    const r = await fetch(url);
    if (!r.ok) throw new Error('fetch failed');
    const data = await r.json();
    const c = data.current;
    const w = weatherFromCode(c.weather_code);
    document.getElementById('wTemp').textContent = Math.round(c.temperature_2m);
    document.getElementById('wDesc').textContent = w.txt;
    document.getElementById('wHum').textContent = c.relative_humidity_2m + '%';
    document.getElementById('wWind').textContent = Math.round(c.wind_speed_10m) + ' km/h';
    document.getElementById('wFeel').textContent = Math.round(c.apparent_temperature) + '°C';
    document.getElementById('wIcon').innerHTML = w.svg;
  } catch (e) {
    document.getElementById('wDesc').textContent = 'Sin conexión';
    document.getElementById('wIcon').innerHTML = WEATHER[1].svg;
  }
}
function renderWeather() {
  // pre-render placeholder, datos llegan via fetchWeather
  document.getElementById('wIcon').innerHTML = WEATHER[0].svg;
}

function renderBarChart() {
  const chart = document.getElementById('barChart');
  chart.innerHTML = '';
  const week = getWeekDates();
  const today = startOfDay(new Date());
  const totalH = state.habits.length;
  for (let i = 0; i < 7; i++) {
    const d = week[i];
    let done = 0;
    if (totalH > 0) {
      for (const h of state.habits) if (isDone(h.id, d)) done++;
    }
    const pct = totalH === 0 ? 0 : Math.round((done / totalH) * 100);
    const future = d.getTime() > today.getTime();
    const col = document.createElement('div');
    col.className = 'bar-col';
    col.innerHTML = `
      <div class="bar-fill" style="height:0%${future ? '; opacity:0.3' : ''}" data-target="${pct}"></div>
      <div class="bar-label">${DIAS_LETRA[i]}</div>
    `;
    chart.appendChild(col);
  }
  // Animar
  setTimeout(() => {
    chart.querySelectorAll('.bar-fill').forEach(b => {
      const t = parseFloat(b.dataset.target) || 0;
      b.style.height = Math.max(2, t) + '%';
    });
  }, 50);
}

function renderDonut() {
  const svg = document.getElementById('donutSvg');
  const legend = document.getElementById('donutLegend');
  svg.innerHTML = '';
  legend.innerHTML = '';

  // Contar por categoría
  const counts = {};
  for (const c of state.categories) counts[c.id] = 0;
  for (const h of state.habits) {
    if (counts[h.category] !== undefined) counts[h.category]++;
    else counts.otros = (counts.otros || 0) + 1;
  }
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  // Si no hay hábitos, dibujar anillo vacío
  if (total === 0) {
    svg.innerHTML = `<circle cx="21" cy="21" r="15.9" fill="none" stroke="${getComputedStyle(document.documentElement).getPropertyValue('--cyan-line-soft')}" stroke-width="6"/>`;
    legend.innerHTML = `<div class="legend-item">SIN DATOS</div>`;
    return;
  }

  let offset = 25;
  for (const c of state.categories) {
    const count = counts[c.id] || 0;
    if (count === 0) continue;
    const pct = (count / total) * 100;
    const seg = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    seg.setAttribute('cx', 21);
    seg.setAttribute('cy', 21);
    seg.setAttribute('r', 15.9);
    seg.setAttribute('fill', 'none');
    seg.setAttribute('stroke', c.color);
    seg.setAttribute('stroke-width', 6);
    seg.setAttribute('stroke-dasharray', `${pct.toFixed(2)} ${(100 - pct).toFixed(2)}`);
    seg.setAttribute('stroke-dashoffset', offset);
    seg.style.filter = `drop-shadow(0 0 3px ${c.color})`;
    svg.appendChild(seg);
    offset = (offset - pct + 100) % 100;

    const item = document.createElement('div');
    item.className = 'legend-item';
    item.innerHTML = `<span class="swatch" style="background:${c.color};box-shadow:0 0 3px ${c.color}"></span> ${c.name} <span class="v">${Math.round(pct)}%</span>`;
    legend.appendChild(item);
  }
}

function renderBestStreak() {
  const b = bestStreakEverAll();
  animateNumber(document.getElementById('bestStreakNum'), 0, b.streak, 1200);
  document.getElementById('bestStreakName').textContent = (b.name || '—').toUpperCase();
}

/* ============================================================
   HABIT MODAL
   ============================================================ */
function openHabitModal(id = null) {
  state.editingId = id;
  const modal = document.getElementById('habitModal');
  const title = document.getElementById('modalTitle');
  const delBtn = document.getElementById('deleteBtn');
  // Llenar categorías
  const sel = document.getElementById('habitCategory');
  sel.innerHTML = state.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');

  if (id) {
    const h = state.habits.find(x => x.id === id);
    if (!h) return;
    title.textContent = 'EDITAR HÁBITO';
    document.getElementById('habitName').value = h.name;
    document.getElementById('habitSub').value = h.sub || '';
    sel.value = h.category;
    state.modalIcon = h.icon;
    state.modalCategory = h.category;
    delBtn.classList.remove('hidden');
  } else {
    title.textContent = 'NUEVO HÁBITO';
    document.getElementById('habitName').value = '';
    document.getElementById('habitSub').value = '';
    state.modalIcon = ICON_KEYS[Math.floor(Math.random() * ICON_KEYS.length)];
    state.modalCategory = state.categories[0].id;
    sel.value = state.modalCategory;
    delBtn.classList.add('hidden');
  }
  renderIconPicker();
  modal.classList.add('show');
  setTimeout(() => document.getElementById('habitName').focus(), 50);
}
function closeHabitModal() {
  document.getElementById('habitModal').classList.remove('show');
  state.editingId = null;
}
function renderIconPicker() {
  const wrap = document.getElementById('iconPicker');
  wrap.innerHTML = '';
  for (const key of ICON_KEYS) {
    const b = document.createElement('button');
    b.className = 'icon-option' + (key === state.modalIcon ? ' selected' : '');
    b.innerHTML = ICONS[key];
    b.onclick = () => { state.modalIcon = key; renderIconPicker(); };
    wrap.appendChild(b);
  }
}
function saveHabitModal() {
  const name = document.getElementById('habitName').value.trim();
  const sub = document.getElementById('habitSub').value.trim();
  const category = document.getElementById('habitCategory').value;
  if (!name) { showToast('NECESITAS UN NOMBRE'); return; }
  if (state.editingId) {
    const h = state.habits.find(x => x.id === state.editingId);
    if (h) { h.name = name; h.sub = sub; h.icon = state.modalIcon; h.category = category; }
    showToast('HÁBITO ACTUALIZADO');
  } else {
    state.habits.push({ id: uid(), name, sub, icon: state.modalIcon, category });
    showToast('HÁBITO CREADO');
  }
  saveState();
  closeHabitModal();
  renderAll();
}
function deleteFromModal() {
  if (!state.editingId) return;
  if (!confirm('¿Eliminar este hábito y todo su historial?')) return;
  deleteHabit(state.editingId);
  closeHabitModal();
}
function deleteHabit(id) {
  if (!confirm('¿Eliminar este hábito y todo su historial?')) return;
  state.habits = state.habits.filter(h => h.id !== id);
  delete state.completions[id];
  saveState();
  renderAll();
  showToast('HÁBITO ELIMINADO');
}

/* ============================================================
   IMPORT / EXPORT / RESET
   ============================================================ */
function exportData() {
  const blob = new Blob([JSON.stringify({
    habits: state.habits,
    completions: state.completions,
    tasks: state.tasks,
    archivedTasks: state.archivedTasks,
    taskLog: state.taskLog,
    events: state.events,
    categories: state.categories,
    settings: state.settings,
    // V8: el respaldo incluye las áreas (piel, gym, plata…) y el progreso de Milo
    modules: exportModules(),
    game: state.game || {},
    exportedAt: new Date().toISOString(),
    schemaVersion: 5
  }, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `habitos-${fmtDate(new Date())}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('RESPALDO DESCARGADO');
}
function exportModules() {
  const out = {};
  try { if (window.App) App.modules().forEach(m => { if (state[m.id]) out[m.id] = state[m.id]; }); } catch (e) { console.error(e); }
  return out;
}
// Reemplaza las áreas que vengan en el archivo; las que no vengan quedan como estaban.
function importModules(mods) {
  if (!mods || typeof mods !== 'object' || !window.App) return 0;
  let n = 0;
  App.modules().forEach(m => {
    if (!mods[m.id] || typeof mods[m.id] !== 'object') return;
    App.replaceModuleData(m.id, mods[m.id]);
    App.save(m.id, { noRender: true });       // marca el cambio para que suba a la nube
    n++;
  });
  return n;
}
function importData(evt) {
  const file = evt.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const d = JSON.parse(reader.result);
      if (!Array.isArray(d.habits)) throw new Error('Formato inválido');
      if (!confirm('¿Reemplazar tus datos actuales?')) return;
      state.habits        = d.habits;
      state.completions   = d.completions   || {};
      state.tasks         = d.tasks         || [];
      state.archivedTasks = d.archivedTasks || [];
      state.taskLog       = d.taskLog       || [];
      state.events        = d.events        || [];
      state.categories    = d.categories    || DEFAULTS.categories;
      state.settings      = Object.assign({}, DEFAULTS.settings, d.settings || {});
      if (d.game && typeof d.game === 'object') state.game = d.game;
      migrateTasksV3();
      const nMods = importModules(d.modules);
      saveState();
      try { if (window.MODO_JUEGO && MODO_JUEGO.invalidar) MODO_JUEGO.invalidar(); } catch (e) {}
      renderAll();
      if (window.App && App.refresh) App.refresh();
      fetchWeather();
      showToast(nMods ? 'DATOS IMPORTADOS (+' + nMods + ' ÁREAS)' : 'DATOS IMPORTADOS');
    } catch (e) {
      showToast('ARCHIVO INVÁLIDO');
    }
  };
  reader.readAsText(file);
  evt.target.value = '';
}
function resetData() {
  if (!confirm('¿BORRAR TODOS LOS DATOS? Esta acción no se puede deshacer.')) return;
  if (!confirm('Última confirmación: se eliminarán hábitos, historial y tareas.')) return;
  localStorage.removeItem(STORAGE_KEY);
  seedDefaults();
  saveState();
  renderAll();
  fetchWeather();
  showToast('DATOS RESTABLECIDOS');
}

/* ============================================================
   NAV / VIEW
   ============================================================ */
function isMobile() { return window.matchMedia('(max-width: 720px)').matches; }

function switchView(view) {
  // En mobile la vista "resumen" no existe → redirigir a habitos
  if (isMobile() && view === 'resumen') view = 'hoy';
  state.view = view;
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.view === view);
  });
  document.querySelectorAll('.bn-item').forEach(el => {
    // En "tareas" y "ajustes" se resalta MÁS en el bottom nav
    const v = el.dataset.view;
    const active = (v === view) || (v === 'mas' && (view === 'tareas' || view === 'ajustes' || view === 'mas'));
    el.classList.toggle('active', active);
  });
  document.querySelectorAll('main > section').forEach(sec => {
    sec.classList.toggle('hidden', sec.id !== 'view-' + view);
  });
  updateFabVisibility(view);
  // V7: barra inferior + render de vistas de módulos
  if (window.App) App.afterSwitch(view);
  // Scroll arriba al cambiar de vista en mobile
  if (isMobile()) window.scrollTo({ top: 0, behavior: 'instant' });
}
document.getElementById('nav').addEventListener('click', e => {
  const item = e.target.closest('.nav-item');
  if (item) switchView(item.dataset.view);
});

/* ============================================================
   V6.2 — FAB CONTEXTUAL
   ============================================================ */
function updateFabVisibility(view) {
  const fab = document.getElementById('fab');
  if (!fab) return;
  const showFor = ['habitos', 'calendario', 'tareas'];
  fab.classList.toggle('hidden', !showFor.includes(view));
}

function fabAction() {
  const v = state.view;
  if (v === 'habitos') openHabitModal();
  else if (v === 'calendario') openEventModal();
  else if (v === 'tareas') {
    // Foco en el input de nueva tarea
    const input = document.getElementById('newTaskInput') || document.getElementById('taskInput');
    if (input) { input.focus(); input.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
  }
}

/* ============================================================
   V6.2 — MOBILE HABITS VIEW (HOY · SEMANA · RESUMEN)
   ============================================================ */
let mobileDayOffset = 0; // 0 = hoy, -1 = ayer, -2 = antes de ayer, hasta -30

function shiftMobileDay(delta) {
  const next = mobileDayOffset + delta;
  // No permitir ir al futuro
  if (next > 0) return;
  // Limitar a 30 días atrás
  if (next < -30) return;
  mobileDayOffset = next;
  renderMobileHabits();
}

function resetMobileDay() {
  mobileDayOffset = 0;
  renderMobileHabits();
}

function getDayLabel(offset) {
  if (offset === 0) return 'HOY';
  if (offset === -1) return 'AYER';
  if (offset === -2) return 'ANTES DE AYER';
  // Más atrás: mostrar fecha
  const d = addDays(startOfDay(new Date()), offset);
  const days = ['DOM','LUN','MAR','MIÉ','JUE','VIE','SÁB'];
  return `${days[d.getDay()]} ${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`;
}

function renderMobileHabits() {
  const hoyEl = document.getElementById('mobileHabitsHoy');
  const wkEl = document.getElementById('mobileHabitsSemana');
  const resEl = document.getElementById('mobileHabitsResumen');
  if (!hoyEl) return;

  const today = startOfDay(new Date());
  const selectedDay = addDays(today, mobileDayOffset);
  const week = getWeekDates();
  const todayIdx = week.findIndex(d => d.getTime() === today.getTime());
  const habits = state.habits;
  const dayLabel = getDayLabel(mobileDayOffset);
  const dayDateStr = fmtHeaderDate(selectedDay);
  const isToday = mobileDayOffset === 0;

  // === SELECTOR DE DÍA + ZONA HOY ===
  const doneOnDay = habits.filter(h => isDone(h.id, selectedDay)).length;
  const canForward = mobileDayOffset < 0;
  const canBack = mobileDayOffset > -30;

  let hoyHTML = `
    <div class="mh-day-selector">
      <button class="mh-day-nav" onclick="shiftMobileDay(-1)" ${canBack ? '' : 'disabled'} aria-label="Día anterior">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
      <div class="mh-day-label-wrap">
        <div class="mh-day-label ${isToday ? '' : 'past'}">${dayLabel}</div>
        <div class="mh-day-date">${dayDateStr}</div>
      </div>
      <button class="mh-day-nav" onclick="shiftMobileDay(1)" ${canForward ? '' : 'disabled'} aria-label="Día siguiente">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
      </button>
      ${!isToday ? `<button class="mh-day-today" onclick="resetMobileDay()" aria-label="Volver a hoy">HOY</button>` : ''}
    </div>
    <div class="mh-section-title">${doneOnDay} DE ${habits.length} ${isToday ? 'HOY' : 'ESE DÍA'}</div>
  `;

  if (habits.length === 0) {
    hoyHTML += `<div style="text-align:center;padding:30px 16px;color:var(--text-dim);font-family:var(--font-mono);font-size:11px;letter-spacing:0.15em;">— SIN HÁBITOS — usa el botón + para crear uno</div>`;
  } else {
    for (const h of habits) {
      const done = isDone(h.id, selectedDay);
      const streak = streakOf(h.id);
      const icon = ICONS[h.icon] || ICONS.target;
      hoyHTML += `
        <div class="mh-hoy-row">
          <div class="mh-hoy-info">
            <div class="mh-hoy-icon">${icon}</div>
            <div class="mh-hoy-text">
              <div class="mh-hoy-name">${escapeHtml(h.name)}</div>
              <div class="mh-hoy-streak">${streak > 0 ? `RACHA ${streak} ${streak === 1 ? 'DÍA' : 'DÍAS'}` : 'SIN RACHA'}</div>
            </div>
          </div>
          <button class="mh-big-check${done ? ' done' : ''}" onclick="toggleDone('${h.id}', new Date(${selectedDay.getFullYear()}, ${selectedDay.getMonth()}, ${selectedDay.getDate()})); renderMobileHabits();">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </button>
        </div>
      `;
    }
  }
  hoyEl.innerHTML = hoyHTML;

  // === ZONA SEMANA ===
  let wkHTML = `<div class="mh-section-title">ESTA SEMANA</div>`;
  if (habits.length > 0) {
    const labels = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
    for (const h of habits) {
      let doneInWk = 0;
      for (const d of week) if (isDone(h.id, d)) doneInWk++;
      const icon = ICONS[h.icon] || ICONS.target;
      let daysHTML = '';
      for (let i = 0; i < 7; i++) {
        const d = week[i];
        const future = d.getTime() > today.getTime();
        const done = isDone(h.id, d);
        const isToday = i === todayIdx;
        daysHTML += `
          <div class="mh-wk-day${isToday ? ' today' : ''}">
            <div class="mh-lbl">${labels[i]}</div>
            <div class="mh-dot${done ? ' done' : ''}" style="${future ? 'opacity:0.3' : ''}"></div>
          </div>
        `;
      }
      wkHTML += `
        <div class="mh-wk-row">
          <div class="mh-wk-head">
            <div class="mh-wk-name">${icon}<span>${escapeHtml(h.name)}</span></div>
            <div class="mh-wk-pct">${doneInWk}/7</div>
          </div>
          <div class="mh-wk-days">${daysHTML}</div>
        </div>
      `;
    }
  }
  wkEl.innerHTML = wkHTML;

  // === ZONA RESUMEN ===
  const wkStats = weekStats();
  const bestEver = bestStreakEverAll();
  const active = activeHabits();
  const temp = state.weather && state.weather.temp != null ? Math.round(state.weather.temp) + '°' : '—';
  let resHTML = `
    <div class="mh-section-title">RESUMEN</div>
    <div class="mh-kpi-grid">
      <div class="mh-kpi"><b>${wkStats.pct}%</b><span>SEMANA</span></div>
      <div class="mh-kpi"><b>${bestEver.streak}</b><span>RACHA MÁX</span></div>
      <div class="mh-kpi"><b>${active}</b><span>ACTIVOS</span></div>
      <div class="mh-kpi"><b>${temp}</b><span>REQUÍNOA</span></div>
    </div>
    <div class="mh-frase">"${escapeHtml(state.settings.motivationText || '')}"</div>
    <div class="mh-fecha">${fmtHeaderDate(today).toUpperCase()}</div>
  `;
  resEl.innerHTML = resHTML;
}
// V6.3 — escapeHTML eliminado: usamos escapeHtml (helper unificado más abajo)

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeHabitModal();
    closeEventModal();
    closeDayDrawer();
  }
});

/* ============================================================
   V3: Segmented controls wiring
   ============================================================ */
function wireSegControls() {
  const taskCtrl = document.getElementById('taskRangeCtrl');
  if (taskCtrl) {
    taskCtrl.addEventListener('click', e => {
      const b = e.target.closest('button[data-range]');
      if (!b) return;
      state.taskRange = b.dataset.range;
      taskCtrl.querySelectorAll('button').forEach(x => x.classList.toggle('active', x === b));
      renderTaskChart();
    });
  }
  const statsCtrl = document.getElementById('statsUnitCtrl');
  if (statsCtrl) {
    statsCtrl.addEventListener('click', e => {
      const b = e.target.closest('button[data-unit]');
      if (!b) return;
      state.statsUnit = b.dataset.unit;
      statsCtrl.querySelectorAll('button').forEach(x => x.classList.toggle('active', x === b));
      renderStatsView();
    });
  }
}

/* ============================================================
   TOAST
   ============================================================ */
let toastTimer = null;
function showToast(msg) {
  const t = document.getElementById('toast');
  // Limpiar acción previa si existía
  t.classList.remove('with-action');
  t.innerHTML = `<span class="toast-msg">${escapeHtml(msg)}</span>`;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}

// V4: toast con botón DESHACER (5 segundos)
let undoToastTimer = null;
function showUndoToast(msg, onUndo) {
  const t = document.getElementById('toast');
  clearTimeout(undoToastTimer);
  clearTimeout(toastTimer);
  t.classList.add('with-action');
  t.innerHTML = `
    <span class="toast-msg">${escapeHtml(msg)}</span>
    <button class="toast-action" id="toastActionBtn">DESHACER</button>
    <span class="toast-timer"></span>
  `;
  t.classList.add('show');
  document.getElementById('toastActionBtn').onclick = () => {
    clearTimeout(undoToastTimer);
    t.classList.remove('show');
    t.classList.remove('with-action');
    onUndo && onUndo();
  };
  undoToastTimer = setTimeout(() => {
    t.classList.remove('show');
    t.classList.remove('with-action');
  }, 5000);
}

/* ============================================================
   ESCAPE HTML
   ============================================================ */
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
}

/* ============================================================
   PARTICLES BACKGROUND
   ============================================================ */
function initParticles() {
  // V6.3 — respetar prefers-reduced-motion (accesibilidad + ahorro de batería)
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const canvas = document.getElementById('particles');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let particles = [];
  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const COUNT = Math.min(60, Math.floor(window.innerWidth * window.innerHeight / 30000));
  for (let i = 0; i < COUNT; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.2,
      vy: (Math.random() - 0.5) * 0.2,
      r: Math.random() * 1.5 + 0.5,
      a: Math.random() * 0.5 + 0.2
    });
  }
  function tick() {
    // V6.3 — pausar cuando la tab está oculta (no quemar batería en PWA iOS)
    if (document.hidden) { setTimeout(tick, 500); return; }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // V6.3 — shadow se setea UNA vez fuera del loop de partículas
    ctx.shadowColor = 'rgba(0, 212, 255, 0.6)';
    ctx.shadowBlur = 4;
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0, 212, 255, ${p.a})`;
      ctx.fill();
    }
    requestAnimationFrame(tick);
  }
  tick();
}

/* ============================================================
   INIT
   ============================================================ */
function init() {
  loadState();
  migrateTasksV3();
  applyTheme(state.settings.theme || 'futurista');
  applyBrandFromSettings();
  renderAll();
  wireSegControls();
  wireThemePicker();
  fetchWeather();
  setInterval(tickClock, 1000);
  initParticles();
  // V6.2 — en mobile, arrancar en HÁBITOS (no en Resumen que no existe en mobile)
  // V7: siempre se abre en HOY (una sola puerta de entrada)
  switchView('hoy');
  // V6.2 — re-ajustar nav si cambia el tamaño de la ventana (rotación, redimensionar)
  window.addEventListener('resize', () => {
    if (isMobile() && state.view === 'resumen') switchView('hoy');
    updateFabVisibility(state.view);
  });
  // V6.2 — header colapsable al hacer scroll en mobile
  if (isMobile()) {
    let lastScroll = 0;
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      const topBar = document.querySelector('.top-bar');
      if (!topBar) return;
      if (y > 40 && y > lastScroll) topBar.classList.add('collapsed');
      else if (y < 20) topBar.classList.remove('collapsed');
      lastScroll = y;
    }, { passive: true });
  }
  // V7: la nube la arranca Sync.start() (core/sync.js)
  // V6.1 — registra Service Worker para offline real en iPhone
  registerServiceWorker();
}

function registerServiceWorker() {
  // Solo si el navegador lo soporta y estamos en HTTPS o localhost
  if (!('serviceWorker' in navigator)) return;
  const isHttps = location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  if (!isHttps) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => {
        // Si hay una nueva versión esperando, activarla y recargar suavemente
        if (reg.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        reg.addEventListener('updatefound', () => {
          const nw = reg.installing;
          if (!nw) return;
          nw.addEventListener('statechange', () => {
            if (nw.state === 'installed' && navigator.serviceWorker.controller) {
              nw.postMessage({ type: 'SKIP_WAITING' });
            }
          });
        });
      })
      .catch(() => { /* offline silencioso, la app sigue funcionando */ });

    // Cuando el SW nuevo toma el control → recarga una vez para usar la versión fresca
    let refreshed = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshed) return;
      refreshed = true;
      location.reload();
    });
  });
}

/* ============================================================
   V3: migración suave de tareas previas — completedAt
   ============================================================ */
function migrateTasksV3() {
  // V4: tareas legacy con done=true se migran a archivedTasks + taskLog
  if (!Array.isArray(state.archivedTasks)) state.archivedTasks = [];
  if (!Array.isArray(state.taskLog)) state.taskLog = [];

  const remaining = [];
  let changed = false;
  for (const t of state.tasks) {
    if (t.done) {
      const completedAt = t.completedAt || t.createdAt || Date.now();
      // Mover a archivadas (V6.3 — preserva priority)
      state.archivedTasks.unshift({
        id: t.id,
        text: t.text,
        priority: t.priority || 'trivial',
        createdAt: t.createdAt,
        completedAt
      });
      // Crear evento en log (si no existe ya uno para este taskId)
      if (!state.taskLog.find(e => e.taskId === t.id)) {
        state.taskLog.push({
          eventId: 'e' + Math.random().toString(36).slice(2, 10),
          taskId: t.id,
          text: t.text,
          completedAt
        });
      }
      changed = true;
    } else {
      // Limpiar campos legacy (V6.3 — preserva priority; default trivial al fondo)
      const pri = (t.priority && PRI_ORDER.hasOwnProperty(t.priority)) ? t.priority : 'trivial';
      const clean = { id: t.id, text: t.text, priority: pri, createdAt: t.createdAt || Date.now() };
      remaining.push(clean);
      if (t.done !== undefined || t.completedAt !== undefined || !t.priority) changed = true;
    }
  }
  if (changed) {
    state.tasks = remaining;
    // V6.3 — saveState(false) para NO bumpear dataModifiedAt: una migración local
    // no debe parecer "más nueva" que la nube y pisarla al hacer pull.
    saveState(false);
  }
}

// V7: init() lo llama App.boot() en index.html, después de registrar los módulos.
