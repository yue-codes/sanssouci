import { useSignal } from "@preact/signals";
import { actions } from "astro:actions";
import { Check, LogIn, Save, Undo2 } from "lucide-preact";
import { SITIO } from "@/config/sitio";
import { fechaLarga, hoyIso } from "@/lib/fechas";
import type { RegistroDia as Registro } from "@/lib/progreso-usuario";

interface Props {
  /** Número del día (1 a 90). */
  numero: number;
  /** ¿Hay sesión? Sin ella, se invita a entrar en vez de guardar. */
  sesion: boolean;
  /** El registro guardado de este día, o `null` si aún no está marcado. */
  registro: Registro | null;
  /** Se llama al guardar o deshacer, con el registro nuevo (o `null`). */
  alCambiar: (registro: Registro | null) => void;
  /** Minutos que se guardan al marcar el día (los de las etapas hechas). */
  minutos: number;
}

/** Fecha en que se marcó, en la zona horaria del plan («lunes, 2 de noviembre»). */
const cuando = (instante: string) => fechaLarga(hoyIso(SITIO.zonaHoraria, new Date(instante)));

/**
 * @component RegistroDia
 * El final de la misión: guarda el día en tu progreso (Action `marcarDia`) o lo
 * deshace (`desmarcarDia`). Tiene tres caras:
 *
 * - **Sin sesión:** un enlace a `/entrar` que vuelve a este día.
 * - **Sin guardar:** notas opcionales y «Guardar en mi progreso».
 * - **Guardado:** la fecha, los minutos, las notas y «Deshacer».
 *
 * No es isla por sí sola: la pinta `MisionDelDia`, que guarda el registro (así la
 * misión entera sabe si el día está hecho). Mientras espera al servidor, los botones
 * se desactivan y dicen «Guardando…»; si algo falla, el error se anuncia (`role="alert"`).
 */
export default function RegistroDia({ numero, sesion, registro, alCambiar, minutos }: Props) {
  const notas = useSignal("");
  const ocupado = useSignal(false);
  const error = useSignal<string | undefined>(undefined);

  /** Ejecuta una acción con su estado de «ocupado» y su error. */
  async function ejecutar(llamada: () => Promise<{ data?: Registro | null; error?: { message: string } }>) {
    ocupado.value = true;
    error.value = undefined;
    const r = await llamada();
    ocupado.value = false;
    if (r.error) error.value = r.error.message;
    else alCambiar(r.data ?? null);
  }

  const guardar = () => ejecutar(() => actions.marcarDia({ dia: numero, minutos: minutos || undefined, notas: notas.value }));
  const deshacer = () => ejecutar(() => actions.desmarcarDia({ dia: numero }));

  if (!sesion) {
    return (
      <div class="mt-5 grid justify-items-center gap-3">
        <p class="max-w-sm text-sm text-tenue">Entra para guardar este día en tu progreso y que sume a tu racha.</p>
        <a href={`/entrar?siguiente=${encodeURIComponent(`/dias/${numero}`)}`} class="boton">
          <LogIn size={15} aria-hidden="true" /> Entrar y guardar
        </a>
      </div>
    );
  }

  return (
    <div class="mt-5 grid w-full max-w-md justify-items-center gap-3">
      {registro ? (
        <>
          <p class="inline-flex items-center gap-2 rounded-[3px] border border-exito/40 bg-fondo/60 px-3 py-1.5 text-sm">
            <Check size={15} strokeWidth={3} class="text-exito" aria-hidden="true" />
            Guardado el <span class="first-letter:uppercase">{cuando(registro.completado_en)}</span>
            {registro.minutos && <span class="text-tenue">· {registro.minutos} min</span>}
          </p>
          {registro.notas && <p class="max-w-sm text-sm whitespace-pre-line text-tenue italic">«{registro.notas}»</p>}
          <button type="button" onClick={deshacer} disabled={ocupado.value} class="boton-borde px-3 py-2 disabled:opacity-60">
            <Undo2 size={14} aria-hidden="true" /> {ocupado.value ? "Deshaciendo…" : "Deshacer"}
          </button>
        </>
      ) : (
        <>
          <label class="grid w-full gap-1.5 text-left">
            <span class="font-mono text-[0.6875rem] tracking-[0.06em] text-tenue uppercase">Notas (opcional)</span>
            <textarea
              rows={2}
              maxLength={2000}
              value={notas.value}
              onInput={(e) => (notas.value = e.currentTarget.value)}
              placeholder="¿Qué salió bien? ¿Qué costó?"
              class="w-full resize-y rounded-[3px] border border-borde-fuerte bg-superficie px-3 py-2 text-sm transition-colors focus:border-acento"
            />
          </label>
          <button type="button" onClick={guardar} disabled={ocupado.value} class="boton disabled:opacity-60">
            <Save size={15} aria-hidden="true" /> {ocupado.value ? "Guardando…" : "Guardar en mi progreso"}
          </button>
        </>
      )}
      {error.value && (
        <p role="alert" class="text-sm text-peligro">
          {error.value}
        </p>
      )}
    </div>
  );
}
