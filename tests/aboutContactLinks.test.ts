import { describe, expect, it } from "vitest";
import { getAboutContactLinks } from "@/utils/getAboutContactLinks";

const site = { profile: "https://profile.example.com/fallback" };

describe("getAboutContactLinks", () => {
  it("prefers a case-insensitive GitHub social over the profile fallback", () => {
    expect(
      getAboutContactLinks({
        site,
        socials: [
          { name: "GitHub", url: "https://github.com/selected" },
          { name: "other", url: "https://example.com/other" },
        ],
      }).github
    ).toBe("https://github.com/selected");
  });

  it("falls back to site.profile when no GitHub social exists", () => {
    expect(
      getAboutContactLinks({
        site,
        socials: [{ name: "other", url: "https://example.com/other" }],
      }).github
    ).toBe(site.profile);
  });

  it("returns only an explicitly configured mailto social as email", () => {
    const email = {
      name: "mail",
      url: "mailto:owner@example.com",
      linkTitle: "Write to the owner",
    };

    expect(
      getAboutContactLinks({
        site,
        socials: [
          { name: "email", url: "https://example.com/contact" },
          email,
        ],
      }).email
    ).toEqual(email);
  });
});
