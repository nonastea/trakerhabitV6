# SETUP — Sincronizar V6 entre Mac y iPhone

Tiempo total: **~12 minutos**. Hazlo una sola vez.

---

## PASO 1 — Subir la app a GitHub Pages (5 min)

> Solo si no lo hiciste ya. Si tu repo ya está publicado, salta al PASO 2.

1. Abre tu repo en github.com.
2. Si la carpeta `TRACKEADOR_HABITOS_V6` aún no está subida:
   - Arrastra los archivos al repo desde la web (`Add file → Upload files`), o
   - Desde el Mac:
     ```bash
     cd "/Users/josu/Desktop/Proyectos/Programacion/habit traker/FORMATO_HTML/TRACKEADOR_HABITOS_V6"
     git init
     git add .
     git commit -m "V6.1 — PWA + offline + cloud sync"
     git branch -M main
     git remote add origin https://github.com/<TU_USUARIO>/<TU_REPO>.git
     git push -u origin main
     ```
3. En el repo: **Settings → Pages**
4. **Source**: `Deploy from a branch`
5. **Branch**: `main` · **Folder**: `/ (root)` · **Save**
6. Espera ~1 min. GitHub te muestra arriba la URL: `https://<usuario>.github.io/<repo>/`
7. Abre esa URL en el Mac → debe cargar la app.

> Si los archivos no están en la raíz sino dentro de una carpeta `TRACKEADOR_HABITOS_V6/`, tu URL será `https://<usuario>.github.io/<repo>/TRACKEADOR_HABITOS_V6/`.

---

## PASO 2 — Crear el "buzón" en JSONBin (3 min)

1. Entra a **https://jsonbin.io** y crea cuenta gratis (con email o con Google).
2. En el panel **CREATE BIN** (botón arriba):
   - Borra el contenido placeholder y deja solo: `{}`
   - **Bin Name**: `habitos-v6` (opcional, ayuda a identificarlo)
   - Marca **PRIVATE** (recomendado)
   - Click **CREATE**
3. Una vez creado, copia el **BIN ID** que aparece en la URL del bin o arriba del editor. Se ve así: `665a1b2c3d4e5f6789012345`.
4. Ve a **API Keys** (menú izquierdo) → copia tu **Master Key** (`X-Master-Key`). Se ve así: `$2a$10$abcdef...`.

> Guarda Bin ID y Master Key en un lugar seguro (apple Notes con candado o 1Password). Los necesitas en ambos dispositivos.

---

## PASO 3 — Conectar el Mac (1 min)

1. Abre tu URL de GitHub Pages en Safari o Chrome del Mac.
2. Ve a **AJUSTES** (rueda dentada arriba derecha) → desplázate hasta **AJUSTES AVANZADOS** → ábrelo.
3. Sección **SINCRONIZACIÓN EN LA NUBE**:
   - Pega tu **BIN ID** en el primer campo
   - Pega tu **API KEY** en el segundo
   - Click **PROBAR Y GUARDAR** → debe decir `CONEXIÓN OK · CREDENCIALES GUARDADAS`
   - Marca el checkbox **Sincronización automática**
4. Crea o edita cualquier hábito → espera 3 segundos → el estado debe mostrar `CONECTADO · AUTO ON · ÚLTIMA SYNC: recién`.

---

## PASO 4 — Conectar el iPhone (2 min)

1. Abre tu URL de GitHub Pages en **Safari** (importante: Safari, no Chrome).
2. Botón **Compartir** (cuadrado con flecha hacia arriba) → **Agregar a inicio** → **Añadir**.
3. Ahora tienes el ícono de Hábitos en la pantalla de inicio. Ábrela **desde ese ícono** (así corre en modo pantalla completa, como app nativa).
4. **AJUSTES → AJUSTES AVANZADOS → SINCRONIZACIÓN EN LA NUBE**:
   - Pega el **mismo BIN ID** y la **misma API KEY** del PASO 2
   - **PROBAR Y GUARDAR** → `CONEXIÓN OK`
   - Activa **Sincronización automática**
5. Toca **SINCRONIZAR AHORA** → debe bajar los hábitos que creaste en el Mac.

---

## PASO 5 — Verificar que todo funciona (1 min)

| Prueba | Esperado |
|---|---|
| En el Mac, marca un hábito. Espera 3 s. Abre el iPhone, toca **SINCRONIZAR AHORA** | Aparece marcado |
| En el iPhone, crea una tarea nueva. Espera 3 s. Recarga la página en el Mac | Aparece la tarea |
| Cierra todas las apps del iPhone, abre Hábitos sin internet (modo avión) | La app abre con los datos cacheados; verás `SIN CONEXIÓN — los cambios se subirán al volver la red` |
| Quita modo avión | Aparece `CONEXIÓN RECUPERADA — SINCRONIZANDO` y sube lo que hayas editado |

Si los 4 puntos pasan, **está listo**.

---

## Reglas de oro para que nunca pierdas datos

1. **Espera 3 segundos** después de editar antes de cerrar la app. Es el debounce del auto-sync.
2. **Antes de editar en el otro dispositivo**, abre la app y déjala 2 segundos arriba para que termine el `pull` automático.
3. Si tienes dudas, toca **SINCRONIZAR AHORA** manualmente: primero baja lo de la nube, después sube lo tuyo. Es la operación más segura.
4. El modelo es *last-write-wins*: si editas Mac e iPhone en paralelo sin sincronizar entre medio, **gana el último cambio**. Para ti solo, no es problema; solo evita editar simultáneo en ambos lados.

---

## Diagnóstico rápido si algo falla

| Síntoma | Causa probable | Solución |
|---|---|---|
| `CONEXIÓN FALLIDA` en el Mac | Bin ID o API Key mal pegados | Copia de nuevo desde jsonbin.io |
| `HTTP 401` | API Key incorrecta | Genera una nueva en jsonbin.io → API Keys |
| `HTTP 404` | Bin ID incorrecto o bin eliminado | Verifica en jsonbin.io que el bin existe |
| iPhone no baja cambios | Olvidaste activar **Sincronización automática** | Marca el checkbox en Ajustes Avanzados |
| Safari ofrece zoom al tocar un input | Versión vieja cacheada por el SW | Cierra y reabre la PWA; o en Safari `aA → Recargar sin caché` |
| Después de actualizar el código no veo los cambios | Service Worker sirve la versión anterior | Sube `CACHE_VERSION` en `sw.js` (ej. `habitos-v6-2`), commit, push; al abrir, se actualiza solo |

---

## ¿Qué se sube exactamente a la nube?

Todo tu estado **menos las credenciales**:
- Hábitos, completions, tareas activas, tareas archivadas, log de tareas
- Eventos del calendario, categorías, configuración visual (tema, título, etc.)

No se suben:
- API Key, Bin ID (se quedan solo en cada dispositivo)
- `lastSyncAt` (es local de cada dispositivo)

El payload son ~10–30 KB. Estás muy lejos del límite de 100 KB del plan free de JSONBin.
