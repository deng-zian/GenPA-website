/* Inline explanations and benchmark tabs share one restrained interaction pattern. */
(() => {
  const root = document.querySelector("#results");
  if (!root) return;
  const helps = [];
  root.querySelectorAll(".result-help").forEach((help) => {
    const term = help.querySelector(".result-term"),
      tip = help.querySelector(".result-tooltip");
    let pinned = false,
      hovered = false,
      closeTimer;
    function close() {
      clearTimeout(closeTimer);
      pinned = false;
      tip.hidden = true;
      term.setAttribute("aria-expanded", "false");
      term.removeAttribute("aria-describedby");
    }
    function open() {
      clearTimeout(closeTimer);
      helps.forEach((item) => {
        if (item.root !== help) item.close();
      });
      tip.hidden = false;
      term.setAttribute("aria-expanded", "true");
      if (tip.getAttribute("role") === "tooltip") term.setAttribute("aria-describedby", tip.id);
      tip.style.setProperty("--tip-shift", "0px");
      tip.classList.remove("is-above");
      const box = tip.getBoundingClientRect(),
        anchor = term.getBoundingClientRect();
      const shift = Math.max(20 - box.left, Math.min(0, innerWidth - 20 - box.right));
      tip.style.setProperty("--tip-shift", `${shift}px`);
      if (box.bottom > innerHeight - 16 && anchor.top > box.height + 26)
        tip.classList.add("is-above");
    }
    function scheduleClose() {
      clearTimeout(closeTimer);
      closeTimer = setTimeout(() => {
        if (!pinned && !hovered && !help.contains(document.activeElement)) close();
      }, 200);
    }
    help.addEventListener("pointerenter", (event) => {
      if (event.pointerType === "mouse") {
        hovered = true;
        open();
      }
    });
    help.addEventListener("pointerleave", (event) => {
      if (event.pointerType === "mouse") {
        hovered = false;
        scheduleClose();
      }
    });
    term.addEventListener("focus", open);
    help.addEventListener("focusout", (event) => {
      if (!help.contains(event.relatedTarget)) scheduleClose();
    });
    term.addEventListener("click", () => {
      if (pinned) close();
      else {
        pinned = true;
        open();
      }
    });
    tip.querySelectorAll("a").forEach((link) => link.addEventListener("click", close));
    helps.push({ root: help, close });
  });
  function closeAllHelp() {
    helps.forEach((item) => item.close());
  }
  document.addEventListener("pointerdown", (event) =>
    helps.forEach((item) => {
      if (!item.root.contains(event.target)) item.close();
    }),
  );
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeAllHelp();
  });
  root.addEventListener("result-help-reset", closeAllHelp);
  window.addEventListener("resize", closeAllHelp, { passive: true });

  const benchmark = root.querySelector("#benchmark-results");
  const tabs = [...benchmark.querySelectorAll("[data-benchmark]")];
  const panels = [...benchmark.querySelectorAll(".benchmark-panel")];
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  let animation;
  function select(id, { focus = false, animate = true } = {}) {
    const tab = tabs.find((item) => item.dataset.benchmark === id);
    if (!tab) return;
    closeAllHelp();
    const changed = tab.getAttribute("aria-selected") !== "true";
    animation?.cancel();
    tabs.forEach((item) => {
      const active = item === tab;
      item.setAttribute("aria-selected", String(active));
      item.tabIndex = active ? 0 : -1;
    });
    panels.forEach((panel) => {
      panel.hidden = panel.id !== tab.getAttribute("aria-controls");
    });
    if (focus) tab.focus({ preventScroll: true });
    const panel = document.getElementById(tab.getAttribute("aria-controls"));
    if (changed && animate && !reduce.matches && typeof panel.animate === "function")
      animation = panel.animate([{ opacity: 0.25 }, { opacity: 1 }], {
        duration: 180,
        easing: "ease-out",
      });
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => select(tab.dataset.benchmark));
    tab.addEventListener("keydown", (event) => {
      let target;
      if (event.key === "ArrowRight") target = (index + 1) % tabs.length;
      if (event.key === "ArrowLeft") target = (index - 1 + tabs.length) % tabs.length;
      if (event.key === "Home") target = 0;
      if (event.key === "End") target = tabs.length - 1;
      if (target !== undefined) {
        event.preventDefault();
        select(tabs[target].dataset.benchmark, { focus: true });
      }
    });
  });
  root
    .querySelectorAll("[data-benchmark-link]")
    .forEach((link) =>
      link.addEventListener("click", () => select(link.dataset.benchmarkLink, { animate: false })),
    );
  root.querySelectorAll("[data-latency-link]").forEach((link) =>
    link.addEventListener("click", () => {
      root.querySelector(`[data-gul-mode="${link.dataset.latencyLink}"]`)?.click();
      root.querySelector('[data-gul-model="genpa"]')?.click();
    }),
  );
  reduce.addEventListener("change", () => animation?.cancel());
})();
