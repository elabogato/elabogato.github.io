# ElAbogato - webpage (previously ElAbogatoOS)

Personal website of ElAbogato, built as a small desktop-style interface (inspired by Windows XP, but with a permanent dark theme that cannot be disabled).
Pure HTML, CSS and JavaScript. No build step, no backend. Hosted on GitHub Pages: https://elabogato.github.io/

*Versión en español más abajo.*

## Run it locally

The site reads JSON and language files with `fetch`, so it must be served over HTTP (opening `index.html` by double click will not work):

```bash
python -m http.server 8000
```

Then open http://localhost:8000

## Structure

```
index.html        desktop
credits.html      standalone credits page
css/              main, desktop, windows, apps, responsive
js/               data, apps, settings, i18n, audio, windows, desktop, main
data/             site.json, socials.json, projects.json, games.json
lang/             index.json, en.lang, es.lang, template.lang
assets/           images, audio, icons
```

## Editing content (no code changes needed)

- `data/site.json`: name, About Me, Support (Ko-fi), music file and Media Player content (videos, music, posts, platforms).
- `data/socials.json`: social networks.
- `data/projects.json`: projects. `category` and `status` use language-neutral codes (see `lang/en.lang`).
- `data/games.json`: games. `status` is `playing`, `finished` or `favorite`.

Any text field can be a plain string or an object per language: `{ "en": "Hello", "es": "Hola" }`.
Videos in Media Player use official YouTube embeds: `{ "title": "...", "youtubeId": "11-character id" }`.

## Required assets (not included)

- `assets/images/wallpaper.jpg` and `assets/images/avatar.png`
- `assets/audio/background.mp3` (music you own or have permission to use)
- PNG icons in `assets/icons/`

## Translations

The interface language is chosen with the selector on the start screen or in Control Panel > Language Settings. English is the default.

Each language is a `lang/<code>.lang` file with `key=value` lines. To add one:

1. Copy `lang/template.lang` (also downloadable from the site) and translate the text after each `=`.
2. Save it as `lang/<code>.lang`.
3. Add an entry to `lang/index.json` with the language name, the translator's name and an icon (for example in `assets/images/translators/`). The translator is credited in the Credits app.

Contributors can open a pull request or send the file and an icon to ElAbogato on Discord.

## Deploy

Settings > Pages > Deploy from a branch > `main` > `/ (root)`. The empty `.nojekyll` file tells GitHub Pages to serve the files as they are.

---

# Versión en español

Página web personal de ElAbogato con forma de pequeño escritorio (Inspirado en Windows XP, pero con un tema oscuro permanente que no se puede desactivar). HTML, CSS y JavaScript sin servidor, alojada en GitHub Pages.

- **Probar en local**: `python -m http.server 8000` y abrir `http://localhost:8000` (no funciona abriendo el HTML directamente).
- **Editar contenido**: archivos de `data/`. Los textos pueden ser un string o un objeto por idioma (`{ "en": "...", "es": "..." }`).
- **Traducir**: copia `lang/template.lang`, traduce lo que va después de cada `=`, guárdalo como `lang/<código>.lang` y añade la entrada en `lang/index.json` con nombre, autor e icono.
- **Publicar**: Settings > Pages > Deploy from a branch > `main` > `/ (root)`.
