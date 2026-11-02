import { useSignal } from "@preact/signals";
import { useEffect, useRef } from "preact/hooks";
import { animate } from "motion";

/** Una ruta del repertorio, como datos planos (la isla no puede importar `astro:content`). */
export interface RutaIndice {
  id: string;
  /** Nombre corto («Ghibli»). */
  nombre: string;
  descripcion: string;
  /** Número de obras de la ruta. */
  obras: number;
  /** Color de la ruta (dato del contenido, `rutas.json`). */
  color: string;
  /** Imagen ya optimizada por Astro (`getImage` en la página). */
  imagen: { src: string; width: number; height: number };
}

interface Props {
  rutas: RutaIndice[];
}

/**
 * @component IndiceRutas (isla: `client:visible`)
 * Las rutas del repertorio como un índice tipográfico: una fila grande por ruta.
 * Al pasar el ratón, la imagen de esa ruta aparece y sigue al cursor con un muelle
 * (motion). En pantallas táctiles, o si el sistema pide menos movimiento, no hay
 * imagen flotante: cada fila lleva su miniatura fija.
 */
export default function IndiceRutas({ rutas }: Props) {
  const activa = useSignal<number | null>(null);
  const caja = useRef<HTMLDivElement>(null);
  const flotante = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const zona = caja.current;
    const img = flotante.current;
    const puedeSeguir = matchMedia("(hover: hover) and (pointer: fine)").matches && document.documentElement.classList.contains("movimiento");
    if (!zona || !img || !puedeSeguir) return;
    const mover = (e: PointerEvent) => {
      const r = zona.getBoundingClientRect();
      // Centrada en el cursor, con un muelle: llega con un pequeño retraso, como si pesara.
      animate(img, { x: e.clientX - r.left - img.offsetWidth / 2, y: e.clientY - r.top - img.offsetHeight / 2 }, { type: "spring", stiffness: 160, damping: 22, mass: 0.6 });
    };
    zona.addEventListener("pointermove", mover);
    return () => zona.removeEventListener("pointermove", mover);
  }, []);

  return (
    <div ref={caja} class="relative" onPointerLeave={() => (activa.value = null)}>
      {/* Imagen flotante (solo con ratón): las cinco apiladas, se ve la de la fila activa. */}
      <div
        ref={flotante}
        class="pointer-events-none absolute top-0 left-0 z-20 hidden aspect-[3/4] w-56 overflow-hidden rounded-[3px] shadow-2xl shadow-black/60 transition-[opacity,scale] duration-500 ease-suave [@media(hover:hover)_and_(pointer:fine)]:in-[.movimiento]:block"
        style={{ opacity: activa.value === null ? 0 : 1, scale: activa.value === null ? "0.85" : "1" }}
        aria-hidden="true"
      >
        {rutas.map((r, i) => (
          <img
            key={r.id}
            src={r.imagen.src}
            width={r.imagen.width}
            height={r.imagen.height}
            alt=""
            loading="lazy"
            decoding="async"
            class="absolute inset-0 size-full object-cover transition-opacity duration-500"
            style={{ opacity: activa.value === i ? 1 : 0 }}
          />
        ))}
      </div>

      <ul class="border-t border-borde">
        {rutas.map((r, i) => (
          <li key={r.id} class="border-b border-borde" style={{ "--ruta": r.color }}>
            <a
              href={`/canciones?ruta=${r.id}`}
              onPointerEnter={() => (activa.value = i)}
              onFocus={() => (activa.value = i)}
              onBlur={() => (activa.value = null)}
              class="group relative z-10 grid grid-cols-[auto_1fr_auto] items-center gap-x-5 py-5 sm:gap-x-8 sm:py-7"
            >
              {/* Miniatura fija: solo donde no hay imagen flotante (táctil o sin movimiento). */}
              <img
                src={r.imagen.src}
                width={r.imagen.width}
                height={r.imagen.height}
                alt=""
                loading="lazy"
                decoding="async"
                class="size-14 rounded-[3px] object-cover [@media(hover:hover)_and_(pointer:fine)]:in-[.movimiento]:hidden"
              />
              <span class="hidden size-3 rounded-full bg-(--ruta) transition-transform duration-500 ease-suave group-hover:scale-150 [@media(hover:hover)_and_(pointer:fine)]:in-[.movimiento]:block" aria-hidden="true" />
              <span class="min-w-0">
                <span class="block font-display text-4xl leading-none transition-transform duration-500 ease-suave group-hover:translate-x-2 sm:text-6xl">
                  {r.nombre}
                </span>
                <span class="mt-2 line-clamp-1 max-w-2xl text-sm text-tenue">{r.descripcion}</span>
              </span>
              <span class="font-mono text-xs text-tenue tabular-nums">
                {r.obras} <span class="hidden sm:inline">obras</span>
                <span class="ml-2 inline-block transition-transform duration-500 ease-suave group-hover:translate-x-1" aria-hidden="true">→</span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
