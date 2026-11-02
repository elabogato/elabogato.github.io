const views = {};

const emptyNote = () => `<p class="empty">${th("common.empty")}</p>`;

function statusLabel(status) {
  const key = `status.${status}`;
  return I18n.has(key) ? t(key) : status;
}

function categoryLabel(code) {
  const key = `category.${code}`;
  return I18n.has(key) ? t(key) : code;
}

function projectCards(projects) {
  if (!projects.length) return `<p class="empty">${th("projects.none")}</p>`;
  return projects.map((project) => `
    <article class="card">
      <img class="card-image" src="${escapeHTML(project.image || "assets/icons/projects.png")}" alt="" loading="lazy">
      <div class="card-body">
        <h3>${escapeHTML(project.name)}</h3>
        <p>${escapeHTML(loc(project.description))}</p>
        <p class="meta"><strong>${th("projects.role")}:</strong> ${escapeHTML(loc(project.role))}</p>
        <p class="meta">
          <span class="badge">${escapeHTML(statusLabel(project.status))}</span>
          ${project.url ? `<a href="${safeUrl(project.url)}" target="_blank" rel="noopener noreferrer">${th("projects.view")}</a>` : ""}
        </p>
      </div>
    </article>`).join("");
}

function gameCards(games) {
  if (!games.length) return `<p class="empty">${th("games.none")}</p>`;
  return games.map((game) => `
    <article class="card">
      <img class="card-image" src="${escapeHTML(game.cover || "assets/icons/games.png")}" alt="" loading="lazy">
      <div class="card-body">
        <h3>${escapeHTML(game.name)}</h3>
        <p class="meta">${escapeHTML(game.platform)}</p>
        <p>${escapeHTML(loc(game.description))}</p>
        <p class="meta">
          <span class="badge">${escapeHTML(t(`gamestatus.${game.status}`))}</span>
          ${game.url ? `<a href="${safeUrl(game.url)}" target="_blank" rel="noopener noreferrer">${th("games.official")}</a>` : ""}
        </p>
      </div>
    </article>`).join("");
}

function linkItems(items, labelKey) {
  if (!items.length) return emptyNote();
  const rows = items.map((item) => `
    <li>
      <span class="badge">${escapeHTML(loc(item[labelKey]))}</span>
      <a href="${safeUrl(item.url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(loc(item.title))}</a>
    </li>`).join("");
  return `<ul class="link-list">${rows}</ul>`;
}

function bindFilter(container, items, field, paint) {
  container.querySelector("[data-filter]").addEventListener("input", (e) => {
    const value = e.target.value;
    const visible = value ? items.filter((item) => item[field] === value) : items;
    container.querySelector("[data-list]").innerHTML = paint(visible);
  });
}

views.about = (container) => renderInto(container, async () => {
  const site = await loadJSON("data/site.json");
  const { about } = site;
  const list = (items) => items.map((item) => `<li>${escapeHTML(loc(item))}</li>`).join("");

  return `
    <div class="profile">
      <img class="profile-avatar" src="${escapeHTML(site.avatar)}" alt="${escapeHTML(t("about.avatarAlt", { name: site.name }))}">
      <div>
        <h2>${escapeHTML(site.name)}</h2>
        <p>${escapeHTML(loc(about.tagline))}</p>
      </div>
    </div>
    <p>${escapeHTML(loc(about.description))}</p>
    <h3>${th("about.activities")}</h3>
    <ul>${list(about.activities)}</ul>
    <h3>${th("about.skills")}</h3>
    <ul>${list(about.skills)}</ul>
    <h3>${th("about.journey")}</h3>
    <p>${escapeHTML(loc(about.journey))}</p>`;
});

views.projects = async (container) => {
  let data = null;

  const rendered = await renderInto(container, async () => {
    data = await loadJSON("data/projects.json");
    const options = data.categories
      .map((code) => `<option value="${escapeHTML(code)}">${escapeHTML(categoryLabel(code))}</option>`)
      .join("");
    return `
      <label class="field">${th("projects.category")}
        <select data-filter><option value="">${th("projects.all")}</option>${options}</select>
      </label>
      <div class="card-list" data-list>${projectCards(data.projects)}</div>`;
  });

  if (rendered) bindFilter(container, data.projects, "category", projectCards);
};

views.socials = async (container) => {
  let socials = [];
  let creditsText = "";

  container.addEventListener("click", (e) => {
    const button = e.target.closest("button[data-action]");
    if (!button) return;
    if (button.dataset.action === "copy-credits") copyWithFeedback(button, creditsText);
    if (button.dataset.action === "copy-link") copyWithFeedback(button, socials[Number(button.dataset.index)].url);
  });

  await renderInto(container, async () => {
    const [site, list] = await Promise.all([
      loadJSON("data/site.json"),
      loadJSON("data/socials.json")
    ]);
    socials = list;
    creditsText = buildCreditsText(site, list);

    const cards = list.map((social, index) => `
      <article class="card">
        <img class="card-icon" src="${escapeHTML(social.icon || "assets/icons/socials/link.png")}" alt="">
        <div class="card-body">
          <h3>${escapeHTML(social.name)}</h3>
          <p class="meta">${escapeHTML(social.username)}</p>
          ${social.description ? `<p>${escapeHTML(loc(social.description))}</p>` : ""}
          <p class="actions">
            <a class="xp-button" href="${safeUrl(social.url)}" target="_blank" rel="noopener noreferrer">${th("socials.open")}</a>
            <button type="button" class="xp-button" data-action="copy-link" data-index="${index}">${th("socials.copyLink")}</button>
          </p>
        </div>
      </article>`).join("");

    return `
      <p class="actions">
        <button type="button" class="xp-button primary" data-action="copy-credits">${th("socials.copyCredits")}</button>
      </p>
      <div class="card-list">${cards}</div>`;
  });
};

views.media = (container) => renderInto(container, async () => {
  const [site, socials] = await Promise.all([
    loadJSON("data/site.json"),
    loadJSON("data/socials.json")
  ]);
  const { media } = site;

  const videos = media.videos
    .filter((video) => /^[\w-]{11}$/.test(video.youtubeId))
    .map((video) => `
      <figure class="video">
        <iframe src="https://www.youtube-nocookie.com/embed/${video.youtubeId}"
          title="${escapeHTML(loc(video.title))}" loading="lazy"
          referrerpolicy="strict-origin-when-cross-origin"
          allow="encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>
        <figcaption>${escapeHTML(loc(video.title))}</figcaption>
      </figure>`).join("");

  const platforms = socials
    .filter((social) => media.platforms.includes(social.id))
    .map((social) => ({ title: social.name, url: social.url, platform: social.username }));

  return `
    <h3>${th("media.videos")}</h3>
    ${videos || emptyNote()}
    <h3>${th("media.music")}</h3>
    ${linkItems(media.music, "type")}
    <h3>${th("media.posts")}</h3>
    ${linkItems(media.posts, "platform")}
    <h3>${th("media.platforms")}</h3>
    ${linkItems(platforms, "platform")}`;
});

views.games = async (container) => {
  let games = [];

  const rendered = await renderInto(container, async () => {
    games = await loadJSON("data/games.json");
    return `
      <label class="field">${th("games.status")}
        <select data-filter>
          <option value="">${th("games.all")}</option>
          <option value="playing">${th("gamestatus.playing")}</option>
          <option value="finished">${th("gamestatus.finished")}</option>
          <option value="favorite">${th("gamestatus.favorite")}</option>
        </select>
      </label>
      <div class="card-list" data-list>${gameCards(games)}</div>`;
  });

  if (rendered) bindFilter(container, games, "status", gameCards);
};

views.support = (container) => renderInto(container, async () => {
  const { support } = await loadJSON("data/site.json");
  const steps = support.howTo.map((step) => `<li>${escapeHTML(loc(step))}</li>`).join("");
  const { goal } = support;
  const goalBlock = goal && goal.target > 0
    ? `<h3>${escapeHTML(loc(goal.label))}</h3>
       <progress value="${Number(goal.current)}" max="${Number(goal.target)}"></progress>
       <p class="meta">${Number(goal.current)} / ${Number(goal.target)} ${escapeHTML(goal.unit || "")}</p>`
    : "";

  return `
    <p>${escapeHTML(loc(support.intro))}</p>
    <h3>${th("support.how")}</h3>
    <ol>${steps}</ol>
    ${goalBlock}
    <p class="actions">
      <a class="xp-button primary" href="${safeUrl(support.kofiUrl)}" target="_blank" rel="noopener noreferrer">
        <img class="icon-sm" src="assets/icons/socials/kofi.png" alt="">${th("support.button")}
      </a>
    </p>
    <p class="meta">${th("support.note")}</p>`;
});

views.credits = async (container) => {
  if (await renderCredits(container)) {
    container.insertAdjacentHTML(
      "beforeend",
      `<p><a href="credits.html" target="_blank" rel="noopener noreferrer">${th("credits.standalone")}</a></p>`
    );
  }
};
