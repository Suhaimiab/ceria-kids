# Ceria Kids 🦜

A cheerful trilingual learning app for 3-4 year olds, consolidating four earlier prototypes
(`belajar-huruf`, `alphabet-trilingual-game`, `trilingual-number-game`, `trilingual-learning-game`)
into one polished, app-store-quality experience.

**Play it live:** https://suhaimiab.github.io/ceria-kids/

## What's inside

- 🔤 **Alphabet** — English & Bahasa Melayu, with a language toggle
- 🔢 **Numbers** — 1 to 20, in English, Arabic and Bahasa Melayu
- 🎨 **Words** — 47 everyday vocabulary items, in all three languages

No build step, no dependencies — plain HTML/CSS/JS, deployed straight from `main` via GitHub Pages.

## Design notes

- Voice narration uses the browser's built-in Web Speech API (`speechSynthesis`), tuned to
  prefer a younger/female-sounding voice per language where the device has one installed.
  Voice availability (especially Malay `ms-MY` and Arabic `ar-SA`) varies by device/browser —
  visuals and emoji feedback are always the primary channel so gameplay never depends on audio.
- Malay and Arabic content was spelling-audited against the original four apps — several
  letter/word/emoji mismatches and mistranslations were fixed during the merge (see commit
  history and inline comments in `js/data/`).
- Tuned for iOS Safari: safe-area insets, no accidental phone-number auto-linking on the
  number choices, no double-tap zoom, and large (96px+) tap targets throughout.

## Local development

```
python -m http.server 8000
```
then open http://localhost:8000
