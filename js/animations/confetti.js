/* ==========================================================================
   CONFETI — lluvia continua para las pantallas de logro
   (Fase II, Fase III y libro terminado), como en la referencia: pocas piezas
   repartidas por toda la pantalla (las del grupo "ELEMENTOS CONFETI" de
   Figma), cayendo sin parar mientras la pantalla está abierta.
   GSAP sobre elementos del DOM, sin librerías extra.

   · Cada pieza es plana y mantiene su forma e inclinación (no gira sobre sí
     misma); cae con su propia velocidad y se balancea un poco a los lados.
     Al llegar abajo se desvanece y vuelve a empezar arriba en otra posición.
   · Al entrar, las piezas ya están repartidas a distintas alturas.
   · Capa con pointer-events: none, por encima del fondo y por debajo de los
     botones. Todo se elimina al cerrar la pantalla (función que devuelve).

   ┌──────────────────────────── AJUSTES ────────────────────────────┐ */
export const CONFETTI = {
  countPhase: 22,              // piezas en pantalla en Fase II y Fase III
  countBook: 34,               // piezas en libro terminado
  fallDuration: [4.5, 7],      // segundos que tarda una pieza en cruzar la pantalla
  // Las piezas del grupo "ELEMENTOS CONFETI" de Figma: rectángulos de 26×10
  // (radio 2) y círculos de 10, en granate, rosa y crema.
  pieces: [
    { w: 26, h: 10, r: 2, color: '#24070f' },
    { w: 10, h: 10, r: 5, color: '#24070f' },
    { w: 26, h: 10, r: 2, color: '#ff81e6' },
    { w: 10, h: 10, r: 5, color: '#ff81e6' },
    { w: 26, h: 10, r: 2, color: '#fdf3ea' },
    { w: 10, h: 10, r: 5, color: '#fdf3ea' },
  ],
  sway: [6, 18],               // px de balanceo lateral
  fadeAt: 0.85,                // empieza a desvanecerse a este % del recorrido
};
/* └─────────────────────────────────────────────────────────────────┘ */

const W = 402;
const H = 874;
const rand = (min, max) => min + Math.random() * (max - min);

/** Una pieza: cae (plana, con su inclinación fija), se balancea y se desvanece; luego vuelve a empezar. */
function animatePiece(el, firstProgress) {
  const fall = rand(...CONFETTI.fallDuration);
  const x0 = rand(8, W - 8);
  const sway = rand(...CONFETTI.sway) * (Math.random() < 0.5 ? -1 : 1);

  const tl = gsap.timeline({ onComplete: () => animatePiece(el, 0) });
  gsap.set(el, { x: x0, y: -30, rotation: rand(0, 360), opacity: 1 }); // inclinación fija al azar
  tl.to(el, { y: H + 30, duration: fall, ease: 'none' }, 0)
    // balanceo lateral
    .to(el, { x: x0 + sway, duration: fall / 4, ease: 'sine.inOut', yoyo: true, repeat: 3 }, 0)
    .to(el, { opacity: 0, duration: fall * (1 - CONFETTI.fadeAt), ease: 'power1.in' }, fall * CONFETTI.fadeAt);
  if (firstProgress) tl.progress(firstProgress); // arranca ya a media caída
  el._tl = tl;
}


/**
 * Lanza la lluvia de confeti sobre una pantalla.
 * @param {HTMLElement} screen
 * @param {{ count?: number }} [o]
 * @returns {() => void} detiene y elimina todo
 */
export function launchConfetti(screen, { count = CONFETTI.countPhase } = {}) {
  const layer = document.createElement('div');
  layer.className = 'confetti';
  layer.style.cssText = 'position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:1';
  screen.append(layer);

  const pieces = [];
  for (let i = 0; i < count; i++) {
    const el = document.createElement('i');
    const p = CONFETTI.pieces[i % CONFETTI.pieces.length]; // reparto equilibrado de formas y colores
    el.style.cssText = `position:absolute;left:0;top:0;width:${p.w}px;height:${p.h}px;background:${p.color};border-radius:${p.r}px;will-change:transform,opacity`;
    layer.append(el);
    pieces.push(el);
    // repartidas desde el principio: cada una empieza en un punto distinto de su caída
    animatePiece(el, Math.random() * 0.8);
  }

  return () => {
    pieces.forEach((el) => { el._tl?.kill(); gsap.killTweensOf(el); });
    layer.remove();
  };
}
