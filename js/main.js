Settings.init();
AudioPlayer.init();
loadJSON("data/site.json")
  .then((site) => AudioPlayer.load(site.music))
  .catch(() => {});
initDesktop();
I18n.onChange(() => WindowManager.refresh());
I18n.init().then(initLanguagePicker);
