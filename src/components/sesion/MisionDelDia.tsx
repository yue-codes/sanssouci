import { useComputed, useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import { Check, Pause, Play, RotateCcw, SkipForward, Timer, Trophy } from "lucide-preact";
import AnilloProgreso from "@/components/ui/AnilloProgreso";
import Estallido from "@/components/ui/Estallido";
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

/** Segundos en formato «m:ss». */
const reloj = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

/**
 * @component MisionDelDia (isla: `client:load`)
 * La sesión del día como el registro de una misión: cada bloque es una etapa
 * sobre un camino. Se puede marcar a mano o jugarla con el **cronómetro**:
 * «Empezar» arranca la cuenta atrás de la primera etapa pendiente; al acabar el
 * tiempo, la etapa avisa («¡Tiempo!») y tú decides cuándo darla por hecha
 * (practicando, a veces conviene seguir un poco). Al completar todas: «¡Misión cumplida!».
 *
 * Estado con signals: `hechos` (etapas cumplidas), `activa` (la del cronómetro),
 * `restante` (segundos) y `corriendo`. El intervalo de un segundo vive en un
 * `useEffect` que se limpia al pausar o al salir. Demo hasta la fase 4: no se guarda.
 */
export default function MisionDelDia({ bloques }: Props) {
  const hechos = useSignal<ReadonlySet<number>>(new Set());
  const activa = useSignal<number | undefined>(undefined);
  const restante = useSignal(0);
  const corriendo = useSignal(false);

  const total = bloques.reduce((s, b) => s + b.minutos, 0);
  const minutosHechos = useComputed(() => bloques.reduce((s, b, i) => (hechos.value.has(i) ? s + b.minutos : s), 0));
  const completa = hechos.value.size === bloques.length;

  // El cronómetro: resta un segundo mientras corre; se para solo al llegar a cero.
  useEffect(() => {
    if (!corriendo.value) return;
    const id = setInterval(() => {
      if (restante.value <= 1) {
        restante.value = 0;
        corriendo.value = false;
      } else restante.value -= 1;
    }, 1000);
    return () => clearInterval(id);
  }, [corriendo.value]);

  /** Arranca el cronómetro en una etapa (desde su duración completa). */
  function empezar(i: number) {
    activa.value = i;
    restante.value = bloques[i].minutos * 60;
    corriendo.value = true;
  }

  /** Marca o desmarca una etapa. Si era la del cronómetro, pasa a la siguiente pendiente. */
  function alternar(i: number) {
    const s = new Set(hechos.value);
    const marcar = !s.has(i);
    marcar ? s.add(i) : s.delete(i);
    hechos.value = s;
    if (marcar && activa.value === i) {
      const siguiente = bloques.findIndex((_, j) => j > i && !s.has(j));
      siguiente >= 0 ? empezar(siguiente) : ((activa.value = undefined), (corriendo.value = false));
    }
  }

  function reiniciar() {
    hechos.value = new Set();
    activa.value = undefined;
    corriendo.value = false;
  }

  const primeraPendiente = bloques.findIndex((_, i) => !hechos.value.has(i));
  const a = activa.value;

  return (
    <div class="grid gap-8 lg:grid-cols-[16rem_1fr] lg:items-start">
      {/* Panel de la misión: progreso y cronómetro */}
      <div class="grid gap-5 rounded-md border border-borde bg-superficie p-5 lg:sticky lg:top-24">
        <div class="flex items-center gap-4 lg:flex-col lg:text-center">
          <AnilloProgreso valor={total ? minutosHechos.value / total : 0} etiqueta={`${minutosHechos.value} / ${total} min`} />
          <p class="font-mono text-[0.6875rem] tracking-[0.06em] text-tenue uppercase">
            Etapas <span class="text-texto tabular-nums">{hechos.value.size} / {bloques.length}</span>
          </p>
        </div>

        {a !== undefined && !completa ? (
          <div class="rounded-[3px] border border-acento/40 bg-acento-suave/40 p-3 text-center">
            <p class="font-mono text-[0.625rem] tracking-[0.08em] text-acento uppercase">{TIPO_BLOQUE[bloques[a].tipo].nombre}</p>
            <p class={`mt-1 font-mono text-4xl tabular-nums ${restante.value === 0 ? "animate-pulse text-exito" : ""}`} role="timer" aria-live="off">
              {restante.value === 0 ? "¡Tiempo!" : reloj(restante.value)}
            </p>
            <div class="mt-3 flex justify-center gap-2">
              {restante.value > 0 && (
                <button type="button" onClick={() => (corriendo.value = !corriendo.value)} class="boton-borde px-3 py-2">
                  {corriendo.value ? <Pause size={15} aria-hidden="true" /> : <Play size={15} aria-hidden="true" />}
                  {corriendo.value ? "Pausar" : "Seguir"}
                </button>
              )}
              <button type="button" onClick={() => alternar(a)} class="boton px-3 py-2">
                <Check size={15} aria-hidden="true" /> Hecho
              </button>
            </div>
          </div>
        ) : !completa ? (
          <button type="button" onClick={() => empezar(primeraPendiente)} class="boton w-full justify-center">
            <Timer size={16} aria-hidden="true" /> {hechos.value.size ? "Seguir la misión" : "Empezar la misión"}
          </button>
        ) : null}

        <p class="sr-only" aria-live="polite">{a !== undefined && restante.value === 0 ? "Tiempo de la etapa cumplido." : ""}</p>
        <p class="text-xs leading-relaxed text-tenue">
          El cronómetro es una guía: si una etapa pide más tiempo, dáselo. Demo, no se guarda todavía.
        </p>
      </div>

      {/* Las etapas, sobre un camino */}
      <div>
        <ol class="relative grid gap-3">
          <span class="absolute top-6 bottom-6 left-[1.1875rem] border-l-2 border-dashed border-borde" aria-hidden="true" />
          {bloques.map((b, i) => {
            const hecho = hechos.value.has(i);
            const enCurso = a === i && !hecho;
            const { nombre, Icono } = TIPO_BLOQUE[b.tipo];
            return (
              <li key={i} class="relative flex gap-4">
                <button
                  type="button"
                  aria-pressed={hecho}
                  onClick={() => alternar(i)}
                  aria-label={`${nombre}: ${hecho ? "hecha" : "pendiente"}. Marcar o desmarcar.`}
                  class={`relative z-10 mt-2 grid size-10 shrink-0 place-items-center rounded-full border-2 transition-colors ${
                    hecho
                      ? "border-exito bg-exito text-fondo shadow-[0_0_14px_var(--exito)]"
                      : enCurso
                        ? "border-acento bg-acento-suave text-acento-claro"
                        : "border-borde-fuerte bg-fondo text-tenue hover:border-acento"
                  }`}
                >
                  {enCurso && <span class="absolute inset-0 animate-latido rounded-full bg-acento/40" aria-hidden="true" />}
                  {hecho ? <Check size={18} strokeWidth={3} aria-hidden="true" /> : <Icono size={17} aria-hidden="true" />}
                </button>
                <div
                  class={`min-w-0 flex-1 rounded-md border p-4 transition-colors ${
                    enCurso ? "border-acento/60 bg-superficie" : hecho ? "border-exito/30 bg-superficie/50" : "border-borde bg-superficie/70"
                  }`}
                >
                  <div class="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <p class="font-mono text-[0.6875rem] tracking-[0.06em] text-acento uppercase">
                      Etapa {i + 1} · {nombre}
                    </p>
                    <p class="font-mono text-[0.6875rem] text-tenue tabular-nums">{b.minutos} min</p>
                  </div>
                  <p class={`mt-1.5 leading-relaxed ${hecho ? "text-tenue line-through decoration-exito/60" : ""}`}>{b.actividad}</p>
                  {b.recurso && <p class="mt-1.5 text-sm text-tenue">Recurso: {b.recurso}</p>}
                  {!hecho && !enCurso && (
                    <button type="button" onClick={() => empezar(i)} class="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-acento hover:text-acento-claro">
                      <SkipForward size={13} aria-hidden="true" /> Cronometrar esta etapa
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ol>

        {completa && (
          <div class="relative mt-6 grid place-items-center overflow-hidden rounded-md border border-exito/50 bg-exito/10 px-5 py-8 text-center" role="status">
            <Estallido chispas={18} alcance={90} />
            <Trophy size={30} class="text-exito" aria-hidden="true" />
            <p class="mt-2 font-mono text-[0.6875rem] tracking-[0.12em] text-exito uppercase">¡Misión cumplida!</p>
            <p class="mt-1 font-display text-3xl">+{total} minutos de práctica</p>
            <p class="mt-2 max-w-sm text-sm text-tenue">Cuando exista el inicio de sesión, este día quedará marcado y sumará a tu racha.</p>
            <button type="button" onClick={reiniciar} class="boton-borde mt-5">
              <RotateCcw size={14} aria-hidden="true" /> Empezar de nuevo (demo)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
