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
  branding?: ChannelBranding;
}
export interface ChannelBranding {
  intro_id: string;
  outro_id: string;
}
export interface Track {
  language: string;
  script: string;
  audio_id: string;
  preferred_sample_id?: string;
  video_id?: string;
  voice: string;
  provider: "elevenlabs" | "qwen3" | "chatterbox" | "imported";
  title: string;
  description: string;
  model?: string;
  takes?: AudioTake[];
}
export interface AudioTake {
  id: string;
  script: string;
  provider: string;
  voice: string;
  model: string;
  instruction?: string;
  created_at: string;
  status: "ready" | "discarded";
  sample: boolean;
  duration: number;
  generation_seconds?: number;
}
export interface VideoTheme {
  layout: "editorial" | "image" | "title" | "video";
  palette: "rose" | "violet" | "mint";
  format: "landscape" | "vertical";
  heading: string;
  subtitle: string;
  background_id: string;
  intro_enabled: boolean;
  outro_enabled: boolean;
}
export const defaultTheme: VideoTheme = {
  layout: "editorial",
  palette: "rose",
  format: "landscape",
  heading: "",
  subtitle: "",
  background_id: "",
  intro_enabled: true,
  outro_enabled: true,
};
export interface Project {
  id: string;
  channel_id: string;
  title: string;
  description: string;
  script: string;
  script_drafts?: ScriptDraft[];
  language: string;
  tags: string[];
  sources: string[];
  editorial: Partial<Editorial>;
  tracks: Track[];
  thumbnail_id: string;
  video_id: string;
  video_theme?: VideoTheme;
  category_id: string;
  made_for_kids: boolean;
  synthetic_media: boolean;
  revision: number;
  updated_at: string;
}
export interface ScriptDraft {
  id: string;
  language: string;
  text: string;
  model: string;
  prompt?: string;
  created_at: string;
  status: "ready" | "discarded";
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
  created_at?: string;
  payload: {
    project: Project;
    publish_at?: string;
    request?: { sample?: boolean };
  };
  result: {
    url?: string;
    thumbnail?: string;
    text?: string;
    phase?: string;
    tokens?: number;
    fragments?: number;
    max_tokens?: number;
    truncated?: boolean;
    cancel_requested?: boolean;
  };
}
export interface Snapshot {
  channels: Channel[];
  projects: Project[];
  assets: Asset[];
  jobs: Job[];
  settings: Record<string, string>;
  mode: string;
  version: string;
  local_voice?: {
    python_ready: boolean;
    models: Record<string, boolean>;
    device: string;
    offline: boolean;
  };
  local_text?: { running: boolean; installed: boolean; models: string[] };
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
    provider: "qwen3",
    model: "voice_design",
    takes: [],
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
    video_theme: { ...defaultTheme },
    category_id: "27",
    made_for_kids: false,
    synthetic_media: false,
    revision: 0,
    updated_at: "",
  };
}
