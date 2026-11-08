/* ==========================================================================
   ANIMACIÓN · SELLADO DE LA PROFECÍA (frames 6.2 → 6.3 → 6.4)
   El sobre cerrado (Group 111) se va haciendo pequeño sin cortes, pasando por
   los tamaños de 6.2 (ocupa la pantalla) y 6.3, hasta su sitio en 6.4.
   Después el sello (Group 110) se posa encima:

     0.00  6.2  sobre cerrado gigante
     0.30  ┐ empieza a encogerse
     0.95  │ pasa por el tamaño de 6.3 (sin pararse)
     1.65  ┘ llega a 6.4 con un pequeño asentamiento
     1.75  el sello cae desde más grande → impacto → rebote; el sobre acusa el golpe
     2.25  entran "Carta sellada", el subtítulo, la etiqueta y el botón

   Para ajustar tiempos o curvas, toca las constantes de abajo.
   ========================================================================== */

/* Estados del bloque .env (origen arriba a la izquierda), sacados de Figma */
const FULL = { x: -498, y: -253, scale: 3.75 };  // 6.2: la carta desborda la pantalla por los cuatro lados (sin franjas crema)
const MID = { x: -221.09, y: -79, scale: 805.088 / 362 };     // 6.3: 805.09×556 en (-201.09, 159)
const DONE = { x: 0, y: 0, scale: 1 };                        // 6.4: 362×250 en (20, 238)

/* Arranque nítido: con el sobre a 3,75× ni el PNG a 8x llega a la resolución
   de la pantalla. Durante el arranque, encima va envelope-closed-full@4x.png:
   el MISMO sobre de 6.4 (mismo SVG, mismas sombras) ya ampliado al estado FULL
   y dibujado a resolución de pantalla completa (fuentes-figma/envelope-full.html).
   Va dentro de .env, cubriendo justo la pantalla (402×874 en coordenadas de la
   pantalla → ÷ escala en coordenadas del sobre), y se funde al empezar a
   encogerse. Como es el mismo dibujo, el fundido no se nota. */
const ENV_ORIGIN = { left: 20, top: 238 }; // .env en la pantalla (css/envelope.css)
const FULL_IMG = {
  left: -(ENV_ORIGIN.left + FULL.x) / FULL.scale,
  top: -(ENV_ORIGIN.top + FULL.y) / FULL.scale,
  width: 402 / FULL.scale,
  height: 874 / FULL.scale,
};
const FULL_FADE = 0.35; // s que tarda en fundirse (PARA REVISAR)

const SHRINK_START = 0.3;
const SHRINK_DURATION = 1.35;
const SEAL_AT = 1.75;
const TEXTS_AT = 2.25;

/**
 * @param {HTMLElement} screen  la pantalla 6.4 (con el sobre y los textos)
 * @returns {gsap.core.Timeline}
 */
export function playSealAnimation(screen) {
  const q = (s) => screen.querySelector(s);
  const env = q('.env');
  const seal = q('.env__seal');
  const texts = screen.querySelectorAll('.sealed-text');

  // Nitidez: el sobre llega a 3,75× su tamaño. Con transformaciones 3D (lo que GSAP
  // usa por defecto al animar) el navegador lo convierte en un mapa de bits a su
  // tamaño pequeño y lo estira: se veía pixelado, sobre todo en el iPhone. Con
  // force3D: false cada frame se vuelve a dibujar el SVG a su tamaño real.
  // Estado inicial = 6.2
  gsap.set(env, { ...FULL, transformOrigin: '0 0', force3D: false });
  const full = document.createElement('img');
  full.src = 'assets/img/envelope-closed-full@4x.png';
  full.alt = '';
  full.style.cssText = `left:${FULL_IMG.left}px;top:${FULL_IMG.top}px;width:${FULL_IMG.width}px;height:${FULL_IMG.height}px`;
  env.insertBefore(full, seal);
  gsap.set(seal, { opacity: 0 });
  gsap.set(texts, { opacity: 0, y: 16 });

  const tl = gsap.timeline({ defaults: { force3D: false } });

  // El sobre se encoge sin parar: 6.2 → 6.3 → 6.4. Keyframes en array con una
  // sola curva para todo el recorrido: pasa exactamente por 6.3 sin frenar.
  tl.to(env, {
    keyframes: {
      x: [FULL.x, MID.x, DONE.x],
      y: [FULL.y, MID.y, DONE.y],
      scale: [FULL.scale, MID.scale, DONE.scale],
      easeEach: 'none',
    },
    duration: SHRINK_DURATION,
    ease: 'power3.inOut',
  }, SHRINK_START)
    // el sobre grande nítido se funde al empezar a encoger (y se quita)
    .to(full, { opacity: 0, duration: FULL_FADE, ease: 'power1.in', onComplete: () => full.remove() }, SHRINK_START + 0.05)
    // pequeño asentamiento al llegar
    .fromTo(env, { rotation: -1.2 }, { rotation: 0, duration: 0.5, ease: 'back.out(3)', transformOrigin: '50% 50%' }, SHRINK_START + SHRINK_DURATION - 0.2);

  // El sello se posa encima: cae, impacta y rebota un poco
  tl.fromTo(seal,
    { opacity: 0, scale: 1.9, y: -46, filter: 'drop-shadow(0 26px 18px rgba(36,7,15,0.25))' },
    { opacity: 1, scale: 1, y: 0, filter: 'drop-shadow(0 3px 3px rgba(36,7,15,0.25))', duration: 0.38, ease: 'power3.in' }, SEAL_AT)
    .to(seal, { keyframes: [{ scale: 1.07, duration: 0.09, ease: 'power1.out' }, { scale: 1, duration: 0.35, ease: 'back.out(3)' }] })
    .to(env, { keyframes: [{ scaleY: 0.975, duration: 0.08, ease: 'power1.out' }, { scaleY: 1, duration: 0.4, ease: 'back.out(3)' }], transformOrigin: '50% 100%' }, '<-0.44')
    .set(seal, { clearProps: 'filter' });

  // Textos y botón
  tl.to(texts, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out', stagger: 0.09 }, TEXTS_AT);

  // Dejarlo todo "limpio" al terminar (mismo aspecto que el 6.4 estático)
  tl.add(() => {
    gsap.set(env, { clearProps: 'transform,transformOrigin' });
    gsap.set([seal, ...texts], { clearProps: 'transform,opacity' });
  });

  return tl;
}
