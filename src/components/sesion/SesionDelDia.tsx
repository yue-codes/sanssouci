import { useComputed, useSignal } from "@preact/signals";
import { Check } from "lucide-preact";
import AnilloProgreso from "@/components/ui/AnilloProgreso";
import { TIPO_BLOQUE, type TipoBloque } from "./bloques";

/** Un bloque de la sesión (mismo formato que en dias.json). */
export interface Bloque {
  tipo: TipoBloque;
  minutos: number;
  actividad: string;
  recurso?: string;
}

interface Props {
  /** Bloques del día, en orden. */
  bloques: Bloque[];
}

/**
 * @component SesionDelDia (isla: `client:visible`)
 * Lista de bloques de una sesión con progreso en vivo: marcas cada bloque al
 * terminarlo y el anillo suma los minutos.
 * Usa signals: al marcar un bloque, solo se vuelve a pintar lo que depende de ese dato
 * (el anillo y los minutos), sin re-renderizar toda la lista.
 * En la fase 4, `hechos` se guardará en Supabase; ahora es solo de demostración.
 */
export default function SesionDelDia({ bloques }: Props) {
  const hechos = useSignal<Set<number>>(new Set());
  const total = bloques.reduce((s, b) => s + b.minutos, 0);
  const minutosHechos = useComputed(() => bloques.reduce((s, b, i) => (hechos.value.has(i) ? s + b.minutos : s), 0));
  const progreso = useComputed(() => (total ? minutosHechos.value / total : 0));

  function alternar(i: number) {
    const s = new Set(hechos.value);
    s.has(i) ? s.delete(i) : s.add(i);
    hechos.value = s; // asignar un objeto nuevo es lo que avisa a los signals del cambio
  }

  return (
    <div class="grid gap-6 md:grid-cols-[auto_1fr] md:items-start">
      <div class="flex items-center gap-4 md:flex-col md:items-center">
        <AnilloProgreso valor={progreso.value} etiqueta={`${minutosHechos.value} / ${total} min`} />
        <p class="text-sm text-tenue md:text-center">
          {progreso.value === 1 ? "¡Sesión completa!" : "Marca cada bloque al terminarlo"}
        </p>
      </div>
      <ol class="grid gap-2">
        {bloques.map((b, i) => {
          const hecho = hechos.value.has(i);
          const { nombre, Icono } = TIPO_BLOQUE[b.tipo];
          return (
            <li key={i}>
              <button
                type="button"
                aria-pressed={hecho}
                onClick={() => alternar(i)}
                class="group flex w-full items-start gap-3 rounded-xl border border-borde bg-superficie-2/50 p-3 text-left transition hover:border-acento/60 aria-pressed:border-exito/50 aria-pressed:bg-exito/10"
              >
                <span
                  aria-hidden="true"
                  class={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border-2 transition ${
                    hecho ? "border-exito bg-exito text-fondo" : "border-borde group-hover:border-acento"
                  }`}
                >
                  {hecho && <Check size={14} strokeWidth={3} />}
                </span>
                <span class="min-w-0 flex-1">
                  <span class="flex flex-wrap items-baseline gap-x-2">
                    <span class="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-acento">
                      <Icono size={13} aria-hidden="true" /> {nombre}
                    </span>
                    <span class="text-xs text-tenue">{b.minutos} min</span>
                  </span>
                  <span class={`mt-1 block text-sm leading-relaxed ${hecho ? "text-tenue line-through decoration-exito/60" : ""}`}>
                    {b.actividad}
                  </span>
                  {b.recurso && <span class="mt-1 block text-xs text-tenue">Recurso: {b.recurso}</span>}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
