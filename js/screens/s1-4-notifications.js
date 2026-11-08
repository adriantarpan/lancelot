/* ==========================================================================
   1.4 · PASO 3 · AVISOS
   "Activar avisos" y "Ahora no" terminan el onboarding → Home (2).
   ========================================================================== */

import { IMG, backButton, darkHeader, stepBar, mountStepBar } from '../components/ui.js';
import { update } from '../core/state.js';
import { go } from '../core/router.js';

/* Notificación de ejemplo. Coordenadas internas = Figma − (borde 2px + posición de la tarjeta). */
const notif = (top, title, body, when) => `
  <div class="notif" style="top:${top}px">
    <span class="notif__icon"><img src="${IMG('notif-icon.svg')}" alt=""></span>
    <span class="f-text s12 c-dark-50" style="left:54px;top:13px">Lancelot.club</span>
    <span class="f-text s12 c-dark-50 right" style="right:8px;top:13px">${when}</span>
    <span class="f-text s12 c-dark bold" style="left:54px;top:31px">${title}</span>
    <span class="f-text s15 c-dark wrap" style="left:54px;top:49px;width:296px">${body}</span>
  </div>`;

export default {
  id: '1.4',

  render: () => `
    <section class="screen" data-screen="1.4">
      ${darkHeader()}
      ${backButton('light')}
      ${stepBar(3)}
      <button class="link c-cream cx" data-nav="2" style="left:357.5px;top:85px">saltar</button>

      <p class="f-text s20 c-cream" style="left:20px;top:140px">paso 3 · avisos</p>
      <h1 class="f-display s45 c-pink wrap" style="left:20px;top:182px;width:362px">Te avisamos, solo para lo importante.</h1>

      ${notif(387, 'se habla del capítulo 10', '3 comentarios nuevos y una pregunta para el mazo en un capítulo que ya has leído.', 'ahora')}
      ${notif(497, 'Mesa redonda: jueves 12 · 19:30', 'En casa de Mar, hasta el capítulo 13. Te quedan 3 capítulos, unos 20 minutos al día. A tu ritmo.', 'lun 9 nov')}

      <img src="${IMG('shield-small-muted.svg')}" alt="" style="left:30px;top:675px;width:22px;height:27.632px">
      <p class="f-text s15 c-dark-50 wrap" style="left:72px;top:672px;width:300px">Si no llegas al capítulo acordado, puedes utilizar un escudo en la sección de reunión para protegerte.</p>

      <button class="btn btn--dark" data-finish="on" style="left:20px;top:732px;width:362px">activar avisos</button>
      <button class="link c-pink cx" data-finish="off" style="left:201.5px;top:802px">ahora no</button>
    </section>`,

  mount(el) {
    mountStepBar(el); // la barra de pasos se anima desde el paso anterior
    el.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-finish]');
      if (!btn) return;
      update((s) => {
        s.notifications = btn.dataset.finish === 'on';
        s.onboarded = true;
      });
      go('2');
    });
  },
};
