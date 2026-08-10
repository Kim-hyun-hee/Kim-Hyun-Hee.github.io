type SetupOptions = {
  signal: AbortSignal;
};

type CopySetupOptions = SetupOptions & {
  timers: Set<number>;
};

let cleanupCurrent: (() => void) | undefined;

function setupProgress({ signal }: SetupOptions) {
  document.querySelector<HTMLElement>(".progress-container")?.remove();

  const progressContainer = document.createElement("div");
  progressContainer.className =
    "progress-container fixed top-0 z-30 h-1 w-full bg-background";

  const progressBar = document.createElement("div");
  progressBar.className = "progress-bar h-1 w-0 bg-accent";
  progressBar.id = "myBar";

  progressContainer.appendChild(progressBar);
  document.body.appendChild(progressContainer);

  document.addEventListener(
    "scroll",
    () => {
      const winScroll =
        document.body.scrollTop || document.documentElement.scrollTop;
      const height =
        document.documentElement.scrollHeight -
        document.documentElement.clientHeight;
      const scrolled = (winScroll / height) * 100;
      const bar = document.getElementById("myBar");
      if (bar) bar.style.width = scrolled + "%";
    },
    { signal }
  );
}

function setupCodeCopy({ signal, timers }: CopySetupOptions) {
  const copyButtonLabel = "Copy";
  const codeBlocks = Array.from(document.querySelectorAll("pre"));

  for (const codeBlock of codeBlocks) {
    let copyButton = codeBlock.querySelector<HTMLButtonElement>(".copy-code");

    if (!copyButton) {
      const wrapper = document.createElement("div");
      wrapper.style.position = "relative";

      const computedStyle = getComputedStyle(codeBlock);
      const hasFileNameOffset =
        computedStyle.getPropertyValue("--file-name-offset").trim() !== "";
      const topClass = hasFileNameOffset
        ? "top-(--file-name-offset)"
        : "-top-3";

      copyButton = document.createElement("button");
      copyButton.className = `copy-code absolute end-3 ${topClass} rounded bg-muted border border-muted px-2 py-1 text-xs leading-4 text-foreground font-medium`;
      copyButton.innerHTML = copyButtonLabel;
      codeBlock.setAttribute("tabindex", "0");
      codeBlock.appendChild(copyButton);

      codeBlock.parentNode?.insertBefore(wrapper, codeBlock);
      wrapper.appendChild(codeBlock);
    } else {
      copyButton.innerText = copyButtonLabel;
    }

    copyButton.addEventListener(
      "click",
      async () => {
        const text = codeBlock.querySelector("code")?.innerText;
        await navigator.clipboard.writeText(text ?? "");
        if (signal.aborted) return;

        copyButton.innerText = "Copied";
        const timer = window.setTimeout(() => {
          timers.delete(timer);
          copyButton.innerText = copyButtonLabel;
        }, 700);
        timers.add(timer);
      },
      { signal }
    );
  }
}

function setupLightbox({ signal, timers }: CopySetupOptions) {
  const article = document.getElementById("article");
  if (!article) return () => {};

  const prefersReducedMotion = () =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mountedOverlays = new Set<HTMLDivElement>();
  let overlay: HTMLDivElement | null = null;
  let lastFocused: HTMLElement | null = null;
  let bodyOverflowBeforeOpen = "";
  let closeLightbox = (_immediately = false) => {};
  let keydownHandler: (event: KeyboardEvent) => void = () => {};

  requestAnimationFrame(() => {
    if (signal.aborted) return;

    const images = Array.from(article.querySelectorAll("img"));
    for (const image of images) {
      if (image.closest("a")) continue;
      image.setAttribute("role", "button");
      image.setAttribute("tabindex", "0");
      image.setAttribute("aria-haspopup", "dialog");
      image.setAttribute(
        "aria-label",
        image.alt ? `Zoom image: ${image.alt}` : "Zoom image"
      );
    }
  });

  function open(src: string, alt: string, trigger: HTMLElement) {
    if (overlay) return;
    lastFocused = trigger;

    overlay = document.createElement("div");
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute(
      "aria-label",
      alt ? `Image preview: ${alt}` : "Image preview"
    );
    overlay.className =
      "fixed inset-0 z-50 flex cursor-zoom-out items-center justify-center bg-black/70 backdrop-blur-sm opacity-0 transition-opacity duration-200 motion-reduce:transition-none";

    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.setAttribute("aria-label", "Close image preview");
    closeButton.className =
      "absolute end-4 top-4 rounded p-2 text-3xl leading-none text-white";
    closeButton.innerHTML = "&#10005;";
    closeButton.addEventListener("click", () => close(), { signal });

    const image = document.createElement("img");
    image.src = src;
    image.alt = "";
    image.className =
      "max-h-[90dvh] max-w-[90dvw] cursor-default object-contain";

    overlay.append(closeButton, image);

    let currentScale = 1;
    let translateX = 0;
    let translateY = 0;
    let initialDist = 0;
    let initialScale = 1;
    let panStartX = 0;
    let panStartY = 0;
    let panStartTranslateX = 0;
    let panStartTranslateY = 0;
    let lastTapTime = 0;

    function applyTransform() {
      image.style.transform = `scale(${currentScale}) translate(${translateX}px, ${translateY}px)`;
    }

    function resetTransform() {
      currentScale = 1;
      translateX = 0;
      translateY = 0;
      image.style.transform = "";
    }

    overlay.addEventListener(
      "click",
      event => {
        if (event.target === overlay && currentScale <= 1) close();
      },
      { signal }
    );

    overlay.addEventListener(
      "touchstart",
      event => {
        const touches = event.touches;
        if (touches.length === 2) {
          initialDist = Math.hypot(
            touches[1].clientX - touches[0].clientX,
            touches[1].clientY - touches[0].clientY
          );
          initialScale = currentScale;
        } else if (touches.length === 1) {
          const now = Date.now();
          if (now - lastTapTime < 300) {
            event.preventDefault();
            if (currentScale > 1) {
              resetTransform();
            } else {
              currentScale = 2;
              translateX = 0;
              translateY = 0;
              applyTransform();
            }
            lastTapTime = 0;
            panStartX = touches[0].clientX;
            panStartY = touches[0].clientY;
            panStartTranslateX = translateX;
            panStartTranslateY = translateY;
          } else {
            lastTapTime = now;
            if (currentScale > 1) {
              panStartX = touches[0].clientX;
              panStartY = touches[0].clientY;
              panStartTranslateX = translateX;
              panStartTranslateY = translateY;
            }
          }
        }
      },
      { signal, passive: false }
    );

    overlay.addEventListener(
      "touchmove",
      event => {
        const touches = event.touches;
        if (touches.length === 2) {
          event.preventDefault();
          const dist = Math.hypot(
            touches[1].clientX - touches[0].clientX,
            touches[1].clientY - touches[0].clientY
          );
          currentScale = Math.min(
            4,
            Math.max(1, initialScale * (dist / initialDist))
          );
          applyTransform();
        } else if (touches.length === 1) {
          if (currentScale > 1) {
            event.preventDefault();
            translateX =
              panStartTranslateX +
              (touches[0].clientX - panStartX) / currentScale;
            translateY =
              panStartTranslateY +
              (touches[0].clientY - panStartY) / currentScale;
            const maxX = Math.max(
              0,
              (image.clientWidth - overlay!.clientWidth / currentScale) / 2
            );
            const maxY = Math.max(
              0,
              (image.clientHeight - overlay!.clientHeight / currentScale) / 2
            );
            translateX = Math.min(maxX, Math.max(-maxX, translateX));
            translateY = Math.min(maxY, Math.max(-maxY, translateY));
            applyTransform();
          } else {
            event.preventDefault();
          }
        }
      },
      { signal, passive: false }
    );

    const resetAfterTouch = (event: TouchEvent) => {
      if (event.touches.length === 0 && currentScale <= 1.05) {
        resetTransform();
      }
    };
    overlay.addEventListener("touchend", resetAfterTouch, { signal });
    overlay.addEventListener("touchcancel", resetAfterTouch, { signal });

    mountedOverlays.add(overlay);
    document.body.appendChild(overlay);
    bodyOverflowBeforeOpen = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeLightbox = close;
    keydownHandler = onKeyDown;
    document.addEventListener("keydown", keydownHandler, { signal });

    requestAnimationFrame(() => overlay?.classList.add("opacity-100"));
    closeButton.focus();

    function close(immediately = false) {
      if (!overlay) return;
      const element = overlay;
      overlay = null;

      document.removeEventListener("keydown", keydownHandler);
      document.body.style.overflow = bodyOverflowBeforeOpen;
      lastFocused?.focus();
      lastFocused = null;

      let removalTimer: number | undefined;
      const remove = () => {
        element.remove();
        mountedOverlays.delete(element);
        if (removalTimer !== undefined) {
          window.clearTimeout(removalTimer);
          timers.delete(removalTimer);
        }
      };

      if (immediately || prefersReducedMotion()) {
        remove();
        return;
      }

      element.addEventListener("transitionend", remove, {
        once: true,
        signal,
      });
      removalTimer = window.setTimeout(remove, 250);
      timers.add(removalTimer);
      element.classList.remove("opacity-100");
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        close();
      } else if (event.key === "Tab") {
        trapFocus(event);
      }
    }

    function trapFocus(event: KeyboardEvent) {
      if (!overlay) return;
      const focusables = overlay.querySelectorAll<HTMLElement>(
        'a[href], button, [tabindex]:not([tabindex="-1"])'
      );
      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  }

  function triggerFromEvent(event: Event) {
    if (!(event.target instanceof Element)) return null;
    const image = event.target.closest("img");
    if (
      !(image instanceof HTMLImageElement) ||
      !article?.contains(image) ||
      image.closest("a")
    ) {
      return null;
    }
    return image;
  }

  function activate(image: HTMLImageElement) {
    open(image.currentSrc || image.src, image.alt, image);
  }

  article.addEventListener(
    "click",
    event => {
      const image = triggerFromEvent(event);
      if (!image) return;
      event.preventDefault();
      activate(image);
    },
    { signal }
  );

  article.addEventListener(
    "keydown",
    event => {
      if (
        event.key !== "Enter" &&
        event.key !== " " &&
        event.key !== "Spacebar"
      ) {
        return;
      }
      const image = triggerFromEvent(event);
      if (!image) return;
      event.preventDefault();
      activate(image);
    },
    { signal }
  );

  return () => {
    closeLightbox(true);
    mountedOverlays.forEach(element => element.remove());
    mountedOverlays.clear();
  };
}

export function initPostInteractions(): () => void {
  cleanupCurrent?.();

  const controller = new AbortController();
  const { signal } = controller;
  const timers = new Set<number>();

  setupProgress({ signal });
  setupCodeCopy({ signal, timers });
  const closeLightboxImmediately = setupLightbox({ signal, timers });

  const cleanup = () => {
    controller.abort();
    timers.forEach(window.clearTimeout);
    timers.clear();
    closeLightboxImmediately();
  };
  cleanupCurrent = cleanup;
  return cleanup;
}
