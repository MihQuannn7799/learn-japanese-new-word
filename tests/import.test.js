import assert from 'node:assert/strict';
import test from 'node:test';
import { importLimit, parseImport, uniqueImports } from '../frontend/js/lib/import.js';

test('imports pipe-separated rows with optional kanji', () => {
  assert.deepEqual(parseImport('つき | mặt trăng | 月\nパン | bánh mì'), [
    { kana: 'つき', meaning: 'mặt trăng', kanji: '月' },
    { kana: 'パン', meaning: 'bánh mì', kanji: '' },
  ]);
});

test('imports CSV with BOM, a header, CRLF and quoted values', () => {
  assert.deepEqual(parseImport('\uFEFFkana,nghĩa,kanji\r\nねこ,"mèo, còn gọi là ""miêu""",猫'), [
    { kana: 'ねこ', meaning: 'mèo, còn gọi là "miêu"', kanji: '猫' },
  ]);
});

test('imports tab-separated rows and preserves newlines inside quotes', () => {
  assert.deepEqual(parseImport('みず\t"nước\nnước uống"\t水\nパン\tbánh mì\t'), [
    { kana: 'みず', meaning: 'nước\nnước uống', kanji: '水' },
    { kana: 'パン', meaning: 'bánh mì', kanji: '' },
  ]);
});

test('reports row numbers and rejects the entire list when it contains invalid rows', () => {
  assert.throws(() => parseImport('\n\nかな | đúng\nwrong | sai\nさくら'), (error) => {
    assert.match(error.message, /Dòng 4: .*hiragana hoặc katakana/);
    assert.match(error.message, /Dòng 5: .*2 hoặc 3 cột/);
    return true;
  });
});

test('rejects an unterminated quoted field, empty input and oversized input', () => {
  assert.throws(() => parseImport('ねこ,"mèo,猫'), /Dòng 1: .*ngoặc kép đóng/);
  assert.throws(() => parseImport(' \n '), /Dán danh sách/);
  assert.throws(() => parseImport('あ'.repeat(importLimit + 1)), /250.000/);
});

test('skips duplicates within the import and in the notebook', () => {
  const imported = parseImport('サクラ | HOA ANH ĐÀO | 桜\nねこ | con mèo | 猫\nネコ | con mèo | 猫\nねこ | họ Mèo | 猫');
  const existing = [{ kana: 'さくら', meaning: 'hoa anh đào', kanji: '桜' }];
  assert.deepEqual(uniqueImports(imported, existing), [imported[1], imported[3]]);
});
