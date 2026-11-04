import assert from 'node:assert/strict';
import test from 'node:test';
import { createAudioPlayer } from '../frontend/js/audio.js';

function setup(t) {
  const spoken = [];
  const errors = [];
  let cancels = 0;
  t.mock.timers.enable({ apis: ['setTimeout'] });
  globalThis.window = {
    SpeechSynthesisUtterance: class {
      constructor(text) { this.text = text; }
    },
    speechSynthesis: {
      getVoices: () => [{ lang: 'ja-JP', localService: true }],
      addEventListener() {},
      speak(utterance) { spoken.push(utterance); },
      cancel() { cancels++; },
    },
  };
  t.after(() => { delete globalThis.window; });
  const audio = createAudioPlayer({ onChange() {}, notify: (message) => errors.push(message) });
  return { audio, spoken, errors, cancels: () => cancels };
}

test('plays a manual click immediately, once, at normal speed', (t) => {
  const { audio, spoken, cancels } = setup(t);
  audio.play('さくら', { speed: 0.5, repeats: 5 });
  assert.deepEqual(spoken.map(({ text, rate }) => [text, rate]), [['さくら', 1]]);
  spoken[0].onend();
  t.mock.timers.tick(5000);
  assert.equal(spoken.length, 1);
  assert.equal(audio.active, false);
  assert.equal(cancels(), 0);
});

test('repeats a playlist word before its example and uses the selected gap', (t) => {
  const { audio, spoken, cancels } = setup(t);
  audio.play('ねこ', {
    playlist: true, speed: 1.2, repeats: 2, example: '猫がいます。', wordGap: 250,
    advance: () => audio.play('みず', { playlist: true, speed: 1.2 }),
  });
  spoken[0].onend();
  t.mock.timers.tick(150);
  spoken[1].onend();
  t.mock.timers.tick(150);
  spoken[2].onend();
  t.mock.timers.tick(249);
  assert.equal(spoken.length, 3);
  t.mock.timers.tick(1);
  assert.deepEqual(spoken.map(({ text, rate }) => [text, rate]), [
    ['ねこ', 1.2], ['ねこ', 1.2], ['猫がいます。', 1.2], ['みず', 1.2],
  ]);
  spoken[3].onend();
  assert.equal(audio.finished, true);
  assert.equal(cancels(), 0);
});

test('ignores late callbacks and cancels queued repeats when stopped', (t) => {
  const { audio, spoken, errors, cancels } = setup(t);
  audio.play('ねこ', { playlist: true, repeats: 3 });
  audio.play('みず');
  spoken[0].onerror();
  spoken[0].onend();
  t.mock.timers.tick(40);
  assert.deepEqual(spoken.map(({ text }) => text), ['ねこ', 'みず']);
  assert.equal(cancels(), 1);
  assert.deepEqual(errors, []);
  spoken[1].onend();

  audio.play('ねこ', { playlist: true, repeats: 3 });
  spoken[2].onend();
  audio.stop();
  t.mock.timers.tick(5000);
  assert.equal(spoken.length, 3);
  assert.equal(audio.active, false);
});

test('recovers when the speech engine never starts', (t) => {
  const { audio, spoken, errors, cancels } = setup(t);
  audio.play('ねこ');
  t.mock.timers.tick(4000);
  assert.equal(audio.active, false);
  assert.equal(cancels(), 1);
  assert.match(errors[0], /không phản hồi/);
  audio.play('みず');
  assert.equal(spoken[1].text, 'みず');
});
