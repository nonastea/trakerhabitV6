/* ==========================================================================
   MODO JUEGO — "Los encargos de Milo"        V2 · capa sobre TRACKEADOR V6
   --------------------------------------------------------------------------
   Cambios grandes de la V2 (todos vienen de la auditoría):

   1. BAROS DE FLUJO       — solo cuentan los últimos 30 días. La tienda no
                             se infla y el permiso vuelve a costar algo.
   2. NIVEL vs FORMA       — Nivel es tu historia (nunca baja). Forma son tus
                             últimos 21 días (sube y baja). El mapa respira
                             con la Forma, no con el Nivel.
   3. VIDA CON FUNCIÓN     — bajo el 30% se cierra la tienda de permisos y
                             Milo se ve mal. Un recurso sin consecuencia es
                             decoración.
   4. CONFIANZA DEL PUEBLO — la constancia multiplica el XP hasta ×1,6.
                             Fallar un día la baja un poco, no a cero.
                             Se calcula día por día desde tu historial real.
   5. GRADUACIÓN           — un hábito con 60 días sobre 85% deja de dar XP
                             y pasa a ser un rasgo permanente de Milo.
                             Te protege del efecto de sobrejustificación.
   6. HONESTIDAD PREMIADA  — registrar un golpe el mismo día cuesta la mitad
                             de vida y da Lucidez. Reportar > esconder.
   7. Sonido 8-bit generado en código, vibración, Milo que reacciona,
      cierre del día, crónica del mes y navegación por días pasados.
   ========================================================================== */
(function () {
'use strict';

/* ============================ CONFIGURACIÓN ============================== */
/* Todo lo de aquí abajo es la ECONOMÍA. Es lo que se calibra jugando.       */

var CFG = {
  titulo: 'LOS ENCARGOS DE MILO',
  heroe:  'MILO',
  oficio: 'MANDADERO',

  /* --- vida --- */
  hpMax: 1000,
  hpRegenDia: 50,
  hpCritico: 0.30,          // bajo esto se cierra la tienda de permisos
  descuentoHonestidad: 0.5, // registrar el golpe HOY cuesta la mitad

  /* --- XP --- */
  xpDefault: 10,
  xpPorIcono: {
    dumbbell:25, run:25, meditation:12, book:15, water:8, apple:15,
    moon:18, notebook:10, brain:15, target:20, code:22, music:12
  },
  curva: function (n) { return Math.round(90 * Math.pow(n - 1, 1.55)); },

  /* --- confianza del pueblo (la constancia) --- */
  confNeutro: 0.55,  // el día que empatas: sobre esto subes, bajo esto bajas
  confFuerza: 13,    // cuánto mueve un día (ratio 1,0 → ~+5,9 · ratio 0 → −7,2)
  confTecho: 115,    // techo blando: cerca de 100 cuesta cada vez más subir
  confMaxMult: 0.6,  // confianza 100 → ×1,6 de XP

  /* --- baros: FLUJO, no stock --- */
  ventanaBaros: 30,  // días que cuentan para la billetera
  barosPorXp: 0.5,

  /* --- forma --- */
  ventanaForma: 21,

  /* --- graduación --- */
  gradDias: 60,      // antigüedad mínima del hábito
  gradTasa: 0.85,    // cumplimiento en esos días
  recaidaDias: 30,
  recaidaTasa: 0.50, // si cae bajo esto, vuelve al pergamino

  diaPerfecto: 0.8,  // 80%, no 100% — con 7 hábitos el 100% no pasa nunca

  colores: ['#5fbf4b', '#4a9de0', '#a463d6', '#b9c2cf', '#f2c14e', '#e8734a'],
  iconos:  ['🏃', '📚', '🛡️', '☀️', '⚒️', '🌿'],

  monstruos: [
    { id:'m1', ico:'📱', nombre:'Scroll infinito',      sub:'+60 min en redes',       hp:40 },
    { id:'m2', ico:'🍟', nombre:'Glotón de medianoche',  sub:'chatarra entre comidas', hp:30 },
    { id:'m3', ico:'💸', nombre:'Duende del carrito',    sub:'compra impulsiva',       hp:50 },
    { id:'m4', ico:'🗣️', nombre:'Lengua viperina',       sub:'hablar mal de alguien',  hp:25 }
  ],

  /* XP por REGISTRAR (el resultado no importa: picor 9 = picor 1; $50.000 = $500) */
  xpRegistro: {
    pielCompleto: 15, tratamiento: 5, fotos: 5,
    gymSesion: 20, gymRecord: 10, gymRecordMaxDia: 30,
    peso: 3, medidas: 10, checklistItem: 3,
    plataMov: 2, plataMaxDia: 10
  },

  /* pesos = costo real en CLP (sale del fondo mensual de PLATA). 0 = gratis. */
  permisos: [
    { id:'p1', ico:'🍔', nombre:'Pase de chatarra',   baros:150, hp:50, pesos:4000 },
    { id:'p2', ico:'🍺', nombre:'Chelas con amigos',  baros:130, hp:20, pesos:12000 },
    { id:'p3', ico:'🛒', nombre:'Compra innecesaria', baros:50,  hp:10, pesos:5000 },
    { id:'p4', ico:'🎰', nombre:'Noche de casino',    baros:300, hp:30, pesos:10000 }
  ],

  equipo: [
    { id:'e1', ico:'🎩', nombre:'Sombrero de viajero', baros:200, efecto:'hat-brown' },
    { id:'e2', ico:'👑', nombre:'Corona de mandadero', baros:900, efecto:'hat-gold' },
    { id:'e3', ico:'🫐', nombre:'Tintura azul',        baros:350, efecto:'tint-blue' },
    { id:'e4', ico:'🌿', nombre:'Tintura verde',       baros:350, efecto:'tint-green' },
    { id:'e5', ico:'👻', nombre:'Aura espectral',      baros:600, efecto:'aura' }
  ],

  medallas: [
    { id:'a1', ico:'🥾', nombre:'Primer encargo',      test:function(s){ return s.totalDone >= 1; } },
    { id:'a2', ico:'📦', nombre:'50 encargos',         test:function(s){ return s.totalDone >= 50; } },
    { id:'a3', ico:'🏔️', nombre:'500 encargos',        test:function(s){ return s.totalDone >= 500; } },
    { id:'a4', ico:'⭐', nombre:'Nivel 5',              test:function(s){ return s.maxLvl >= 5; } },
    { id:'a5', ico:'🌟', nombre:'Nivel 10',             test:function(s){ return s.maxLvl >= 10; } },
    { id:'a6', ico:'🤝', nombre:'Pueblo confiado',      test:function(s){ return s.confianza >= 60; } },
    { id:'a7', ico:'🏅', nombre:'Pueblo entregado',     test:function(s){ return s.confianza >= 95; } },
    { id:'a8', ico:'📅', nombre:'Día perfecto',         test:function(s){ return s.diasPerfectos >= 1; } },
    { id:'a9', ico:'🗓️', nombre:'30 días perfectos',    test:function(s){ return s.diasPerfectos >= 30; } },
    { id:'a10',ico:'🛡️', nombre:'Semana sin monstruos', test:function(s){ return s.diasLimpios >= 7; } },
    { id:'a11',ico:'⚔️', nombre:'Primer jefe',          test:function(s){ return s.jefesGanados >= 1; } },
    { id:'a12',ico:'👑', nombre:'5 jefes',              test:function(s){ return s.jefesGanados >= 5; } },
    { id:'a13',ico:'🎓', nombre:'Primer rasgo',         test:function(s){ return s.graduados >= 1; } },
    { id:'a14',ico:'🧬', nombre:'Tres rasgos',          test:function(s){ return s.graduados >= 3; } },
    { id:'a15',ico:'👁️', nombre:'Lucidez',              test:function(s){ return s.lucidez >= 10; } },
    { id:'a16',ico:'🎒', nombre:'Coleccionista',        test:function(s){ return s.equipados >= 3; } }
  ],

  jefe: {
    diasEntre: 3, prob: 0.55, dias: 2, horas: 48, recompensa: 250,
    candidatos: 3           // elige al azar entre los 3 peores, para que varíe
  }
};

var ASSETS = 'game/assets/';

/* =============================== ESTADO ================================== */

var UI = { on:false, screen:'ficha', filtro:null, mounted:false,
           fecha:null, herido:false, cierre:false };

function hayEstado() { try { return typeof state !== 'undefined' && !!state; } catch (e) { return false; } }

function g() {
  if (!hayEstado()) {
    return { golpes:[], compras:[], equipo:[], puestos:[], medallas:[],
             graduados:{}, jefesGanados:0, lucidez:0, hp:CFG.hpMax, sonido:true };
  }
  if (!state.game || typeof state.game !== 'object') state.game = {};
  var x = state.game;
  if (typeof x.hp !== 'number')     x.hp = CFG.hpMax;
  if (!x.hpDate)        x.hpDate = hoy();
  if (!x.compras)       x.compras = [];
  if (!x.golpes)        x.golpes = [];
  if (!x.equipo)        x.equipo = [];
  if (!x.puestos)       x.puestos = [];
  if (!x.medallas)      x.medallas = [];
  if (!x.graduados)     x.graduados = {};     // {habitId: 'YYYY-MM-DD'}
  if (typeof x.jefesGanados !== 'number') x.jefesGanados = 0;
  if (typeof x.lucidez !== 'number')      x.lucidez = 0;
  if (typeof x.sonido !== 'boolean')      x.sonido = true;
  if (!x.jefesLog)      x.jefesLog = [];      // [{fecha, recompensa}]
  return x;
}
function save() { try { if (window.saveState) saveState(); } catch (e) {} }

/* ============================== UTILIDADES =============================== */

function hoy()         { return key(new Date()); }
function key(d)        { return (window.fmtDate ? fmtDate(d) : d.toISOString().slice(0,10)); }
function fecha(k)      { return new Date(k + 'T00:00:00'); }
function dias(a, b)    { return Math.round((fecha(b) - fecha(a)) / 86400000); }
function masDias(k, n) { var d = new Date(k + 'T12:00:00'); d.setDate(d.getDate() + n); return key(d); }
function esc(s)        { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
                           return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
function num(n)        { return Number(n || 0).toLocaleString('es-CL'); }
function el(id)        { return document.getElementById(id); }
function clamp(v,a,b)  { return Math.max(a, Math.min(b, v)); }

function habitos()    { return hayEstado() && state.habits ? state.habits : []; }
function habitoPorId(id) { return habitos().filter(function (h) { return h.id === id; })[0] || null; }
function categorias() {
  var c = hayEstado() && state.categories ? state.categories : [];
  return c.length ? c : [{ id:'otros', name:'Otros' }];
}
function catNombre(id) {
  var c = categorias().filter(function (x) { return x.id === id; })[0];
  return c ? (c.name || c.id) : id;
}
function marcas(h) { return (hayEstado() && state.completions && state.completions[h.id]) || {}; }

function xpBase(h) {
  var gg = g();
  if (gg.xpPorHabito && gg.xpPorHabito[h.id] != null) return gg.xpPorHabito[h.id];
  return CFG.xpPorIcono[h.icon] || CFG.xpDefault;
}
function nivelDe(xp) { var n = 1; while (CFG.curva(n + 1) <= xp) n++; return n; }

/* ==========================================================================
   EL MOTOR
   Recorre tu historial día por día y calcula TODO de una pasada: confianza,
   XP con el multiplicador que tenías ese día, baros del mes, forma por área
   y qué hábitos ya se graduaron. Determinista: mismos datos, mismo resultado.
   ========================================================================== */

var _cache = null;

/* ---------------- módulos nuevos: piel, gym, plata (todo tolerante) ---------------- */

function modulo(id) {
  try {
    if (!hayEstado()) return null;
    var m = state[id];
    return (m && typeof m === 'object') ? m : null;
  } catch (e) { return null; }
}
function modMod(id) { var m = modulo(id); return m && m._mod ? m._mod : 0; }
function mesDe(k) { return String(k || hoy()).slice(0, 7); }
function pesos(n) { return '$' + num(Math.round(n || 0)); }

/* lunes ISO de una clave '2026-W42' */
function lunesDeSemana(wk) {
  var m = /^(\d{4})-W(\d{1,2})$/.exec(String(wk || '')); if (!m) return null;
  var y = +m[1], w = +m[2];
  var ene4 = new Date(y, 0, 4, 12);
  var dow = ene4.getDay() || 7;
  ene4.setDate(ene4.getDate() - (dow - 1) + (w - 1) * 7);
  return key(ene4);
}
function lunesDe(k) {
  var d = new Date(k + 'T12:00:00'), dow = d.getDay() || 7;
  d.setDate(d.getDate() - (dow - 1));
  return key(d);
}
function uno(kg, reps) { return kg * (1 + reps / 30); }   // Epley

/* XP crudo (sin multiplicador) de registro por día: { 'YYYY-MM-DD': n } */
function registroPorDia() {
  var X = CFG.xpRegistro, out = {};
  function suma(k, n) { if (k && n > 0) out[k] = (out[k] || 0) + n; }
  var piel = modulo('piel'), gym = modulo('gym'), plata = modulo('plata');

  /* piel */
  if (piel && piel.dias && typeof piel.dias === 'object') {
    Object.keys(piel.dias).forEach(function (k) {
      var d = piel.dias[k];
      if (!d || d.legacy || !(d.ts > 0)) return;
      if (d.picor != null && d.piel != null && d.sueno != null) suma(k, X.pielCompleto);
      var tr = d.trat, marcado = false;
      if (tr && typeof tr === 'object') {
        Object.keys(tr).forEach(function (t) { if (Array.isArray(tr[t]) && tr[t].length) marcado = true; });
      }
      if (marcado) suma(k, X.tratamiento);
      if (d.fotos) suma(k, X.fotos);
    });
  }

  /* gym */
  if (gym) {
    var ses = Array.isArray(gym.sesiones) ? gym.sesiones.filter(function (s) { return s && s.fecha && !s.legacy; }) : [];
    ses.sort(function (a, b) { return a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : (a.ts || 0) - (b.ts || 0); });
    var mejor = {}, diaSesion = {}, recDia = {};
    ses.forEach(function (s) {
      var items = Array.isArray(s.items) ? s.items : [], conKg = false, nuevos = {};
      items.forEach(function (it) {
        var ek = it.ejId || it.nombre; if (!ek) return;
        var best = 0;
        (Array.isArray(it.sets) ? it.sets : []).forEach(function (st) {
          var kg = +st.kg || 0, reps = +st.reps || 0;
          if (kg > 0) { conKg = true; if (reps > 0) best = Math.max(best, uno(kg, reps)); }
        });
        if (best > 0) {
          if (mejor[ek] != null && best > mejor[ek] + 1e-9) recDia[s.fecha] = (recDia[s.fecha] || 0) + 1;
          nuevos[ek] = Math.max(nuevos[ek] || 0, best);
        }
      });
      Object.keys(nuevos).forEach(function (ek) { mejor[ek] = Math.max(mejor[ek] || 0, nuevos[ek]); });
      if (conKg) diaSesion[s.fecha] = 1;
    });
    Object.keys(diaSesion).forEach(function (k) { suma(k, X.gymSesion); });
    Object.keys(recDia).forEach(function (k) { suma(k, Math.min(X.gymRecordMaxDia, recDia[k] * X.gymRecord)); });

    var vistos = {};
    (Array.isArray(gym.peso) ? gym.peso : []).forEach(function (p) {
      if (p && p.fecha && !p.legacy && p.kg != null && !vistos[p.fecha]) { vistos[p.fecha] = 1; suma(p.fecha, X.peso); }
    });
    var vm = {};
    (Array.isArray(gym.medidas) ? gym.medidas : []).forEach(function (m) {
      if (m && m.fecha && !m.legacy && !vm[m.fecha]) { vm[m.fecha] = 1; suma(m.fecha, X.medidas); }
    });
    if (gym.semanas && typeof gym.semanas === 'object') {
      Object.keys(gym.semanas).forEach(function (wk) {
        var lun = lunesDeSemana(wk), w = gym.semanas[wk]; if (!lun || !w) return;
        var n = 0; ['proteina', 'sueno', 'movilidad', 'cerro'].forEach(function (c) { if (w[c]) n++; });
        suma(lun, n * X.checklistItem);
      });
    }
  }

  /* plata */
  if (plata && Array.isArray(plata.movs)) {
    var cnt = {};
    plata.movs.forEach(function (m) {
      if (!m || !m.fecha || m.origen === 'milo' || m.legacy) return;
      cnt[m.fecha] = (cnt[m.fecha] || 0) + 1;
    });
    Object.keys(cnt).forEach(function (k) { suma(k, Math.min(X.plataMaxDia, cnt[k] * X.plataMov)); });
  }
  return out;
}

function motor() {
  var hs = habitos(), gg = g();
  var firma = hoy() + '|' + hs.length + '|' +
              hs.reduce(function (s,h) { return s + Object.keys(marcas(h)).length; }, 0) + '|' +
              Object.keys(gg.graduados).length + '|' + gg.jefesGanados + '|' +
              modMod('piel') + '|' + modMod('gym') + '|' + modMod('plata');
  if (_cache && _cache.firma === firma) return _cache;

  var R = {
    firma: firma, xpArea:{}, xpTotal:0, confianza:0, mult:1,
    baros:0, ganados30:0, gastados30:0, forma:{}, porDia:{},
    totalDone:0, diasPerfectos:0, primerDia:null, graduados:{},
    regPorDia:{}, xpRegistroSemana:0
  };

  /* --- índice fecha → hábitos hechos --- */
  var porDia = {};
  hs.forEach(function (h) {
    Object.keys(marcas(h)).forEach(function (k) {
      (porDia[k] = porDia[k] || []).push(h.id);
      R.totalDone++;
    });
  });
  R.porDia = porDia;
  var regCrudo = {};
  try { regCrudo = registroPorDia(); } catch (e) { console.error('[modo juego] registro', e); }
  var fechas = Object.keys(porDia).concat(Object.keys(regCrudo)).sort();
  if (!fechas.length) {
    // sin historial igual cuentan los baros de jefes y las compras (si no, el premio "desaparece")
    var d30 = masDias(hoy(), -(CFG.ventanaBaros - 1));
    gg.jefesLog.forEach(function (j) { if (j.fecha >= d30) R.ganados30 += j.recompensa; });
    R.gastados30 = gg.compras.reduce(function (s, c) { return c.fecha >= d30 ? s + (c.baros || 0) : s; }, 0);
    R.baros = Math.max(0, R.ganados30 - R.gastados30);
    _cache = R; return R;
  }
  R.primerDia = fechas[0];

  /* --- graduación: se evalúa antes del recorrido --- */
  var graduados = {};
  Object.keys(gg.graduados).forEach(function (id) { graduados[id] = gg.graduados[id]; });
  R.graduados = graduados;

  /* --- recorrido día por día --- */
  var conf = 0, k = R.primerDia, fin = hoy(), guarda = 0;
  var desde30 = masDias(fin, -(CFG.ventanaBaros - 1));

  while (k <= fin && guarda++ < 4000) {
    var hechosHoy = porDia[k] || [];
    // hábitos "activos" ese día: los no graduados aún
    var activos = hs.filter(function (h) {
      return !(graduados[h.id] && graduados[h.id] < k);
    });
    var hechosActivos = hechosHoy.filter(function (id) {
      return !(graduados[id] && graduados[id] < k);
    });
    var ratio = activos.length ? hechosActivos.length / activos.length : 0;

    // el XP del día usa la confianza que TRAÍAS, no la que ganas hoy
    var mult = 1 + (conf / 100) * CFG.confMaxMult;

    hechosActivos.forEach(function (id) {
      var h = habitoPorId(id); if (!h) return;
      var ganado = Math.round(xpBase(h) * mult);
      R.xpArea[h.category] = (R.xpArea[h.category] || 0) + ganado;
      R.xpTotal += ganado;
      if (k >= desde30) R.ganados30 += ganado * CFG.barosPorXp;
    });

    // XP de registro: mismo multiplicador, no toca confianza ni día perfecto
    if (regCrudo[k] && k <= fin) {
      var gReg = Math.round(regCrudo[k] * mult);
      R.xpArea.registro = (R.xpArea.registro || 0) + gReg;
      R.xpTotal += gReg;
      R.regPorDia[k] = gReg;
      if (k >= desde30) R.ganados30 += gReg * CFG.barosPorXp;
    }

    if (ratio >= CFG.diaPerfecto && activos.length) R.diasPerfectos++;
    // Deriva continua, sin escalón: un día flojo te baja poco, uno bueno te sube.
    // Cerca de 100 cada punto cuesta más, así que la cima se gana sosteniendo.
    var delta = (ratio - CFG.confNeutro) * CFG.confFuerza;
    conf = clamp(conf + (delta > 0 ? delta * (1 - conf / CFG.confTecho) : delta), 0, 100);
    k = masDias(k, 1);
  }

  R.confianza = Math.round(conf);
  R.mult = 1 + (conf / 100) * CFG.confMaxMult;
  var lunes = lunesDe(fin);
  Object.keys(R.regPorDia).forEach(function (kk) {
    if (kk >= lunes && kk <= fin) R.xpRegistroSemana += R.regPorDia[kk];
  });

  /* --- forma por área: últimos 21 días --- */
  var desdeF = masDias(fin, -(CFG.ventanaForma - 1));
  categorias().forEach(function (c) {
    var delArea = hs.filter(function (h) { return h.category === c.id && !graduados[h.id]; });
    if (!delArea.length) { R.forma[c.id] = null; return; }
    var hechos = 0;
    delArea.forEach(function (h) {
      hechos += Object.keys(marcas(h)).filter(function (kk) { return kk >= desdeF && kk <= fin; }).length;
    });
    R.forma[c.id] = clamp(Math.round(hechos / (delArea.length * CFG.ventanaForma) * 10), 0, 10);
  });

  /* --- baros: flujo de 30 días --- */
  R.ganados30 = Math.floor(R.ganados30);
  gg.jefesLog.forEach(function (j) { if (j.fecha >= desde30) R.ganados30 += j.recompensa; });
  R.gastados30 = gg.compras.reduce(function (s, c) {
    return c.fecha >= desde30 ? s + (c.baros || 0) : s;
  }, 0);
  R.baros = Math.max(0, R.ganados30 - R.gastados30);

  _cache = R;
  return R;
}
function invalidar() { _cache = null; }

/* -------------------------- graduación y recaída ------------------------- */

function revisarGraduacion() {
  var gg = g(), hs = habitos(), fin = hoy(), cambios = [];

  hs.forEach(function (h) {
    var ks = Object.keys(marcas(h)).sort();
    if (!ks.length) return;
    var ya = !!gg.graduados[h.id];

    if (!ya) {
      if (dias(ks[0], fin) < CFG.gradDias) return;
      var d1 = masDias(fin, -(CFG.gradDias - 1));
      var n1 = ks.filter(function (k) { return k >= d1; }).length;
      if (n1 / CFG.gradDias >= CFG.gradTasa) {
        gg.graduados[h.id] = fin;
        cambios.push({ tipo:'grad', h:h });
      }
    } else {
      var d2 = masDias(fin, -(CFG.recaidaDias - 1));
      var n2 = ks.filter(function (k) { return k >= d2; }).length;
      if (dias(gg.graduados[h.id], fin) >= CFG.recaidaDias && n2 / CFG.recaidaDias < CFG.recaidaTasa) {
        delete gg.graduados[h.id];
        cambios.push({ tipo:'recaida', h:h });
      }
    }
  });

  if (cambios.length) {
    invalidar(); save();
    cambios.forEach(function (c, i) {
      setTimeout(function () {
        if (c.tipo === 'grad') {
          sfx('grad');
          grande('🎓 ' + c.h.name.toUpperCase() + '\nYA ES PARTE DE TI');
          toast('Milo ya no necesita que le paguen por esto.');
        } else {
          toast('⚠ ' + c.h.name + ' volvió al pergamino. El pueblo te lo recuerda.');
        }
      }, 400 + i * 1800);
    });
  }
}

/* ------------------------------ vida y golpes ---------------------------- */

function sincronizarHp() {
  var x = g(), d = dias(x.hpDate, hoy());
  if (d > 0) { x.hp = Math.min(CFG.hpMax, x.hp + d * CFG.hpRegenDia); x.hpDate = hoy(); }
  x.hp = clamp(x.hp, 0, CFG.hpMax);
  return x.hp;
}
function hpRatio()   { return sincronizarHp() / CFG.hpMax; }
function enCritico() { return hpRatio() < CFG.hpCritico; }
function danio(n)    { var x = g(); x.hp = Math.max(0, x.hp - n); }

function golpesRecientes(mId) {
  var lim = masDias(hoy(), -6);
  return g().golpes.filter(function (h) {
    return (!mId || h.mId === mId) && h.fecha >= lim;
  }).length;
}
function diasLimpios() {
  var sucias = {}; g().golpes.forEach(function (h) { sucias[h.fecha] = 1; });
  var desde = motor().primerDia;            // sin historial no hay "semana sin monstruos" que premiar
  if (!desde) return 0;
  var n = 0, k = hoy();
  while (n < 400 && !sucias[k] && k >= desde) { n++; k = masDias(k, -1); }
  return n;
}

/* ------------------------- fondo de permisos y cofre --------------------------- */

var MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto',
             'septiembre','octubre','noviembre','diciembre'];
function nombreMes(mk) {
  var p = String(mk).split('-');
  return (MESES[(+p[1] || 1) - 1] || mk) + ' ' + p[0];
}
function movsPlata() {
  var p = modulo('plata');
  return (p && Array.isArray(p.movs)) ? p.movs.filter(Boolean) : [];
}
function fondoMes(mk) {
  var p = modulo('plata'), f = p && p.fondoPermisos && p.fondoPermisos[mk || mesDe()];
  f = Number(f);
  return (isFinite(f) && f > 0) ? f : 0;
}
function gastadoMilo(mk) {
  mk = mk || mesDe();
  return movsPlata().reduce(function (s, m) {
    return (m.origen === 'milo' && m.tipo === 'gasto' && mesDe(m.fecha) === mk) ? s + (Number(m.montoCLP) || 0) : s;
  }, 0);
}
function restanteFondo() { return fondoMes() - gastadoMilo(); }
function metaMes(mk) {
  var p = modulo('plata'), f = p && p.metaInversion && p.metaInversion[mk || mesDe()];
  f = Number(f);
  return (isFinite(f) && f > 0) ? f : 0;
}
function invertidoMes(mk) {
  mk = mk || mesDe();
  return movsPlata().reduce(function (s, m) {
    return (m.tipo === 'inversion' && mesDe(m.fecha) === mk) ? s + (Number(m.montoCLP) || 0) : s;
  }, 0);
}
/* medallas "Cofre dorado <mes>": meses CERRADOS que cumplieron la meta */
function cofresDorados() {
  var p = modulo('plata'), out = [];
  if (!p || !p.metaInversion) return out;
  var actual = mesDe();
  Object.keys(p.metaInversion).sort().forEach(function (mk) {
    if (mk < actual && metaMes(mk) > 0 && invertidoMes(mk) >= metaMes(mk)) {
      out.push({ id:'cofre-' + mk, ico:'🏆', nombre:'Cofre dorado ' + nombreMes(mk) });
    }
  });
  return out;
}

/* -------------------------------- stats ---------------------------------- */

function stats() {
  var M = motor(), gg = g();
  return {
    totalDone: M.totalDone,
    maxLvl: categorias().reduce(function (m,c){ return Math.max(m, nivelDe(M.xpArea[c.id] || 0)); }, 1),
    confianza: M.confianza,
    diasPerfectos: M.diasPerfectos,
    diasLimpios: diasLimpios(),
    jefesGanados: gg.jefesGanados,
    graduados: Object.keys(gg.graduados).length,
    lucidez: gg.lucidez,
    equipados: gg.equipo.length
  };
}

function revisarMedallas() {
  var s = stats(), x = g(), nuevas = [];
  CFG.medallas.forEach(function (m) {
    if (x.medallas.indexOf(m.id) === -1 && m.test(s)) { x.medallas.push(m.id); nuevas.push(m); }
  });
  cofresDorados().forEach(function (m) {
    if (x.medallas.indexOf(m.id) === -1) { x.medallas.push(m.id); nuevas.push(m); }
  });
  if (nuevas.length) {
    save();
    if (nuevas.length > 3) {
      sfx('grad');
      grande('🏅 ' + nuevas.length + ' MEDALLAS\nDE GOLPE');
      setTimeout(function () {
        toast('Tu historial te desbloqueó ' + nuevas.length + ' logros. Están en el salón.');
      }, 1600);
    } else {
      nuevas.forEach(function (m, i) {
        setTimeout(function () { sfx('medalla'); toast(m.ico + '  LOGRO: ' + m.nombre.toUpperCase()); }, i * 950);
      });
    }
  }
}

/* ================================= JEFE ================================== */

function candidatosJefe() {
  var hs = habitos().filter(function (h) { return !g().graduados[h.id]; });
  if (!hs.length) return [];
  var desde = masDias(hoy(), -29);
  return hs.map(function (h) {
    var n = Object.keys(marcas(h)).filter(function (k) { return k >= desde; }).length;
    return { h:h, tasa: n / 30 };
  }).sort(function (a,b) { return a.tasa - b.tasa; });
}

function quizasOfrecerJefe() {
  var x = g();
  if (x.jefe) return;
  if (x.jefeVistoEl === hoy()) return;
  x.jefeVistoEl = hoy();
  if (x.ultimoJefeAt && dias(x.ultimoJefeAt, hoy()) < CFG.jefe.diasEntre) { save(); return; }
  if (Math.random() > CFG.jefe.prob) { save(); return; }

  var cand = candidatosJefe()
    .filter(function (c) { return c.h.id !== x.ultimoJefeHabit; })
    .slice(0, CFG.jefe.candidatos);
  if (!cand.length) { save(); return; }
  var elegido = cand[Math.floor(Math.random() * cand.length)].h;

  x.jefe = {
    habitId: elegido.id, habitName: elegido.name, aceptado:false,
    dias: CFG.jefe.dias, recompensa: CFG.jefe.recompensa,
    inicio: hoy(), fin: masDias(hoy(), Math.ceil(CFG.jefe.horas / 24))
  };
  save();
}

function resolverJefe() {
  var x = g(), j = x.jefe; if (!j) return;
  if (!j.aceptado) {
    if (hoy() > j.fin) { x.jefe = null; x.ultimoJefeAt = hoy(); save(); }
    return;
  }
  var ks = Object.keys((hayEstado() && state.completions && state.completions[j.habitId]) || {});
  var hechos = ks.filter(function (k) { return k >= j.inicio && k <= j.fin; }).length;
  if (hechos >= j.dias) {
    x.jefesGanados++;
    x.jefesLog.push({ fecha: hoy(), recompensa: j.recompensa });
    x.ultimoJefeAt = hoy(); x.ultimoJefeHabit = j.habitId; x.jefe = null;
    invalidar(); save(); sfx('jefe');
    grande('¡JEFE DERROTADO!\n+' + CFG.jefe.recompensa + ' BAROS');
  } else if (hoy() > j.fin) {
    x.jefe = null; x.ultimoJefeAt = hoy(); x.ultimoJefeHabit = j.habitId; save();
    toast('El jefe se fue. Sin castigo — pero se te escapó.');
  }
}

/* ============================== SONIDO 8-BIT ============================= */
/* Generado con Web Audio: cero archivos, cero descargas.                    */

var AC = null;
function audio() {
  if (!g().sonido) return null;
  try {
    if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)();
    if (AC.state === 'suspended') AC.resume();
    return AC;
  } catch (e) { return null; }
}
function nota(f0, f1, dur, tipo, vol, t0) {
  var ac = audio(); if (!ac) return;
  var t = ac.currentTime + (t0 || 0);
  var o = ac.createOscillator(), gn = ac.createGain();
  o.type = tipo || 'square';
  o.frequency.setValueAtTime(f0, t);
  if (f1 && f1 !== f0) o.frequency.linearRampToValueAtTime(f1, t + dur);
  gn.gain.setValueAtTime(0.0001, t);
  gn.gain.exponentialRampToValueAtTime(vol || 0.09, t + 0.008);
  gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(gn); gn.connect(ac.destination);
  o.start(t); o.stop(t + dur + 0.02);
}
function sfx(tipo) {
  if (!g().sonido) return;
  switch (tipo) {
    case 'marcar':   nota(880, 1320, 0.09, 'square', 0.07); break;
    case 'desmarcar':nota(660, 440,  0.09, 'square', 0.05); break;
    case 'moneda':   nota(1046,1046, 0.06, 'square', 0.07);
                     nota(1568,1568, 0.13, 'square', 0.07, 0.06); break;
    case 'nivel':    [523,659,784,1046].forEach(function (f,i){ nota(f,f,0.13,'square',0.08,i*0.09); }); break;
    case 'medalla':  [784,1046].forEach(function (f,i){ nota(f,f,0.11,'triangle',0.08,i*0.10); }); break;
    case 'grad':     [523,659,784,1046,1319].forEach(function (f,i){ nota(f,f,0.16,'triangle',0.09,i*0.12); }); break;
    case 'golpe':    nota(190, 55, 0.30, 'sawtooth', 0.13); break;
    case 'jefe':     [392,523,659,784,659,784,1046].forEach(function (f,i){ nota(f,f,0.15,'square',0.09,i*0.11); }); break;
    case 'abrir':    nota(180, 900, 0.24, 'square', 0.05); break;
    case 'cerrar':   nota(900, 140, 0.22, 'square', 0.05); break;
    case 'nav':      nota(600, 700, 0.05, 'square', 0.04); break;
    case 'error':    nota(200, 150, 0.16, 'sawtooth', 0.07); break;
  }
}
function vibrar(p) { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) {} }

/* ================================ EFECTOS =============================== */

function flotante(ev, txt, color) {
  var d = document.createElement('div');
  d.className = 'g-float'; d.textContent = txt; d.style.color = color;
  d.style.left = (((ev && ev.clientX) || innerWidth / 2) - 24) + 'px';
  d.style.top  = (((ev && ev.clientY) || innerHeight / 2) - 24) + 'px';
  document.body.appendChild(d);
  setTimeout(function () { d.remove(); }, 1100);
}
var toastN = 0;
function toast(txt) {
  if (toastN >= 3) return;
  var d = document.createElement('div');
  d.className = 'g-toast'; d.textContent = txt;
  d.style.bottom = (88 + toastN * 56) + 'px'; toastN++;
  document.body.appendChild(d);
  setTimeout(function () { d.remove(); toastN = Math.max(0, toastN - 1); }, 2900);
}
function grande(txt) {
  var d = document.createElement('div');
  d.className = 'g-levelup';
  d.innerHTML = '<span>' + esc(txt).replace(/\n/g, '<br>') + '</span>';
  document.body.appendChild(d);
  setTimeout(function () { d.remove(); }, 1750);
}

/* ============================= MILO: ASPECTO ============================= */

function efectosPuestos() {
  var p = g().puestos, css = '', hat = '';
  if (p.indexOf('tint-blue')  > -1) css += 'hue-rotate(175deg) saturate(1.25) ';
  if (p.indexOf('tint-green') > -1) css += 'hue-rotate(78deg) saturate(1.15) ';
  if (p.indexOf('aura')       > -1) css += 'drop-shadow(0 0 9px #a463d6) ';
  if (p.indexOf('hat-brown')  > -1) hat = '#6b4326';
  if (p.indexOf('hat-gold')   > -1) hat = '#f2c14e';
  if (enCritico()) css += 'saturate(.35) brightness(.78) ';
  return { filtro: css, gorro: hat };
}
function spriteMilo() {
  if (UI.herido || enCritico()) return 'milo_startled.png';
  return 'milo_front.png';
}

/* ============================= RENDER: FICHA ============================ */

function corazon(lleno) {
  var c = lleno ? '#e03b34' : '#2b3049', b = lleno ? '#8f1f1a' : '#181c30';
  return '<svg class="g-heart" viewBox="0 0 11 10" shape-rendering="crispEdges">' +
    '<path fill="' + b + '" d="M1 1h3v1h3V1h3v4h-1v1h-1v1h-1v1H6v1H5V8H4V7H3V6H2V5H1z"/>' +
    '<path fill="' + c + '" d="M2 2h2v1h3V2h2v3H8v1H7v1H6v1H5V7H4V6H3V5H2z"/>' +
    (lleno ? '<path fill="#ff8f88" d="M2 2h1v2H2z"/>' : '') + '</svg>';
}

function pintarFicha() {
  var M = motor(), gg = g(), ef = efectosPuestos();
  var hp = sincronizarHp(), llenos = Math.round(hp / CFG.hpMax * 7), hearts = '';
  for (var i = 0; i < 7; i++) hearts += corazon(i < llenos);
  var html = '';

  /* ---- columnas (en horizontal se ven lado a lado; en vertical, una debajo de la otra) ---- */
  html += '<div class="g-cols ficha"><div class="g-col a">';

  /* ---- héroe ---- */
  html += '<div class="g-panel"><div class="g-hero">' +
    '<div class="g-portrait' + (UI.herido ? ' shake' : '') + '">' +
      (ef.gorro ? '<div class="g-hat" style="background:' + ef.gorro + '"></div>' : '') +
      '<img src="' + ASSETS + spriteMilo() + '" alt="Milo"' +
        (ef.filtro ? ' style="filter:' + ef.filtro + '"' : '') + '>' +
    '</div>' +
    '<div class="g-hero-side">' +
      '<div class="g-hearts">' + hearts + '</div>' +
      '<div class="g-hp-txt' + (enCritico() ? ' crit' : '') + '">VIDA ' + num(hp) + ' / ' + num(CFG.hpMax) +
        (enCritico() ? ' · EN LAS ÚLTIMAS' : '') + '</div>' +
      '<div class="g-idbox">NOMBRE: <b>' + CFG.heroe + '</b><br>OFICIO: <b>' + CFG.oficio + '</b></div>' +
    '</div></div>';

  /* ---- confianza del pueblo ---- */
  var mult = M.mult.toFixed(2).replace('.', ',');
  html += '<div class="g-conf">' +
    '<div class="g-conf-top"><span>CONFIANZA DEL PUEBLO</span><span class="g-conf-mult">×' + mult + ' XP</span></div>' +
    '<div class="g-bar sm"><div class="g-bar-fill" style="width:' + Math.max(2, M.confianza) +
      '%;--c:#f2c14e"></div></div>' +
    '<div class="g-conf-sub">' + M.confianza + '/100 · ' +
      (M.confianza >= 80 ? 'los vecinos te pagan mejor que a nadie'
       : M.confianza >= 45 ? 'te conocen y te buscan'
       : M.confianza >= 15 ? 'te van conociendo'
       : 'recién llegas al pueblo') + '</div>' +
    '</div>';

  /* ---- rasgos (hábitos graduados) ---- */
  var grads = Object.keys(gg.graduados).map(habitoPorId).filter(Boolean);
  if (grads.length) {
    html += '<div class="g-rasgos"><div class="g-rasgos-t">🎓 RASGOS DE MILO</div>' +
      grads.map(function (h) { return '<span class="g-rasgo">' + esc(h.name) + '</span>'; }).join('') +
      '<div class="g-rasgos-n">Ya no dan XP. Son parte de quién eres.</div></div>';
  }
  html += '</div>';

  /* ---- jefe ---- */
  var j = gg.jefe;
  if (j) {
    html += '<div class="g-boss">' +
      '<div class="g-boss-h">⚔️ ' + (j.aceptado ? 'JEFE ACEPTADO' : 'APARECIÓ UN JEFE') + '</div>' +
      '<div class="g-boss-t">' + esc(j.habitName) + ' — ' + j.dias + ' días</div>' +
      '<div class="g-boss-m">Plazo hasta el ' + j.fin + ' · ' + j.recompensa + ' baros.<br>' +
        (j.aceptado ? 'Ya lo aceptaste. Cumple y es tuyo.'
                    : 'Si lo ignoras se va solo y no pasa nada.') + '</div>' +
      (j.aceptado ? '' :
        '<div class="g-boss-btns">' +
          '<button class="g-btn danger" data-act="boss-yes">ACEPTAR</button>' +
          '<button class="g-btn" data-act="boss-no">IGNORAR</button></div>') +
      '</div>';
  }

  html += '</div><div class="g-col b">';

  /* ---- áreas: NIVEL (historia) + FORMA (presente) ---- */
  html += '<div class="g-panel">';
  categorias().forEach(function (c, i) {
    var xp = M.xpArea[c.id] || 0, lv = nivelDe(xp);
    var base = CFG.curva(lv), sig = CFG.curva(lv + 1);
    var pct = Math.max(3, Math.round((xp - base) / Math.max(1, sig - base) * 100));
    var col = CFG.colores[i % CFG.colores.length];
    var fm = M.forma[c.id];
    var dim = (UI.filtro && UI.filtro !== c.id) ? ' dimmed' : '';
    html += '<div class="g-area clickable' + dim + '" data-act="area" data-id="' + esc(c.id) + '">' +
      '<div class="g-area-ico">' + CFG.iconos[i % CFG.iconos.length] + '</div>' +
      '<div class="g-area-mid">' +
        '<div class="g-bar"><div class="g-bar-fill" style="width:' + pct + '%;--c:' + col + '"></div></div>' +
        '<div class="g-area-name">' + esc((c.name || c.id).toUpperCase()) +
          (fm == null ? '' : ' · FORMA ' + puntitos(fm)) + '</div>' +
      '</div>' +
      '<div class="g-lv">Lv.' + lv + '</div></div>';
  });
  var xpReg = M.xpArea.registro || 0, lvR = nivelDe(xpReg);
  var baseR = CFG.curva(lvR), sigR = CFG.curva(lvR + 1);
  var pctR = Math.max(3, Math.round((xpReg - baseR) / Math.max(1, sigR - baseR) * 100));
  html += '<div class="g-area">' +
    '<div class="g-area-ico">📝</div>' +
    '<div class="g-area-mid">' +
      '<div class="g-bar"><div class="g-bar-fill" style="width:' + pctR + '%;--c:#37c2b0"></div></div>' +
      '<div class="g-area-name">REGISTRO</div>' +
    '</div><div class="g-lv">Lv.' + lvR + '</div></div>';
  html += '<div class="g-legend">NIVEL = tu historia, nunca baja. FORMA = tus últimos 21 días.</div>' +
    '<div class="g-reg-sem">XP de registro esta semana: <b>' + num(M.xpRegistroSemana) + '</b></div></div>';

  html += '</div><div class="g-col c">';

  /* ---- pergamino ---- */
  var k = UI.fecha || hoy();
  var esHoy = (k === hoy());
  var hs = habitos().filter(function (h) {
    return (!UI.filtro || h.category === UI.filtro) && !gg.graduados[h.id];
  });

  var escMon = Math.min(1.7, 0.88 + golpesRecientes(null) * 0.12);   // el pergamino deja espacio al monstruo
  html += '<div class="g-scrollwrap" style="--s:' + escMon.toFixed(2) + '"><div class="g-parch">' +
    '<div class="g-daynav">' +
      '<button class="g-dayb" data-act="dia" data-d="-1">◀</button>' +
      '<div class="g-daylbl">' + (esHoy ? 'ENCARGOS DE HOY' : etiquetaDia(k)) +
        (UI.filtro ? '<br><small>' + esc(catNombre(UI.filtro).toUpperCase()) + '</small>' : '') + '</div>' +
      '<button class="g-dayb" data-act="dia" data-d="1"' + (esHoy ? ' disabled' : '') + '>▶</button>' +
    '</div>';

  if (!hs.length) {
    html += '<div class="g-empty">No hay encargos aquí.<br>Crea hábitos en el modo normal<br>y aparecen solos.</div>';
  } else {
    var d = fecha(k);
    hs.forEach(function (h) {
      var done = window.isDone ? isDone(h.id, d) : false;
      var xp = Math.round(xpBase(h) * M.mult);
      html += '<div class="g-quest' + (done ? ' done' : '') + '" data-act="quest" data-id="' + esc(h.id) + '">' +
        '<div class="g-check">✔</div>' +
        '<div class="g-q-name">' + esc(h.name) + '</div>' +
        '<div class="g-q-rew">+' + xp + ' XP</div></div>';
    });
  }
  html += '</div>';

  var rec = golpesRecientes(null);
  var escala = Math.min(1.7, 0.88 + rec * 0.12);
  html += '<img class="g-monster lurk" src="' + ASSETS + 'monster.png" alt="" style="--s:' +
          escala.toFixed(2) + ';opacity:' + Math.min(1, 0.62 + rec * 0.08).toFixed(2) +
          ';transform:scale(' + escala.toFixed(2) + ')"></div>';

  html += '<div class="g-sub center pad">' +
    (rec === 0 ? 'Los monstruos llevan días sin comer. Se ven chicos.'
               : rec + ' golpe' + (rec > 1 ? 's' : '') + ' esta semana. Se están acercando.') + '</div>';

  html += '</div></div>';
  return html;
}

function puntitos(n) {
  var s = '';
  for (var i = 0; i < 10; i++) s += (i < n ? '●' : '○');
  return s + ' ' + n + '/10';
}
function etiquetaDia(k) {
  var d = dias(k, hoy());
  if (d === 1) return 'AYER';
  var dd = fecha(k);
  return ['DOM','LUN','MAR','MIÉ','JUE','VIE','SÁB'][dd.getDay()] + ' ' + dd.getDate() + '/' + (dd.getMonth() + 1);
}

/* ============================ RENDER: TIENDA ============================= */

function pintarTienda() {
  var M = motor(), gg = g(), saldo = M.baros, crit = enCritico();
  var html = '<div class="g-sec-title">TIENDITA</div><div class="g-cols grid">' +
    '<div class="g-panel g-wide"><div class="g-wallet">' +
      '<div class="g-wallet-n">' + num(saldo) + '</div>' +
      '<div class="g-wallet-s">BAROS DISPONIBLES<br>' +
        '<small>ganaste ' + num(M.ganados30) + ' y gastaste ' + num(M.gastados30) +
        ' en 30 días</small></div></div>';
  html += '<div class="g-sub center">Ropa, amuletos y ataques para las peleas: en <b>El Bazar de la Tía Tortuga</b>, en el mapa.</div>';

  if (crit) {
    html += '<div class="g-locked">🩸 ESTÁS EN LAS ÚLTIMAS<br>' +
      '<small>Con la vida bajo el ' + Math.round(CFG.hpCritico * 100) +
      '% no puedes comprar permisos. Recupérate primero: +' + CFG.hpRegenDia +
      ' por cada día sin golpes.</small></div>';
  }
  html += '</div>';

  html += '<div class="g-panel"><div class="g-shelf-t first">— PERMISOS —</div>' +
          '<div class="g-sub mb">El vicio pagado no es recaída. Cuesta baros y cuesta vida.</div>';
  var fondo = fondoMes(), resto = restanteFondo();
  html += '<div class="g-fondo' + (fondo ? '' : ' sin') + '">' + (fondo
    ? 'FONDO DE PERMISOS: <b>' + pesos(Math.max(0, resto)) + '</b> de ' + pesos(fondo)
    : 'FONDO DE PERMISOS: <b>SIN DEFINIR</b>') + '</div>';
  CFG.permisos.forEach(function (p) {
    var costo = p.pesos || 0, sinFondo = costo > 0 && !fondo, faltaPlata = costo > 0 && fondo && resto < costo;
    var puede = !crit && saldo >= p.baros && !sinFondo && !faltaPlata;
    html += '<div class="g-item' + (crit ? ' off' : '') + '">' +
      '<div class="g-item-ico">' + p.ico + '</div>' +
      '<div class="g-item-b"><div class="g-item-n">' + esc(p.nombre) + '</div>' +
        '<div class="g-item-c">' + p.baros + ' baros' + (costo ? ' + ' + pesos(costo) : '') +
          ' · <i>−' + p.hp + ' vida</i>' +
          (sinFondo ? '<br><i>DEFINE TU FONDO EN PLATA</i>' : faltaPlata ? '<br><i>NO ALCANZA EL FONDO</i>' : '') +
        '</div></div>' +
      '<button class="g-btn gold" data-act="buy-p" data-id="' + p.id + '"' + (puede ? '' : ' disabled') + '>' +
        (crit ? 'CERRADO' : puede ? 'PAGAR' : sinFondo ? 'SIN FONDO' : 'FALTA') + '</button></div>';
  });

  html += '</div><div class="g-panel"><div class="g-shelf-t first">— EQUIPO —</div>' +
          '<div class="g-sub mb">Se guarda en la mochila y le cambia la pinta a Milo.</div>';
  CFG.equipo.forEach(function (e) {
    var tiene = gg.equipo.indexOf(e.id) > -1, puede = saldo >= e.baros;
    html += '<div class="g-item' + (tiene ? ' owned' : '') + '">' +
      '<div class="g-item-ico">' + e.ico + '</div>' +
      '<div class="g-item-b"><div class="g-item-n">' + esc(e.nombre) + '</div>' +
        '<div class="g-item-c">' + (tiene ? 'YA ES TUYO' : e.baros + ' baros') + '</div></div>' +
      (tiene ? '' : '<button class="g-btn gold" data-act="buy-e" data-id="' + e.id + '"' +
        (puede ? '' : ' disabled') + '>' + (puede ? 'COMPRAR' : 'FALTA') + '</button>') + '</div>';
  });

  /* ---- registrar golpes: la honestidad se premia ---- */
  html += '</div><div class="g-panel"><div class="g-shelf-t red first">— REGISTRAR UN GOLPE —</div>' +
    '<div class="g-sub mb">Si caíste sin pagar, se registra aquí. <b>Reportarlo el mismo día cuesta la ' +
    'mitad de vida y suma Lucidez.</b> Esconderlo sale más caro que admitirlo.</div>';
  CFG.monstruos.forEach(function (m) {
    var costoHoy = Math.round(m.hp * CFG.descuentoHonestidad);
    html += '<div class="g-bad">' +
      '<div class="g-bad-ico">' + m.ico + '</div>' +
      '<div class="g-bad-n">' + esc(m.nombre) +
        '<div class="g-bad-c">' + esc(m.sub) + ' · ' + golpesRecientes(m.id) + ' esta semana</div></div>' +
      '<div class="g-bad-btns">' +
        '<button class="g-btn tiny" data-act="hit" data-id="' + m.id + '" data-w="0">HOY −' + costoHoy + '</button>' +
        '<button class="g-btn tiny ghost" data-act="hit" data-id="' + m.id + '" data-w="1">AYER −' + m.hp + '</button>' +
      '</div></div>';
  });

  html += '<div class="g-sub center" style="margin-top:12px">LUCIDEZ: <b>' + gg.lucidez + '</b></div></div></div>';
  return html;
}

/* ======================= RENDER: LOGROS + CRÓNICA ======================== */

function pintarLogros() {
  var gg = g(), s = stats(), M = motor();
  var html = '<div class="g-cols grid"><section class="g-card"><div class="g-sec-title">CRÓNICA</div><div class="g-panel">' + cronica() + '</div></section>';

  var mk = mesDe(), meta = metaMes(mk), inv = invertidoMes(mk);
  html += '<section class="g-card"><div class="g-sec-title">COFRE DEL MES</div><div class="g-panel g-cofre">';
  if (meta) {
    var pc = clamp(Math.round(inv / meta * 100), 0, 100);
    html += '<div class="g-cofre-top"><span>🧰 ' + esc(nombreMes(mk).toUpperCase()) + '</span><span>' +
        pesos(inv) + ' / ' + pesos(meta) + '</span></div>' +
      '<div class="g-bar sm"><div class="g-bar-fill" style="width:' + Math.max(2, pc) + '%;--c:#f2c14e"></div></div>' +
      '<div class="g-conf-sub">' + (inv >= meta ? 'Cofre lleno. Si cierras el mes así, ganas la medalla dorada.'
        : 'Faltan ' + pesos(meta - inv) + ' para llenar el cofre. No da baros: es plata tuya.') + '</div>';
  } else {
    html += '<div class="g-sub center">Sin meta de inversión este mes.<br>Defínela en PLATA y aparece aquí.</div>';
  }
  html += '</div></section>';

  var cofres = cofresDorados(), todas = CFG.medallas.concat(cofres);
  html += '<section class="g-card"><div class="g-sec-title">SALÓN DE VICTORIAS</div><div class="g-panel">' +
    '<div class="g-sub center mb">' + gg.medallas.length + ' DE ' + todas.length + ' MEDALLAS</div>' +
    '<div class="g-medals">';
  todas.forEach(function (m) {
    var tiene = gg.medallas.indexOf(m.id) > -1;
    html += '<div class="g-medal' + (tiene ? ' got' : '') + '">' +
      '<div class="g-medal-i">' + m.ico + '</div>' +
      '<div class="g-medal-n">' + esc(m.nombre.toUpperCase()) + '</div></div>';
  });
  html += '</div></div></section>';

  html += '<section class="g-card"><div class="g-panel"><div class="g-shelf-t" style="margin-top:0">— HOJA DE VIDA —</div>' +
    '<div class="g-sub" style="line-height:2.2">' +
      'ENCARGOS CUMPLIDOS: <b>' + num(s.totalDone) + '</b><br>' +
      'XP TOTAL: <b>' + num(M.xpTotal) + '</b><br>' +
      'XP POR REGISTRAR: <b>' + num(M.xpArea.registro || 0) + '</b><br>' +
      'NIVEL MÁS ALTO: <b>' + s.maxLvl + '</b><br>' +
      'CONFIANZA DEL PUEBLO: <b>' + s.confianza + '/100</b> (×' + M.mult.toFixed(2).replace('.', ',') + ')<br>' +
      'BAROS DEL MES: <b>' + num(M.baros) + '</b><br>' +
      'DÍAS SOBRE ' + Math.round(CFG.diaPerfecto * 100) + '%: <b>' + s.diasPerfectos + '</b><br>' +
      'DÍAS SIN MONSTRUOS: <b>' + s.diasLimpios + '</b><br>' +
      'JEFES DERROTADOS: <b>' + s.jefesGanados + '</b><br>' +
      'RASGOS GRADUADOS: <b>' + s.graduados + '</b><br>' +
      'LUCIDEZ: <b>' + s.lucidez + '</b>' +
    '</div></div></section></div>';
  return html;
}

function cronica() {
  var M = motor(), gg = g(), hs = habitos();
  var sucias = {}; gg.golpes.forEach(function (h) { sucias[h.fecha] = (sucias[h.fecha] || 0) + 1; });
  var out = '<div class="g-sellos">';
  var k = masDias(hoy(), -41);
  while (k <= hoy()) {
    var hechos = (M.porDia[k] || []).length;
    var activos = hs.filter(function (h) { return !(gg.graduados[h.id] && gg.graduados[h.id] < k); }).length;
    var r = activos ? hechos / activos : 0;
    var cls = r >= CFG.diaPerfecto ? 'oro' : r >= 0.5 ? 'plata' : r > 0 ? 'bronce' : 'vacio';
    out += '<div class="g-sello ' + cls + (sucias[k] ? ' sucio' : '') + '" title="' + k + '">' +
           fecha(k).getDate() + '</div>';
    k = masDias(k, 1);
  }
  out += '</div><div class="g-sellos-ley">' +
    '<span><i class="oro"></i>' + Math.round(CFG.diaPerfecto * 100) + '%+</span>' +
    '<span><i class="plata"></i>50%+</span>' +
    '<span><i class="bronce"></i>algo</span>' +
    '<span><i class="vacio"></i>nada</span>' +
    '<span><i class="sucio"></i>monstruo</span></div>';
  return out;
}

/* =========================== RENDER: MOCHILA ============================= */

function pintarMochila() {
  var gg = g();
  var html = '<div class="g-sec-title">MOCHILA</div><div class="g-cols grid"><div class="g-panel">';
  if (!gg.equipo.length) {
    html += '<div class="g-sub center" style="line-height:2">Vacía.<br>Compra equipo en la tienda<br>y aparece aquí.</div>';
  } else {
    CFG.equipo.forEach(function (e) {
      if (gg.equipo.indexOf(e.id) === -1) return;
      var puesto = gg.puestos.indexOf(e.efecto) > -1;
      html += '<div class="g-item' + (puesto ? ' owned' : '') + '">' +
        '<div class="g-item-ico">' + e.ico + '</div>' +
        '<div class="g-item-b"><div class="g-item-n">' + esc(e.nombre) + '</div>' +
          '<div class="g-item-c">' + (puesto ? 'EQUIPADO' : 'GUARDADO') + '</div></div>' +
        '<button class="g-btn' + (puesto ? '' : ' gold') + '" data-act="equip" data-id="' + e.id + '">' +
          (puesto ? 'QUITAR' : 'PONER') + '</button></div>';
    });
  }
  html += '</div>';

  html += '<div class="g-panel"><div class="g-shelf-t" style="margin-top:0">— AJUSTES —</div>' +
    '<div class="g-item"><div class="g-item-ico">' + (gg.sonido ? '🔊' : '🔇') + '</div>' +
    '<div class="g-item-b"><div class="g-item-n">Sonido 8-bit</div>' +
    '<div class="g-item-c">' + (gg.sonido ? 'ENCENDIDO' : 'APAGADO') + '</div></div>' +
    '<button class="g-btn" data-act="sonido">' + (gg.sonido ? 'APAGAR' : 'ENCENDER') + '</button></div></div>';

  html += '<div class="g-panel"><div class="g-shelf-t" style="margin-top:0">— ÚLTIMOS PERMISOS —</div>';
  var esPermiso = {}; CFG.permisos.forEach(function (p) { esPermiso[p.id] = 1; });
  var ult = gg.compras.filter(function (c) { return esPermiso[c.itemId]; }).slice(-8).reverse();
  html += ult.length
    ? '<div class="g-sub" style="line-height:2.1">' + ult.map(function (c) {
        return '· ' + esc(c.nombre) + ' <span class="dim">(' + c.fecha + ')</span>'; }).join('<br>') + '</div>'
    : '<div class="g-sub center">Todavía no compras ningún permiso.</div>';
  html += '</div></div>';
  return html;
}

/* =========================== CIERRE DEL DÍA ============================== */

function debeCerrarDia() {
  var gg = g();
  if (gg.cierreVisto === hoy()) return false;
  if (new Date().getHours() < 20) return false;
  return !!motor().primerDia;
}
function pintarCierre() {
  var M = motor(), gg = g(), hs = habitos();
  var activos = hs.filter(function (h) { return !gg.graduados[h.id]; });
  var hechos = (M.porDia[hoy()] || []).length;
  var r = activos.length ? hechos / activos.length : 0;
  var golpesHoy = gg.golpes.filter(function (x) { return x.fecha === hoy(); }).length;

  var frase = r >= CFG.diaPerfecto ? 'El pueblo quedó contento.'
            : r >= 0.5             ? 'Cumplió lo que pudo.'
            : r > 0                ? 'Fue un día flojo, pero volvió.'
            :                        'Hoy no salió de la casa.';

  return '<div class="g-cierre-in">' +
    '<img src="' + ASSETS + 'milo_back.png" alt="Milo volviendo">' +
    '<div class="g-cierre-t">MILO VOLVIÓ AL PUEBLO</div>' +
    '<div class="g-cierre-d">' +
      '<div><b>' + hechos + '</b> de <b>' + activos.length + '</b> encargos</div>' +
      '<div>Confianza del pueblo: <b>' + M.confianza + '/100</b></div>' +
      (golpesHoy ? '<div class="mal">' + golpesHoy + ' golpe' + (golpesHoy > 1 ? 's' : '') + ' de monstruo</div>'
                 : '<div class="bien">Ningún monstruo te tocó</div>') +
    '</div>' +
    '<div class="g-cierre-f">' + frase + '</div>' +
    '<button class="g-btn gold" data-act="cierre-ok">DESCANSAR</button></div>';
}

/* ============================== RENDER GLOBAL =========================== */

function render() {
  if (!UI.on || !UI.mounted) return;
  try {
    sincronizarHp(); resolverJefe(); revisarGraduacion(); revisarMedallas();
    var M = motor();
    el('gPurse').textContent = num(M.baros);

    var cuerpo = el('gBody');
    if (UI.cierre) { cuerpo.innerHTML = '<div class="g-cierre">' + pintarCierre() + '</div>'; return; }

    var vista = { ficha:pintarFicha, tienda:pintarTienda,
                  logros:pintarLogros, mochila:pintarMochila }[UI.screen] || pintarFicha;
    cuerpo.innerHTML = vista();

    Array.prototype.forEach.call(document.querySelectorAll('#gameMode .g-nav button'), function (b) {
      b.classList.toggle('active', b.dataset.screen === UI.screen);
    });
  } catch (e) { console.error('[modo juego]', e); }
}

/* =============================== ACCIONES =============================== */

function alTocar(ev) {
  if (Date.now() < (UI.bloqueo || 0)) return;            // el toque que abrió el pueblo no marca nada
  var t = ev.target.closest('[data-act]'); if (!t) return;
  var act = t.dataset.act, id = t.dataset.id, gg = g();

  if (act === 'cierre-ok') {
    gg.cierreVisto = hoy(); save(); UI.cierre = false; sfx('nav'); render(); return;
  }

  if (act === 'dia') {
    var paso = parseInt(t.dataset.d, 10);
    var k = masDias(UI.fecha || hoy(), paso);
    if (k > hoy()) return;
    if (dias(k, hoy()) > 13) return;
    UI.fecha = (k === hoy()) ? null : k;
    sfx('nav'); render(); return;
  }

  if (act === 'quest') {
    var h = habitoPorId(id); if (!h) return;
    var k2 = UI.fecha || hoy(), d = fecha(k2);
    var estaba = window.isDone ? isDone(h.id, d) : false;
    var lvAntes = nivelDe(motor().xpArea[h.category] || 0);

    if (window.toggleDone) toggleDone(h.id, d);
    invalidar();

    if (!estaba) {
      sfx('marcar'); vibrar(18);
      flotante(ev, '+' + Math.round(xpBase(h) * motor().mult) + ' XP', '#8fe07a');
      var lvDespues = nivelDe(motor().xpArea[h.category] || 0);
      if (lvDespues > lvAntes) {
        setTimeout(function () {
          sfx('nivel'); vibrar([30, 60, 30]);
          grande(catNombre(h.category).toUpperCase() + '\nNIVEL ' + lvDespues);
        }, 240);
      }
    } else { sfx('desmarcar'); }
    render(); return;
  }

  if (act === 'area') { UI.filtro = (UI.filtro === id) ? null : id; sfx('nav'); render(); return; }

  if (act === 'hit') {
    var m = CFG.monstruos.filter(function (x) { return x.id === id; })[0]; if (!m) return;
    var ayer = t.dataset.w === '1';
    var costo = ayer ? m.hp : Math.round(m.hp * CFG.descuentoHonestidad);
    danio(costo);
    gg.golpes.push({ mId:m.id, fecha: ayer ? masDias(hoy(), -1) : hoy(), at: Date.now(), honesto: !ayer });
    if (!ayer) gg.lucidez++;
    save(); sfx('golpe'); vibrar([50, 40, 80]);
    flotante(ev, '−' + costo + ' ♥', '#ff8f82');
    toast(ayer ? m.nombre + ' te pegó. Reportarlo tarde sale caro.'
               : m.nombre + ' te pegó, pero lo dijiste de frente. +1 Lucidez.');
    UI.herido = true; render();
    setTimeout(function () { UI.herido = false; if (UI.on) render(); }, 1400);
    return;
  }

  if (act === 'buy-p') {
    var p = CFG.permisos.filter(function (x) { return x.id === id; })[0]; if (!p) return;
    if (enCritico()) { sfx('error'); toast('Estás muy débil. Recupérate primero.'); return; }
    if (motor().baros < p.baros) { sfx('error'); return; }
    var costoP = p.pesos || 0;
    if (costoP > 0 && (!fondoMes() || restanteFondo() < costoP)) {
      sfx('error'); toast(fondoMes() ? 'No alcanza el fondo de permisos.' : 'Define tu fondo del mes en PLATA.'); return;
    }
    gg.compras.push({ itemId:p.id, nombre:p.nombre, baros:p.baros, hp:p.hp, pesos:costoP, fecha:hoy(), at:Date.now() });
    danio(p.hp);
    if (costoP > 0) {
      var pl = modulo('plata');
      if (!Array.isArray(pl.movs)) pl.movs = [];
      pl.movs.push({
        id: (window.App && App.util && App.util.uid) ? App.util.uid('m') : 'milo' + Date.now(),
        fecha: hoy(), tipo:'gasto', monto:costoP, moneda:'CLP', tc:null, montoCLP:costoP,
        categoria:'Permisos Milo', nota:p.nombre, origen:'milo'
      });
      try { if (window.App && App.save) App.save('plata'); } catch (e2) { console.error('[modo juego] plata', e2); }
    }
    invalidar(); save(); sfx('moneda'); vibrar(25);
    flotante(ev, '−' + p.baros + (costoP ? ' −' + pesos(costoP) : ''), '#f2c14e');
    toast('Pagaste "' + p.nombre + '". Sin culpa.');
    render(); return;
  }

  if (act === 'buy-e') {
    var e2 = CFG.equipo.filter(function (x) { return x.id === id; })[0]; if (!e2) return;
    if (motor().baros < e2.baros || gg.equipo.indexOf(e2.id) > -1) { sfx('error'); return; }
    gg.compras.push({ itemId:e2.id, nombre:e2.nombre, baros:e2.baros, hp:0, fecha:hoy(), at:Date.now() });
    gg.equipo.push(e2.id); invalidar(); save(); sfx('moneda'); vibrar(25);
    flotante(ev, '−' + e2.baros, '#f2c14e');
    toast('Compraste ' + e2.nombre + '. Está en tu mochila.');
    render(); return;
  }

  if (act === 'equip') {
    var e3 = CFG.equipo.filter(function (x) { return x.id === id; })[0]; if (!e3) return;
    var i = gg.puestos.indexOf(e3.efecto);
    if (i > -1) gg.puestos.splice(i, 1);
    else {
      var fam = e3.efecto.split('-')[0];
      if (fam !== 'aura') gg.puestos = gg.puestos.filter(function (p) { return p.split('-')[0] !== fam; });
      gg.puestos.push(e3.efecto);
    }
    save(); sfx('nav'); render(); return;
  }

  if (act === 'sonido') {
    gg.sonido = !gg.sonido; save();
    if (gg.sonido) sfx('nivel');
    aplicarMute();
    musica(gg.sonido ? 'pueblo' : null);
    render(); return;
  }

  if (act === 'boss-yes') { if (gg.jefe) { gg.jefe.aceptado = true; save(); sfx('jefe'); toast('Aceptaste la pelea.'); render(); } return; }
  if (act === 'boss-no') {
    if (gg.jefe) {
      gg.ultimoJefeHabit = gg.jefe.habitId; gg.ultimoJefeAt = hoy(); gg.jefe = null;
      save(); sfx('nav'); toast('Lo dejaste pasar. No pasa nada.'); render();
    }
    return;
  }
}

/* ============================ ENTRAR / SALIR ============================= */

function crt(clase) {
  var d = document.createElement('div'); d.className = clase;
  document.body.appendChild(d);
  setTimeout(function () { d.remove(); }, 700);
}
/* música: la pone el motor de audio del juego de peleas (MG.audio), con fundidos */
function aplicarMute() {
  try { if (window.MG && MG.audio && MG.audio.setMuted) MG.audio.setMuted(!g().sonido); } catch (e) {}
}
function musica(id, fade) {
  try {
    var au = window.MG && MG.audio; if (!au) return;
    if (id && g().sonido) au.music(id);
    else if (au.stop) au.stop(fade || 1.2);
  } catch (e) {}
}
function hayMapa() { return !!(window.MG && MG.open); }
function entrar(opts) {
  if (UI.on) return;
  montar();
  UI.on = true; UI.screen = 'ficha'; UI.filtro = null; UI.fecha = null; UI.herido = false;
  UI.desdeJuego = !!(opts && opts.desdeJuego);
  UI.bloqueo = Date.now() + 500;
  invalidar(); quizasOfrecerJefe();
  UI.cierre = debeCerrarDia();
  el('gameMode').classList.add('on');
  el('gameMode').querySelector('.g-nav [data-screen="__mapa"]').style.display = hayMapa() ? '' : 'none';
  document.body.style.overflow = 'hidden';
  el('gBody').scrollTop = 0;
  crt('g-boot'); sfx('abrir'); render();
  aplicarMute();
  musica('pueblo');
}
function cerrarCapa() {
  UI.on = false;
  el('gameMode').classList.remove('on');
  document.body.style.overflow = '';
  // los avisos del juego no se quedan flotando sobre el modo normal
  document.querySelectorAll('.g-toast, .g-levelup').forEach(function (n) { n.remove(); });
  toastN = 0;
}
function salir() {
  if (!UI.on) return;
  cerrarCapa();
  crt('g-shut'); sfx('cerrar');
  musica(null, 1.2);                 // fundido suave, sin corte seco
  if (window.App) App.refresh();     // HOY muestra el XP/nivel recién ganado
}
// vuelve al mapa del juego de peleas (la música hace el fundido al tema del mapa)
function volverAlMapa() {
  if (!UI.on) return;
  if (!hayMapa()) { salir(); return; }
  cerrarCapa(); sfx('nav');
  MG.open('map');
}

/* ================================ MONTAJE =============================== */

function montar() {
  if (UI.mounted) return;
  var wrap = document.createElement('div');
  wrap.id = 'gameMode';
  wrap.innerHTML =
    '<div class="g-frame">' +
      '<div class="g-banner">' +
        '<div class="g-title g-wood">' + CFG.titulo + '</div>' +
        '<div class="g-purse g-wood"><span class="g-coin"></span><span id="gPurse">0</span></div>' +
      '</div>' +
      '<div class="g-body" id="gBody"></div>' +
      '<div class="g-nav">' +
        [['__mapa','mapa','MAPA','Volver al mapa del juego'], ['tienda','tienda','TIENDITA','Tiendita'],
         ['logros','logros','CRÓNICA','Crónica y logros'], ['mochila','mochila','MOCHILA','Mochila y ajustes'],
         ['__salir','salir','SALIR','Salir a la app']].map(function (n) {
          return '<button data-screen="' + n[0] + '" title="' + n[3] + '" aria-label="' + n[3] + '">' +
                 '<img src="' + ASSETS + 'icon_' + n[1] + '.png" alt=""><span>' + n[2] + '</span></button>';
        }).join('') +
      '</div></div>';
  document.body.appendChild(wrap);

  wrap.querySelector('.g-nav').addEventListener('click', function (ev) {
    var b = ev.target.closest('button[data-screen]'); if (!b) return;
    if (Date.now() < (UI.bloqueo || 0)) return;
    if (UI.cierre && b.dataset.screen !== '__salir' && b.dataset.screen !== '__mapa') return;   // el cierre se despacha primero
    var s = b.dataset.screen;
    if (s === '__salir') { salir(); return; }
    if (s === '__mapa') { volverAlMapa(); return; }
    UI.screen = (UI.screen === s) ? 'ficha' : s;
    UI.filtro = null; UI.fecha = null;
    el('gBody').scrollTop = 0; sfx('nav'); render();
  });
  el('gBody').addEventListener('click', alTocar);
  wrap.querySelector('.g-title').addEventListener('click', function () {
    if (UI.cierre) return;
    UI.screen = 'ficha'; UI.filtro = null; UI.fecha = null; sfx('nav'); render();
  });

  UI.mounted = true;
}

function ponerBoton() {
  if (el('gmToggle')) return;
  var b = document.createElement('button');
  b.id = 'gmToggle'; b.className = 'gm-toggle'; b.textContent = '⚔ MODO JUEGO';
  // V8: el botón abre el juego de peleas; el modo clásico queda en "El Pueblo" del mapa
  b.addEventListener('click', function () { if (window.MG && MG.open) MG.open(); else entrar(); });
  var host = document.querySelector('.top-bar .status-area') || document.querySelector('.top-bar');
  if (host) host.appendChild(b);
}

/* ================================= INIT ================================= */

function init() {
  ponerBoton();
  try {
    if (typeof window.renderAll === 'function') {
      var orig = window.renderAll;
      window.renderAll = function () {
        var r = orig.apply(this, arguments);
        invalidar();
        if (UI.on) render();
        return r;
      };
    }
  } catch (e) { console.warn('[modo juego] no pude enganchar renderAll', e); }

  // Esc: si llegaste desde el mapa del juego, vuelves al mapa; si no, sales a la app
  document.addEventListener('keydown', function (ev) {
    if (ev.key !== 'Escape' || !UI.on) return;
    if (UI.desdeJuego && hayMapa()) volverAlMapa(); else salir();
  });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();

window.MODO_JUEGO = { entrar:entrar, salir:salir, volverAlMapa:volverAlMapa, render:render, aplicarMute:aplicarMute, CFG:CFG, estado:g, motor:motor, invalidar:invalidar };

})();
