import { afterEach, describe, expect, it, vi } from "vitest";
import { initPostInteractions } from "@/scripts/postInteractions";

type FakeListener = (event: {
  key?: string;
  preventDefault(): void;
  shiftKey?: boolean;
  target: FakeElement;
  touches: { clientX: number; clientY: number }[];
}) => void;

class FakeElement {
  readonly attributes = new Map<string, string>();
  readonly children: FakeElement[] = [];
  readonly classList = {
    add: (name: string) => {
      if (!this.className.split(" ").includes(name)) {
        this.className = `${this.className} ${name}`.trim();
      }
    },
    remove: (name: string) => {
      this.className = this.className
        .split(" ")
        .filter(part => part && part !== name)
        .join(" ");
    },
  };
  readonly style: Record<string, string> = {};
  alt = "";
  className = "";
  clientHeight = 100;
  clientWidth = 100;
  currentSrc = "";
  id = "";
  innerHTML = "";
  innerText = "";
  parentNode: FakeElement | null = null;
  src = "";
  type = "";
  private readonly listeners = new Map<string, Set<FakeListener>>();

  constructor(
    readonly tagName: string,
    private readonly ownerDocument: FakeDocument
  ) {}

  addEventListener(
    type: string,
    listener: FakeListener,
    options?: AddEventListenerOptions | boolean
  ) {
    const listeners = this.listeners.get(type) ?? new Set();
    listeners.add(listener);
    this.listeners.set(type, listeners);
    if (typeof options === "object") {
      options.signal?.addEventListener(
        "abort",
        () => listeners.delete(listener),
        { once: true }
      );
    }
  }

  append(...children: FakeElement[]) {
    children.forEach(child => this.appendChild(child));
  }

  appendChild(child: FakeElement) {
    child.parentNode = this;
    this.children.push(child);
    return child;
  }

  closest(selector: string): FakeElement | null {
    const tagName = selector.toUpperCase();
    for (let element: FakeElement | null = this; element; element = element.parentNode) {
      if (element.tagName === tagName) return element;
    }
    return null;
  }

  contains(candidate: FakeElement): boolean {
    return candidate === this || this.children.some(child => child.contains(candidate));
  }

  dispatch(type: string, target: FakeElement = this, key?: string) {
    const event = {
      key,
      preventDefault() {},
      shiftKey: false,
      target,
      touches: [],
    };
    this.listeners.get(type)?.forEach(listener => listener(event));
  }

  focus() {
    this.ownerDocument.activeElement = this;
  }

  insertBefore(child: FakeElement, before: FakeElement) {
    const index = this.children.indexOf(before);
    if (index < 0) return this.appendChild(child);
    child.parentNode = this;
    this.children.splice(index, 0, child);
    return child;
  }

  listenerCount(type: string) {
    return this.listeners.get(type)?.size ?? 0;
  }

  querySelector(selector: string) {
    return this.querySelectorAll(selector)[0] ?? null;
  }

  querySelectorAll(selector: string): FakeElement[] {
    const matches = (element: FakeElement) => {
      if (selector === "img") return element.tagName === "IMG";
      if (selector === "code") return element.tagName === "CODE";
      if (selector === ".copy-code") {
        return element.className.split(" ").includes("copy-code");
      }
      if (selector.startsWith("a[href], button")) {
        return element.tagName === "BUTTON";
      }
      return false;
    };
    const matchesFound: FakeElement[] = [];
    this.walk(element => {
      if (element !== this && matches(element)) matchesFound.push(element);
    });
    return matchesFound;
  }

  remove() {
    if (!this.parentNode) return;
    this.parentNode.children.splice(this.parentNode.children.indexOf(this), 1);
    this.parentNode = null;
  }

  setAttribute(name: string, value: string) {
    this.attributes.set(name, value);
  }

  walk(visit: (element: FakeElement) => void) {
    visit(this);
    this.children.forEach(child => child.walk(visit));
  }
}

class FakeImageElement extends FakeElement {}

class FakeDocument {
  readonly body = new FakeElement("BODY", this);
  readonly documentElement = {
    clientHeight: 100,
    scrollHeight: 200,
    scrollTop: 0,
  };
  activeElement: FakeElement | null = null;
  private readonly listeners = new Map<string, Set<FakeListener>>();

  addEventListener(
    type: string,
    listener: FakeListener,
    options?: AddEventListenerOptions | boolean
  ) {
    const listeners = this.listeners.get(type) ?? new Set();
    listeners.add(listener);
    this.listeners.set(type, listeners);
    if (typeof options === "object") {
      options.signal?.addEventListener(
        "abort",
        () => listeners.delete(listener),
        { once: true }
      );
    }
  }

  createElement(tagName: string) {
    return tagName === "img"
      ? new FakeImageElement("IMG", this)
      : new FakeElement(tagName.toUpperCase(), this);
  }

  dispatch(type: string, key?: string) {
    const event = {
      key,
      preventDefault() {},
      shiftKey: false,
      target: this.body,
      touches: [],
    };
    this.listeners.get(type)?.forEach(listener => listener(event));
  }

  getElementById(id: string) {
    return this.find(element => element.id === id);
  }

  listenerCount(type: string) {
    return this.listeners.get(type)?.size ?? 0;
  }

  querySelector(selector: string) {
    if (selector !== ".progress-container") return null;
    return this.find(element =>
      element.className.split(" ").includes("progress-container")
    );
  }

  querySelectorAll(selector: string) {
    return selector === "pre" ? this.body.querySelectorAll("pre") : [];
  }

  removeEventListener(type: string, listener: FakeListener) {
    this.listeners.get(type)?.delete(listener);
  }

  count(predicate: (element: FakeElement) => boolean) {
    let count = 0;
    this.body.walk(element => {
      if (predicate(element)) count++;
    });
    return count;
  }

  private find(predicate: (element: FakeElement) => boolean) {
    let match: FakeElement | null = null;
    this.body.walk(element => {
      if (!match && predicate(element)) match = element;
    });
    return match;
  }
}

function installBrowserGlobals(fakeDocument: FakeDocument) {
  let nextTimer = 1;
  vi.stubGlobal("document", fakeDocument);
  vi.stubGlobal("Element", FakeElement);
  vi.stubGlobal("HTMLImageElement", FakeImageElement);
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    callback(0);
    return 1;
  });
  vi.stubGlobal("getComputedStyle", () => ({
    getPropertyValue: () => "",
  }));
  vi.stubGlobal("window", {
    clearTimeout: () => {},
    matchMedia: () => ({ matches: false }),
    setTimeout: () => nextTimer++,
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("initPostInteractions", () => {
  it("replaces the current page lifecycle instead of accumulating UI and listeners", () => {
    const fakeDocument = new FakeDocument();
    installBrowserGlobals(fakeDocument);

    initPostInteractions();
    expect(
      fakeDocument.count(element =>
        element.className.split(" ").includes("progress-container")
      )
    ).toBe(1);
    expect(fakeDocument.listenerCount("scroll")).toBe(1);

    const cleanup = initPostInteractions();
    expect(
      fakeDocument.count(element =>
        element.className.split(" ").includes("progress-container")
      )
    ).toBe(1);
    expect(fakeDocument.listenerCount("scroll")).toBe(1);

    cleanup();
    expect(fakeDocument.listenerCount("scroll")).toBe(0);
  });

  it("immediately removes an open lightbox and restores page state on cleanup", () => {
    const fakeDocument = new FakeDocument();
    const article = fakeDocument.createElement("article");
    article.id = "article";
    const image = fakeDocument.createElement("img");
    image.src = "/image.png";
    article.appendChild(image);
    fakeDocument.body.appendChild(article);
    fakeDocument.body.style.overflow = "clip";
    installBrowserGlobals(fakeDocument);

    const cleanup = initPostInteractions();
    article.dispatch("click", image);
    expect(fakeDocument.body.style.overflow).toBe("hidden");
    expect(
      fakeDocument.count(element => element.attributes.get("role") === "dialog")
    ).toBe(1);

    cleanup();
    expect(fakeDocument.body.style.overflow).toBe("clip");
    expect(fakeDocument.activeElement).toBe(image);
    expect(article.listenerCount("click")).toBe(0);
    expect(fakeDocument.listenerCount("keydown")).toBe(0);
    expect(
      fakeDocument.count(element => element.attributes.get("role") === "dialog")
    ).toBe(0);
  });
});
