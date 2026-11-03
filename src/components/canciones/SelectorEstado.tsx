import { useSignal } from "@preact/signals";
import { actions } from "astro:actions";
import { LogIn } from "lucide-preact";
import { ESTADOS_CANCION, type EstadoCancion } from "@/lib/estado-cancion";
import { ESTADO_CANCION } from "./estado";

interface Props {
  /** Id de la canción. */
  cancion: string;
  /** Estado guardado. */
  estado: EstadoCancion;
  /** ¿Hay sesión? Sin ella, se invita a entrar en vez de elegir. */
  sesion: boolean;
}

/**
 * @component SelectorEstado (isla: `client:load`)
 * Dónde vas con una canción: pendiente, aprendiendo o dominada. Son tres opciones
 * excluyentes, así que son radios de verdad dentro de un `<fieldset>` (con su `<legend>`):
 * se recorren con las flechas del teclado sin trabajo extra.
 *
 * Al elegir, cambia al momento y guarda con la Action `cambiarEstadoCancion`; si el
 * servidor dice que no, vuelve al estado anterior y enseña el error. (A diferencia del
 * árbol, aquí no hay celebración que deshacer, así que no hace falta esperar.)
 */
export default function SelectorEstado({ cancion, estado: inicial, sesion }: Props) {
  const estado = useSignal(inicial);
  const ocupado = useSignal(false);
  const error = useSignal<string | undefined>(undefined);

  if (!sesion) {
    return (
      <a href={`/entrar?siguiente=${encodeURIComponent(`/canciones/${cancion}`)}`} class="boton">
        <LogIn size={15} aria-hidden="true" /> Entra para llevar tu avance
      </a>
    );
  }

  async function elegir(nuevo: EstadoCancion) {
    const antes = estado.value;
    estado.value = nuevo; // el radio ya se movió en pantalla; si el servidor dice que no, se deshace
    ocupado.value = true;
    error.value = undefined;
    const r = await actions.cambiarEstadoCancion({ cancion, estado: nuevo });
    ocupado.value = false;
    if (r.error) {
      estado.value = antes;
      error.value = r.error.message;
    }
  }

  return (
    <fieldset class="grid gap-2" aria-busy={ocupado.value}>
      <legend class="mb-2 font-mono text-[0.6875rem] tracking-[0.06em] text-tenue uppercase">Tu avance</legend>
      <div class="grid gap-2 sm:grid-cols-3">
        {ESTADOS_CANCION.map((e) => {
          const { nombre, ayuda, Icono, elegido } = ESTADO_CANCION[e];
          const activo = estado.value === e;
          return (
            <label
              key={e}
              class={`flex cursor-pointer items-start gap-2.5 rounded-[3px] border px-3 py-2.5 transition-colors has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-acento ${
                activo ? elegido : "border-borde text-tenue hover:border-borde-fuerte hover:text-texto"
              }`}
            >
              <input type="radio" name={`estado-${cancion}`} value={e} checked={activo} disabled={ocupado.value} onChange={() => elegir(e)} class="sr-only" />
              <Icono size={16} class="mt-0.5 shrink-0" aria-hidden="true" />
              <span>
                <span class="block text-sm font-medium">{nombre}</span>
                <span class="block text-xs opacity-75">{ayuda}</span>
              </span>
            </label>
          );
        })}
      </div>
      {error.value && (
        <p role="alert" class="text-sm text-peligro">
          {error.value}
        </p>
      )}
    </fieldset>
  );
}
