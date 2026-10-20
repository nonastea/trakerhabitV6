# V7 · Contrato de módulos

La app es **una sola página** (`index.html`) y cada área vive en **su propia carpeta**:

```
index.html            marcado de la V6 + orden de carga de scripts
core/core.css         estilos de la V6 (5 temas)            — no tocar desde módulos
core/core.js          lógica de la V6 (hábitos, tareas...)  — no tocar desde módulos
core/app.js           API App (registro, datos, navegación, utilidades)
core/modules.css      componentes compartidos con prefijo m-  ← úsalos
core/sync.js          sincronización (GitHub Gist, un archivo por módulo)
modules/<id>/<id>.js  + <id>.css   ← cada módulo SOLO escribe en su carpeta
game/game.js          Milo
```

Orden de carga: core.js → app.js → sync.js → módulos → game.js → `App.boot()`.
Scripts clásicos (no ES modules), cada módulo envuelto en una IIFE `(function(){ 'use strict'; ... })();`.
Variables globales del núcleo disponibles: `state`, `toggleDone(habitId, Date)`, `isDone(habitId, Date)`,
`startOfDay(Date)`, `showToast(msg)`, `switchView(view)`, `renderAll()`.

## Registro

```js
App.register({
  id: 'piel',                       // = clave en state y en localStorage ('habitos-v7:piel')
  defaults() { return { v: 1, dias: {} }; },   // forma inicial de los datos
  init() {},                        // opcional: corre una vez tras cargar datos, antes de init() del núcleo
  // A) vista propia en la barra (solo PLATA, DATOS, HOY usan esto):
  view: { id: 'plata', render(sectionEl) { ... } },
  // B) o pestañas dentro de una vista padre (CUERPO):
  subviews: [ { parent: 'cuerpo', id: 'piel', label: 'PIEL', order: 1, render(el) { ... } } ],
  hoyCards() { return [ { order: 10, html: '<div class="m-card accent hoy-card" data-go="cuerpo/piel">…</div>' } ]; },
  exportData() { return { ...datos limpios + _leeme: {campo: 'explicación'} }; },  // para "Exportar para Claude"
  exportCSV() { return { 'piel_diario.csv': App.util.toCSV(filas, columnas) }; }
});
```

- `render(el)` recibe el contenedor y **reconstruye su innerHTML** completo (plantillas de texto), y engancha
  eventos con delegación sobre `el` (`el.onclick = e => {...}` o `addEventListener` una sola vez usando una marca
  `el.dataset.wired`). Se llama cada vez que se abre la vista y después de cada `App.save()`.
- Estado de UI efímero (pestaña elegida, fecha que estás editando) en variables del módulo, no en `state`.
- Cualquier elemento con `data-go="cuerpo/gym"` navega solo (listener global).

## Datos

- `App.data(id)` → objeto `state[id]` (vivo). Mutarlo y luego `App.save(id)`.
- `App.save(id)` guarda en localStorage, marca para sincronizar, invalida el caché de Milo, emite `change` y
  re-renderiza la vista visible. `App.save(id, {noRender:true})` si estás escribiendo en un input y no quieres
  perder el foco.
- **Nunca** guardes fotos ni blobs. Fechas como `'YYYY-MM-DD'` local (`App.util.todayKey()`), horas `'HH:MM'`.
- `App.autoMarkHabit(/ejercicio|gym/i, 'YYYY-MM-DD')` marca (nunca desmarca) el hábito que calce.
- `App.on('change', id => ...)` para reaccionar a cambios de otros módulos.

## Utilidades `App.util`

`todayKey() keyOf(Date) parseKey(k) addDaysKey(k,n) daysBetween(a,b) mondayOf(k) weekKey(k)→'2026-W42'
monthKey(k)→'2026-10' esc(s) uid(prefijo) fmtNum(n,dec) fmtCLP(n) fmtUSD(n) toast(msg)
downloadFile(nombre, texto, mime) copyText(texto)→Promise<bool> toCSV(filas, columnas)`

## Estilo

Usar las clases `m-` de `core/modules.css` (m-card, m-label, m-title, m-row, m-btn[.primary/.small/.ghost/.block],
m-chips/m-chip.on, m-scale(.s10) con 11 o 10 botones, m-input(.num), m-select, m-field, m-seg, m-stat, m-alert(.ok/.bad),
m-list, m-bar>i, m-chart, m-grid2/m-grid3, m-stack, m-cols). Colores SOLO con variables CSS (`var(--cyan)`,
`--text`, `--text-bright`, `--text-dim`, `--success`, `--warning`, `--danger`, `--bg-1`, `--cyan-line`), así respetan
los 5 temas. Tu `<id>.css` solo para lo propio, con prefijo del módulo (`.piel-…`).
Móvil primero (390 px), objetivos táctiles ≥ 40 px, inputs a 16 px (evita el zoom de iOS), `<button>`/`<label>` reales.
Gráficos: SVG en línea, simples, eje Y ajustado al rango de los datos, líneas sólidas para la serie principal
y segmentadas para las secundarias, con leyenda.
Textos de la interfaz en español neutro, tuteo, MAYÚSCULAS solo en etiquetas cortas (estilo de la V6).

## Formas de datos acordadas (otros módulos y Milo las leen)

```js
state.piel = { v:1, legacyImportado:false, dias: { 'YYYY-MM-DD': {
  picor: 0-10|null, piel: 0-10|null, sueno: 1-10|null,
  pantalla:'HH:MM'|'', acostado:'HH:MM'|'', levantado:'HH:MM'|'',
  trat: { emoliente:['M','T','N'], tacrolimus:[], corticoide:[], hipoclorito:[] },   // M=mañana T=tarde N=noche
  nota:'', fotos:false, legacy:null|{...textos originales del Excel}, ts:number } } }
// La fecha es la de la MAÑANA del check-in; picor/sueño/horas hablan de la noche anterior;
// trat es lo aplicado ESE día (se puede ir marcando durante el día).

state.gym = { v:1,
  plan: { dias:[1,3,5], ejercicios:[{id, nombre, series, reps}] },        // 1=lunes … 7=domingo
  sesiones: [{id, fecha, items:[{ejId, nombre, sets:[{kg, reps}]}], ts}],
  peso: [{fecha, kg}],                                                     // en ayunas
  medidas: [{fecha, brazo, pecho, muslo, cintura, fotos:bool}],            // cm, cada 4 semanas
  semanas: { '2026-W42': {proteina:bool, sueno:bool, movilidad:bool, cerro:bool} },
  descargas: ['YYYY-MM-DD'] }                                              // inicio de cada semana de descarga

state.plata = { v:1,
  movs: [{id, fecha, tipo:'gasto'|'ingreso'|'inversion', monto, moneda:'CLP'|'USD', tc:number|null,
          montoCLP, categoria, nota, origen:''|'milo'}],
  categorias: { gasto:[...], ingreso:[...], inversion:[...] },
  fondoPermisos: { '2026-10': 30000 },      // CLP, lo fija Josué cada mes (Milo lo gasta)
  metaInversion: { '2026-10': 100000 } }    // CLP equivalentes
```
