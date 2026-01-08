# PTE Class Coverage Studio

Track PTE Academic question types by class, module, and session. Data is stored locally in your browser.

## Features

- Class coverage map by module and question type
- Session log with dates and optional automatic coverage updates
- Export/import JSON backups
- Apple-inspired UI with a clean, focused layout

## Setup

1. Install dependencies:

```bash
npm install
```

2. Start the dev server:

```bash
npm run dev
```

## Notes

- Data is stored in localStorage for this browser only.
- Export a backup before clearing browser data or switching devices.
- Question types are based on the official Pearson PTE Academic test format pages:
  - https://www.pearsonpte.com/pte-academic/test-format/speaking-writing
  - https://www.pearsonpte.com/pte-academic/test-format/reading
  - https://www.pearsonpte.com/pte-academic/test-format/listening
