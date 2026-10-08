import { invoke, isTauri, convertFileSrc } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import type { Snapshot, Project, Channel } from "./types";
import { editorial, newProject } from "./types";
export const desktop = isTauri();
export const localEngine = desktop;
export async function mediaPreview(assetId: string): Promise<string> {
  if (desktop)
    return convertFileSrc(
      await command<string>("asset_path", { asset_id: assetId }),
    );
  if (localEngine) return "/engine/media/" + encodeURIComponent(assetId);
  return command<string>("asset_preview", { asset_id: assetId });
}
export async function downloadAsset(assetId: string, title: string): Promise<string> {
  if (desktop) {
    const exported = await command<{ path: string }>("export_asset", { asset_id: assetId });
    return "Archivo guardado: " + exported.path;
  }
  const snapshot = await command<Snapshot>("snapshot");
  const asset = snapshot.assets.find((item) => item.id === assetId);
  if (!asset) throw new Error("El recurso ya no está disponible.");
  const response = await fetch(await mediaPreview(assetId));
  if (!response.ok) throw new Error("No se pudo guardar el recurso.");
  const blob = await response.blob();
  const extension = asset.name.match(/\.[a-z0-9]{2,5}$/i)?.[0] || (asset.kind === "video" ? ".mp4" : ".wav");
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = title.replace(/[\\/:*?"<>|]/g, "-").slice(0, 120) + extension;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
  return asset.kind === "video" ? "Vídeo descargado" : "Audio descargado";
}
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
    version: "0.4.2",
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
  if (localEngine) {
    const response = await fetch("/engine/command", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-AutoTube-Local": "1" },
      body: JSON.stringify({ operation, args }),
    });
    const result = await response.json();
    if (!response.ok)
      throw new Error(result.detail || "El motor local no responde");
    return result as T;
  }
  const state = load();
  const data = args as Record<string, unknown>;
  let result: unknown;
  if (operation === "snapshot") {
    state.projects.forEach((p) => {
      p.tracks.forEach((t) => {
        t.takes ||= t.audio_id
          ? [
              {
                id: t.audio_id,
                script: t.script || p.script,
                provider: t.provider,
                voice: t.voice,
                model: t.model || "",
                created_at: "",
                status: "ready",
                sample: false,
                duration: 0,
              },
            ]
          : [];
      });
    });
    return state as T;
  }
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
    const previous = state.channels.find((item) => item.id === c.id);
    if (
      previous &&
      JSON.stringify(previous.branding || {}) !==
        JSON.stringify(c.branding || {})
    ) {
      state.projects
        .filter((p) => p.channel_id === c.id)
        .forEach((p) => {
          p.video_id = "";
          p.tracks.forEach((t) => {
            t.video_id = "";
          });
          p.revision++;
        });
    }
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
  } else if (operation === "record_take" || operation === "take_action") {
    const p = state.projects.find((p) => p.id === data.project_id);
    if (!p || p.revision !== data.revision)
      throw new Error("El proyecto cambió; vuelve a cargar");
    const t = p.tracks.find((t) => t.language === data.language)!;
    t.takes ||= t.audio_id
      ? [
          {
            id: t.audio_id,
            script: t.script || p.script,
            provider: t.provider,
            voice: t.voice,
            model: t.model || "",
            created_at: "",
            status: "ready",
            sample: false,
            duration: 0,
          },
        ]
      : [];
    if (operation === "record_take") {
      t.takes.push({
        id: String(data.asset_id),
        script: t.script || p.script,
        provider: "imported",
        voice: "",
        model: "",
        created_at: new Date().toISOString(),
        status: "ready",
        sample: false,
        duration: 0,
      });
    } else {
      const take = t.takes.find((t) => t.id === data.take_id);
      if (!take) throw new Error("Toma no encontrada");
      if (data.action === "approve") {
        if (!take.sample || take.status === "discarded")
          throw new Error("Elige una muestra disponible");
        t.preferred_sample_id = take.id;
        t.model = take.model;
        t.voice = take.voice;
        t.provider = take.provider as typeof t.provider;
      }
      if (data.action === "use") {
        if (take.sample || take.status === "discarded")
          throw new Error("Elige una toma completa");
        t.audio_id = take.id;
      }
      if (data.action === "discard") {
        take.status = "discarded";
        if (t.preferred_sample_id === take.id) t.preferred_sample_id = "";
        if (t.audio_id === take.id) t.audio_id = "";
      }
      if (data.action === "restore") take.status = "ready";
      t.video_id = "";
      if (t.language === p.language) p.video_id = "";
    }
    p.revision++;
    p.updated_at = new Date().toISOString();
    result = p;
  } else if (operation === "script_action") {
    const p = state.projects.find((p) => p.id === data.project_id);
    if (!p || p.revision !== data.revision)
      throw new Error("El proyecto cambió; vuelve a cargar");
    const draft = p.script_drafts?.find((d) => d.id === data.draft_id);
    if (!draft) throw new Error("Versión de guion no encontrada");
    if (data.action === "use") {
      if (draft.status === "discarded")
        throw new Error("Recupera la versión antes de usarla");
      const track = p.tracks.find((t) => t.language === draft.language)!;
      const before =
        track.script || (draft.language === p.language ? p.script : "");
      if (
        before &&
        !p.script_drafts?.some(
          (d) => d.language === draft.language && d.text === before,
        )
      )
        p.script_drafts?.push({
          id: crypto.randomUUID(),
          language: draft.language,
          text: before,
          model: "manual",
          status: "ready",
          created_at: new Date().toISOString(),
        });
      if (draft.language === p.language) {
        p.script = draft.text;
        track.script = "";
      } else track.script = draft.text;
    } else draft.status = data.action === "discard" ? "discarded" : "ready";
    p.revision++;
    result = p;
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
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = kind === "thumbnail" ? "image/*" : kind + "/*";
    input.oncancel = () => resolve(null);
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return resolve(null);
      if (file.size > (localEngine ? 25 : 5) * 1024 * 1024) {
        return reject(
          new Error(
            localEngine
              ? "El navegador local admite archivos de hasta 25 MiB. Usa el escritorio para archivos mayores."
              : "La demo admite archivos de hasta 5 MiB. Usa el escritorio para archivos mayores.",
          ),
        );
      }
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          if (localEngine) {
            resolve(
              await command("import_asset_data", {
                name: file.name,
                kind,
                content: String(reader.result).split(",")[1],
              }),
            );
            return;
          }
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
          reject(new Error("No hay espacio en el almacenamiento de la demo."));
        }
      };
      reader.onerror = () =>
        reject(new Error("No se pudo leer el archivo de audio o imagen."));
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
