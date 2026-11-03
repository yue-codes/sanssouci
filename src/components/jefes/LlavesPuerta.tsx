import { KeyRound } from "lucide-preact";
import { estadoJefe } from "./combate";

interface Props {
  /** Ids de los logros que abren la puerta del jefe. */
  llaves: string[];
}

/**
 * @component LlavesPuerta (isla: `client:load`)
 * Las llaves de la puerta en la ficha del jefe: una llave por logro que pide,
 * encendida si ya es tuya, y la cuenta («2 / 3»). Tu progreso le llega por
 * `estadoJefe` (`./combate`) cuando carga la arena; mientras tanto, las llaves
 * salen apagadas y la cuenta como «… / 3».
 */
export default function LlavesPuerta({ llaves }: Props) {
  const obtenidos = estadoJefe.value?.obtenidos;
  const tuyas = obtenidos ? llaves.filter((l) => obtenidos.has(l)).length : undefined;
  return (
    <span class="flex flex-wrap items-center gap-1">
      {llaves.map((l) => (
        <KeyRound
          key={l}
          size={16}
          aria-hidden="true"
          class={obtenidos?.has(l) ? "text-acento drop-shadow-[0_0_4px_var(--acento)]" : "text-borde-fuerte"}
        />
      ))}
      <span class="ml-1 font-mono text-xs tabular-nums">
        {tuyas ?? "…"} / {llaves.length}
        <span class="sr-only"> llaves conseguidas</span>
      </span>
    </span>
  );
}
