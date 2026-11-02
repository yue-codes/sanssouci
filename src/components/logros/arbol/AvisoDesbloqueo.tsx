import { useEffect } from "preact/hooks";
import { Sparkles, X } from "lucide-preact";

/** Lo que se celebra: el talento conseguido y lo que abre. */
export interface Celebracion {
  /** Id del talento conseguido. */
  id: string;
  /** Su nombre. */
  nombre: string;
  /** Nombres de los talentos que pasan de bloqueados a disponibles. */
  abre: string[];
  /** Cambia en cada celebración (reinicia el aviso y el estallido). */
  clave: number;
}

interface Props {
  /** La celebración en curso, o `undefined` si no hay ninguna. */
  celebracion?: Celebracion;
  /** Se llama al cerrarlo (a mano o pasados unos segundos). */
  onCerrar: () => void;
}

/** Segundos que se queda visible el aviso. */
const SEGUNDOS = 6;

/**
 * @component AvisoDesbloqueo
 * Aviso tipo videojuego al conseguir un talento: «+1 talento» y lo que se abre.
 * Aparece abajo y centrado (en escritorio, arriba, para no tapar la ficha) y se
 * cierra solo. Es una región `aria-live`, así que los lectores de pantalla lo
 * anuncian; por eso el contenedor siempre existe y solo cambia su contenido.
 */
export default function AvisoDesbloqueo({ celebracion: c, onCerrar }: Props) {
  useEffect(() => {
    if (!c) return;
    const t = setTimeout(onCerrar, SEGUNDOS * 1000);
    return () => clearTimeout(t);
  }, [c?.clave]);

  return (
    <div role="status" aria-live="polite" class="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4 lg:top-24 lg:bottom-auto">
      {c && (
        <div
          key={c.clave}
          class="pointer-events-auto flex max-w-md items-start gap-3 rounded-md border border-exito/60 bg-fondo/90 p-4 pr-3 shadow-[0_0_50px_-12px_var(--exito)] backdrop-blur-md starting:translate-y-4 starting:opacity-0 transition duration-500 ease-suave"
        >
          <span class="grid size-9 shrink-0 place-items-center rounded-full bg-exito text-fondo" aria-hidden="true">
            <Sparkles size={18} />
          </span>
          <div class="min-w-0">
            <p class="font-mono text-[0.625rem] tracking-[0.08em] text-exito uppercase">+1 talento conseguido</p>
            <p class="mt-0.5 font-display text-2xl leading-tight">{c.nombre}</p>
            {c.abre.length > 0 && (
              <p class="mt-1 text-sm text-tenue">
                Se abre{c.abre.length > 1 ? "n" : ""}: <span class="text-resalte">{c.abre.join(", ")}</span>
              </p>
            )}
          </div>
          <button type="button" onClick={onCerrar} class="ml-1 rounded-sm p-1 text-tenue hover:text-texto" aria-label="Cerrar aviso">
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}
