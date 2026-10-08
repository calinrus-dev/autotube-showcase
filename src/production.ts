import type { Job, Project } from "./types";

export type OutputTarget = "audio" | "video";
export type StageId = "script" | "audio" | "video" | "metadata";
export type ProductionStep = {
  id: StageId;
  title: string;
  action: string;
  detail: string;
  status: "empty" | "ready" | "review" | "working";
  label: string;
};

export function productionSteps(project: Project, language: string, jobs: Job[], target: OutputTarget): ProductionStep[] {
  const track = project.tracks.find((t) => t.language === language);
  const text = track?.script || (language === project.language ? project.script : "");
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const takes = track?.takes?.filter((t) => t.status === "ready") || [];
  const chosen = takes.find((t) => t.id === track?.audio_id);
  const hasAudio = !!track?.audio_id && (!track.takes?.length || !!chosen && !chosen.sample);
  const stale = hasAudio && chosen && !chosen.sample && chosen.script !== text;
  const video = language === project.language ? project.video_id : track?.video_id;
  const steps: ProductionStep[] = [
    { id: "script", title: "Guion", action: words ? "Afinar el guion" : "Empezar el guion", detail: words ? `${words} palabras · ~${Math.max(1, Math.ceil(words / 145))} min de voz` : "Escribe, pega o pide una primera versión.", status: words ? "ready" : "empty", label: words ? "Texto preparado" : "Por crear" },
    { id: "audio", title: "Voz", action: hasAudio ? "Escuchar mi audio" : takes.length ? "Revisar las tomas" : "Crear mi audio", detail: stale ? "El guion cambió. Revisa la toma elegida." : hasAudio ? "Tu toma está elegida. Puedes guardarla ya." : takes.length ? `${takes.length} ${takes.length === 1 ? "toma para escuchar" : "tomas para escuchar"}. Elige una completa.` : "Prueba una voz, genera o importa un audio.", status: stale ? "review" : hasAudio ? "ready" : takes.length ? "review" : "empty", label: stale ? "Revisar texto" : hasAudio ? "Audio elegido" : takes.length ? "Por escuchar" : "Sin audio" },
  ];
  if (target === "video") steps.push(
    { id: "video", title: "Montaje", action: video ? "Ver mi vídeo" : "Preparar el montaje", detail: video ? "Vídeo disponible para reproducir y guardar." : "Una imagen o un bucle, tu voz y el estilo del canal.", status: video ? "ready" : "empty", label: video ? "Vídeo listo" : "Por montar" },
    { id: "metadata", title: "Publicación", action: "Preparar la publicación", detail: "Título, miniatura y salida a YouTube cuando decidas.", status: "empty", label: "Opcional" },
  );
  for (const step of steps) {
    const kind = { script: "script", audio: "voice", video: "render", metadata: "upload" }[step.id];
    const relevant = jobs.filter((j) => j.project_id === project.id && j.kind === kind && (j.payload.request?.language || j.payload.language || project.language) === language);
    const active = relevant.find((j) => ["queued", "running"].includes(j.state));
    const failed = relevant.find((j) => ["failed", "needs_review"].includes(j.state));
    if (active) {
      step.status = "working";
      step.label = active.state === "queued" ? "En cola" : step.id === "script" ? "Escribiendo…" : `${Math.round(active.progress * 100)} %`;
      step.detail = "Puedes seguir el trabajo y revisar el resultado aquí.";
    } else if (failed && (!relevant[0] || relevant[0].id === failed.id)) {
      step.status = "review";
      step.label = "Requiere revisión";
      step.detail = failed.error || "Revisa la actividad antes de continuar.";
    } else if (step.id === "metadata" && relevant.some((j) => j.state === "done" && j.result.url)) {
      step.status = "ready";
      step.label = "En YouTube";
      step.detail = "Subida completada. Consulta el enlace en la actividad.";
    }
  }
  return steps;
}

export function suggestedStep(steps: ProductionStep[]): ProductionStep {
  return steps.find((s) => s.status === "working") || steps.find((s) => s.status !== "ready") || steps.find((s) => s.id === "audio") || steps[0];
}
