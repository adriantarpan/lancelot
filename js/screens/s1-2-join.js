/* ==========================================================================
   1.2 · PASO 1 · TU CLUB
   Campo de código de 6 caracteres. "Probar con un código de ejemplo" lo
   rellena y el botón inferior pasa de gris (muted) a activo (dark) → 1.3.
   ========================================================================== */

import { IMG, backButton, darkHeader, stepBar, mountStepBar } from '../components/ui.js';
import { CLUB } from '../core/data.js';
import { state, update } from '../core/state.js';
import { go } from '../core/router.js';

export default {
  id: '1.2',

  render: () => `
    <section class="screen" data-screen="1.2">
      ${darkHeader()}
      ${backButton('light')}
      ${stepBar(1)}
      <button class="link c-cream cx" data-nav="2" style="left:357.5px;top:85px">saltar</button>

      <p class="f-text s20 c-cream" style="left:20px;top:140px">paso 1 · tu club</p>
      <h1 class="f-display s45 c-pink" style="left:20px;top:182px">Únete a tu mesa<br>redonda.</h1>

      <p class="f-text s20 c-dark center cx" style="left:201px;top:350px">escribe el código que te ha pasado tu club<br>o abre su enlace de invitación.</p>

      <!-- Campo de código -->
      <label style="left:20px;top:414px;width:362px;height:82px;border:2px solid var(--c-dark);border-radius:10px">
        <input id="code" maxlength="6" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"
          inputmode="none" data-kb="text" data-kb-enter="done"
          class="f-text s35 c-dark center" style="width:100%;height:100%;white-space:pre"
          placeholder="·   ·   ·   ·   ·   ·" value="${state.clubCode}">
      </label>

      <button class="link c-pink cx" id="example" style="left:211px;top:516px">Probar con un código de ejemplo</button>

      <button id="next" class="btn btn--muted" style="left:20px;top:774px;width:362px">sentarme en la mesa</button>
    </section>`,

  mount(el) {
    mountStepBar(el); // la barra de pasos se anima desde el paso anterior
    const input = el.querySelector('#code');
    const next = el.querySelector('#next');

    const sync = () => {
      const ok = input.value.trim().length === 6;
      next.classList.toggle('btn--muted', !ok);
      next.classList.toggle('btn--dark', ok);
      next.disabled = !ok;
    };

    input.addEventListener('input', sync);
    el.querySelector('#example').addEventListener('click', () => {
      input.value = CLUB.code;
      sync();
    });
    next.addEventListener('click', () => {
      update((s) => { s.clubCode = input.value.trim().toLowerCase(); });
      go('1.3');
    });
    sync();
  },
};
