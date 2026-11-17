import { initCatalog } from './catalog.js';
import { connectNotebook } from './notebook-sync.js';
import { createAudioPlayer } from './audio.js';
import { initDialogs } from './dialogs.js';
import { bindFlashGestures } from './flash-gestures.js';
import { answerMatches } from './lib/kana.js';
import { createState, currentWord, resetStudyPositions, startFlashSession, wordById } from './state.js';
import { loadNotebook, notebookSnapshot, storeNotebook } from './storage.js';
import { dictationFeedback, dictationView } from './views/dictation.js';
import { flashView } from './views/flashcard.js';
import { readingView, readingWord } from './views/reading.js';
import { icon, progressPanel, speedFill, speedText, stepper } from './views/shared.js';
import { rowsView, vocabularyView } from './views/vocabulary.js';

const $ = (selector) => document.querySelector(selector);
const workspace = $('#workspace');
const notebook = loadNotebook();
let localAvailable = notebook.available;
const sync = await connectNotebook({
  saved: notebook.saved,
  enabled: Boolean($('meta[name="kotoba-backend"]')),
  onStatus: updateStorageNotice,
});
const state = createState(sync.saved);
const audio = createAudioPlayer({ onChange: updateAudioUi, notify: toast });
const dialogs = initDialogs({ state, notify: toast, onChange: refreshAfterEdit });
const openCatalog = initCatalog({ state, openEntry: dialogs.openEntry, notify: toast, onChange: refreshAfterEdit });
let toastTimer;
let readExamples = false;

const sections = {
  flash: ['01 / GHI NHỚ', 'Flashcard', 'Vuốt trái nếu chưa nhớ, vuốt phải nếu đã nhớ.'],
  dictation: ['02 / LUYỆN TAI', 'Nghe chép chính tả', 'Gõ từ nghe được bằng hiragana, katakana hoặc kanji.'],
  reading: ['03 / PHÁT ÂM', 'Chế độ đọc', 'Nghe từng từ hoặc phát liên tiếp từ vị trí đang chọn.'],
  words: ['04 / SỔ TAY', 'Danh sách từ vựng', 'Tra cứu và cập nhật từ tiếng Nhật, nghĩa và kanji.'],
};

function persist() {
  localAvailable = storeNotebook(state);
  sync.save(notebookSnapshot(state));
  if (sync.status === 'local') updateStorageNotice('local');
}

function updateStorageNotice(status) {
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

function toast(message) {
  clearTimeout(toastTimer);
  $('#toast').textContent = message;
  toastTimer = setTimeout(() => { $('#toast').textContent = ''; }, 4500);
}

function updateAudioUi() {
  const status = audio.warning;
  for (const message of document.querySelectorAll('[data-voice-message]')) {
    if (message.textContent !== status) message.textContent = status;
    message.hidden = !status;
  }
  const listButtons = document.querySelectorAll('[data-action="play-list"]');
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
  const previousRow = $('.dictation-row.is-speaking');
  const row = audio.active ? $(`#dictation-row-${state.dictationIndex}`) : null;
  if (previousRow !== row) {
    previousRow?.classList.remove('is-speaking');
    row?.classList.add('is-speaking');
  }
  const previousButton = $('.dictation-listen[aria-pressed="true"]');
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

function render(focusSelector) {
  const { mode, words } = state;
  const playlistScroll = $('.playlist')?.scrollTop ?? 0;
  const word = currentWord(state);
  const [section, heading, description] = sections[mode];
  const empty = `<div class="empty-state"><h3>Sổ tay chưa có từ</h3><p class="muted">Thêm từ mới hoặc nhập danh sách để bắt đầu.</p>
    <div class="inline-actions"><button class="btn primary" data-action="add">${icon('plus')} Thêm từ mới</button><button class="btn secondary" data-action="import">${icon('upload')} Nhập danh sách</button></div></div>`;
  const content = mode === 'words' ? vocabularyView(state)
    : words.length ? { flash: flashView, dictation: dictationView, reading: readingView }[mode](state, word) : empty;
  workspace.innerHTML = `<section aria-labelledby="study-title">
    <div class="section-heading"><div><p class="section-kicker">${section}</p><h2 id="study-title" tabindex="-1">${heading}</h2><p>${description}</p></div></div>
    ${content}</section>`;
  document.body.classList.toggle('flash-mode', mode === 'flash' && words.length > 0);
  $('#hero-count').textContent = `${words.length} từ trong sổ tay`;
  for (const button of document.querySelectorAll('.mode')) button.setAttribute('aria-current', String(button.dataset.mode === mode));
  updateAudioUi();
  if (focusSelector) $(focusSelector)?.focus({ preventScroll: true });
  const playlist = $('.playlist');
  if (playlist) playlist.scrollTop = playlistScroll;
}

function updateReadingPosition() {
  const word = currentWord(state);
  $('#reading-word').innerHTML = readingWord(word);
  $('#reading-stepper').innerHTML = stepper(state.readingIndex, state.words.length);
  $('[data-action="speak-example"]').hidden = !word.example;
  const playlist = $('.playlist');
  playlist.querySelector('[aria-current="true"]')?.setAttribute('aria-current', 'false');
  const item = playlist.querySelector(`[data-index="${state.readingIndex}"]`);
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
  audio.play(word.kana, {
    playlist: true, advance, speed: state.speed, repeats: state.repeats, wordGap: state.wordGap,
    example: readExamples ? word.example : undefined,
  });
}

function setDictationDraft(form, feedback = '') {
  const index = Number(form.dataset.index);
  const word = state.words[index];
  const answer = form.elements.namedItem('answer').value;
  state.dictationDrafts.set(word.id, { answer, feedback });
  const result = $(`#dictation-feedback-${index}`);
  result.classList.toggle('incorrect', feedback === 'incorrect');
  result.innerHTML = dictationFeedback(word, feedback);
}

function switchMode(nextMode, focusHeading = false) {
  if (nextMode !== state.mode) audio.stop();
  state.mode = nextMode;
  render(focusHeading ? '#study-title' : undefined);
}

function moveReadingWord(delta) {
  const index = state.readingIndex + delta;
  if (index < 0 || index >= state.words.length) return;
  audio.stop();
  state.readingIndex = index;
  const forward = delta > 0 ? index < state.words.length - 1 : index === 0;
  render(forward ? '[data-action="next"]' : '[data-action="previous"]');
}

function rateFlashWord(remembered, focusSelector = '#flip-card') {
  if (state.mode !== 'flash') return;
  const word = currentWord(state);
  if (!word) return;

  audio.stop();
  if (state.known.has(word.id) !== remembered) {
    if (remembered) state.known.add(word.id);
    else state.known.delete(word.id);
    persist();
  }
  state.flashIndex++;
  state.flipped = false;
  render(state.flashIndex < state.flashOrder.length ? focusSelector : '#flash-session-end');
}

function refreshAfterEdit() {
  resetStudyPositions(state);
  switchMode('words', true);
  persist();
}

const actions = {
  mode: (button) => switchMode(button.dataset.mode, !button.classList.contains('mode')),
  add: () => dialogs.openEntry(),
  n5: openCatalog,
  'download-draft': downloadDraft,
  'retry-save': sync.retry,
  'use-server': () => {
    downloadDraft();
    sync.useServer();
    setTimeout(() => location.reload(), 500);
  },
  edit: (button) => dialogs.openEntry(wordById(state, button.dataset.id)),
  delete: (button) => dialogs.openDelete(wordById(state, button.dataset.id)),
  import: () => dialogs.openImport(),
  close: (button) => button.closest('dialog').close(),
  flip: () => {
    state.flipped = !state.flipped;
    render('#flip-card');
  },
  'flash-unknown': () => rateFlashWord(false, '[data-action="flash-unknown"]'),
  'flash-known': () => rateFlashWord(true, '[data-action="flash-known"]'),
  'flash-filter': (button) => {
    audio.stop();
    const { filter } = button.dataset;
    startFlashSession(state, filter);
    render(`[data-filter="${filter}"]`);
  },
  'flash-restart': () => {
    audio.stop();
    startFlashSession(state);
    render(state.flashOrder.length ? '#flip-card' : '#flash-session-end');
  },
  previous: () => moveReadingWord(-1),
  next: () => moveReadingWord(1),
  speak: (button) => {
    const word = button.dataset.id ? wordById(state, button.dataset.id) : currentWord(state);
    audio.play(word.kana);
  },
  'speak-example': () => audio.play(currentWord(state).example),
  'listen-row': (button) => {
    if (button.getAttribute('aria-pressed') === 'true') {
      audio.stop();
      return;
    }
    state.dictationIndex = Number(button.form.dataset.index);
    audio.play(currentWord(state).kana);
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
    audio.play(currentWord(state).kana);
  },
  reveal: (button) => setDictationDraft(button.form, 'revealed'),
};

document.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (button && !button.disabled) actions[button.dataset.action]?.(button);
});

document.addEventListener('input', (event) => {
  const input = event.target;
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
  const { id, value, checked } = event.target;
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
  if (state.mode !== 'flash' || state.flashIndex >= state.flashOrder.length ||
    event.isComposing || event.altKey || event.ctrlKey || event.metaKey ||
    $('dialog[open]') || event.target.closest('input, textarea, select, [contenteditable]')) return;
  if (event.code === 'Space' && !event.target.closest('button')) {
    event.preventDefault();
    if (!event.repeat) actions.flip();
  }
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault();
    if (!event.repeat) rateFlashWord(event.key === 'ArrowRight');
  }
});

bindFlashGestures(workspace, rateFlashWord);

workspace.addEventListener('submit', (event) => {
  const form = event.target;
  if (!form.matches('.dictation-form')) return;
  event.preventDefault();
  const word = state.words[Number(form.dataset.index)];
  const input = form.elements.namedItem('answer');
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
