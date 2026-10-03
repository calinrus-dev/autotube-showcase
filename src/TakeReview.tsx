import { useEffect, useState } from "react";
import { AudioLines, Check, RotateCcw, X, LoaderCircle } from "lucide-react";
import { mediaPreview } from "./bridge";
import type { AudioTake, Track, Job } from "./types";
export function trackTakes(
  track: Track | undefined,
  script: string,
): AudioTake[] {
  if (!track) return [];
  return track.takes?.length
    ? track.takes
    : track.audio_id
      ? [
          {
            id: track.audio_id,
            script,
            provider: track.provider,
            voice: track.voice,
            model: track.model || "",
            created_at: "",
            status: "ready",
            sample: false,
            duration: 0,
          },
        ]
      : [];
}
export function durationLabel(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
}
export default function TakeReview({
  track,
  generation,
  script,
  busy,
  onAction,
}: {
  track: Track | undefined;
  generation?: Job;
  script: string;
  busy: boolean;
  onAction: (id: string, action: string) => void;
}) {
  const takes = trackTakes(track, script);
  const [focus, setFocus] = useState("");
  const [filter, setFilter] = useState("all");
  const [showDiscarded, setShowDiscarded] = useState(false);
  const [source, setSource] = useState("");
  const [error, setError] = useState("");
  const [previousLast, setPreviousLast] = useState("");
  const ready = takes.filter((t) => t.status === "ready");
  const latest = ready.at(-1)?.id || "";
  useEffect(() => {
    if (latest !== previousLast) {
      setFocus(latest);
      setPreviousLast(latest);
    }
  }, [latest]);
  const visibleTakes = takes.filter(
    (t) =>
      (showDiscarded || t.status === "ready") &&
      (filter === "all" || (filter === "sample" ? t.sample : !t.sample)),
  );
  const take =
    visibleTakes.find((t) => t.id === focus) ||
    visibleTakes.find((t) => t.id === track?.audio_id) ||
    visibleTakes.at(-1);
  useEffect(() => {
    let active = true;
    setSource("");
    setError("");
    if (take)
      mediaPreview(take.id)
        .then((s) => {
          if (active) setSource(s);
        })
        .catch((e) => {
          if (active) setError(String(e));
        });
    return () => {
      active = false;
    };
  }, [take?.id]);
  return (
    <div className="take-review">
      {generation && (
        <div
          className="generation-status voice-generation-status"
          role="status"
        >
          <div>
            <LoaderCircle size={15} className="spin" />
            <strong>
              {generation.state === "queued"
                ? "En cola"
                : generation.progress < 0.15
                  ? "Cargando el modelo de voz"
                  : generation.payload.request?.sample
                    ? "Generando muestra"
                    : "Generando narración"}
            </strong>
            <span>{Math.round(generation.progress * 100)}%</span>
          </div>
          <progress
            max={1}
            value={generation.progress}
            aria-label="Avance de generación de voz"
          />
          <span>
            {generation.payload.request?.sample
              ? "Muestra corta"
              : "Toma completa"}{" "}
            · {track?.language.toUpperCase()} ·{" "}
            {generation.created_at
              ? `${Math.max(0, Math.floor((Date.now() - new Date(generation.created_at).getTime()) / 1000))} s transcurridos`
              : "Trabajo local"}
          </span>
          <span>
            La nueva toma aparecerá en el historial para que la revises.
          </span>
        </div>
      )}
      <div className="audio-monitor">
        <AudioLines size={32} />
        <h3>
          {take
            ? take.sample
              ? "Revisar muestra de voz"
              : "Revisar toma completa"
            : "Sin audio para revisar"}
        </h3>
        {source && (
          <audio
            key={take?.id}
            controls
            preload="none"
            src={source}
            aria-label="Escuchar toma en revisión"
            onError={() =>
              setError(
                "No se pudo reproducir esta toma. Revisa el formato o los códecs locales.",
              )
            }
          />
        )}
        {!take && (
          <p>Prueba la voz con un fragmento o genera el guion completo.</p>
        )}
        {error && <p role="alert">{error}</p>}
        {take && (
          <>
            <p>
              {take.model === "custom_voice_small"
                ? "Qwen ligero"
                : take.provider === "qwen3"
                  ? "Qwen diseño de voz"
                  : take.provider}{" "}
              ·{" "}
              {take.duration ? durationLabel(take.duration) : "Audio importado"}
              {take.generation_seconds
                ? ` · generado en ${Math.round(take.generation_seconds)} s`
                : ""}
            </p>
            <div className="button-row">
              {take.sample ? (
                <button
                  className="primary"
                  disabled={
                    busy ||
                    take.status === "discarded" ||
                    track?.preferred_sample_id === take.id
                  }
                  onClick={() => onAction(take.id, "approve")}
                >
                  <Check size={14} />
                  {track?.preferred_sample_id === take.id
                    ? "Voz aprobada"
                    : "Esta voz sí"}
                </button>
              ) : (
                <button
                  className={take.id === track?.audio_id ? "chosen" : "primary"}
                  disabled={
                    busy ||
                    take.sample ||
                    take.status === "discarded" ||
                    take.id === track?.audio_id
                  }
                  onClick={() => onAction(take.id, "use")}
                >
                  <Check size={14} />
                  {take.id === track?.audio_id
                    ? "Elegida para vídeo"
                    : "Usar esta toma"}
                </button>
              )}
              <button
                disabled={busy}
                onClick={() =>
                  onAction(
                    take.id,
                    take.status === "discarded" ? "restore" : "discard",
                  )
                }
              >
                {take.status === "discarded" ? (
                  <RotateCcw size={14} />
                ) : (
                  <X size={14} />
                )}{" "}
                {take.status === "discarded" ? "Recuperar" : "Descartar"}
              </button>
            </div>
            {take.sample && (
              <p className="provider-hint">
                Aprobar la voz recupera sus ajustes para la siguiente
                generación. Genera una toma completa para montar el vídeo.
              </p>
            )}
            {take.script && take.script !== script && !take.sample && (
              <p className="take-warning">
                El texto ha cambiado desde esta toma. Escucha y decide si
                necesitas volver a generarla.
              </p>
            )}
            <details className="take-transcript">
              <summary>
                {take.provider === "imported"
                  ? "Leer el guion asociado"
                  : "Leer el texto de esta toma"}
              </summary>
              <p>
                {take.script ||
                  "El archivo importado no conserva una transcripción."}
              </p>
            </details>
          </>
        )}
      </div>
      <section className="take-library" aria-label="Historial de tomas">
        <div className="take-library-heading">
          <strong>
            Tomas de esta pista <span>{ready.length}</span>
          </strong>
          <label className="check">
            <input
              type="checkbox"
              checked={showDiscarded}
              onChange={(e) => setShowDiscarded(e.target.checked)}
            />{" "}
            Ver descartadas
          </label>
        </div>
        <div className="take-tabs" aria-label="Filtrar tomas">
          {[
            ["all", "Todas"],
            ["sample", "Muestras"],
            ["full", "Completas"],
          ].map(([id, label]) => (
            <button
              key={id}
              aria-pressed={filter === id}
              onClick={() => setFilter(id)}
            >
              {label}{" "}
              <small>
                {
                  takes.filter(
                    (t) =>
                      t.status === "ready" &&
                      (id === "all" ||
                        (id === "sample" ? t.sample : !t.sample)),
                  ).length
                }
              </small>
            </button>
          ))}
        </div>
        <div className="take-list">
          {visibleTakes.map((t) => (
            <button
              key={t.id}
              className={"take-item " + (t.id === take?.id ? "chosen" : "")}
              onClick={() => setFocus(t.id)}
            >
              <AudioLines size={16} />
              <span>
                <strong>
                  {t.sample ? "Muestra" : "Toma"}{" "}
                  {takes.findIndex((item) => item.id === t.id) + 1}{" "}
                  <small>
                    {t.id === track?.audio_id
                      ? "Elegida"
                      : t.status === "discarded"
                        ? "Descartada"
                        : t.id === track?.preferred_sample_id
                          ? "Voz aprobada"
                          : t.model === "custom_voice_small"
                            ? "Qwen ligero"
                            : t.provider === "imported"
                              ? "Importada"
                              : "Lista para revisar"}
                  </small>
                </strong>
                <small>
                  {t.created_at
                    ? new Date(t.created_at).toLocaleString("es", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })
                    : "Toma anterior"}{" "}
                  ·{" "}
                  {t.duration
                    ? durationLabel(t.duration)
                    : "Duración al reproducir"}
                </small>
              </span>
            </button>
          ))}
        </div>
        {!visibleTakes.length && (
          <p>
            No hay{" "}
            {filter === "sample"
              ? "muestras"
              : filter === "full"
                ? "tomas completas"
                : "tomas"}{" "}
            en este filtro.
          </p>
        )}
        {!!takes.length && (
          <p>Descartar conserva el archivo. Puedes recuperarlo aquí.</p>
        )}
      </section>
    </div>
  );
}
