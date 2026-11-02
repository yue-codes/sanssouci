import { Check, KeyRound, RotateCcw, Swords, Trophy, Video } from "lucide-preact";
import Estallido from "@/components/ui/Estallido";
import { alternarGolpe, golpes, reiniciarCombate } from "./combate";

interface Props {
  /** Nombre del jefe. */
  nombre: string;
  /** Condiciones de victoria (sin la grabación: la añade este componente al final). */
  criterios: string[];
  /** Tempo de la victoria, p. ej. «♩ = 72 con metrónomo». */
  tempo: string;
  /** Ya está vencido (progreso guardado). */
  vencido: boolean;
  /** Tienes todas las llaves de su puerta. */
  abierta: boolean;
}

/**
 * @component CombateJefe (isla: `client:load`)
 * El combate: las condiciones de victoria como golpes. Cada casilla que marcas le
 * quita vida al jefe (la barra la pinta `VidaJefe`, con el estado compartido de
 * `./combate`). La última siempre es **grabar el video**, porque grabar es parte de
 * la victoria. Al completar todas: pantalla de «¡Victoria!».
 *
 * Las casillas son `<input type="checkbox">` de verdad, así funcionan con teclado
 * y lectores de pantalla sin trabajo extra. Demo hasta la fase 4: no se guarda.
 */
export default function CombateJefe({ nombre, criterios, tempo, vencido, abierta }: Props) {
  const lista = [...criterios, "Grabar el video de la victoria."];
  const hechos = vencido ? lista.length : golpes.value.size;
  const victoria = hechos === lista.length;

  return (
    <div class="relative overflow-hidden rounded-md border border-peligro/40 bg-superficie">
      <div class="flex items-center justify-between gap-4 border-b border-borde px-5 py-3">
        <h2 class="flex items-center gap-2 font-mono text-[0.6875rem] tracking-[0.08em] text-peligro uppercase">
          <Swords size={14} aria-hidden="true" /> Condiciones de victoria
        </h2>
        <span class="font-mono text-[0.6875rem] text-tenue">{tempo}</span>
      </div>

      {!abierta && !vencido && (
        <p class="flex items-start gap-2 border-b border-borde bg-peligro/10 px-5 py-3 text-sm">
          <KeyRound size={15} class="mt-0.5 shrink-0 text-peligro" aria-hidden="true" />
          <span>
            <span class="font-semibold">Puerta cerrada:</span> te faltan llaves. Puedes ensayar el combate, pero la victoria cuenta cuando las tengas todas.
          </span>
        </p>
      )}

      <ul class="grid gap-1 p-3">
        {lista.map((texto, i) => {
          const grabar = i === criterios.length;
          const marcado = vencido || golpes.value.has(i);
          return (
            <li key={i}>
              <label
                class={`group flex cursor-pointer items-start gap-3 rounded-[3px] px-3 py-2.5 transition-colors hover:bg-superficie-2 ${
                  grabar ? "mt-1 border border-dashed border-peligro/50" : ""
                } ${vencido ? "cursor-default" : ""}`}
              >
                <input
                  type="checkbox"
                  checked={marcado}
                  disabled={vencido}
                  onChange={() => alternarGolpe(i)}
                  class="peer sr-only"
                />
                <span
                  class={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-[3px] border-2 transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-acento ${
                    marcado ? "border-exito bg-exito text-fondo" : "border-peligro/60 text-transparent group-hover:border-peligro"
                  }`}
                  aria-hidden="true"
                >
                  <Check size={13} strokeWidth={3} />
                </span>
                <span class={`text-sm leading-relaxed ${marcado ? "text-tenue line-through decoration-exito/60" : ""} ${grabar ? "flex items-center gap-1.5 font-semibold" : ""}`}>
                  {grabar && <Video size={14} class="shrink-0 text-peligro" aria-hidden="true" />}
                  {grabar ? "Golpe final: " : ""}
                  {texto}
                </span>
              </label>
            </li>
          );
        })}
      </ul>

      {victoria && (
        <div class="relative grid place-items-center border-t border-exito/40 bg-exito/10 px-5 py-8 text-center" role="status">
          {!vencido && <Estallido chispas={18} alcance={90} />}
          <Trophy size={32} class="text-exito" aria-hidden="true" />
          <p class="mt-2 font-mono text-[0.6875rem] tracking-[0.12em] text-exito uppercase">{vencido ? "Jefe vencido" : "¡Victoria!"}</p>
          <p class="mt-1 font-display text-3xl">{nombre} cae derrotado</p>
          <p class="mt-2 max-w-sm text-sm text-tenue">
            {vencido
              ? "Ya lo venciste. Su puerta queda abierta para siempre."
              : "Cuando exista el inicio de sesión, aquí pegarás el enlace a tu video y la victoria quedará guardada."}
          </p>
          {!vencido && (
            <button type="button" onClick={reiniciarCombate} class="boton-borde mt-5">
              <RotateCcw size={14} aria-hidden="true" /> Repetir el combate (demo)
            </button>
          )}
        </div>
      )}
    </div>
  );
}
