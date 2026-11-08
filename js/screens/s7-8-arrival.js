/* ==========================================================================
   7 y 8 · HAS LLEGADO AL CAPÍTULO X
   7  Tu profecía sellada, con el sello de lacre: "toca el sello para romperlo"
      (el texto parpadea despacio para indicar la acción).
   8  Sello roto: lees tu profecía y te calificas (acerté / casi / ni de lejos).
   "Ver qué profetizó el club" → 4 del capítulo · "Seguir leyendo" → Home
   (o el logro que toque: fase II, fase III o libro terminado).

   7 → 8 (tocar el sello): la pantalla no cambia, solo la card central.
     1. el sello tiembla y se parte en dos por la línea en zigzag de Figma
        (grupos 127 y 128 sobre los sellos 110 y 125, encima del frame 7);
     2. las dos mitades se separan y caen girando mientras se desvanecen;
     3. la card pierde el fondo rosa y las líneas, y en 8 entra la profecía,
        los botones de veredicto y "la honestidad ante todo".
   La cabecera y los botones de abajo son idénticos en 7 y 8, así que el
   cambio de pantalla se hace sin transición (skipNextTransition).
   ========================================================================== */

import { IMG, esc } from '../components/ui.js';
import { state, update, pendingAchievement } from '../core/state.js';
import { go, skipNextTransition } from '../core/router.js';

const VERDICTS = [
  { key: 'acerte', label: 'acerté', w: 107 },
  { key: 'casi',   label: 'casi',   w: 108 },
  { key: 'lejos',  label: 'ni de lejos', w: 107 },
];

/* ---------- Animación (PARA REVISAR: constantes) ---------- */
const BLINK_MIN_OPACITY = 0.25; // "toca el sello para romperlo": opacidad más tenue
const BLINK_HALF_CYCLE = 0.9;   // s de encendido a apagado
const SHAKE_DURATION = 0.32;    // s que tiembla el sello antes de partirse
const SPLIT_DURATION = 0.9;     // s que tardan las mitades en separarse y caer
const SPLIT_FALL = 150;         // px que caen las mitades
const SPLIT_APART = 46;         // px que se separa cada mitad hacia su lado
const SPLIT_TILT = 24;          // grados que gira cada mitad

/* Sello de 7: botón de 140×138.6 en (131, 347); la imagen sobresale 9px a la izquierda */
const SEAL = { left: 131, top: 347, w: 140, h: 138.6 };

/* Línea de rotura (Figma): zigzag vertical entre x = 59 y x = 80 del sello,
   con un pico cada 17px empezando en y = −7 (bordes de los grupos 127 y 128). */
const CRACK = Array.from({ length: 11 }, (_, k) => [k % 2 ? 80 : 59, -7 + 17 * k]);
const OUT = 40; // margen para que el recorte no corte la sombra del sello
const LEFT_CLIP = [[-OUT, -OUT], [59, -OUT], ...CRACK, [CRACK[CRACK.length - 1][0], SEAL.h + OUT], [-OUT, SEAL.h + OUT]];
const RIGHT_CLIP = [[59, -OUT], [SEAL.w + OUT, -OUT], [SEAL.w + OUT, SEAL.h + OUT], [CRACK[CRACK.length - 1][0], SEAL.h + OUT], ...CRACK.slice().reverse()];
const polygon = (pts) => `polygon(${pts.map(([x, y]) => `${x}px ${y}px`).join(', ')})`;

const findProphecy = (params) =>
  state.prophecies.find((p) => p.id === params.id) ??
  state.prophecies.find((p) => p.author === 'me' && p.reveal === state.currentChapter);

/* Al salir hacia la lectura: si has alcanzado un logro sin ver (fase II, III o libro), se enseña. */
function continueReading() {
  const achievement = pendingAchievement();
  if (achievement) go('logro', { id: achievement.id });
  else go('2');
}

const shared = (ch) => `
  <p class="f-text s20 c-dark center cx" style="left:200px;top:80px">Has llegado al</p>
  <h1 class="f-display s58 c-dark center cx" style="left:201.5px;top:112px">Capítulo ${ch}</h1>
  <button class="btn btn--dark" data-nav="4" data-params='{"ch":${ch}}' style="left:20px;top:732px;width:362px">ver que profetizó el club</button>
  <button class="link c-pink cx" data-continue style="left:201.5px;top:802px">seguir leyendo</button>`;

function bindContinue(el) {
  el.querySelector('[data-continue]').addEventListener('click', continueReading);
}

const sealImg = () => `<img src="${IMG('seal-wax-large@8x.png')}" alt="" style="position:absolute;left:-9px;top:0;width:149px;height:147.569px">`;

/** Rompe el sello: tiembla, se parte en dos por el zigzag y las mitades caen. */
function breakSeal(screen, done) {
  const seal = screen.querySelector('#seal');
  const stage = document.getElementById('stage');

  // Las dos mitades van en el lienzo (no en la pantalla) para seguir cayendo
  // mientras la card cambia a 8.
  const halves = [LEFT_CLIP, RIGHT_CLIP].map((clip) => {
    const half = document.createElement('div');
    half.className = 'seal-half';
    half.style.cssText = `position:absolute;left:${SEAL.left}px;top:${SEAL.top}px;width:${SEAL.w}px;height:${SEAL.h}px;z-index:20;pointer-events:none;clip-path:${polygon(clip)};-webkit-clip-path:${polygon(clip)}`;
    half.innerHTML = sealImg();
    return half;
  });

  // force3D: false → el sello y sus mitades se redibujan nítidos en cada frame
  // (con 3D el navegador estiraba un mapa de bits y se veían pixelados)
  const tl = gsap.timeline({ defaults: { force3D: false } });
  // 1. tiembla (el sello entero)
  tl.to(seal, { keyframes: { rotation: [0, -5, 4, -3, 2, 0], scale: [1, 1.04, 1.04, 1.03, 1.02, 1] }, duration: SHAKE_DURATION, ease: 'none', transformOrigin: '50% 50%' })
    // 2. se parte: las mitades sustituyen al sello y se separan cayendo
    .add(() => {
      halves.forEach((h) => stage.append(h));
      seal.style.visibility = 'hidden';
      done(); // la card empieza a cambiar ya, con las mitades aún cayendo
    })
    .to(halves[0], { x: -SPLIT_APART, rotation: -SPLIT_TILT, duration: SPLIT_DURATION, ease: 'power2.out', transformOrigin: '30% 60%' }, '>')
    .to(halves[1], { x: SPLIT_APART, rotation: SPLIT_TILT, duration: SPLIT_DURATION, ease: 'power2.out', transformOrigin: '70% 60%' }, '<')
    .to(halves, { y: SPLIT_FALL, duration: SPLIT_DURATION, ease: 'power2.in' }, '<')
    .to(halves, { opacity: 0, duration: SPLIT_DURATION * 0.45, ease: 'power1.in', onComplete: () => halves.forEach((h) => h.remove()) }, `<${SPLIT_DURATION * 0.55}`);
  return tl;
}

export const ArrivalSealed = {
  id: '7',
  render(params) {
    const p = findProphecy(params);
    const ch = state.currentChapter;
    return `
    <section class="screen" data-screen="7">
      ${shared(ch)}
      <span class="card-bg" style="left:21px;top:291px;width:362px;height:250px;border:2px solid var(--c-dark);border-radius:10px;background:var(--c-pink-30)"></span>
      <p class="f-text s20 c-blue center cx card-title" style="left:201.5px;top:311px">tu profecía sellada en el cap. ${p?.madeAt ?? ch - 1}</p>
      <span class="card-line" style="left:99px;top:391px;width:205px;height:10px;background:var(--c-dark-20)"></span>
      <span class="card-line" style="left:57px;top:411px;width:289px;height:10px;background:var(--c-dark-20)"></span>
      <span class="card-line" style="left:99px;top:431px;width:205px;height:10px;background:var(--c-dark-20)"></span>

      <!-- Sello: al tocarlo se rompe → 8 -->
      <button id="seal" aria-label="Romper el sello" style="left:${SEAL.left}px;top:${SEAL.top}px;width:${SEAL.w}px;height:${SEAL.h}px">${sealImg()}</button>
      <p class="f-text s20 c-dark-50 center cx card-hint" style="left:201.5px;top:561px"><span class="seal-blink">toca el sello para romperlo</span></p>
    </section>`;
  },
  mount(el, params) {
    bindContinue(el);
    if (!window.gsap) {
      el.querySelector('#seal').addEventListener('click', () => { const p = findProphecy(params); go('8', p ? { id: p.id } : {}, { replace: true }); });
      return null;
    }

    // "toca el sello para romperlo" parpadea despacio (indica acción)
    const blink = gsap.to(el.querySelector('.seal-blink'), {
      opacity: BLINK_MIN_OPACITY, duration: BLINK_HALF_CYCLE, ease: 'sine.inOut', repeat: -1, yoyo: true,
    });

    let broken = false;
    el.querySelector('#seal').addEventListener('click', () => {
      if (broken) return;
      broken = true;
      blink.kill();
      const p = findProphecy(params);
      breakSeal(el, () => {
        // la card se vacía (fondo rosa, líneas y textos) y pasa a 8 sin transición
        gsap.timeline({ onComplete: () => { skipNextTransition(); go('8', { ...(p ? { id: p.id } : {}), reveal: 1 }, { replace: true }); } })
          .to(el.querySelector('.card-bg'), { backgroundColor: 'rgba(255,129,230,0)', duration: 0.35, ease: 'power1.inOut' }, 0)
          .to(el.querySelectorAll('.card-line'), { opacity: 0, scaleX: 0.6, duration: 0.25, stagger: 0.04, ease: 'power2.in' }, 0)
          .to(el.querySelector('.card-title'), { color: '#24070F', duration: 0.35, ease: 'power1.inOut' }, 0)
          .to(el.querySelector('.card-hint'), { opacity: 0, duration: 0.2, ease: 'power1.in' }, 0);
      });
    });
    return () => blink.kill();
  },
};

export const ArrivalReveal = {
  id: '8',
  render(params) {
    const p = findProphecy(params);
    const ch = state.currentChapter;
    return `
    <section class="screen" data-screen="8">
      ${shared(ch)}
      <span class="card-bg" style="left:21px;top:291px;width:362px;height:250px;border:2px solid var(--c-dark);border-radius:10px"></span>
      <p class="f-text s20 c-dark center cx card-title" style="left:202.5px;top:311px">tu profecía sellada en el cap. ${p?.madeAt ?? ch - 1}</p>
      <p class="f-display s20 c-dark center wrap card-quote" style="left:36px;top:402px;width:332px;line-height:1.1;text-transform:uppercase;transform:translateY(-50%)">“${esc(p?.text ?? '')}”</p>

      <div class="verdicts" role="group" aria-label="¿Se cumplió?">
        ${VERDICTS.map((v) => `<button class="verdict" data-v="${v.key}" aria-pressed="${p?.verdict === v.key}" style="width:${v.w}px">${v.label}</button>`).join('')}
      </div>
      <p class="f-text s20 c-dark-50 center cx card-hint" style="left:201.5px;top:561px">la honestidad ante todo</p>
    </section>`;
  },
  mount(el, params) {
    bindContinue(el);

    // Viniendo de romper el sello (7): solo se anima el contenido de la card
    if (params.reveal && window.gsap) {
      gsap.timeline()
        // la profecía va centrada en vertical con translateY(-50%): se mantiene
        .fromTo(el.querySelector('.card-quote'), { opacity: 0, yPercent: -50, y: 14 }, { opacity: 1, yPercent: -50, y: 0, duration: 0.5, ease: 'power3.out' }, 0.1)
        .from(el.querySelectorAll('.verdict'), { opacity: 0, y: 10, duration: 0.4, stagger: 0.06, ease: 'power2.out', clearProps: 'opacity,transform' }, 0.3)
        .from(el.querySelector('.card-hint'), { opacity: 0, duration: 0.35, ease: 'power1.out', clearProps: 'opacity' }, 0.45);
      history.replaceState(null, '', location.hash.replace(/&?reveal=1/, '').replace('?&', '?').replace(/\?$/, ''));
    }

    el.querySelector('.verdicts').addEventListener('click', (e) => {
      const btn = e.target.closest('.verdict');
      const p = findProphecy(params);
      if (!btn || !p) return;
      update(() => { p.verdict = btn.dataset.v; });
      el.querySelectorAll('.verdict').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
    });
  },
};
