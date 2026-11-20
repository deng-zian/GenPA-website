(() => {
  const links = [...document.querySelectorAll(".nav-links a")];
  const sections = links.map((link) => document.querySelector(link.getAttribute("href")));
  function update() {
    const line = window.innerHeight * 0.3;
    let active = 0;
    sections.forEach((section, i) => {
      if (section && section.getBoundingClientRect().top <= line) active = i;
    });
    if (
      window.scrollY > 0 &&
      sections[sections.length - 1]?.getBoundingClientRect().bottom <= window.innerHeight + 1
    )
      active = links.length - 1;
    links.forEach((link, i) => {
      if (i === active) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  }
  let pending = false;
  window.addEventListener(
    "scroll",
    () => {
      if (!pending) {
        pending = true;
        requestAnimationFrame(() => {
          update();
          pending = false;
        });
      }
    },
    { passive: true },
  );
  window.addEventListener("resize", update, { passive: true });
  update();
})();
