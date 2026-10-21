const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const tracksDir = path.join(root, 'tracks');
const coversDir = path.join(root, 'covers');
const outputPath = path.join(root, 'collection.json');
const coverExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'];

function urlPath(...segments) {
  return segments.join('/');
}

function formatDuration(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) return '';
  const rounded = Math.round(seconds);
  return `${Math.floor(rounded / 60)}:${String(rounded % 60).padStart(2, '0')}`;
}

function readDuration(filePath) {
  const ffprobe = spawnSync('ffprobe', [
    '-v', 'error', '-show_entries', 'format=duration',
    '-of', 'default=noprint_wrappers=1:nokey=1', filePath,
  ], { encoding: 'utf8' });
  if (ffprobe.status === 0) return formatDuration(Number.parseFloat(ffprobe.stdout));

  const afinfo = spawnSync('afinfo', [filePath], { encoding: 'utf8' });
  if (afinfo.status === 0) {
    const match = afinfo.stdout.match(/estimated duration:\s*([\d.]+)\s*sec/i);
    if (match) return formatDuration(Number.parseFloat(match[1]));
  }

  return '';
}

function loadExistingCollection() {
  if (!fs.existsSync(outputPath)) return new Map();
  try {
    const collection = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
    return new Map(collection.map((track) => [track.file, track]));
  } catch (error) {
    throw new Error(`Не удалось прочитать collection.json: ${error.message}`);
  }
}

function findCover(baseName) {
  if (!fs.existsSync(coversDir)) return '';
  const match = fs.readdirSync(coversDir).find((fileName) => {
    const extension = path.extname(fileName).toLowerCase();
    return path.basename(fileName, extension) === baseName && coverExtensions.includes(extension);
  });
  return match ? urlPath('covers', match) : '';
}

function trackFromFile(fileName, existingTracks) {
  const extension = path.extname(fileName);
  const baseName = path.basename(fileName, extension);
  const match = baseName.match(/^(student-\d{3})-track-(\d{2})-module-(\d+)$/);

  if (!match) {
    throw new Error(
      `Неверное имя файла «${fileName}». Используйте student-XXX-track-YY-module-N.mp3`,
    );
  }

  const [, student, , moduleNumber] = match;
  const file = urlPath('tracks', fileName);
  const existing = existingTracks.get(file);
  const cover = findCover(baseName);
  const track = {
    file,
    student,
    module: `Модуль ${Number(moduleNumber)}`,
    title: existing?.title || 'Без названия',
    duration: existing?.duration || readDuration(path.join(tracksDir, fileName)) || '—',
  };

  if (cover) track.cover = cover;
  return track;
}

const files = fs.readdirSync(tracksDir)
  .filter((fileName) => path.extname(fileName).toLowerCase() === '.mp3')
  .sort((a, b) => a.localeCompare(b, 'ru'));

const existingTracks = loadExistingCollection();
const collection = files.map((fileName) => trackFromFile(fileName, existingTracks));
fs.writeFileSync(outputPath, `${JSON.stringify(collection, null, 2)}\n`, 'utf8');

const missingCovers = collection.filter((track) => !track.cover);
console.log(`Обновлён collection.json: ${collection.length} треков.`);
if (missingCovers.length) {
  console.warn('Нет индивидуальных обложек:');
  for (const track of missingCovers) {
    console.warn(`- ${path.basename(track.file, '.mp3')}.[png|jpg|jpeg|gif|svg|webp]`);
  }
}
