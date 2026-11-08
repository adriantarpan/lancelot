/* ==========================================================================
   AL GALOPE — motor del minijuego (tipo "dinosaurio" de Chrome).
   El aspecto y los textos salen del frame 3 de Figma; aquí solo hay mecánica.

   · Poses (capas con nombre en Figma): "CABALLO 1" y "CABALLO 2" se alternan
     al correr; "CABALLO SALTO" en el aire. Parado, la pose del frame 3.
   · Saltar: tocar el escenario, el botón "salta", espacio o flecha arriba.
   · Todo se mueve con delta time (gsap.ticker): igual a 60, 90 o 120 Hz.
   · El contador de arriba es la puntuación, que sube con la distancia.
   · Al chocar: "¡Plof!" (piezas de Figma) y el récord se guarda en localStorage.

   ┌────────────────────────────────────────────────────────────────────────┐
   │  AJUSTES — todos los valores del juego están aquí                      │
   └────────────────────────────────────────────────────────────────────────┘ */

/* Velocidad */
const SPEED_START = 300;        // px/s al empezar cada partida
const SPEED_STEP = 15;          // px/s que se suman…
const SPEED_STEP_EVERY = 5;     // …cada estos segundos de partida
const SPEED_MAX = 650;          // px/s; a partir de aquí se mantiene

/* Puntuación */
const POINTS_PER_SECOND_AT_START = 10;                        // a 300 px/s → 10 puntos/s
const PX_PER_POINT = SPEED_START / POINTS_PER_SECOND_AT_START; // 30 px = 1 punto (proporcional a la velocidad)
const SCORE_MAX = 9999;                                        // el contador tiene 4 cifras

/* Pilas de libros según la puntuación: [mínimo, máximo] de libros (al azar dentro del rango) */
const PILE_TIERS = [
  { from: 0,   books: [1, 2] },   // 0–199 puntos
  { from: 200, books: [1, 3] },   // 200–499
  { from: 500, books: [2, 4] },   // 500 en adelante
];
const BOOK_H = 14;              // alto de cada libro (frame 3)

/* Separación entre pilas (segundos, aleatorio dentro del rango) */
const GAP_AT_START = [1.1, 2.0];   // a velocidad inicial
const GAP_AT_MAX = [0.8, 1.4];     // a velocidad máxima (se interpola entre ambos)
const GAP_SAFETY = 0.15;           // margen extra (s) tras aterrizar para poder volver a saltar

/* Salto: ~95 px de alto y ~0,62 s en el aire. La pila más alta (4 libros) mide 56 px:
   queda ~40 px de margen, sin que sobre tanto como para que sea demasiado fácil. */
const JUMP_HEIGHT = 95;
const JUMP_AIRTIME = 0.62;
const JUMP_V = (4 * JUMP_HEIGHT) / JUMP_AIRTIME;              // velocidad inicial hacia arriba
const GRAVITY = (2 * JUMP_V) / JUMP_AIRTIME;                  // px/s²

/* Animación del galope */
const RUN_FRAME_MS = 110;       // cambio de pose a velocidad inicial (se acelera con la velocidad)

/* Parpadeo lento de "toca para galopar" y "toca para volver a galopar" (indica acción) */
const BLINK_MIN_OPACITY = 0.25; // opacidad en el punto más tenue
const BLINK_HALF_CYCLE = 0.9;   // s de encendido a apagado (un ciclo completo = el doble)

/* ──────────────────────────────────────────────────────────────────────── */

import { IMG } from '../components/ui.js';

const ARENA_W = 362;
const GROUND_Y = 338;           // línea del suelo dentro del escenario (489 − 151 en Figma)
const HORSE_X = 40;             // 60 − 20
const HITBOX = { x: 16, w: 46, h: 50 };   // caja del caballo (algo menor que el dibujo)
const PILE_HIT = { x: 3, w: 32 };         // caja de la pila (sin los bordes redondeados)

const POSE = { idle: 'horse-a', run: ['caballo-1', 'caballo-2'], jump: 'caballo-salto' };

const lerp = (a, b, k) => a + (b - a) * k;
const randInt = (min, max) => min + Math.floor(Math.random() * (max - min + 1));

/* Pila de libros: los mismos rectángulos que en el frame 3 (lomo de color + páginas crema) */
const BOOKS = [
  { color: 'var(--c-blue)', dx: 1, flip: false },
  { color: 'var(--c-pink)', dx: 4, flip: false },
  { color: 'var(--c-blue)', dx: 0, flip: true },
  { color: 'var(--c-pink)', dx: 4, flip: false },
];
function pileHTML(n) {
  let html = '';
  const start = Math.floor(Math.random() * 4);
  for (let i = 0; i < n; i++) {
    const b = BOOKS[(start + i) % 4];
    const top = (n - 1 - i) * BOOK_H;
    const r = b.flip ? '0 1.837px 1.837px 0' : '1.837px 0 0 1.837px';
    html += `<span style="position:absolute;left:${b.dx}px;top:${top}px;width:36.184px;height:${BOOK_H}px;background:${b.color};border-radius:${r}"></span>
             <span style="position:absolute;left:${b.flip ? b.dx : b.dx + 6.24}px;top:${top + 1.94}px;width:29.939px;height:10.111px;background:var(--c-cream);border-radius:${r}"></span>`;
  }
  return html;
}

/**
 * @param {HTMLElement} root  la pantalla 3
 * @param {{ record:number, onRecord:(score:number)=>void }} o
 * @returns {() => void} limpieza
 */
export function createGalope(root, { record, onRecord }) {
  const arena = root.querySelector('.galope-arena');
  const horse = root.querySelector('.galope-horse');
  const horseImg = horse.querySelector('img');
  const ticks = root.querySelector('.galope-ticks');
  const counter = root.querySelector('.galope-meters');
  const recordEl = root.querySelector('.galope-record');
  const intro = root.querySelectorAll('.galope-intro');
  const over = root.querySelector('.galope-over');
  const startPile = root.querySelector('.galope-start-pile');

  // Los textos de acción parpadean despacio (el span interior; el texto entero
  // lo muestra y oculta el juego, así no se pisan las dos animaciones)
  const blink = gsap.to(root.querySelectorAll('.galope-blink'), {
    opacity: BLINK_MIN_OPACITY, duration: BLINK_HALF_CYCLE, ease: 'sine.inOut', repeat: -1, yoyo: true,
  });

  // Estado de la partida
  let mode = 'idle';            // idle | run | over (también en arena.dataset.mode)
  let t = 0;                    // segundos de partida
  let speed = SPEED_START;
  let score = 0;
  let y = 0;                    // altura del caballo sobre el suelo
  let vy = 0;
  let nextPileAt = 0;           // segundo de partida en que sale la siguiente pila
  let frameClock = 0;
  let frame = 0;
  let tickOffset = 0;
  const piles = [];             // { el, x, h }

  const setMode = (m) => { mode = m; arena.dataset.mode = m; };
  setMode('idle');
  const pad4 = (n) => String(Math.floor(n)).padStart(4, '0');
  const setPose = (name) => { horseImg.src = IMG(`game/${name}.svg`); };
  [POSE.idle, ...POSE.run, POSE.jump].forEach((n) => { new Image().src = IMG(`game/${n}.svg`); }); // precarga

  /* ---------- Reglas ---------- */
  const speedAt = (sec) => Math.min(SPEED_MAX, SPEED_START + SPEED_STEP * Math.floor(sec / SPEED_STEP_EVERY));
  const tierFor = (pts) => [...PILE_TIERS].reverse().find((tier) => pts >= tier.from);

  /** Tiempo hasta la siguiente pila: aleatorio en un rango que se estrecha con la
      velocidad, y nunca menor que lo necesario para aterrizar y volver a saltar. */
  function gapSeconds() {
    const k = (speed - SPEED_START) / (SPEED_MAX - SPEED_START);
    const min = lerp(GAP_AT_START[0], GAP_AT_MAX[0], k);
    const max = lerp(GAP_AT_START[1], GAP_AT_MAX[1], k);
    const safe = JUMP_AIRTIME + GAP_SAFETY + (HITBOX.w + PILE_HIT.w) / speed;
    return Math.max(safe, min + Math.random() * (max - min));
  }

  function spawnPile() {
    const [minB, maxB] = tierFor(score).books;
    const n = randInt(minB, maxB);
    const h = n * BOOK_H;
    const el = document.createElement('div');
    el.className = 'galope-pile';
    el.innerHTML = pileHTML(n);
    el.style.cssText = `position:absolute;left:0;top:${GROUND_Y - h}px;width:41px;height:${h}px`;
    arena.append(el);
    piles.push({ el, x: ARENA_W + 10, h });
    nextPileAt = t + gapSeconds();
  }

  function collides(p) {
    const hx = HORSE_X + HITBOX.x;
    const hBottom = GROUND_Y - y;
    const hTop = hBottom - HITBOX.h;
    const px = p.x + PILE_HIT.x;
    return px < hx + HITBOX.w && px + PILE_HIT.w > hx && hBottom > GROUND_Y - p.h + 4 && hTop < GROUND_Y;
  }

  /* ---------- Acciones ---------- */
  function jump() {
    if (mode === 'idle') return start();
    if (mode === 'over') return restart();
    if (y > 0.5) return; // ya está en el aire
    vy = JUMP_V;
    setPose(POSE.jump);
    gsap.fromTo(horse, { scaleY: 0.9, scaleX: 1.06 }, { scaleY: 1, scaleX: 1, duration: 0.25, ease: 'back.out(3)', transformOrigin: '50% 100%' });
  }

  function resetRun() {
    t = 0; speed = SPEED_START; score = 0; y = 0; vy = 0;
    frameClock = 0; frame = 0;
    nextPileAt = 0.8;
    counter.textContent = `${pad4(0)} m`;
    setPose(POSE.run[0]);
  }

  function start() {
    resetRun();
    setMode('run');
    gsap.to(intro, { opacity: 0, y: -10, duration: 0.3, ease: 'power2.in' });
    if (startPile) gsap.to(startPile, { opacity: 0, duration: 0.2, onComplete: () => startPile.remove() });
  }

  function restart() {
    piles.splice(0).forEach((p) => p.el.remove());
    gsap.to(over, { opacity: 0, scale: 0.9, duration: 0.2, ease: 'power2.in', onComplete: () => { over.style.visibility = 'hidden'; } });
    gsap.set(horse, { rotation: 0, x: 0, y: 0 });
    resetRun();
    setMode('run');
  }

  function crash() {
    setMode('over');
    setPose(POSE.jump);
    gsap.timeline()
      .to(horse, { x: -6, rotation: -14, duration: 0.12, ease: 'power2.out', transformOrigin: '50% 100%' })
      .to(horse, { x: 0, rotation: -6, duration: 0.35, ease: 'elastic.out(1, 0.4)' });
    const final = Math.floor(score);
    if (final > record) {
      record = final;
      onRecord(final); // se guarda en localStorage
      recordEl.textContent = `${final} m`;
      gsap.fromTo(recordEl, { scale: 1.3 }, { scale: 1, duration: 0.5, ease: 'back.out(3)' });
    }
    over.style.visibility = 'visible';
    gsap.fromTo(over, { opacity: 0, scale: 0.85, y: 10 }, { opacity: 1, scale: 1, y: 0, duration: 0.45, ease: 'back.out(2)', delay: 0.15 });
  }

  /* ---------- Bucle (delta time) ---------- */
  function tick(time, deltaMs) {
    if (mode !== 'run') return;
    const dt = Math.min(deltaMs, 50) / 1000; // si la pestaña se congela, no da saltos enormes
    t += dt;
    speed = speedAt(t);

    // puntuación proporcional a la distancia
    score = Math.min(SCORE_MAX, score + (speed * dt) / PX_PER_POINT);
    counter.textContent = `${pad4(score)} m`;

    // salto
    if (y > 0 || vy > 0) {
      vy -= GRAVITY * dt;
      y = Math.max(0, y + vy * dt);
      if (y === 0) {
        vy = 0;
        setPose(POSE.run[frame]);
        gsap.fromTo(horse, { scaleY: 0.92 }, { scaleY: 1, duration: 0.2, ease: 'back.out(3)', transformOrigin: '50% 100%' });
      }
    }
    gsap.set(horse, { y: -y, rotation: y > 0 ? gsap.utils.clamp(-10, 8, -vy / 60) : 0 });

    // galope: alterna CABALLO 1 / CABALLO 2
    if (y === 0) {
      frameClock += dt * 1000;
      if (frameClock > RUN_FRAME_MS * (SPEED_START / speed)) {
        frameClock = 0;
        frame = (frame + 1) % POSE.run.length;
        setPose(POSE.run[frame]);
      }
    }

    // suelo
    tickOffset = (tickOffset - speed * dt) % 15;
    ticks.style.transform = `translateX(${tickOffset}px)`;

    // pilas
    if (t >= nextPileAt) spawnPile();
    for (let i = piles.length - 1; i >= 0; i--) {
      const p = piles[i];
      p.x -= speed * dt;
      p.el.style.transform = `translateX(${p.x}px)`;
      if (p.x < -50) { p.el.remove(); piles.splice(i, 1); continue; }
      if (collides(p)) { crash(); return; }
    }
  }

  /* ---------- Controles ---------- */
  const onKey = (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') { e.preventDefault(); jump(); }
  };
  arena.addEventListener('pointerdown', jump);
  root.querySelector('.galope-jump').addEventListener('pointerdown', (e) => { e.preventDefault(); jump(); });
  addEventListener('keydown', onKey);
  gsap.ticker.add(tick);

  // Para probar desde la consola: $('.galope-arena')._debug.score = 450  ·  ._debug.time = 60
  arena._debug = {
    set score(v) { score = v; },
    set time(v) { t = v; },
    get state() { return { t, speed, score: Math.floor(score), piles: piles.length }; },
  };

  return () => {
    gsap.ticker.remove(tick);
    blink.kill();
    removeEventListener('keydown', onKey);
  };
}
