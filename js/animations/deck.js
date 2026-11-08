/* ==========================================================================
   ANIMACIONES · MAZO DEL CLUB (11.1 → 11.2)
   · drawCard        "Robar carta": la carta de arriba se levanta, crece hasta
                     el tamaño de la carta de 11.2 y el fondo pasa a azul.
   · enterCardScreen al llegar a 11.2: la carta (que llega del revés) se gira
                     para enseñar su cara; la pila y los textos aparecen.
   · bindCardGestures en 11.2:
       - arrastrar hacia arriba (Draggable): pasado el umbral sale despedida
         por arriba y la siguiente sube desde la pila; si no, muelle de vuelta.
       - tocar: giro 3D al reverso y vuelta.
   ========================================================================== */

/* Carta grande de 11.2 (Figma): 362×548 en (20, 159) → centro (201, 433) */
const BIG = { cx: 201, cy: 433, w: 362 };
const SWIPE_THRESHOLD = 120;   // px hacia arriba para pasar carta
const SWIPE_VELOCITY = 0.9;    // px/ms (un golpe rápido también pasa carta)

/**
 * 11.1 — levantar la carta de arriba y llevarla al tamaño de 11.2.
 * @param {HTMLElement} screen
 * @param {HTMLElement} card   la .deck-card de arriba del mazo
 * @param {() => void} done    se llama al terminar (navega a 11.2)
 */
export function drawCard(screen, card, done) {
  // fondo azul de 11.2 que va cubriendo la pantalla por debajo de la carta
  const veil = document.createElement('div');
  veil.style.cssText = 'position:absolute;inset:0;background:var(--c-blue);opacity:0;z-index:9;pointer-events:none';
  screen.append(veil);
  card.style.zIndex = 10;

  const box = { x: parseFloat(card.style.left) + 115, y: parseFloat(card.style.top) + 174.09 }; // centro actual
  const tl = gsap.timeline({ onComplete: done });
  tl.to(card, { y: -36, rotation: 0, scale: 1.05, boxShadow: '0 18px 24px rgba(0,0,0,0.25)', duration: 0.32, ease: 'back.out(2)' })
    .to(card, { x: BIG.cx - box.x, y: BIG.cy - box.y, scale: BIG.w / 230, boxShadow: '0 4px 4px rgba(0,0,0,0.25)', duration: 0.5, ease: 'power3.inOut' })
    .to(veil, { opacity: 1, duration: 0.4, ease: 'power1.inOut' }, '<0.05');
  return tl;
}

/**
 * 11.2 → 11.1 (volver) — primera mitad, en 11.2: lo contrario de enterCardScreen.
 * Los textos y la pila se van y la carta se gira hasta enseñar su reverso.
 */
export function leaveCardScreen(screen, done) {
  const inner = screen.querySelector('#card .dcard__inner');
  const tl = gsap.timeline({ onComplete: done });
  tl.to(screen.querySelectorAll('#counter, .hint, .back'), { opacity: 0, y: 10, duration: 0.3, stagger: 0.04, ease: 'power2.in' }, 0)
    .to(screen.querySelectorAll('.pile, #card-under'), { y: -20, opacity: 0, duration: 0.3, stagger: 0.03, ease: 'power2.in' }, 0.05)
    .to(inner, { rotationY: 180, duration: 0.6, ease: 'power2.inOut' }, 0);
  return tl;
}

/**
 * 11.2 → 11.1 (volver) — segunda mitad, en 11.1: lo contrario de drawCard.
 * La carta empieza del tamaño de 11.2 sobre el fondo azul; se encoge mientras
 * el azul se va, queda un instante levantada y se posa en el mazo.
 * @param {number} rotation  giro de la carta en la pila (Figma)
 */
export function returnCardToDeck(screen, card, rotation, done) {
  const veil = document.createElement('div');
  veil.style.cssText = 'position:absolute;inset:0;background:var(--c-blue);z-index:9;pointer-events:none';
  screen.append(veil);
  card.style.zIndex = 10;

  const box = { x: parseFloat(card.style.left) + 115, y: parseFloat(card.style.top) + 174.09 };
  gsap.set(card, { x: BIG.cx - box.x, y: BIG.cy - box.y, rotation: 0, scale: BIG.w / 230 });
  const tl = gsap.timeline({ onComplete: () => { veil.remove(); card.style.zIndex = ''; gsap.set(card, { clearProps: 'boxShadow' }); done?.(); } });
  tl.to(card, { x: 0, y: -36, scale: 1.05, boxShadow: '0 18px 24px rgba(0,0,0,0.25)', duration: 0.5, ease: 'power3.inOut' })
    .to(veil, { opacity: 0, duration: 0.4, ease: 'power1.inOut' }, 0.05)
    .to(card, { y: 0, rotation, scale: 1, boxShadow: '0 4px 4px rgba(0,0,0,0.25)', duration: 0.32, ease: 'back.out(2)' });
  return tl;
}

/** 11.2 — entrada: la carta llega del revés (como sale de 11.1) y se gira. */
export function enterCardScreen(screen) {
  const inner = screen.querySelector('#card .dcard__inner');
  const tl = gsap.timeline();
  tl.set(inner, { rotationY: 180 })
    .from(screen.querySelectorAll('.pile'), { y: -20, opacity: 0, duration: 0.35, stagger: 0.04, ease: 'power2.out' }, 0)
    .to(inner, { rotationY: 0, duration: 0.65, ease: 'power2.inOut' }, 0.1)
    .from(screen.querySelectorAll('#counter, .hint, .back'), { opacity: 0, y: 10, duration: 0.4, stagger: 0.06, ease: 'power2.out' }, 0.35);
  return tl;
}

/**
 * 11.2 — gestos sobre la carta activa.
 * @param {HTMLElement} screen
 * @param {{ count:number, next:() => void }} o
 * @returns {() => void} limpieza
 */
export function bindCardGestures(screen, { count, next }) {
  const card = screen.querySelector('#card');
  const inner = screen.querySelector('#card .dcard__inner');
  if (!card || !window.Draggable || count === 0) return () => {};
  gsap.registerPlugin(Draggable);

  let flipped = false;
  let busy = false;
  let samples = [];

  const flip = () => {
    if (busy) return;
    flipped = !flipped;
    gsap.to(inner, { rotationY: flipped ? 180 : 0, duration: 0.6, ease: 'power2.inOut' });
  };

  const springBack = () =>
    gsap.to(card, { x: 0, y: 0, rotation: 0, duration: 0.7, ease: 'elastic.out(1, 0.55)' });

  // Pasar carta: la activa sale por arriba y deja ver la siguiente, que ya estaba debajo
  const throwAway = (vx) => {
    busy = true;
    drag.disable();
    gsap.timeline({
      onComplete: () => {
        next();
        flipped = false;
        gsap.set(inner, { rotationY: 0 });
        // la siguiente ya estaba debajo con su contenido: la activa vuelve a su
        // sitio al instante (ahora con esa misma carta) y debajo se pinta la otra
        gsap.set(card, { x: 0, y: 0, rotation: 0, scale: 1, opacity: 1 });
        busy = false;
        drag.enable();
        // el contador cambia con un pequeño salto
        gsap.fromTo(screen.querySelector('#counter'), { y: 8, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, ease: 'power2.out' });
      },
    }).to(card, { y: -900, x: `+=${vx * 160}`, rotation: vx * 18 || -6, duration: 0.42, ease: 'power2.in' });
  };

  const [drag] = Draggable.create(card, {
    type: 'x,y',
    edgeResistance: 0.6,
    zIndexBoost: false,
    onPress() { samples = [{ x: this.x, y: this.y, t: performance.now() }]; },
    onDrag() {
      samples.push({ x: this.x, y: this.y, t: performance.now() });
      if (samples.length > 5) samples.shift();
      gsap.set(card, { rotation: this.x * 0.06 }); // se inclina un poco al moverla a los lados
    },
    onRelease() {
      const a = samples[0];
      const b = samples[samples.length - 1] ?? a;
      const dt = Math.max(16, b.t - a.t);
      const vy = (b.y - a.y) / dt;
      const vx = (b.x - a.x) / dt;
      if (this.y < -SWIPE_THRESHOLD || vy < -SWIPE_VELOCITY) throwAway(vx);
      else springBack();
    },
    onClick: flip, // un toque sin arrastrar gira la carta
  });

  return () => { drag.kill(); gsap.killTweensOf([card, inner]); };
}
