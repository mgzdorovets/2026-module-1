const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const collectionPath = path.join(root, 'collection.json');
const tracks = JSON.parse(fs.readFileSync(collectionPath, 'utf8'));

if (!Array.isArray(tracks) || !tracks.length) throw new Error('Коллекция пуста');

const publicPathPattern = /^[a-z0-9._/-]+$/;
const resolvePublicPath = (file) => {
  if (typeof file !== 'string' || !file || !publicPathPattern.test(file)) {
    throw new Error(`Небезопасный публичный путь: ${String(file)}`);
  }
  const resolved = path.resolve(root, file);
  if (!resolved.startsWith(`${root}${path.sep}`)) throw new Error(`Путь выходит за пределы проекта: ${file}`);
  return resolved;
};

const requiredFiles = new Set([
  'index.html',
  'assets/showcase.css',
  'assets/showcase.js',
  'assets/music-dna/hero-neon-dna.webp',
]);
const trackFiles = new Set();
const coverFiles = new Set();

for (const track of tracks) {
  for (const key of ['student', 'title', 'module', 'file', 'duration', 'cover']) {
    if (typeof track[key] !== 'string' || !track[key]) throw new Error(`Отсутствует ${key}`);
  }
  if (!/^Код ДНК: \d+$/.test(track.title)) throw new Error(`Некорректный формат кода ДНК: ${track.title}`);
  if (!track.file.endsWith('.mp3')) throw new Error(`Ожидался MP3: ${track.file}`);
  if (trackFiles.has(track.file)) throw new Error(`Аудиофайл подключён дважды: ${track.file}`);
  trackFiles.add(track.file);
  coverFiles.add(track.cover);
  requiredFiles.add(track.file);
  requiredFiles.add(track.cover);
}

for (const file of requiredFiles) {
  const resolved = resolvePublicPath(file);
  if (!fs.existsSync(resolved)) throw new Error(`Файл отсутствует: ${file}`);
}

const imageExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const publicImageFiles = [
  ...fs.readdirSync(path.join(root, 'covers')).map((file) => `covers/${file}`),
  ...fs.readdirSync(path.join(root, 'assets/music-dna')).map((file) => `assets/music-dna/${file}`),
].filter((file) => imageExtensions.has(path.extname(file).toLowerCase()));
const metadataMarkers = ['Exif\0\0', 'http://ns.adobe.com/xap/1.0/', 'Photoshop 3.0', 'XMP '];
for (const file of publicImageFiles) {
  const data = fs.readFileSync(path.join(root, file));
  if (metadataMarkers.some((marker) => data.includes(Buffer.from(marker)))) {
    throw new Error(`Метаданные изображения требуют проверки: ${file}`);
  }
}

const publicMp3Files = fs.readdirSync(path.join(root, 'tracks'))
  .filter((file) => path.extname(file).toLowerCase() === '.mp3');
for (const fileName of publicMp3Files) {
  const relativePath = `tracks/${fileName}`;
  if (!trackFiles.has(relativePath)) throw new Error(`Неиспользуемый публичный MP3: ${relativePath}`);
  const data = fs.readFileSync(path.join(root, relativePath));
  if (data.subarray(0, 3).toString('ascii') === 'ID3') throw new Error(`ID3v2 требует проверки: ${relativePath}`);
  if (data.length >= 128 && data.subarray(data.length - 128, data.length - 125).toString('ascii') === 'TAG') {
    throw new Error(`ID3v1 требует проверки: ${relativePath}`);
  }
}

for (const privateName of ['student_mapping.txt', 'Список.numbers', 'Скриншот ДНК', 'Скриншоты', 'Треки', 'Обложки']) {
  if (fs.existsSync(path.join(root, privateName))) throw new Error(`Приватный материал внутри сайта: ${privateName}`);
}

for (const file of ['index.html', 'assets/showcase.css', 'assets/showcase.js', 'collection.json']) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  if (/file:\/\/|\/Users\/|[A-Za-z]:\\/.test(source)) throw new Error(`Локальный путь найден в ${file}`);
}

new vm.Script(fs.readFileSync(path.join(root, 'assets/showcase.js'), 'utf8'));

const initialFiles = [...requiredFiles].filter((file) => !file.startsWith('tracks/'));
const initialBytes = initialFiles.reduce((total, file) => total + fs.statSync(path.join(root, file)).size, 0);
console.log(
  `Статический сайт готов: ${tracks.length} трека, ${coverFiles.size} обложки. `
  + `Все пути безопасны, публичные MP3 не содержат ID3, начальные локальные ресурсы — ${(initialBytes / 1024 / 1024).toFixed(2)} МБ.`,
);
