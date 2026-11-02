const WindowManager = (() => {
  const layer = document.getElementById("windows");
  const taskList = document.getElementById("task-list");
  const mobileQuery = window.matchMedia("(max-width: 768px)");
  const instances = new Map();
  let topZ = 10;
  let activeId = null;
  let openCount = 0;

  function open(app) {
    const current = instances.get(app.id);
    if (current) {
      if (current.minimized) restore(app.id);
      UiSounds.play("switch");
      focus(app.id);
      return;
    }

    const el = buildWindow(app);
    const button = buildTaskButton(app);
    const instance = { app, el, button, minimized: false };
    instances.set(app.id, instance);

    layer.appendChild(el);
    taskList.appendChild(button);
    place(el);
    bind(instance);
    focus(app.id);
    el.focus();
    UiSounds.play("open");
    app.render(el.querySelector(".window-content"), app);
  }

  function buildWindow(app) {
    const el = document.createElement("section");
    el.className = "window";
    el.tabIndex = -1;
    el.setAttribute("role", "dialog");
    el.setAttribute("data-i18n-attr", `aria-label:${app.titleKey}`);
    el.innerHTML = `
      <header class="titlebar">
        <img class="icon-sm" src="${app.icon}" alt="">
        <span class="titlebar-text" data-i18n="${app.titleKey}"></span>
        <div class="titlebar-controls">
          <button type="button" data-action="minimize" data-i18n-attr="aria-label:window.minimize">&#8211;</button>
          <button type="button" data-action="maximize">&#9633;</button>
          <button type="button" data-action="close" data-i18n-attr="aria-label:window.close">&#10005;</button>
        </div>
      </header>
      <div class="window-content"></div>
    `;
    I18n.apply(el);
    updateMaximizeLabel(el);
    return el;
  }

  function buildTaskButton(app) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "task-button";
    button.setAttribute("data-i18n-attr", `aria-label:${app.titleKey}`);
    button.innerHTML = `<img class="icon-sm" src="${app.icon}" alt=""><span class="task-label" data-i18n="${app.titleKey}"></span>`;
    I18n.apply(button);
    return button;
  }

  function updateMaximizeLabel(el) {
    const key = el.classList.contains("maximized") ? "window.restore" : "window.maximize";
    el.querySelector('[data-action="maximize"]').setAttribute("aria-label", t(key));
  }

  function place(el) {
    const offset = (openCount++ % 8) * 28;
    const width = Math.min(560, layer.clientWidth - 24);
    const height = Math.min(400, layer.clientHeight - 24);
    el.style.width = `${width}px`;
    el.style.height = `${height}px`;
    el.style.left = `${Math.max(0, Math.min(60 + offset, layer.clientWidth - width))}px`;
    el.style.top = `${Math.max(0, Math.min(40 + offset, layer.clientHeight - height))}px`;
  }

  function bind(instance) {
    const { app, el, button } = instance;
    const titlebar = el.querySelector(".titlebar");

    el.addEventListener("pointerdown", (e) => {
      if (activeId !== app.id && !e.target.closest(".titlebar-controls")) UiSounds.play("switch");
      focus(app.id);
    });

    el.querySelector(".titlebar-controls").addEventListener("click", (e) => {
      const action = e.target.closest("button")?.dataset.action;
      if (action === "minimize") minimize(app.id);
      if (action === "maximize") toggleMaximize(app.id);
      if (action === "close") close(app.id);
    });

    titlebar.addEventListener("dblclick", (e) => {
      if (!e.target.closest("button")) toggleMaximize(app.id);
    });

    titlebar.addEventListener("pointerdown", (e) => startDrag(e, el));

    button.addEventListener("click", () => {
      if (instance.minimized) {
        restore(app.id);
        focus(app.id);
        UiSounds.play("switch");
      } else if (activeId === app.id) {
        minimize(app.id);
      } else {
        focus(app.id);
        UiSounds.play("switch");
      }
    });
  }

  function focus(id) {
    const instance = instances.get(id);
    if (!instance || instance.minimized) return;

    instances.forEach((other) => {
      const isActive = other === instance;
      other.el.classList.toggle("active", isActive);
      other.button.classList.toggle("active", isActive);
    });
    instance.el.style.zIndex = ++topZ;
    activeId = id;
  }

  function focusTopmost() {
    const top = [...instances.values()]
      .filter((i) => !i.minimized)
      .sort((a, b) => a.el.style.zIndex - b.el.style.zIndex)
      .at(-1);
    if (top) focus(top.app.id);
  }

  function minimize(id) {
    const instance = instances.get(id);
    instance.minimized = true;
    instance.el.classList.add("minimized");
    instance.el.classList.remove("active");
    instance.button.classList.remove("active");
    if (activeId === id) {
      activeId = null;
      focusTopmost();
    }
  }

  function restore(id) {
    const instance = instances.get(id);
    instance.minimized = false;
    instance.el.classList.remove("minimized");
  }

  function toggleMaximize(id) {
    const { el } = instances.get(id);
    el.classList.toggle("maximized");
    updateMaximizeLabel(el);
  }

  function close(id) {
    const instance = instances.get(id);
    instance.el.remove();
    instance.button.remove();
    instances.delete(id);
    UiSounds.play("close");
    if (activeId === id) {
      activeId = null;
      focusTopmost();
    }
  }

  function refresh() {
    instances.forEach(({ app, el }) => {
      const fresh = document.createElement("div");
      fresh.className = "window-content";
      el.querySelector(".window-content").replaceWith(fresh);
      updateMaximizeLabel(el);
      app.render(fresh, app);
    });
  }

  function startDrag(e, el) {
    if (e.target.closest("button") || mobileQuery.matches || el.classList.contains("maximized")) return;

    const titlebar = e.currentTarget;
    const offsetX = e.clientX - el.offsetLeft;
    const offsetY = e.clientY - el.offsetTop;
    titlebar.setPointerCapture(e.pointerId);

    const move = (ev) => {
      const minLeft = 80 - el.offsetWidth;
      const maxLeft = layer.clientWidth - 80;
      const maxTop = layer.clientHeight - 32;
      el.style.left = `${Math.min(Math.max(ev.clientX - offsetX, minLeft), maxLeft)}px`;
      el.style.top = `${Math.min(Math.max(ev.clientY - offsetY, 0), maxTop)}px`;
    };

    const stop = () => {
      titlebar.removeEventListener("pointermove", move);
      titlebar.removeEventListener("pointerup", stop);
      titlebar.removeEventListener("pointercancel", stop);
    };

    titlebar.addEventListener("pointermove", move);
    titlebar.addEventListener("pointerup", stop);
    titlebar.addEventListener("pointercancel", stop);
  }

  return { open, refresh };
})();
