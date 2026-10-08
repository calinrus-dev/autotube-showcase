import { ArrowRight, AudioLines, Check, Clapperboard, FileText, LayoutDashboard, LoaderCircle, SlidersHorizontal, Upload } from "lucide-react";
import type { OutputTarget, ProductionStep, StageId } from "./production";
import { suggestedStep } from "./production";

const icons = { script: FileText, audio: AudioLines, video: Clapperboard, metadata: Upload };
type Props = {
  steps: ProductionStep[]; target: OutputTarget; current: string; language: string; languages: string[];
  onTarget: (target: OutputTarget) => void; onStage: (stage: StageId | "overview") => void;
  onLanguage: (language: string) => void; onCriterion: () => void;
};
export default function ProductionFlow({ steps, target, current, language, languages, onTarget, onStage, onLanguage, onCriterion }: Props) {
  return <section className="production-flow" aria-label="Recorrido de producción">
    <nav className="stage-route" aria-label="Pasos del episodio">
      <button aria-current={current === "overview" ? "page" : undefined} className={current === "overview" ? "selected" : ""} onClick={() => onStage("overview")}><LayoutDashboard size={15} /><span>Resumen</span></button>
      {steps.map(step => { const Icon = icons[step.id]; return <button key={step.id} title={step.label} aria-current={current === step.id ? "step" : undefined} className={`stage-tab ${step.status} ${current === step.id ? "selected" : ""}`} onClick={() => onStage(step.id)}><Icon size={15} /><span>{step.title}</span><i className="stage-dot" aria-label={step.label} /></button>; })}
    </nav>
    <div className="flow-context">
      <label className="flow-target"><span className="sr-only">Resultado del episodio</span><select value={target} onChange={e => { onTarget(e.target.value as OutputTarget); if(e.target.value === "audio" && ["video", "metadata"].includes(current)) onStage("audio"); }}><option value="video">Vídeo</option><option value="audio">Solo audio</option></select></label>
      <label className="flow-language"><span className="sr-only">Idioma</span><select value={language} onChange={e => onLanguage(e.target.value)}>{languages.map(l => <option key={l} value={l}>{l.toUpperCase()}</option>)}</select></label>
      <button className="criterion-button" aria-label="Criterio del episodio" title="Criterio del episodio" onClick={onCriterion}><SlidersHorizontal size={15} /></button>
    </div>
  </section>;
}
export function ProductionOverview({ steps, target, onStage }: Pick<Props, "steps" | "target" | "onStage">) {
  const next = suggestedStep(steps);
  const ready = steps.filter(s => s.status === "ready").length;
  const complete = target === "audio" && steps.find(s => s.id === "audio")?.status === "ready";
  return <section className="production-overview" aria-label="Estado de producción">
    <div className="overview-toolbar"><div><strong>Tu episodio, paso a paso</strong><span>{ready} de {steps.length} pasos preparados · {target === "audio" ? "Solo audio" : "Vídeo y publicación opcional"}</span></div><button className="primary" onClick={() => onStage(complete ? "audio" : next.id)}>{complete ? "Escuchar y guardar" : next.action}<ArrowRight size={16} /></button></div>
    <div className="overview-steps">{steps.map((step, index) => {const Icon = icons[step.id]; return <button key={step.id} className={`overview-step ${step.status}`} onClick={() => onStage(step.id)}><span className="overview-number">0{index + 1}</span><Icon size={24}/><strong>{step.title}</strong><span className="stage-status">{step.status === "ready" ? <Check size={12}/> : step.status === "working" ? <LoaderCircle size={12} className="spin"/> : null}{step.label}</span><p>{step.detail}</p><span className="overview-action">Abrir <ArrowRight size={14}/></span></button>; })}</div>
    <p className="overview-help">Entra en cualquier paso. Puedes importar material existente o terminar con el audio.</p>
  </section>;
}
