import { useEffect, useRef } from "preact/hooks";
import { animate } from "motion";

/** Número de chispas del estallido. */
const CHISPAS = 10;

/**
 * @component Estallido
 * Celebración al conseguir un talento: una onda y chispas que salen del nodo y
 * se apagan. Se coloca dentro del botón del nodo (que tiene `position: relative`).
 * Para repetirlo, quien lo usa le cambia la `key`, y Preact lo monta de nuevo.
 *
 * Es decoración (`aria-hidden`): el aviso accesible lo da `AvisoDesbloqueo`.
 * Si el sistema pide menos movimiento, no se pinta nada.
 */
export default function Estallido() {
  const raiz = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = raiz.current;
    if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const onda = el.querySelector<HTMLElement>("[data-onda]")!;
    const animaciones = [
      animate(onda, { scale: [0.6, 2.6], opacity: [0.9, 0] }, { duration: 0.9, ease: "easeOut" }),
      ...[...el.querySelectorAll<HTMLElement>("[data-chispa]")].map((c, i) => {
        // Cada chispa sale en su ángulo, con algo de azar en la distancia.
        const angulo = (i / CHISPAS) * Math.PI * 2;
        const distancia = 38 + Math.random() * 22;
        return animate(
          c,
          { x: [0, Math.cos(angulo) * distancia], y: [0, Math.sin(angulo) * distancia], scale: [1.2, 0], opacity: [1, 0] },
          { duration: 0.8 + Math.random() * 0.3, ease: [0.2, 0.7, 0.3, 1] },
        );
      }),
    ];
    return () => animaciones.forEach((a) => a.stop());
  }, []);

  return (
    <span ref={raiz} class="pointer-events-none absolute inset-0 grid place-items-center" aria-hidden="true">
      <span data-onda class="col-start-1 row-start-1 size-full rounded-full border-2 border-exito opacity-0" />
      {Array.from({ length: CHISPAS }, (_, i) => (
        <span key={i} data-chispa class={`col-start-1 row-start-1 size-1.5 rounded-full opacity-0 ${i % 2 ? "bg-exito" : "bg-acento-claro"}`} />
      ))}
    </span>
  );
}
