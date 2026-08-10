import { afterEach, describe, expect, it, vi } from "vitest";
import { initSeriesAccordions } from "@/scripts/seriesAccordion";

type ClickListener = (event: { preventDefault(): void }) => void;

class FakeSummary {
  private readonly listeners = new Set<ClickListener>();

  addEventListener(
    type: string,
    listener: ClickListener,
    options?: AddEventListenerOptions
  ) {
    if (type !== "click") return;
    this.listeners.add(listener);
    options?.signal?.addEventListener(
      "abort",
      () => this.listeners.delete(listener),
      { once: true }
    );
  }

  click() {
    let prevented = false;
    this.listeners.forEach(listener =>
      listener({ preventDefault: () => (prevented = true) })
    );
    return prevented;
  }

  listenerCount() {
    return this.listeners.size;
  }
}

class FakeAnimation {
  cancelled = false;
  onfinish: (() => void) | null = null;

  cancel() {
    this.cancelled = true;
  }

  finish() {
    this.onfinish?.();
  }
}

type AnimationRecord = {
  animation: FakeAnimation;
  keyframes: Keyframe[];
  options: KeyframeAnimationOptions;
};

class FakeContent {
  currentHeight = 0;
  opacity = "0";
  readonly records: AnimationRecord[] = [];
  readonly scrollHeight = 120;
  readonly style = { height: "", opacity: "", overflow: "" };

  animate(keyframes: Keyframe[], options: KeyframeAnimationOptions) {
    const animation = new FakeAnimation();
    this.records.push({ animation, keyframes, options });
    return animation;
  }

  getBoundingClientRect() {
    return { height: this.currentHeight };
  }
}

class FakeDetails {
  open = false;
  readonly content = new FakeContent();
  readonly summary = new FakeSummary();

  querySelector(selector: string) {
    if (selector === "summary") return this.summary;
    if (selector === "[data-series-content]") return this.content;
    return null;
  }
}

class FakeDocument {
  constructor(readonly accordions: FakeDetails[]) {}

  querySelectorAll(selector: string) {
    return selector === "details[data-series-accordion]" ? this.accordions : [];
  }
}

let cleanup: (() => void) | undefined;

function installBrowser(details: FakeDetails, reducedMotion = false) {
  vi.stubGlobal("document", new FakeDocument([details]));
  vi.stubGlobal("window", {
    matchMedia: () => ({ matches: reducedMotion }),
  });
  vi.stubGlobal("getComputedStyle", (content: FakeContent) => ({
    opacity: content.opacity,
  }));
}

afterEach(() => {
  cleanup?.();
  cleanup = undefined;
  vi.unstubAllGlobals();
});

describe("initSeriesAccordions", () => {
  it("opens for 240 ms and keeps native details open after motion finishes", () => {
    const details = new FakeDetails();
    installBrowser(details);
    cleanup = initSeriesAccordions();

    expect(details.summary.click()).toBe(true);
    expect(details.open).toBe(true);
    expect(details.content.records).toHaveLength(1);

    const opening = details.content.records[0];
    expect(opening.options).toMatchObject({
      duration: 240,
      easing: "cubic-bezier(0.2, 0, 0, 1)",
    });
    expect(opening.keyframes).toEqual([
      { height: "0px", opacity: 0 },
      { height: "120px", opacity: 1 },
    ]);

    opening.animation.finish();
    expect(details.open).toBe(true);
    expect(details.content.style).toEqual({
      height: "",
      opacity: "",
      overflow: "",
    });
  });

  it("keeps details open during the 210 ms close and closes only on finish", () => {
    const details = new FakeDetails();
    installBrowser(details);
    cleanup = initSeriesAccordions();

    details.summary.click();
    details.content.records[0].animation.finish();
    details.content.currentHeight = 120;
    details.content.opacity = "1";

    details.summary.click();
    const closing = details.content.records[1];
    expect(details.open).toBe(true);
    expect(closing.options).toMatchObject({
      duration: 210,
      easing: "cubic-bezier(0.2, 0, 0, 1)",
    });

    closing.animation.finish();
    expect(details.open).toBe(false);
  });

  it("cancels and reverses from the currently rendered height", () => {
    const details = new FakeDetails();
    installBrowser(details);
    cleanup = initSeriesAccordions();

    details.summary.click();
    const opening = details.content.records[0];
    details.content.currentHeight = 48;
    details.content.opacity = "0.4";

    details.summary.click();
    const closing = details.content.records[1];
    expect(opening.animation.cancelled).toBe(true);
    expect(closing.keyframes[0]).toEqual({ height: "48px", opacity: 0.4 });

    details.content.currentHeight = 24;
    details.content.opacity = "0.2";
    details.summary.click();
    const reversedOpening = details.content.records[2];
    expect(closing.animation.cancelled).toBe(true);
    expect(reversedOpening.keyframes[0]).toEqual({
      height: "24px",
      opacity: 0.2,
    });

    reversedOpening.animation.finish();
    expect(details.open).toBe(true);
  });

  it("toggles synchronously without animation under reduced motion", () => {
    const details = new FakeDetails();
    installBrowser(details, true);
    cleanup = initSeriesAccordions();

    details.summary.click();
    expect(details.open).toBe(true);
    expect(details.content.records).toHaveLength(0);

    details.summary.click();
    expect(details.open).toBe(false);
    expect(details.content.records).toHaveLength(0);
  });

  it("cancels old motion and replaces listeners on cleanup and re-init", () => {
    const details = new FakeDetails();
    installBrowser(details);

    initSeriesAccordions();
    details.summary.click();
    const opening = details.content.records[0].animation;
    expect(details.summary.listenerCount()).toBe(1);

    cleanup = initSeriesAccordions();
    expect(opening.cancelled).toBe(true);
    expect(details.summary.listenerCount()).toBe(1);

    cleanup();
    expect(details.summary.listenerCount()).toBe(0);
  });

  it("settles the intended closed state when cleanup interrupts closing", () => {
    const details = new FakeDetails();
    installBrowser(details);
    cleanup = initSeriesAccordions();

    details.summary.click();
    details.content.records[0].animation.finish();
    details.content.currentHeight = 120;
    details.content.opacity = "1";
    details.summary.click();
    const closing = details.content.records[1].animation;

    cleanup();
    expect(closing.cancelled).toBe(true);
    expect(details.open).toBe(false);
  });

  it("ignores a stale finish callback after cleanup and re-init", () => {
    const details = new FakeDetails();
    installBrowser(details);

    initSeriesAccordions();
    details.summary.click();
    const oldOpening = details.content.records[0].animation;

    cleanup = initSeriesAccordions();
    details.content.currentHeight = 120;
    details.content.opacity = "1";
    details.summary.click();
    details.content.records[1].animation.finish();
    expect(details.open).toBe(false);

    oldOpening.finish();
    expect(details.open).toBe(false);
  });
});
