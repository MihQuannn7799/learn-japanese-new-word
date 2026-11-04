const repeatGap = 150;
const startTimeout = 4000;

export function createAudioPlayer({ onChange, notify }) {
  const synth = window.speechSynthesis;
  const Utterance = window.SpeechSynthesisUtterance;
  let token = 0;
  let nextTimer;
  let watchdog;
  let utteranceInFlight = null;
  let active = false;
  let continuous = false;
  let finished = false;
  let message = '';

  function japaneseVoice() {
    const voices = synth?.getVoices().filter((voice) => /^ja(?:[-_]|$)/i.test(voice.lang)) ?? [];
    return voices.find((voice) => voice.localService) ?? voices[0];
  }

  function cancelPending() {
    clearTimeout(nextTimer);
    clearTimeout(watchdog);
    if (!utteranceInFlight) return false;
    // Ignore end/error callbacks from an utterance canceled by this player.
    utteranceInFlight = null;
    synth.cancel();
    return true;
  }

  function stop() {
    token++;
    cancelPending();
    active = continuous = finished = false;
    message = '';
    onChange();
  }

  function play(text, { speed = 1, repeats = 1, example, wordGap = 500, advance, playlist = false } = {}) {
    const session = ++token;
    const interrupted = cancelPending();
    const voice = japaneseVoice();
    active = continuous = finished = false;
    message = '';
    if (!synth || !Utterance || !voice) {
      fail(synth && Utterance
        ? 'Chưa có giọng đọc tiếng Nhật. Hãy cài hoặc bật giọng Nhật trên thiết bị rồi thử lại.'
        : 'Trình duyệt này chưa hỗ trợ phát âm tự động.');
      return;
    }

    active = true;
    continuous = playlist;
    const clips = Array(playlist ? repeats : 1).fill(text);
    if (playlist && example) clips.push(example);
    let index = 0;

    function fail(reason) {
      if (session !== token) return;
      cancelPending();
      active = continuous = false;
      message = reason;
      onChange();
      notify(message);
    }

    function speak() {
      if (session !== token) return;
      const clip = clips[index++];
      try {
        const utterance = new Utterance(clip);
        const isCurrent = () => session === token && utteranceInFlight === utterance;
        const timedOut = () => {
          if (isCurrent()) fail('Giọng Nhật không phản hồi. Hãy thử phát lại.');
        };
        utteranceInFlight = utterance;
        utterance.voice = voice;
        utterance.lang = voice.lang;
        utterance.rate = playlist ? speed : 1;
        utterance.onstart = () => {
          if (!isCurrent()) return;
          clearTimeout(watchdog);
          watchdog = setTimeout(timedOut, Math.max(8000, 4000 + clip.length * 400 / utterance.rate));
        };
        utterance.onend = () => {
          if (!isCurrent()) return;
          clearTimeout(watchdog);
          utteranceInFlight = null;
          if (index < clips.length) {
            nextTimer = setTimeout(speak, repeatGap);
          } else if (playlist && advance) {
            nextTimer = setTimeout(() => {
              if (session === token) advance();
            }, wordGap);
          } else {
            active = continuous = false;
            finished = playlist;
            onChange();
          }
        };
        utterance.onerror = () => {
          if (!isCurrent()) return;
          utteranceInFlight = null;
          fail('Không phát được giọng tiếng Nhật. Hãy thử phát lại hoặc kiểm tra giọng đọc trên thiết bị.');
        };
        watchdog = setTimeout(timedOut, startTimeout);
        synth.speak(utterance);
      } catch {
        fail('Không phát được giọng tiếng Nhật. Hãy thử phát lại hoặc kiểm tra giọng đọc trên thiết bị.');
      }
    }

    // Let the engine finish canceling before replacing an active utterance.
    // Fresh clicks and normal playlist advances can start immediately.
    if (interrupted) nextTimer = setTimeout(speak, 40);
    else speak();
    onChange();
  }

  synth?.addEventListener('voiceschanged', () => {
    if (japaneseVoice()) message = '';
    onChange();
  });

  return {
    play,
    stop,
    get active() { return active; },
    get continuous() { return continuous; },
    get finished() { return finished; },
    get status() { return active ? 'ĐANG ĐỌC' : finished ? 'ĐÃ ĐỌC HẾT' : 'SẴN SÀNG'; },
    get warning() {
      if (message) return message;
      if (!synth || !Utterance) return 'Trình duyệt này chưa hỗ trợ phát âm tự động.';
      return japaneseVoice() ? '' : 'Chưa có giọng Nhật. Hãy bật hoặc cài giọng tiếng Nhật trên thiết bị.';
    },
  };
}
