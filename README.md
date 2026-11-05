# Pocket Lab

A static drum-pattern generator with 24 authored genre studies, an editable sequencer, optional Livepilot-inspired production lenses, browser playback, and MIDI/WAV export.

## Website

[Open Pocket Lab](https://mxpln.github.io/pocket-lab/)

Genre descriptions, Pocket Lab's authored patterns, and optional Livepilot production ideas are presented separately. Livepilot lenses default to off. Every study links to independent musical references; each active lens links to its concept packet.

## Automatic publishing

The [Pages workflow](.github/workflows/pages.yml) runs JavaScript and asset checks plus 20 rhythm-engine tests. It publishes `dist/` to GitHub Pages after successful checks on `main`. Pull requests run checks without deploying. You can also deploy from the Actions tab using **Run workflow**.

GitHub Pages uses **GitHub Actions** as its publishing source. The workflow uses GitHub's built-in token and needs no custom secrets. Official actions are pinned to exact commits; Dependabot checks for action updates monthly.

## Editing and preview

Edit files in `dist/` and push to `main` to publish. No bundler, dependency installation or application server is needed. The fonts are bundled with their license notices.

For local preview, run:

```sh
python -m http.server 8080 --directory dist
```

Open `http://localhost:8080`. Use Node.js 24 or newer for checks:

```sh
npm run check
npm test
```

## Musical scope

Each study has four authored motif families and phrases of 1–8 bars in 4/4. They are musical starting points, not universal definitions of their genres. The Footwork triplet and IDM quintuplet studies explore specific subdivisions. Preview audio is synthesized and does not supply sampled breaks, vocal chops, tuned basslines or full-song arrangement.

MIDI exports use channel 10 with groove timing baked in. WAV is 44.1 kHz, 16-bit, two-channel mono. Saves stay in each browser and do not transfer between website addresses.

## Sources and fonts

- Independent musical references: linked in each study's **References & caveats** panel.
- Optional production concepts: [Livepilot genre packets](https://github.com/dreamrec/LivePilot/tree/main/livepilot/skills/livepilot-core/references/concepts/genres). Lens caps and exact gestures are Pocket Lab adaptations.
- DM Sans and Space Grotesk: bundled in `dist/assets/fonts/` with their SIL Open Font License notices.

No ChatGPT login, Ableton session, API key or generation service is needed to use this website.
