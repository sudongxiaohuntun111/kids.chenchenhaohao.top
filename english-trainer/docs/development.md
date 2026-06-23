# Development Guide

## Current Prototype

This is a static mobile-first prototype:

- `index.html`: page structure and script includes.
- `style.css`: pixel-style mobile layout.
- `courses.js`: Month 1 course data.
- `script.js`: game state, speech playback, recording, scoring, and navigation.
- `docs/`: product and development documentation.

Run locally:

```powershell
cd D:\codex\english-speaking-trainer
python -m http.server 4173 --bind 127.0.0.1
```

Open:

```text
http://127.0.0.1:4173/
```

## Course Model

The app reads course content from `window.coursePlan` in `courses.js`.

Month 1 currently contains:

- 4 weeks
- 20 learning days
- 5 levels per day
- 100 speaking levels total

Each day has this shape:

```js
{
  week: 1,
  day: 1,
  title: 'Client + Team Basics',
  subtitle: '需求澄清、内部同步、客户回复',
  theme: 'Requirement kickoff',
  levels: []
}
```

Each level has this shape:

```js
{
  level: 'Level 1 of 5',
  title: 'Confirm the Requirement',
  npc: 'Ms. Chen · Bank PM',
  npcLine: 'We need to confirm the reporting requirement before UAT starts.',
  lesson: 'Use “Could you walk me through...” when you want a bank client to explain a requirement step by step.',
  mode: 'Shadowing',
  target: 'Could you walk me through the reporting requirement?',
  hint: '请跟读：你能带我过一下报表需求吗？',
  keywords: ['walk me through', 'requirement', 'reporting'],
  xp: 12,
  routeEmoji: '🧭',
  routeLabel: '看小课'
}
```

## Daily Gameplay

Each day has five small levels:

1. Micro lesson or warm-up.
2. Listening or teammate/client input.
3. Internal question or technical check.
4. Client-facing reply.
5. Manager update or review.

The bottom route buttons are generated from `routeEmoji` and `routeLabel` for each level.

## Progress Storage

The prototype uses `localStorage`:

- `fvq-current-day`: current course day index.
- `fvq-current`: current level index within the day.
- `fvq-xp`: total XP.
- `fvq-completed-days`: completed level indexes by day.
- `fvq-seen-intro`: whether the onboarding screen was dismissed.

No server-side account or cloud sync exists yet.

## Speech and Recording

Playback:

- Uses browser `speechSynthesis`.
- `🔊 目标句` plays the target sentence.
- The NPC play button plays the character line.
- Production should replace browser TTS with recorded audio or higher-quality generated voice.

Recording:

- Uses `MediaRecorder`.
- The user taps once to start and taps again to stop.
- Browser speech recognition records transcript snippets but does not auto-stop the recording.
- The final scoring happens only after the user stops recording.

Scoring:

- Current scoring is keyword/word overlap.
- It is useful for prototype feedback, not real pronunciation scoring.
- Phase 2 should use backend speech-to-text plus meaning evaluation.

## Mobile and Deployment Notes

- Design target is portrait mobile.
- Microphone access generally requires HTTPS, except on localhost.
- Static hosting is enough for this version.
- Upload `index.html`, `style.css`, `script.js`, and `courses.js` together.

## Next Engineering Steps

Recommended next steps:

- Move from static JS to Vite + TypeScript when interactions stabilize.
- Store course data as JSON and add a small content validation script.
- Add real audio assets for NPC and target sentences.
- Add backend AI evaluation for meaning, fluency, and pronunciation.
- Add account login only after the learning loop feels good.
