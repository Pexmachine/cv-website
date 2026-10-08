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

The tests exercise the production script with controlled DOM events and animation timing. They cover menu dismissal, native anchor/history preservation, forecast timeline interaction and scrubbing, anomaly-threshold alerts, visibility pauses, reduced motion, persistent railway selection, user-triggered recurrence search, arm-swing locomotion looping, and repeatable scroll fades. Browser checks verify responsive layout, scrolling, disclosures, and native controls.

## Colour palette

The site uses one peach and blue palette: light blue (`#D9EAFA`), peach (`#F6BC7C`), and charcoal (`#151611`). Semantic colour variables are defined near the top of `styles.css`.

## Navigation and accessibility

The sticky header uses native section anchors, so direct links and browser back/forward navigation work. Scrolling updates the active navigation state without changing the URL. On phones, the Menu button opens navigation; selecting a link or pressing Escape closes it. Experience entries use native expandable disclosures with a smooth height reveal. A brief loading screen fills the KS mark with peach, then fades away; without JavaScript the screen stays hidden and content appears immediately.

Content remains readable without JavaScript. Project demos provide keyboard and touch controls alongside hover interactions. Reduced-motion preferences suppress decorative movement and show immediate demo states. Forecasting and VR locomotion loop automatically while visible and preserve their progress while offscreen or in a hidden browser tab. Only actual timeline interaction pauses forecasting; it resumes three seconds after the final adjustment or pointer release. Railway inspection has no automatic scan, and selected objects remain pinned until cleared. The report search starts only when Send report is pressed, pauses if offscreen, and retains its answer until the next submission. There are no replay buttons. Section content fades from soft blur to sharp focus over 1.1 seconds, with a subtle 24px upward lift as it enters the viewport. It stays fully visible while being read and resets only once completely offscreen. The treatment is inspired by the supplied [Yugen Agency reference](https://yugen-agency.com/). The portrait retains its original colours in every interaction state. The fade repeats when a section returns to view.

## Project previews

All four previews are illustrative simulations using local data. They do not run the original project models, expose production results, or make real object-detection claims.

- **Forecasting:** the forecast automatically loops while visible, holding its completed state for 2.5 seconds before restarting. The timeline slider selects progress directly; a held pointer keeps playback paused, and it resumes three seconds after interaction ends. Merely hovering, focusing, or clicking the illustration does not pause it. An upper limit of 85 marks the anomaly region. When the forecast reaches that limit, the preview displays an anomaly alert and a fictive recommendation to lower the temperature. Scrubbing back below the limit restores the normal state. The observations, forecast, threshold, and recommendation are simulated.
- **Railway detection:** hover or keyboard focus previews an object's bounding box and illustrative confidence. Click or tap pins a selection until another object is selected, the same object is toggled, or Reset/Escape clears it. Markers and object buttons make the interaction discoverable. There is no automatic scanning. Full image framing preserves normalized annotation alignment at every size.
- **Report recurrence search:** a read-only chat report and highlighted Send report button trigger a single simulated search. The illustration follows human-written report → analysis and vectorization → comparison with historical reports in a vector database → ranking and return of three fictive potential recurrences with illustrative similarity scores. Sending again replaces an in-flight request or restarts a completed search. The answer remains visible until another submission. Reduced motion returns the matches immediately; without JavaScript, the report, pipeline, and a static match summary remain readable.
- **VR locomotion:** a first-person road scene illustrates walking-style, alternating arm swings. The hands rest for 1.1 seconds, swing while the viewpoint travels for 4 seconds, then rest for 2.5 seconds before the 7.6-second cycle restarts. A prominent caption overlays the desktop scene and sits beneath the scene on phones to keep the motion visible. Perspective lane markings advance and a tree grows and moves toward the viewer. Clicking or hovering does not pause the loop; it freezes offscreen or in a hidden tab. Reduced motion shows the arrival scene immediately. Unity branding is retained.

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
