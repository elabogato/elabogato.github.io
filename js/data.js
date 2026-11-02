const jsonCache = new Map();

function loadJSON(path) {
  if (!jsonCache.has(path)) {
    const request = fetch(path).then((response) => {
      if (!response.ok) throw new Error(`${path}: ${response.status}`);
      return response.json();
    });
    request.catch(() => jsonCache.delete(path));
    jsonCache.set(path, request);
  }
  return jsonCache.get(path);
}

function escapeHTML(value = "") {
  const entities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  return String(value).replace(/[&<>"']/g, (char) => entities[char]);
}

function safeUrl(value) {
  try {
    const url = new URL(value, window.location.href);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : "#";
  } catch {
    return "#";
  }
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

async function copyWithFeedback(button, text) {
  const original = button.textContent;
  const copied = await copyText(text);
  button.textContent = copied ? t("common.copied") : t("common.copyFailed");
  setTimeout(() => {
    button.textContent = original;
  }, 1500);
}

async function renderInto(container, build) {
  container.innerHTML = `<p class="empty">${th("common.loading")}</p>`;
  try {
    container.innerHTML = await build();
    return true;
  } catch {
    container.innerHTML = `<p class="empty">${th("common.loadError")}</p>`;
    return false;
  }
}

function buildCreditsText(site, socials) {
  const lines = [site.name, site.website, ""];
  socials.forEach((social) => lines.push(`${social.name}: ${social.url}`));
  if (site.contactEmail) lines.push("", `${t("credits.contact")}: ${site.contactEmail}`);
  return lines.join("\n");
}

async function renderCredits(container) {
  let text = "";

  const rendered = await renderInto(container, async () => {
    const [site, socials, registry] = await Promise.all([
      loadJSON("data/site.json"),
      loadJSON("data/socials.json"),
      loadJSON("lang/index.json")
    ]);
    text = buildCreditsText(site, socials);

    const links = socials.map((social) => `
      <li>${escapeHTML(social.name)}:
        <a href="${safeUrl(social.url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(social.username)}</a>
      </li>`).join("");

    const email = site.contactEmail
      ? `<p>${th("credits.contact")}: <a href="mailto:${escapeHTML(site.contactEmail)}">${escapeHTML(site.contactEmail)}</a></p>`
      : "";

    const translators = registry.languages
      .filter((language) => language.author)
      .map((language) => `
        <li>
          ${language.icon ? `<img class="icon-sm" src="${escapeHTML(language.icon)}" alt="">` : ""}
          <span>${escapeHTML(t("credits.translatedBy", { language: language.name, author: language.author }))}</span>
        </li>`).join("");

    return `
      <div class="credits">
        <img class="credits-avatar" src="${escapeHTML(site.avatar)}" alt="">
        <h2>${escapeHTML(site.name)}</h2>
        <p><a href="${safeUrl(site.website)}" target="_blank" rel="noopener noreferrer">${escapeHTML(site.website)}</a></p>
        <ul class="link-list">${links}</ul>
        ${email}
        <h3>${th("credits.translations")}</h3>
        <ul class="link-list">${translators}</ul>
        <pre class="credits-text">${escapeHTML(text)}</pre>
        <button type="button" class="xp-button primary" data-action="copy-credits">${th("credits.copy")}</button>
      </div>`;
  });

  if (rendered) {
    const button = container.querySelector('[data-action="copy-credits"]');
    button.addEventListener("click", () => copyWithFeedback(button, text));
  }
  return rendered;
}
