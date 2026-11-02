const AudioPlayer = (() => {
  const audio = new Audio();
  const listeners = new Set();
  let tracks = [];
  let index = 0;
  let failed = false;
  let started = false;

  audio.preload = "none";

  function notify() {
    listeners.forEach((listener) => listener());
  }

  function applyLevels() {
    audio.volume = Settings.get("volume");
    audio.muted = Settings.get("muted");
  }

  function play() {
    audio.play().catch(() => {});
  }

  function pause() {
    audio.pause();
  }

  function select(position, autoplay) {
    if (!tracks.length) return;
    index = (position + tracks.length) % tracks.length;
    audio.src = tracks[index].src;
    failed = false;
    notify();
    if (autoplay) play();
  }

  audio.addEventListener("play", notify);
  audio.addEventListener("pause", notify);
  audio.addEventListener("playing", () => {
    failed = false;
    notify();
  });
  audio.addEventListener("error", () => {
    failed = true;
    notify();
  });
  audio.addEventListener("ended", () => select(index + 1, true));

  function init() {
    applyLevels();
    Settings.subscribe((key) => {
      applyLevels();
      if (!started || (key !== "musicEnabled" && key !== null)) return;
      if (Settings.get("musicEnabled")) play();
      else pause();
    });
  }

  function load(info) {
    tracks = [].concat(info ?? []);
    select(0, started && Settings.get("musicEnabled"));
  }

  function start() {
    started = true;
    if (Settings.get("musicEnabled")) play();
  }

  function toggle() {
    if (audio.paused) play();
    else pause();
  }

  function next() {
    select(index + 1, true);
  }

  function previous() {
    select(index - 1, true);
  }

  function isPlaying() {
    return !audio.paused;
  }

  function status() {
    if (failed) return t("audio.missing");
    const title = loc(tracks[index]?.title);
    const position = tracks.length > 1 ? ` (${index + 1}/${tracks.length})` : "";
    return t(audio.paused ? "audio.paused" : "audio.playing", { title }) + position;
  }

  function onChange(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  return { init, load, start, toggle, next, previous, isPlaying, status, onChange };
})();

const UiSounds = (() => {
  const tones = {
    open: [520, 780],
    close: [780, 520],
    click: [660],
    start: [440, 660],
    switch: [600]
  };
  let context = null;

  function unlock() {
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context) return;
    context ??= new Context();
    if (context.state === "suspended") context.resume();
  }

  function play(name) {
    if (!context || !Settings.get("interfaceSounds") || Settings.get("muted")) return;
    const level = 0.2 * Settings.get("volume");
    if (level < 0.001) return;

    tones[name].forEach((frequency, index) => {
      const start = context.currentTime + index * 0.07;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(level, start);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.12);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.14);
    });
  }

  return { unlock, play };
})();
