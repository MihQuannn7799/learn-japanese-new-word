export const starterWords = [
  ['さくら', 'hoa anh đào', '桜', '公園の桜が咲きました。', 'Hoa anh đào trong công viên đã nở.'],
  ['ねこ', 'con mèo', '猫', '猫は窓のそばで寝ています。', 'Con mèo đang ngủ cạnh cửa sổ.'],
  ['みず', 'nước', '水', '朝起きて、水を飲みます。', 'Tôi uống nước sau khi thức dậy vào buổi sáng.'],
  ['ともだち', 'bạn bè', '友達', '週末に友達に会います。', 'Cuối tuần tôi gặp bạn.'],
  ['やま', 'núi', '山', '駅から山が見えます。', 'Có thể nhìn thấy núi từ nhà ga.'],
  ['コーヒー', 'cà phê', '', '父は朝にコーヒーを飲みます。', 'Bố tôi uống cà phê vào buổi sáng.'],
  ['たべる', 'ăn', '食べる', '昼ご飯におにぎりを食べます。', 'Tôi ăn cơm nắm vào bữa trưa.'],
  ['あした', 'ngày mai', '明日', '明日は図書館に行きます。', 'Ngày mai tôi đi thư viện.'],
].map(([kana, meaning, kanji, example, exampleMeaning], index) => ({
  id: `sample-${index}`, kana, meaning, kanji, example, exampleMeaning,
}));
