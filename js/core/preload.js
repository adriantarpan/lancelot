/* ==========================================================================
   PRECARGA DE IMÁGENES — evita el destello en blanco entre pantallas.
   Cada pantalla crea sus <img> al pintarse; en el móvil, la primera vez que
   se usa una imagen (y a veces aunque ya esté descargada) tarda un instante en
   pintarse y se ve el fondo claro del lienzo (p. ej. la cabecera oscura del
   onboarding). Aquí:
   · preloadImages(): al arrancar se descargan y decodifican todas, y se guardan
     en memoria para que el navegador no las descarte.
   · imagesReady(el): promesa que se cumple cuando las <img> de una pantalla
     nueva ya se pueden pintar (con un tope, para no bloquear nunca la
     navegación). El router la usa antes de quitar la pantalla anterior.
   La lista se regenera sola al publicar (publicar.sh); si añades una imagen y
   pruebas en local, añádela aquí a mano.
   ========================================================================== */

import { IMG } from '../components/ui.js';

const READY_TIMEOUT = 350; // ms máximos que se espera a las imágenes (PARA REVISAR)

// IMAGES-START (generado por publicar.sh)
const IMAGES = [
  'avatar-horse.svg',
  'btn-back-dark.svg',
  'btn-back-light.svg',
  'btn-back-pink.svg',
  'card-back.png',
  'coach/horse-btn-highlight.svg',
  'coach/line-avatar.svg',
  'coach/line-game.svg',
  'coach/line-name.svg',
  'envelope-closed-big@4x.png',
  'envelope-closed-full@4x.png',
  'envelope-closed-mid@4x.png',
  'envelope-closed@8x.png',
  'game-ground-line.svg',
  'game-ground-tick.svg',
  'game-horse.svg',
  'game/books-pile.svg',
  'game/caballo-1.svg',
  'game/caballo-2.svg',
  'game/caballo-salto.svg',
  'game/horse-a.svg',
  'header-dark-scallop.svg',
  'home-header-pink-scallop.svg',
  'horse-btn.svg',
  'horse-welcome.svg',
  'icon-bookmark.svg',
  'icon-close.svg',
  'icon-send.svg',
  'logo-festina-lente.svg',
  'logo-lancelot.svg',
  'logo-mark-blue.svg',
  'notif-icon.svg',
  'seal-wax-large@4x.png',
  'seal-wax@4x.png',
  'shield-card-dark.svg',
  'shield-card-white.svg',
  'shield-pink.svg',
  'shield-small-muted.svg',
  'toggle-off.svg',
  'toggle-on-knob.svg',
  'toggle-on-track.svg',
  'trumpet-achievement.svg',
  'welcome-cream-scallop.svg',
];
// IMAGES-END

const keep = [];

export function preloadImages() {
  IMAGES.forEach((name) => {
    const img = new Image();
    img.decoding = 'async';
    img.src = IMG(name);
    img.decode?.().catch(() => {});
    keep.push(img);
  });
}

export function imagesReady(el) {
  const imgs = [...el.querySelectorAll('img')];
  if (!imgs.length) return Promise.resolve();
  const decoded = imgs.map((img) => (img.decode ? img.decode().catch(() => {}) : Promise.resolve()));
  return Promise.race([Promise.all(decoded), new Promise((r) => setTimeout(r, READY_TIMEOUT))]);
}
