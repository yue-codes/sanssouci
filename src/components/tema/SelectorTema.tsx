import { useEffect, useState } from "preact/hooks";
import { Monitor, Moon, Sun } from "lucide-preact";

type Tema = "system" | "light" | "dark";
const OPCIONES: { valor: Tema; etiqueta: string; Icono: typeof Sun }[] = [
  { valor: "light", etiqueta: "Claro", Icono: Sun },
  { valor: "system", etiqueta: "Sistema", Icono: Monitor },
  { valor: "dark", etiqueta: "Oscuro", Icono: Moon },
];

/**
 * @component SelectorTema (isla: `client:load`)
 * Selector de tema de tres posiciones: claro, sistema y oscuro.
 * Fija `data-theme` en <html>, que tokens.css traduce a `color-scheme`.
 * Guarda la preferencia en localStorage (clave "tema"); si no se puede, el tema
 * funciona igual, solo no se recuerda. El script inline de Base.astro la aplica
 * al cargar para evitar el parpadeo.
 */
export default function SelectorTema() {
  const [tema, setTema] = useState<Tema>("system");

  useEffect(() => {
    const t = document.documentElement.dataset.theme;
    if (t === "light" || t === "dark") setTema(t);
  }, []);

  function elegir(valor: Tema) {
    setTema(valor);
    const raiz = document.documentElement;
    if (valor === "system") delete raiz.dataset.theme;
    else raiz.dataset.theme = valor;
    try {
      if (valor === "system") localStorage.removeItem("tema");
      else localStorage.setItem("tema", valor);
    } catch {
      /* modo privado: el tema funciona igual, solo no se recuerda */
    }
  }

  return (
    <div role="radiogroup" aria-label="Tema de color" class="flex shrink-0 rounded-xl border border-borde bg-superficie p-0.5">
      {OPCIONES.map(({ valor, etiqueta, Icono }) => (
        <button
          type="button"
          role="radio"
          aria-checked={tema === valor}
          aria-label={etiqueta}
          title={etiqueta}
          onClick={() => elegir(valor)}
          class="grid size-8 place-items-center rounded-lg text-tenue transition hover:text-texto aria-checked:bg-acento aria-checked:text-fondo"
        >
          <Icono size={16} aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}
