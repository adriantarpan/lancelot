/* ==========================================================================
   6.1 → 6.4 · PROFECÍA
   6.1  Escribir: textarea (máx. 140), contador e interruptor "compartir".
        "Sellar profecía" guarda la profecía y lleva a 6.4.
   6.2  Keyframe: sobre rosa cerrado ocupando la pantalla.
   6.3  Keyframe: el mismo sobre cerrado, a medio encoger.
   6.4  Resultado: sobre cerrado con el sello de lacre + "Carta sellada".
   Al sellar, 6.2 → 6.3 → 6.4 es un único timeline de GSAP (animations/sealProphecy.js)
   que se reproduce en 6.4. Los keyframes se ven sueltos en #/6.2, #/6.3; #/6.4?anim=1 repite la animación.
   ========================================================================== */

import { IMG, backButton, esc } from '../components/ui.js';
import { envelopeHTML } from '../components/envelope.js';
import { playSealAnimation } from '../animations/sealProphecy.js';
import { state, update } from '../core/state.js';
import { go } from '../core/router.js';

const MAX = 140;
let draft = { text: '', shared: false }; // borrador mientras escribes

/* ---------- Animación del interruptor "compartir" (6.1) ----------
   Con las tres piezas exportadas de Figma (contorno apagado, pista azul y bola
   crema): la bola se desliza de un lado a otro estirándose un poco y la pista
   azul funde con el contorno. Los estados finales son exactamente los de Figma.
   PARA REVISAR: constantes. */
const TOGGLE_TRAVEL = 18.2;    // px entre la bola apagada (izquierda) y la encendida (derecha)
const TOGGLE_DURATION = 0.42;  // s del deslizamiento
const TOGGLE_STRETCH = 1.3;    // estiramiento horizontal de la bola a mitad de camino

function animateToggle(toggle, on) {
  const off = toggle.querySelector('.t-off');
  const track = toggle.querySelector('.t-track');
  const knob = toggle.querySelector('.t-knob');
  gsap.killTweensOf([off, track, knob]);
  toggle.classList.add('is-animating'); // muestra las tres piezas mientras dura
  const tl = gsap.timeline({
    onComplete: () => { toggle.classList.remove('is-animating'); gsap.set([off, track, knob], { clearProps: 'opacity,x,scaleX,transformOrigin' }); },
  });
  // la bola: de un lado al otro, se estira a mitad de camino
  tl.fromTo(knob, { x: on ? -TOGGLE_TRAVEL : 0, opacity: on ? 0 : 1 }, { x: on ? 0 : -TOGGLE_TRAVEL, duration: TOGGLE_DURATION, ease: 'power3.inOut' }, 0)
    .to(knob, { keyframes: [{ scaleX: TOGGLE_STRETCH, duration: TOGGLE_DURATION / 2, ease: 'power2.out' }, { scaleX: 1, duration: TOGGLE_DURATION / 2, ease: 'back.out(3)' }], transformOrigin: on ? '100% 50%' : '0% 50%' }, 0)
    .to(knob, { opacity: on ? 1 : 0, duration: 0.15, ease: 'power1.out' }, on ? 0 : TOGGLE_DURATION - 0.15)
    // la pista azul y el contorno se funden
    .fromTo(track, { opacity: on ? 0 : 1 }, { opacity: on ? 1 : 0, duration: TOGGLE_DURATION * 0.8, ease: 'power1.inOut' }, on ? 0.04 : 0.08)
    .fromTo(off, { opacity: on ? 1 : 0 }, { opacity: on ? 0 : 1, duration: TOGGLE_DURATION * 0.8, ease: 'power1.inOut' }, on ? 0.08 : 0.04);
  // el interruptor se hunde un poco al pulsarlo
  tl.fromTo(toggle, { scale: 1 }, { keyframes: [{ scale: 0.94, duration: 0.08, ease: 'power1.out' }, { scale: 1, duration: 0.3, ease: 'back.out(3)' }], clearProps: 'transform' }, 0);
}

/* Cabecera común a las cuatro pantallas */
const head = () => `
  ${backButton('dark')}
  <h1 class="f-display s35 c-dark center cx" style="left:201px;top:80px">Profecía</h1>`;

/* Textos de 6.2–6.4 ("Carta sellada"...). revealCh = capítulo en que se abre. */
const sealedTexts = (revealCh) => `
  <h2 class="f-display s35 c-dark center cx sealed-text" style="left:201.5px;top:528px">Carta sellada</h2>
  <p class="f-text s25 c-dark center cx sealed-text" style="left:201.5px;top:572px">se paciente, todo a su debido tiempo</p>
  <span class="chip chip--blue cx sealed-text" style="left:201px;top:613px">se revelerá en el cap. ${revealCh}</span>
  <button class="btn btn--dark sealed-text" data-nav="2" style="left:20px;top:774px;width:362px">seguir leyendo</button>`;

/* Última profecía tuya (la que se acaba de sellar) */
const lastMine = () => [...state.prophecies].reverse().find((p) => p.author === 'me' && !p.verdict);
const revealOfLast = () => lastMine()?.reveal ?? state.currentChapter + 1;

/* Capítulo en el que se revelará: el siguiente al tuyo, o el que venga en la URL (desde 9) */
const revealFrom = (params) => Math.max(Number(params.reveal) || 0, state.currentChapter + 1);

export const ProphecyWrite = {
  id: '6.1',
  render(params) {
    const reveal = revealFrom(params);
    return `
    <section class="screen" data-screen="6.1">
      ${head()}
      <span class="chip chip--blue" style="left:20px;top:157px">se revelerá en el cap. ${reveal}</span>
      <h2 class="f-display s35 c-dark center cx" style="left:191.5px;top:201px">¿Qué crees que va a pasar?</h2>

      <label class="prophecy-box">
        <textarea id="text" maxlength="${MAX}" inputmode="none" data-kb="text" data-kb-enter="done" spellcheck="false" placeholder="Cuando Adeline vuelve a la ciudad...">${esc(draft.text)}</textarea>
      </label>
      <p id="count" class="f-text s20 c-dark right" style="left:20px;top:462px;width:362px">${draft.text.length}/${MAX}</p>

      <p class="f-text s25 c-dark" style="left:20px;top:524px">compartir con el club</p>
      <p class="f-text s20 c-dark-50" style="left:20px;top:557px">entra en el mazo del club</p>
      <button id="share" class="toggle" role="switch" aria-checked="${draft.shared}" aria-label="Compartir con el club">
        <img class="t-off"   src="${IMG('toggle-off.svg')}" alt="">
        <img class="t-track" src="${IMG('toggle-on-track.svg')}" alt="">
        <img class="t-knob"  src="${IMG('toggle-on-knob.svg')}" alt="">
      </button>

      <button id="seal" class="btn btn--dark" style="left:20px;top:774px;width:362px">sellar profecía</button>
    </section>`;
  },
  mount(el, params) {
    const text = el.querySelector('#text');
    const count = el.querySelector('#count');
    const share = el.querySelector('#share');

    text.addEventListener('input', () => {
      draft.text = text.value;
      count.textContent = `${text.value.length}/${MAX}`;
    });
    share.addEventListener('click', () => {
      draft.shared = !draft.shared;
      share.setAttribute('aria-checked', String(draft.shared));
      if (window.gsap) animateToggle(share, draft.shared);
    });
    el.querySelector('#seal').addEventListener('click', () => {
      const body = draft.text.trim();
      if (!body) { text.focus(); return; } // PENDIENTE: estado de error sin diseñar
      const ch = state.currentChapter;
      update((s) => {
        s.prophecies.push({ id: `p${Date.now()}`, author: 'me', madeAt: ch, reveal: revealFrom(params), shared: draft.shared, verdict: null, text: body });
      });
      draft = { text: '', shared: false };
      go('6.4', { anim: 1 }, { replace: true }); // con el timeline de sellado
    });
  },
};

/* 6.2 — sobre rosa cerrado ocupando la pantalla (keyframe) */
export const ProphecyEnvelopeFull = {
  id: '6.2',
  render: () => `
    <section class="screen" data-screen="6.2">
      ${head()}
      ${sealedTexts(revealOfLast())}
      <div style="left:-431.32px;top:0;width:1265.552px;height:874px">
        <img src="${IMG('envelope-closed-big.svg')}" alt="" style="position:absolute;left:-8.99px;top:0;width:1278.55px;height:883px">
      </div>
    </section>`,
};

/* 6.3 — sobre cerrado a medio encoger (keyframe): Group 112 de 805×556 en (-201.09, 159) */
export const ProphecyEnvelopeOpen = {
  id: '6.3',
  render: () => `
    <section class="screen" data-screen="6.3">
      ${head()}
      ${sealedTexts(revealOfLast())}
      <div style="left:-201.088px;top:159px;width:805.088px;height:556px">
        <img src="${IMG('envelope-closed-big.svg')}" alt="" style="position:absolute;left:-5.72px;top:0;width:813.4px;height:561.8px">
      </div>
    </section>`,
};

/* 6.4 — carta sellada. Al llegar desde "Sellar profecía" (params.anim) se
   reproduce el timeline de sellado 6.2 → 6.3 → 6.4 (animations/sealProphecy.js). */
export const ProphecySealed = {
  id: '6.4',
  render: () => `
    <section class="screen" data-screen="6.4">
      ${head()}
      ${envelopeHTML()}
      ${sealedTexts(revealOfLast())}
    </section>`,
  mount(el, params) {
    if (!params.anim) return null;
    const tl = playSealAnimation(el);
    el._tl = tl; // accesible desde la consola para revisar fotogramas: $('[data-screen]')._tl.pause().seek(1.5)
    return () => tl.kill();
  },
};
