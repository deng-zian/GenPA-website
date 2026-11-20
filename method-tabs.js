// Two views of one method, with a quiet transition and preserved gallery state.
(() => {
  const root = document.querySelector(".method-explorer");
  if (!root) return;
  const tablist = root.querySelector('[role="tablist"]');
  const tabs = [...root.querySelectorAll("[data-method-view]")];
  const panels = [...root.querySelectorAll("[data-method-panel]")];
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  let revision = 0;
  let motion = null;
  let requestedView = "architecture";

  function show(view, source) {
    tabs.forEach((tab) => {
      const selected = tab.dataset.methodView === view;
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });
    panels.forEach((panel) => {
      const active = panel.dataset.methodPanel === view;
      panel.classList.toggle("is-active", active);
      panel.setAttribute("aria-hidden", String(!active));
      panel.inert = !active;
      panel.tabIndex = active ? 0 : -1;
    });
    root.dispatchEvent(new CustomEvent("methodviewchange", { detail: { view, source } }));
  }
  async function select(view, source = "programmatic") {
    const next = panels.find((panel) => panel.dataset.methodPanel === view);
    if (!next) return;
    const current = panels.find((panel) => panel.classList.contains("is-active"));
    const initial = current && {
      opacity: getComputedStyle(current).opacity,
      transform: getComputedStyle(current).transform,
    };
    const ticket = ++revision;
    requestedView = view;
    if (motion) motion.cancel();
    motion = null;
    root.dataset.transition = "idle";
    if (
      !current ||
      current === next ||
      source === "programmatic" ||
      reducedMotion.matches ||
      !current.animate
    ) {
      show(view, source);
      return;
    }
    const direction = panels.indexOf(next) > panels.indexOf(current) ? 1 : -1;
    current.inert = true;
    current.setAttribute("aria-hidden", "true");
    root.dataset.transition = "leaving";
    const leaving = current.animate(
      [initial, { opacity: 0, transform: `translateX(${-direction * 8}px)` }],
      { duration: 110, easing: "ease-out", fill: "both" },
    );
    motion = leaving;
    try {
      await leaving.finished;
    } catch (_) {
      return;
    }
    if (ticket !== revision) return;
    show(view, source);
    leaving.cancel();
    if (reducedMotion.matches) {
      motion = null;
      root.dataset.transition = "idle";
      return;
    }
    root.dataset.transition = "entering";
    const entering = next.animate(
      [
        { opacity: 0, transform: `translateX(${direction * 10}px)` },
        { opacity: 1, transform: "translateX(0)" },
      ],
      { duration: 200, easing: "cubic-bezier(.22,.61,.36,1)", fill: "both" },
    );
    motion = entering;
    try {
      await entering.finished;
    } catch (_) {
      return;
    }
    if (ticket !== revision) return;
    entering.cancel();
    motion = null;
    root.dataset.transition = "idle";
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => select(tab.dataset.methodView, "click"));
    tab.addEventListener("keydown", (event) => {
      let next;
      if (event.key === "ArrowRight" || event.key === "ArrowLeft") next = 1 - index;
      if (event.key === "Home") next = 0;
      if (event.key === "End") next = tabs.length - 1;
      if (next === undefined) return;
      event.preventDefault();
      select(tabs[next].dataset.methodView, "keyboard");
      tabs[next].focus({ preventScroll: true });
    });
  });
  function selectHashTarget() {
    const id = location.hash.slice(1);
    const target = id && document.getElementById(id);
    const panel = target && target.closest("[data-method-panel]");
    if (!panel) return;
    select(panel.dataset.methodPanel);
    requestAnimationFrame(() => target.scrollIntoView({ block: "start" }));
  }
  reducedMotion.addEventListener("change", () => {
    if (reducedMotion.matches) select(requestedView);
  });
  select("architecture");
  root.classList.add("is-enhanced");
  tablist.hidden = false;
  selectHashTarget();
  window.addEventListener("hashchange", selectHashTarget);
})();

// Briefly draw attention to the alternate view once, without changing the selection.
(() => {
  const tab = document.getElementById("method-supervision-tab");
  const tablist = tab?.closest('[role="tablist"]');
  if (!tablist || !("IntersectionObserver" in window)) return;
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  if (reducedMotion.matches) return;
  let seen = false,
    inView = false,
    timer;
  const observer = new IntersectionObserver(
    (entries) => {
      inView = entries.some((entry) => entry.isIntersecting && entry.intersectionRatio === 1);
      schedule();
    },
    { threshold: 1, rootMargin: "-72px 0px -15% 0px" },
  );
  function stopWatching() {
    clearTimeout(timer);
    observer.disconnect();
    window.removeEventListener("scroll", schedule);
    document.removeEventListener("visibilitychange", schedule);
  }
  function dismiss() {
    seen = true;
    stopWatching();
    tab.classList.remove("method-tab-hint");
  }
  function schedule() {
    clearTimeout(timer);
    if (seen || !inView || document.hidden) return;
    // Let scrolling settle so the reader sees the full cue instead of passing it.
    timer = setTimeout(() => {
      if (seen || !inView || document.hidden) return;
      seen = true;
      stopWatching();
      if (!reducedMotion.matches && tab.getAttribute("aria-selected") === "false") {
        tab.classList.add("method-tab-hint");
      }
    }, 600);
  }
  // Once a reader interacts with the tabs, the hint has served its purpose.
  tablist.addEventListener("pointerdown", dismiss, { once: true });
  tablist.addEventListener("keydown", dismiss, { once: true });
  tablist.addEventListener("focusin", dismiss, { once: true });
  tab.addEventListener("animationend", (event) => {
    if (event.animationName === "method-tab-attention") dismiss();
  });
  reducedMotion.addEventListener("change", () => {
    if (reducedMotion.matches) dismiss();
  });
  window.addEventListener("scroll", schedule, { passive: true });
  document.addEventListener("visibilitychange", schedule);
  observer.observe(tablist);
})();
