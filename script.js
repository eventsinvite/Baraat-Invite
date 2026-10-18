
"use strict";

// ===============================
// ELEMENTS
// ===============================

const pages = [...document.querySelectorAll(".page")];
const dots = [...document.querySelectorAll(".dot")];

const progressBar = document.getElementById("progressBar");
const audio = document.getElementById("weddingAudio");

const introScreen = document.getElementById("introScreen");
const openBtn = document.getElementById("openBtn");
const restartBtn = document.getElementById("restartBtn");

const canvas = document.getElementById("fireworks");
const ctx = canvas ? canvas.getContext("2d") : null;

let currentPage = 1;
let particles = [];
let introOpened = false;

// ===============================
// OPEN SCREEN AND MUSIC
// ===============================

if (introScreen && openBtn) {
  openBtn.addEventListener("click", () => {
    if (introOpened) return;

    introOpened = true;
    openBtn.disabled = true;

    // Reveal the invitation immediately.
    document.body.classList.remove("intro-wait");

    // Fade away the OPEN screen.
    introScreen.classList.add("intro-hidden");

    // Remove the overlay after its transition.
    window.setTimeout(() => {
      introScreen.remove();
    }, 750);

    // Start audio from the user's click.
    // A missing or invalid MP3 will not block the invitation.
    if (audio) {
      const source = audio.querySelector("source");
      const filePath = source
        ? source.getAttribute("src")
        : "";

      if (filePath && filePath.trim() !== "") {
        audio.play().catch(error => {
          console.warn("Music could not start:", error);
        });
      }
    }
  });
}

// ===============================
// PAGE NAVIGATION
// ===============================

function showPage(number) {
  const requested = Number(number);

  if (!Number.isFinite(requested)) return;

  const target = Math.max(1, Math.min(pages.length, requested));

  const oldPage = document.getElementById(`page${currentPage}`);

  // Reset the previous door animation.
  if (oldPage && oldPage.id === "page2") {
    oldPage.classList.remove("opening");
  }

  // Activate the requested page.
  pages.forEach(page => {
    page.classList.toggle("active", page.id === `page${target}`);
  });

  // Update page navigation dots.
  dots.forEach(dot => {
    const active = Number(dot.dataset.goto) === target;

    dot.classList.toggle("active", active);
    dot.setAttribute("aria-current", active ? "step" : "false");
  });

  currentPage = target;

  // Update progress bar.
  if (progressBar) {
    progressBar.style.width =
      `${(target / Math.max(pages.length, 1)) * 100}%`;
  }

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

  // Animate the double doors on page 2.
  if (target === 2) {
    const doorsPage = document.getElementById("page2");

    if (doorsPage) {
      requestAnimationFrame(() => {
        doorsPage.classList.add("opening");
      });
    }
  }

  // Decorative fireworks on cover and final page.
  if (target === 1 || target === 4) {
    launchFireworks(target === 1 ? 2 : 1);
  }
}

// Next buttons.
document.querySelectorAll("[data-next]").forEach(button => {
  button.addEventListener("click", () => {
    showPage(button.dataset.next);
  });
});

// Previous buttons.
document.querySelectorAll("[data-prev]").forEach(button => {
  button.addEventListener("click", () => {
    showPage(button.dataset.prev);
  });
});

// Page navigation dots.
dots.forEach(dot => {
  dot.addEventListener("click", () => {
    showPage(dot.dataset.goto);
  });
});

// Restart invitation.
if (restartBtn) {
  restartBtn.addEventListener("click", () => {
    showPage(1);
  });
}

// ===============================
// FIREWORKS ANIMATION
// ===============================

function resizeCanvas() {
  if (!canvas || !ctx) return;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);

  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function burst(x, y) {
  const colors = [
    "#f5d982",
    "#d9b45f",
    "#fff0c2",
    "#e9a1a5",
    "#fff8e8"
  ];

  for (let i = 0; i < 46; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.7 + Math.random() * 3.2;

    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 45 + Math.random() * 35,
      maxLife: 80,
      size: 1 + Math.random() * 2,
      color: colors[Math.floor(Math.random() * colors.length)]
    });
  }
}

function launchFireworks(count = 1) {
  for (let i = 0; i < count; i++) {
    window.setTimeout(() => {
      burst(
        window.innerWidth * (0.2 + Math.random() * 0.6),
        window.innerHeight * (0.15 + Math.random() * 0.48)
      );
    }, i * 350);
  }
}

function drawFireworks() {
  if (!canvas || !ctx) return;

  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

  particles = particles.filter(p => p.life > 0);

  for (const p of particles) {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.025;
    p.vx *= 0.99;
    p.life--;

    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.fillStyle = p.color;

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 1;
  requestAnimationFrame(drawFireworks);
}

if (canvas && ctx) {
  window.addEventListener("resize", resizeCanvas);

  resizeCanvas();
  drawFireworks();

  // Occasional decorative fireworks.
  window.setInterval(() => {
    if (
      document.visibilityState === "visible" &&
      Math.random() > 0.38
    ) {
      burst(
        window.innerWidth * (0.12 + Math.random() * 0.76),
        window.innerHeight * (0.12 + Math.random() * 0.42)
      );
    }
  }, 2600);
}

// ===============================
// KEYBOARD NAVIGATION
// ===============================

document.addEventListener("keydown", event => {
  // Do not navigate while the intro screen is showing.
  if (document.body.classList.contains("intro-wait")) {
    return;
  }

  // Do not interfere with keyboard use of links or buttons.
  if (
    event.target instanceof HTMLElement &&
    ["BUTTON", "A", "INPUT", "TEXTAREA", "SELECT"].includes(
      event.target.tagName
    )
  ) {
    return;
  }

  if (event.key === "ArrowRight" && currentPage < pages.length) {
    showPage(currentPage + 1);
  }

  if (event.key === "ArrowLeft" && currentPage > 1) {
    showPage(currentPage - 1);
  }
});
