import { describe, expect, it } from "vitest";
import { SERIES, SERIES_IDS } from "@/series";

describe("SERIES_IDS", () => {
  it("includes defined series ids", () => {
    expect(SERIES_IDS).toContain("dod-digitaltwin-unity");
  });
});

describe("SERIES metadata", () => {
  it("has unique ids", () => {
    expect(new Set(SERIES_IDS).size).toBe(SERIES_IDS.length);
  });

  it("has label, description, and a valid status without category coupling", () => {
    for (const id of SERIES_IDS) {
      expect(SERIES[id].label.trim()).not.toBe("");
      expect(SERIES[id].description.trim()).not.toBe("");
      expect(["ongoing", "completed"]).toContain(SERIES[id].status);
      expect(SERIES[id]).not.toHaveProperty("category");
    }
  });
});
