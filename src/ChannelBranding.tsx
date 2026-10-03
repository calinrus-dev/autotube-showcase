import { useEffect, useState } from "react";
import { Film, Trash2, Upload } from "lucide-react";
import { mediaPreview } from "./bridge";
import type { Asset, ChannelBranding as Branding } from "./types";
export default function ChannelBranding({
  value,
  assets,
  busy,
  onImport,
  onChange,
}: {
  value: Branding;
  assets: Asset[];
  busy: boolean;
  onImport: (part: "intro_id" | "outro_id") => void;
  onChange: (value: Branding) => void;
}) {
  return (
    <div className="channel-branding">
      <p className="tool-help">
        Clips reutilizables en los episodios del canal. Se conserva su audio;
        los clips sin sonido se exportan con silencio.
      </p>
      {(["intro_id", "outro_id"] as const).map((part) => (
        <div className="brand-clip" key={part}>
          <div className="tool-section-heading">
            <strong>
              <Film size={15} />
              {part === "intro_id" ? "Intro del canal" : "Cierre del canal"}
            </strong>
            {value[part] && (
              <button
                type="button"
                className="icon-button"
                aria-label={
                  part === "intro_id"
                    ? "Quitar intro del canal"
                    : "Quitar cierre del canal"
                }
                disabled={busy}
                onClick={() => onChange({ ...value, [part]: "" })}
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
          {value[part] && <ClipPreview id={value[part]} />}
          <span className="resource-name">
            {assets.find((a) => a.id === value[part])?.name || "Sin clip"}
          </span>
          <button type="button" disabled={busy} onClick={() => onImport(part)}>
            <Upload size={14} />
            {value[part] ? "Cambiar clip" : "Importar clip"}
          </button>
        </div>
      ))}
    </div>
  );
}
function ClipPreview({ id }: { id: string }) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    let active = true;
    setSrc("");
    mediaPreview(id)
      .then((s) => {
        if (active) setSrc(s);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [id]);
  return src ? (
    <video
      controls
      preload="none"
      src={src}
      aria-label="Previsualizar clip del canal"
    />
  ) : null;
}
