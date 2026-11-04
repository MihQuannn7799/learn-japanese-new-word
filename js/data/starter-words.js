export const starterWords = [
  ['さくら', 'hoa anh đào', '桜'],
  ['ねこ', 'con mèo', '猫'],
  ['みず', 'nước', '水'],
  ['ともだち', 'bạn bè', '友達'],
  ['やま', 'núi', '山'],
  ['コーヒー', 'cà phê', ''],
  ['たべる', 'ăn', '食べる'],
  ['あした', 'ngày mai', '明日'],
].map(([kana, meaning, kanji], index) => ({ id: `sample-${index}`, kana, meaning, kanji }));
