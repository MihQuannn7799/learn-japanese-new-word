import { initCatalog } from './catalog.ts';
import { connectNotebook } from './notebook-sync.ts';
import { createAudioPlayer } from './audio.ts';
import { initDialogs } from './dialogs.ts';
import { answerMatches } from '../../shared/kana.ts';
import { createState, currentWord, resetStudyPositions, wordById } from './state.ts';
import { loadNotebook, notebookSnapshot, storeNotebook } from './storage.ts';
import { dictationFeedback, dictationView } from './views/dictation.ts';
import { flashView } from './views/flashcard.ts';
import { readingView, readingWord } from './views/reading.ts';
import { icon, progressPanel, speedFill, speedText, stepper } from './views/shared.ts';
import { rowsView, vocabularyView } from './views/vocabulary.ts';
import { field, query } from './lib/dom.ts';
import type { Feedback, StudyMode } from './types.ts';
import type { StorageStatus } from './notebook-sync.ts';
import './styles/base.css';
import './styles/layout.css';
import './styles/components.css';

const $ = query;
const workspace = $('#workspace');
const notebook = loadNotebook();
let localAvailable = notebook.available;
const sync = await connectNotebook({
  saved: notebook.saved,
  enabled: Boolean(document.querySelector('meta[name="kotoba-backend"]')),
  onStatus: updateStorageNotice,
});
const state = createState(sync.saved);
const audio = createAudioPlayer({ onChange: updateAudioUi, notify: toast });
const dialogs = initDialogs({ state, notify: toast, onChange: refreshAfterEdit });
const openCatalog = initCatalog({ state, openEntry: dialogs.openEntry, notify: toast, onChange: refreshAfterEdit });
let toastTimer: ReturnType<typeof setTimeout> | undefined;
let readExamples = false;

const sections = {
  flash: ['01 / GHI NHỚ', 'Flashcard', 'Nhìn từ tiếng Nhật, thử nhớ nghĩa rồi lật thẻ để kiểm tra.'],
  dictation: ['02 / LUYỆN TAI', 'Nghe chép chính tả', 'Gõ từ nghe được bằng hiragana, katakana hoặc kanji.'],
  reading: ['03 / PHÁT ÂM', 'Chế độ đọc', 'Nghe từng từ hoặc phát liên tiếp từ vị trí đang chọn.'],
  words: ['04 / SỔ TAY', 'Danh sách từ vựng', 'Tra cứu và cập nhật từ tiếng Nhật, nghĩa và kanji.'],
};

function persist() {
  localAvailable = storeNotebook(state);
  sync.save(notebookSnapshot(state));
  if (sync.status === 'local') updateStorageNotice('local');
}

function updateStorageNotice(status: StorageStatus) {
  const messages = {
    server: 'Đã lưu trong SQLite',
    ready: 'SQLite đã kết nối',
    saving: 'Đang lưu vào SQLite…',
    offline: 'SQLite chưa kết nối. Bản nháp được giữ trên trình duyệt nếu trình duyệt cho phép lưu.',
    rejected: 'SQLite từ chối dữ liệu. Bạn có thể tải bản nháp để giữ lại.',
    conflict: 'SQLite có bản mới hơn. Bản nháp này vẫn được giữ riêng.',
    local: localAvailable ? 'Dữ liệu lưu trên trình duyệt này' : 'Lưu trên trình duyệt không khả dụng',
  };
  const notice = $('#storage-status');
  const hasDraft = Boolean(sync.draft?.());
  const needsRecovery = ['conflict', 'rejected', 'offline'].includes(status) && hasDraft;
  if (needsRecovery && notice.textContent !== messages[status]) toast(messages[status]);
  notice.textContent = messages[status];
  $('#storage-recovery').hidden = !needsRecovery;
  $('[data-action="use-server"]').hidden = status !== 'conflict';
  $('[data-action="retry-save"]').hidden = status !== 'offline';
}

function downloadDraft() {
  const draft = sync.draft?.();
  if (!draft) return;
  const url = URL.createObjectURL(new Blob([JSON.stringify(draft, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'kotoba-ban-nhap.json';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function toast(message: string) {
  clearTimeout(toastTimer);
  $('#toast').textContent = message;
  toastTimer = setTimeout(() => { $('#toast').textContent = ''; }, 4500);
}

function updateAudioUi() {
  const status = audio.warning;
  for (const message of document.querySelectorAll<HTMLElement>('[data-voice-message]')) {
    if (message.textContent !== status) message.textContent = status;
    message.hidden = !status;
  }
  const listButtons = document.querySelectorAll<HTMLButtonElement>('[data-action="play-list"]');
  if (!listButtons.length) return;
  for (const button of listButtons) {
    const playing = audio.continuous && button.hasAttribute('data-example') === readExamples;
    if (button.dataset.playing === String(playing)) continue;
    button.dataset.playing = String(playing);
    button.innerHTML = playing ? `${icon('stop')} Dừng đọc` : `${icon('play')} ${button.dataset.label}`;
  }
  if (state.mode === 'reading') {
    const readingStatus = $('#reading-status');
    if (readingStatus.textContent !== audio.status) readingStatus.textContent = audio.status;
    return;
  }
  const previousRow = document.querySelector('.dictation-row.is-speaking');
  const row = audio.active ? $(`#dictation-row-${state.dictationIndex}`) : null;
  if (previousRow !== row) {
    previousRow?.classList.remove('is-speaking');
    row?.classList.add('is-speaking');
  }
  const previousButton = document.querySelector('.dictation-listen[aria-pressed="true"]');
  const button = audio.continuous ? null : row?.querySelector('.dictation-listen') ?? null;
  if (previousButton !== button) {
    previousButton?.setAttribute('aria-pressed', 'false');
    button?.setAttribute('aria-pressed', 'true');
  }
  const progress = $('#dictation-status');
  const label = audio.active ? `Đang đọc từ ${state.dictationIndex + 1} / ${state.words.length}`
    : audio.finished ? 'Đã đọc hết danh sách' : 'Sẵn sàng';
  if (progress.textContent !== label) progress.textContent = label;
}

function render(focusSelector?: string) {
  const { mode, words } = state;
  const playlistScroll = document.querySelector('.playlist')?.scrollTop ?? 0;
  const word = currentWord(state);
  const [section, heading, description] = sections[mode];
  const shuffleButton = mode === 'flash' && words.length > 1
    ? `<button class="btn secondary" data-action="shuffle" id="shuffle-button">${icon('shuffle')} Xáo thẻ</button>` : '';
  const empty = `<div class="empty-state"><h3>Sổ tay chưa có từ</h3><p class="muted">Thêm từ mới hoặc nhập danh sách để bắt đầu.</p>
    <div class="inline-actions"><button class="btn primary" data-action="add">${icon('plus')} Thêm từ mới</button><button class="btn secondary" data-action="import">${icon('upload')} Nhập danh sách</button></div></div>`;
  const content = mode === 'words' ? vocabularyView(state)
    : word ? { flash: flashView, dictation: dictationView, reading: readingView }[mode](state, word) : empty;
  workspace.innerHTML = `<section aria-labelledby="study-title">
    <div class="section-heading"><div><p class="section-kicker">${section}</p><h2 id="study-title" tabindex="-1">${heading}</h2><p>${description}</p></div>${shuffleButton}</div>
    ${content}</section>`;
  $('#hero-count').textContent = `${words.length} từ trong sổ tay`;
  for (const button of document.querySelectorAll<HTMLButtonElement>('.mode')) button.setAttribute('aria-current', String(button.dataset.mode === mode));
  updateAudioUi();
  if (focusSelector) document.querySelector<HTMLElement>(focusSelector)?.focus({ preventScroll: true });
  const playlist = document.querySelector('.playlist');
  if (playlist) playlist.scrollTop = playlistScroll;
}

function updateReadingPosition() {
  const word = currentWord(state);
  if (!word) return;
  $('#reading-word').innerHTML = readingWord(word);
  $('#reading-stepper').innerHTML = stepper(state.readingIndex, state.words.length);
  $('[data-action="speak-example"]').hidden = !word.example;
  const playlist = $('.playlist');
  playlist.querySelector('[aria-current="true"]')?.setAttribute('aria-current', 'false');
  const item = playlist.querySelector(`[data-index="${state.readingIndex}"]`);
  if (!item) return;
  item.setAttribute('aria-current', 'true');
  const bounds = playlist.getBoundingClientRect();
  const selected = item.getBoundingClientRect();
  playlist.scrollTop += Math.max(0, selected.bottom - bounds.bottom) + Math.min(0, selected.top - bounds.top);
}

function playList() {
  const isDictation = state.mode === 'dictation';
  const indexKey = isDictation ? 'dictationIndex' : 'readingIndex';
  const advance = state[indexKey] + 1 < state.words.length ? () => {
    state[indexKey]++;
    if (!isDictation) updateReadingPosition();
    playList();
  } : undefined;
  const word = currentWord(state);
  if (!word) return;
  audio.play(word.kana, {
    playlist: true, advance, speed: state.speed, repeats: state.repeats, wordGap: state.wordGap,
    example: readExamples ? word.example : undefined,
  });
}

function setDictationDraft(form: HTMLFormElement, feedback: Feedback = '') {
  const index = Number(form.dataset.index);
  const word = state.words[index];
  if (!word) return;
  const answer = field(form, 'answer').value;
  state.dictationDrafts.set(word.id, { answer, feedback });
  const result = $(`#dictation-feedback-${index}`);
  result.classList.toggle('incorrect', feedback === 'incorrect');
  result.innerHTML = dictationFeedback(word, feedback);
}

function switchMode(nextMode: StudyMode, focusHeading = false) {
  if (nextMode !== state.mode) audio.stop();
  state.mode = nextMode;
  render(focusHeading ? '#study-title' : undefined);
}

function moveWord(delta: number, focusSelector?: string) {
  const { mode, words } = state;
  const indexKey = mode === 'flash' ? 'flashIndex' : mode === 'reading' ? 'readingIndex' : undefined;
  if (!indexKey) return;
  const index = state[indexKey] + delta;
  if (index < 0 || index >= words.length) return;
  audio.stop();
  state[indexKey] = index;
  if (mode === 'flash') state.flipped = false;
  const atBoundary = (index === 0 && delta < 0) || (index === words.length - 1 && delta > 0);
  const positionTarget = focusSelector && atBoundary
    ? `[data-action="${delta > 0 ? 'previous' : 'next'}"]` : focusSelector;
  render(positionTarget);
}

function refreshAfterEdit() {
  audio.stop();
  resetStudyPositions(state);
  switchMode('words', true);
  persist();
}

const actions: Record<string, (button: HTMLButtonElement) => void | Promise<void>> = {
  mode: (button) => {
    const mode = button.dataset.mode;
    if (mode === 'flash' || mode === 'dictation' || mode === 'reading' || mode === 'words') switchMode(mode, !button.classList.contains('mode'));
  },
  add: () => dialogs.openEntry(),
  n5: openCatalog,
  'download-draft': downloadDraft,
  'retry-save': sync.retry,
  'use-server': () => {
    downloadDraft();
    sync.useServer();
    setTimeout(() => location.reload(), 500);
  },
  edit: (button) => dialogs.openEntry(wordById(state, button.dataset.id ?? '')),
  delete: (button) => {
    const word = wordById(state, button.dataset.id ?? '');
    if (word) dialogs.openDelete(word);
  },
  'delete-all': () => dialogs.openDeleteAll(),
  import: () => dialogs.openImport(),
  close: (button) => button.closest('dialog')?.close(),
  flip: () => {
    state.flipped = !state.flipped;
    render('#flip-card');
  },
  known: () => {
    const word = currentWord(state);
    if (!word) return;
    const { id } = word;
    if (state.known.has(id)) state.known.delete(id);
    else state.known.add(id);
    persist();
    render('#known-button');
  },
  shuffle: () => {
    audio.stop();
    const { flashOrder } = state;
    const previousFirst = flashOrder[0];
    for (let index = flashOrder.length - 1; index > 0; index--) {
      const other = Math.floor(Math.random() * (index + 1));
      [flashOrder[index], flashOrder[other]] = [flashOrder[other], flashOrder[index]];
    }
    if (flashOrder[0] === previousFirst && flashOrder.length) flashOrder.push(flashOrder.shift()!);
    state.flashIndex = 0;
    state.flipped = false;
    render('#shuffle-button');
  },
  previous: () => moveWord(-1, '[data-action="previous"]'),
  next: () => moveWord(1, '[data-action="next"]'),
  speak: (button) => {
    const word = button.dataset.id ? wordById(state, button.dataset.id) : currentWord(state);
    if (word) audio.play(word.kana);
  },
  'speak-example': () => {
    const example = currentWord(state)?.example;
    if (example) audio.play(example);
  },
  'listen-row': (button) => {
    if (!button.form) return;
    if (button.getAttribute('aria-pressed') === 'true') {
      audio.stop();
      return;
    }
    state.dictationIndex = Number(button.form.dataset.index);
    const word = currentWord(state);
    if (word) audio.play(word.kana);
  },
  'play-list': (button) => {
    const withExample = button.hasAttribute('data-example');
    if (audio.continuous && readExamples === withExample) {
      audio.stop();
      return;
    }
    readExamples = withExample;
    if (state.mode === 'dictation') {
      state.dictationIndex = 0;
    } else if (audio.finished) {
      state.readingIndex = 0;
      updateReadingPosition();
    }
    playList();
  },
  'choose-word': (button) => {
    state.readingIndex = Number(button.dataset.index);
    updateReadingPosition();
    const word = currentWord(state);
    if (word) audio.play(word.kana);
  },
  reveal: (button) => { if (button.form) setDictationDraft(button.form, 'revealed'); },
};

document.addEventListener('click', (event) => {
  if (!(event.target instanceof Element)) return;
  const button = event.target.closest<HTMLButtonElement>('button[data-action]');
  if (button && !button.disabled) void actions[button.dataset.action ?? '']?.(button);
});

document.addEventListener('input', (event) => {
  const input = event.target;
  if (!(input instanceof HTMLInputElement)) return;
  if (input.id === 'speed') {
    state.speed = Number(input.value);
    input.setAttribute('aria-valuetext', speedText(state.speed));
    input.style.setProperty('--speed-fill', speedFill(state.speed));
    $('#speed-value').textContent = speedText(state.speed);
  } else if (input.id === 'word-search') {
    state.search = input.value;
    $('#word-rows').innerHTML = rowsView(state);
  } else if (input.name === 'answer' && input.form?.matches('.dictation-form')) {
    setDictationDraft(input.form);
  }
});

document.addEventListener('change', (event) => {
  const input = event.target;
  if (!(input instanceof HTMLInputElement || input instanceof HTMLSelectElement)) return;
  const { id, value } = input;
  const checked = input instanceof HTMLInputElement && input.checked;
  switch (id) {
    case 'speed': break;
    case 'repeats': state.repeats = Number(value); break;
    case 'word-gap': state.wordGap = Number(value); break;
    case 'show-kana':
      state.showKana = checked;
      $('.reading-layout').classList.toggle('hide-kana', !checked);
      break;
    case 'show-meaning':
      state.showMeaning = checked;
      $('.reading-layout').classList.toggle('hide-meaning', !checked);
      break;
    default: return;
  }
  persist();
});

document.addEventListener('keydown', (event) => {
  if (!(event.target instanceof Element)) return;
  if (state.mode !== 'flash' || !state.words.length || event.isComposing || event.altKey || event.ctrlKey || event.metaKey ||
    document.querySelector('dialog[open]') || event.target.closest('input, textarea, [contenteditable]')) return;
  if (event.code === 'Space' && !event.target.closest('button')) {
    event.preventDefault();
    actions.flip($('#flip-card'));
  }
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault();
    moveWord(event.key === 'ArrowLeft' ? -1 : 1);
  }
});

workspace.addEventListener('submit', (event) => {
  const form = event.target;
  if (!(form instanceof HTMLFormElement) || !form.matches('.dictation-form')) return;
  event.preventDefault();
  const word = state.words[Number(form.dataset.index)];
  if (!word) return;
  const input = field(form, 'answer');
  const correct = answerMatches(input.value, word);
  setDictationDraft(form, correct ? 'correct' : 'incorrect');
  if (correct) {
    state.correctAnswers.add(word.id);
    $('#dictation-progress').innerHTML = progressPanel(state, true);
  }
  input.focus({ preventScroll: true });
});

window.addEventListener('pagehide', audio.stop);
window.addEventListener('online', sync.retry);
updateStorageNotice(sync.status);
render();
if (sync.needsMigration) persist();
else void sync.retry();
