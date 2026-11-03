import { useSignal } from "@preact/signals";
import { actions, isInputError } from "astro:actions";
import { useEffect } from "preact/hooks";
import { Check, ExternalLink, KeyRound, LogIn, RotateCcw, Swords, Trophy, Undo2, Video } from "lucide-preact";
import Estallido from "@/components/ui/Estallido";
import type { Victoria } from "@/lib/progreso-usuario";
import { alternarGolpe, estadoJefe, golpes, reiniciarCombate } from "./combate";

interface Props {
  /** Id del jefe (es lo que se guarda). */
  jefe: string;
  /** Nombre del jefe. */
  nombre: string;
  /** Condiciones de victoria (sin la grabación: la añade este componente al final). */
  criterios: string[];
  /** Tempo de la victoria, p. ej. «♩ = 72 con metrónomo». */
  tempo: string;
  /** Ids de los logros que abren su puerta (sus llaves). */
  llaves: string[];
  /** Ids de los logros que tienes (vacío sin sesión). */
  obtenidos: string[];
  /** Tu victoria guardada, o `null` si sigue en pie. */
  victoria: Victoria | null;
  /** ¿Hay sesión? Sin ella, al vencer se invita a entrar. */
  sesion: boolean;
}

/** Clase de los campos del formulario de victoria. */
const CAMPO =
  "w-full rounded-[3px] border border-borde-fuerte bg-superficie px-3 py-2 text-sm transition-colors focus:border-acento aria-invalid:border-peligro/60";
/** Clase de las etiquetas de los campos. */
const ETIQUETA = "font-mono text-[0.6875rem] tracking-[0.06em] text-tenue uppercase";

/**
 * @component CombateJefe (isla: `client:load`)
 * El combate: las condiciones de victoria como golpes. Cada casilla que marcas le
 * quita vida al jefe (la barra la pinta `VidaJefe`, con el estado compartido de
 * `./combate`). La última siempre es **grabar el video**, porque grabar es parte de
 * la victoria. Al completar todas: «¡Victoria!» y el formulario para guardarla con
 * el enlace al video (Action `registrarVictoria`). Solo cuenta con la puerta abierta.
 *
 * Al montarse publica tu progreso en `estadoJefe`, que leen las islas de la portada
 * (estática). Lo pinta la Server Island `ArenaConProgreso`.
 *
 * Las casillas son `<input type="checkbox">` de verdad, así funcionan con teclado
 * y lectores de pantalla sin trabajo extra.
 */
export default function CombateJefe(props: Props) {
  const { jefe, nombre, criterios, tempo, llaves, obtenidos, sesion } = props;
  const victoria = useSignal(props.victoria);
  const video = useSignal("");
  const tempoLogrado = useSignal("");
  const ocupado = useSignal(false);
  const error = useSignal<string | undefined>(undefined);

  const vencido = victoria.value !== null;
  const abierta = llaves.every((l) => obtenidos.includes(l));
  const lista = [...criterios, "Grabar el video de la victoria."];
  const hechos = vencido ? lista.length : golpes.value.size;
  const completo = hechos === lista.length;

  // Publica tu progreso para la portada; y otra vez cuando vences o anulas.
  useEffect(() => {
    estadoJefe.value = { vencido, obtenidos: new Set(obtenidos) };
  }, [vencido]);

  async function guardar(e: Event) {
    e.preventDefault();
    ocupado.value = true;
    error.value = undefined;
    const t = Number(tempoLogrado.value);
    const r = await actions.registrarVictoria({ jefe, video: video.value.trim(), tempo: tempoLogrado.value ? t : undefined });
    ocupado.value = false;
    if (r.error) error.value = isInputError(r.error) ? Object.values(r.error.fields).flat()[0] : r.error.message;
    else victoria.value = r.data;
  }

  async function anular() {
    ocupado.value = true;
    error.value = undefined;
    const r = await actions.anularVictoria({ jefe });
    ocupado.value = false;
    if (r.error) error.value = r.error.message;
    else {
      victoria.value = null;
      reiniciarCombate();
    }
  }

  const mensajeError = error.value && (
    <p id="error-victoria" role="alert" class="text-sm text-peligro">
      {error.value}
    </p>
  );

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
                <input type="checkbox" checked={marcado} disabled={vencido} onChange={() => alternarGolpe(i)} class="peer sr-only" />
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

      {completo && (
        <div class="relative grid place-items-center border-t border-exito/40 bg-exito/10 px-5 py-8 text-center">
          {!props.victoria && <Estallido chispas={18} alcance={90} />}
          {/* Solo el anuncio es región viva: si el formulario estuviera dentro, se leería entero al teclear. */}
          <div role="status" class="grid justify-items-center">
            <Trophy size={32} class="text-exito" aria-hidden="true" />
            <p class="mt-2 font-mono text-[0.6875rem] tracking-[0.12em] text-exito uppercase">{vencido ? "Jefe vencido" : "¡Victoria!"}</p>
            <p class="mt-1 font-display text-3xl">{nombre} cae derrotado</p>
          </div>

          {victoria.value ? (
            <div class="mt-4 grid justify-items-center gap-3">
              <p class="text-sm text-tenue">Su puerta queda abierta para siempre.</p>
              <a href={victoria.value.video_url} target="_blank" rel="noopener noreferrer" class="enlace-flecha text-sm">
                <Video size={14} aria-hidden="true" /> Ver tu video{victoria.value.tempo_logrado && ` · ♩ = ${victoria.value.tempo_logrado}`}
                <ExternalLink size={13} aria-hidden="true" />
                <span class="sr-only">(se abre en otra pestaña)</span>
              </a>
              <button type="button" onClick={anular} disabled={ocupado.value} class="inline-flex items-center gap-1.5 text-xs font-semibold text-tenue hover:text-texto disabled:opacity-60">
                <Undo2 size={13} aria-hidden="true" /> {ocupado.value ? "Anulando…" : "Anular la victoria"}
              </button>
              {mensajeError}
            </div>
          ) : !sesion ? (
            <div class="mt-4 grid justify-items-center gap-3">
              <p class="max-w-sm text-sm text-tenue">Entra para guardar la victoria con tu video.</p>
              <a href={`/entrar?siguiente=${encodeURIComponent(`/jefes/${jefe}`)}`} class="boton">
                <LogIn size={15} aria-hidden="true" /> Entrar y guardar
              </a>
            </div>
          ) : !abierta ? (
            <p class="mt-3 max-w-sm text-sm text-tenue">Buen ensayo. La victoria contará cuando tengas todas las llaves de su puerta.</p>
          ) : (
            <form onSubmit={guardar} class="mt-5 grid w-full max-w-md gap-3 text-left">
              <label class="grid gap-1.5">
                <span class={ETIQUETA}>Enlace a tu video (obligatorio)</span>
                <input
                  type="url"
                  required
                  pattern="https://.*"
                  maxLength={500}
                  placeholder="https://youtu.be/…"
                  value={video.value}
                  onInput={(e) => (video.value = e.currentTarget.value)}
                  aria-invalid={error.value ? "true" : undefined}
                  aria-describedby={error.value ? "error-victoria" : undefined}
                  class={CAMPO}
                />
              </label>
              <label class="grid gap-1.5">
                <span class={ETIQUETA}>Tempo logrado, ♩ = (opcional)</span>
                <input
                  type="number"
                  min={20}
                  max={300}
                  inputMode="numeric"
                  placeholder="72"
                  value={tempoLogrado.value}
                  onInput={(e) => (tempoLogrado.value = e.currentTarget.value)}
                  class={`${CAMPO} max-w-32`}
                />
              </label>
              <button type="submit" disabled={ocupado.value} class="boton justify-center disabled:opacity-60">
                <Trophy size={15} aria-hidden="true" /> {ocupado.value ? "Guardando…" : "Guardar la victoria"}
              </button>
              {mensajeError}
            </form>
          )}

          {!vencido && (
            <button type="button" onClick={reiniciarCombate} class="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-tenue hover:text-texto">
              <RotateCcw size={13} aria-hidden="true" /> Repetir el combate
            </button>
          )}
        </div>
      )}
    </div>
  );
}
