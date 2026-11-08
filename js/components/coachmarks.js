/* ==========================================================================
   INDICACIONES DE LA PRIMERA VISITA A LA HOME — frames 2.0.1, 2.0.2, 2.0.3
   Velo oscuro (granate al 60 %), el elemento señalado realzado por encima,
   una línea y una etiqueta crema. Salen una sola vez (state.coachSeen).

     2.0.1  "Escribe tu nombre"       señala el nombre de la cabecera
     2.0.2  "Prueba el minijuego"     señala el botón del caballo
     2.0.3  "Reinicia el prototipo"   señala el avatar

   · Tocar en cualquier sitio pasa al siguiente paso; lo de debajo no se activa.
   · Animación (GSAP): velo 0,3 s → en cada paso, el elemento se realza, la
     línea se dibuja desde el elemento hacia la etiqueta (0,4 s) y la etiqueta
     entra con fundido y un pequeño desplazamiento. Entre pasos, el anterior
     se desvanece antes de que entre el siguiente. Al final, se va el velo.
   · Sin saltos: el velo espera a que acabe la transición de entrada a la Home
     (COACH_DELAY), cada paso espera a que sus imágenes estén listas y un toque
     a mitad de una animación la completa en vez de perderse.
   Coordenadas de Figma (pantalla de 402×874).
   ========================================================================== */

import { IMG, esc } from './ui.js';
import { state } from '../core/state.js';
import { imagesReady } from '../core/preload.js';

const COACH_DELAY = 0.45; // s: se espera a que termine la transición de entrada a la Home (PARA REVISAR)

const CREAM = '#FDF3EA';

/* Líneas de Figma (mismo trazo: 2 px crema). En Figma el trazo va de la
   etiqueta al elemento; aquí el path está invertido (empieza en el elemento)
   para dibujarlo de la forma estándar: dashoffset de len a 0, en atributos SVG.
   La versión anterior animaba un dashoffset negativo por CSS y en el iPhone
   (WebKit) la línea salía a saltos o entera de golpe. Sale ya oculta en el
   HTML, así nunca se ve dibujada ni un frame antes de tiempo.
   len = largo del trazo en L (tramo horizontal + vertical). */
const line = (w, h, d, len) =>
  `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none" style="position:absolute;left:-1px;top:-1px;overflow:visible"><path class="coach-line" d="${d}" stroke-width="2" stroke="${CREAM}" stroke-dasharray="${len} ${len}" stroke-dashoffset="${len}" data-len="${len}"/></svg>`;

const STEPS = [
  {
    // 2.0.1 — nombre en crema por encima del velo
    highlight: () => `<p class="f-text s25" style="position:absolute;left:78px;top:91.25px;color:${CREAM}">${esc(state.userName) || 'tu nombre'}</p>`,
    line: `<div style="position:absolute;left:124px;top:118px;width:62px;height:10px;transform:scaleY(-1)">${line(63, 11, 'M1 11V1H63', 72)}</div>`,
    label: `<p class="f-text s20 coach-label" style="position:absolute;left:191px;top:117px;color:${CREAM}">escribe tu nombre</p>`,
  },
  {
    // 2.0.2 — botón del caballo realzado (dibujo crema y borde crema)
    highlight: () => `
      <span style="position:absolute;left:322px;top:764px;width:60px;height:60px;border-radius:30px;overflow:hidden">
        <img src="${IMG('coach/horse-btn-highlight.svg')}" alt="" style="position:absolute;left:-8px;top:10px;width:135.038px;height:100px">
      </span>
      <span style="position:absolute;left:322px;top:764px;width:60px;height:60px;border-radius:30px;border:2px solid ${CREAM}"></span>`,
    line: `<div style="position:absolute;left:297px;top:642px;width:55px;height:115px">
             <div style="position:absolute;left:-30px;top:30px;width:115px;height:55px;transform:rotate(90deg)">${line(116, 56, 'M1 56V1H116', 170)}</div>
           </div>`,
    label: `<p class="f-text s20 coach-label" style="position:absolute;left:141px;top:631px;color:${CREAM}">prueba el minijuego</p>`,
  },
  {
    // 2.0.3 — avatar por encima del velo
    highlight: () => `<span class="avatar" style="position:absolute"><img src="${IMG('avatar-horse.svg')}" alt=""></span>`,
    line: `<div style="position:absolute;left:43px;top:136px;width:156px;height:26px;transform:scaleY(-1)">${line(157, 27, 'M1 27V1H157', 182)}</div>`,
    label: `<p class="f-text s20 coach-label" style="position:absolute;left:204px;top:151px;color:${CREAM}">reinicia el prototipo</p>`,
  },
];

/**
 * @param {HTMLElement} screen  la Home
 * @param {() => void} onDone   se llama al terminar (guardar que ya se vieron)
 */
export function startCoachmarks(screen, onDone) {
  const root = document.createElement('div');
  root.className = 'coach';
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-label', 'Indicaciones');
  root.style.cssText = 'position:absolute;inset:0;z-index:30;cursor:pointer';
  root.innerHTML = `<div class="coach-veil" style="position:absolute;inset:0;background:rgba(36,7,15,0.6)"></div><div class="coach-step" style="position:absolute;inset:0"></div>`;
  screen.append(root);

  const veil = root.querySelector('.coach-veil');
  const stage = root.querySelector('.coach-step');
  let index = -1;
  let busy = false;
  let current = null; // animación del paso en curso

  function showStep(i) {
    const s = STEPS[i];
    stage.innerHTML = `${s.highlight()}${s.line}${s.label}`;
    // Sin saltos en el móvil: el paso no se enseña hasta que sus imágenes
    // (caballo, avatar) ya se pueden pintar; antes aparecían de golpe a mitad.
    stage.style.visibility = 'hidden';
    imagesReady(stage).then(() => {
      if (!root.isConnected) return;
      stage.style.visibility = '';
      animateStep();
    });
  }

  function animateStep() {
    const path = stage.querySelector('.coach-line');
    const tl = gsap.timeline({ onComplete: () => { busy = false; current = null; } });
    current = tl;
    tl.from(stage.firstElementChild ? [...stage.children].slice(0, -2) : [], { opacity: 0, duration: 0.25, ease: 'power1.out' })
      // la línea se dibuja desde el elemento (inicio del trazo) hacia la etiqueta
      .to(path, { attr: { 'stroke-dashoffset': 0 }, duration: 0.4, ease: 'power2.inOut' }, 0.1)
      .from(stage.querySelector('.coach-label'), { opacity: 0, x: -8, duration: 0.35, ease: 'power2.out' }, 0.4);
  }

  function next() {
    if (busy) return;
    busy = true;
    index += 1;
    if (index >= STEPS.length) return finish();
    if (index === 0) return showStep(0);
    // el paso anterior se desvanece antes de que entre el siguiente
    current = gsap.to(stage, { opacity: 0, duration: 0.2, ease: 'power1.in', onComplete: () => {
      current = null;
      gsap.set(stage, { opacity: 1 });
      showStep(index);
    } });
  }

  function finish() {
    gsap.to(root, { opacity: 0, duration: 0.35, ease: 'power1.inOut', onComplete: () => { root.remove(); onDone?.(); } });
  }

  // Tocar en cualquier sitio: siguiente paso (y no llega nada a lo de debajo)
  const stop = (e) => { e.preventDefault(); e.stopPropagation(); };
  root.addEventListener('pointerdown', stop);
  root.addEventListener('click', (e) => {
    stop(e);
    // un toque a mitad de la animación la completa al momento (no se pierde el toque)
    if (busy && current) { current.progress(1); return; }
    next();
  });

  // Entrada: velo con fundido y primer paso
  busy = true;
  gsap.fromTo(veil, { opacity: 0 }, { opacity: 1, duration: 0.3, delay: COACH_DELAY, ease: 'power1.out', onComplete: () => { busy = false; next(); } });
}
