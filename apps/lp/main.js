import { animate, inView, stagger } from "motion";

const spring = { type: "spring", stiffness: 420, damping: 34 };
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const quick = { duration: 0.12 };

for (const element of document.querySelectorAll("[data-reveal]")) {
  inView(
    element,
    () => {
      element.classList.add("drawn");
      if (reduced) return void animate(element, { opacity: 1 }, quick);
      animate(element, { opacity: [0, 1], y: [16, 0], filter: ["blur(6px)", "blur(0px)"] }, spring);
      const tiles = element.matches(".cta") && element.querySelectorAll(".stack img");
      if (tiles) animate(tiles, { x: [-10, 0], scale: [0.6, 1] }, { ...spring, delay: stagger(0.06) });
      const lines = element.matches(".terminal") && element.querySelectorAll(".out");
      if (lines) animate(lines, { opacity: [0, 1], x: [-6, 0] }, { duration: 0.3, delay: stagger(0.45, { startDelay: 0.5 }) });
    },
    { amount: 0.4 },
  );
}

for (const details of document.querySelectorAll(".faq details")) {
  const answer = details.querySelector(".answer");
  details.querySelector("summary").addEventListener("click", (event) => {
    event.preventDefault();
    const opening = details.dataset.state !== "open";
    details.dataset.state = opening ? "open" : "closed";
    if (opening) details.open = true;
    const from = answer.offsetHeight;
    const to = opening ? answer.scrollHeight : 0;
    const motion = animate(
      answer,
      { height: [opening ? 0 : from, to], opacity: opening ? [0, 1] : 0, filter: opening ? ["blur(4px)", "blur(0px)"] : "blur(4px)" },
      reduced ? quick : spring,
    );
    motion.then(() => {
      if (details.dataset.state === "closed") details.open = false;
      else answer.style.height = "auto";
    });
  });
}

for (const button of document.querySelectorAll("[data-copy], [data-copy-from]")) {
  const label = button.querySelector("[data-label]") ?? button;
  const original = label.textContent;
  let timer;
  button.addEventListener("click", () => {
    const source = button.dataset.copyFrom ? document.querySelector(button.dataset.copyFrom) : null;
    const text = button.dataset.copy ?? (source?.content ?? source)?.textContent ?? "";
    navigator.clipboard.writeText(text.trim());
    label.textContent = button.dataset.copied;
    clearTimeout(timer);
    timer = setTimeout(() => {
      label.textContent = original;
    }, 1600);
  });
}

const versionSlots = document.querySelectorAll("[data-version]");
if (versionSlots.length) {
  fetch("https://api.github.com/repos/Andsu-dev/runelay/releases/latest")
    .then((response) => (response.ok ? response.json() : null))
    .then((release) => {
      if (!release?.tag_name) return;
      for (const slot of versionSlots) slot.textContent = ` · ${release.tag_name.replace(/^v/, "")}`;
    })
    .catch(() => null);
}

const contribute = document.querySelector("[data-contribute]");
if (contribute) {
  const custom = contribute.querySelector("input[name=custom]");
  const total = contribute.querySelector("[data-total]");
  const radios = [...contribute.querySelectorAll("input[name=amount]")];
  const fallback = radios.find((radio) => radio.defaultChecked);
  const sync = () => {
    const picked = radios.find((radio) => radio.checked);
    const reais = custom.value || (picked ? Number(picked.value) / 100 : "");
    total.textContent = reais ? ` R$ ${reais}` : "";
  };
  custom.addEventListener("input", () => {
    for (const radio of radios) radio.checked = false;
    if (!custom.value && fallback) fallback.checked = true;
    sync();
  });
  for (const radio of radios)
    radio.addEventListener("change", () => {
      custom.value = "";
      sync();
    });
}
