/* Aligned LIBERO observations and visual supervision, with a hover demo on each tab entry. */
(() => {
  const root = document.querySelector(".gpv-gallery");
  if (!root) return;
  const data = JSON.parse(root.querySelector("#visual-target-data").textContent);
  const cards = [...root.querySelectorAll("[data-gpv-card]")];
  const cameraButtons = [...root.querySelectorAll("[data-gpv-view]")];
  const allButton = root.querySelector("[data-gpv-all]");
  const status = root.querySelector("[data-gpv-status]");
  let currentView = "agent";
  root.dataset.showTargets = "false";
  const imagePath = (name) => "assets/visual-targets/" + name;

  allButton.addEventListener("click", () => {
    const reveal = root.dataset.showTargets !== "true";
    root.dataset.showTargets = String(reveal);
    allButton.setAttribute("aria-pressed", String(reveal));
    root.querySelector("[data-gpv-all-label]").textContent = reveal
      ? "Show RGB images"
      : "Show all targets";
    status.textContent = reveal
      ? "All seven visual targets are visible."
      : "Showing RGB observations.";
  });
  cameraButtons.forEach((button) =>
    button.addEventListener("click", () => {
      const view = data.views.find((view) => view.id === button.dataset.gpvView);
      if (!view || view.id === currentView) return;
      currentView = view.id;
      cameraButtons.forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
      cards.forEach((card) => {
        const target = data.targets.find((target) => target.id === card.dataset.gpvCard);
        card.querySelector(".gpv-observation").src = imagePath(view.reference_image);
        card.querySelector(".gpv-target").src = imagePath(target.images[view.id]);
        card
          .querySelector(".gpv-reveal")
          .setAttribute(
            "aria-label",
            target.label + " visual supervision preview — " + view.label.toLowerCase(),
          );
      });
      status.textContent = "Switched to the " + view.label.toLowerCase() + ".";
    }),
  );

  const preview = cards[0].querySelector(".gpv-reveal");
  const panel = root.closest("[data-method-panel]");
  const explorer = root.closest(".method-explorer");
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const mouseInput = matchMedia("(hover: hover) and (pointer: fine)");
  let pending = null;
  let ending = null;
  let running = false;
  root.dataset.hintState = "waiting";

  function stopHint(completed = true) {
    clearTimeout(pending);
    clearTimeout(ending);
    pending = ending = null;
    running = false;
    preview.classList.remove("is-demonstrating");
    root.dataset.hintState = completed ? "complete" : "waiting";
  }
  function startHint() {
    if (pending !== null || running) return;
    if (reducedMotion.matches || !mouseInput.matches) {
      root.dataset.hintState = "disabled";
      return;
    }
    root.dataset.hintState = "pending";
    pending = setTimeout(() => {
      pending = null;
      if (document.hidden || panel?.getAttribute("aria-hidden") === "true") {
        root.dataset.hintState = "waiting";
        return;
      }
      running = true;
      root.dataset.hintState = "running";
      preview.classList.add("is-demonstrating");
      ending = setTimeout(() => stopHint(), 2600);
    }, 250);
  }
  // Real interaction takes priority over the demonstration.
  root.addEventListener("pointerdown", () => stopHint());
  root.addEventListener("focusin", () => stopHint());
  cards.forEach((card) =>
    card.querySelector(".gpv-reveal").addEventListener("pointerenter", () => stopHint()),
  );
  // Only explicit activation of the tab starts the hint. Scroll and hash links do not.
  explorer?.addEventListener("methodviewchange", (event) => {
    if (event.detail.view !== "supervision") {
      stopHint(false);
      return;
    }
    if (event.detail.source === "click") startHint();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && (pending !== null || running)) stopHint(false);
  });
  reducedMotion.addEventListener("change", () => {
    if (reducedMotion.matches) stopHint();
  });
  mouseInput.addEventListener("change", () => {
    if (!mouseInput.matches) stopHint();
  });
})();
