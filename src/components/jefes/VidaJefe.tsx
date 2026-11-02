import { useEffect, useRef } from "preact/hooks";
import { animate } from "motion";
import { golpes } from "./combate";

interface Props {
  /** Número de condiciones de victoria, contando la grabación: la vida del jefe. */
  total: number;
  /** Ya está vencido (progreso guardado): la vida empieza en cero. */
  vencido: boolean;
}

/**
 * @component VidaJefe (isla: `client:load`)
 * Barra de vida del jefe, como en un juego de combate: un segmento por condición
 * de victoria. Cada condición cumplida en `CombateJefe` le quita uno, y la barra
 * tiembla. Comparte el estado con esa isla a través de `./combate`.
 */
export default function VidaJefe({ total, vencido }: Props) {
  const barra = useRef<HTMLDivElement>(null);
  const quitados = vencido ? total : golpes.value.size;
  const vida = total - quitados;
  const anterior = useRef(vida);

  // Al perder vida, la barra tiembla (si no se pide menos movimiento).
  useEffect(() => {
    if (vida < anterior.current && barra.current && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
      animate(barra.current, { x: [0, -7, 6, -4, 3, 0] }, { duration: 0.45 });
    }
    anterior.current = vida;
  }, [vida]);

  return (
    <div class="max-w-xl">
      <div class="flex items-baseline justify-between font-mono text-[0.625rem] tracking-[0.08em] uppercase">
        <span class={vida === 0 ? "text-exito" : "text-peligro"}>{vida === 0 ? "Derrotado" : "Vida del jefe"}</span>
        <span class="text-tenue tabular-nums" aria-hidden="true">
          {vida} / {total}
        </span>
      </div>
      <div ref={barra} class="mt-2 flex h-3 gap-1 rounded-[2px] border border-peligro/40 bg-fondo/70 p-0.5" aria-hidden="true">
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            class={`flex-1 rounded-[1px] transition-all duration-500 ease-suave ${
              i < vida ? "bg-linear-to-r from-peligro to-[color-mix(in_oklab,var(--peligro)_70%,var(--texto))] shadow-[0_0_10px_var(--peligro)]" : "bg-borde/40"
            }`}
          />
        ))}
      </div>
      <p class="sr-only" aria-live="polite">
        {vida === 0 ? "Jefe derrotado." : `Vida del jefe: ${vida} de ${total}.`}
      </p>
    </div>
  );
}
