import { answerMatches, importLimit, makeWord, normalizeSearch, parseImport, starterWords, wordKey } from './words.js';

const storageKey = 'kotoba.notebook.v1';
const $ = (selector) => document.querySelector(selector);
const workspace = $('#workspace');
const entryDialog = $('#entry-dialog');
const importDialog = $('#import-dialog');
const deleteDialog = $('#delete-dialog');
const entryForm = $('#entry-form');
const importForm = $('#import-form');
const synth = window.speechSynthesis;
const speedText = (speed) => `${Number(speed.toFixed(2))}×`;
const icon = (name) => `<svg class="icon" aria-hidden="true"><use href="#i-${name}"/></svg>`;
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]
);
const uniqueId = () => globalThis.crypto?.randomUUID?.() ?? `word-${Date.now()}-${Math.random().toString(36).slice(2)}`;

let storageAvailable = true;
let saved = {};
try {
  saved = JSON.parse(localStorage.getItem(storageKey)) ?? {};
} catch {
  storageAvailable = false;
}
let words = Array.isArray(saved.words) ? saved.words : [...starterWords];
let known = new Set(Array.isArray(saved.known) ? saved.known : []);
let speed = typeof saved.speed === 'number' && saved.speed >= 0.5 && saved.speed <= 1.5 ? saved.speed : 0.85;

let mode = 'flash';
let flashOrder = words.map((word) => word.id);
let flashIndex = 0;
let flipped = false;
let dictationIndex = 0;
let dictationInput = '';
let feedback = '';
let correctAnswers = new Set();
let readingIndex = 0;
let search = '';
let editingId = '';
let deletingId = '';
let toastTimer;
let audioToken = 0;
let playTimer;
let playing = false;
let continuous = false;
let readingFinished = false;
let voiceMessage = '';
let importFileVersion = 0;

function storeNotebook() {
  try {
    localStorage.setItem(storageKey, JSON.stringify({ words, known: [...known], speed }));
    storageAvailable = true;
  } catch {
    storageAvailable = false;
    toast('Trình duyệt không lưu được dữ liệu. Thay đổi hiện chỉ có trong phiên này.');
  }
  updateStorageNotice();
}

function updateStorageNotice() {
  $('.footer span:last-child').textContent = storageAvailable
    ? 'Dữ liệu lưu trên trình duyệt này'
    : 'Lưu trên trình duyệt không khả dụng';
}

function toast(message) {
  clearTimeout(toastTimer);
  $('#toast').textContent = message;
  toastTimer = setTimeout(() => { $('#toast').textContent = ''; }, 4500);
}

function wordById(id) {
  return words.find((word) => word.id === id);
}

function currentWord() {
  if (mode === 'flash') return wordById(flashOrder[flashIndex]);
  if (mode === 'dictation') return words[dictationIndex];
  return words[readingIndex];
}

function speedPanel() {
  return `<section class="panel">
    <label class="range-label" for="speed"><span class="panel-title">${icon('volume')} Tốc độ đọc</span><output id="speed-value" for="speed">${speedText(speed)}</output></label>
    <input id="speed" type="range" min="0.5" max="1.5" step="0.05" value="${speed}" aria-valuetext="${speedText(speed)}">
    <div class="speed-scale" aria-hidden="true"><span>0.5× · Chậm</span><span>1.5× · Nhanh</span></div>
    <p class="voice-message" data-voice-message role="status" hidden></p>
  </section>`;
}

function progressPanel(isDictation = false) {
  const count = isDictation ? correctAnswers.size : words.filter((word) => known.has(word.id)).length;
  const title = isDictation ? 'Kết quả phiên này' : 'Tiến độ sổ tay';
  const label = isDictation ? 'từ trả lời đúng' : 'từ đã nhớ';
  const message = isDictation ? 'Bạn có thể nghe lại và thử nhiều lần.' : 'Đánh dấu những từ bạn đã nhớ nghĩa.';
  return `<section class="panel">
    <h3 class="panel-title">${icon(isDictation ? 'check' : 'book')} ${title}</h3>
    <div class="progress-row"><strong>${count}/${words.length}</strong><span>${label}</span></div>
    <progress max="${words.length}" value="${count}" aria-label="${label}"></progress>
    <p>${message}</p>
  </section>`;
}

function stepper(position, size) {
  return `<div class="inline-actions">
    <button class="btn icon-only secondary" data-action="previous" aria-label="Từ trước" ${position === 0 ? 'disabled' : ''}>${icon('left')}</button>
    <span class="position" aria-live="polite">${position + 1} / ${size}</span>
    <button class="btn icon-only secondary" data-action="next" aria-label="Từ tiếp theo" ${position >= size - 1 ? 'disabled' : ''}>${icon('right')}</button>
  </div>`;
}

function japanese(word, className = 'jp-word') {
  return `<span class="${className}" lang="ja">${escapeHtml(word.kanji || word.kana)}</span>
    ${word.kanji ? `<span class="kana" lang="ja">${escapeHtml(word.kana)}</span>` : ''}`;
}

function flashView(word) {
  const remembered = known.has(word.id);
  return `<div class="study-grid">
    <section class="study-card" aria-label="Thẻ từ vựng">
      <div class="flash-face ${flipped ? 'flipped' : ''}">
        <button class="card-toggle" data-action="flip" id="flip-card" aria-label="${flipped ? 'Lật về mặt tiếng Nhật' : 'Lật để xem nghĩa'}" aria-describedby="card-answer">
          <span id="card-answer">
            ${flipped ? `<span class="card-meaning">${escapeHtml(word.meaning)}</span><span class="kana" lang="ja">${escapeHtml(word.kana)}</span>` : japanese(word)}
          </span>
          <span class="flip-hint">${icon('flip')} ${flipped ? 'Chạm để xem mặt tiếng Nhật' : 'Chạm để xem nghĩa'}</span>
        </button>
        <div class="face-top">
          <span class="badge">${flipped ? 'MẶT NGHĨA' : 'MẶT TIẾNG NHẬT'}</span>
          <button class="btn icon-only secondary" data-action="speak" aria-label="Nghe phát âm" title="Nghe phát âm">${icon('volume')}</button>
        </div>
      </div>
      <div class="card-controls">
        ${stepper(flashIndex, flashOrder.length)}
        <button id="known-button" class="btn ${remembered ? 'subtle' : 'secondary'}" data-action="known" aria-pressed="${remembered}">${icon('check')} ${remembered ? 'Đã nhớ' : 'Đánh dấu đã nhớ'}</button>
      </div>
    </section>
    <aside class="side-stack">
      ${progressPanel()}
      ${speedPanel()}
      <p class="shortcut-tip">${icon('keyboard')} <span><kbd>←</kbd> <kbd>→</kbd> đổi từ · <kbd>Space</kbd> lật thẻ</span></p>
    </aside>
  </div>`;
}

function dictationView(word) {
  const answer = `${escapeHtml(word.kana)}${word.kanji ? ` · ${escapeHtml(word.kanji)}` : ''}`;
  const result = {
    correct: `Chính xác! <strong lang="ja">${answer}</strong> · ${escapeHtml(word.meaning)}`,
    incorrect: 'Chưa khớp. Nghe lại và thử thêm một lần nhé.',
    revealed: `Đáp án <strong lang="ja">${answer}</strong> · ${escapeHtml(word.meaning)}`,
  }[feedback] ?? '';
  return `<div class="study-grid">
    <section class="study-card" aria-label="Bài nghe chép">
      <div class="exercise-listen">
        <button class="round-play" data-action="speak" aria-label="Nghe từ tiếng Nhật">${icon('volume')}</button>
        <h3>Nghe từ tiếng Nhật</h3>
        <p class="muted">Bạn có thể phát lại bao nhiêu lần tùy ý.</p>
      </div>
      <div class="exercise-body">
        <form id="dictation-form" class="dictation-form">
          <label class="field">Câu trả lời<input id="dictation-input" name="answer" lang="ja" maxlength="120" value="${escapeHtml(dictationInput)}" placeholder="Gõ hiragana, katakana hoặc kanji" autocomplete="off" autocapitalize="off" spellcheck="false" required></label>
          <div id="dictation-feedback" class="${feedback === 'incorrect' ? 'feedback incorrect' : 'feedback'}" role="status" ${result ? '' : 'hidden'}>${result}</div>
          <div class="inline-actions">
            <button class="btn primary" type="submit">${icon('check')} Kiểm tra</button>
            <button class="btn secondary" type="button" data-action="reveal">Xem đáp án</button>
          </div>
        </form>
        <div class="card-controls">${stepper(dictationIndex, words.length)}</div>
      </div>
    </section>
    <aside class="side-stack">${speedPanel()}${progressPanel(true)}</aside>
  </div>`;
}

function readingView(word) {
  return `<div class="study-grid">
    <section class="study-card" aria-label="Trình đọc từ vựng">
      <div class="exercise-listen reading">
        <span class="badge" id="reading-status" aria-live="polite">SẴN SÀNG</span>
        ${japanese(word)}
        <p>${escapeHtml(word.meaning)}</p>
      </div>
      <div class="exercise-body">
        <div class="reading-actions">
          <button class="btn primary" data-action="play-list">${icon('play')} Đọc liên tiếp</button>
          <button class="btn secondary" data-action="speak">${icon('volume')} Đọc từ này</button>
        </div>
        <div class="card-controls">${stepper(readingIndex, words.length)}</div>
      </div>
    </section>
    <aside class="side-stack">
      ${speedPanel()}
      <section class="panel">
        <h3 class="panel-title">${icon('book')} Danh sách đọc</h3>
        <ol class="playlist">
          ${words.map((item, index) => `<li><button data-action="choose-word" data-index="${index}" aria-current="${index === readingIndex}"><span class="position">${index + 1}</span><span lang="ja">${escapeHtml(item.kanji || item.kana)}</span><span class="muted">${escapeHtml(item.meaning)}</span></button></li>`).join('')}
        </ol>
      </section>
    </aside>
  </div>`;
}

function rowsView() {
  const query = normalizeSearch(search);
  const visible = words.filter((word) =>
    [word.kana, word.meaning, word.kanji].some((value) => normalizeSearch(value).includes(query))
  );
  return visible.map((word) => `<tr>
    <td lang="ja">${escapeHtml(word.kana)}</td>
    <td>${escapeHtml(word.meaning)}</td>
    <td lang="${word.kanji ? 'ja' : 'vi'}">${word.kanji ? escapeHtml(word.kanji) : '<span aria-label="Không có kanji">—</span>'}</td>
    <td>${known.has(word.id) ? '<span class="badge known">Đã nhớ</span>' : '—'}</td>
    <td><div class="inline-actions">
      <button class="btn plain icon-only" data-action="speak" data-id="${escapeHtml(word.id)}" aria-label="Nghe ${escapeHtml(word.kana)}" title="Nghe phát âm">${icon('volume')}</button>
      <button class="btn plain icon-only" data-action="edit" data-id="${escapeHtml(word.id)}" aria-label="Sửa ${escapeHtml(word.kana)}" title="Sửa từ">${icon('pen')}</button>
      <button class="btn plain icon-only" data-action="delete" data-id="${escapeHtml(word.id)}" aria-label="Xóa ${escapeHtml(word.kana)}" title="Xóa từ">${icon('trash')}</button>
    </div></td></tr>`).join('') || `<tr><td class="no-results" colspan="5">${words.length ? 'Không tìm thấy từ phù hợp.' : 'Sổ tay chưa có từ. Thêm từ mới hoặc nhập danh sách để bắt đầu.'}</td></tr>`;
}

function vocabularyView() {
  return `<section class="book-panel">
    <div class="book-tools">
      <label class="search">${icon('search')}<input id="word-search" type="search" placeholder="Tìm kana, nghĩa hoặc kanji…" aria-label="Tìm từ vựng" value="${escapeHtml(search)}"></label>
      <span class="muted">${words.length} từ trong sổ tay</span>
    </div>
    <div class="table-wrap" tabindex="0" role="region" aria-label="Bảng từ vựng">
      <table class="word-table"><thead><tr><th scope="col">Từ tiếng Nhật</th><th scope="col">Nghĩa tiếng Việt</th><th scope="col">Kanji</th><th scope="col">Tiến độ</th><th scope="col">Thao tác</th></tr></thead>
      <tbody id="word-rows">${rowsView()}</tbody></table>
    </div>
  </section>`;
}

const sections = {
  flash: ['01 / GHI NHỚ', 'Flashcard', 'Nhìn từ tiếng Nhật, thử nhớ nghĩa rồi lật thẻ để kiểm tra.'],
  dictation: ['02 / LUYỆN TAI', 'Nghe chép chính tả', 'Nghe phát âm và gõ lại từ bạn nghe được.'],
  reading: ['03 / PHÁT ÂM', 'Chế độ đọc', 'Nghe từng từ hoặc phát liên tiếp từ vị trí đang chọn.'],
  words: ['04 / SỔ TAY', 'Danh sách từ vựng', 'Tra cứu và cập nhật từ tiếng Nhật, nghĩa tiếng Việt và kanji.'],
};

function render(focusSelector) {
  const playlistScroll = $('.playlist')?.scrollTop ?? 0;
  const word = currentWord();
  const [section, heading, description] = sections[mode];
  const shuffleButton = mode === 'flash' && words.length > 1
    ? `<button class="btn secondary" data-action="shuffle" id="shuffle-button">${icon('shuffle')} Xáo thẻ</button>` : '';
  const empty = `<div class="empty-state"><h3>Sổ tay chưa có từ</h3><p class="muted">Thêm từ mới hoặc nhập danh sách để bắt đầu.</p>
    <div class="inline-actions"><button class="btn primary" data-action="add">${icon('plus')} Thêm từ mới</button><button class="btn secondary" data-action="import">${icon('upload')} Nhập danh sách</button></div></div>`;
  const content = mode === 'words' ? vocabularyView()
    : word ? { flash: flashView, dictation: dictationView, reading: readingView }[mode](word) : empty;
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
    if (continuous) {
      const bounds = playlist.getBoundingClientRect();
      const selected = playlist.querySelector('[aria-current="true"]').getBoundingClientRect();
      playlist.scrollTop += Math.max(0, selected.bottom - bounds.bottom) + Math.min(0, selected.top - bounds.top);
    }
  }
}

function japaneseVoice() {
  const voices = synth?.getVoices().filter((voice) => /^ja(?:[-_]|$)/i.test(voice.lang)) ?? [];
  return voices.find((voice) => voice.localService) ?? voices[0];
}

function updateAudioUi() {
  const available = japaneseVoice();
  const status = voiceMessage || (available ? '' : 'Chưa có giọng Nhật. Hãy bật hoặc cài giọng tiếng Nhật trong trình duyệt hoặc thiết bị.');
  for (const message of document.querySelectorAll('[data-voice-message]')) {
    message.textContent = status;
    message.hidden = !status;
  }
  const listButton = $('[data-action="play-list"]');
  if (!listButton) return;
  const label = continuous ? `${icon('stop')} Dừng đọc` : `${icon('play')} Đọc liên tiếp`;
  if (listButton.innerHTML !== label) listButton.innerHTML = label;
  $('#reading-status').textContent = continuous || playing ? 'ĐANG ĐỌC' : readingFinished ? 'ĐÃ ĐỌC HẾT' : 'SẴN SÀNG';
}

function stopAudio() {
  audioToken++;
  clearTimeout(playTimer);
  playing = false;
  continuous = false;
  readingFinished = false;
  voiceMessage = '';
  synth?.cancel();
  updateAudioUi();
}

function play(word, repeatList = false) {
  const voice = japaneseVoice();
  if (!synth || !voice || typeof SpeechSynthesisUtterance === 'undefined') {
    stopAudio();
    voiceMessage = synth ? 'Chưa tìm thấy giọng Nhật. Hãy cài giọng tiếng Nhật trong trình duyệt hoặc thiết bị rồi thử lại.' : 'Trình duyệt này chưa hỗ trợ phát âm tự động.';
    updateAudioUi();
    toast(voiceMessage);
    return;
  }
  const token = ++audioToken;
  clearTimeout(playTimer);
  synth.cancel();
  continuous = repeatList;
  playing = true;
  readingFinished = false;
  voiceMessage = '';
  const utterance = new SpeechSynthesisUtterance(word.kana);
  utterance.voice = voice;
  utterance.lang = voice.lang;
  utterance.rate = speed;
  utterance.onend = () => {
    if (token !== audioToken) return;
    playing = false;
    if (continuous && readingIndex + 1 < words.length) {
      playTimer = setTimeout(() => {
        if (token !== audioToken) return;
        readingIndex++;
        render(document.activeElement === $('[data-action="play-list"]') ? '[data-action="play-list"]' : undefined);
        play(words[readingIndex], true);
      }, 450);
    } else {
      readingFinished = continuous;
      continuous = false;
    }
    updateAudioUi();
  };
  const reportError = () => {
    if (token !== audioToken) return;
    playing = false;
    continuous = false;
    voiceMessage = 'Không phát được giọng tiếng Nhật. Kiểm tra cài đặt âm thanh và thử lại.';
    updateAudioUi();
    toast(voiceMessage);
  };
  utterance.onerror = reportError;
  try {
    synth.speak(utterance);
  } catch {
    reportError();
  }
  updateAudioUi();
}

function switchMode(nextMode, focusHeading = false) {
  if (nextMode !== mode) stopAudio();
  mode = nextMode;
  render(focusHeading ? '#study-title' : undefined);
}

function resetDictation() {
  dictationInput = '';
  feedback = '';
}

function moveWord(delta, focusSelector) {
  if (mode === 'words') return;
  const index = { flash: flashIndex, dictation: dictationIndex, reading: readingIndex }[mode] + delta;
  if (index < 0 || index >= words.length) return;
  stopAudio();
  if (mode === 'flash') {
    flashIndex = index;
    flipped = false;
  } else if (mode === 'dictation') {
    dictationIndex = index;
    resetDictation();
  } else readingIndex = index;
  const positionTarget = focusSelector && (index === 0 && delta < 0 || index === words.length - 1 && delta > 0)
    ? `[data-action="${delta > 0 ? 'previous' : 'next'}"]` : focusSelector;
  render(positionTarget);
}

function refreshAfterEdit() {
  flashOrder = words.map((word) => word.id);
  flashIndex = 0;
  flipped = false;
  dictationIndex = 0;
  resetDictation();
  readingIndex = 0;
  search = '';
  switchMode('words', true);
}

function openEntry(word) {
  editingId = word?.id ?? '';
  entryForm.reset();
  $('#entry-title').textContent = word ? 'Sửa từ vựng' : 'Thêm từ mới';
  $('#entry-error').textContent = '';
  for (const name of ['kana', 'meaning', 'kanji']) entryForm.elements.namedItem(name).value = word?.[name] ?? '';
  entryDialog.showModal();
}

const actions = {
  mode: (button) => switchMode(button.dataset.mode, !button.classList.contains('mode')),
  add: () => openEntry(),
  edit: (button) => openEntry(wordById(button.dataset.id)),
  delete: (button) => {
    const word = wordById(button.dataset.id);
    deletingId = word.id;
    $('#delete-word').textContent = `${word.kanji || word.kana} · ${word.meaning}`;
    deleteDialog.showModal();
  },
  import: () => {
    importForm.reset();
    $('#import-error').textContent = '';
    importDialog.showModal();
  },
  close: (button) => button.closest('dialog').close(),
  flip: () => {
    flipped = !flipped;
    render('#flip-card');
  },
  known: () => {
    const { id } = currentWord();
    if (known.has(id)) known.delete(id);
    else known.add(id);
    storeNotebook();
    render('#known-button');
  },
  shuffle: () => {
    stopAudio();
    const previousFirst = flashOrder[0];
    for (let index = flashOrder.length - 1; index > 0; index--) {
      const other = Math.floor(Math.random() * (index + 1));
      [flashOrder[index], flashOrder[other]] = [flashOrder[other], flashOrder[index]];
    }
    if (flashOrder[0] === previousFirst) flashOrder.push(flashOrder.shift());
    flashIndex = 0;
    flipped = false;
    render('#shuffle-button');
  },
  previous: () => moveWord(-1, '[data-action="previous"]'),
  next: () => moveWord(1, '[data-action="next"]'),
  speak: (button) => play(button.dataset.id ? wordById(button.dataset.id) : currentWord()),
  'play-list': () => {
    if (continuous) stopAudio();
    else {
      if (readingFinished) {
        readingIndex = 0;
        render('[data-action="play-list"]');
      }
      play(currentWord(), true);
    }
  },
  'choose-word': (button) => {
    stopAudio();
    readingIndex = Number(button.dataset.index);
    render(`[data-action="choose-word"][data-index="${readingIndex}"]`);
  },
  reveal: () => {
    feedback = 'revealed';
    render('[data-action="reveal"]');
  },
};

document.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (button && !button.disabled) actions[button.dataset.action]?.(button);
});

document.addEventListener('input', (event) => {
  const input = event.target;
  if (input.id === 'speed') {
    speed = Number(input.value);
    input.setAttribute('aria-valuetext', speedText(speed));
    $('#speed-value').textContent = speedText(speed);
  } else if (input.id === 'word-search') {
    search = input.value;
    $('#word-rows').innerHTML = rowsView();
  } else if (input.id === 'dictation-input') {
    dictationInput = input.value;
    if (feedback === 'incorrect') {
      feedback = '';
      $('#dictation-feedback').hidden = true;
    }
  }
});

document.addEventListener('change', (event) => {
  if (event.target.id === 'speed') storeNotebook();
});

document.addEventListener('keydown', (event) => {
  if (mode !== 'flash' || !words.length || event.isComposing || event.altKey || event.ctrlKey || event.metaKey ||
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
  if (event.target.id !== 'dictation-form') return;
  event.preventDefault();
  const word = currentWord();
  dictationInput = event.target.elements.namedItem('answer').value;
  if (answerMatches(dictationInput, word)) {
    correctAnswers.add(word.id);
    feedback = 'correct';
  } else feedback = 'incorrect';
  render('#dictation-input');
});

entryForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const fields = new FormData(entryForm);
  try {
    const word = makeWord(fields.get('kana'), fields.get('meaning'), fields.get('kanji'));
    if (words.some((item) => item.id !== editingId && wordKey(item) === wordKey(word))) {
      throw new Error('Từ này đã có trong sổ tay.');
    }
    const id = editingId || uniqueId();
    if (editingId) {
      const previous = wordById(editingId);
      if (wordKey(previous) !== wordKey(word)) {
        known.delete(id);
        correctAnswers.delete(id);
      }
      words = words.map((item) => item.id === id ? { ...word, id } : item);
    } else words = [...words, { ...word, id }];
    entryDialog.close();
    refreshAfterEdit();
    toast(editingId ? 'Đã cập nhật từ vựng.' : 'Đã thêm từ vào sổ tay.');
    storeNotebook();
  } catch (error) {
    $('#entry-error').textContent = error.message;
  }
});

$('#import-file').addEventListener('change', async (event) => {
  const input = event.target;
  const file = input.files[0];
  const version = ++importFileVersion;
  if (!file) return;
  try {
    if (file.size > importLimit * 4) throw new Error('Tệp quá lớn. Giới hạn 250.000 ký tự.');
    const decoded = new TextDecoder('utf-8', { fatal: true }).decode(await file.arrayBuffer());
    if (version !== importFileVersion || !importDialog.open) return;
    if (decoded.length > importLimit) throw new Error('Tệp quá lớn. Giới hạn 250.000 ký tự.');
    importForm.elements.namedItem('list').value = decoded;
    $('#import-error').textContent = '';
  } catch (error) {
    if (version === importFileVersion && importDialog.open) {
      $('#import-error').textContent = error instanceof TypeError ? 'Tệp phải dùng mã hóa UTF-8.' : error.message;
    }
  } finally {
    if (version === importFileVersion) input.value = '';
  }
});
importDialog.addEventListener('close', () => { importFileVersion++; });

importForm.addEventListener('submit', (event) => {
  event.preventDefault();
  try {
    const imported = parseImport(importForm.elements.namedItem('list').value);
    const keys = new Set(words.map(wordKey));
    const additions = [];
    for (const word of imported) {
      const key = wordKey(word);
      if (keys.has(key)) continue;
      keys.add(key);
      additions.push({ ...word, id: uniqueId() });
    }
    words = [...words, ...additions];
    importDialog.close();
    refreshAfterEdit();
    const skipped = imported.length - additions.length;
    toast(`Đã nhập ${additions.length} từ${skipped ? `, bỏ qua ${skipped} từ trùng` : ''}.`);
    storeNotebook();
  } catch (error) {
    $('#import-error').textContent = error.message;
  }
});

$('#delete-form').addEventListener('submit', (event) => {
  event.preventDefault();
  words = words.filter((word) => word.id !== deletingId);
  known.delete(deletingId);
  correctAnswers.delete(deletingId);
  deleteDialog.close();
  refreshAfterEdit();
  toast('Đã xóa từ khỏi sổ tay.');
  storeNotebook();
});

synth?.addEventListener('voiceschanged', () => {
  if (japaneseVoice()) voiceMessage = '';
  updateAudioUi();
});
window.addEventListener('pagehide', stopAudio);
updateStorageNotice();
render();
