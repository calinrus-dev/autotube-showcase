import { describe, expect, it } from "vitest";
import { trackTakes, durationLabel } from "./TakeReview";
import { newTrack } from "./types";
describe("audio review compatibility", () => {
  it("preserves a previously selected legacy audio file", () => {
    const track = { ...newTrack("es"), audio_id: "legacy", takes: undefined };
    expect(trackTakes(track, "Original text")[0]).toMatchObject({
      id: "legacy",
      script: "Original text",
      sample: false,
      status: "ready",
    });
  });
  it("retains discarded takes for recovery", () => {
    const take = {
      id: "discarded",
      script: "Text",
      provider: "qwen3",
      voice: "",
      model: "voice_design",
      created_at: "",
      status: "discarded" as const,
      sample: false,
      duration: 70,
    };
    expect(trackTakes({ ...newTrack("es"), takes: [take] }, "Text")).toEqual([
      take,
    ]);
    expect(durationLabel(70)).toBe("1:10");
  });
});
