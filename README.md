# TRACKEADOR_HABITOS_V8

V6 + modo juego Milo + cuatro áreas nuevas en una sola app: **HOY · HÁBITOS · CUERPO (piel, entreno, medidas, semana) · PLATA · DATOS**.

## Estructura (una carpeta por área)

| Carpeta | Qué hay |
|---|---|
| `index.html` | El marcado de la V6 y el orden de carga. Casi no se toca. |
| `core/` | `core.js` y `core.css` = la V6 separada del HTML · `app.js` = API de módulos · `modules.css` = componentes comunes · `sync.js` = nube (Gist) |
| `modules/hoy` | Pantalla de entrada: lo que te toca ahora, hábitos de hoy, tareas, registro rápido |
| `modules/piel` | Check-in de dermatitis + historial importado del Excel (`data/piel-historial.json`) |
| `modules/gym` | Entreno precargado con tu plan, peso en ayunas con promedio semanal, medidas cada 4 semanas, checklist y alertas |
| `modules/plata` | Gastos, ingresos e inversiones (CLP/USD), fondo de permisos y meta de inversión |
| `modules/datos` | Exportar para Claude (copiar / .json / CSV), cruces rápidos y acceso a Estadísticas, Calendario, Tareas y Ajustes |
| `game/` | Milo, ahora conectado a los módulos y a la plata real |

Para agregar un área nueva: carpeta en `modules/`, un `App.register({...})` y una línea `<script>` en `index.html`. Las reglas están en `CONTRATO_MODULOS.md`.

## Publicar (GitHub Pages)

Usa un **repositorio nuevo** (por ejemplo `trakerhabitV7`) en la misma cuenta que la V6. Al quedar en el mismo dominio `*.github.io`, la V7 lee sola tu progreso local de la V6 la primera vez que la abres en cada dispositivo.

## Nube (reemplaza JSONBin)

JSONBin gratis no alcanza: 100 KB por bin y 10.000 solicitudes en total. Solo el historial de la piel ya pesa unos 55 KB.

1. En GitHub, ve a Settings → Developer settings → Personal access tokens → **Tokens (classic)** → Generate new token. Marca **solo** el permiso `gist`.
2. En la app, ve a Ajustes → Ajustes avanzados → Sincronización en la nube. Pega el token, deja el GIST ID vacío y toca **PROBAR Y GUARDAR**. La app crea un Gist secreto.
3. En el otro dispositivo pega el mismo token y el GIST ID que aparece en el primero.

Si en ese dispositivo tenías la V6 con JSONBin, aparece el botón **TRAER DESDE V6 (JSONBIN)**. Úsalo una vez para juntar ese progreso.

## Atajo "Foto piel" (iPhone)

El botón de la app abre `shortcuts://run-shortcut?name=Foto piel`. Para crear el atajo en la app Atajos:

1. Nuevo atajo. Nómbralo **Foto piel**.
2. Agrega la acción **Elegir de la lista**, con tus zonas (Cuello, Codos, Espalda…).
3. Agrega **Tomar foto**.
4. Agrega **Fecha actual** y luego **Formatear fecha**, con formato personalizado `yyyy-MM-dd`.
5. Agrega **Establecer nombre**: `Fecha formateada_Elemento elegido`.
6. Agrega **Guardar archivo**: iCloud Drive › Piel, con "Preguntar dónde guardar" desactivado.

## Pendiente de Josué

- Reemplazar el plan de gym de ejemplo por el tuyo, en CUERPO › ENTRENO › Editar plan.
- Ajustar los precios en pesos de los permisos de Milo, en `game/game.js` › `CFG.permisos`.

## V8 · Milo: El gran noqueo (modo juego)

El botón **⚔ MODO JUEGO** ahora abre un juego de peleas contra jefes estilo dibujo animado de 1930, hecho 100 % con código (sin imágenes ni archivos de audio). Vive en `game2/`.

- **Mapa "Las Islas del Encargo"**: caminas con Milo entre 4 islas, El Bazar y El Pueblo (el modo clásico de la V7). El letrero del pueblo muestra cuántos encargos llevas hoy (por ejemplo, 3/7).
- **4 jefes = tus malos hábitos**, cada uno con 3 fases: La Rasquiña (piel), El Pantallón (pantalla de noche), Don Gastón (plata) y La Flojera (gym).
- **Conectado a tus datos**:
  - Cada jefe se pone más difícil según tu semana real: picor promedio, minutos entre soltar la pantalla y acostarte, gasto vs. el mes pasado y entrenos de la semana.
  - Tu forma te da vida extra, tu confianza aumenta el daño y el XP de registro te da súper inicial.
  - Ganar da baros para Milo, una vez al día por jefe. Amuletos, ataques y ropa se compran con baros reales.
- **Controles**:
  - Teclado: flechas para moverte, Z salto, X disparo, Shift dash, V súper, F para fijar la posición, Esc pausa y M para silenciar (el mismo interruptor que "Sonido 8-bit" del pueblo y el botón ♪ en el celular).
  - Mando compatible.
  - En el celular hay botones en pantalla, con modo AUTO para disparo continuo. Conviene jugarlo en horizontal.
- `game2/dev.html?scene=fight&boss=gaston` abre una pelea directa para pruebas. El contrato entre archivos está en `game2/CONTRATO_JUEGO.md`.

### V8.1 · Pueblo y bazar

- **El Pueblo ↔ el mapa**: desde el pueblo vuelves al mapa con el botón **MAPA** de la barra (o con Esc). **SALIR** te deja en la app. El mapa viejo del pueblo se quitó porque repetía el del juego.
- **Música**: el pueblo tiene su propio tema (`pueblo` en `game2/audio.js`). Entre el mapa y el pueblo la música cambia con un fundido. Al salir a la app se apaga en 1,2 s. Sigue el ajuste "Sonido 8-bit" de la mochila.
- **Pantalla**: en vertical, el pueblo se ve en una columna con la barra abajo. En horizontal (computador o celular acostado), la barra pasa a la izquierda y el contenido se reparte en columnas. Todo vive en el final de `game/game.css`.
- **El Bazar de la Tía Tortuga** tiene tres estantes:
  - **Amuletos**: los mismos de antes.
  - **Ataques**: Dedazo, Abanico, Gota buscadora y Chorro a presión.
  - **Ropa**: gorro, lentes, bufanda y capa. Una prenda por ranura, y se pueden combinar.
  - La ropa y el equipo comprado en la tiendita del pueblo (sombrero, corona, tinturas, aura) se ven en Milo en las peleas y en el mapa.

### V8.2 · Milo coronado (20-oct-2026)

- **Ícono del celular**: Milo coronado y feliz, fijo (`assets/icon-*.png`, más `icon-maskable-512.png` para Android).
- **Computador**: la pestaña del navegador muestra un Milo coronado al azar entre 8 caras (`assets/fav/`).
- HOY y el modo juego quedan como estaban (se probaron caras por situación y se descartaron).
