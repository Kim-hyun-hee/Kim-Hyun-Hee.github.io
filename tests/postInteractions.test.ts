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
  parentNode: FakeElement | null = null;
  src = "";
  type = "";
  private readonly listeners = new Map<string, Set<FakeListener>>();
  private text = "";

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
    child.remove();
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

  get innerHTML() {
    return this.text;
  }

  set innerHTML(value: string) {
    this.text = value;
  }

  get innerText() {
    return this.text;
  }

  set innerText(value: string) {
    this.text = value;
  }

  getAttribute(name: string) {
    return this.attributes.get(name) ?? null;
  }

  insertBefore(child: FakeElement, before: FakeElement) {
    const index = this.children.indexOf(before);
    if (index < 0) return this.appendChild(child);
    child.remove();
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
      if (selector === "pre") return element.tagName === "PRE";
      if (selector === ".copy-code") {
        return element.className.split(" ").includes("copy-code");
      }
      if (selector === ".code-frame-title") {
        return element.className.split(" ").includes("code-frame-title");
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

  removeAttribute(name: string) {
    this.attributes.delete(name);
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
  let now = 0;
  let deferNextClipboardWrite = false;
  let pendingClipboardWrite: Promise<void> | undefined;
  let resolveClipboardWrite: (() => void) | undefined;
  const clipboardWrites: string[] = [];
  const timers = new Map<
    number,
    { callback: () => void; runAt: number }
  >();
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
  vi.stubGlobal("navigator", {
    clipboard: {
      writeText: (text: string) => {
        clipboardWrites.push(text);
        if (!deferNextClipboardWrite) return Promise.resolve();
        deferNextClipboardWrite = false;
        pendingClipboardWrite = new Promise<void>(resolve => {
          resolveClipboardWrite = resolve;
        });
        return pendingClipboardWrite;
      },
    },
  });
  vi.stubGlobal("window", {
    clearTimeout: (timer: number) => timers.delete(timer),
    matchMedia: () => ({ matches: false }),
    setTimeout: (callback: () => void, delay = 0) => {
      const timer = nextTimer++;
      timers.set(timer, { callback, runAt: now + delay });
      return timer;
    },
  });

  return {
    advanceTime(milliseconds: number) {
      now += milliseconds;
      const ready = [...timers.entries()]
        .filter(([, timer]) => timer.runAt <= now)
        .sort(([, left], [, right]) => left.runAt - right.runAt);
      ready.forEach(([id, timer]) => {
        timers.delete(id);
        timer.callback();
      });
    },
    clipboardWrites,
    deferClipboardWrite() {
      deferNextClipboardWrite = true;
    },
    finishClipboardWrite() {
      resolveClipboardWrite?.();
      resolveClipboardWrite = undefined;
      return pendingClipboardWrite ?? Promise.resolve();
    },
  };
}

function appendPostArticle(fakeDocument: FakeDocument) {
  const article = fakeDocument.createElement("article");
  article.id = "article";
  fakeDocument.body.appendChild(article);
  return article;
}

function appendCodeBlock(article: FakeElement, fakeDocument: FakeDocument) {
  const pre = fakeDocument.createElement("pre");
  const code = fakeDocument.createElement("code");
  code.innerText = "const answer = 42;";
  pre.appendChild(code);
  article.appendChild(pre);
  return pre;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("initPostInteractions", () => {
  it("replaces the current page lifecycle instead of accumulating UI and listeners", () => {
    const fakeDocument = new FakeDocument();
    appendPostArticle(fakeDocument);
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

  it("stays inactive between post routes and initializes again on the next post", () => {
    const fakeDocument = new FakeDocument();
    appendPostArticle(fakeDocument);
    installBrowserGlobals(fakeDocument);

    initPostInteractions();
    expect(fakeDocument.listenerCount("scroll")).toBe(1);

    fakeDocument.body.children.splice(0);
    initPostInteractions();
    expect(
      fakeDocument.count(element =>
        element.className.split(" ").includes("progress-container")
      )
    ).toBe(0);
    expect(fakeDocument.listenerCount("scroll")).toBe(0);

    appendPostArticle(fakeDocument);
    const cleanup = initPostInteractions();
    expect(
      fakeDocument.count(element =>
        element.className.split(" ").includes("progress-container")
      )
    ).toBe(1);
    expect(fakeDocument.listenerCount("scroll")).toBe(1);
    cleanup();
  });

  it("immediately removes an open lightbox and restores page state on cleanup", () => {
    const fakeDocument = new FakeDocument();
    const article = appendPostArticle(fakeDocument);
    const image = fakeDocument.createElement("img");
    image.src = "/image.png";
    article.appendChild(image);
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

  it("reuses one copy button and resets its label 700 ms after each copied value", async () => {
    const fakeDocument = new FakeDocument();
    const article = appendPostArticle(fakeDocument);
    const codeBlock = appendCodeBlock(article, fakeDocument);
    const browser = installBrowserGlobals(fakeDocument);

    initPostInteractions();
    const copyButton = codeBlock.querySelector(".copy-code");
    expect(copyButton).not.toBeNull();
    expect(
      fakeDocument.count(element =>
        element.className.split(" ").includes("copy-code")
      )
    ).toBe(1);

    const cleanup = initPostInteractions();
    expect(
      fakeDocument.count(element =>
        element.className.split(" ").includes("copy-code")
      )
    ).toBe(1);

    copyButton!.dispatch("click");
    await Promise.resolve();
    expect(browser.clipboardWrites).toEqual(["const answer = 42;"]);
    expect(copyButton!.innerText).toBe("Copied");

    browser.advanceTime(699);
    expect(copyButton!.innerText).toBe("Copied");
    browser.advanceTime(1);
    expect(copyButton!.innerText).toBe("Copy");

    copyButton!.dispatch("click");
    await Promise.resolve();
    expect(browser.clipboardWrites).toEqual([
      "const answer = 42;",
      "const answer = 42;",
    ]);
    expect(copyButton!.innerText).toBe("Copied");

    cleanup();
    browser.advanceTime(700);
    expect(copyButton!.innerText).toBe("Copied");
  });

  it("focuses and labels the code scrollport while restoring attributes on re-init and cleanup", () => {
    const fakeDocument = new FakeDocument();
    const article = appendPostArticle(fakeDocument);
    const namedPre = appendCodeBlock(article, fakeDocument);
    const namedCode = namedPre.querySelector("code")!;
    const title = fakeDocument.createElement("span");
    title.className = "code-frame-title";
    title.innerText = "src/content.config.ts";
    namedPre.insertBefore(title, namedCode);
    namedPre.setAttribute("tabindex", "0");
    const unnamedPre = appendCodeBlock(article, fakeDocument);
    const unnamedCode = unnamedPre.querySelector("code")!;
    unnamedPre.setAttribute("tabindex", "0");
    installBrowserGlobals(fakeDocument);

    initPostInteractions();
    expect(namedPre.getAttribute("tabindex")).toBeNull();
    expect(namedCode.getAttribute("tabindex")).toBe("0");
    expect(namedCode.getAttribute("aria-labelledby")).toBe(
      title.getAttribute("id")
    );
    expect(namedCode.getAttribute("aria-label")).toBeNull();
    expect(unnamedPre.getAttribute("tabindex")).toBeNull();
    expect(unnamedCode.getAttribute("tabindex")).toBe("0");
    expect(unnamedCode.getAttribute("aria-label")).toBe("Code block");
    expect(unnamedCode.getAttribute("aria-labelledby")).toBeNull();

    const cleanup = initPostInteractions();
    expect(namedPre.getAttribute("tabindex")).toBeNull();
    expect(namedCode.getAttribute("aria-labelledby")).toBe(
      title.getAttribute("id")
    );
    expect(
      fakeDocument.count(element =>
        element.className.split(" ").includes("copy-code")
      )
    ).toBe(2);

    cleanup();
    expect(namedPre.getAttribute("tabindex")).toBe("0");
    expect(namedCode.getAttribute("tabindex")).toBeNull();
    expect(namedCode.getAttribute("aria-labelledby")).toBeNull();
    expect(title.getAttribute("id")).toBeNull();
    expect(unnamedPre.getAttribute("tabindex")).toBe("0");
    expect(unnamedCode.getAttribute("tabindex")).toBeNull();
    expect(unnamedCode.getAttribute("aria-label")).toBeNull();
  });

  it("does not update copy UI when cleanup wins a pending clipboard write", async () => {
    const fakeDocument = new FakeDocument();
    const article = appendPostArticle(fakeDocument);
    const codeBlock = appendCodeBlock(article, fakeDocument);
    const browser = installBrowserGlobals(fakeDocument);
    browser.deferClipboardWrite();

    const cleanup = initPostInteractions();
    const copyButton = codeBlock.querySelector(".copy-code");
    copyButton!.dispatch("click");
    expect(browser.clipboardWrites).toEqual(["const answer = 42;"]);

    cleanup();
    await browser.finishClipboardWrite();
    expect(copyButton!.innerText).toBe("Copy");
    browser.advanceTime(700);
    expect(copyButton!.innerText).toBe("Copy");
  });
});
