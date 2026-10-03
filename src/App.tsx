import { useEffect, useState } from "react";
import {
  AudioLines,
  CalendarDays,
  ChevronRight,
  CircleHelp,
  Clapperboard,
  Download,
  ExternalLink,
  FileText,
  Layers3,
  Mic2,
  Plus,
  Radio,
  RefreshCw,
  Save,
  Settings2,
  Upload,
  X,
} from "lucide-react";
import { command, desktop, importMedia, choosePath } from "./bridge";
import { editorial, labels, newProject, newTrack } from "./types";
import type { Channel, Editorial, Project, Snapshot, Track } from "./types";

export default function App() {
  const [state, setState] = useState<Snapshot>();
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [channelId, setChannelId] = useState("");
  const [project, setProject] = useState<Project>();
  const [dirty, setDirty] = useState(false);
  const [page, setPage] = useState("studio");
  const [tab, setTab] = useState("audio");
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [projectQuery, setProjectQuery] = useState("");
  const [pendingChange, setPendingChange] = useState<{
    type: "project" | "channel";
    id: string;
  }>();
  const [language, setLanguage] = useState("es");
  const [newLanguage, setNewLanguage] = useState("en");
  const [addingLanguage, setAddingLanguage] = useState(false);
  const [busy, setBusy] = useState(false);
  const [audio, setAudio] = useState("");
  const [image, setImage] = useState("");
  const [channelDraft, setChannelDraft] = useState<Channel>();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<string[]>([]);
  const [date, setDate] = useState(() =>
    new Date(Date.now() + 86400000).toISOString().slice(0, 10),
  );
  const [time, setTime] = useState("19:00");
  async function refresh() {
    const data = await command<Snapshot>("snapshot");
    setState(data);
    setChannelId((id) => id || data.channels[0]?.id || "");
    return data;
  }
  useEffect(() => {
    refresh()
      .then((data) => setSettings(data.settings))
      .catch((e) => setError(String(e)));
  }, []);
  useEffect(() => {
    if (!desktop) return;
    const timer = setInterval(() => refresh().catch(() => {}), 5000);
    return () => clearInterval(timer);
  }, []);
  const channel = state?.channels.find((c) => c.id === channelId);
  const projects =
    state?.projects.filter((p) => p.channel_id === channelId) || [];
  useEffect(() => {
    if (!project && projects[0]) selectProject(projects[0]);
  }, [state, channelId]);
  useEffect(() => {
    if (!project) return;
    const fresh = state?.projects.find((p) => p.id === project.id);
    if (fresh && !dirty && fresh.revision !== project.revision)
      setProject(fresh);
  }, [state]);
  const track = project?.tracks.find((t) => t.language === language);
  useEffect(() => {
    let active = true;
    setAudio("");
    if (track?.audio_id)
      command<string>("asset_preview", { asset_id: track.audio_id })
        .then((value) => {
          if (active) setAudio(value);
        })
        .catch((e) => {
          if (active) setError(String(e));
        });
    return () => {
      active = false;
    };
  }, [track?.audio_id]);
  useEffect(() => {
    let active = true;
    setImage("");
    if (project?.thumbnail_id)
      command<string>("asset_preview", { asset_id: project.thumbnail_id })
        .then((value) => {
          if (active) setImage(value);
        })
        .catch((e) => {
          if (active) setError(String(e));
        });
    return () => {
      active = false;
    };
  }, [project?.thumbnail_id]);
  function selectProject(p: Project) {
    if (dirty) {
      setPendingChange({ type: "project", id: p.id });
      return;
    }
    setProject(structuredClone(p));
    setDirty(false);
    setLanguage(p.language);
  }
  function switchChannel(id: string) {
    if (dirty) {
      setPendingChange({ type: "channel", id });
      return;
    }
    applyChange({ type: "channel", id });
  }
  function applyChange(change: { type: "project" | "channel"; id: string }) {
    setDirty(false);
    setPendingChange(undefined);
    if (change.type === "channel") {
      setChannelId(change.id);
      setProject(undefined);
      setSelected([]);
      setChannelDraft(undefined);
    } else {
      const p = state?.projects.find((item) => item.id === change.id);
      if (p) {
        setProject(structuredClone(p));
        setLanguage(p.language);
      }
    }
  }
  function edit(patch: Partial<Project>) {
    setProject((p) => (p ? { ...p, ...patch } : p));
    setDirty(true);
  }
  function editTrack(patch: Partial<Track>) {
    if (!project) return;
    const current = track || newTrack(language);
    const tracks = project.tracks.some((t) => t.language === language)
      ? project.tracks.map((t) =>
          t.language === language ? { ...t, ...patch } : t,
        )
      : [...project.tracks, { ...current, ...patch }];
    tracks.sort(
      (a, b) =>
        Number(b.language === project.language) -
        Number(a.language === project.language),
    );
    edit({ tracks });
  }
  async function run(task: () => Promise<unknown>, message = "Hecho") {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const output = await task();
      await refresh();
      setNotice(typeof output === "string" ? output : message);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }
  async function saveProject() {
    if (!project) return;
    const saved = await command<Project>("save_project", project);
    setProject(saved);
    setDirty(false);
    return saved;
  }
  async function production(operation: string) {
    await run(async () => {
      const saved = dirty ? await saveProject() : project;
      if (!saved) return;
      await command(operation, {
        project_id: saved.id,
        language,
        provider:
          track?.provider === "imported" ? "qwen3" : track?.provider || "qwen3",
        voice: track?.voice || "",
        instruction: [
          resolved.narrator,
          resolved.tone,
          track?.provider === "qwen3" ? track?.voice : "",
        ]
          .filter(Boolean)
          .join(" "),
        model: "eleven_multilingual_v2",
      });
    }, "Trabajo añadido a la cola");
  }
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        if (project && dirty && !busy)
          void run(saveProject, "Proyecto guardado");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [project, dirty, busy]);
  const resolved = {
    ...channel?.editorial,
    ...Object.fromEntries(
      Object.entries(project?.editorial || {}).filter(([, v]) => v?.trim()),
    ),
  } as Editorial;
  const activeJobs =
    state?.jobs.filter((j) => j.project_id === project?.id) || [];
  const nameOf = (id: string) =>
    state?.assets.find((a) => a.id === id)?.name || "Sin archivo";
  if (!state)
    return (
      <main className="loading">
        <AudioLines />
        <h1>AutoTube</h1>
        <p>{error || "Conectando con la mesa de producción…"}</p>
        <button onClick={() => refresh().catch((e) => setError(String(e)))}>
          Reintentar
        </button>
      </main>
    );
  return (
    <div className="app">
      <header className="console-header">
        <a className="brand" href="#" onClick={(e) => e.preventDefault()}>
          <span className="brandmark">
            <AudioLines size={24} />
          </span>
          <strong>
            AutoTube<small>CREATOR CONSOLE</small>
          </strong>
        </a>
        <div className="channel-control">
          <label htmlFor="channel">CANAL ACTIVO</label>
          <select
            id="channel"
            aria-label="CANAL ACTIVO"
            value={channelId}
            onChange={(e) => switchChannel(e.target.value)}
          >
            {state.channels.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <nav aria-label="Navegación principal">
          {[
            ["studio", "Mesa de producción", Clapperboard],
            ["calendar", "Calendario", CalendarDays],
            ["channels", "Canales y criterio", Radio],
            ["settings", "Conexiones", Settings2],
          ].map(([id, label, Icon]) => {
            const I = Icon as typeof Radio;
            return (
              <button
                key={String(id)}
                className={page === id ? "active" : ""}
                onClick={() => setPage(String(id))}
              >
                <I size={16} />
                {String(label)}
              </button>
            );
          })}
        </nav>
        <span className="engine-status">
          <i />
          {desktop ? "Motor local" : "Demo local"}
        </span>
      </header>
      {pendingChange && (
        <div className="modal-backdrop">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="unsaved-title"
            className="unsaved-dialog"
            onKeyDown={(e) => {
              if (e.key === "Escape") setPendingChange(undefined);
              if (e.key === "Tab") {
                const buttons = Array.from(
                  e.currentTarget.querySelectorAll<HTMLButtonElement>(
                    "button:not(:disabled)",
                  ),
                );
                const first = buttons[0],
                  last = buttons[buttons.length - 1];
                if (e.shiftKey && document.activeElement === first) {
                  e.preventDefault();
                  last.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                  e.preventDefault();
                  first.focus();
                }
              }
            }}
          >
            <span className="eyebrow">CAMBIOS SIN GUARDAR</span>
            <h2 id="unsaved-title">Conserva tu trabajo antes de cambiar.</h2>
            <p>Este episodio tiene una edición pendiente.</p>
            <div>
              <button autoFocus onClick={() => setPendingChange(undefined)}>
                Seguir editando
              </button>
              <button onClick={() => applyChange(pendingChange)}>
                Descartar cambios
              </button>
              <button
                className="primary"
                disabled={busy}
                onClick={() =>
                  run(async () => {
                    await saveProject();
                    applyChange(pendingChange);
                  }, "Guardado; espacio cambiado")
                }
              >
                Guardar y cambiar
              </button>
            </div>
          </section>
        </div>
      )}
      <main className="main">
        {!desktop && (
          <div className="demo-banner">
            <CircleHelp size={15} />
            <span>
              Demo interactiva · datos locales en este navegador. Para generar
              voz, renderizar y subir, usa el escritorio.
            </span>
          </div>
        )}
        <header className={"topbar " + (page === "studio" ? "compact" : "")}>
          <div>
            <span className="eyebrow">
              {channel?.name || "Crea tu primer canal"}
            </span>
            <h1>
              {page === "studio"
                ? "Mesa de producción"
                : page === "calendar"
                  ? "Ritmo de publicación"
                  : page === "channels"
                    ? "La voz de cada canal"
                    : "Conecta tu producción"}
            </h1>
          </div>
          <button
            className="iconbutton"
            aria-label="Actualizar inventario"
            onClick={() => run(refresh, "Inventario actualizado")}
          >
            <RefreshCw size={18} />
          </button>
        </header>
        {(error || notice) && (
          <div
            role={error ? "alert" : "status"}
            className={"message " + (error ? "error" : "")}
          >
            <span>{error || notice}</span>
            <button
              className="iconbutton"
              aria-label="Cerrar aviso"
              onClick={() => {
                setError("");
                setNotice("");
              }}
            >
              <X size={16} />
            </button>
          </div>
        )}
        {page === "studio" && (
          <div className="studio-layout">
            <section
              className="project-switcher"
              aria-label="Inventario del canal"
            >
              <div className="project-picker">
                <label htmlFor="project-picker">EPISODIO ACTIVO</label>
                <select
                  id="project-picker"
                  aria-label="EPISODIO ACTIVO"
                  value={project?.id || ""}
                  onChange={(e) => {
                    const p = projects.find((p) => p.id === e.target.value);
                    if (p) selectProject(p);
                  }}
                >
                  {!projects.length && <option value="">Sin episodios</option>}
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>
              <button
                aria-expanded={libraryOpen}
                onClick={() => setLibraryOpen(!libraryOpen)}
              >
                <Layers3 size={16} />
                Inventario <span className="count">{projects.length}</span>
              </button>
              <button
                disabled={!channel || busy}
                onClick={() =>
                  run(async () => {
                    if (dirty) await saveProject();
                    const p = await command<Project>(
                      "save_project",
                      newProject(channelId),
                    );
                    setProject(p);
                    setLanguage("es");
                    setDirty(false);
                  }, "Episodio creado")
                }
              >
                <Plus size={16} />
                Nuevo episodio
              </button>
            </section>
            {libraryOpen && (
              <section className="project-library">
                <label className="library-search">
                  Buscar episodios
                  <input
                    value={projectQuery}
                    onChange={(e) => setProjectQuery(e.target.value)}
                    placeholder="Título del episodio…"
                  />
                </label>
                <div className="episode-grid">
                  {projects
                    .filter((p) =>
                      p.title
                        .toLowerCase()
                        .includes(projectQuery.toLowerCase()),
                    )
                    .map((p, i) => (
                      <button
                        key={p.id}
                        className={
                          "episode " + (p.id === project?.id ? "selected" : "")
                        }
                        onClick={() => {
                          selectProject(p);
                          setLibraryOpen(false);
                        }}
                      >
                        <span className="episode-number">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <strong>{p.title}</strong>
                        <span>
                          {p.video_id
                            ? "MP4 listo"
                            : p.tracks.some((t) => t.audio_id)
                              ? "Audio disponible"
                              : "En escritura"}{" "}
                          · {p.tracks.length} idiomas
                        </span>
                      </button>
                    ))}
                </div>
              </section>
            )}
            {project ? (
              <section className="workspace">
                <div className="project-heading">
                  <span className="eyebrow">
                    EPISODIO / REV. {project.revision}{" "}
                    {dirty ? "· CAMBIOS SIN GUARDAR" : ""}
                  </span>
                  <div className="heading-actions">
                    <button
                      className="subtle"
                      disabled={busy}
                      onClick={() =>
                        run(async () => {
                          const saved = dirty ? await saveProject() : project;
                          const copy = await command<Project>("save_project", {
                            ...saved,
                            id: "",
                            revision: 0,
                            title: (saved!.title + " · copia").slice(0, 100),
                          });
                          setProject(copy);
                          setDirty(false);
                        }, "Proyecto duplicado")
                      }
                    >
                      Duplicar
                    </button>
                    <button
                      className="subtle"
                      disabled={busy}
                      onClick={() =>
                        run(async () => {
                          if (dirty) await saveProject();
                          const r = await command<{ path: string }>(
                            "export_project",
                            { project_id: project.id },
                          );
                          return "Exportado: " + r.path;
                        }, "Exportación completada en la carpeta de datos / exports")
                      }
                    >
                      <Download size={15} />
                      Exportar
                    </button>
                    <button
                      className="primary"
                      disabled={busy || !dirty}
                      onClick={() => run(saveProject, "Proyecto guardado")}
                    >
                      <Save size={15} />
                      Guardar
                    </button>
                  </div>
                </div>
                <label className="title-field">
                  <span className="sr-only">Título del episodio</span>
                  <input
                    value={project.title}
                    maxLength={100}
                    onChange={(e) => edit({ title: e.target.value })}
                  />
                </label>
                <div
                  className="tabs"
                  role="tablist"
                  aria-label="Edición del episodio"
                >
                  {[
                    ["script", "01 · Guion"],
                    ["audio", "02 · Audio"],
                    ["metadata", "03 · Publicación"],
                    ["brief", "Criterio del proyecto"],
                  ].map(([id, text]) => (
                    <button
                      role="tab"
                      aria-selected={tab === id}
                      key={id}
                      className={tab === id ? "current" : ""}
                      onClick={() => setTab(id)}
                    >
                      {text}
                    </button>
                  ))}
                </div>
                {tab === "script" && (
                  <div className="script-workbench">
                    <div className="script-area">
                      <div className="editor-meta">
                        <span>HABLA DIRECTO. SOSTÉN LO QUE DICES.</span>
                        <span>
                          {
                            project.script.trim().split(/\s+/).filter(Boolean)
                              .length
                          }{" "}
                          palabras
                        </span>
                      </div>
                      <textarea
                        aria-label="Guion principal"
                        placeholder="Pega o escribe aquí el guion…"
                        value={project.script}
                        onChange={(e) => edit({ script: e.target.value })}
                      />
                      <div className="tone-chip">
                        <Mic2 size={16} />
                        <p>{resolved.tone}</p>
                      </div>
                    </div>
                    <aside className="script-companion">
                      <span className="eyebrow">CRITERIO EN ESTA SESIÓN</span>
                      <h2>Claridad antes de narrar.</h2>
                      <p>{resolved.tone}</p>
                      <div className="evidence-box">
                        <strong>
                          {project.sources.filter(Boolean).length} fuentes
                          añadidas
                        </strong>
                        <p>
                          Una referencia añadida todavía requiere revisión.
                          Separa evidencia, hipótesis e interpretación.
                        </p>
                      </div>
                      <button onClick={() => setTab("brief")}>
                        Afinar criterio <ChevronRight size={15} />
                      </button>
                      <button
                        className="primary"
                        onClick={() => setTab("audio")}
                      >
                        Pasar a la mesa de audio <ChevronRight size={15} />
                      </button>
                    </aside>
                  </div>
                )}
                {tab === "metadata" && (
                  <div className="form-grid">
                    <label className="full">
                      Descripción
                      <textarea
                        value={project.description}
                        maxLength={5000}
                        onChange={(e) => edit({ description: e.target.value })}
                      />
                    </label>
                    <label>
                      Etiquetas, separadas por comas
                      <input
                        value={project.tags.join(", ")}
                        onChange={(e) =>
                          edit({
                            tags: e.target.value
                              .split(",")
                              .map((s) => s.trim()),
                          })
                        }
                      />
                    </label>
                    <label>
                      Idioma original
                      <input
                        value={project.language}
                        onChange={(e) => edit({ language: e.target.value })}
                      />
                    </label>
                    <label className="full">
                      Fuentes verificadas, una URL por línea
                      <textarea
                        value={project.sources.join("\n")}
                        onChange={(e) =>
                          edit({ sources: e.target.value.split("\n") })
                        }
                      />
                    </label>
                    <div className="asset-card">
                      <div className="thumb">
                        {image ? (
                          <img src={image} alt="Miniatura del episodio" />
                        ) : (
                          <Clapperboard />
                        )}
                      </div>
                      <span>{nameOf(project.thumbnail_id)}</span>
                      <button
                        onClick={() =>
                          run(async () => {
                            const a = await importMedia("thumbnail");
                            if (a) edit({ thumbnail_id: a.id });
                          }, "Miniatura añadida; guarda el proyecto")
                        }
                      >
                        Elegir miniatura
                      </button>
                    </div>
                    <div className="asset-card">
                      <Upload size={24} />
                      <span>{nameOf(project.video_id)}</span>
                      <button
                        onClick={() =>
                          run(async () => {
                            const a = await importMedia("video");
                            if (a) edit({ video_id: a.id });
                          }, "Vídeo añadido; guarda el proyecto")
                        }
                      >
                        Importar vídeo
                      </button>
                    </div>
                    <label className="check">
                      <input
                        type="checkbox"
                        checked={project.made_for_kids}
                        onChange={(e) =>
                          edit({ made_for_kids: e.target.checked })
                        }
                      />
                      Contenido creado para niños
                    </label>
                    <label className="check">
                      <input
                        type="checkbox"
                        checked={project.synthetic_media}
                        onChange={(e) =>
                          edit({ synthetic_media: e.target.checked })
                        }
                      />
                      Contenido sintético que requiere declaración
                    </label>
                    <button
                      className="primary"
                      disabled={busy || !desktop || !project.video_id}
                      onClick={() => production("queue_upload")}
                    >
                      <Upload size={16} />
                      Subir como privado
                    </button>
                  </div>
                )}
                {tab === "brief" && (
                  <div className="brief-panel">
                    <p>
                      Vacío = hereda el criterio del canal. Cada ajuste queda
                      visible para el MCP.
                    </p>
                    {Object.entries(labels).map(([key, label]) => (
                      <label key={key}>
                        {label}
                        <textarea
                          value={
                            project.editorial[key as keyof Editorial] || ""
                          }
                          placeholder={
                            channel?.editorial[key as keyof Editorial]
                          }
                          onChange={(e) =>
                            edit({
                              editorial: {
                                ...project.editorial,
                                [key]: e.target.value,
                              },
                            })
                          }
                        />
                      </label>
                    ))}
                  </div>
                )}
                {tab === "audio" && (
                  <section className="audio-desk">
                    <div className="audio-title">
                      <div>
                        <span className="eyebrow">MESA DE AUDIO</span>
                        <h2>Prepara y revisa tu narración.</h2>
                      </div>
                      <span className="audio-format">
                        {project.tracks.length} pistas /{" "}
                        {language.toUpperCase()}
                      </span>
                    </div>
                    <div className="language-tabs">
                      {project.tracks.map((t) => (
                        <button
                          key={t.language}
                          className={language === t.language ? "chosen" : ""}
                          onClick={() => setLanguage(t.language)}
                        >
                          <span>{t.language.toUpperCase()}</span>
                          <small>
                            {t.audio_id ? "Audio listo" : "Sin audio"}
                          </small>
                        </button>
                      ))}
                      <button
                        className="add-language"
                        aria-label="Añadir idioma"
                        onClick={() => setAddingLanguage(!addingLanguage)}
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                    {addingLanguage && (
                      <div className="language-add">
                        <label>
                          Nuevo idioma
                          <select
                            value={newLanguage}
                            onChange={(e) => setNewLanguage(e.target.value)}
                          >
                            {[
                              ["en", "Inglés"],
                              ["es", "Español"],
                              ["fr", "Francés"],
                              ["de", "Alemán"],
                              ["it", "Italiano"],
                              ["pt", "Portugués"],
                              ["ja", "Japonés"],
                              ["ko", "Coreano"],
                              ["zh", "Chino"],
                              ["ru", "Ruso"],
                            ]
                              .filter(
                                ([id]) =>
                                  !project.tracks.some(
                                    (t) => t.language === id,
                                  ),
                              )
                              .map(([id, name]) => (
                                <option key={id} value={id}>
                                  {name}
                                </option>
                              ))}
                          </select>
                        </label>
                        <button
                          onClick={() => {
                            if (
                              project.tracks.some(
                                (t) => t.language === newLanguage,
                              )
                            ) {
                              setError("Ese idioma ya tiene pista");
                              return;
                            }
                            edit({
                              tracks: [
                                ...project.tracks,
                                newTrack(newLanguage),
                              ],
                            });
                            setLanguage(newLanguage);
                            setAddingLanguage(false);
                          }}
                        >
                          Crear pista
                        </button>
                      </div>
                    )}

                    <div className="audio-workbench">
                      <section className="narration-sheet">
                        <div className="panel-header">
                          <span className="eyebrow">
                            GUION DE LA PISTA / {language.toUpperCase()}
                          </span>
                          <span>
                            {language === project.language
                              ? "Original"
                              : "Traducción"}
                          </span>
                        </div>
                        <textarea
                          aria-label="Guion de la pista"
                          value={
                            track?.script ||
                            (language === project.language
                              ? project.script
                              : "")
                          }
                          placeholder={
                            language === project.language
                              ? "Pega aquí el texto que quieres narrar…"
                              : "Añade la traducción revisada de este idioma…"
                          }
                          onChange={(e) =>
                            language === project.language && !track?.script
                              ? edit({ script: e.target.value })
                              : editTrack({ script: e.target.value })
                          }
                        />
                        <div className="sheet-footer">
                          <span>
                            {
                              (
                                track?.script ||
                                (language === project.language
                                  ? project.script
                                  : "")
                              )
                                .trim()
                                .split(/\s+/)
                                .filter(Boolean).length
                            }{" "}
                            palabras
                          </span>
                          <button
                            className="subtle"
                            onClick={() => setTab("script")}
                          >
                            Abrir guion principal <ChevronRight size={14} />
                          </button>
                        </div>
                      </section>
                      <section className="recording-console">
                        <div className="panel-header">
                          <span className="eyebrow">
                            TOMA / {language.toUpperCase()}
                          </span>
                          <span
                            className={audio ? "ready-label" : "empty-label"}
                          >
                            {audio ? "Lista para escuchar" : "Sin toma"}
                          </span>
                        </div>
                        <div className="audio-monitor">
                          {audio ? (
                            <>
                              <AudioLines size={40} />
                              <h3>Escucha, revisa, decide.</h3>
                              <audio
                                aria-label={"Escuchar pista " + language}
                                controls
                                src={audio}
                              />
                            </>
                          ) : (
                            <>
                              <div className="empty-record">
                                <Mic2 size={30} />
                              </div>
                              <h3>Haz que el texto tenga voz.</h3>
                              <p>
                                Importa tu audio o elige un motor
                                <br />
                                para generar la primera toma.
                              </p>
                            </>
                          )}
                          <span className="file-caption">
                            {nameOf(track?.audio_id || "")}
                          </span>
                        </div>
                        <div className="voice-controls">
                          <label>
                            Motor de voz
                            <select
                              value={track?.provider || "imported"}
                              onChange={(e) =>
                                editTrack({
                                  provider: e.target.value as Track["provider"],
                                })
                              }
                            >
                              <option value="imported">Audio importado</option>
                              <option value="elevenlabs">ElevenLabs</option>
                              <option value="qwen3">Qwen3-TTS · local</option>
                              <option value="chatterbox">
                                Chatterbox · local
                              </option>
                            </select>
                          </label>
                          {(track?.provider === "elevenlabs" ||
                            track?.provider === "qwen3") && (
                            <label>
                              {track?.provider === "elevenlabs"
                                ? "ID de voz ElevenLabs"
                                : "Descripción de la voz"}
                              <input
                                value={track?.voice || ""}
                                onChange={(e) =>
                                  editTrack({ voice: e.target.value })
                                }
                                placeholder={
                                  track?.provider === "elevenlabs"
                                    ? "ID de tu biblioteca de voces"
                                    : "Serena, precisa, cercana, sin teatralizar"
                                }
                              />
                            </label>
                          )}
                          <div className="button-row">
                            <button
                              onClick={() =>
                                run(async () => {
                                  const a = await importMedia("audio");
                                  if (!a) return "No se seleccionó audio";
                                  editTrack({
                                    audio_id: a.id,
                                    provider: "imported",
                                  });
                                }, "Toma importada; guarda el episodio")
                              }
                            >
                              <Upload size={15} />
                              Importar audio
                            </button>
                            {track?.provider !== "imported" && (
                              <button
                                className="primary"
                                disabled={
                                  busy ||
                                  !desktop ||
                                  !(
                                    track?.script ||
                                    (language === project.language
                                      ? project.script
                                      : "")
                                  ).trim()
                                }
                                onClick={() => production("generate_voice")}
                              >
                                <Mic2 size={15} />
                                Generar toma
                              </button>
                            )}
                          </div>
                          {!desktop && track?.provider !== "imported" && (
                            <p className="provider-hint">
                              La generación se activa en el escritorio con el
                              proveedor conectado.
                            </p>
                          )}
                          <details className="voice-direction">
                            <summary>Dirección de la narración</summary>
                            <p>{resolved.narrator}</p>
                            <p>{resolved.tone}</p>
                            <button
                              className="subtle"
                              onClick={() => setTab("brief")}
                            >
                              Editar criterio
                            </button>
                          </details>
                        </div>
                      </section>
                    </div>
                    <div className="audio-bottom">
                      <details className="localization">
                        <summary>
                          Metadatos de la versión {language.toUpperCase()}
                        </summary>
                        <div className="form-grid">
                          <label>
                            Título localizado
                            <input
                              value={track?.title || ""}
                              onChange={(e) =>
                                editTrack({ title: e.target.value })
                              }
                            />
                          </label>
                          <label>
                            Descripción localizada
                            <textarea
                              value={track?.description || ""}
                              onChange={(e) =>
                                editTrack({ description: e.target.value })
                              }
                            />
                          </label>
                        </div>
                      </details>
                      <div className="render-footer">
                        <div>
                          <span className="eyebrow">SALIDA / MP4 1080P</span>
                          <p>Imagen fija + audio de {language.toUpperCase()}</p>
                          <span>
                            {!project.thumbnail_id
                              ? "Falta miniatura"
                              : !track?.audio_id
                                ? "Falta audio"
                                : "Recursos de montaje listos"}
                          </span>
                        </div>
                        {!project.thumbnail_id ? (
                          <button onClick={() => setTab("metadata")}>
                            Añadir miniatura <ChevronRight size={15} />
                          </button>
                        ) : (
                          <button
                            className="primary"
                            disabled={busy || !track?.audio_id || !desktop}
                            onClick={() => production("render_video")}
                          >
                            <Clapperboard size={16} />
                            Montar vídeo
                          </button>
                        )}
                      </div>
                    </div>
                  </section>
                )}
                {activeJobs.length > 0 && (
                  <section className="jobs">
                    <h2>Cola del episodio</h2>
                    {activeJobs.map((j) => (
                      <div key={j.id}>
                        <strong>{j.kind}</strong>
                        <span>
                          {j.state} · {Math.round(j.progress * 100)}%
                        </span>
                        {j.error && <p>{j.error}</p>}
                        {j.result.url && (
                          <a
                            href={j.result.url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Ver en YouTube <ExternalLink size={12} />
                          </a>
                        )}
                        {j.state === "queued" && (
                          <button
                            onClick={() =>
                              run(() =>
                                command("job_action", {
                                  job_id: j.id,
                                  action: "cancel",
                                }),
                              )
                            }
                          >
                            Cancelar
                          </button>
                        )}
                        {["failed", "needs_review"].includes(j.state) && (
                          <button
                            onClick={() =>
                              run(() =>
                                command("job_action", {
                                  job_id: j.id,
                                  action: "retry",
                                }),
                              )
                            }
                          >
                            Reintentar
                          </button>
                        )}
                      </div>
                    ))}
                  </section>
                )}
              </section>
            ) : (
              <section className="empty">
                <Clapperboard />
                <h2>Tu próximo episodio empieza aquí</h2>
                <p>Crea un canal y añade un proyecto.</p>
              </section>
            )}
          </div>
        )}
        {page === "calendar" && (
          <section className="calendar-page">
            <div className="hero-note">
              <CalendarDays />
              <div>
                <h2>Inventario listo, ritmo constante.</h2>
                <p>
                  Selecciona el orden. Los archivos se suben ahora y YouTube
                  publica en la fecha indicada. El equipo debe estar encendido
                  hasta completar la subida.
                </p>
              </div>
            </div>
            <div className="schedule-controls">
              <label>
                Primer día
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </label>
              <label>
                Hora local
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </label>
              <label>
                Zona horaria
                <input readOnly value={channel?.timezone || "Europe/Madrid"} />
              </label>
              <button
                className="primary"
                disabled={busy || !selected.length}
                onClick={() =>
                  run(
                    () =>
                      command("schedule", {
                        project_ids: selected,
                        start_date: date,
                        time,
                        timezone: channel?.timezone || "Europe/Madrid",
                        daily: true,
                        mode: "publish_scheduled",
                      }),
                    "Programación añadida a la cola",
                  )
                }
              >
                Un episodio al día
              </button>
            </div>
            <div className="schedule-list">
              {projects.map((p) => (
                <label className="schedule-item" key={p.id}>
                  <input
                    type="checkbox"
                    checked={selected.includes(p.id)}
                    onChange={(e) =>
                      setSelected(
                        e.target.checked
                          ? [...selected, p.id]
                          : selected.filter((id) => id !== p.id),
                      )
                    }
                  />
                  <strong>{p.title}</strong>
                  <span>
                    {selected.includes(p.id)
                      ? "Día " + (selected.indexOf(p.id) + 1)
                      : p.video_id
                        ? "Listo para subir"
                        : "Falta vídeo"}
                  </span>
                </label>
              ))}
            </div>
            <h2>Fechas y trabajos</h2>
            <div className="timeline">
              {state.jobs
                .filter((j) => j.payload.project.channel_id === channelId)
                .map((j) => (
                  <article key={j.id}>
                    <span className="eyebrow">
                      {j.payload.publish_at
                        ? new Date(j.payload.publish_at).toLocaleString("es", {
                            timeZone: channel?.timezone,
                          })
                        : "Sin publicación programada"}
                    </span>
                    <h3>{j.payload.project.title}</h3>
                    <p>
                      {j.kind} · {j.state}
                    </p>
                    {j.error && <p>{j.error}</p>}
                  </article>
                ))}
              {!state.jobs.length && (
                <p>El calendario está vacío. La demo nunca publica vídeos.</p>
              )}
            </div>
          </section>
        )}
        {page === "channels" && (
          <section className="settings-page">
            <div className="section-title">
              <p>Los proyectos heredan este criterio y pueden afinarlo.</p>
              <button
                onClick={() =>
                  setChannelDraft({
                    id: "",
                    name: "Nuevo canal",
                    youtube_id: "",
                    languages: ["es"],
                    timezone: "Europe/Madrid",
                    editorial: {
                      ...editorial,
                      purpose: "",
                      audience: "",
                      tone: "Directo, claro y preciso. Explica con ejemplos y fuentes.",
                      prohibited: "No inventar datos, fuentes ni credenciales.",
                      narrator: "Una voz original y cercana.",
                    },
                  })
                }
              >
                <Plus size={16} />
                Nuevo canal
              </button>
            </div>
            {(channelDraft || channel) && (
              <ChannelForm
                channel={channelDraft || channel!}
                onSave={(c) =>
                  run(async () => {
                    if (dirty) await saveProject();
                    const saved = await command<Channel>("save_channel", c);
                    if (saved.id !== channelId) {
                      setProject(undefined);
                      setDirty(false);
                      setSelected([]);
                    }
                    setChannelId(saved.id);
                    setChannelDraft(undefined);
                  }, "Criterio del canal guardado")
                }
              />
            )}
          </section>
        )}
        {page === "settings" && (
          <section className="settings-page">
            <div className="connection-card">
              <div>
                <Radio />
                <h2>YouTube · {channel?.name}</h2>
              </div>
              <p>
                Cliente OAuth de escritorio. Inicia sesión con la identidad del
                canal elegido; AutoTube comprobará su ID antes de cada subida.
              </p>
              <code>{channel?.youtube_id || "Todavía no conectado"}</code>
              <button
                disabled={busy || !channel}
                onClick={() =>
                  run(async () => {
                    const path = await choosePath(["json"]);
                    if (path)
                      await command("connect_youtube", {
                        channel_id: channelId,
                        config_path: path,
                      });
                  }, "YouTube conectado")
                }
              >
                <ExternalLink size={16} />
                Conectar con archivo OAuth
              </button>
              <button
                disabled={busy || !channel?.youtube_id}
                onClick={() =>
                  run(async () => {
                    const data = await command<{ items: unknown[] }>(
                      "remote_inventory",
                      { channel_id: channelId },
                    );
                    return (
                      data.items.length +
                      " vídeos encontrados; no se han modificado."
                    );
                  }, "Inventario remoto consultado")
                }
              >
                Revisar inventario remoto
              </button>
            </div>
            <div className="connection-card">
              <div>
                <Mic2 />
                <h2>Voces y entorno local</h2>
              </div>
              <label>
                Clave de ElevenLabs
                <input
                  type="password"
                  autoComplete="off"
                  value={settings.elevenlabs_key || ""}
                  onChange={(e) =>
                    setSettings({ ...settings, elevenlabs_key: e.target.value })
                  }
                  placeholder="Se guarda en el llavero del sistema"
                />
              </label>
              <label>
                Python de Qwen3-TTS
                <input
                  value={settings.qwen_python || ""}
                  onChange={(e) =>
                    setSettings({ ...settings, qwen_python: e.target.value })
                  }
                  placeholder="/ruta/qwen/bin/python"
                />
              </label>
              <label>
                Python de Chatterbox
                <input
                  value={settings.chatterbox_python || ""}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      chatterbox_python: e.target.value,
                    })
                  }
                  placeholder="/ruta/chatterbox/bin/python"
                />
              </label>
              <label>
                Dispositivo
                <select
                  value={settings.tts_device || "cpu"}
                  onChange={(e) =>
                    setSettings({ ...settings, tts_device: e.target.value })
                  }
                >
                  <option value="cpu">CPU</option>
                  <option value="cuda:0">GPU CUDA</option>
                  <option value="mps">Apple MPS</option>
                </select>
              </label>
              <p>
                Instala Qwen3-TTS y Chatterbox en entornos separados según la
                documentación. La voz local puede descargar modelos grandes al
                primer uso.
              </p>
              <button
                className="primary"
                disabled={busy}
                onClick={() =>
                  run(async () => {
                    await command("settings", settings);
                    setSettings({ ...settings, elevenlabs_key: "" });
                  }, "Conexiones guardadas")
                }
              >
                <Save size={16} />
                Guardar conexiones
              </button>
            </div>
            <div className="connection-card">
              <div>
                <Layers3 />
                <h2>MCP de escritorio</h2>
              </div>
              <p>
                El servidor stdio comparte el inventario y lee el criterio
                efectivo antes de editar. Configuración y herramientas
                disponibles en docs/MCP.md.
              </p>
              <code>autotube-mcp</code>
              <p>
                El puente es local. Un cliente alojado en la nube necesita un
                conector o una implantación autenticada específica.
              </p>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
function ChannelForm({
  channel,
  onSave,
}: {
  channel: Channel;
  onSave: (c: Channel) => void;
}) {
  const [draft, setDraft] = useState(channel);
  useEffect(() => setDraft(structuredClone(channel)), [channel.id]);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(draft);
      }}
      className="channel-form"
    >
      <div className="form-grid">
        <label>
          Nombre del canal
          <input
            required
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          />
        </label>
        <label>
          Zona horaria
          <input
            required
            value={draft.timezone}
            onChange={(e) => setDraft({ ...draft, timezone: e.target.value })}
          />
        </label>
        <label>
          Idiomas, separados por comas
          <input
            value={draft.languages.join(", ")}
            onChange={(e) =>
              setDraft({
                ...draft,
                languages: e.target.value.split(",").map((s) => s.trim()),
              })
            }
          />
        </label>
        <label>
          ID de canal YouTube
          <input
            value={draft.youtube_id}
            onChange={(e) => setDraft({ ...draft, youtube_id: e.target.value })}
          />
        </label>
      </div>
      {Object.entries(labels).map(([key, label]) => (
        <label key={key}>
          {label}
          <textarea
            value={draft.editorial[key as keyof Editorial]}
            onChange={(e) =>
              setDraft({
                ...draft,
                editorial: { ...draft.editorial, [key]: e.target.value },
              })
            }
          />
        </label>
      ))}
      <button className="primary" type="submit">
        <Save size={16} />
        Guardar canal
      </button>
    </form>
  );
}
