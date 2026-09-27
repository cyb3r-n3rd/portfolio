# portfolio

Interactive 3D portfolio for **Shivam Verma (cyb3r_n3rd)**: a little neon stall floating in the dark that you can orbit 360°. Click a sign (or an object) and the camera flies into that object's screen:

| Section | Where it lives |
| --- | --- |
| About (About / Skills / Experience tabs) | the monitor inside the stall |
| Projects | the vending machine: pick an item for its details |
| Research | the wall TV on the left side |
| Contact | the arcade cabinet |

Static site, no build step. [Three.js](https://threejs.org) (MIT) is loaded from jsDelivr via an import map.

## Edit the content

All text is in **`js/content.js`**: profile and bio, socials, skills, experience, projects (vending slots), research write-ups and contact channels.

## Run locally

```bash
python3 -m http.server 5173
```

Then open <http://localhost:5173>. Add `?debug` to expose `window.__app` in the console.

## Layout

| Path | What |
| --- | --- |
| `js/content.js` | All portfolio text |
| `js/world.js` | The diorama: stall, signpost, vending machine, arcade, TV, roof clutter, lights |
| `js/textures.js` | Every texture, drawn at runtime on `<canvas>` (signs, screens, walls, mural) |
| `js/ui.js` | The four screen interfaces, built from `content.js` |
| `js/main.js` | Renderer, bloom, orbit controls, fly-to-screen, pinning the UI over the 3D screen |
| `css/style.css` | Start gate, HUD and screen UI styles |

## Assets

All models and textures are original: geometry is built from Three.js primitives and textures are drawn procedurally, so there are no third-party model or image files. Any assets added later should be CC0 (for example from [Kenney](https://kenney.nl/assets)); list them here.

Fonts are loaded from Google Fonts: Quicksand, Press Start 2P and JetBrains Mono, all under the SIL Open Font License (free to use, but not CC0).

## Behaviour

- Deep links: `/#about`, `/#projects`, `/#research`, `/#contact` open straight into that screen after Start. Back/forward work.
- `Esc` or the on-screen back button returns to the street.
- After ~10 s idle the camera slowly drifts around the stall.
- On phones the screens open full-window, keeping their look.
- Without WebGL the screens render as a normal scrolling page.
- `prefers-reduced-motion` makes camera moves instant and stops the idle drift.

## Deploy

GitHub Pages → *Deploy from a branch* → `main` / root. `.nojekyll` is included.
