# PTE Class Coverage Studio

Track PTE Academic question types by class, module, and session. Built for teachers who want a quick, visual snapshot of coverage without a spreadsheet.

## Highlights

- Coverage map by module and question type (72+ marks focus)
- Auto-saved session log with date picker
- One-click export/import backups (JSON)
- Manage classes: add new ones and remove old ones anytime
- Local-first storage, no sign-in required

## How it works

- Pick a class and module tab (Speaking, Writing, Reading, Listening).
- Toggle question types as you cover them in class.
- Use the Session Log to record what you practiced today.
- Optionally auto-mark coverage when you log sessions.

## Manage classes

- Add a class name to create a new class roster.
- Remove a class to delete its coverage and session history.
- At least one class is always kept to avoid empty state issues.

## Data and backups

- Data is stored in `localStorage` for the current browser only.
- Export a JSON backup before clearing browser data or switching devices.
- Import a backup to restore everything (classes, coverage, sessions).

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
