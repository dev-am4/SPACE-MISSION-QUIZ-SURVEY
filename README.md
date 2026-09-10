# SPACE MISSION QUIZ & SURVEY

Fullscreen touchscreen kiosk web app for the Digital Certificate Station in the astronomy and space exhibition.

## Current flow

1. Welcome / Start Mission
2. Knowledge Quiz (ข้อ 1–20)
3. Visitor Survey (ข้อ 21, 22, 23, 25, 26)
4. Knowledge score
5. Name entry
6. Digital Certificate
7. Reset for the next visitor

## Source fidelity

The question text and answer choices are copied from the supplied `คำถามแบบทดสอบ.pptx` without rewriting the questions or choices.

**Important:** The supplied source contains question numbers 1–23, then 25 and 26. There is no question 24 in the supplied source. This app intentionally does not invent question 24. If an approved source for question 24 is supplied later, add it to `src/questions.js` exactly as approved.

## Data storage now

Until Supabase is connected, completed sessions are stored locally in the browser under:

`space-mission-quiz-survey:sessions:v1`

The stored session contains question number, selected option index, selected option letter, selected option text, knowledge score, participant name and timestamps.

## Local development

```bash
npm install
npm run dev
```

## Vercel

- Framework Preset: `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

No environment variables are required for the current version.

## Supabase later

A future integration can replace/extend `saveSession()` in `src/App.jsx` so the touchscreen continues to save locally first and syncs completed sessions to Supabase when online. Keep the local fallback so the exhibition station remains usable during network interruptions.

Suggested table shape:

- `id` uuid
- `started_at` timestamptz
- `finished_at` timestamptz
- `participant_name` text
- `knowledge_score` int2
- `answers` jsonb
- `station_id` text
- `synced_at` timestamptz

## Touchscreen/kiosk behavior

- Full viewport UI
- Large touch targets
- No scrolling on normal kiosk resolutions
- Auto reset after 3 minutes of inactivity
- Responsive landscape layout
- Mobile fallback layout
- No backend dependency in the current build
