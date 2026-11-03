import { useSignal } from "@preact/signals";
import { Eye, EyeOff, LockKeyhole } from "lucide-preact";
import { useEffect } from "preact/hooks";

interface Props {
  /** `id` y `name` del campo (el `name` es lo que lee el servidor). */
  id: string;
  /** `current-password` al entrar; `new-password` al crearla (el gestor de contraseñas propone una fuerte). */
  autocomplete: "current-password" | "new-password";
  /** Longitud mínima (solo al crearla). */
  minLength?: number;
  /** Ids de los textos que describen el campo (ayuda y error), para `aria-describedby`. */
  describedby?: string;
  /** El campo tiene un error. */
  invalido?: boolean;
}

/**
 * @component CampoContrasena (isla: `client:load`)
 * Campo de contraseña con botón para mostrarla u ocultarla. Hoy se prefiere esto a
 * pedirla dos veces: ves lo que escribiste en vez de repetirlo a ciegas.
 *
 * Funciona sin JavaScript: el HTML del servidor ya trae el `<input>` (es un campo
 * normal hasta que la isla se monta y aparece el botón). La etiqueta (`<label for>`)
 * la pone quien lo usa.
 */
export default function CampoContrasena({ id, autocomplete, minLength, describedby, invalido }: Props) {
  const visible = useSignal(false);
  // El botón solo sirve con JavaScript: aparece al montarse la isla (no en el HTML del servidor).
  const montado = useSignal(false);
  useEffect(() => {
    montado.value = true;
  }, []);

  return (
    <div class="relative">
      <LockKeyhole size={16} class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-tenue" aria-hidden="true" />
      <input
        id={id}
        name={id}
        // Los tipos de Preact separan <input> por su `type` y no aceptan la unión
        // "text" | "password"; en el HTML es un atributo como otro cualquiera.
        type={(visible.value ? "text" : "password") as "text"}
        required
        autocomplete={autocomplete}
        minLength={minLength}
        maxLength={200}
        // Que el navegador no «corrija» ni capitalice lo que se ve en claro.
        autocapitalize="off"
        spellcheck={false}
        aria-invalid={invalido ? "true" : undefined}
        aria-describedby={describedby}
        class="w-full rounded-[3px] border border-borde-fuerte bg-superficie py-3 pr-11 pl-9 text-sm transition-colors focus:border-acento aria-invalid:border-peligro/60"
      />
      {montado.value && (
        <button
          type="button"
          onClick={() => (visible.value = !visible.value)}
          aria-pressed={visible.value}
          aria-label="Mostrar contraseña"
          class="absolute top-1/2 right-1.5 grid size-8 -translate-y-1/2 place-items-center rounded-[3px] text-tenue transition-colors hover:text-texto"
        >
          {visible.value ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
        </button>
      )}
    </div>
  );
}
