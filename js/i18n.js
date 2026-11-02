const I18n = (() => {
  const FALLBACK = "en";
  const listeners = new Set();
  let languages = [{ code: FALLBACK, name: "English" }];
  let current = FALLBACK;
  let strings = {};
  let fallbackStrings = {};

  function parse(text) {
    const result = {};
    text.replace(/^\uFEFF/, "").split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return;
      const index = trimmed.indexOf("=");
      if (index < 1) return;
      result[trimmed.slice(0, index).trim()] = trimmed.slice(index + 1).trim().replace(/\\n/g, "\n");
    });
    return result;
  }

  async function loadStrings(code) {
    const response = await fetch(`lang/${encodeURIComponent(code)}.lang`);
    if (!response.ok) throw new Error(`lang/${code}.lang: ${response.status}`);
    return parse(await response.text());
  }

  function t(key, vars = {}) {
    const text = strings[key] ?? fallbackStrings[key] ?? key;
    return text.replace(/\{(\w+)\}/g, (match, name) => vars[name] ?? match);
  }

  function has(key) {
    return Object.hasOwn(strings, key) || Object.hasOwn(fallbackStrings, key);
  }

  function localized(value) {
    if (value === null || value === undefined) return "";
    if (typeof value !== "object") return String(value);
    return value[current] ?? value[FALLBACK] ?? Object.values(value)[0] ?? "";
  }

  function translateElement(el) {
    if (el.dataset.i18n) el.textContent = t(el.dataset.i18n);
    if (el.dataset.i18nAttr) {
      el.dataset.i18nAttr.split(";").forEach((pair) => {
        const [attribute, key] = pair.split(":");
        el.setAttribute(attribute, t(key));
      });
    }
  }

  function apply(root) {
    if (root.matches?.("[data-i18n], [data-i18n-attr]")) translateElement(root);
    root.querySelectorAll("[data-i18n], [data-i18n-attr]").forEach(translateElement);
  }

  async function setLanguage(code, notify = true) {
    const known = languages.some((language) => language.code === code);
    const target = known ? code : FALLBACK;
    strings = target === FALLBACK ? fallbackStrings : await loadStrings(target).catch(() => fallbackStrings);
    current = target;
    document.documentElement.lang = target;
    apply(document);
    if (notify) listeners.forEach((listener) => listener());
  }

  async function init() {
    try {
      languages = (await loadJSON("lang/index.json")).languages;
    } catch {
      // se mantiene solo el inglés
    }
    fallbackStrings = await loadStrings(FALLBACK).catch(() => ({}));
    await setLanguage(Settings.get("language"), false);
    Settings.subscribe((key) => {
      if (key === "language" || key === null) setLanguage(Settings.get("language"));
    });
  }

  function onChange(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  return {
    init,
    t,
    has,
    localized,
    apply,
    onChange,
    getLanguages: () => languages,
    getCurrent: () => current
  };
})();

const t = (key, vars) => I18n.t(key, vars);
const th = (key, vars) => escapeHTML(I18n.t(key, vars));
const loc = (value) => I18n.localized(value);
