# Doshi

Learn Japanese vocabulary at a steady pace.

## Overview

Doshi is a Japanese vocabulary app for iOS and Android — a cleaner, friendlier alternative to
Anki aimed at beginners. Anki is powerful but its defaults, terminology, and settings
surface assume you already know how spaced repetition works. Doshi's bet is the
opposite: steady-pace learning should be what you get out of the box, for everyone,
with no configuration.

The core learning loop works — lessons, FSRS reviews and local progress — on
development data, with simple scheduling settings. Accounts, sync and shippable
vocabulary content are not built yet (see Status).

## Goals

- Make a beginner productive within a minute of opening the app, with zero setup.
- Ship a scientifically-grounded review schedule as the default, not as an option.
- Keep the review loop fast enough to do on a phone, in a queue, one-handed.
- Be honest and legible about what every setting does to your learning.
- Native on iOS and Android from one codebase. Web is not a target.

## Design principles

1. **Simple and delightful.** A small number of screens, restrained visuals, and a
   review flow that feels quick rather than administrative.
2. **Great defaults.** A beginner should never have to configure a scheduler to get a
   good outcome. Settings are an escape hatch, not a prerequisite.
3. **Total clarity.** Any setting we do expose explains, in plain language, what it
   changes about your learning and what the tradeoff is — no raw algorithm parameters
   presented without context.

## Approach

### Vocabulary data

The word list is planned to start from the Anki **Kaishi 1.5k** deck, a widely-used
starter deck for Japanese learners, built into a structured dataset with fields for:

| Field | Example |
| --- | --- |
| Expression | 新しい |
| Reading | あたらしい |
| Meaning | new |
| Part of speech | i-adjective |
| Example sentence | 新しい本を買った。 |
| Audio | word and/or sentence audio |

> **Licensing — Kaishi 1.5k has no license.** Checked November 2026 against
> [donkuri/Kaishi](https://github.com/donkuri/Kaishi) (release v2.4.3): there is no
> LICENSE file and no license on the repository, so all rights are reserved by default.
> Its README also says the data was "mostly taken from Core2k, Core10k, Tango N4 and
> Tango N5" and that "the sentences themselves come from various Core decks" — sources
> that are not openly licensed either. Its audio comes from those decks and the AJT
> Japanese add-on, and its pictures from Irasutoya (which has its own usage terms).
>
> What this means (not legal advice):
>
> - **Do not ship** Kaishi's meanings, example sentences, sentence translations, audio
>   or pictures in any distributed build.
> - **Word + reading** (e.g. 新しい / あたらしい) is low risk — single words and their
>   readings are facts. The **selection and order** of the list is a gray area
>   (compilations can be protected in some jurisdictions); get legal advice before
>   shipping Kaishi's exact list and order.
> - Candidate openly licensed sources for everything else: **JMdict** (EDRDG, CC BY-SA
>   4.0) for meanings and parts of speech, **Tatoeba** (mostly CC BY 2.0 FR) for example
>   sentences, and text-to-speech or commissioned recordings for audio. Each needs its
>   attribution added in the app. Not decided yet.
>
> `scripts/extract-kaishi-words.py` extracts **only** the word and reading, in deck
> order, from a local copy of the deck into `data/source/kaishi-words.json`.
> `scripts/match-jmdict-meanings.py` then looks up an English meaning and part of speech
> for each word in JMdict (via [jmdict-simplified](https://github.com/scriptin/jmdict-simplified))
> into `data/source/kaishi-meanings.json`. The automatic match takes the first applicable
> dictionary sense, which is sometimes not the intended one (e.g. いる → "to be needed"),
> so it needs a hand review before real use; `OVERRIDES` in the script holds corrections,
> and the script lists ambiguous matches to check. `data/source/` is gitignored and is for
> local development only.
>
> **Example sentences are switched off for now**: the app shows none. When they come
> back, `scripts/match-tatoeba-examples.py` can pick one sentence and translation per
> word from [Tatoeba](https://tatoeba.org) (CC BY 2.0 FR) into
> `data/source/kaishi-examples.json`. It only accepts short, family-friendly sentences
> that spell the word as the app shows it. A hand review of every pick is saved in
> `data/source/kaishi-example-picks.json` (word → Tatoeba sentence, or none); back it up
> if you need to keep it.
>
> To study the full deck (meanings, sentences, notes, pitch accent, audio and pictures)
> while you work, run `python3 -I scripts/kaishi-browser.py <path/to/Kaishi.apkg>`. It
> serves a searchable page on `127.0.0.1` only, reads the deck straight from the .apkg,
> and writes nothing. It shows Doshi's JMdict meaning next to Kaishi's when
> `kaishi-meanings.json` is present. It's for reference: don't copy what it shows into
> the app or the repo.

### Scheduling (SRS)

The scheduling engine is **FSRS** (Free Spaced Repetition Scheduler), a modern,
research-backed replacement for the SM-2 family of algorithms:

- Defaults are tuned for Japanese beginners — 90% desired retention, 10 new words a
  day, and a daily limit of 100 reviews that keeps the workload steady instead of
  spiky. Everyone gets a good pace with zero setup.
- A **Study pace** screen, one tap in from Settings, offers **minimal** scheduling
  settings — a few preset choices for each of the highest-impact parameters:
  - **Recall target** (desired retention: 85, 90 or 95%) — how often you want to recall
    a word correctly. Higher means more reviews per day; lower means fewer reviews but
    more forgetting. Applies from each word's next review.
  - **New words a day** (5, 10, 15 or 20, in whole lessons) — how fast you take on new
    vocabulary. Raising it today raises your review load for weeks afterwards.
  - **Daily review limit** (50, 100, 200 or none) — the ceiling on how long a day's
    reviews can get. A limit keeps days predictable but pushes overdue words further
    back; the most overdue are reviewed first.

  Each has a plain-language note on what it does and its tradeoff. Raw FSRS weights
  are not exposed.

### Interface

A review flow that is faster and less cluttered than Anki on a phone: large, legible
cards; grading reachable with one thumb; minimal chrome; no modal settings in the
middle of a session.

## Tech stack

| Piece | Choice |
| --- | --- |
| Framework | [Expo](https://expo.dev) SDK 58.0.0 |
| Runtime | React Native 0.88, New Architecture (the SDK 58 default) |
| Language | TypeScript |
| Routing | [Expo Router](https://docs.expo.dev/router/introduction/) (file-based) |
| Styling | React Native `StyleSheet` + design tokens — no styling libraries |
| Package manager | pnpm |

**On styling:** there is no NativeWind, Tailwind, styled-components, or other styling
library. Every design value — colors, spacing, radii, type sizes and weights — lives in
`constants/theme.ts` and is consumed through plain `StyleSheet.create` objects. This
keeps rendering consistent and predictable across dev and release builds, with no
extra build step or runtime style engine to go wrong.

The palette is **Tailwind Zinc** for neutrals with a **Tailwind Rose** brand accent
(`#e11d48`, pressed `#be123c`). Light and dark palettes are selected from the OS
appearance via `useColorScheme`. The accent is defined in exactly one place, so
rebranding means editing three hex values.

## Project structure

```
doshi/
├── app/                    # Expo Router routes — every file here is a screen
│   ├── _layout.tsx         # Root layout: Stack, safe-area + gesture providers, status bar
│   └── index.tsx           # Landing screen (the only screen so far)
├── assets/
│   └── images/             # App icon, splash icon, Android adaptive icon
├── constants/
│   └── theme.ts            # The single source of truth for all design tokens
├── hooks/
│   └── use-theme.ts        # Resolves the active palette from the OS color scheme
├── app.json                # Expo app config (icons, splash, plugins, experiments)
├── eslint.config.js        # eslint-config-expo (flat config)
├── tsconfig.json           # Strict TypeScript, `@/*` path alias
├── .npmrc                  # node-linker=hoisted (required for pnpm + React Native)
├── .nvmrc                  # Node 22
└── pnpm-workspace.yaml     # pnpm build-script approvals
```

## Getting started

### Prerequisites

- **Node.js 22.13.0 or newer** — the minimum for Expo SDK 58. The repo pins a major
  version in [`.nvmrc`](.nvmrc), so `nvm use` picks it up, and `package.json` declares
  it under `engines`.
- **pnpm** (v10+).
- **Xcode 26.4 or newer** for iOS builds, with at least one iOS simulator installed.
- Android Studio if you want to build for Android.

### A note on `.npmrc`

pnpm's default symlinked `node_modules` layout breaks React Native's Metro bundler and
native module resolution, which both expect a flat tree. The repo therefore ships an
[`.npmrc`](.npmrc) containing:

```
node-linker=hoisted
```

This must be in place **before** you install dependencies. If you ever wipe
`node_modules`, keep this file.

`pnpm-workspace.yaml` separately allow-lists the one transitive dependency
(`unrs-resolver`, via `eslint-config-expo`) that needs to run a postinstall script;
pnpm blocks build scripts by default.

### Install and run

```bash
pnpm install          # install dependencies
pnpm start            # start the Expo dev server
```

Then pick a target, either from the dev server's interactive menu (`i` / `a`) or
directly:

```bash
pnpm ios              # open in the iOS Simulator
pnpm android          # open on an Android device/emulator
```

Useful checks:

```bash
pnpm typecheck        # tsc --noEmit
pnpm lint             # eslint via expo lint
npx expo-doctor       # diagnose dependency and config issues
npx expo install --fix  # realign package versions with the SDK
```

Everything currently runs in **Expo Go**, including local storage: `expo-sqlite` and
`expo-crypto` are both bundled in Expo Go. A development build is only needed once a
native module that Expo Go doesn't include is added.

> Running Expo's CLI through `npx` prints
> `npm warn Unknown project config "node-linker"`. It is harmless — npm doesn't
> recognise the pnpm-specific setting in `.npmrc`. Use `pnpm exec` instead of `npx` to
> avoid it.

## Roadmap

| Phase | Milestone | Status |
| --- | --- | --- |
| 0 | **Skeleton** — Expo + Router + TypeScript project, theme tokens, landing screen | ✅ Done |
| 1 | **Data pipeline + card model** — structured word dataset, card schema, local storage | 🟡 Storage and card model done; content not shippable yet (licensing) |
| 2 | **FSRS review engine** — scheduling, grading, beginner-tuned defaults | ✅ Done (ts-fsrs, FSRS-6) |
| 3 | **Review UI** — the fast mobile review loop | ✅ First version (lessons, quick check, reviews) |
| 4 | **Simple scheduling settings** — the three high-impact parameters, explained in plain language | ✅ Done (Study pace, in Settings) |
| 5 | **Accounts + sync** — multi-device progress | Not started |

## Open questions and caveats

- **Content sources** — Kaishi 1.5k has no license (see Vocabulary data). Open: whether
  to ship Kaishi's word list and order (needs legal advice), and where meanings and
  example sentences come from (JMdict and Tatoeba are the candidates).
- **Audio** — Kaishi's audio can't be used. Open: text-to-speech, commissioned
  recordings, or no audio at first; and whether to bundle it or download on demand.
  Bundling affects app size significantly.
- **FSRS** — *decided:* the `ts-fsrs` library, wrapped in `lib/srs/scheduler.ts` so it
  can be swapped. Pinned to the FSRS-6 model (whole-day scheduling), 0.9 desired
  retention, no short-term learning steps.
- **Storage** — *decided:* local-first with `expo-sqlite`. The append-only review log is
  the record of truth, so a future sync can merge devices by combining logs and
  replaying them.
- **Auth provider** — TBD, and only relevant from phase 5.
- **Feedback colors** — the Rose brand accent is close to a conventional "error" red.
  Review grades (especially *Again*) and destructive actions need their own semantic
  color, distinct from the brand accent, so that a failed recall doesn't read as the
  same signal as a primary action. The semantic palette is **TBD** and deliberately not
  defined in `constants/theme.ts` yet.

## Status

**Early — first working loop.** On iOS: lessons of 5 new words (10 a day by default)
with a quick check, FSRS-scheduled reviews, and progress saved on the device. A Settings
tab covers study pace (new words, review limit, recall target), hiragana reading level
and romaji. Development builds have tools on Home to move time forward and reset
progress. Not built yet: accounts and sync, audio, and shippable vocabulary content (the
development word list comes from the unlicensed Kaishi deck and stays local).
