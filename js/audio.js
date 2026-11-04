export function createAudioPlayer({ onChange, notify }) {
  const synth = window.speechSynthesis;
  const Utterance = window.SpeechSynthesisUtterance;
  let token = 0;
  let playTimer;
  let playing = false;
  let continuous = false;
  let finished = false;
  let message = '';

  function japaneseVoice() {
    const voices = synth?.getVoices().filter((voice) => /^ja(?:[-_]|$)/i.test(voice.lang)) ?? [];
    return voices.find((voice) => voice.localService) ?? voices[0];
  }

  function stop() {
    token++;
    clearTimeout(playTimer);
    playing = false;
    continuous = false;
    finished = false;
    message = '';
    synth?.cancel();
    onChange();
  }

  function play(text, speed, { playlist = false, advance } = {}) {
    const voice = japaneseVoice();
    if (!synth || !Utterance || !voice) {
      stop();
      message = synth && Utterance
        ? 'Chưa tìm thấy giọng Nhật. Hãy cài giọng tiếng Nhật trong trình duyệt hoặc thiết bị rồi thử lại.'
        : 'Trình duyệt này chưa hỗ trợ phát âm tự động.';
      onChange();
      notify(message);
      return;
    }
    const playback = ++token;
    clearTimeout(playTimer);
    synth.cancel();
    continuous = playlist;
    playing = true;
    finished = false;
    message = '';

    const reportError = () => {
      if (playback !== token) return;
      playing = false;
      continuous = false;
      message = 'Không phát được giọng tiếng Nhật. Kiểm tra cài đặt âm thanh và thử lại.';
      onChange();
      notify(message);
    };

    try {
      const utterance = new Utterance(text);
      utterance.voice = voice;
      utterance.lang = voice.lang;
      utterance.rate = speed;
      utterance.onend = () => {
        if (playback !== token) return;
        playing = false;
        if (continuous && advance) {
          playTimer = setTimeout(() => {
            if (playback === token) advance();
          }, 450);
        } else {
          finished = continuous;
          continuous = false;
        }
        onChange();
      };
      utterance.onerror = reportError;
      synth.speak(utterance);
    } catch {
      reportError();
    }
    onChange();
  }

  synth?.addEventListener('voiceschanged', () => {
    if (japaneseVoice()) message = '';
    onChange();
  });

  return {
    play,
    stop,
    get continuous() { return continuous; },
    get finished() { return finished; },
    get status() { return continuous || playing ? 'ĐANG ĐỌC' : finished ? 'ĐÃ ĐỌC HẾT' : 'SẴN SÀNG'; },
    get warning() {
      return message || (japaneseVoice() ? ''
        : 'Chưa có giọng Nhật. Hãy bật hoặc cài giọng tiếng Nhật trong trình duyệt hoặc thiết bị.');
    },
  };
}
