import { useEffect, useState, useRef } from "react";
import {
  ArrowRight,
  BookOpen,
  Check,
  FileText,
  History,
  LoaderCircle,
  PencilLine,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  Square,
  X,
} from "lucide-react";
import type { Channel, Job, Project, Snapshot, Track } from "./types";
import ScriptDocument from "./ScriptDocument";
import { localEngine } from "./bridge";
export default function ScriptWorkbench({
  project,
  channel,
  track,
  language,
  jobs,
  text,
  busy,
  reading,
  textStatus,
  onReading,
  onLanguage,
  onText,
  onGenerate,
  onDraft,
  onStop,
  onAudio,
  onCriterion,
}: {
  project: Project;
  channel?: Channel;
  track?: Track;
  language: string;
  jobs: Job[];
  text: string;
  busy: boolean;
  reading: boolean;
  textStatus: Snapshot["local_text"];
  onReading: (value: boolean) => void;
  onLanguage: (value: string) => void;
  onText: (value: string) => void;
  onGenerate: (args: Record<string, unknown>) => void;
  onDraft: (id: string, action: string) => void;
  onStop: (id: string) => void;
  onAudio: () => void;
  onCriterion: () => void;
}) {
  const assistantRef = useRef<HTMLElement>(null);
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState("create");
  const [model, setModel] = useState("");
  const [budget, setBudget] = useState(1600);
  const [focus, setFocus] = useState("");
  const [showDiscarded, setShowDiscarded] = useState(false);
  const [assistantTab, setAssistantTab] = useState("generate");
  const [previewLive, setPreviewLive] = useState(true);
  const job = jobs.find(
    (j) => j.kind === "script" && ["queued", "running"].includes(j.state),
  );
  const models = textStatus?.models || [];
  const drafts = (project.script_drafts || []).filter(
    (d) => d.language === language,
  );
  const draft = drafts.find((d) => d.id === focus);
  const generatedText =
    job && previewLive ? job.result.text || "" : draft?.text;
  const visible = generatedText ?? text;
  const words = visible.trim().split(/\s+/).filter(Boolean).length;
  const live = !!job && previewLive;
  const reviewing = !!draft && !live;
  const tone = project.editorial.tone || channel?.editorial.tone;
  const latest = drafts.at(-1)?.id;
  const previousDraft = useRef(latest);
  useEffect(() => {
    if (!model || !models.includes(model))
      setModel(models.includes("qwen3.5:4b") ? "qwen3.5:4b" : models[0] || "");
  }, [models.join("|")]);
  useEffect(() => {
    setFocus("");
    setPrompt("");
    previousDraft.current = latest;
  }, [project.id, language]);
  useEffect(() => {
    if (job) {
      setPreviewLive(true);
      setAssistantTab("generate");
      assistantRef.current?.scrollTo({ top: 0 });
    }
  }, [job?.id]);
  useEffect(() => {
    if (
      latest &&
      previousDraft.current !== latest &&
      drafts.at(-1)?.model !== "manual"
    ) {
      setFocus(latest);
      setAssistantTab("versions");
    }
    previousDraft.current = latest;
  }, [latest]);
  return (
    <section className="script-editor" aria-label="Editor de guion">
      <div className="writing-toolbar">
        <div className="segmented-control">
          <button
            aria-pressed={!reading}
            onClick={() => {
              onReading(false);
              setFocus("");
              setPreviewLive(false);
            }}
          >
            <PencilLine size={15} />
            Escribir
          </button>
          <button aria-pressed={reading} onClick={() => onReading(true)}>
            <BookOpen size={15} />
            Leer
          </button>
        </div>
        <label className="compact-label">
          Idioma
          <select value={language} onChange={(e) => onLanguage(e.target.value)}>
            {project.tracks.map((t) => (
              <option value={t.language} key={t.language}>
                {t.language.toUpperCase()}
              </option>
            ))}
          </select>
        </label>
        <span className="writing-stats">
          {words} palabras · {Math.ceil(words / 145)} min aprox.
        </span>
        <button className="subtle" onClick={onAudio}>
          <ArrowRight size={15} />
          Pasar a voz
        </button>
      </div>
      <div className="writing-grid">
        <div className="writing-document">
          <div className="document-caption">
            <span>
              {live ? (
                <>
                  <LoaderCircle size={14} className="spin" />
                  Borrador en directo
                </>
              ) : reviewing ? (
                <>
                  <History size={14} />
                  Revisión de versión
                </>
              ) : (
                <>
                  <FileText size={14} />
                  Guion actual
                </>
              )}
            </span>
            <span>
              {live || reviewing
                ? "El guion actual se conserva"
                : track?.script
                  ? "Texto de esta pista"
                  : "Original"}
            </span>
          </div>
          {reading || reviewing || live ? (
            <article
              tabIndex={0}
              className="writing-reading"
              aria-label={live ? "Texto generándose" : "Previsualizar guion"}
            >
              <h2>{project.title}</h2>
              <ScriptDocument text={visible} />
              {!visible && (
                <p className="document-placeholder">
                  {live
                    ? "Preparando el modelo. El texto aparecerá aquí a medida que se genera…"
                    : "Escribe o genera una primera versión."}
                </p>
              )}
            </article>
          ) : (
            <textarea
              className="writing-textarea"
              aria-label="Guion principal"
              placeholder="Escribe o pega tu guion. También puedes pedir una propuesta al modelo local desde el panel de la derecha."
              value={text}
              onChange={(e) => onText(e.target.value)}
              disabled={busy}
            />
          )}
          {reviewing && (
            <div className="draft-decision">
              <span>
                {draft.model === "manual"
                  ? "Versión anterior conservada"
                  : draft.model}
              </span>
              <button
                className="primary"
                disabled={
                  busy || draft.status === "discarded" || draft.text === text
                }
                onClick={() => {
                  setFocus("");
                  onDraft(draft.id, "use");
                }}
              >
                <Check size={15} />
                {draft.text === text ? "Guion en uso" : "Usar este guion"}
              </button>
              <button
                disabled={busy}
                onClick={() =>
                  onDraft(
                    draft.id,
                    draft.status === "discarded" ? "restore" : "discard",
                  )
                }
              >
                {draft.status === "discarded" ? (
                  <RotateCcw size={14} />
                ) : (
                  <X size={14} />
                )}{" "}
                {draft.status === "discarded" ? "Recuperar" : "Descartar"}
              </button>
              <button
                className="subtle"
                onClick={() => {
                  setFocus("");
                  setPreviewLive(false);
                }}
              >
                Volver al guion
              </button>
            </div>
          )}
          <div className="document-footer">
            <span>{visible.length.toLocaleString("es")} caracteres</span>
            <span>
              {live
                ? "Generación local · sin reemplazar tu texto"
                : "Ctrl / ⌘ + S para guardar"}
            </span>
          </div>
        </div>
        <aside
          ref={assistantRef}
          tabIndex={0}
          className="writing-assistant"
          aria-label="Herramientas de guion"
        >
          <div className="assistant-tabs">
            <button
              aria-pressed={assistantTab === "generate"}
              onClick={() => setAssistantTab("generate")}
            >
              <Sparkles size={15} />
              IA local
            </button>
            <button
              aria-pressed={assistantTab === "versions"}
              onClick={() => setAssistantTab("versions")}
            >
              <History size={15} />
              Versiones <small>{drafts.length}</small>
            </button>
          </div>
          {assistantTab === "generate" ? (
            <div className="assistant-body">
              {job && (
                <div className="generation-status" role="status">
                  <div>
                    <LoaderCircle size={15} className="spin" />
                    <strong>
                      {job.state === "queued"
                        ? "En cola"
                        : job.result.phase === "generating"
                          ? "Escribiendo el borrador"
                          : "Cargando el modelo"}
                    </strong>
                  </div>
                  <progress aria-label="Generación de guion en curso" />
                  <span>
                    {job.result.fragments || 0} fragmentos recibidos · límite{" "}
                    {job.result.max_tokens || budget}
                  </span>
                  <button
                    disabled={job.result.cancel_requested}
                    onClick={() => onStop(job.id)}
                  >
                    <Square size={12} />
                    {job.result.cancel_requested ? "Deteniendo…" : "Detener"}
                  </button>
                </div>
              )}
              <label>
                Petición
                <textarea
                  aria-label="Petición para el guion"
                  value={prompt}
                  maxLength={6000}
                  disabled={busy}
                  placeholder="Tema, idea central, duración, enfoque…"
                  onChange={(e) => setPrompt(e.target.value)}
                />
              </label>
              <div className="form-grid">
                <label>
                  Acción
                  <select
                    value={mode}
                    disabled={busy}
                    onChange={(e) => setMode(e.target.value)}
                  >
                    <option value="create">Crear guion</option>
                    <option value="rewrite">Reescribir</option>
                    <option value="outline">Preparar esquema</option>
                  </select>
                </label>
                <label>
                  Límite
                  <select
                    value={budget}
                    disabled={busy}
                    onChange={(e) => setBudget(Number(e.target.value))}
                  >
                    <option value={800}>800 tokens</option>
                    <option value={1600}>1600 tokens</option>
                    <option value={3200}>3200 tokens</option>
                  </select>
                </label>
              </div>
              <label>
                Modelo de texto
                <select
                  value={model}
                  disabled={busy || !models.length}
                  onChange={(e) => setModel(e.target.value)}
                >
                  {models.length ? (
                    models.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))
                  ) : (
                    <option value="">Sin modelo preparado</option>
                  )}
                </select>
              </label>
              <button
                className="primary"
                disabled={busy || !localEngine || !model || !prompt.trim()}
                onClick={() => {
                  setFocus("");
                  setPreviewLive(true);
                  onGenerate({ prompt, mode, model, max_tokens: budget });
                }}
              >
                <Sparkles size={15} />
                Generar propuesta
              </button>
              {!models.length && (
                <p className="tool-help">
                  Prepara Ollama y un modelo local desde la documentación de
                  instalación. La demo permite editar guiones, pero no genera
                  texto.
                </p>
              )}
              {!job &&
                jobs
                  .filter(
                    (j) =>
                      j.kind === "script" &&
                      ["failed", "cancelled", "done"].includes(j.state),
                  )
                  .slice(0, 1)
                  .map((j) => (
                    <p
                      className={
                        j.state === "failed" ? "take-warning" : "tool-help"
                      }
                      key={j.id}
                    >
                      {j.state === "failed"
                        ? j.error
                        : j.state === "cancelled"
                          ? "Generación detenida. Tu guion se conserva."
                          : j.result.truncated
                            ? "Se alcanzó el límite de tokens. Revisa y continúa el borrador si lo necesitas."
                            : "Propuesta guardada en Versiones. Revísala antes de usarla."}
                    </p>
                  ))}
              <details className="editorial-summary">
                <summary>
                  <SlidersHorizontal size={14} />
                  Tono y criterio
                </summary>
                <p>{tone}</p>
                <button className="subtle" onClick={onCriterion}>
                  Editar criterio
                </button>
              </details>
              <p className="tool-help">
                El modelo recibe el criterio del canal y del episodio. Las
                fuentes aportadas requieren comprobación; no hay búsqueda web
                automática.
              </p>
            </div>
          ) : (
            <div className="assistant-body">
              <label className="toggle-row">
                <input
                  type="checkbox"
                  checked={showDiscarded}
                  onChange={(e) => setShowDiscarded(e.target.checked)}
                />
                Ver descartadas
              </label>
              <div className="script-version-list">
                {drafts
                  .filter((d) => showDiscarded || d.status === "ready")
                  .map((d) => (
                    <button
                      className={focus === d.id ? "selected" : ""}
                      onClick={() => {
                        setFocus(d.id);
                        setPreviewLive(false);
                      }}
                      key={d.id}
                    >
                      <FileText size={17} />
                      <span>
                        <strong>
                          Versión{" "}
                          {drafts.findIndex((item) => item.id === d.id) + 1}
                          {d.text === text && <Check size={13} />}
                        </strong>
                        <small>
                          {d.model} ·{" "}
                          {d.status === "discarded"
                            ? "Descartada"
                            : `${d.text.split(/\s+/).length} palabras`}
                        </small>
                      </span>
                    </button>
                  ))}
              </div>
              {!drafts.length && (
                <div className="resource-empty">
                  <History size={26} />
                  <p>
                    Las propuestas de IA aparecen aquí. Elegir una conserva el
                    guion anterior.
                  </p>
                </div>
              )}
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
