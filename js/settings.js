const Settings = (() => {
  const STORAGE_KEY = "elabogato-settings";
  const defaults = {
    language: "en",
    volume: 0.5,
    muted: false,
    musicEnabled: true,
    interfaceSounds: true,
    shadowIntensity: 0.5,
    windowOpacity: 1,
    wallpaper: "default",
    animations: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "reduced" : "normal",
    effects: false,
    showClock: true,
    particles: false,
    iconSize: "medium"
  };
  const listeners = new Set();
  let values = load();

  function load() {
    try {
      return { ...defaults, ...JSON.parse(localStorage.getItem(STORAGE_KEY)) };
    } catch {
      return { ...defaults };
    }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
    } catch {
      // almacenamiento no disponible (modo privado o bloqueado)
    }
  }

  function apply() {
    const root = document.documentElement;
    root.style.setProperty("--shadow-strength", values.shadowIntensity);
    root.style.setProperty("--window-opacity", values.windowOpacity);
    root.dataset.animations = values.animations;
    root.dataset.effects = values.effects ? "on" : "off";
    root.dataset.iconSize = values.iconSize;
    document.getElementById("desktop").dataset.wallpaper = values.wallpaper;
    document.getElementById("clock").hidden = !values.showClock;
  }

  function get(key) {
    return values[key];
  }

  function set(key, value) {
    values[key] = value;
    save();
    if (document.getElementById("desktop")) apply();
    listeners.forEach((listener) => listener(key, value));
  }

  function reset() {
    values = { ...defaults, language: values.language };
    save();
    apply();
    listeners.forEach((listener) => listener(null, null));
  }

  function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  return { init: apply, get, set, reset, subscribe };
})();

function downloadTranslationTemplate() {
  const link = document.createElement("a");
  link.href = "lang/template.lang";
  link.download = "template.lang";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

async function openTranslateDialog(container) {
  const [site, socials] = await Promise.all([
    loadJSON("data/site.json"),
    loadJSON("data/socials.json")
  ]);
  const discord = socials.find((social) => social.id === "discord");
  const dialog = document.createElement("dialog");
  dialog.className = "xp-dialog";
  dialog.setAttribute("aria-labelledby", "translate-title");
  dialog.innerHTML = `
    <h3 id="translate-title">${th("translate.title")}</h3>
    <p>${th("translate.question")}</p>
    <div class="actions">
      <button type="button" class="xp-button primary" data-choice="yes">${th("translate.yes")}</button>
      <button type="button" class="xp-button" data-choice="close">${th("translate.no")}</button>
    </div>`;

  dialog.addEventListener("click", (e) => {
    const choice = e.target.closest("[data-choice]")?.dataset.choice;
    if (choice === "close") dialog.close();
    if (choice !== "yes") return;

    downloadTranslationTemplate();
    dialog.innerHTML = `
      <h3 id="translate-title">${th("translate.title")}</h3>
      <p>${th("translate.downloaded")}</p>
      <ol>
        <li>${th("translate.step1")}</li>
        <li>${th("translate.step2")}</li>
        <li>${th("translate.stepRepo")}
          <a href="${safeUrl(site.repoUrl)}" target="_blank" rel="noopener noreferrer">${escapeHTML(site.repoUrl)}</a>
        </li>
        <li>${th("translate.stepDiscord")}
          ${discord ? `<strong>${escapeHTML(discord.username)}</strong>` : ""}
        </li>
      </ol>
      <div class="actions">
        <button type="button" class="xp-button" data-choice="close">${th("translate.close")}</button>
      </div>`;
  });
  dialog.addEventListener("close", () => dialog.remove());

  container.appendChild(dialog);
  dialog.showModal();
}

views.settings = (container) => {
  const languageOptions = I18n.getLanguages()
    .map((language) => `<option value="${escapeHTML(language.code)}">${escapeHTML(language.name)}</option>`)
    .join("");

  container.innerHTML = `
    <fieldset class="panel-group">
      <legend><img class="icon-sm" src="assets/icons/settings-audio.png" alt="">${th("panel.audio")}</legend>
      <p class="meta" data-now-playing></p>
      <label class="field-row">${th("panel.volume")}
        <input type="range" min="0" max="1" step="0.05" data-setting="volume">
      </label>
      <label class="field-row"><input type="checkbox" data-setting="muted">${th("panel.mute")}</label>
      <label class="field-row"><input type="checkbox" data-setting="musicEnabled">${th("panel.musicEnabled")}</label>
      <p class="actions">
        <button type="button" class="xp-button" data-action="prev-track">${th("panel.prev")}</button>
        <button type="button" class="xp-button" data-action="toggle-music"></button>
        <button type="button" class="xp-button" data-action="next-track">${th("panel.next")}</button>
      </p>
      <label class="field-row"><input type="checkbox" data-setting="interfaceSounds">${th("panel.uiSounds")}</label>
    </fieldset>

    <fieldset class="panel-group">
      <legend><img class="icon-sm" src="assets/icons/settings-appearance.png" alt="">${th("panel.appearance")}</legend>
      <label class="field-row"><input type="checkbox" checked disabled>${th("panel.darkTheme")}</label>
      <label class="field-row">${th("panel.shadows")}
        <input type="range" min="0" max="1" step="0.1" data-setting="shadowIntensity">
      </label>
      <label class="field-row">${th("panel.transparency")}
        <input type="range" min="0.6" max="1" step="0.05" data-setting="windowOpacity">
      </label>
      <label class="field-row">${th("panel.wallpaper")}
        <select data-setting="wallpaper">
          <option value="default">${th("panel.wallpaperDefault")}</option>
          <option value="gradient">${th("panel.wallpaperGradient")}</option>
          <option value="solid">${th("panel.wallpaperSolid")}</option>
        </select>
      </label>
    </fieldset>

    <fieldset class="panel-group">
      <legend><img class="icon-sm" src="assets/icons/settings-animation.png" alt="">${th("panel.animation")}</legend>
      <label class="field-row"><input type="radio" name="animations" value="normal" data-setting="animations">${th("panel.animNormal")}</label>
      <label class="field-row"><input type="radio" name="animations" value="reduced" data-setting="animations">${th("panel.animReduced")}</label>
      <label class="field-row"><input type="radio" name="animations" value="off" data-setting="animations">${th("panel.animOff")}</label>
      <label class="field-row"><input type="checkbox" data-setting="effects">${th("panel.effects")}</label>
    </fieldset>

    <fieldset class="panel-group">
      <legend><img class="icon-sm" src="assets/icons/settings-desktop.png" alt="">${th("panel.desktop")}</legend>
      <label class="field-row"><input type="checkbox" data-setting="showClock">${th("panel.showClock")}</label>
      <label class="field-row"><input type="checkbox" data-setting="particles">${th("panel.particles")}</label>
      <label class="field-row">${th("panel.iconSize")}
        <select data-setting="iconSize">
          <option value="small">${th("panel.iconSmall")}</option>
          <option value="medium">${th("panel.iconMedium")}</option>
          <option value="large">${th("panel.iconLarge")}</option>
        </select>
      </label>
      <p><button type="button" class="xp-button" data-action="reset">${th("panel.reset")}</button></p>
    </fieldset>

    <fieldset class="panel-group">
      <legend><img class="icon-sm" src="assets/icons/settings-language.png" alt="">${th("panel.language")}</legend>
      <label class="field-row">${th("panel.languageLabel")}
        <select data-setting="language">${languageOptions}</select>
      </label>
      <p><button type="button" class="xp-button" data-action="translate">${th("panel.helpTranslate")}</button></p>
    </fieldset>`;

  container.addEventListener("input", (e) => {
    const input = e.target.closest("[data-setting]");
    if (!input) return;
    let value = input.value;
    if (input.type === "checkbox") value = input.checked;
    if (input.type === "range") value = Number(input.value);
    Settings.set(input.dataset.setting, value);
  });

  container.addEventListener("click", (e) => {
    const action = e.target.closest("[data-action]")?.dataset.action;
    if (action === "reset") Settings.reset();
    if (action === "toggle-music") AudioPlayer.toggle();
    if (action === "prev-track") AudioPlayer.previous();
    if (action === "next-track") AudioPlayer.next();
    if (action === "translate") openTranslateDialog(container);
  });

  function sync() {
    container.querySelectorAll("[data-setting]").forEach((input) => {
      const key = input.dataset.setting;
      const current = key === "language" ? I18n.getCurrent() : Settings.get(key);
      if (input.type === "checkbox") input.checked = current;
      else if (input.type === "radio") input.checked = input.value === current;
      else input.value = current;
    });

    const toggle = container.querySelector('[data-action="toggle-music"]');
    const playing = AudioPlayer.isPlaying();
    toggle.innerHTML = `<img class="icon-sm" src="assets/icons/player/${playing ? "pause" : "play"}.png" alt="">${th(playing ? "panel.pause" : "panel.play")}`;
    toggle.disabled = !Settings.get("musicEnabled");
    container.querySelectorAll('[data-action="prev-track"], [data-action="next-track"]').forEach((button) => {
      button.disabled = !Settings.get("musicEnabled");
    });
    container.querySelector("[data-now-playing]").textContent = AudioPlayer.status();
  }

  const stops = [];
  function refresh() {
    if (!container.isConnected) {
      stops.forEach((stop) => stop());
      return;
    }
    sync();
  }

  stops.push(Settings.subscribe(refresh), AudioPlayer.onChange(refresh));
  sync();
};
