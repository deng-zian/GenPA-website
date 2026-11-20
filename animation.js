// Two persistent forward paths. Mode changes never rebuild or swap the action rail.
(() => {
  const root = document.getElementById("genpa-how-it-works");
  if (!root) return;
  const diagram = root.querySelector(".gph-diagram");
  const action = root.querySelector('[data-gph-rail="action"]');
  const perception = root.querySelector('[data-gph-rail="perception"]');
  const shared = root.querySelector("[data-gph-shared]");
  const buttons = Array.from(root.querySelectorAll("[data-gph-mode]"));
  const carousel = root.querySelector(".gph-carousel");
  const targetCards = Array.from(root.querySelectorAll(".gph-target-card[data-gph-target]"));
  const previousTarget = root.querySelector("[data-gph-prev]");
  const nextTarget = root.querySelector("[data-gph-next]");
  const targetPosition = root.querySelector("[data-gph-target-position]");
  const targetOrder = ["D", "N", "P", "S", "G", "F", "FD"];
  let selectedTarget = "D";
  const targetPrompt = root.querySelector("[data-gph-perception-prompt]");
  // Images are existing training targets, not model-generated predictions.
  const visualTargets = {
    D: {
      image: "agent_d.png",
      label: "Current depth",
      short: "Estimate the depth of this scene.",
      prompt: "Generate a full-scene metric depth map for the current observation.",
    },
    N: {
      image: "agent_n.png",
      label: "Surface normals",
      short: "Estimate surface normals.",
      prompt: "Generate a camera-coordinate surface normal map for the current observation.",
    },
    P: {
      image: "agent_p.png",
      label: "Robot-frame pointmaps",
      short: "Predict robot-frame 3D coordinates.",
      prompt: "Generate a robot-base-coordinate XYZ point map for the current observation.",
    },
    S: {
      image: "agent_s.png",
      label: "Semantic-part segmentation",
      short: "Segment the scene into semantic parts.",
      prompt:
        "Generate a semantic part segmentation map for the current observation using the fixed LIBERO part palette.",
    },
    G: {
      image: "agent_g.png",
      label: "Task-conditioned grounding",
      short: "Locate the milk and its target basket.",
      prompt:
        "For the robot task: Pick up the milk and place it in the basket. Generate a current-stage task grounding map: red for the operation object, green for the goal or anchor, and blue for the active part.",
    },
    F: {
      image: "agent_rgb_t16.png",
      label: "Future RGB",
      short: "Predict the next view while moving the milk to the basket.",
      prompt:
        "A video recorded from a robot's point of view executing the following instruction: Pick up the milk and place it in the basket.",
    },
    FD: {
      image: "agent_fd.png",
      label: "Future depth",
      short: "Predict future depth while moving the milk to the basket.",
      prompt:
        "For the robot task: Pick up the milk and place it in the basket. Generate a full-scene metric depth map for the future observation 16 action steps ahead.",
    },
  };

  let mode = "training";
  const setText = (selector, text) => {
    root.querySelector(selector).textContent = text;
  };
  function nodePoint(rail, name, side) {
    const node = rail.querySelector(`[data-gph-node="${name}"]`);
    const bounds = node.getBoundingClientRect();
    const parent = rail.getBoundingClientRect();
    return {
      x: bounds.left - parent.left + bounds.width / 2,
      y: (side === "top" ? bounds.top - 4 : bounds.bottom + 4) - parent.top,
    };
  }
  function drawRail(rail, edges) {
    const bounds = rail.getBoundingClientRect();
    rail.querySelector("svg").setAttribute("viewBox", `0 0 ${bounds.width} ${bounds.height}`);
    edges.forEach(([from, to]) => {
      const a = nodePoint(rail, from, "top");
      const b = nodePoint(rail, to, "bottom");
      const middle = (a.y + b.y) / 2;
      const d = `M ${a.x} ${a.y} C ${a.x} ${middle}, ${b.x} ${middle}, ${b.x} ${b.y}`;
      rail.querySelector(`[data-gph-path="${from}-${to}"]`).setAttribute("d", d);
    });
  }
  function draw() {
    const width = diagram.clientWidth;
    const height = diagram.clientHeight;
    if (!width || !height) return;
    root.style.setProperty("--gph-shift", `${(width - action.offsetWidth) / 2}px`);
    drawRail(action, [
      ["input", "core"],
      ["core", "adapter"],
      ["adapter", "output"],
    ]);
    drawRail(perception, [
      ["input", "core"],
      ["core", "output"],
    ]);
    const leftCore = action.querySelector('[data-gph-node="core"]');
    const rightCore = perception.querySelector('[data-gph-node="core"]');
    // Layout offsets deliberately ignore the animated action-rail transform.
    const lx = action.offsetLeft + leftCore.offsetLeft + leftCore.offsetWidth / 2;
    const rx = perception.offsetLeft + rightCore.offsetLeft - rightCore.offsetWidth / 2;
    const y = leftCore.offsetTop + leftCore.offsetHeight / 2;
    const narrow = window.matchMedia("(max-width:600px)").matches;
    const label = shared.querySelector(".gph-shared-label");
    const labelBottom = label.offsetTop + label.offsetHeight;
    const d = narrow
      ? `M ${lx} ${y} H ${rx} M ${width / 2} ${y} V ${labelBottom + 2}`
      : `M ${lx} ${y} H ${rx}`;
    shared.querySelector("svg").setAttribute("viewBox", `0 0 ${width} ${height}`);
    shared.querySelector("path").setAttribute("d", d);
  }
  function setMode(next, announce = false) {
    mode = next;
    setText("[data-gph-action-label]", mode === "training" ? "Action supervision" : "Action chunk");
    root.dataset.mode = mode;
    buttons.forEach((button) => {
      const active = button.dataset.gphMode === mode;
      button.setAttribute("aria-selected", String(active));
      button.tabIndex = active ? 0 : -1;
    });
    diagram.setAttribute("aria-labelledby", `gph-${mode}-tab`);
    perception.setAttribute("aria-hidden", String(mode === "inference"));
    perception.inert = mode === "inference";
    syncCarousel();
    shared.setAttribute("aria-hidden", String(mode === "inference"));
    if (mode === "training") {
      setText(
        "[data-gph-summary]",
        "Separate action and perception forwards jointly update the shared backbone.",
      );
    } else {
      setText(
        "[data-gph-summary]",
        "One backbone forward predicts an action chunk, without visual generation.",
      );
    }
    if (announce)
      setText(
        "[data-gph-status]",
        mode === "training"
          ? "Training. Two separate forward passes share backbone weights and contribute to one joint update."
          : "Inference. The perception path is removed and the action path moves to the center. One backbone forward predicts the action chunk.",
      );
    draw();
  }
  buttons.forEach((button, index) => {
    button.addEventListener("click", () => setMode(button.dataset.gphMode, true));
    button.addEventListener("keydown", (event) => {
      let next;
      if (event.key === "ArrowRight" || event.key === "ArrowLeft") next = 1 - index;
      if (event.key === "Home") next = 0;
      if (event.key === "End") next = 1;
      if (next !== undefined) {
        event.preventDefault();
        setMode(buttons[next].dataset.gphMode, true);
        buttons[next].focus();
      }
    });
  });
  function syncCarousel() {
    const selectedIndex = targetOrder.indexOf(selectedTarget);
    const blocked = mode === "inference";
    targetCards.forEach((card) => {
      const index = targetOrder.indexOf(card.dataset.gphTarget);
      // Choose the nearest circular position; the hidden far cards may wrap.
      let offset = (index - selectedIndex + targetOrder.length) % targetOrder.length;
      if (offset > Math.floor(targetOrder.length / 2)) offset -= targetOrder.length;
      const active = offset === 0;
      card.style.setProperty("--offset", String(offset));
      card.dataset.active = String(active);
      card.dataset.distance = String(Math.abs(offset));
      card.setAttribute("aria-pressed", String(active));
      card.tabIndex = active && !blocked ? 0 : -1;
      card.disabled = blocked || Math.abs(offset) > 1;
    });
    previousTarget.disabled = blocked;
    nextTarget.disabled = blocked;
    targetPosition.textContent = `${selectedIndex + 1} / ${targetOrder.length}`;
  }
  function setTarget(id, announce = false) {
    const target = visualTargets[id];
    if (!target) return;
    selectedTarget = id;
    syncCarousel();
    // Cards keep their original images; only position and the prompt change.
    targetPrompt.textContent = "“" + target.short + "”";
    targetPrompt.title = target.prompt;
    targetPrompt.removeAttribute("aria-label");
    if (announce)
      setText(
        "[data-gph-status]",
        "Visual supervision target: " + target.label + ". " + target.short,
      );
    draw();
  }
  function stepTarget(direction, announce = true) {
    if (mode === "inference") return;
    const index = targetOrder.indexOf(selectedTarget);
    setTarget(targetOrder[(index + direction + targetOrder.length) % targetOrder.length], announce);
  }
  previousTarget.addEventListener("click", () => stepTarget(-1));
  nextTarget.addEventListener("click", () => stepTarget(1));
  targetCards.forEach((card) =>
    card.addEventListener("click", () => {
      if (mode !== "inference") setTarget(card.dataset.gphTarget, true);
    }),
  );
  carousel.addEventListener("keydown", (event) => {
    if (mode === "inference" || event.altKey || event.ctrlKey || event.metaKey) return;
    let nextIndex;
    const index = targetOrder.indexOf(selectedTarget);
    if (event.key === "ArrowLeft")
      nextIndex = (index - 1 + targetOrder.length) % targetOrder.length;
    if (event.key === "ArrowRight") nextIndex = (index + 1) % targetOrder.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = targetOrder.length - 1;
    if (nextIndex === undefined) return;
    event.preventDefault();
    setTarget(targetOrder[nextIndex], true);
    // Move focus with keyboard selection; pointer clicks never steal focus.
    targetCards
      .find((card) => card.dataset.gphTarget === selectedTarget)
      .focus({ preventScroll: true });
  });
  const resize = new ResizeObserver(draw);
  resize.observe(diagram);
  root.querySelectorAll("[data-gph-node]").forEach((node) => resize.observe(node));
  root.querySelectorAll("img").forEach((img) => img.addEventListener("load", draw));
  setMode("training");
  setTarget("D");
})();
