/* ==========================================================================
   REINICIAR EL PROTOTIPO — con la tarjeta de confirmación del frame 2.3
   Borra todo el estado de localStorage (progreso, profecías, escudos,
   comentarios, logros, récord, nombre e indicaciones vistas) y vuelve a 1.1.
   Se usa desde el avatar de la Home y desde el reset oculto (Shift+R).

   Frame 2.3: velo granate al 50 %, tarjeta crema de 362×150 centrada con
   borde, "Estás a punto de reiniciar el prototipo" y dos botones:
   "Cancelar" (borde) y "Reiniciar" (relleno granate, texto rosa).
   Animación (GSAP): el velo funde y la tarjeta entra con un pequeño escalado.
   ========================================================================== */

import { reset } from './state.js';
import { go } from './router.js';

let open = false;

export function resetPrototype() {
  if (open) return;
  const screen = document.querySelector('[data-screen]');
  if (!screen) return;
  open = true;

  const root = document.createElement('div');
  root.className = 'confirm-reset';
  root.setAttribute('role', 'alertdialog');
  root.setAttribute('aria-label', 'Reiniciar el prototipo');
  root.style.cssText = 'position:absolute;inset:0;z-index:35';
  root.innerHTML = `
    <div class="confirm-veil" style="position:absolute;inset:0;background:rgba(36,7,15,0.5)"></div>
    <div class="confirm-card" style="position:absolute;left:20px;top:362px;width:362px;height:150px;border:2px solid var(--c-dark);border-radius:10px;background:var(--c-cream)">
      <p class="f-text s20 c-dark center" style="position:absolute;left:0;width:358px;top:27px">estás a punto de reiniciar el prototipo</p>
      <button class="btn" data-choice="cancel" style="position:absolute;left:29px;top:69px;width:140px;border:2px solid var(--c-dark);border-radius:25px;color:var(--c-dark)">cancelar</button>
      <button class="btn btn--dark" data-choice="reset" style="position:absolute;left:189px;top:69px;width:140px;border-radius:25px">reiniciar</button>
    </div>`;
  screen.append(root);

  const veil = root.querySelector('.confirm-veil');
  const card = root.querySelector('.confirm-card');
  gsap.fromTo(veil, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: 'power1.out' });
  gsap.fromTo(card, { opacity: 0, scale: 0.92 }, { opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(2)' });

  const close = (then) => {
    gsap.to(card, { opacity: 0, scale: 0.95, duration: 0.18, ease: 'power1.in' });
    gsap.to(veil, { opacity: 0, duration: 0.22, ease: 'power1.in', onComplete: () => { root.remove(); open = false; then?.(); } });
  };

  root.addEventListener('click', (e) => {
    e.stopPropagation();
    const choice = e.target.closest('[data-choice]')?.dataset.choice;
    if (choice === 'reset') close(() => { reset(); go('1.1'); });
    else if (choice === 'cancel' || e.target === veil) close();
  });
}
