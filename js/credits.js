I18n.init().then(() => {
  document.title = t("credits.pageTitle");
  renderCredits(document.getElementById("credits"));
});
