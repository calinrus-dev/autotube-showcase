import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clapperboard,
  Download,
  Film,
  ImagePlus,
  Images,
  Layers3,
  MonitorPlay,
  Pause,
  Play,
  Radio,
  Repeat2,
  SlidersHorizontal,
  Type,
  Upload,
} from "lucide-react";
import { command, localEngine, mediaPreview, importMedia } from "./bridge";
import { defaultTheme } from "./types";
import type {
  Asset,
  Channel,
  ChannelBranding as Branding,
  Project,
  Track,
  VideoTheme,
} from "./types";
import ChannelBranding from "./ChannelBranding";
type Slot = "intro" | "content" | "outro" | "result";
type Info = {
  duration: number;
  width: number;
  height: number;
  has_audio: boolean;
};
const clock = (seconds: number) =>
  `${Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0")}:${Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0")}`;
export default function VideoStage({
  project,
  track,
  channel,
  assets,
  busy,
  rendering,
  onEdit,
  onBackground,
  onBranding,
  onRender,
  onImport,
  onAudio,
}: {
  project: Project;
  track: Track | undefined;
  channel: Channel | undefined;
  assets: Asset[];
  busy: boolean;
  rendering?: number;
  onEdit: (theme: VideoTheme) => void;
  onBackground: (kind: "thumbnail" | "video") => void;
  onBranding: (branding: Branding) => void;
  onRender: () => void;
  onImport: () => void;
  onAudio: () => void;
}) {
  const theme = { ...defaultTheme, ...project.video_theme };
  const branding = channel?.branding || { intro_id: "", outro_id: "" };
  const [tool, setTool] = useState("media");
  const [slot, setSlot] = useState<Slot>("content");
  const [sources, setSources] = useState<Record<string, string>>({});
  const [info, setInfo] = useState<Record<string, Info>>({});
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoId =
    track?.language === project.language ? project.video_id : track?.video_id;
  const backgroundId = theme.background_id || project.thumbnail_id;
  const take = track?.takes?.find((t) => t.id === track.audio_id);
  const contentDuration =
    take?.duration || info[track?.audio_id || ""]?.duration || 0;
  const introDuration = theme.intro_enabled
    ? info[branding.intro_id]?.duration || 0
    : 0;
  const outroDuration = theme.outro_enabled
    ? info[branding.outro_id]?.duration || 0
    : 0;
  const total = introDuration + contentDuration + outroDuration;
  const edit = (patch: Partial<VideoTheme>) => onEdit({ ...theme, ...patch });
  const ids = [
    videoId,
    track?.audio_id,
    backgroundId,
    branding.intro_id,
    branding.outro_id,
  ].filter(Boolean) as string[];
  useEffect(() => {
    let active = true;
    setError("");
    Promise.all(
      [...new Set(ids)].map(async (id) => {
        const src = await mediaPreview(id);
        const asset = assets.find((a) => a.id === id);
        const details =
          localEngine && asset?.kind !== "thumbnail"
            ? await command<Info>("media_info", { asset_id: id })
            : undefined;
        if (active) {
          setSources((s) => ({ ...s, [id]: src }));
          if (details) setInfo((s) => ({ ...s, [id]: details }));
        }
      }),
    ).catch((e) => {
      if (active) setError(String(e));
    });
    return () => {
      active = false;
    };
  }, [ids.join("|"), assets.length]);
  useEffect(() => {
    let active = true;
    setPreview("");
    if (!localEngine || theme.layout === "video") return;
    const timer = setTimeout(
      () =>
        command<string>("preview_video_theme", { project })
          .then((s) => {
            if (active) setPreview(s);
          })
          .catch((e) => {
            if (active) setError(String(e));
          }),
      250,
    );
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [project.id, project.title, project.thumbnail_id, JSON.stringify(theme)]);
  useEffect(() => {
    setSlot(videoId ? "result" : "content");
  }, [videoId, project.id]);
  useEffect(() => {
    setPlaying(false);
    setTime(0);
    setDuration(0);
    videoRef.current?.pause();
    audioRef.current?.pause();
  }, [slot, backgroundId, track?.audio_id, videoId]);
  useEffect(() => {
    if (
      (slot === "intro" && (!branding.intro_id || !theme.intro_enabled)) ||
      (slot === "outro" && (!branding.outro_id || !theme.outro_enabled))
    )
      setSlot("content");
  }, [
    branding.intro_id,
    branding.outro_id,
    theme.intro_enabled,
    theme.outro_enabled,
  ]);
  const directId =
    slot === "result"
      ? videoId
      : slot === "intro"
        ? branding.intro_id
        : slot === "outro"
          ? branding.outro_id
          : "";
  const directSrc = directId ? sources[directId] : "";
  const looping = slot === "content" && theme.layout === "video";
  const shownDuration =
    duration || (directId ? info[directId]?.duration : contentDuration) || 0;
  function seek(value: number) {
    const master = directSrc ? videoRef.current : audioRef.current;
    if (master && Number.isFinite(master.duration)) master.currentTime = value;
    if (looping && videoRef.current && info[backgroundId]?.duration)
      videoRef.current.currentTime = value % info[backgroundId].duration;
    setTime(value);
  }
  async function togglePlayback() {
    const master = directSrc ? videoRef.current : audioRef.current;
    if (!master?.src) return;
    try {
      if (master.paused) {
        if (looping && videoRef.current) {
          if (info[backgroundId]?.duration)
            videoRef.current.currentTime =
              master.currentTime % info[backgroundId].duration;
          await videoRef.current.play();
        }
        await master.play();
      } else {
        master.pause();
        if (looping) videoRef.current?.pause();
      }
    } catch {
      videoRef.current?.pause();
      setError(
        "No se pudo reproducir este recurso. Comprueba que el archivo sea compatible.",
      );
    }
  }
  const events = {
    onTimeUpdate: (e: React.SyntheticEvent<HTMLMediaElement>) =>
      setTime(e.currentTarget.currentTime),
    onLoadedMetadata: (e: React.SyntheticEvent<HTMLMediaElement>) =>
      setDuration(e.currentTarget.duration),
    onPlay: () => setPlaying(true),
    onPause: () => setPlaying(false),
    onEnded: () => {
      setPlaying(false);
      if (looping) videoRef.current?.pause();
    },
    onError: () =>
      setError("No se puede reproducir este archivo. Revisa su formato."),
  };
  const displayName = (a: Asset) =>
    /^[0-9a-f-]{36}\.mp4$/i.test(a.name) ? "Vídeo exportado" : a.name;
  const resourceName = (id: string) => {
    const a = assets.find((a) => a.id === id);
    return a ? displayName(a) : "Sin recurso";
  };
  const selectBackground = (asset: Asset) => {
    setSlot("content");
    edit({
      background_id: asset.id,
      layout: asset.kind === "video" ? "video" : "image",
    });
  };
  const tools = [
    ["media", "Recursos", Images],
    ["design", "Diseño", SlidersHorizontal],
    ["channel", "Identidad", Radio],
    ["export", "Exportar", Download],
  ] as const;
  return (
    <section className="video-editor" aria-label="Editor de vídeo">
      <div className="editor-toolbar">
        <div>
          <Clapperboard size={18} />
          <strong>Montaje</strong>
          <span>
            {theme.format === "vertical" ? "9:16" : "16:9"} ·{" "}
            {track?.language.toUpperCase()}
          </span>
        </div>
        <button
          className="primary"
          disabled={
            busy ||
            !localEngine ||
            !track?.audio_id ||
            ((theme.layout === "image" || theme.layout === "video") &&
              !backgroundId)
          }
          onClick={onRender}
        >
          <Download size={15} />
          {rendering !== undefined ? "Exportando…" : "Exportar vídeo"}
        </button>
      </div>
      <div className="editor-grid">
        <nav className="editor-tools" aria-label="Herramientas de vídeo">
          {tools.map(([id, label, Icon]) => (
            <button
              key={id}
              className={tool === id ? "selected" : ""}
              onClick={() => setTool(id)}
              aria-pressed={tool === id}
              title={label}
            >
              <Icon size={21} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
        <aside
          className="editor-inspector"
          aria-label="Opciones de la herramienta"
        >
          <h3>{tools.find((t) => t[0] === tool)?.[1]}</h3>
          <fieldset disabled={busy}>
            {tool === "media" && (
              <>
                <p className="tool-help">
                  El fondo acompaña toda la narración. La miniatura de YouTube
                  se configura en Publicación.
                </p>
                <div className="import-grid">
                  <button onClick={() => onBackground("thumbnail")}>
                    <ImagePlus size={20} />
                    Importar foto
                  </button>
                  <button onClick={() => onBackground("video")}>
                    <Repeat2 size={20} />
                    Importar bucle
                  </button>
                </div>
                <div className="tool-section-heading">
                  <strong>
                    <Layers3 size={15} />
                    Biblioteca
                  </strong>
                  <span>
                    {
                      assets.filter((a) =>
                        ["thumbnail", "video"].includes(a.kind),
                      ).length
                    }
                  </span>
                </div>
                <div className="media-library">
                  {assets
                    .filter((a) => ["thumbnail", "video"].includes(a.kind))
                    .map((a) => (
                      <button
                        key={a.id}
                        className={backgroundId === a.id ? "selected" : ""}
                        onClick={() => selectBackground(a)}
                        title={displayName(a)}
                      >
                        {a.kind === "video" ? (
                          <Film size={20} />
                        ) : (
                          <Images size={20} />
                        )}
                        <span>
                          <strong>{displayName(a)}</strong>
                          <small>
                            {a.kind === "video"
                              ? "Vídeo · se repite sin su audio"
                              : "Imagen"}
                          </small>
                        </span>
                        {backgroundId === a.id && <Check size={15} />}
                      </button>
                    ))}
                  {!assets.some((a) =>
                    ["thumbnail", "video"].includes(a.kind),
                  ) && (
                    <div className="resource-empty">
                      <Images size={28} />
                      <p>
                        Importa una foto o un clip.
                        <br />
                        También puedes usar un fondo de título.
                      </p>
                    </div>
                  )}
                </div>
                <button
                  className="subtle"
                  onClick={() => {
                    setTool("design");
                    edit({ layout: "title" });
                  }}
                >
                  <Type size={15} />
                  Usar un fondo de título
                </button>
              </>
            )}
            {tool === "design" && (
              <>
                <label>
                  Fondo
                  <select
                    value={theme.layout}
                    onChange={(e) =>
                      edit({
                        layout: e.target.value as VideoTheme["layout"],
                        background_id:
                          assets.find((a) => a.id === theme.background_id)
                            ?.kind ===
                          (e.target.value === "video" ? "video" : "thumbnail")
                            ? theme.background_id
                            : "",
                      })
                    }
                  >
                    <option value="title">Título</option>
                    <option value="editorial">Título + foto</option>
                    <option value="image">Foto a pantalla completa</option>
                    <option value="video">Vídeo en bucle</option>
                  </select>
                </label>
                <label>
                  Formato
                  <select
                    value={theme.format}
                    onChange={(e) =>
                      edit({ format: e.target.value as VideoTheme["format"] })
                    }
                  >
                    <option value="landscape">Horizontal · 16:9</option>
                    <option value="vertical">Vertical · 9:16</option>
                  </select>
                </label>
                {theme.layout !== "video" && (
                  <>
                    <label>
                      Color
                      <select
                        value={theme.palette}
                        onChange={(e) =>
                          edit({
                            palette: e.target.value as VideoTheme["palette"],
                          })
                        }
                      >
                        <option value="rose">Rosa</option>
                        <option value="violet">Violeta</option>
                        <option value="mint">Menta</option>
                      </select>
                    </label>
                    {theme.layout !== "image" && (
                      <>
                        <label>
                          Título en pantalla
                          <input
                            maxLength={180}
                            value={theme.heading}
                            placeholder={project.title}
                            onChange={(e) => edit({ heading: e.target.value })}
                          />
                        </label>
                        <label>
                          Subtítulo en pantalla
                          <textarea
                            maxLength={240}
                            value={theme.subtitle}
                            onChange={(e) => edit({ subtitle: e.target.value })}
                          />
                        </label>
                      </>
                    )}
                  </>
                )}
                {theme.layout === "video" && (
                  <p className="tool-help">
                    El clip se repite hasta terminar la voz. El encuadre llena
                    el formato elegido y puede recortar los bordes. El título no
                    se superpone al bucle.
                  </p>
                )}
              </>
            )}
            {tool === "channel" && (
              <>
                <p className="tool-help">
                  Identidad de <strong>{channel?.name}</strong>. Cambiar los
                  clips del canal requiere volver a exportar sus vídeos.
                </p>
                <label className="toggle-row">
                  <input
                    type="checkbox"
                    checked={theme.intro_enabled}
                    onChange={(e) => edit({ intro_enabled: e.target.checked })}
                  />
                  Incluir intro en este episodio
                </label>
                <label className="toggle-row">
                  <input
                    type="checkbox"
                    checked={theme.outro_enabled}
                    onChange={(e) => edit({ outro_enabled: e.target.checked })}
                  />
                  Incluir cierre en este episodio
                </label>
                <ChannelBranding
                  value={branding}
                  assets={assets}
                  busy={busy}
                  onChange={onBranding}
                  onImport={async (part) => {
                    try {
                      const asset = await importMedia("video");
                      if (asset) onBranding({ ...branding, [part]: asset.id });
                    } catch (e) {
                      setError(String(e));
                    }
                  }}
                />
              </>
            )}
            {tool === "export" && (
              <>
                <div className="export-spec">
                  <MonitorPlay size={26} />
                  <strong>MP4 · H.264 + AAC</strong>
                  <span>
                    {theme.format === "vertical"
                      ? "1080 × 1920"
                      : "1920 × 1080"}{" "}
                    · 25 fps
                  </span>
                  <span>Intro → narración → cierre</span>
                </div>
                <p className="tool-help">
                  Se monta en este ordenador. El resultado aparece en el visor y
                  queda disponible para publicar.
                </p>
                {videoId && (
                  <button onClick={() => setSlot("result")}>
                    <Play size={15} />
                    Ver exportación
                  </button>
                )}
                <button onClick={onImport}>
                  <Upload size={15} />
                  Importar vídeo terminado
                </button>
              </>
            )}
          </fieldset>
        </aside>
        <div className="editor-monitor">
          <div className="monitor-heading">
            <span>
              {slot === "result"
                ? "Vídeo exportado"
                : slot === "intro"
                  ? "Intro del canal"
                  : slot === "outro"
                    ? "Cierre del canal"
                    : "Previsualización del contenido"}
            </span>
            <span>{slot === "content" ? "Voz + fondo" : "Vídeo + audio"}</span>
          </div>
          <div
            className={
              "monitor-canvas " +
              theme.format +
              (looping ? " loop-preview" : "")
            }
          >
            {directSrc ? (
              <video
                key={directSrc}
                ref={videoRef}
                src={directSrc}
                preload="metadata"
                playsInline
                aria-label="Previsualización de vídeo"
                {...events}
              />
            ) : looping && sources[backgroundId] ? (
              <video
                key={backgroundId}
                ref={videoRef}
                src={sources[backgroundId]}
                muted
                loop
                preload="metadata"
                playsInline
                aria-label="Fondo de vídeo en bucle"
              />
            ) : preview ? (
              <img src={preview} alt="Composición del vídeo" />
            ) : theme.layout === "image" && sources[backgroundId] ? (
              <img src={sources[backgroundId]} alt="Foto de fondo" />
            ) : (
              <div
                className={"theme-card " + theme.palette + " " + theme.format}
              >
                <span>{channel?.name}</span>
                <h2>{theme.heading || project.title}</h2>
                <p>{theme.subtitle}</p>
                <small>
                  {theme.layout === "video"
                    ? "Importa un clip desde Recursos"
                    : localEngine
                      ? "Preparando el diseño…"
                      : "Vista del diseño · demo"}
                </small>
              </div>
            )}
            {!directSrc && sources[track?.audio_id || ""] && (
              <audio
                key={track?.audio_id}
                ref={audioRef}
                src={sources[track!.audio_id]}
                preload="none"
                {...events}
              />
            )}
          </div>
          <div className="monitor-transport">
            <button
              className="icon-button"
              aria-label="Volver al inicio"
              onClick={() => seek(0)}
              disabled={!shownDuration}
            >
              <ArrowLeft size={16} />
            </button>
            <button
              className="play-control"
              aria-label={
                playing
                  ? "Pausar previsualización"
                  : "Reproducir previsualización"
              }
              onClick={togglePlayback}
              disabled={!directSrc && !track?.audio_id}
            >
              {playing ? <Pause size={18} /> : <Play size={18} />}
            </button>
            <output>
              {clock(time)} <span>/ {clock(shownDuration)}</span>
            </output>
            <input
              type="range"
              aria-label="Posición de reproducción"
              min={0}
              max={shownDuration || 1}
              step={0.05}
              value={Math.min(time, shownDuration || 1)}
              disabled={!shownDuration}
              onChange={(e) => seek(Number(e.target.value))}
            />
            <button
              className="icon-button"
              aria-label="Ir al final"
              onClick={() => seek(Math.max(0, shownDuration - 0.1))}
              disabled={!shownDuration}
            >
              <ArrowRight size={16} />
            </button>
          </div>
          {error && (
            <p role="alert" className="take-warning">
              {error}
            </p>
          )}
          {rendering !== undefined && (
            <div className="production-progress" role="status">
              <span>Exportando · {Math.round(rendering * 100)}%</span>
              <progress max={1} value={rendering} />
            </div>
          )}
        </div>
        <div className="edit-timeline">
          <div className="timeline-heading">
            <strong>
              <Layers3 size={16} />
              Secuencia
            </strong>
            <span>{total ? clock(total) : "Elige una toma de voz"}</span>
            {videoId && (
              <button className="subtle" onClick={() => setSlot("result")}>
                <MonitorPlay size={14} />
                Ver exportación
              </button>
            )}
          </div>
          <div className="timeline-ruler">
            <span>00:00</span>
            <span>{clock(total / 2)}</span>
            <span>{clock(total)}</span>
          </div>
          <div className="timeline-row">
            <span className="timeline-label">
              <Film size={15} />
              Imagen
            </span>
            <div className="timeline-sequence">
              <button
                className={
                  "timeline-segment intro " +
                  (slot === "intro" ? "selected" : "")
                }
                style={{ flex: Math.max(1, introDuration) }}
                disabled={!theme.intro_enabled || !branding.intro_id}
                onClick={() => setSlot("intro")}
              >
                <Film size={14} />
                <strong>Intro</strong>
                <small>
                  {branding.intro_id ? clock(introDuration) : "Sin clip"}
                </small>
              </button>
              <button
                className={
                  "timeline-segment content " +
                  (slot === "content" ? "selected" : "")
                }
                style={{ flex: Math.max(3, contentDuration) }}
                onClick={() => setSlot("content")}
              >
                <span>
                  {theme.layout === "video" ? (
                    <Repeat2 size={15} />
                  ) : (
                    <Images size={15} />
                  )}
                  <strong>
                    {theme.layout === "video"
                      ? "Fondo en bucle"
                      : theme.layout === "image"
                        ? "Foto"
                        : "Composición"}
                  </strong>
                </span>
                <small>
                  {theme.layout === "video" || theme.layout === "image"
                    ? resourceName(backgroundId)
                    : theme.heading || project.title}
                </small>
              </button>
              <button
                className={
                  "timeline-segment outro " +
                  (slot === "outro" ? "selected" : "")
                }
                style={{ flex: Math.max(1, outroDuration) }}
                disabled={!theme.outro_enabled || !branding.outro_id}
                onClick={() => setSlot("outro")}
              >
                <Film size={14} />
                <strong>Cierre</strong>
                <small>
                  {branding.outro_id ? clock(outroDuration) : "Sin clip"}
                </small>
              </button>
            </div>
          </div>
          <div className="timeline-row">
            <span className="timeline-label">
              <Clapperboard size={15} />
              Voz
            </span>
            <div
              className="voice-timeline"
              style={{
                marginInlineStart: `${total ? (introDuration / total) * 100 : 0}%`,
                marginInlineEnd: `${total ? (outroDuration / total) * 100 : 0}%`,
              }}
            >
              <button onClick={onAudio}>
                <span>
                  <Play size={14} />
                  {track?.audio_id ? "Narración elegida" : "Elegir una toma"}
                </span>
                <small>
                  {contentDuration
                    ? clock(contentDuration)
                    : "Abrir Voz y tomas"}
                </small>
              </button>
            </div>
          </div>
          <p className="timeline-hint">
            Selecciona un bloque para revisarlo. La voz determina la duración
            del contenido; el fondo se adapta automáticamente.
          </p>
        </div>
      </div>
    </section>
  );
}
