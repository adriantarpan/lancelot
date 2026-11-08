/* ==========================================================================
   LOGROS — frames "SCREEN LOGRO FASE II", "FASE III" y "LIBRO TERMINADO".
   Misma maqueta; cambian el antetítulo, el título y las cifras
   (ACHIEVEMENTS en data.js, con el rango de capítulos de cada uno).

   Cuándo salen (cada logro UNA sola vez, guardado en localStorage):
     · "Ya he llegado" (9): el logro de la fase del capítulo marcado
       (11–20 Fase II · 21–29 Fase III · 30 Libro terminado), si no salió ya.
     · "Añadir capítulo" (2.2) y 7/8: al entrar por primera vez en una fase.
   El reset oculto los vuelve a habilitar.
   "Seguir leyendo" vuelve a donde se marcó el capítulo (params.next) o a la Home.

   Animación de entrada (GSAP):
     antetítulo y título suben → el círculo rosa crece con rebote → la
     trompeta entra girando y da un pequeño "toque" → las dos tarjetas suben
     y sus cifras cuentan desde 0 → aparece el botón.
     A la vez, cascada de confeti (animations/confetti.js) por debajo del botón.
   URL para revisar: #/logro?id=fase-2 · fase-3 · libro
   ========================================================================== */

import { IMG } from '../components/ui.js';
import { ACHIEVEMENTS, BOOK } from '../core/data.js';
import { state, pendingAchievement, markAchievementsSeen, markAchievementShown } from '../core/state.js';
import { go } from '../core/router.js';
import { launchConfetti, CONFETTI } from '../animations/confetti.js';

const pad = (n) => String(n).padStart(2, '0');

/* Bloque "10 CAPÍTULOS LEÍDOS" */
const stat = (top, value, lines) => `
  <div class="logro-stat" style="left:20px;top:${top}px;width:362px;height:110px;border:2px solid var(--c-cream);border-radius:10px;padding:0 20px;display:flex;align-items:center;gap:20px">
    <span class="f-text s100 c-cream center logro-num" data-value="${value}" style="width:88px">${pad(value)}</span>
    <span class="f-text s35 c-cream">${lines.join('<br>')}</span>
  </div>`;

const achievementFor = (params) =>
  ACHIEVEMENTS.find((a) => a.id === params.id) ?? pendingAchievement() ?? ACHIEVEMENTS[0];

/** Animación de celebración al entrar. */
function celebrate(el) {
  const q = (s) => el.querySelector(s);
  const nums = [...el.querySelectorAll('.logro-num')];

  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
  tl.from(q('.logro-kicker'), { y: 14, opacity: 0, duration: 0.4 })
    .from(q('.logro-title'), { y: 26, opacity: 0, scale: 0.94, duration: 0.6 }, '-=0.2')
    .from(q('.logro-circle'), { scale: 0, duration: 0.7, ease: 'back.out(1.8)' }, '-=0.3')
    .from(q('.logro-art'), { scale: 0.55, rotation: -14, opacity: 0, duration: 0.7, ease: 'back.out(2.2)', transformOrigin: '50% 60%' }, '-=0.5')
    // "toque" de trompeta: un pequeño vaivén
    .to(q('.logro-art'), { keyframes: [{ rotation: -5, duration: 0.12 }, { rotation: 4, duration: 0.14 }, { rotation: 0, duration: 0.2 }], ease: 'sine.inOut', transformOrigin: '50% 60%' })
    .from(el.querySelectorAll('.logro-stat'), { y: 34, opacity: 0, duration: 0.5, stagger: 0.12 }, '-=0.45')
    .from(q('#go'), { y: 20, opacity: 0, duration: 0.45 }, '-=0.25');

  // Las cifras cuentan desde 0 mientras suben las tarjetas
  nums.forEach((n, i) => {
    const counter = { v: 0 };
    tl.to(counter, {
      v: Number(n.dataset.value), duration: 0.9, ease: 'power2.out',
      onUpdate: () => { n.textContent = pad(Math.round(counter.v)); },
    }, 1.35 + i * 0.12);
  });
  return tl;
}

export default {
  id: 'logro',
  render(params) {
    const a = achievementFor(params);
    // Capítulos leídos: los anteriores al tuyo; al terminar el libro, todos
    const read = a.finished ? BOOK.chapters : Math.max(state.currentChapter - 1, 0);
    const sealed = state.prophecies.filter((p) => p.author === 'me').length;
    return `
    <section class="screen" data-bg="blue" data-screen="logro" data-achievement="${a.id}">
      <p class="f-text s20 c-cream center cx logro-kicker" style="left:200.5px;top:80px">${a.kicker}</p>
      <h1 class="f-display s58 c-cream center cx logro-title" style="left:201px;top:122px">${a.title.join('<br>')}</h1>

      <span class="logro-circle" style="left:111px;top:275px;width:180px;height:180px;border-radius:90px;background:var(--c-pink)"></span>
      <img class="logro-art" src="${IMG('trumpet-achievement.svg')}" alt="" style="left:83.8px;top:261.06px;width:235.214px;height:208.265px">

      ${stat(504, read, ['CAPÍTULOS', 'LEÍDOS'])}
      ${stat(624, sealed, ['profecías', 'selladas'])}

      <button id="go" class="btn btn--cream" style="left:20px;top:774px;width:362px;z-index:2">seguir leyendo</button>
    </section>`;
  },
  mount(el, params) {
    const a = achievementFor(params);
    markAchievementShown(a.id); // guardado al mostrarse: aunque recargues, no vuelve a salir
    const tl = celebrate(el);
    // cascada de confeti (más piezas al terminar el libro)
    const stopConfetti = launchConfetti(el, { count: a.finished ? CONFETTI.countBook : CONFETTI.countPhase });
    el.querySelector('#go').addEventListener('click', () => {
      if (!params.next) markAchievementsSeen(); // desde la hoja: las fases anteriores también cuentan como vistas
      // Desde 9 ("Ya he llegado") vuelve a ese capítulo, ya leído; si no, a la Home
      if (params.next) go(params.next, params.ch ? { ch: params.ch } : {}, { replace: true });
      else go('2');
    });
    return () => { tl.kill(); stopConfetti(); };
  },
};
