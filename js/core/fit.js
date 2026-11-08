/* ==========================================================================
   FIT — escala el lienzo de 402×874 (tamaño de los frames de Figma):
   · Escritorio: dentro del marco de teléfono, centrado y reducido si no cabe.
   · Móvil real (también instalada como app): sin marco, a pantalla completa.
     Los frames de Figma ya incluyen la zona de la barra de estado y la del
     indicador de inicio, así que el lienzo ocupa todo el alto (100dvh) y solo
     se respetan las safe areas laterales (muesca en horizontal). Si la
     proporción de la pantalla no coincide, el hueco sobrante toma el color de
     fondo de la pantalla activa para que no se note.
   ========================================================================== */

const W = 402;
const H = 874;
const FRAME = 24; // grosor del marco (12px por lado)
const COVER_TOLERANCE = 0.03; // PARA REVISAR: hasta un 3% de diferencia de proporción se llena la pantalla recortando

/* Lee las safe areas (env(safe-area-inset-*)) con un elemento de prueba */
let probe;
function safeAreas() {
  if (!probe) {
    probe = document.createElement('div');
    probe.style.cssText = 'position:fixed;visibility:hidden;pointer-events:none;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)';
    document.body.append(probe);
  }
  const s = getComputedStyle(probe);
  return { left: parseFloat(s.paddingLeft) || 0, right: parseFloat(s.paddingRight) || 0 };
}

const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;

export function fit() {
  const device = document.getElementById('device');
  const isMobile = isStandalone() || (matchMedia('(pointer: coarse)').matches && Math.min(innerWidth, innerHeight) < 600);
  document.documentElement.classList.toggle('is-mobile', isMobile);

  const vw = document.documentElement.clientWidth;
  let scale;
  let dx = 0;
  if (isMobile) {
    // Alto real de la pantalla. En la app instalada, iOS a veces da un 100dvh /
    // visualViewport más corto (sin la zona del indicador de inicio) y quedaba
    // una franja abajo y el lienzo encogido con huecos a los lados. Se usa el
    // mayor de los altos disponibles y, instalada en vertical, el de la pantalla.
    const portrait = innerHeight >= innerWidth;
    const fullH = isStandalone() && portrait
      ? Math.max(screen.height, innerHeight)
      : Math.round(window.visualViewport ? visualViewport.height : innerHeight);
    document.documentElement.style.height = document.body.style.height = `${fullH}px`;

    const safe = safeAreas();
    const fitW = (vw - safe.left - safe.right) / W;
    const fitH = fullH / H;
    // Si la proporción casi coincide (≤ COVER_TOLERANCE), se llena la pantalla
    // entera recortando ese poquito; si no, cabe entero y el hueco toma el color
    // de fondo de la pantalla activa.
    scale = Math.max(fitW, fitH) / Math.min(fitW, fitH) - 1 <= COVER_TOLERANCE ? Math.max(fitW, fitH) : Math.min(fitW, fitH);
    dx = (safe.left - safe.right) / 2;
    device.style.top = `${fullH / 2}px`;
  } else {
    document.documentElement.style.removeProperty('height');
    document.body.style.removeProperty('height');
    device.style.removeProperty('top');
    const vh = window.visualViewport ? Math.round(visualViewport.height) : innerHeight;
    scale = Math.min(1, (vh - 48) / (H + FRAME), (vw - 48) / (W + FRAME));
  }
  device.style.transform = `translate(calc(-50% + ${dx}px), -50%) scale(${scale})`;
  syncBackground();
}

/* En móvil, el fondo de la página copia el de la pantalla activa (hueco sobrante) */
function syncBackground() {
  if (!document.documentElement.classList.contains('is-mobile')) {
    document.body.style.removeProperty('background');
    return;
  }
  const screen = document.querySelector('[data-screen]');
  let bg = screen ? getComputedStyle(screen).backgroundColor : '';
  if (!bg || bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent') bg = getComputedStyle(document.getElementById('stage')).backgroundColor;
  document.body.style.background = bg;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', bg);
}

export function initFit() {
  fit();
  addEventListener('resize', fit);
  addEventListener('orientationchange', fit);
  window.visualViewport?.addEventListener('resize', fit);
  // cada vez que el router pinta otra pantalla, el fondo se actualiza
  new MutationObserver(syncBackground).observe(document.getElementById('app'), { childList: true });
}
