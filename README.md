# TRACKEADOR_HABITOS_V6

Tracker de hábitos, tareas y eventos. V6 trae **diseño responsive** (compatible con celular), **modo PWA** (instalable como app) y **sincronización en la nube** entre dispositivos.

## Novedades de V6

| Cambio | Detalle |
|---|---|
| Responsive | Layout de 1 columna en celular, nav como barra horizontal, KPIs 2×2, tablas con scroll |
| PWA | `manifest.json` + iconos → se instala en la pantalla de inicio del iPhone como app |
| Sincronización en la nube | El progreso se sube/baja solo entre computador y celular vía JSONBin.io |
| Safe-area | Respeta el notch y la barra inferior del iPhone |

Todo lo de V5 (5 estilos visuales, eventos del calendario, ajustes avanzados) sigue presente.

---

## 1. Cómo publicar la app (hosting gratis)

Para abrirla desde el celular necesitas una URL. La forma más rápida es **Netlify Drop**:

1. Entra a **app.netlify.com/drop**
2. Arrastra **toda la carpeta `TRACKEADOR_HABITOS_V6`** a la zona de drop
3. Netlify te da una URL del tipo `https://algo-random.netlify.app`
4. Abre esa URL en el Mac y en el iPhone — es la misma app

Alternativa: GitHub Pages, Vercel, Cloudflare Pages (cualquiera sirve, debe ser **HTTPS**).

### Instalar como app en el iPhone

1. Abre la URL en **Safari**
2. Toca el botón **Compartir** → **Agregar a inicio**
3. Queda un ícono en tu pantalla de inicio y se abre a pantalla completa, como app nativa

---

## 2. Cómo activar la sincronización en la nube

La app usa **JSONBin.io** (gratis) como almacén del progreso.

### Configurar JSONBin (una sola vez, ~5 min)

1. Entra a **jsonbin.io** y crea una cuenta gratis
2. En el panel, crea un **Bin nuevo**: pon `{}` como contenido y guarda
3. Copia el **BIN ID** (aparece en la URL del bin, o en su detalle)
4. Ve a **API Keys** y copia tu **Master Key**

### Conectar la app

1. Abre la app → **Ajustes → Ajustes Avanzados → Sincronización en la nube**
2. Pega el **Bin ID** y la **API Key**
3. Toca **PROBAR Y GUARDAR** — debe decir "CONEXIÓN OK"
4. Activa **Sincronización automática**
5. Repite los pasos 1-4 en el otro dispositivo con **el mismo Bin ID y API Key**

### Cómo funciona

- Cada cambio se sube solo ~2,5 segundos después de editar
- Al abrir la app, baja automáticamente lo último de la nube
- Botón **SINCRONIZAR AHORA** para forzar manualmente
- Modelo **last-write-wins**: si editas en dos lados casi a la vez, gana el cambio más reciente. Para un solo usuario es seguro.

---

## Vistas

| Vista | Qué muestra |
|---|---|
| Resumen | 4 KPIs + tabla semanal de hábitos |
| Hábitos | CRUD de hábitos con categorías |
| Estadísticas | Por hábito + selector SEMANAL/MENSUAL/ANUAL + chart global |
| Calendario | % cumplimiento por día + eventos con hora |
| Tareas | Contador semanal + gráfico + ACTIVAS + ARCHIVADAS |
| Ajustes | Clima, frase, exportar/importar, **Ajustes Avanzados** |

## Ajustes Avanzados

- **Sincronización en la nube** — Bin ID, API Key, auto-sync
- **Estilo visual** — 5 temas: Futurista, Minimalista, Elegante, Pinki, Grafiti
- **Pantalla** — editar título, subtítulo y marca central
- **Categorías** — nombre y color de cada categoría

## Tech

- HTML/CSS/JS vanilla. Sin frameworks ni build step.
- Persistencia local: `localStorage` (clave `habitos-explosivos-v6`)
- Sincronización: JSONBin.io API REST
- PWA: `manifest.json` + service-worker-free (cache del navegador)
- Clima: Open-Meteo API (Requínoa)

## Notas

- La sincronización requiere que la app corra desde **HTTPS** (hosting). Abierta como archivo local (`file://`) la nube puede fallar por CORS.
- La API Key se guarda solo en tu dispositivo (`localStorage`), no se sube al bin.
- Storage key independiente (`habitos-explosivos-v6`): no pisa V4/V5.

---

Marcelo Medina · 2026
