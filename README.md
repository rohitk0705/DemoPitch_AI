# DemoPitch AI

DemoPitch AI is a single-page helper for hackathon teams that need a polished, spoken-style demo script in minutes. Provide the five essentials of your project and the app guides Gemini (or any future model) to deliver an introduction-to-closing narrative tuned for a two-minute stage slot.

## Features
- Conversational script outline: Introduction, Problem, Solution, Tech Stack, Learnings, Closing.
- Clean UI with Space Grotesk + JetBrains Mono typography, optimized for mobile and desktop.
- Loading, error, and fallback states so the flow still works without an API key.
- Copy-to-clipboard utility and live word/time estimator targeting ~2 minutes (≈250–270 words).
- Runtime controls for the Gemini API key, hackathon name, and model so you can adapt mid-demo without touching code.
- Dark ↔ bright theme toggle that remembers your choice locally.
- Lightweight vanilla HTML/CSS/JS architecture that can be dropped into any static host.

## Tech stack
- HTML5 for the UI structure and accessibility.
- Vanilla CSS with glassmorphism accents, no external frameworks.
- Vanilla JavaScript for form handling, Gemini calls, clipboard actions, and timing heuristics.

## Run it locally
1. Clone or download the repository.
2. Serve the `DemoPitch_AI` folder with any static server. Popular options:
   - VS Code Live Server extension.
   - `npx serve` (installs temporarily) and visit the printed URL.
   - `python -m http.server 4173` if Python is installed.
3. Open the served address in your browser and start generating scripts.

> Tip: Because this is a static app, you can also open `index.html` directly in a browser while iterating. Use a local server once you need clipboard permissions or API calls (browsers block some features on the `file://` protocol).

## Configure the AI API key & model
1. Paste your Gemini API key into the first field in the UI. It lives only in browser memory for that tab/session.
2. Pick the desired Gemini model (`gemini-2.5-flash`, `gemini-2.5-pro`, `gemini-3-flash-preview`, `gemma-3-12b-it`, etc.) from the dropdown right below the hackathon name field—the select is now grouped by family so it mirrors what `ListModels` returns for your key.
3. Optionally tweak the defaults (`DEFAULT_MODEL`, `DEFAULT_HACKATHON`) inside `script.js` if you want the form to preload different values (the project now ships with `gemini-2.5-flash`).
4. For production/persistent hosting, route the key through a proxy or server-side secret store instead of shipping it in the client.
5. If the key is missing or the request fails, the app auto-generates a deterministic fallback script so you can still present.
6. When Google rolls out new API versions, the client now auto-retries between `v1` and `v1beta`, tries common `-latest`/`-preview`/`-001` suffixes, and surfaces suggestions from `ListModels` if your chosen alias disappears.

## Example input/output
**Input**
- Project name: *SolarSense*
- Problem: *Energy audits are slow, expensive, and require on-site experts.*
- Solution: *We install IoT beacons that stream data into an AI coach for facilities teams.*
- Tech stack: *Supabase, Next.js, Edge Functions, ESP32 sensors, Gemini API.*
- Target users: *Facilities managers at mid-sized campuses.*

**Output excerpt**
> "Hi everyone at the DemoPitch AI Hackathon. We're SolarSense, and for the last 48 hours we've been obsessed with making energy audits as easy as refreshing a dashboard... Under the hood we blend Supabase, Next.js, Edge Functions, ESP32 sensors, and Gemini so the AI coach keeps pace with live telemetry..."

## Notes & next steps
- Use the Hackathon name field (or update `DEFAULT_HACKATHON` in `script.js`) to keep the narration aligned with your stage branding.
- Set `DEFAULT_THEME` in `script.js` if you want the page to boot into light mode for all visitors.
- Tune the `WORDS_PER_MINUTE` constant to match your speaking cadence.
- Add authentication + rate-limiting if you expose this publicly.
