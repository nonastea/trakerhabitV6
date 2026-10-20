# MILO · EL GRAN NOQUEO — contrato del modo juego V8

Juego de peleas contra jefes estilo dibujo animado de los años 30 (inspirado en Cuphead, sin copiar personajes ni arte de Cuphead): Milo corre, salta, dispara con el dedo, hace dash, parry a lo rosado y suelta súper. Mapa de islas con 4 jefes que son los "malos hábitos" de Josué, cada uno con su dificultad calculada con sus datos reales.

Todo es **vanilla JS + Canvas 2D, sin imágenes**: los personajes se dibujan con código (formas temblorosas con contorno de tinta, brazos de manguera, guantes blancos, ojos "pac-man"). Música y sonidos se generan con Web Audio.

## Archivos (cada agente escribe SOLO los suyos)

| Archivo | Dueño | Qué es |
|---|---|---|
| `core.js` | orquestador | Motor: bucle, escenas, entrada, efectos, arte, puente con la app, clases base y la escena `fight`. **No se toca.** |
| `player.js` | agente jugador | `MG.Player` + `MG.hud` |
| `boss_rasquina.js`, `boss_pantallon.js` | agente jefes A | 2 jefes |
| `boss_gaston.js`, `boss_flojera.js` | agente jefes B | 2 jefes |
| `screens.js` | agente pantallas | escenas `title`, `map`, `shop`, `results` |
| `audio.js` | agente audio | `MG.audio` |
| `dev.html` | orquestador | página de pruebas: `dev.html?scene=fight&boss=rasquina` |

Orden de carga: core → audio → player → boss_* → screens. Todos son IIFE `(function(){ 'use strict'; ... })();` y usan `window.MG`.

## Lo que da core.js (léelo entero antes de escribir)

- `MG.W=1280, MG.H=720`. Suelo de la pelea: `arena.floorY = 620`. Todo se dibuja en esas coordenadas.
- Utilidades: `MG.clamp lerp rand randi pick dist angle ease.{outBack,outCubic,inOut,outElastic} hitCC(c1,c2) hitRC(rect,circ)`.
- Arte `MG.art` (alias A): colores `ink paper cream red orange milo miloDark pink gold blue green purple sky1 sky2`; `A.frame` (contador de frames); `A.j(i, amp)` (ruido que "hierve" a 12 fps, úsalo en contornos para el temblor de dibujo a mano); `A.blob(ctx,x,y,rx,ry,fill,{wob,lw,rot,seed,shade,line,points})`; `A.hose(ctx,x1,y1,x2,y2,bend,width,color)`; `A.glove(ctx,x,y,r,ang)`; `A.eyes(ctx,x,y,size,lookX,lookY,mood)`; `A.shadow`; `A.text(ctx,str,x,y,size,{fill,stroke,align,font:'title'|'ui',lw})`; `A.star`; `A.cloud`; `A.sky(ctx,top,bottom)`; `A.rays`; `A.puff`.
- Efectos `MG.fx`: `shake(amp,time) flash(color,time) slowmo(scale,time) freeze(frames) starBurst(x,y,color)` (devuelve un efecto para `arena.effects`).
- Entrada `MG.input` (alias I): `I.is(a)`, `I.pressed(a)`, `I.released(a)`, `I.ok()` con acciones `left right up down jump shoot dash ex lock confirm back pause`. Teclado: flechas/WASD, Z/Espacio salto, X disparo, Shift/C dash, V súper, F fijar posición, Enter confirmar, Esc pausa. Táctil y mando ya incluidos. `MG.pointer = {x,y,t}` = último toque en coordenadas del lienzo (para menús táctiles; trátalo como "clic" si `performance.now()-t < 120` y luego ponlo en null).
- Escenas: `MG.scene(nombre, {enter(params), update(dt), draw(ctx), drawUI(ctx), exit(), noFilm})`. `draw` va bajo el filtro de película; `drawUI` va encima (texto nítido). `MG.go(nombre, params)` hace la transición de iris.
- `MG.open(escena?, params?)` / `MG.close()`.
- Datos: `MG.data.player()` → `{maxHp, dmgMult, charm, nivel, superStart, razones:[3 textos]}`; `MG.data.bossScale(id)` → `{difficulty 0.8–1.4, razon}`; `MG.data.store()` → `{wins:{id:{wins,best,bestPts,bestTime,tries}}, charms:[], equipped, map:{x,y}, seenIntro}` (guardar con `MG.data.persist()`); `MG.data.baros()`; `MG.data.buyCharm(id)`; `MG.data.equip(id)`; `MG.CHARMS` (4 amuletos).

## Escena `fight` (ya hecha en core.js) — cómo usa a los demás

```
arena = { W, H, floorY:620, t, player, boss, enemyProj:[], playerProj:[], effects:[], stats:{parries, exUsed, hitsTaken},
          def (registro del jefe), scale:{difficulty,razon}, pstats (MG.data.player()), onParry(p), addEffect(e) }
```
Cada frame: `player.update(dt, input)` → `boss.update(dt)` → proyectiles `.update(dt, arena)` → colisiones:
- bala del jugador (círculo `{x,y,r}`, campo `dmg`) contra cada `boss.hurtboxes[i]` (círculos) → `boss.takeDamage(dmg*dmgMult)`, `bala.dead=true`, `bala.onHit?.(arena)`, `player.onBulletHit?.(dmg, bala)`.
- `enemyProj` (con `harmless!==true`) contra `player.hurtbox()` → `player.hit()` (si `player.invuln<=0`). `pierce:true` no se destruye al pegar.
- `boss.hitboxes` (círculos `{x,y,r}` o rectángulos `{x,y,w,h}`) contra `player.hurtbox()` → daño por contacto.
- efectos: objetos `{update(dt,arena) → false para borrarse, draw(ctx), back?:bool}` en `arena.effects`.
Intro de 2,1 s (cartel con `def.nombre` y `def.intro`), luego `boss.start?.()`. KO → `¡NOQUEADO!` → escena `results`. Muerte → pantalla de derrota con barra de progreso.

## `MG.Player` (player.js)

```
class Player { constructor(arena, pstats)
  x, y (pies), vx, vy, facing (1|-1), hp, maxHp, invuln (s), dead, superMeter (0..5 cartas), onGround
  update(dt, input)   // input puede venir {} durante la intro: Milo queda quieto
  draw(ctx)
  hurtbox() → {x,y,r} | null   (null mientras está invencible por dash con amuleto 'humo')
  hit()                // −1 vida, invuln 1,6 s con parpadeo, retroceso; hp 0 → dead=true + animación
  onBulletHit(dmg)     // carga súper (≈ 1 carta cada 90 de daño); con amuleto 'cafe' también sube solo
}
MG.hud = { draw(ctx, player, arena) }   // vida "HP 3" estilo carta, 5 cartas de súper, barra de vida del jefe chiquita (opcional)
```

## Jefes (boss_*.js)

```
MG.registerBoss({ id, nombre, area, intro:'frase corta de presentación', music:id, parTime:segundos,
  color, mapIcon(ctx, x, y, s, t)   // ícono para el mapa (dibujado con código)
  create(arena, opts) → instancia de una clase que extiende MG.Boss })
```
Extiende `MG.Boss` (ver core): `super(arena, {hp, phases:[.66,.33], difficulty: opts.difficulty, x, y})`; usa `this.after(seg, fn)`, `this.every(seg, fn)` (se acelera con la dificultad), `this.spawn({x,y,vx,vy,r,grav,pink,life,spin,bounce,onDraw(ctx),onUpdate(dt,arena),pierce,harmless})`, `this.fx(efecto)`, `this.onPhase(n)`, `this.onDeath()`. En cada `update(dt)` llama `this.baseUpdate(dt)` y actualiza `this.hurtboxes`/`this.hitboxes`. Dibuja escenario en `drawBackground(ctx,t)` (parallax, mínimo 3 capas) y al jefe en `draw(ctx,t)`; `drawForeground` opcional.

## `MG.audio` (audio.js)

`unlock()` (en el primer toque), `music(id|null)` con ids `title map shop results rasquina pantallon gaston flojera`, `sfx(name)` con `shoot hit parry hurt death knockout announcer phase jump dash ex tick select buy iris coin`, `stop()`, `duck(bool)` (baja volumen en pausa), `setMuted(bool)`, `muted`.

## Reglas de estilo

- Look: papel envejecido, tinta negra gruesa, colores de acuarela desaturados, animación elástica (squash & stretch), todo "respira" (hervor de líneas con `A.j`, balanceo constante con `Math.sin(t)`).
- Textos en español neutro, con humor. Nada de personajes, nombres ni frases de Cuphead.
- Rendimiento: iPhone a 60 fps → evita `shadowBlur`, `ctx.filter` y crear gradientes por frame (cachéalos).
- Accesible en táctil: los menús se manejan con flechas + confirmar **y** tocando (MG.pointer).

## Bazar ampliado: ataques y ropa (V8.1)

La escena `shop` tiene tres estantes (pestañas a la derecha; teclado: arriba/abajo estante, izquierda/derecha ítem, SALTO compra/equipa; toque: tocar ítem, tocar de nuevo o botón grande): AMULETOS, ATAQUES (vitrinas de vidrio) y ROPA (prendas colgadas + espejo con Milo probándose la prenda seleccionada).

- `MG.SHOTS` (`dedazo` gratis, `abanico` 200, `buscadora` 260, `chorro` 220) y `MG.ROPA` (`gorro` cabeza 150, `lentes` cara 180, `bufanda` cuello 120, `capa` espalda 300; ranuras en `MG.SLOTS`).
- `MG.data.store()` suma `shots[]` (siempre incluye `dedazo`), `shot` (equipado), `ropa[]`, `vestido {cabeza,cara,cuello,espalda}` (ids o null); se normaliza solo, los guardados viejos siguen sirviendo.
- Compras: `D.buyItem(item, key, after)` compartida (registra `itemId 'v8-'+id` en `state.game.compras`, o `devBaros` en dev). Atajos `buyCharm/buyShot/buyRopa`, `equipShot(id)`, `toggleRopa(id)`; comprar equipa de inmediato.
- `D.player()` expone además `shot`, `vestido`, `puestos`; las razones suman «Disparo: <nombre>» (la ficha del mapa crece a la medida).
- `D.puestos()` lee `MODO_JUEGO.estado().puestos` (defensivo); `D.look()` = `{vestido, puestos}`.
- Ataques (player.js, balas con la interfaz de siempre): `abanico` 3 balas ±0,22 rad, dmg 1,7, mueren a 620 px; `buscadora` 700 px/s, gira ≤4 rad/s hacia la hurtbox más cercana, dmg 3,2, 7/s; `chorro` 10/s, dmg 5,2, muere a 380 px. EX y súper no cambian. `MG.shotIcon(ctx,id,s,t)` dibuja el ícono para la tienda.
- Ropa y equipo: `MG.wear` (player.js) dibuja `hat/glasses/scarf/cape/aura` en la geometría del cuerpo de Milo; `Player.draw` y `drawMilo(ctx,x,y,s,{look})` las usan (en el dash de humo y el fantasma no se dibuja ropa). Del pueblo: `hat-brown`/`hat-gold` (el gorro del bazar gana), `tint-blue`/`tint-green` (cuerpo y mechón), `aura` (halo morado).
