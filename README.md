# portfolio

Interactive 3D portfolio for **Shivam Verma (cyb3r_n3rd)**: a neon street stall on a wet, reflective street at night. Click a sign on the signpost and the camera flies into the stall's monitor, which then shows that section.

Static site, no build step. [Three.js](https://threejs.org) (MIT) is loaded from jsDelivr via an import map.

## Run locally

```bash
python3 -m http.server 5173
```

Then open <http://localhost:5173>. Add `?debug` to expose `window.__app` in the console.

## Layout

| Path | What |
| --- | --- |
| `index.html` | Page shell and **all section content** (`<section data-panel="…">`) |
| `css/style.css` | HUD, loader, the in-screen content overlay, no-WebGL fallback |
| `js/main.js` | Renderer, bloom, camera rig and fly-to, input, hash routing |
| `js/world.js` | The scene: ground reflector, stall, signpost, props, skyline, rain |
| `js/textures.js` | Every texture, drawn at runtime on `<canvas>` |

To add a section: add a `<section id="x" data-panel="x">` in `index.html`, a nav link, and an entry in `SECTIONS` in `js/world.js` (that entry creates the sign).

## Assets

Every model and texture here is original: geometry is built from Three.js primitives and textures are drawn procedurally on canvas, so there are no third-party asset files. Any assets added later should be CC0 (for example from [Kenney](https://kenney.nl/assets)); list them below.

- _None yet._

Fonts are the visitor's system fonts.

## Behaviour

- Deep links: `/#about`, `/#projects`, `/#research`, `/#contact` open straight into that section. Back/forward work.
- `Esc` or **cd ..** returns to the street.
- Without WebGL or JavaScript the content renders as a normal scrolling page.
- `prefers-reduced-motion` turns off rain and makes camera moves instant.

## Deploy

GitHub Pages → *Deploy from a branch* → `main` / root. `.nojekyll` is included.
