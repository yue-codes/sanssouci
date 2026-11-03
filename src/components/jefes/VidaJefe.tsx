import { useEffect, useRef } from "preact/hooks";
import { animate } from "motion";
import { estadoJefe, golpes } from "./combate";

interface Props {
  /** Número de condiciones de victoria, contando la grabación: la vida del jefe. */
  total: number;
  /** Ids de los logros que abren su puerta (sus llaves). */
  llaves: string[];
}

/** Sello de la puerta según tu progreso. */
const SELLO = {
  derrotado: { texto: "Derrotado", clase: "bg-exito text-fondo" },
  abierta: { texto: "Puerta abierta · ya puedes enfrentarlo", clase: "bg-peligro text-fondo" },
  cerrada: { texto: "Puerta cerrada", clase: "bg-fondo/80 text-peligro border border-peligro/50" },
};

/**
 * @component VidaJefe (isla: `client:load`)
 * Barra de vida del jefe, como en un juego de combate: un segmento por condición
 * de victoria. Cada condición cumplida en `CombateJefe` le quita uno, y la barra
 * tiembla. Debajo, el sello de la puerta (cerrada, abierta o derrotado).
 *
 * Vive en la portada, que es estática: tu progreso le llega por `estadoJefe`
 * (`./combate`) cuando la arena carga. Mientras tanto, el sello es un hueco discreto.
 */
export default function VidaJefe({ total, llaves }: Props) {
  const barra = useRef<HTMLDivElement>(null);
  const estado = estadoJefe.value;
  const vencido = estado?.vencido ?? false;
  const quitados = vencido ? total : golpes.value.size;
  const vida = total - quitados;
  const anterior = useRef(vida);
  const sello =
    estado && SELLO[vencido ? "derrotado" : llaves.every((l) => estado.obtenidos.has(l)) ? "abierta" : "cerrada"];

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
      {sello ? (
        <p class={`mt-4 inline-flex items-center gap-1.5 rounded-[2px] px-2 py-1 font-mono text-[0.625rem] font-semibold uppercase ${sello.clase}`}>
          {sello.texto}
        </p>
      ) : (
        <span class="mt-4 inline-block h-6 w-40 animate-pulse rounded-[2px] bg-fondo/60" aria-hidden="true" />
      )}
    </div>
  );
}
