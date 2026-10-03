import { invoke, isTauri } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import type { Snapshot, Project, Channel } from "./types";
import { editorial, newProject } from "./types";
export const desktop = isTauri();
const storageKey = "autotube-demo-v1";
const mediaKey = "autotube-demo-media-v1";
function seed(): Snapshot {
  const channel: Channel = {
    id: "demo-channel",
    name: "Lo Que Te Pasa",
    youtube_id: "",
    languages: ["es", "en"],
    timezone: "Europe/Madrid",
    editorial: { ...editorial },
  };
  const project = {
    ...newProject(channel.id),
    id: "demo-project",
    title: "Por qué repites lo que te hace daño",
    revision: 1,
    script:
      "Sabes que esa conversación acaba igual. Y aun así vuelves.\n\nNo te voy a decir que tienes un cerebro roto. Vamos a mirar el patrón: qué lo dispara, qué te da en el momento y qué te cobra después.\n\nUna explicación útil no te etiqueta. Te permite comprobar qué ocurre cuando cambias una pieza.",
    description:
      "Un episodio sobre patrones, decisiones y cómo observarlos. Borrador editorial: añade fuentes verificadas antes de publicar.",
    tags: ["psicología", "patrones", "introspección"],
    sources: [],
  };
  return {
    channels: [channel],
    projects: [project],
    assets: [],
    jobs: [],
    settings: {},
    mode: "demo",
    version: "0.1.0",
  };
}
function load(): Snapshot {
  try {
    return JSON.parse(localStorage.getItem(storageKey) || "null") || seed();
  } catch {
    return seed();
  }
}
function save(state: Snapshot) {
  localStorage.setItem(storageKey, JSON.stringify(state));
}
export async function command<T = unknown>(
  operation: string,
  args: unknown = {},
): Promise<T> {
  if (desktop) return invoke<T>("engine_command", { operation, args });
  const state = load();
  const data = args as Record<string, unknown>;
  let result: unknown;
  if (operation === "snapshot") return state as T;
  if (operation === "save_project") {
    const p = structuredClone(args) as Project;
    const old = state.projects.find((item) => item.id === p.id);
    if (old && old.revision !== p.revision)
      throw new Error("El proyecto cambió; vuelve a cargar.");
    if (!p.title.trim() || p.title.length > 100)
      throw new Error("El título debe tener entre 1 y 100 caracteres.");
    if (!state.channels.some((c) => c.id === p.channel_id))
      throw new Error("Canal no encontrado.");
    p.id ||= crypto.randomUUID();
    p.revision = (old?.revision || 0) + 1;
    p.updated_at = new Date().toISOString();
    state.projects = [p, ...state.projects.filter((item) => item.id !== p.id)];
    result = p;
  } else if (operation === "save_channel") {
    const c = structuredClone(args) as Channel;
    c.id ||= crypto.randomUUID();
    if (!c.name.trim()) throw new Error("Escribe un nombre de canal.");
    new Intl.DateTimeFormat("es", { timeZone: c.timezone });
    state.channels = [...state.channels.filter((item) => item.id !== c.id), c];
    result = c;
  } else if (operation === "editorial_brief") {
    const project = state.projects.find((p) => p.id === data.project_id)!;
    const channel = state.channels.find((c) => c.id === project.channel_id)!;
    result = {
      project,
      channel,
      resolved_editorial: {
        ...channel.editorial,
        ...Object.fromEntries(
          Object.entries(project.editorial).filter(([, v]) => v?.trim()),
        ),
      },
    };
  } else if (operation === "asset_preview") {
    result = JSON.parse(localStorage.getItem(mediaKey) || "{}")[
      String(data.asset_id)
    ];
  } else if (operation === "settings") {
    if (data.elevenlabs_key)
      throw new Error(
        "La demo no guarda claves. Configura ElevenLabs en el escritorio.",
      );
    state.settings = { ...state.settings, ...(data as Record<string, string>) };
    result = { saved: true };
  } else {
    throw new Error(
      "Esta acción necesita la aplicación de escritorio y un proveedor conectado. La demo no publica ni genera audio.",
    );
  }
  save(state);
  return result as T;
}
export async function importMedia(
  kind: string,
): Promise<{ id: string; name: string } | null> {
  if (desktop) {
    const path = await open({
      multiple: false,
      filters: [
        {
          name: kind,
          extensions:
            kind === "audio"
              ? ["wav", "mp3", "m4a", "flac", "ogg"]
              : kind === "thumbnail"
                ? ["png", "jpg", "jpeg", "webp"]
                : ["mp4", "mov", "mkv", "webm"],
        },
      ],
    });
    return typeof path === "string"
      ? command("import_asset", { path, kind })
      : null;
  }
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = kind === "thumbnail" ? "image/*" : kind + "/*";
    input.oncancel = () => resolve(null);
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return resolve(null);
      if (file.size > 5 * 1024 * 1024) {
        alert(
          "La demo admite archivos de hasta 5 MiB. El escritorio admite archivos mayores.",
        );
        return resolve(null);
      }
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const state = load();
          const id = crypto.randomUUID();
          const media = JSON.parse(localStorage.getItem(mediaKey) || "{}");
          media[id] = reader.result;
          localStorage.setItem(mediaKey, JSON.stringify(media));
          state.assets.push({
            id,
            name: file.name,
            kind,
            size: file.size,
            sha256: "demo-local",
          });
          save(state);
          resolve({ id, name: file.name });
        } catch {
          alert("No hay espacio en el almacenamiento de la demo.");
          resolve(null);
        }
      };
      reader.readAsDataURL(file);
    };
    input.click();
  });
}
export async function choosePath(extensions?: string[]): Promise<string> {
  if (!desktop)
    throw new Error("Abre la aplicación de escritorio para seleccionar rutas.");
  const path = await open({
    multiple: false,
    ...(extensions ? { filters: [{ name: "Archivo", extensions }] } : {}),
  });
  return typeof path === "string" ? path : "";
}
