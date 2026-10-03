export interface Editorial {
  purpose: string;
  audience: string;
  tone: string;
  evidence_policy: string;
  prohibited: string;
  narrator: string;
  visual_style: string;
}
export interface Channel {
  id: string;
  name: string;
  youtube_id: string;
  languages: string[];
  timezone: string;
  editorial: Editorial;
}
export interface Track {
  language: string;
  script: string;
  audio_id: string;
  video_id?: string;
  voice: string;
  provider: "elevenlabs" | "qwen3" | "chatterbox" | "imported";
  title: string;
  description: string;
}
export interface Project {
  id: string;
  channel_id: string;
  title: string;
  description: string;
  script: string;
  language: string;
  tags: string[];
  sources: string[];
  editorial: Partial<Editorial>;
  tracks: Track[];
  thumbnail_id: string;
  video_id: string;
  category_id: string;
  made_for_kids: boolean;
  synthetic_media: boolean;
  revision: number;
  updated_at: string;
}
export interface Asset {
  id: string;
  name: string;
  kind: string;
  size: number;
  sha256: string;
}
export interface Job {
  id: string;
  project_id: string;
  kind: string;
  state: string;
  progress: number;
  error: string;
  payload: { project: Project; publish_at?: string };
  result: { url?: string; thumbnail?: string };
}
export interface Snapshot {
  channels: Channel[];
  projects: Project[];
  assets: Asset[];
  jobs: Job[];
  settings: Record<string, string>;
  mode: string;
  version: string;
}
export const editorial: Editorial = {
  purpose:
    "Entender la mente y los patrones de conducta con ejemplos cotidianos.",
  audience:
    "Personas curiosas que quieren entender lo que sienten y cómo actúan.",
  tone: "Quirúrgico, directo a ti, lenguaje de calle sin caricatura. Una idea por frase. Expone patrones con precisión, sin vender certezas.",
  evidence_policy:
    "Toda afirmación comprobable lleva una fuente. Distingue evidencia, hipótesis e interpretación. Explica límites y alternativas.",
  prohibited:
    "No diagnosticar al espectador, inventar estudios, prometer curas ni glorificar la manipulación.",
  narrator:
    "Colaborador informado: cercano, incisivo y original. No fingir credenciales ni imitar voces reales.",
  visual_style:
    "Editorial oscuro, tipografía clara, imágenes que expliquen la narración.",
};
export const labels: Record<keyof Editorial, string> = {
  purpose: "Propósito",
  audience: "Audiencia",
  tone: "Tono",
  evidence_policy: "Reglas de evidencia",
  prohibited: "Límites editoriales",
  narrator: "Narrador",
  visual_style: "Lenguaje visual",
};
export function newTrack(language: string): Track {
  return {
    language,
    script: "",
    audio_id: "",
    voice: "",
    provider: "imported",
    title: "",
    description: "",
  };
}
export function newProject(channel_id: string): Project {
  return {
    id: "",
    channel_id,
    title: "Nuevo episodio",
    description: "",
    script: "",
    language: "es",
    tags: [],
    sources: [],
    editorial: {},
    tracks: [newTrack("es")],
    thumbnail_id: "",
    video_id: "",
    category_id: "27",
    made_for_kids: false,
    synthetic_media: false,
    revision: 0,
    updated_at: "",
  };
}
