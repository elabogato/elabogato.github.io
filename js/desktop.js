const apps = [
  { id: "about", titleKey: "app.about.title", menuKey: "app.about.menu", icon: "assets/icons/about.png", render: views.about },
  { id: "projects", titleKey: "app.projects.title", menuKey: "app.projects.menu", icon: "assets/icons/projects.png", render: views.projects },
  { id: "socials", titleKey: "app.socials.title", menuKey: "app.socials.menu", icon: "assets/icons/socials.png", render: views.socials },
  { id: "media", titleKey: "app.media.title", menuKey: "app.media.menu", icon: "assets/icons/media.png", render: views.media },
  { id: "games", titleKey: "app.games.title", menuKey: "app.games.menu", icon: "assets/icons/games.png", render: views.games },
  { id: "support", titleKey: "app.support.title", menuKey: "app.support.menu", icon: "assets/icons/support.png", render: views.support },
  { id: "settings", titleKey: "app.settings.title", menuKey: "app.settings.menu", icon: "assets/icons/settings.png", render: views.settings },
  { id: "credits", titleKey: "app.credits.title", icon: "assets/icons/credits.png", render: views.credits }
];

const startMenu = document.getElementById("start-menu");
const startButton = document.getElementById("start-button");
const trayVolume = document.getElementById("tray-volume");
const coarsePointer = window.matchMedia("(pointer: coarse)");
const silentClicks = "#start-button, [data-action='close'], .desktop-icon, .start-item, .task-button";

function openApp(app) {
  WindowManager.open(app);
  toggleStartMenu(false);
}

function toggleStartMenu(show = startMenu.hidden) {
  const changed = show === startMenu.hidden;
  startMenu.hidden = !show;
  startButton.setAttribute("aria-expanded", String(show));
  if (changed && show) UiSounds.play("start");
}

function renderIcons() {
  const container = document.getElementById("icons");

  apps.forEach((app) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "desktop-icon";
    button.innerHTML = `<img class="icon-lg" src="${app.icon}" alt=""><span data-i18n="${app.titleKey}"></span>`;

    button.addEventListener("click", (e) => {
      if (coarsePointer.matches || e.detail === 0) {
        openApp(app);
        return;
      }
      container.querySelectorAll(".selected").forEach((el) => el.classList.remove("selected"));
      button.classList.add("selected");
    });
    button.addEventListener("dblclick", () => openApp(app));

    container.appendChild(button);
  });
}

function renderStartMenu() {
  const list = document.getElementById("start-list");

  apps.filter((app) => app.menuKey).forEach((app) => {
    const item = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "start-item";
    button.innerHTML = `<img class="icon-sm" src="${app.icon}" alt=""><span data-i18n="${app.menuKey}"></span>`;
    button.addEventListener("click", () => openApp(app));
    item.appendChild(button);
    list.appendChild(item);
  });
}

function updateClock() {
  const now = new Date();
  const locale = I18n.getCurrent();
  document.getElementById("clock-time").textContent = now.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit"
  });
  document.getElementById("clock-date").textContent = now.toLocaleDateString(locale);
}

function syncTray() {
  const muted = Settings.get("muted");
  trayVolume.setAttribute("aria-pressed", String(muted));
  trayVolume.querySelector("img").src = `assets/icons/player/${muted ? "mute" : "volume"}.png`;
}

function initLanguagePicker() {
  const select = document.getElementById("enter-language");
  select.innerHTML = I18n.getLanguages()
    .map((language) => `<option value="${escapeHTML(language.code)}">${escapeHTML(language.name)}</option>`)
    .join("");
  select.value = I18n.getCurrent();
  select.addEventListener("input", () => Settings.set("language", select.value));
  I18n.onChange(() => {
    select.value = I18n.getCurrent();
    updateClock();
  });
}

const Particles = (() => {
  const canvas = document.getElementById("particles");
  const context = canvas.getContext("2d");
  let dots = [];
  let frame = null;

  function resize() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
  }

  function seed() {
    const count = Math.round((canvas.width * canvas.height) / 18000);
    dots = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.8 + 0.6,
      speed: Math.random() * 0.25 + 0.05
    }));
  }

  function paint(move) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "rgba(140, 180, 255, 0.55)";
    dots.forEach((dot) => {
      if (move) {
        dot.y -= dot.speed;
        if (dot.y < -2) dot.y = canvas.height + 2;
      }
      context.beginPath();
      context.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);
      context.fill();
    });
  }

  function loop() {
    paint(true);
    frame = requestAnimationFrame(loop);
  }

  function sync() {
    cancelAnimationFrame(frame);
    frame = null;
    if (!Settings.get("particles")) {
      context.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }
    resize();
    seed();
    if (Settings.get("animations") === "normal") loop();
    else paint(false);
  }

  function init() {
    sync();
    window.addEventListener("resize", sync);
    Settings.subscribe((key) => {
      if (key === null || key === "particles" || key === "animations") sync();
    });
  }

  return { init };
})();

function enterDesktop() {
  document.getElementById("enter-screen").hidden = true;
  document.querySelectorAll("[inert]").forEach((el) => el.removeAttribute("inert"));
  UiSounds.unlock();
  AudioPlayer.start();
}

function initDesktop() {
  const enterButton = document.getElementById("enter-button");

  renderIcons();
  renderStartMenu();
  updateClock();
  setInterval(updateClock, 1000);
  syncTray();
  Particles.init();
  Settings.subscribe(syncTray);

  enterButton.addEventListener("click", enterDesktop);
  enterButton.focus();

  startButton.addEventListener("click", () => toggleStartMenu());
  trayVolume.addEventListener("click", () => Settings.set("muted", !Settings.get("muted")));

  document.addEventListener("pointerdown", (e) => {
    if (!e.target.closest("#start-menu, #start-button")) toggleStartMenu(false);
    if (!e.target.closest(".desktop-icon")) {
      document.querySelectorAll(".desktop-icon.selected").forEach((el) => el.classList.remove("selected"));
    }
  });

  document.addEventListener("click", (e) => {
    const button = e.target.closest("button");
    if (button && !button.matches(silentClicks)) UiSounds.play("click");
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !startMenu.hidden) {
      toggleStartMenu(false);
      startButton.focus();
    }
  });
}
