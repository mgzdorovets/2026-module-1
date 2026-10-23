const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const tracksDir = path.join(root, 'tracks');
const outputPath = path.join(root, 'collection.json');

function formatDuration(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) return '';
  const wholeSeconds = Math.floor(seconds);
  return `${Math.floor(wholeSeconds / 60)}:${String(wholeSeconds % 60).padStart(2, '0')}`;
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

if (!fs.existsSync(outputPath)) throw new Error('collection.json отсутствует');
const collection = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
if (!Array.isArray(collection) || !collection.length) throw new Error('Коллекция пуста');

const listedFiles = new Set();
for (const track of collection) {
  if (typeof track.file !== 'string' || !/^tracks\/[a-z0-9._-]+\.mp3$/.test(track.file)) {
    throw new Error(`Небезопасный путь к аудио: ${String(track.file)}`);
  }
  const absolutePath = path.join(root, track.file);
  if (!fs.existsSync(absolutePath)) throw new Error(`Аудиофайл отсутствует: ${track.file}`);
  listedFiles.add(path.basename(track.file));
  const duration = readDuration(absolutePath);
  if (duration) track.duration = duration;
}

const unlistedFiles = fs.readdirSync(tracksDir)
  .filter((file) => path.extname(file).toLowerCase() === '.mp3' && !listedFiles.has(file));
if (unlistedFiles.length) {
  throw new Error(`Найдены MP3 без карточек: ${unlistedFiles.join(', ')}`);
}

fs.writeFileSync(outputPath, `${JSON.stringify(collection, null, 2)}\n`, 'utf8');
console.log(`Проверены длительности и безопасные пути: ${collection.length} трека.`);
