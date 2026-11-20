"use strict";
// Avoid overlapping audio or motion when visitors compare demonstrations.
const videos = Array.from(document.querySelectorAll("video"));
videos.forEach((video) =>
  video.addEventListener("play", () =>
    videos.forEach((other) => {
      if (other !== video) other.pause();
    }),
  ),
);

// Original Figure 1 edits and exact appendix prompts.
(() => {
  const prompts = JSON.parse(document.getElementById("motivation-prompts").textContent);
  const shorts = {
    goal: "Show the scene with the green spoon in the pink bowl and the white fork in the yellow-orange bowl.",
    path: "Sketch gripper paths: green spoon to pink bowl, then white fork to yellow-orange bowl.",
  };
  const buttons = [...document.querySelectorAll("[data-motivation-view]")];
  const frame = document.querySelector(".motivation-frame");
  const panels = [...frame.querySelectorAll("[data-motivation-panel]")];
  const ready = new Map();
  let request = 0;
  // Keep one opaque image beneath the overlay, so the crossfade never flashes white.
  frame.dataset.view = "goal";
  frame.classList.add("is-crossfading");
  panels.forEach((panel) => {
    panel.setAttribute("aria-hidden", String(panel.dataset.motivationPanel !== "goal"));
    panel.hidden = false;
  });
  function prepare(mode) {
    if (!ready.has(mode)) {
      const image = panels
        .find((panel) => panel.dataset.motivationPanel === mode)
        .querySelector("img");
      image.loading = "eager";
      ready.set(
        mode,
        image.decode().catch(() => {}),
      );
    }
    return ready.get(mode);
  }
  if ("IntersectionObserver" in window) {
    const warmup = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        prepare("goal");
        prepare("path");
        warmup.disconnect();
      },
      { rootMargin: "300px" },
    );
    warmup.observe(frame);
  }
  async function select(button) {
    const mode = button.dataset.motivationView;
    const version = ++request;
    await Promise.all([prepare("goal"), prepare(mode)]);
    if (version !== request) return;
    buttons.forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
    panels.forEach((panel) =>
      panel.setAttribute("aria-hidden", String(panel.dataset.motivationPanel !== mode)),
    );
    frame.dataset.view = mode;
    document.querySelector("[data-motivation-short]").textContent = shorts[mode];
    document.querySelector("[data-motivation-result-label]").textContent =
      mode === "goal" ? "Generated goal state" : "Generated motion sketch";
    document.querySelector("[data-motivation-full]").textContent = prompts[mode];
  }
  buttons.forEach((button, index) => {
    button.addEventListener("click", () => select(button));
    button.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      const next = buttons[event.key === "Home" ? 0 : event.key === "End" ? 1 : 1 - index];
      select(next);
      next.focus();
    });
  });
  // Keep interactive disclosures open across pointer travel and keyboard focus.
  const disclosures = [];
  document.querySelectorAll(".illustration-disclosure").forEach((root) => {
    const button = root.querySelector("button"),
      panel = root.querySelector(".illustration-popover");
    let pinned = false,
      hovered = false,
      closeTimer;
    function cancelClose() {
      clearTimeout(closeTimer);
    }
    function close() {
      cancelClose();
      pinned = false;
      panel.hidden = true;
      button.setAttribute("aria-expanded", "false");
    }
    function open() {
      cancelClose();
      disclosures.forEach((item) => {
        if (item.root !== root) item.close();
      });
      panel.hidden = false;
      button.setAttribute("aria-expanded", "true");
    }
    function scheduleClose() {
      cancelClose();
      closeTimer = setTimeout(() => {
        if (!pinned && !hovered && !root.contains(document.activeElement)) close();
      }, 240);
    }
    root.addEventListener("pointerenter", (event) => {
      if (event.pointerType === "mouse") {
        hovered = true;
        open();
      }
    });
    root.addEventListener("pointerleave", (event) => {
      if (event.pointerType === "mouse") {
        hovered = false;
        scheduleClose();
      }
    });
    root.addEventListener("focusin", open);
    root.addEventListener("focusout", (event) => {
      if (!root.contains(event.relatedTarget)) scheduleClose();
    });
    button.addEventListener("click", () => {
      if (pinned) close();
      else {
        pinned = true;
        open();
      }
    });
    root.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        button.focus();
        close();
      }
    });
    document.addEventListener("pointerdown", (event) => {
      if (!root.contains(event.target)) close();
    });
    disclosures.push({ root, close });
  });
})();

// A shared-policy visual-target study; all data are embedded for offline use.
(() => {
  const data = JSON.parse(document.getElementById("supervision-data").textContent);
  const baseline = data.rows.find((row) => row.id === "None");
  const buttons = [...document.querySelectorAll("[data-supervision-target]")];
  const families = {
    baseline: "Action-only baseline",
    current: "Current perception",
    future: "Future prediction",
    combined: "Target combination",
  };
  function selectTarget(id) {
    const row = data.rows.find((item) => item.id === id);
    if (!row) return;
    buttons.forEach((button) =>
      button.setAttribute("aria-pressed", String(button.dataset.supervisionTarget === id)),
    );
    document.getElementById("supervision-family").textContent = families[row.type];
    document.getElementById("supervision-selection").textContent = row.label;
    document.getElementById("supervision-pass-count").textContent =
      `${row.perception_passes} perception ${row.perception_passes === 1 ? "pass" : "passes"}`;
    document
      .getElementById("supervision")
      .dispatchEvent(new CustomEvent("result-help-reset", { bubbles: true }));
    const passDescription =
      row.perception_passes === 0
        ? "Action-only training uses none."
        : row.perception_passes === 2
          ? "For each action update, two of the four targets are sampled per observation, adding two passes."
          : row.type === "combined"
            ? "For each action update, one of the two targets is sampled per observation, so only one pass is added."
            : "This target adds one pass per action update.";
    document.getElementById("perception-pass-description").textContent =
      `A perception pass is one additional backbone forward for visual supervision during training. ${passDescription}`;
    document.getElementById("supervision-plus").innerHTML =
      `${row.plus_rate.toFixed(2)}<small>%</small>`;
    const gain = row.plus_rate - baseline.plus_rate;
    document.getElementById("supervision-gain").textContent =
      id === "None"
        ? "Action-only reference"
        : `${gain >= 0 ? "+" : ""}${gain.toFixed(2)} points vs action only`;
    document.getElementById("supervision-libero").innerHTML =
      `${row.libero_mean.toFixed(2)}<small> ± ${row.libero_sd.toFixed(2)}%</small>`;
    data.categories.forEach((category) => {
      const delta = row.category_deltas_pp[category.id];
      const label = row.category_delta_labels_pp[category.id].replace("-", "−");
      const element = document.querySelector(`[data-supervision-category="${category.id}"]`);
      const bar = element.querySelector(".supervision-delta-fill");
      bar.style.left = `${50 + Math.min(0, delta) * 2.5}%`;
      bar.style.width = `${Math.abs(delta) * 2.5}%`;
      bar.classList.toggle("is-negative", delta < 0);
      const value = element.querySelector(".supervision-delta-value");
      value.textContent = label;
      value.classList.toggle("is-negative", delta < 0);
      const description = `${category.label}: ${label} percentage points from action only. Action-only success: ${category.baseline_percent.toFixed(2)}%.`;
      element.setAttribute("aria-label", description);
      element.title = description;
    });
    document.getElementById("supervision-state").textContent =
      `${row.label}: LIBERO-Plus ${row.plus_rate.toFixed(2)} percent. ${id === "None" ? "Action-only baseline." : `${gain.toFixed(2)} percentage-point gain over action only.`}`;
  }
  buttons.forEach((button) =>
    button.addEventListener("click", () => selectTarget(button.dataset.supervisionTarget)),
  );
  selectTarget("D");
})();

// Reveal each narrative transition once; leave content visible without motion or JS.
(() => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (reduce.matches || !("IntersectionObserver" in window)) return;
  document.querySelectorAll("[data-scroll-reveal]").forEach((element) => {
    if (element.getBoundingClientRect().top < window.innerHeight) return;
    element.classList.add("scroll-reveal");
    const reveal = () => {
      element.classList.add("is-revealed");
      observer.disconnect();
      reduce.removeEventListener("change", onPreferenceChange);
    };
    const onPreferenceChange = () => {
      if (reduce.matches) reveal();
    };
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) reveal();
      },
      { threshold: 0.5 },
    );
    observer.observe(element);
    reduce.addEventListener("change", onPreferenceChange);
  });
})();

// Copy the citation exactly as displayed; keep a selectable fallback.
(() => {
  const button = document.querySelector("[data-copy-citation]");
  const code = document.getElementById("citation-bibtex");
  const status = document.getElementById("citation-copy-status");
  let reset;
  button.addEventListener("click", async () => {
    clearTimeout(reset);
    try {
      await navigator.clipboard.writeText(code.textContent.trim());
      button.textContent = "Copied";
      status.textContent = "BibTeX citation copied.";
    } catch {
      code.parentElement.focus();
      const range = document.createRange();
      range.selectNodeContents(code);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      status.textContent = "Citation selected. Press Control+C or Command+C to copy.";
    }
    reset = setTimeout(() => {
      button.textContent = "Copy BibTeX";
    }, 2200);
  });
})();

// Switch between two complete author/affiliation mappings in one update.
(() => {
  const button = document.querySelector(".hero-affiliations-toggle");
  const label = button.querySelector("span");
  const compact = document.getElementById("compact-affiliations");
  const full = document.getElementById("full-affiliations");
  const superscripts = document.querySelectorAll("[data-affiliation-compact]");
  button.addEventListener("click", () => {
    const expanded = button.getAttribute("aria-expanded") !== "true";
    superscripts.forEach((sup) => {
      sup.textContent = expanded ? sup.dataset.affiliationFull : sup.dataset.affiliationCompact;
    });
    compact.hidden = expanded;
    full.hidden = !expanded;
    label.textContent = expanded ? "Less detail" : "Full affiliations";
    button.setAttribute("aria-expanded", String(expanded));
  });
})();
