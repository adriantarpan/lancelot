/* ==========================================================================
   SOBRE CON SELLO DE LACRE — piezas de Figma tal cual, para el sellado
   (6.2 → 6.3 → 6.4):

     Group 111  sobre cerrado            assets/img/envelope-closed@4x.png
     Group 110  sello de lacre azul      assets/img/seal-wax@4x.png

   Coordenadas: el cuerpo del sobre (362×250) con su esquina en (0,0), que en
   6.4 está en (20, 238). En 6.2 y 6.3 es el mismo sobre, más grande.
   ========================================================================== */

import { IMG } from './ui.js';

export function envelopeHTML() {
  return `
  <div class="env" aria-hidden="true">
    <img class="env__closed" src="${IMG('envelope-closed@4x.png')}" alt="">
    <div class="env__seal"><img src="${IMG('seal-wax@4x.png')}" alt=""></div>
  </div>`;
}
