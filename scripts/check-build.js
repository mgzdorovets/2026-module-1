const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const tracks = JSON.parse(fs.readFileSync(path.join(root, 'collection.json'), 'utf8'));
if (!tracks.length) throw new Error('Коллекция пуста');
const files = ['index.html', 'assets/showcase.css', 'assets/showcase.js'];
for (const track of tracks) {
  for (const key of ['student', 'title', 'file', 'cover']) if (!track[key]) throw new Error(`Отсутствует ${key}`);
  files.push(track.file, track.cover);
}
for (const file of files) if (!fs.existsSync(path.join(root,file))) throw new Error(`Файл отсутствует: ${file}`);
new (require('node:vm').Script)(fs.readFileSync(path.join(root,'assets/showcase.js'),'utf8'));
console.log(`Статический сайт готов: ${tracks.length} треков, все аудиофайлы и обложки доступны. Компиляция не требуется.`);
