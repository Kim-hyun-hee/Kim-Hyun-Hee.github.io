const EASING = "cubic-bezier(0.2, 0, 0, 1)";

let cleanupCurrent: (() => void) | undefined;

const resetContentStyle = (content: HTMLElement) => {
  content.style.height = "";
  content.style.opacity = "";
  content.style.overflow = "";
};

export function initSeriesAccordions(): () => void {
  cleanupCurrent?.();

  const accordions = Array.from(
    document.querySelectorAll<HTMLDetailsElement>(
      "details[data-series-accordion]"
    )
  );
  if (accordions.length === 0) {
    cleanupCurrent = undefined;
    return () => {};
  }

  const controller = new AbortController();
  const animations = new Set<Animation>();
  const settle = new Set<() => void>();

  for (const details of accordions) {
    const summary = details.querySelector("summary");
    const content = details.querySelector<HTMLElement>("[data-series-content]");
    if (!summary || !content) continue;

    let expanded = details.open;
    let activeAnimation: Animation | undefined;
    settle.add(() => {
      details.open = expanded;
      resetContentStyle(content);
    });

    summary.addEventListener(
      "click",
      event => {
        event.preventDefault();

        const opening = !expanded;
        expanded = opening;
        const startHeight = details.open
          ? content.getBoundingClientRect().height
          : 0;
        const startOpacity = details.open
          ? Number.parseFloat(getComputedStyle(content).opacity) || 0
          : 0;

        activeAnimation?.cancel();
        if (activeAnimation) animations.delete(activeAnimation);
        activeAnimation = undefined;

        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          details.open = opening;
          resetContentStyle(content);
          return;
        }

        if (opening) details.open = true;

        content.style.height = `${startHeight}px`;
        content.style.opacity = String(startOpacity);
        content.style.overflow = "hidden";

        const animation = content.animate(
          [
            { height: `${startHeight}px`, opacity: startOpacity },
            {
              height: `${opening ? content.scrollHeight : 0}px`,
              opacity: opening ? 1 : 0,
            },
          ],
          {
            duration: opening ? 240 : 210,
            easing: EASING,
            fill: "both",
          }
        );
        activeAnimation = animation;
        animations.add(animation);

        animation.onfinish = () => {
          if (activeAnimation !== animation) return;
          activeAnimation = undefined;
          animations.delete(animation);
          details.open = expanded;
          resetContentStyle(content);
        };
      },
      { signal: controller.signal }
    );
  }

  let cleaned = false;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    controller.abort();
    animations.forEach(animation => animation.cancel());
    animations.clear();
    settle.forEach(settleAccordion => settleAccordion());
    settle.clear();
    if (cleanupCurrent === cleanup) cleanupCurrent = undefined;
  };

  cleanupCurrent = cleanup;
  return cleanup;
}
