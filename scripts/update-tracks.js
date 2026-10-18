const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const tracksDir = path.join(root, 'tracks');
const coversDir = path.join(root, 'covers');
const outputPath = path.join(root, 'tracks.json');
const coverExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.tiff'];

function formatSize(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function urlPath(...segments) {
  return segments.join('/');
}

function trackIdentity(filePath) {
  return filePath.replace(/-module-\d+(?=\.mp3$)/, '');
}

function findCover(baseName, title) {
  const coverFileNames = fs.readdirSync(coversDir);
  const matchingCover = coverFileNames.find((fileName) => {
    const extension = path.extname(fileName).toLowerCase();
    return path.basename(fileName, path.extname(fileName)) === baseName
      && coverExtensions.includes(extension);
  });

  if (matchingCover) return urlPath('covers', matchingCover);

  const generatedCover = path.join(coversDir, 'generated', `${title}.svg`);
  return fs.existsSync(generatedCover)
    ? urlPath('covers', 'generated', `${title}.svg`)
    : 'covers/default.jpeg';
}

function loadExistingTracks() {
  if (!fs.existsSync(outputPath)) return new Map();

  try {
    const tracks = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
    return new Map(tracks.map((track) => [trackIdentity(track.file), track]));
  } catch (error) {
    throw new Error(`Не удалось прочитать tracks.json: ${error.message}`);
  }
}

function trackFromFile(fileName, existingTracks) {
  const extension = path.extname(fileName);
  const baseName = path.basename(fileName, extension);
  const match = baseName.match(/^(student-\d{3})-track-(\d{2})(?:-module-(\d+))?$/);

  if (!match) {
    throw new Error(
      `Неверное имя файла «${fileName}». Используйте формат: student-XXX-track-YY-module-N.mp3`,
    );
  }

  const [, student, , moduleNumber] = match;
  const file = urlPath('tracks', fileName);
  const existingTrack = existingTracks.get(trackIdentity(file));
  const title = existingTrack?.title || 'Без названия';
  const cover = findCover(baseName, title);

  return {
    file,
    student,
    module: moduleNumber ? `Модуль ${Number(moduleNumber)}` : existingTrack?.module || 'Без модуля',
    title,
    cover,
    size: formatSize(fs.statSync(path.join(tracksDir, fileName)).size),
  };
}

const files = fs.readdirSync(tracksDir)
  .filter((fileName) => path.extname(fileName).toLowerCase() === '.mp3')
  .sort((a, b) => a.localeCompare(b, 'ru'));

const existingTracks = loadExistingTracks();
const tracks = files.map((fileName) => trackFromFile(fileName, existingTracks));
fs.writeFileSync(outputPath, `${JSON.stringify(tracks, null, 2)}\n`, 'utf8');
console.log(`Обновлён tracks.json: ${tracks.length} треков.`);
