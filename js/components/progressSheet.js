/* ==========================================================================
   HOJA "¿HASTA DÓNDE HAS LLEGADO?" (frame 2.2)
   Flujo en dos pasos para no marcar progreso por accidente:
     1. Añadir capítulo → se abre la hoja y eliges en la rueda (estado PENDIENTE).
        La rueda es el mismo componente que la de la Home (wheel.js, variante 'sheet').
     2. Guardar progreso → solo entonces se aplica y se guarda en localStorage.
   Cerrar sin guardar (tocar fuera o arrastrar la hoja hacia abajo) no cambia nada.

   Animaciones (GSAP):
     · abrir:  fondo 0 → 1 (0.3s) + hoja desde abajo (0.45s, power3.out)
     · cerrar: hoja hacia abajo (0.3s, power2.in) + fondo a 0
     · arrastre: Draggable en el eje Y; si bajas más de 120px se cierra,
       si no vuelve a su sitio con un rebote suave.
   ========================================================================== */

import { createWheel } from './wheel.js';

const SHEET_TOP = 383;      // posición de la hoja en Figma
const OFF = 874 - SHEET_TOP; // distancia para esconderla por debajo

/**
 * @param {HTMLElement} screen   pantalla Home donde se monta la hoja
 * @param {object} o
 * @param {number}   o.min       primer capítulo que se puede elegir (el siguiente al tuyo)
 * @param {number}   o.total     nº de capítulos (BOOK.chapters)
 * @param {number}   o.selected  capítulo preseleccionado
 * @param {(ch:number)=>void} o.onSave
 * @param {()=>void} [o.onClose]
 */
export function openProgressSheet(screen, { min, total, selected, onSave, onClose }) {
  const scrim = document.createElement('div');
  scrim.className = 'sheet-scrim';

  const sheet = document.createElement('div');
  sheet.className = 'sheet';
  sheet.setAttribute('role', 'dialog');
  sheet.setAttribute('aria-label', '¿Hasta dónde has llegado?');
  sheet.innerHTML = `
    <span class="sheet__grip" aria-hidden="true"></span>
    <button class="sheet__handle" data-close aria-label="Cerrar"></button>
    <h2 class="f-display s35 c-dark center wrap" style="left:20px;top:66px;width:362px">¿Hasta dónde has llegado?</h2>
    <div class="wheel" style="left:0;top:0;width:402px;height:715px"></div>
    <p class="f-text s20 c-dark-50" style="left:116px;top:319px">Tu capítulo es privado</p>
    <button class="btn btn--dark" data-save style="left:20px;top:391px;width:362px">guardar progreso</button>`;

  screen.append(scrim, sheet);

  // Estado PENDIENTE: lo que marca la rueda; no se guarda nada hasta "Guardar progreso"
  const wheel = createWheel(sheet.querySelector('.wheel'), {
    variant: 'sheet',
    total,
    min,
    value: Math.min(total, Math.max(min, selected)),
  });
  let closing = false;

  // --- Abrir
  gsap.fromTo(scrim, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'power1.out' });
  gsap.fromTo(sheet, { y: OFF }, { y: 0, duration: 0.45, ease: 'power3.out' });

  // --- Cerrar (con o sin guardar)
  function close(saved) {
    if (closing) return;
    closing = true;
    drag?.kill();
    gsap.to(scrim, { opacity: 0, duration: 0.3, ease: 'power1.in' });
    gsap.to(sheet, {
      y: OFF, duration: 0.3, ease: 'power2.in',
      onComplete: () => {
        scrim.remove();
        sheet.remove();
        wheel.destroy();
        if (saved) onSave(wheel.value()); // solo aquí cambia el progreso
        else onClose?.();
      },
    });
  }

  sheet.addEventListener('click', (e) => {
    if (e.target.closest('[data-save]')) close(true);
    if (e.target.closest('[data-close]')) close(false);
  });
  scrim.addEventListener('click', () => close(false));

  // --- Arrastrar hacia abajo para descartar
  let drag = null;
  if (window.Draggable) {
    gsap.registerPlugin(Draggable);
    [drag] = Draggable.create(sheet, {
      type: 'y',
      trigger: sheet.querySelector('.sheet__grip'),
      bounds: { minY: 0, maxY: OFF },
      edgeResistance: 0.85,
      onDrag() { gsap.set(scrim, { opacity: 1 - this.y / OFF }); },
      onRelease() {
        if (this.y > 120) close(false);
        else {
          gsap.to(sheet, { y: 0, duration: 0.4, ease: 'back.out(1.6)' });
          gsap.to(scrim, { opacity: 1, duration: 0.3 });
        }
      },
    });
  }

  return { close: () => close(false) };
}
