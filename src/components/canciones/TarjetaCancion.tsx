import { FileMusic, Headphones, Lock, MapPin, Music2, Swords } from "lucide-preact";
import type { CancionResumen } from "@/lib/canciones";
import { miniaturaYoutube } from "@/lib/youtube";
import ChipRuta from "./ChipRuta";
import Dificultad from "./Dificultad";
import { rarezaDe } from "./rareza";

interface Props {
  /** Resumen de la obra (ver `resumirCancion`). */
  cancion: CancionResumen;
  /** Muestra la zona de la obra. Útil en el catálogo; sobra dentro de la página de una zona. */
  conZona?: boolean;
}

/**
 * @component TarjetaCancion
 * Una obra como carta de juego. El borde y la etiqueta de arriba dicen su rareza
 * (según la dificultad, ver `rareza.ts`); las legendarias brillan. Si te faltan
 * talentos para tocarla, la carta sale bloqueada: imagen apagada, candado y
 * cuántos te faltan. Marca también los retos de oído y las canciones de jefe.
 * Sin estado: sirve en páginas de Astro y dentro de la isla del catálogo.
 */
export default function TarjetaCancion({ cancion: s, conZona = false }: Props) {
  const rareza = rarezaDe(s.dificultad);
  const bloqueada = s.faltan > 0;
  const legendaria = rareza.nombre === "Legendaria";

  return (
    <a
      href={`/canciones/${s.id}`}
      class={`group relative flex h-full flex-col overflow-hidden rounded-md border bg-superficie transition-[translate,border-color] duration-300 hover:-translate-y-1 ${rareza.borde} ${legendaria ? "shadow-[0_0_28px_-10px_var(--peligro)]" : ""}`}
    >
      <div class="relative aspect-video overflow-hidden bg-superficie-2">
        <img
          src={miniaturaYoutube(s.youtubeId)}
          alt=""
          loading="lazy"
          class={`size-full object-cover transition duration-500 group-hover:scale-105 ${bloqueada ? "opacity-45 grayscale-[0.7]" : ""}`}
        />
        <div class="absolute inset-0 bg-linear-to-t from-superficie via-superficie/10 to-transparent" />

        {/* Rareza, como la franja de una carta */}
        <span class={`absolute top-2.5 left-2.5 inline-flex items-center gap-1.5 rounded-[2px] bg-fondo/85 px-1.5 py-0.5 font-mono text-[0.5625rem] tracking-[0.08em] uppercase backdrop-blur ${rareza.texto}`}>
          <span class={`size-1.5 rotate-45 ${rareza.fondo}`} aria-hidden="true" />
          {rareza.nombre}
        </span>

        <span class="absolute top-2.5 right-2.5 flex flex-col items-end gap-1">
          {s.jefe && (
            <span class="inline-flex items-center gap-1 rounded-[2px] bg-peligro px-1.5 py-0.5 font-mono text-[0.5625rem] font-semibold text-fondo uppercase">
              <Swords size={10} aria-hidden="true" /> Jefe
            </span>
          )}
          {s.retoDeOido && (
            <span class="inline-flex items-center gap-1 rounded-[2px] bg-resalte px-1.5 py-0.5 font-mono text-[0.5625rem] font-semibold text-fondo uppercase">
              <Headphones size={10} aria-hidden="true" /> De oído
            </span>
          )}
        </span>

        {bloqueada && (
          <span class="absolute bottom-2.5 left-2.5 inline-flex items-center gap-1.5 rounded-[2px] border border-borde-fuerte bg-fondo/85 px-1.5 py-0.5 font-mono text-[0.5625rem] text-tenue uppercase backdrop-blur">
            <Lock size={10} aria-hidden="true" /> Te {s.faltan === 1 ? "falta 1 talento" : `faltan ${s.faltan} talentos`}
          </span>
        )}
      </div>

      <div class="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 class="font-display text-2xl leading-tight group-hover:text-acento-claro">{s.titulo}</h3>
          <p class="mt-0.5 line-clamp-1 text-sm text-tenue">{s.obra}</p>
          {s.jefe && <p class="mt-1 text-xs text-peligro">Canción de {s.jefe}</p>}
        </div>
        <div class="mt-auto flex flex-wrap items-center justify-between gap-2">
          <ChipRuta nombre={s.ruta.nombre} color={s.ruta.color} />
          <Dificultad valor={s.dificultad} />
        </div>
        <p class="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-borde pt-3 font-mono text-[0.625rem] text-tenue uppercase">
          {conZona && (
            <span class="inline-flex items-center gap-1"><MapPin size={11} aria-hidden="true" /> Zona {s.zona.orden}</span>
          )}
          <span class="inline-flex items-center gap-1">
            <Music2 size={11} aria-hidden="true" /> {s.versiones} {s.versiones === 1 ? "versión" : "versiones"}
          </span>
          {s.conPartitura && (
            <span class="inline-flex items-center gap-1"><FileMusic size={11} aria-hidden="true" /> partitura</span>
          )}
          {bloqueada && <span class="sr-only">(bloqueada)</span>}
        </p>
      </div>
    </a>
  );
}
