# PTE Class Coverage Studio

A local-first tracker for PTE Academic class coverage. Monitor question types by module, log sessions, and keep everything organized without spreadsheets.

## Quick links

- Live site: https://scuba3198.github.io/pte-class-coverage/
- Issues: https://github.com/scuba3198/pte-class-coverage/issues

## What it does

- Coverage map by module and question type (72+ marks focus)
- Auto-saved session log with date picker
- Manage classes: add new ones and remove old ones anytime
- Export/import JSON backups
- Works fully offline after first load

## How to use

1. Choose a class and a module tab (Speaking, Writing, Reading, Listening).
2. Toggle question types as you cover them in class.
3. Use the Session Log to record what you practiced today.
4. Optionally auto-mark coverage when you log sessions.

## Data and backups

- Data lives in `localStorage` for the current browser only.
- Export a JSON backup before clearing browser data or switching devices.
- Import a backup to restore classes, coverage, and sessions.

## Development

Install dependencies:

```bash
npm install
```

Start the dev server:

```bash
npm run dev
```

Lint:

```bash
npm run lint
```

Build:

```bash
npm run build
```

## References

Question types are based on the official Pearson PTE Academic test format pages:

- https://www.pearsonpte.com/pte-academic/test-format/speaking-writing
- https://www.pearsonpte.com/pte-academic/test-format/reading
- https://www.pearsonpte.com/pte-academic/test-format/listening
