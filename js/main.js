import { createAudioPlayer } from './audio.js';
import { initDialogs } from './dialogs.js';
import { answerMatches } from './lib/kana.js';
import { createState, currentWord, resetStudyPositions, wordById } from './state.js';
import { loadNotebook, storeNotebook } from './storage.js';
import { dictationFeedback, dictationView } from './views/dictation.js';
import { flashView } from './views/flashcard.js';
import { readingView } from './views/reading.js';
import { icon, progressPanel, speedFill, speedText } from './views/shared.js';
import { rowsView, vocabularyView } from './views/vocabulary.js';

const $ = (selector) => document.querySelector(selector);
const workspace = $('#workspace');
const notebook = loadNotebook();
const state = createState(notebook.saved);
const audio = createAudioPlayer({ onChange: updateAudioUi, notify: toast });
const dialogs = initDialogs({ state, notify: toast, onChange: refreshAfterEdit });
let toastTimer;

const sections = {
  flash: ['01 / GHI NHỚ', 'Flashcard', 'Nhìn từ tiếng Nhật, thử nhớ nghĩa rồi lật thẻ để kiểm tra.'],
  dictation: ['02 / LUYỆN TAI', 'Nghe chép chính tả', 'Gõ từ nghe được bằng hiragana, katakana hoặc kanji.'],
  reading: ['03 / PHÁT ÂM', 'Chế độ đọc', 'Nghe từng từ hoặc phát liên tiếp từ vị trí đang chọn.'],
  words: ['04 / SỔ TAY', 'Danh sách từ vựng', 'Tra cứu và cập nhật từ tiếng Nhật, nghĩa tiếng Việt và kanji.'],
};

function persist() {
  const available = storeNotebook(state);
  if (!available) toast('Trình duyệt không lưu được dữ liệu. Thay đổi hiện chỉ có trong phiên này.');
  updateStorageNotice(available);
}

function updateStorageNotice(available) {
  $('.footer span:last-child').textContent = available
    ? 'Dữ liệu lưu trên trình duyệt này'
    : 'Lưu trên trình duyệt không khả dụng';
}

function toast(message) {
  clearTimeout(toastTimer);
  $('#toast').textContent = message;
  toastTimer = setTimeout(() => { $('#toast').textContent = ''; }, 4500);
}

function updateAudioUi() {
  const status = audio.warning;
  for (const message of document.querySelectorAll('[data-voice-message]')) {
    message.textContent = status;
    message.hidden = !status;
  }
  const listButton = $('[data-action="play-list"]');
  if (!listButton) return;
  const isDictation = state.mode === 'dictation';
  const playing = String(audio.continuous);
  if (listButton.dataset.playing !== playing) {
    listButton.dataset.playing = playing;
    const idleLabel = isDictation ? 'Nghe cả danh sách' : 'Đọc liên tiếp';
    listButton.innerHTML = audio.continuous ? `${icon('stop')} Dừng đọc` : `${icon('play')} ${idleLabel}`;
  }
  if (!isDictation) {
    $('#reading-status').textContent = audio.status;
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
  const shuffleButton = mode === 'flash' && words.length > 1
    ? `<button class="btn secondary" data-action="shuffle" id="shuffle-button">${icon('shuffle')} Xáo thẻ</button>` : '';
  const empty = `<div class="empty-state"><h3>Sổ tay chưa có từ</h3><p class="muted">Thêm từ mới hoặc nhập danh sách để bắt đầu.</p>
    <div class="inline-actions"><button class="btn primary" data-action="add">${icon('plus')} Thêm từ mới</button><button class="btn secondary" data-action="import">${icon('upload')} Nhập danh sách</button></div></div>`;
  const content = mode === 'words' ? vocabularyView(state)
    : words.length ? { flash: flashView, dictation: dictationView, reading: readingView }[mode](state, word) : empty;
  workspace.innerHTML = `<section aria-labelledby="study-title">
    <div class="section-heading"><div><p class="section-kicker">${section}</p><h2 id="study-title" tabindex="-1">${heading}</h2><p>${description}</p></div>${shuffleButton}</div>
    ${content}</section>`;
  $('#hero-count').textContent = `${words.length} từ trong sổ tay`;
  for (const button of document.querySelectorAll('.mode')) button.setAttribute('aria-current', String(button.dataset.mode === mode));
  updateAudioUi();
  if (focusSelector) $(focusSelector)?.focus({ preventScroll: true });
  const playlist = $('.playlist');
  if (playlist) {
    playlist.scrollTop = playlistScroll;
    if (audio.continuous) {
      const bounds = playlist.getBoundingClientRect();
      const selected = playlist.querySelector('[aria-current="true"]').getBoundingClientRect();
      playlist.scrollTop += Math.max(0, selected.bottom - bounds.bottom) + Math.min(0, selected.top - bounds.top);
    }
  }
}

function playList() {
  const isDictation = state.mode === 'dictation';
  const indexKey = isDictation ? 'dictationIndex' : 'readingIndex';
  const advance = state[indexKey] + 1 < state.words.length ? () => {
    state[indexKey]++;
    if (!isDictation) {
      const listControl = '[data-action="play-list"]';
      const focused = document.activeElement;
      const focusSelector = focused === $(listControl) ? listControl
        : ['speed', 'repeats'].includes(focused?.id) ? `#${focused.id}` : undefined;
      render(focusSelector);
    }
    playList();
  } : undefined;
  audio.play(currentWord(state).kana, state.speed, {
    playlist: true, advance, repeats: state.repeats, wordGap: isDictation ? 2000 : 450,
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

function moveWord(delta, focusSelector) {
  const { mode, words } = state;
  const indexKey = { flash: 'flashIndex', reading: 'readingIndex' }[mode];
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
  resetStudyPositions(state);
  switchMode('words', true);
  persist();
}

const actions = {
  mode: (button) => switchMode(button.dataset.mode, !button.classList.contains('mode')),
  add: () => dialogs.openEntry(),
  edit: (button) => dialogs.openEntry(wordById(state, button.dataset.id)),
  delete: (button) => dialogs.openDelete(wordById(state, button.dataset.id)),
  import: () => dialogs.openImport(),
  close: (button) => button.closest('dialog').close(),
  flip: () => {
    state.flipped = !state.flipped;
    render('#flip-card');
  },
  known: () => {
    const { id } = currentWord(state);
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
    if (flashOrder[0] === previousFirst) flashOrder.push(flashOrder.shift());
    state.flashIndex = 0;
    state.flipped = false;
    render('#shuffle-button');
  },
  previous: () => moveWord(-1, '[data-action="previous"]'),
  next: () => moveWord(1, '[data-action="next"]'),
  speak: (button) => {
    const word = button.dataset.id ? wordById(state, button.dataset.id) : currentWord(state);
    audio.play(word.kana, state.speed, { repeats: state.repeats });
  },
  'listen-row': (button) => {
    if (button.getAttribute('aria-pressed') === 'true') {
      audio.stop();
      return;
    }
    state.dictationIndex = Number(button.form.dataset.index);
    audio.play(currentWord(state).kana, state.speed, { repeats: state.repeats });
  },
  'play-list': () => {
    if (audio.continuous) audio.stop();
    else {
      if (state.mode === 'dictation') {
        state.dictationIndex = 0;
      } else if (audio.finished) {
        state.readingIndex = 0;
        render('[data-action="play-list"]');
      }
      playList();
    }
  },
  'choose-word': (button) => {
    audio.stop();
    state.readingIndex = Number(button.dataset.index);
    render(`[data-action="choose-word"][data-index="${state.readingIndex}"]`);
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
  if (event.target.id === 'repeats') {
    state.repeats = Number(event.target.value);
    persist();
  }
  if (event.target.id === 'speed') persist();
});

document.addEventListener('keydown', (event) => {
  if (state.mode !== 'flash' || !state.words.length || event.isComposing || event.altKey || event.ctrlKey || event.metaKey ||
    $('dialog[open]') || event.target.closest('input, textarea, [contenteditable]')) return;
  if (event.code === 'Space' && !event.target.closest('button')) {
    event.preventDefault();
    actions.flip();
  }
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault();
    moveWord(event.key === 'ArrowLeft' ? -1 : 1);
  }
});

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
updateStorageNotice(notebook.available);
render();
