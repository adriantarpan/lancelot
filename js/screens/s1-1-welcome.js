/* ==========================================================================
   1.1 · BIENVENIDA
   El caballo es estático (sin animación, por indicación expresa).
   Los tres botones llevan a 1.2.
   ========================================================================== */

import { IMG, resetStepBar } from '../components/ui.js';

export default {
  id: '1.1',

  render: () => (resetStepBar(), `
    <section class="screen" data-bg="dark" data-screen="1.1">
      <!-- Logo "Lancelot.club" + "Festina lente" -->
      <img src="${IMG('logo-lancelot.svg')}" alt="Lancelot.club" style="left:20px;top:90px;width:362px;height:61.342px">
      <img src="${IMG('logo-festina-lente.svg')}" alt="Festina lente" style="left:133.5px;top:165px;width:135.012px;height:12.471px">

      <!-- Ilustración del caballo (estática) -->
      <img src="${IMG('horse-welcome.svg')}" alt="" style="left:95px;top:260px;width:211.08px;height:156.309px">

      <p class="f-display s35 c-pink center cx" style="left:201px;top:499px">A tu ritmo.<br>Sin prisa ni espada.</p>

      <!-- Parte inferior crema con festón -->
      <img src="${IMG('welcome-cream-scallop.svg')}" alt="" style="left:0;top:612px;width:402px;height:262px">

      <button class="btn btn--dark"    data-nav="1.2" style="left:20px;top:672px;width:362px">Unirme a un club</button>
      <button class="btn btn--outline" data-nav="1.2" style="left:20px;top:732px;width:362px">Fundar una mesa redonda</button>

      <p class="f-text s20 cx" style="left:201px;top:802px;display:flex;gap:10px">
        <span class="c-dark">Ya tengo cuenta</span>
        <button class="underline c-pink" data-nav="1.2">Entrar</button>
      </p>
    </section>`),
};
