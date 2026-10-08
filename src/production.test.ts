import { describe, expect, it } from "vitest";
import { productionSteps, suggestedStep } from "./production";
import { newProject, newTrack } from "./types";
import type { AudioTake, Job } from "./types";

const project = () => ({ ...newProject("channel"), id: "episode", script: "Un guion para narrar.", tracks: [newTrack("es"), newTrack("en")] });

describe("production route", () => {
  it("allows an audio-only finish without losing existing video resources", () => {
    const p = project();
    p.video_id = "existing-video";
    p.tracks[0].audio_id = "legacy-audio";
    const route = productionSteps(p, "es", [], "audio");
    expect(route.map((s) => s.id)).toEqual(["script", "audio"]);
    expect(route[1].status).toBe("ready");
    expect(suggestedStep(route).id).toBe("audio");
    expect(productionSteps(p, "es", [], "video")[2].status).toBe("ready");
    expect(p.video_id).toBe("existing-video");
  });
  it("keeps samples in review and warns when the selected full take has older text", () => {
    const p = project();
    const take: AudioTake = { id: "sample", script: "Texto anterior", provider: "qwen3", voice: "", model: "voice_design", created_at: "", status: "ready", sample: true, duration: 3 };
    p.tracks[0].takes = [take];
    p.tracks[0].audio_id = take.id;
    expect(productionSteps(p, "es", [], "audio")[1].status).toBe("review");
    take.sample = false;
    expect(productionSteps(p, "es", [], "audio")[1].label).toBe("Revisar texto");
    take.script = p.script;
    expect(productionSteps(p, "es", [], "audio")[1].status).toBe("ready");
    take.status = "discarded";
    expect(productionSteps(p, "es", [], "audio")[1].status).toBe("empty");
  });
  it("shows only the selected language and prioritizes an active job", () => {
    const p = project();
    const job = { id: "job", project_id: p.id, kind: "voice", state: "running", progress: .42, error: "", payload: { project: p, request: { language: "en" } }, result: {} } as Job;
    expect(productionSteps(p, "es", [job], "audio")[1].status).toBe("empty");
    const english = productionSteps(p, "en", [job], "audio");
    expect(english[0].status).toBe("empty");
    expect(english[1].label).toBe("42 %");
    expect(suggestedStep(english).id).toBe("audio");
  });
  it("does not hide a failed job behind an older selected take", () => {
    const p = project();
    p.tracks[0].audio_id = "legacy";
    const job = { id: "job", project_id: p.id, kind: "voice", state: "failed", progress: .1, error: "Modelo pendiente", payload: { project: p, request: { language: "es" } }, result: {} } as Job;
    expect(productionSteps(p, "es", [job], "audio")[1]).toMatchObject({ status: "review", detail: "Modelo pendiente" });
  });
});
