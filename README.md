# Kevin Sam — Personal portfolio

A responsive, dependency-free website built with HTML, CSS, and progressive enhancement for slide navigation. It is deployed on Netlify at [kevinsam.netlify.app](https://kevinsam.netlify.app/).

## Local preview

From this directory, run:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Then open http://127.0.0.1:8000.

## Files

- `index.html`: portfolio content, navigation, accessible native experience disclosures.
- `styles.css`: responsive layout, conceptual project illustrations, reduced-motion support.
- `script.js`: slide switching, animated transitions, URL/history navigation, active navigation state, mobile menu, delayed next-slide hint, and current footer year.
- `assets/kevin-sam.jpg`: web-sized copy of the supplied portrait.
- `output/pdf/Kevin_Sam_CV_2026.pdf`: approved updated résumé, used by both download links.

Original résumé files are preserved. All project summaries are based on the supplied résumé; illustrations are conceptual, not product screenshots. No third-party scripts or tracking is configured.

## Navigation

Home (portrait), Work, Experience, About, and Contact are individual slides. Use the desktop navigation or mobile Menu to select a slide or return to an earlier one. The next-slide button appears after 3.2 seconds on Home and gently pulses. On mobile, longer slides scroll internally so all content remains accessible. Direct section URLs and browser history are supported. Reduced-motion preferences disable transitions and pulsing. Without JavaScript, sections remain available as a standard page.

Desktop slides use viewport-sized layouts with no scrolling. Work uses four compact illustrated cards; Experience uses an exclusive role selector with a detail panel. Mobile keeps scrollable slides and native expandable experience entries. The home next-slide button is left-aligned with the introduction.

Unity logo: Devicon project, https://github.com/devicons/devicon/blob/master/icons/unity/unity-original.svg (Unity trademark belongs to its owner).
