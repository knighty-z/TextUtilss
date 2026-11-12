# TextUtils

A clean, minimalist, browser-based text editor and formatting utility built with pure HTML5, CSS3, and Vanilla JavaScript. Everything runs locally in your browser with no backend, no database, and no external APIs.

---

## Features

### First-Viewport Workspace
- **Distraction-Free Editor** with `Mono` font toggle, `Paste`, `Undo`, `Redo`, `Select All`, `Copy`, `Download` (`textutils-output.txt`), and `Clear` (with inline confirmation for large text).
- **Live Text Statistics**: Words, Characters, Characters (No Spaces), Sentences, Paragraphs, Lines, and Estimated Reading Time.
- **Social & Custom Character Limits**: Live remaining character counters and progress indicators for X (`280`), Instagram (`2,200`), and a configurable Custom limit (`500`), all editable inline and saved in `localStorage`.
- **Light & Dark Themes**: Crisp editorial Light theme (default) and deep charcoal Dark theme with `localStorage` persistence (user text is never stored).

### Organized Text Tools
- **Case**: `UPPERCASE`, `lowercase`, `Title Case`, `Sentence case`, `Capitalize Each Word`
- **Cleanup**: `Remove Extra Spaces`, `Remove All Spaces`, `Remove Empty Lines`, `Remove Line Breaks`, `Remove Punctuation`, `Remove Duplicate Lines`, `Remove Duplicate Words`
- **Transform**: `Reverse Text`, `Reverse Each Word`, `Sort Lines A–Z`, `Sort Lines Z–A`, `Spaces to Underscores`, `Spaces to Hyphens`, `Underscores to Spaces`, `Space Characters`
- **Format**: `Numbered List`, `Bulleted List`, `Add Line Numbers`, `Normalize Paragraphs`, `Text to List Converter`

### Inline Utilities
- **Advanced Find & Replace** (`Ctrl+F`): Live match count, `Match case`, `Whole words`, `Replace Next`, and `Replace All` in a non-blocking inline bar.
- **Duplicate Word Remover**: Removes repeated words while preserving original word order, with case-sensitive and case-insensitive options.
- **Text to List Converter**: Splits text by newlines, commas, spaces, semicolons, or a custom separator and outputs numbered lists, bulleted lists, comma-separated text, or one item per line.

---

## Project Structure

```text
TextUtils/
├── assets/
│   └── logo.svg
├── index.html
├── style.css
├── script.js
└── README.md
```

---

## Running Locally & Deploying to Vercel

- **Local**: Open `index.html` directly in your browser, or run `npx serve .` inside `TextUtils/`.
- **Vercel**: Static site — deploy the `TextUtils` folder directly to Vercel with zero build configuration required.

---

© 2026 TextUtils
