/**
 * TextUtils — Editorial Text Editor & Formatting Toolkit
 * All text processing happens locally in the browser.
 */

(() => {
  'use strict';

  /* ========================================================================
     DOM Elements
     ======================================================================== */
  const htmlEl = document.documentElement;
  const themeToggleBtn = document.getElementById('themeToggle');
  const themeLabel = document.getElementById('themeLabel');
  const brandLogo = document.getElementById('brandLogo');
  const navClearBtn = document.getElementById('navClearBtn');

  // Tabs & Tool Panels
  const tabBtns = document.querySelectorAll('.tab-btn');
  const toolPanels = document.querySelectorAll('.tool-group');
  const toolBtns = document.querySelectorAll('.tool-btn[data-tool]');
  const textDependentControls = document.querySelectorAll('.requires-text');

  // Editor & Toolbar
  const textEditor = document.getElementById('textEditor');
  const editorStatus = document.getElementById('editorStatus');
  const editorInlineCounts = document.getElementById('editorInlineCounts');
  const editorFeedback = document.getElementById('editorFeedback');
  const loadSampleBtn = document.getElementById('loadSampleBtn');

  const btnPaste = document.getElementById('btnPaste');
  const btnUndo = document.getElementById('btnUndo');
  const btnRedo = document.getElementById('btnRedo');
  const btnMonoToggle = document.getElementById('btnMonoToggle');
  const btnSelectAll = document.getElementById('btnSelectAll');
  const btnCopy = document.getElementById('btnCopy');
  const btnDownload = document.getElementById('btnDownload');
  const btnClear = document.getElementById('btnClear');

  // Clear Confirmation Banner
  const clearConfirmBar = document.getElementById('clearConfirmBar');
  const clearConfirmMessage = document.getElementById('clearConfirmMessage');
  const confirmClearBtn = document.getElementById('confirmClearBtn');
  const cancelClearBtn = document.getElementById('cancelClearBtn');

  // Inline Drawers & Toggles
  const toggleFindReplaceBtn = document.getElementById('toggleFindReplaceBtn');
  const toggleDedupeWordsBtn = document.getElementById('toggleDedupeWordsBtn');
  const toggleListConverterBtn = document.getElementById('toggleListConverterBtn');
  const cleanupDedupeWordsShortcut = document.getElementById('cleanupDedupeWordsShortcut');
  const formatListConverterShortcut = document.getElementById('formatListConverterShortcut');
  const drawerCloseBtns = document.querySelectorAll('[data-close-drawer]');

  const drawerFindReplace = document.getElementById('drawerFindReplace');
  const findInput = document.getElementById('findInput');
  const replaceInput = document.getElementById('replaceInput');
  const matchCaseCheckbox = document.getElementById('matchCaseCheckbox');
  const wholeWordCheckbox = document.getElementById('wholeWordCheckbox');
  const matchCountBadge = document.getElementById('matchCountBadge');
  const replaceOneBtn = document.getElementById('replaceOneBtn');

  const drawerDedupeWords = document.getElementById('drawerDedupeWords');
  const dedupeWordsCaseCheckbox = document.getElementById('dedupeWordsCaseCheckbox');
  const applyDedupeWordsBtn = document.getElementById('applyDedupeWordsBtn');

  const drawerListConverter = document.getElementById('drawerListConverter');
  const listSeparatorSelect = document.getElementById('listSeparatorSelect');
  const customSeparatorInput = document.getElementById('customSeparatorInput');
  const listOutputFormatSelect = document.getElementById('listOutputFormatSelect');
  const applyListConvertBtn = document.getElementById('applyListConvertBtn');

  // Statistics
  const statWords = document.getElementById('statWords');
  const statChars = document.getElementById('statChars');
  const statNoSpaces = document.getElementById('statNoSpaces');
  const statSentences = document.getElementById('statSentences');
  const statParagraphs = document.getElementById('statParagraphs');
  const statLines = document.getElementById('statLines');
  const statReadingTime = document.getElementById('statReadingTime');

  // Character Limits
  const limitConfigs = {
    x: {
      defaultLimit: 280,
      input: document.getElementById('limitInputX'),
      remaining: document.getElementById('limitRemainingX'),
      fill: document.getElementById('limitFillX'),
      item: document.querySelector('[data-limit-key="x"]')
    },
    instagram: {
      defaultLimit: 2200,
      input: document.getElementById('limitInputInstagram'),
      remaining: document.getElementById('limitRemainingInstagram'),
      fill: document.getElementById('limitFillInstagram'),
      item: document.querySelector('[data-limit-key="instagram"]')
    },
    custom: {
      defaultLimit: 500,
      input: document.getElementById('limitInputCustom'),
      remaining: document.getElementById('limitRemainingCustom'),
      fill: document.getElementById('limitFillCustom'),
      item: document.querySelector('[data-limit-key="custom"]')
    }
  };

  const toastContainer = document.getElementById('toastContainer');

  /* ========================================================================
     State & Constants
     ======================================================================== */
  const THEME_STORAGE_KEY = 'textutils-theme';
  const MONO_STORAGE_KEY = 'textutils-mono';
  const LIMITS_STORAGE_KEY = 'textutils-limits';
  const MAX_HISTORY = 40;
  const LARGE_CLEAR_THRESHOLD = 150;

  const undoStack = [];
  const redoStack = [];

  const drawers = [
    { el: drawerFindReplace, toggleBtn: toggleFindReplaceBtn, focusEl: findInput },
    { el: drawerDedupeWords, toggleBtn: toggleDedupeWordsBtn, focusEl: applyDedupeWordsBtn },
    { el: drawerListConverter, toggleBtn: toggleListConverterBtn, focusEl: listSeparatorSelect }
  ];

  /* ========================================================================
     Unicode & String Helpers
     ======================================================================== */
  function splitGraphemes(str) {
    if (typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function') {
      const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
      return Array.from(segmenter.segment(str), (seg) => seg.segment);
    }
    return Array.from(str);
  }

  function escapeRegExp(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /* ========================================================================
     Theme & Font Preference Management
     ======================================================================== */
  function initPreferences() {
    let savedTheme = 'light';
    let savedMono = false;

    try {
      const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
      if (storedTheme === 'light' || storedTheme === 'dark') {
        savedTheme = storedTheme;
      }
      savedMono = localStorage.getItem(MONO_STORAGE_KEY) === 'true';

      const storedLimits = localStorage.getItem(LIMITS_STORAGE_KEY);
      if (storedLimits) {
        const parsed = JSON.parse(storedLimits);
        for (const [key, cfg] of Object.entries(limitConfigs)) {
          const val = Number(parsed?.[key]);
          if (Number.isFinite(val) && val >= 1 && val <= 100000) {
            cfg.input.value = String(Math.round(val));
          }
        }
      }
    } catch {
      // Ignore storage failures in restricted contexts
    }

    applyTheme(savedTheme, false);
    applyMonoFont(savedMono, false);
  }

  function applyTheme(theme, persist = true) {
    htmlEl.setAttribute('data-theme', theme);
    const nextLabel = theme === 'light' ? 'Dark' : 'Light';
    themeLabel.textContent = nextLabel;
    themeToggleBtn.setAttribute('aria-label', `Switch to ${nextLabel.toLowerCase()} theme`);

    if (persist) {
      try {
        localStorage.setItem(THEME_STORAGE_KEY, theme);
      } catch {
        // Ignore storage error
      }
    }
  }

  function toggleTheme() {
    const current = htmlEl.getAttribute('data-theme') || 'light';
    const next = current === 'light' ? 'dark' : 'light';
    applyTheme(next, true);
    setFeedback(`Switched to ${next} theme.`);
  }

  function applyMonoFont(isMono, persist = true) {
    textEditor.classList.toggle('is-mono', isMono);
    btnMonoToggle.classList.toggle('is-active', isMono);
    btnMonoToggle.setAttribute('aria-pressed', String(isMono));

    if (persist) {
      try {
        localStorage.setItem(MONO_STORAGE_KEY, String(isMono));
      } catch {
        // Ignore storage error
      }
    }
  }

  function saveLimitsPreference() {
    const payload = {};
    for (const [key, cfg] of Object.entries(limitConfigs)) {
      const num = parseInt(cfg.input.value, 10);
      payload[key] = Number.isFinite(num) && num >= 1 ? num : cfg.defaultLimit;
    }
    try {
      localStorage.setItem(LIMITS_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore storage error
    }
  }

  /* ========================================================================
     Category Tabs & Drawers
     ======================================================================== */
  function activateCategoryTab(category) {
    tabBtns.forEach((btn) => {
      const isSelected = btn.dataset.category === category;
      btn.classList.toggle('active', isSelected);
      btn.setAttribute('aria-selected', String(isSelected));
    });

    toolPanels.forEach((panel) => {
      panel.hidden = panel.dataset.panel !== category;
    });
  }

  tabBtns.forEach((btn, index) => {
    btn.addEventListener('click', () => {
      activateCategoryTab(btn.dataset.category);
    });

    btn.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        event.preventDefault();
        const dir = event.key === 'ArrowRight' ? 1 : -1;
        const nextIndex = (index + dir + tabBtns.length) % tabBtns.length;
        const nextTab = tabBtns[nextIndex];
        activateCategoryTab(nextTab.dataset.category);
        nextTab.focus();
      }
    });
  });

  function closeAllDrawers() {
    drawers.forEach(({ el, toggleBtn }) => {
      el.hidden = true;
      toggleBtn.setAttribute('aria-expanded', 'false');
    });
  }

  function toggleDrawer(targetEl, forceOpen = null) {
    const entry = drawers.find((d) => d.el === targetEl);
    if (!entry) return;

    const shouldOpen = forceOpen !== null ? forceOpen : entry.el.hidden;
    closeAllDrawers();

    if (shouldOpen) {
      entry.el.hidden = false;
      entry.toggleBtn.setAttribute('aria-expanded', 'true');
      if (entry.el === drawerFindReplace) {
        updateMatchPreview();
      }
      if (entry.focusEl && typeof entry.focusEl.focus === 'function') {
        entry.focusEl.focus();
      }
    }
  }

  toggleFindReplaceBtn.addEventListener('click', () => toggleDrawer(drawerFindReplace));
  toggleDedupeWordsBtn.addEventListener('click', () => toggleDrawer(drawerDedupeWords));
  toggleListConverterBtn.addEventListener('click', () => toggleDrawer(drawerListConverter));
  cleanupDedupeWordsShortcut.addEventListener('click', () => toggleDrawer(drawerDedupeWords, true));
  formatListConverterShortcut.addEventListener('click', () => toggleDrawer(drawerListConverter, true));

  drawerCloseBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      closeAllDrawers();
      textEditor.focus();
    });
  });

  /* ========================================================================
     Live Statistics & Character Limits
     ======================================================================== */
  function computeStatistics(text) {
    if (!text) {
      return {
        words: 0,
        chars: 0,
        noSpaces: 0,
        sentences: 0,
        paragraphs: 0,
        lines: 0,
        readingTime: '0 sec'
      };
    }

    const chars = splitGraphemes(text).length;
    const noSpaces = splitGraphemes(text.replace(/\s/g, '')).length;
    const trimmed = text.trim();
    const words = trimmed.length > 0 ? trimmed.split(/\s+/).length : 0;

    let sentences = 0;
    if (trimmed.length > 0) {
      const segments = trimmed
        .split(/[.!?]+(?=\s|$)/)
        .filter((seg) => /[\p{L}\p{N}]/u.test(seg));
      sentences = segments.length > 0 ? segments.length : (/\S/.test(trimmed) ? 1 : 0);
    }

    const lines = text.split(/\r?\n/).length;
    const paragraphs =
      trimmed.length > 0
        ? text.split(/\r?\n/).filter((line) => line.trim().length > 0).length
        : 0;

    let readingTime = '0 sec';
    if (words > 0) {
      const totalSeconds = Math.max(1, Math.ceil((words / 200) * 60));
      if (totalSeconds < 60) {
        readingTime = `${totalSeconds} sec`;
      } else {
        const mins = Math.ceil(totalSeconds / 60);
        readingTime = `${mins} min`;
      }
    }

    return {
      words,
      chars,
      noSpaces,
      sentences,
      paragraphs,
      lines,
      readingTime
    };
  }

  function updateCharacterLimits(charCount) {
    for (const cfg of Object.values(limitConfigs)) {
      let maxChars = parseInt(cfg.input.value, 10);
      if (!Number.isFinite(maxChars) || maxChars < 1) {
        maxChars = cfg.defaultLimit;
      }

      const remaining = maxChars - charCount;
      const pct = Math.min(100, (charCount / maxChars) * 100);

      if (remaining >= 0) {
        cfg.remaining.textContent = `${remaining.toLocaleString()} left`;
      } else {
        cfg.remaining.textContent = `${Math.abs(remaining).toLocaleString()} over`;
      }

      cfg.fill.style.width = `${pct}%`;
      cfg.item.classList.toggle('is-over', remaining < 0);
      cfg.item.classList.toggle('is-warning', remaining >= 0 && pct >= 85);
    }
  }

  function updateEditorState() {
    const text = textEditor.value;
    const hasText = text.length > 0;
    const stats = computeStatistics(text);

    // Statistics panel
    statWords.textContent = stats.words.toLocaleString();
    statChars.textContent = stats.chars.toLocaleString();
    statNoSpaces.textContent = stats.noSpaces.toLocaleString();
    statSentences.textContent = stats.sentences.toLocaleString();
    statParagraphs.textContent = stats.paragraphs.toLocaleString();
    statLines.textContent = stats.lines.toLocaleString();
    statReadingTime.textContent = stats.readingTime;

    // Editor header counts & status
    const wordUnit = stats.words === 1 ? 'word' : 'words';
    const charUnit = stats.chars === 1 ? 'char' : 'chars';
    editorInlineCounts.textContent = `${stats.words.toLocaleString()} ${wordUnit} · ${stats.chars.toLocaleString()} ${charUnit}`;

    editorStatus.setAttribute('data-has-text', String(hasText));
    editorStatus.textContent = hasText ? 'Ready' : 'Empty';

    // Character limits
    updateCharacterLimits(stats.chars);

    // Enable/disable controls
    textDependentControls.forEach((ctrl) => {
      ctrl.disabled = !hasText;
    });

    btnUndo.disabled = undoStack.length === 0;
    btnRedo.disabled = redoStack.length === 0;

    if (!hasText && !clearConfirmBar.hidden) {
      clearConfirmBar.hidden = true;
    }

    if (!drawerFindReplace.hidden) {
      updateMatchPreview();
    }
  }

  function setFeedback(message) {
    editorFeedback.textContent = message;
  }

  /* ========================================================================
     Undo / Redo History
     ======================================================================== */
  function pushUndoState(previousText) {
    if (undoStack.length > 0 && undoStack[undoStack.length - 1] === previousText) {
      return;
    }
    undoStack.push(previousText);
    if (undoStack.length > MAX_HISTORY) {
      undoStack.shift();
    }
    redoStack.length = 0;
  }

  function performUndo() {
    if (undoStack.length === 0) {
      showToast('Nothing to undo', 'warning');
      return;
    }
    const currentText = textEditor.value;
    const previousText = undoStack.pop();
    redoStack.push(currentText);

    textEditor.value = previousText;
    updateEditorState();
    textEditor.focus();
    setFeedback('Restored previous text.');
    showToast('Undid last change', 'info');
  }

  function performRedo() {
    if (redoStack.length === 0) {
      showToast('Nothing to redo', 'warning');
      return;
    }
    const currentText = textEditor.value;
    const nextText = redoStack.pop();
    undoStack.push(currentText);

    textEditor.value = nextText;
    updateEditorState();
    textEditor.focus();
    setFeedback('Reapplied change.');
    showToast('Redid change', 'info');
  }

  function applyEditorTransformation(nextText, message, includeUndoToast = false) {
    const currentText = textEditor.value;
    if (nextText === currentText) {
      setFeedback('No changes needed for this text.');
      showToast('No changes needed', 'info');
      return false;
    }

    pushUndoState(currentText);
    textEditor.value = nextText;
    updateEditorState();
    setFeedback(message);
    showToast(message, 'success', includeUndoToast);
    return true;
  }

  /* ========================================================================
     Text Transformations (Case, Cleanup, Transform, Format)
     ======================================================================== */
  function stripListPrefix(line) {
    return line.replace(/^\s*(?:\d+[.)]\s+|[-*•]\s+)/, '');
  }

  const transformations = {
    // Case
    uppercase: (text) => text.toUpperCase(),

    lowercase: (text) => text.toLowerCase(),

    titlecase: (text) =>
      text.replace(/\S+/g, (word) =>
        word.toLowerCase().replace(/\p{L}/u, (char) => char.toUpperCase())
      ),

    sentencecase: (text) =>
      text
        .toLowerCase()
        .replace(/(^\s*|[.!?]+\s*|\r?\n+\s*)([^\p{L}\p{N}]*\p{L})/gu, (m, prefix, start) =>
          prefix + start.replace(/\p{L}/u, (char) => char.toUpperCase())
        ),

    capitalizeeach: (text) =>
      text
        .toLowerCase()
        .replace(/(^|[^\p{L}\p{N}'’])(\p{L})/gu, (m, sep, char) => sep + char.toUpperCase()),

    // Cleanup
    removeextraspaces: (text) =>
      text
        .replace(/\r\n?/g, '\n')
        .split('\n')
        .map((line) => line.replace(/[ \t]+/g, ' ').trim())
        .join('\n')
        .replace(/\n{3,}/g, '\n\n')
        .replace(/^\n+|\n+$/g, ''),

    removeallspaces: (text) => text.replace(/\s+/g, ''),

    removeEmptyLines: (text) =>
      text
        .split(/\r?\n/)
        .filter((line) => line.trim().length > 0)
        .join('\n'),

    removeLineBreaks: (text) => text.replace(/\r?\n+/g, ' '),

    removePunctuation: (text) => text.replace(/\p{P}/gu, ''),

    removeDuplicateLines: (text) => {
      const seen = new Set();
      const result = [];
      for (const line of text.split(/\r?\n/)) {
        if (!seen.has(line)) {
          seen.add(line);
          result.push(line);
        }
      }
      return result.join('\n');
    },

    // Transform
    reverseText: (text) => splitGraphemes(text).reverse().join(''),

    reverseEachWord: (text) =>
      text.replace(/\S+/g, (word) => splitGraphemes(word).reverse().join('')),

    sortLinesAZ: (text) =>
      text
        .split(/\r?\n/)
        .sort((a, b) => {
          const cmp = a.localeCompare(b, undefined, { sensitivity: 'base', numeric: true });
          return cmp !== 0 ? cmp : a.localeCompare(b);
        })
        .join('\n'),

    sortLinesZA: (text) =>
      text
        .split(/\r?\n/)
        .sort((a, b) => {
          const cmp = b.localeCompare(a, undefined, { sensitivity: 'base', numeric: true });
          return cmp !== 0 ? cmp : b.localeCompare(a);
        })
        .join('\n'),

    spacesToUnderscores: (text) => text.replace(/ /g, '_'),

    spacesToHyphens: (text) => text.replace(/ /g, '-'),

    underscoresToSpaces: (text) => text.replace(/_/g, ' '),

    addSpacesBetweenChars: (text) =>
      text
        .split(/\r?\n/)
        .map((line) => splitGraphemes(line).join(' '))
        .join('\n'),

    // Format
    numberedList: (text) => {
      let num = 1;
      return text
        .split(/\r?\n/)
        .filter((line) => line.trim().length > 0)
        .map((line) => `${num++}. ${stripListPrefix(line).trim()}`)
        .join('\n');
    },

    bulletedList: (text) =>
      text
        .split(/\r?\n/)
        .filter((line) => line.trim().length > 0)
        .map((line) => `• ${stripListPrefix(line).trim()}`)
        .join('\n'),

    addLineNumbers: (text) =>
      text
        .split(/\r?\n/)
        .map((line, index) => `${index + 1}: ${line}`)
        .join('\n'),

    normalizeParagraphs: (text) =>
      text
        .replace(/\r\n?/g, '\n')
        .split(/\n\s*\n/)
        .map((para) =>
          para
            .split('\n')
            .map((line) => line.replace(/[ \t]+/g, ' ').trim())
            .filter((line) => line.length > 0)
            .join(' ')
        )
        .filter((para) => para.length > 0)
        .join('\n\n')
  };

  const toolMessages = {
    uppercase: 'Converted to UPPERCASE.',
    lowercase: 'Converted to lowercase.',
    titlecase: 'Converted to Title Case.',
    sentencecase: 'Converted to Sentence case.',
    capitalizeeach: 'Capitalized each word.',
    removeextraspaces: 'Removed extra spaces.',
    removeallspaces: 'Removed all spaces.',
    removeEmptyLines: 'Removed empty lines.',
    removeLineBreaks: 'Removed line breaks.',
    removePunctuation: 'Removed punctuation.',
    removeDuplicateLines: 'Removed duplicate lines.',
    reverseText: 'Reversed text.',
    reverseEachWord: 'Reversed each word.',
    sortLinesAZ: 'Sorted lines A to Z.',
    sortLinesZA: 'Sorted lines Z to A.',
    spacesToUnderscores: 'Replaced spaces with underscores.',
    spacesToHyphens: 'Replaced spaces with hyphens.',
    underscoresToSpaces: 'Replaced underscores with spaces.',
    addSpacesBetweenChars: 'Added spaces between characters.',
    numberedList: 'Formatted as numbered list.',
    bulletedList: 'Formatted as bulleted list.',
    addLineNumbers: 'Added line numbers.',
    normalizeParagraphs: 'Normalized paragraphs.'
  };

  toolBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.tool;
      const fn = transformations[key];
      if (!fn) return;
      if (!textEditor.value) {
        showToast('Enter some text first', 'warning');
        return;
      }
      applyEditorTransformation(fn(textEditor.value), toolMessages[key] || 'Applied transformation.');
    });
  });

  /* ========================================================================
     Feature A: Duplicate Word Remover
     ======================================================================== */
  function removeDuplicateWords(text, caseSensitive) {
    const seen = new Set();
    return text
      .split(/\r?\n/)
      .map((line) => {
        const leadingMatch = line.match(/^\s*/);
        const leadingSpace = leadingMatch ? leadingMatch[0] : '';
        const trimmedLine = line.trim();
        if (!trimmedLine) return '';

        const tokens = trimmedLine.split(/\s+/);
        const kept = [];

        for (const token of tokens) {
          const core = token.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');
          if (!core) {
            kept.push(token);
            continue;
          }
          const lookupKey = caseSensitive ? core : core.toLowerCase();
          if (!seen.has(lookupKey)) {
            seen.add(lookupKey);
            kept.push(token);
          }
        }
        return leadingSpace + kept.join(' ');
      })
      .join('\n');
  }

  applyDedupeWordsBtn.addEventListener('click', () => {
    const text = textEditor.value;
    if (!text) return;
    const caseSensitive = dedupeWordsCaseCheckbox.checked;
    const nextText = removeDuplicateWords(text, caseSensitive);
    applyEditorTransformation(nextText, 'Removed duplicate words.');
  });

  /* ========================================================================
     Feature B: Text to List Converter
     ======================================================================== */
  listSeparatorSelect.addEventListener('change', () => {
    const isCustom = listSeparatorSelect.value === 'custom';
    customSeparatorInput.hidden = !isCustom;
    if (isCustom) {
      customSeparatorInput.focus();
    }
  });

  function convertTextToList(text, splitBy, customSeparator, outputFormat) {
    let splitter = /\r?\n+/;
    if (splitBy === 'comma') splitter = /,/;
    else if (splitBy === 'space') splitter = /\s+/;
    else if (splitBy === 'semicolon') splitter = /;/;
    else if (splitBy === 'custom' && customSeparator) {
      splitter = new RegExp(escapeRegExp(customSeparator));
    }

    const items = text
      .split(splitter)
      .map((item) => stripListPrefix(item).trim())
      .filter((item) => item.length > 0);

    if (items.length === 0) return text;

    if (outputFormat === 'numbered') {
      return items.map((item, idx) => `${idx + 1}. ${item}`).join('\n');
    }
    if (outputFormat === 'bulleted') {
      return items.map((item) => `• ${item}`).join('\n');
    }
    if (outputFormat === 'comma') {
      return items.join(', ');
    }
    return items.join('\n');
  }

  applyListConvertBtn.addEventListener('click', () => {
    const text = textEditor.value;
    if (!text) return;

    const splitBy = listSeparatorSelect.value;
    const customSep = customSeparatorInput.value;
    if (splitBy === 'custom' && !customSep) {
      showToast('Enter a custom separator first', 'warning');
      customSeparatorInput.focus();
      return;
    }

    const outputFormat = listOutputFormatSelect.value;
    const nextText = convertTextToList(text, splitBy, customSep, outputFormat);
    applyEditorTransformation(nextText, 'Converted text to list.');
  });

  /* ========================================================================
     Feature D: Advanced Find & Replace (Inline Drawer)
     ======================================================================== */
  function buildFindRegex(query, matchCase, wholeWords, globalFlag = true) {
    let pattern = escapeRegExp(query);
    if (wholeWords) {
      const startsWithWord = /^[\p{L}\p{N}_]/u.test(query);
      const endsWithWord = /[\p{L}\p{N}_]$/u.test(query);
      const leftBoundary = startsWithWord ? '(?<![\\p{L}\\p{N}_])' : '';
      const rightBoundary = endsWithWord ? '(?![\\p{L}\\p{N}_])' : '';
      pattern = `${leftBoundary}${pattern}${rightBoundary}`;
    }
    const flags = `${globalFlag ? 'g' : ''}${matchCase ? '' : 'i'}u`;
    return new RegExp(pattern, flags);
  }

  function updateMatchPreview() {
    const query = findInput.value;
    const text = textEditor.value;

    if (!query || !text) {
      matchCountBadge.textContent = '0 matches';
      return;
    }

    const regex = buildFindRegex(query, matchCaseCheckbox.checked, wholeWordCheckbox.checked, true);
    const matches = text.match(regex);
    const count = matches ? matches.length : 0;
    matchCountBadge.textContent = count === 1 ? '1 match' : `${count} matches`;
  }

  function replaceNextOccurrence() {
    const query = findInput.value;
    const replacement = replaceInput.value;
    const text = textEditor.value;

    if (!query) {
      showToast('Enter text to find', 'warning');
      findInput.focus();
      return;
    }

    if (!text) {
      showToast('Editor is empty', 'warning');
      return;
    }

    const regex = buildFindRegex(query, matchCaseCheckbox.checked, wholeWordCheckbox.checked, true);
    const matches = [...text.matchAll(regex)];

    if (matches.length === 0) {
      setFeedback(`No matches found for "${query}".`);
      showToast(`No matches found for "${query}"`, 'warning');
      return;
    }

    const cursorStart = textEditor.selectionStart ?? 0;
    let targetMatch = matches.find((m) => m.index >= cursorStart);
    if (!targetMatch) {
      targetMatch = matches[0];
    }

    const matchIndex = targetMatch.index;
    const matchLength = targetMatch[0].length;
    const nextText = text.slice(0, matchIndex) + replacement + text.slice(matchIndex + matchLength);

    if (applyEditorTransformation(nextText, 'Replaced 1 occurrence.')) {
      const selEnd = matchIndex + replacement.length;
      textEditor.setSelectionRange(matchIndex, selEnd);
      updateMatchPreview();
    }
  }

  findInput.addEventListener('input', updateMatchPreview);
  matchCaseCheckbox.addEventListener('change', updateMatchPreview);
  wholeWordCheckbox.addEventListener('change', updateMatchPreview);
  replaceOneBtn.addEventListener('click', replaceNextOccurrence);

  drawerFindReplace.addEventListener('submit', (event) => {
    event.preventDefault();
    const query = findInput.value;
    const replacement = replaceInput.value;
    const text = textEditor.value;

    if (!query) {
      showToast('Enter text to find', 'warning');
      findInput.focus();
      return;
    }

    if (!text) {
      showToast('Editor is empty', 'warning');
      return;
    }

    const regex = buildFindRegex(query, matchCaseCheckbox.checked, wholeWordCheckbox.checked, true);
    const matches = text.match(regex);
    if (!matches || matches.length === 0) {
      setFeedback(`No matches found for "${query}".`);
      showToast(`No matches found for "${query}"`, 'warning');
      return;
    }

    const count = matches.length;
    const nextText = text.replace(regex, () => replacement);
    const unit = count === 1 ? 'occurrence' : 'occurrences';
    applyEditorTransformation(nextText, `Replaced ${count} ${unit}.`);
    updateMatchPreview();
  });

  /* ========================================================================
     Clipboard, Download, Select All, Clear (with confirmation)
     ======================================================================== */
  async function copyEditorText() {
    const text = textEditor.value;
    if (!text) return;

    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(text);
        setFeedback('Copied text to clipboard.');
        showToast('Copied to clipboard', 'success');
        return;
      }
    } catch {
      // Fallback below
    }

    try {
      const temp = document.createElement('textarea');
      temp.value = text;
      temp.setAttribute('readonly', '');
      temp.style.position = 'fixed';
      temp.style.left = '-9999px';
      document.body.appendChild(temp);
      temp.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(temp);

      if (ok) {
        setFeedback('Copied text to clipboard.');
        showToast('Copied to clipboard', 'success');
      } else {
        showToast('Copy blocked — press Ctrl+C manually', 'error');
      }
    } catch {
      showToast('Copy failed — press Ctrl+C manually', 'error');
    }
  }

  async function pasteFromClipboard() {
    if (!navigator.clipboard || typeof navigator.clipboard.readText !== 'function') {
      textEditor.focus();
      showToast('Use Ctrl+V inside the editor to paste', 'info');
      return;
    }

    try {
      const clipText = await navigator.clipboard.readText();
      if (!clipText) {
        showToast('Clipboard is empty', 'info');
        return;
      }

      const prev = textEditor.value;
      const start = textEditor.selectionStart ?? prev.length;
      const end = textEditor.selectionEnd ?? prev.length;
      const next = prev.slice(0, start) + clipText + prev.slice(end);

      pushUndoState(prev);
      textEditor.value = next;
      updateEditorState();
      textEditor.focus();
      const pos = start + clipText.length;
      textEditor.setSelectionRange(pos, pos);

      setFeedback('Pasted text from clipboard.');
      showToast('Pasted from clipboard', 'success');
    } catch {
      textEditor.focus();
      showToast('Clipboard permission denied — press Ctrl+V', 'warning');
    }
  }

  function downloadEditorText() {
    const text = textEditor.value;
    if (!text) return;

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'textutils-output.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setFeedback('Downloaded textutils-output.txt.');
    showToast('Downloaded textutils-output.txt', 'success');
  }

  function selectAllText() {
    if (!textEditor.value) return;
    textEditor.focus();
    textEditor.select();
    textEditor.setSelectionRange(0, textEditor.value.length);
    setFeedback('Selected all text.');
  }

  function executeClear() {
    clearConfirmBar.hidden = true;
    applyEditorTransformation('', 'Cleared editor.', true);
    textEditor.focus();
  }

  function requestClear() {
    const text = textEditor.value;
    if (!text) return;

    const charCount = splitGraphemes(text).length;
    if (charCount > LARGE_CLEAR_THRESHOLD) {
      clearConfirmMessage.textContent = `Clear ${charCount.toLocaleString()} characters from the editor?`;
      clearConfirmBar.hidden = false;
      confirmClearBtn.focus();
      return;
    }

    executeClear();
  }

  confirmClearBtn.addEventListener('click', executeClear);
  cancelClearBtn.addEventListener('click', () => {
    clearConfirmBar.hidden = true;
    textEditor.focus();
  });

  /* ========================================================================
     Sample Text & Keyboard Shortcuts
     ======================================================================== */
  loadSampleBtn.addEventListener('click', () => {
    const sample =
      'welcome to TextUtils!   this is a   clean everyday text editor.\n\n' +
      'use it to format messy notes, remove duplicate duplicate words, and check social limits.\n' +
      'Item one\nItem two\nItem two\nItem three';
    applyEditorTransformation(sample, 'Loaded sample text.');
    textEditor.focus();
  });

  document.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'f') {
      event.preventDefault();
      toggleDrawer(drawerFindReplace, true);
      return;
    }

    if (event.key === 'Escape') {
      if (!clearConfirmBar.hidden) {
        clearConfirmBar.hidden = true;
        textEditor.focus();
      } else if (drawers.some((d) => !d.el.hidden)) {
        closeAllDrawers();
        textEditor.focus();
      }
    }
  });

  /* ========================================================================
     Toast Notification System
     ======================================================================== */
  function showToast(message, type = 'info', includeUndo = false) {
    while (toastContainer.children.length >= 2) {
      toastContainer.removeChild(toastContainer.firstChild);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'status');

    const dot = document.createElement('span');
    dot.className = 'toast-dot';
    dot.setAttribute('aria-hidden', 'true');

    const msg = document.createElement('span');
    msg.textContent = message;

    toast.appendChild(dot);
    toast.appendChild(msg);

    if (includeUndo && undoStack.length > 0) {
      const undoBtn = document.createElement('button');
      undoBtn.type = 'button';
      undoBtn.className = 'toast-undo-btn';
      undoBtn.textContent = 'Undo';
      undoBtn.addEventListener('click', () => {
        performUndo();
        toast.remove();
      });
      toast.appendChild(undoBtn);
    }

    toastContainer.appendChild(toast);

    window.setTimeout(() => {
      if (toast.parentNode) {
        toast.remove();
      }
    }, includeUndo ? 4200 : 2400);
  }

  /* ========================================================================
     Wire Remaining Listeners & Initialize
     ======================================================================== */
  themeToggleBtn.addEventListener('click', toggleTheme);
  brandLogo.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  btnMonoToggle.addEventListener('click', () => {
    const nextMono = !textEditor.classList.contains('is-mono');
    applyMonoFont(nextMono, true);
  });

  textEditor.addEventListener('input', updateEditorState);

  btnPaste.addEventListener('click', pasteFromClipboard);
  btnUndo.addEventListener('click', performUndo);
  btnRedo.addEventListener('click', performRedo);
  btnSelectAll.addEventListener('click', selectAllText);
  btnCopy.addEventListener('click', copyEditorText);
  btnDownload.addEventListener('click', downloadEditorText);
  btnClear.addEventListener('click', requestClear);
  navClearBtn.addEventListener('click', requestClear);

  for (const cfg of Object.values(limitConfigs)) {
    cfg.input.addEventListener('input', () => {
      saveLimitsPreference();
      updateCharacterLimits(splitGraphemes(textEditor.value).length);
    });
  }

  initPreferences();
  activateCategoryTab('case');
  updateEditorState();
})();
