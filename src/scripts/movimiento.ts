/**
 * @file Movimiento de toda la web: scroll suave (Lenis) y animaciones al hacer
 * scroll (motion). Se carga una vez por página desde `Base.astro`.
 *
 * Funciona con atributos en el HTML, sin JavaScript en cada componente:
 *
 * - `data-revelar`         → el elemento aparece (sube y se aclara) al entrar en pantalla.
 * - `data-revelar="hijos"` → igual, pero con cada hijo uno detrás de otro.
 * - `data-crecer`          → los hijos crecen de izquierda a derecha (barras).
 * - `data-trazar`          → un trazo SVG con `pathLength="100"` se dibuja hasta su
 *                            `stroke-dashoffset` (anillos de progreso).
 * - `data-paralaje`        → la imagen se desplaza un poco más lento que la página, mientras
 *                            su marco (el antepasado con `data-marco`) cruza la pantalla.
 * - `data-cabecera`        → recibe `data-desplazado` cuando la página ya no está arriba del todo.
 *
 * El estado inicial (oculto) está en `global.css` y solo se aplica si `<html>` tiene la
 * clase `movimiento`. Esa clase la pone un script en `<head>` cuando el sistema NO pide
 * menos movimiento. Así, sin JavaScript o con `prefers-reduced-motion`, todo se ve quieto.
 */
import Lenis from "lenis";
import { animate, inView, scroll, stagger } from "motion";

const raiz = document.documentElement;
const conMovimiento = raiz.classList.contains("movimiento");

/** Curva de las entradas (igual que `--curva-suave` en tokens.css). */
const CURVA = [0.2, 0.7, 0.2, 1] as const;

function revelar() {
  for (const el of document.querySelectorAll<HTMLElement>("[data-revelar]")) {
    inView(
      el,
      () => {
        const objetivos = el.dataset.revelar === "hijos" ? [...el.children] : [el];
        animate(objetivos, { opacity: [0, 1], y: [24, 0] }, { duration: 0.9, delay: stagger(0.08), ease: CURVA });
      },
      { margin: "0px 0px -12% 0px" },
    );
  }
  for (const el of document.querySelectorAll<SVGElement>("[data-trazar]")) {
    const fin = Number(el.getAttribute("stroke-dashoffset") ?? 0);
    inView(el, () => {
      animate(el, { strokeDashoffset: [100, fin] }, { duration: 1.4, delay: 0.2, ease: CURVA });
    });
  }
  for (const el of document.querySelectorAll<HTMLElement>("[data-crecer]")) {
    inView(el, () => {
      animate([...el.children], { scaleX: [0, 1] }, { duration: 1, delay: stagger(0.1, { startDelay: 0.15 }), ease: CURVA });
    });
  }
}

function paralaje() {
  for (const el of document.querySelectorAll<HTMLElement>("[data-paralaje]")) {
    // Se mide el marco y no la imagen: la imagen se mueve, y medirla a ella misma se retroalimentaría.
    const marco = el.closest<HTMLElement>("[data-marco]") ?? el.parentElement ?? el;
    // De −6 % a +6 % de su altura mientras el marco cruza la pantalla.
    scroll(animate(el, { y: ["-6%", "6%"] }, { ease: "linear" }), { target: marco, offset: ["start end", "end start"] });
  }
}

/** Marca la cabecera cuando la página ya no está arriba (para darle fondo). */
function cabecera() {
  const el = document.querySelector<HTMLElement>("[data-cabecera]");
  if (!el) return;
  const actualizar = () => el.toggleAttribute("data-desplazado", scrollY > 24);
  actualizar();
  addEventListener("scroll", actualizar, { passive: true });
}

cabecera();

if (conMovimiento) {
  // `autoRaf`: Lenis lleva su propio bucle de animación. `anchors`: los enlaces #id también se desplazan suave.
  new Lenis({ autoRaf: true, anchors: true });
  revelar();
  paralaje();
  raiz.classList.add("movimiento-listo");
}
