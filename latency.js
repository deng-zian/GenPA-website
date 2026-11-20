/* Unified latency: totals stay independent from separately profiled components. */
(() => {
  const root = document.querySelector(".gul");
  if (!root) return;
  const totals = JSON.parse(root.querySelector("#gul-total-data").textContent);
  const profiles = JSON.parse(root.querySelector("#gul-profile-data").textContent);
  const modelById = new Map(totals.series.map((x) => [x.id, x]));
  const profileById = new Map(profiles.series.map((x) => [x.id, x]));
  const rows = new Map(
    [...root.querySelectorAll("[data-gul-row]")].map((x) => [x.dataset.gulRow, x]),
  );
  const labels = { ...profiles.component_labels, total_only: "Independent total" };
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  const animations = new Map();
  const tooltip = root.querySelector("#gul-tooltip");
  let mode = "uncompiled",
    selected = "genpa",
    tooltipTarget = null,
    tooltipPinned = false;
  const boundary = {
    genpa: "Action covers the complete regression adapter within a full policy call.",
    "genpa-flow":
      "Action includes flow context/cache preparation and all eight decode and Euler steps.",
    oft: "Vision includes the encoder and projector. Action includes the proprioception projector and regression head.",
    fastwam:
      "Backbone covers video preparation and prefill. Action includes the ten-step action loop.",
    imagewam: "Backbone is FLUX Prefix-Only prefill. Action includes the ten-step action loop.",
  };
  function cancelAnimations() {
    animations.forEach((animation, row) => {
      animation.cancel();
      row.classList.remove("is-ranking-moving");
    });
    animations.clear();
  }
  function reorder(ordered, animate) {
    const container = root.querySelector(".gul-rows");
    const before = new Map(
      ordered.map((model) => [model.id, rows.get(model.id).getBoundingClientRect().top]),
    );
    const focused = document.activeElement;
    cancelAnimations();
    ordered.forEach((model, index) => {
      const row = rows.get(model.id);
      if (container.children[index] !== row)
        container.insertBefore(row, container.children[index] || null);
    });
    if (focused && container.contains(focused) && document.activeElement !== focused)
      focused.focus({ preventScroll: true });
    if (!animate || reduce.matches) return;
    ordered.forEach((model) => {
      const row = rows.get(model.id),
        distance = before.get(model.id) - row.getBoundingClientRect().top;
      if (Math.abs(distance) < 0.5 || typeof row.animate !== "function") return;
      row.classList.add("is-ranking-moving");
      const animation = row.animate(
        [{ transform: `translateY(${distance}px)` }, { transform: "translateY(0)" }],
        { duration: 520, easing: "cubic-bezier(.22,1,.36,1)", fill: "both" },
      );
      animations.set(row, animation);
      const finish = () => {
        if (animations.get(row) !== animation) return;
        animations.delete(row);
        row.classList.remove("is-ranking-moving");
        animation.cancel();
      };
      animation.finished.then(finish, finish);
    });
  }
  function hideTooltip() {
    if (tooltipTarget) tooltipTarget.removeAttribute("aria-describedby");
    tooltipTarget = null;
    tooltipPinned = false;
    tooltip.hidden = true;
  }
  function findValue(node) {
    return node instanceof Element ? node.closest("[data-gul-component][data-gul-series]") : null;
  }
  function getValue(id, key) {
    return key === "total_only"
      ? modelById.get(id)?.[mode].mean_ms
      : profileById.get(id)?.[mode].components_ms[key];
  }
  function placeTooltip(target, pointer) {
    const box = target.getBoundingClientRect(),
      tip = tooltip.getBoundingClientRect();
    const x = pointer ? pointer.clientX : box.left + box.width / 2,
      y = pointer ? pointer.clientY : box.top;
    let top = y - tip.height - 12;
    if (top < 10) top = (pointer ? pointer.clientY : box.bottom) + 14;
    tooltip.style.left = `${Math.max(10, Math.min(x - tip.width / 2, innerWidth - tip.width - 10))}px`;
    tooltip.style.top = `${Math.max(10, Math.min(top, innerHeight - tip.height - 10))}px`;
  }
  function showTooltip(target, pointer = null, pinned = false) {
    const id = target.dataset.gulSeries,
      key = target.dataset.gulComponent,
      value = getValue(id, key),
      model = modelById.get(id);
    if (!model || typeof value !== "number") {
      hideTooltip();
      return;
    }
    if (tooltipTarget && tooltipTarget !== target)
      tooltipTarget.removeAttribute("aria-describedby");
    tooltipTarget = target;
    tooltipPinned = pinned;
    tooltip.replaceChildren();
    const name = document.createElement("strong"),
      context = document.createElement("span"),
      line = document.createElement("span"),
      number = document.createElement("b");
    name.textContent = model.label;
    context.textContent = `${mode === "compiled" ? "Compiled" : "Uncompiled"} · ${key === "total_only" ? "total only" : "component profile"}`;
    line.textContent = labels[key] + ": ";
    number.textContent = value.toFixed(2) + " ms";
    line.append(number);
    tooltip.append(name, context, line);
    tooltip.hidden = false;
    target.setAttribute("aria-describedby", "gul-tooltip");
    placeTooltip(target, pointer);
  }
  function updateInspector() {
    rows.forEach((row, id) => {
      row.dataset.selected = String(id === selected);
      row.querySelector("[data-gul-model]").setAttribute("aria-pressed", String(id === selected));
    });
    const model = modelById.get(selected),
      profile = profileById.get(selected),
      measurement = model[mode];
    root.dispatchEvent(new CustomEvent("result-help-reset", { bubbles: true }));
    const name = root.querySelector("[data-gul-inspector-name]"),
      flowHelp = root.querySelector("[data-gul-flow-help]");
    name.textContent = model.label;
    name.hidden = selected === "genpa-flow";
    flowHelp.hidden = selected !== "genpa-flow";
    root.querySelector("[data-gul-inspector-meta]").textContent = profile
      ? `${profile.horizon}-action chunk · ${profile.across_call_cache === "None" ? "no language cache" : "text features cached"}`
      : "Component profile unavailable";
    root.querySelector("[data-gul-summary]").textContent =
      `${measurement.mean_ms.toFixed(2)} ± ${measurement.sd_ms.toFixed(2)} ms`;
    const values = root.querySelector(".gul-values");
    values.replaceChildren();
    values.hidden = !profile;
    if (profile) {
      Object.entries(profile[mode].components_ms).forEach(([key, value]) => {
        const group = document.createElement("div"),
          term = document.createElement("dt"),
          swatch = document.createElement("i"),
          definition = document.createElement("dd"),
          button = document.createElement("button"),
          unit = document.createElement("small");
        swatch.className = "gul-" + key;
        term.append(swatch, labels[key]);
        button.type = "button";
        button.className = "gul-value-button";
        button.dataset.gulComponent = key;
        button.dataset.gulSeries = selected;
        button.setAttribute(
          "aria-label",
          `${model.label}, ${mode}, ${labels[key]}, ${value.toFixed(2)} milliseconds`,
        );
        button.append(value.toFixed(2) + " ");
        unit.textContent = "ms";
        button.append(unit);
        definition.append(button);
        group.append(term, definition);
        values.append(group);
      });
    }
    root.querySelector("[data-gul-boundary]").textContent = !profile
      ? "Only complete-call latency was measured for this variant; no component allocation is inferred."
      : selected === "pi05"
        ? mode === "compiled"
          ? "Vision + Backbone is one jointly profiled interval (14.09 ms). Action includes the expert steps and Euler updates."
          : "Action includes ten expert calls. Euler updates and loop control are included in Other."
        : boundary[selected];
  }
  function updateChart(animate = true) {
    hideTooltip();
    const maximum = 340;
    root
      .querySelectorAll("[data-gul-mode]")
      .forEach((button) =>
        button.setAttribute("aria-pressed", String(button.dataset.gulMode === mode)),
      );
    root.querySelector("[data-gul-joint-legend]").hidden = mode !== "compiled";
    totals.series.forEach((model) => {
      const row = rows.get(model.id),
        stack = row.querySelector(".gul-stack"),
        profile = profileById.get(model.id);
      const components = profile
        ? profile[mode].components_ms
        : { total_only: model[mode].mean_ms };
      [...stack.children].forEach((segment) => {
        if (!(segment.dataset.gulComponent in components)) segment.remove();
      });
      Object.entries(components).forEach(([key, value], index) => {
        const segment =
          stack.querySelector(`[data-gul-component="${key}"]`) || document.createElement("button");
        segment.type = "button";
        segment.className = "gul-segment gul-" + key;
        segment.dataset.gulSeries = model.id;
        segment.dataset.gulComponent = key;
        segment.style.width = `${(value / maximum) * 100}%`;
        segment.setAttribute(
          "aria-label",
          `${model.label}, ${mode}, ${labels[key]}, ${value.toFixed(2)} milliseconds`,
        );
        if (stack.children[index] !== segment)
          stack.insertBefore(segment, stack.children[index] || null);
      });
      row.querySelector(".gul-total-marker").style.left =
        `${(model[mode].mean_ms / maximum) * 100}%`;
      row.querySelector(".gul-total-value").textContent = model[mode].mean_ms.toFixed(2);
    });
    const ordered = [...totals.series].sort((a, b) => a[mode].mean_ms - b[mode].mean_ms);
    reorder(ordered, animate);
    root.querySelector("[data-gul-status]").textContent =
      `${mode === "compiled" ? "Compiled" : "Uncompiled"} inference. Rows sorted by total latency. GenPA is fastest in this comparison at ${modelById.get("genpa")[mode].mean_ms.toFixed(2)} milliseconds.`;
    updateInspector();
  }
  root.querySelectorAll("[data-gul-mode]").forEach((button) =>
    button.addEventListener("click", () => {
      if (button.dataset.gulMode === mode) return;
      mode = button.dataset.gulMode;
      updateChart();
    }),
  );
  root.querySelectorAll("[data-gul-model]").forEach((button) =>
    button.addEventListener("click", () => {
      hideTooltip();
      selected = button.dataset.gulModel;
      updateInspector();
    }),
  );
  root.addEventListener("pointerover", (event) => {
    const target = findValue(event.target);
    if (target && event.pointerType !== "touch" && !target.contains(event.relatedTarget))
      showTooltip(target, event);
  });
  root.addEventListener("pointermove", (event) => {
    const target = findValue(event.target);
    if (target === tooltipTarget && target && !tooltipPinned && event.pointerType !== "touch")
      placeTooltip(target, event);
  });
  root.addEventListener("pointerout", (event) => {
    const target = findValue(event.target);
    if (
      target &&
      !target.contains(event.relatedTarget) &&
      !tooltipPinned &&
      document.activeElement !== target
    )
      hideTooltip();
  });
  root.addEventListener("focusin", (event) => {
    const target = findValue(event.target);
    if (target) showTooltip(target);
  });
  root.addEventListener("focusout", (event) => {
    const target = findValue(event.target);
    if (target && !target.contains(event.relatedTarget)) hideTooltip();
  });
  root.addEventListener("click", (event) => {
    const target = findValue(event.target);
    if (!target) return;
    if (selected !== target.dataset.gulSeries) {
      selected = target.dataset.gulSeries;
      updateInspector();
    }
    showTooltip(target, null, true);
  });
  document.addEventListener("click", (event) => {
    if (!findValue(event.target)) hideTooltip();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") hideTooltip();
  });
  window.addEventListener("scroll", hideTooltip, { passive: true });
  window.addEventListener(
    "resize",
    () => {
      hideTooltip();
      cancelAnimations();
    },
    { passive: true },
  );
  reduce.addEventListener("change", cancelAnimations);
  updateChart(false);
})();
