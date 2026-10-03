import { describe, it, expect } from "vitest";
import { editorial, newProject, newTrack } from "./types";
describe("editorial contract", () => {
  it("creates independent language tracks without losing inherited evidence rules", () => {
    const project = newProject("channel");
    const track = newTrack("en");
    project.tracks.push(track);
    track.script = "English";
    expect(project.tracks[0].script).toBe("");
    expect(project.channel_id).toBe("channel");
    expect(project.editorial).toEqual({});
    expect(editorial.evidence_policy).toContain("fuente");
    expect(project.tracks.map((t) => t.language)).toEqual(["es", "en"]);
  });
});
