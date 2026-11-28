document.documentElement.classList.add("js");

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const copyButton = document.querySelector(".brew-copy");
if (copyButton) {
  const label = copyButton.querySelector(".brew-copy-label");
  copyButton.addEventListener("click", async () => {
    const text = copyButton.dataset.copy;
    let copied = false;
    try {
      await navigator.clipboard.writeText(text);
      copied = true;
    } catch {
      const field = document.createElement("textarea");
      field.value = text;
      field.setAttribute("readonly", "");
      field.style.position = "fixed";
      field.style.opacity = "0";
      document.body.appendChild(field);
      field.select();
      copied = document.execCommand("copy");
      field.remove();
    }
    label.textContent = copied ? "Copied" : "Select";
    if (!copied) window.getSelection()?.selectAllChildren(copyButton.querySelector("code"));
    window.setTimeout(() => { label.textContent = "Copy"; }, 1800);
  });
}

const stage = document.querySelector(".macbook-story");
const steps = [...document.querySelectorAll(".story-step")];

const STATES = {
  1: {
    mode: "critical",
    swap: 86,
    swapNote: "6.9 GB of 8.0 GB on disk",
    headline: "Swap 86% full, system will freeze soon",
    sub: "Holding 18.8 GB on a 16.0 GB Mac. 6.9 GB of it waits on the disk.",
    side: "Closing everything marked safe gives back about 3.6 GB.",
    apps: 26, comp: 26, free: 18, disk: 30,
  },
  2: {
    mode: "focus",
    swap: 86,
    swapNote: "6.9 GB of 8.0 GB on disk",
    headline: "Brave Browser holds 2.9 GB across 35 processes",
    sub: "One app, every child process. Close the tree, not one helper at a time.",
    side: "Leftovers and background workers go first. Kept profiles stay open.",
    apps: 26, comp: 26, free: 18, disk: 30,
  },
  3: {
    mode: "ok",
    swap: 31,
    swapNote: "2.4 GB of 8.0 GB on disk",
    headline: "Swap 31%. Nothing froze.",
    sub: "3.6 GB handed back. Your open work stayed open.",
    side: "Kept profiles untouched. Every close is in the activity log.",
    apps: 12, comp: 20, free: 58, disk: 10,
  },
};

let current = 1;
let swapFrame = 0;

function setSwap(value) {
  const label = stage.querySelector("[data-swap-label]");
  const number = stage.querySelector("[data-swap-value]");
  const meter = stage.querySelector("[data-swap-meter]");
  if (label) label.textContent = `Swap ${value}%`;
  if (number) number.textContent = `${value}%`;
  if (meter) meter.style.setProperty("--fill", `${value}%`);
}

function animateSwap(from, to) {
  cancelAnimationFrame(swapFrame);
  if (reduceMotion) { setSwap(to); return; }
  const start = performance.now();
  const tick = (now) => {
    const t = Math.min(1, (now - start) / 520);
    const eased = 1 - Math.pow(1 - t, 3);
    setSwap(Math.round(from + (to - from) * eased));
    if (t < 1) swapFrame = requestAnimationFrame(tick);
  };
  swapFrame = requestAnimationFrame(tick);
}

function applyState(index) {
  if (!stage || index === current) return;
  const next = STATES[index];
  if (!next) return;
  const previousSwap = STATES[current].swap;
  current = index;

  stage.dataset.screenState = next.mode;
  animateSwap(previousSwap, next.swap);

  const headline = stage.querySelector("[data-headline]");
  const sub = stage.querySelector("[data-sub]");
  const side = stage.querySelector("[data-side-sub]");
  const swapNote = stage.querySelector(".metric-alert small");
  if (headline) headline.textContent = next.headline;
  if (sub) sub.textContent = next.sub;
  if (side) side.textContent = next.side;
  if (swapNote) swapNote.textContent = next.swapNote;

  const widths = { "data-seg-apps": next.apps, "data-seg-disk": next.disk };
  for (const [attr, width] of Object.entries(widths)) {
    const el = stage.querySelector(`[${attr}]`);
    if (el) el.style.setProperty("--w", `${width}%`);
  }
  const comp = stage.querySelector(".seg-comp");
  const free = stage.querySelector(".seg-free");
  if (comp) comp.style.setProperty("--w", `${next.comp}%`);
  if (free) free.style.setProperty("--w", `${next.free}%`);
}

if (stage && steps.length) {
  let ticking = false;
  const pick = () => {
    ticking = false;
    const middle = window.innerHeight * 0.5;
    let best = 1;
    let bestDistance = Infinity;
    for (const step of steps) {
      const box = step.getBoundingClientRect();
      const distance = Math.abs(box.top + box.height / 2 - middle);
      if (distance < bestDistance) { bestDistance = distance; best = Number(step.dataset.step); }
      step.classList.toggle("is-active", Number(step.dataset.step) === best);
    }
    applyState(best);
  };
  const request = () => {
    if (!ticking) { ticking = true; requestAnimationFrame(pick); }
  };
  window.addEventListener("scroll", request, { passive: true });
  window.addEventListener("resize", request);
  pick();
}
