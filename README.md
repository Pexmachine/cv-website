# Kevin Sam — Personal portfolio

A responsive, dependency-free portfolio built with HTML, CSS, and progressive enhancement. Its continuous page presents Home, Work, Experience, About, and Contact, with the supplied reference palette structure: light blue (`#D9EAFA`) replaces grey, peach (`#F6BC7C`) replaces violet, and charcoal (`#151611`) replaces black. White surfaces, muted greys, lavender details, and green detection indicators remain secondary colours. Its typography and layout adapt the supplied [portfolio reference](https://marcel-apitty-wcopilot.webflow.io/) and its [style guide](https://marcel-apitty-wcopilot.webflow.io/templates/style-guide).

The existing Netlify deployment is [kevinsam.netlify.app](https://kevinsam.netlify.app/). The site needs no build step, backend, model service, or third-party tracking.

## Local preview

From this directory, run:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Then open [127.0.0.1:8000](http://127.0.0.1:8000). Deploy the directory as static files; keep the `assets/` and `output/pdf/` paths intact.

## Interaction regression checks

Run the dependency-free behavioral tests with Node.js:

```sh
node --test tests/interactions.test.cjs
```

The tests exercise the production script with controlled DOM events and animation timing. They cover menu dismissal, native anchor/history preservation, forecast replay and scrubbing, visibility pauses, reduced motion, railway selection, automatic looping, repeatable scroll fades, and native palette selection and persistence. Browser checks verify responsive layout, scrolling, and native controls.

## Colour palettes

Use the colour selector in the sticky header (the two-tone circle on phones) to switch between **Peach & blue**, **Navy & cream**, and **Violet & grey**. This uses a native select control so mouse, keyboard, and phone selection use the browser's built-in behaviour. The choice is saved locally in this browser and restored on later visits. If local storage is unavailable, switching still works for the current visit. Without JavaScript, blue and peach remain the readable default.

All page and demo colours use the semantic CSS variables in the palette definitions at the top of `styles.css`. Dark text on peach cards and light text on the dark contact section have separate colour tokens. To add a palette, copy a definition block with a new `html[data-palette]` value, and add a corresponding option to `#palette-select` in `index.html` with that value and a `data-theme-color` for browser chrome. No JavaScript changes are needed. To change the default, update the `<html data-palette>`, selected option, and theme-colour meta tag in `index.html`, and the `:root` default selector in `styles.css`.

## Navigation and accessibility

The sticky header uses native section anchors, so direct links and browser back/forward navigation work. Scrolling updates the active navigation state without changing the URL. On phones, the Menu button opens navigation; selecting a link or pressing Escape closes it. Experience entries use native expandable disclosures.

Content remains readable without JavaScript. Project demos provide keyboard and touch controls alongside hover interactions. Reduced-motion preferences suppress decorative movement and show immediate demo states. All four simulations start automatically, loop while visible, and preserve their progress while offscreen or in a hidden browser tab. Pointer, touch, keyboard, and slider interaction pause automatic playback; it resumes three seconds after the last activity. Replay buttons immediately play a single manual preview before automatic looping resumes. Section content fades from soft blur to sharp focus over 1.1 seconds, with a subtle 24px upward lift as it enters the viewport. It stays fully visible while being read and resets only once completely offscreen. The treatment is inspired by the supplied [Yugen Agency reference](https://yugen-agency.com/). The portrait retains its original colours in every interaction state. The fade repeats when a section returns to view.

## Project previews

All four previews are illustrative simulations using local data. They do not run the original project models, expose production results, or make real object-detection claims.

- **Forecasting:** the forecast automatically loops while visible. Replay restarts it; the timeline slider selects progress directly and automatic playback resumes from there after three seconds without interaction. The observations, forecast, and uncertainty band are simulated.
- **Railway detection:** an automatic preview cycles through the objects while visible. Hovering or focusing an object previews its bounding box and fixed illustrative confidence. Clicking or tapping holds a selection for inspection until three seconds of inactivity restores the automatic scan. Object buttons provide an alternative to image targets; Reset or Escape clears the selection. The full image framing is preserved so normalized annotations align at every size.
- **RAG workflow:** a visible preview continuously loops through document context, retrieval, AI, and an illustrative answer.
- **VR locomotion:** a visible preview continuously loops through a stylized hand gesture and movement, alongside Unity branding.

## Files and asset provenance

- `index.html`: portfolio content, semantic navigation, project previews, and experience disclosures.
- `styles.css`: responsive layouts, locally hosted typography, interaction states, and reduced-motion support.
- `script.js`: menu controls, scroll-aware navigation, scroll-triggered fades, and simulated demo playback.
- `assets/kevin-professional.jpg`: web-sized copy of the requested outdoor portrait; the original `assets/professional_picture.jpeg` is preserved.
- `assets/fonts/Satoshi-Variable.woff2`: official unmodified Satoshi normal webfont from [Fontshare](https://www.fontshare.com/fonts/satoshi), designed by Deni Anggara and distributed by Indian Type Foundry, supporting weights 300–900. The full vendor-supplied ITF Free Font License is included in `assets/fonts/FFL.txt`; see `assets/fonts/README.md` for download provenance.
- `assets/railway-scene.webp`: an original scene generated with the built-in ImageGen tool, manually annotated for the simulated detection interaction. The complete prompt and annotation coordinates are recorded in `assets/railway-scene-source.md`. It is an illustration, not an Infrabel production image.
- `assets/unity.svg`: [Devicon Unity logo](https://github.com/devicons/devicon/blob/master/icons/unity/unity-original.svg); the Unity trademark belongs to its owner.
- `output/pdf/Kevin_Sam_CV_2026.pdf`: approved updated résumé used by the download links. Original résumé files are preserved.

Project summaries retain the professional content of the supplied résumé. The reference website informed styling; its images and font files were not copied.
