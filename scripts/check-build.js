const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const tracks = JSON.parse(fs.readFileSync(path.join(root, 'collection.json'), 'utf8'));
if (!tracks.length) throw new Error('Коллекция пуста');
const files = ['index.html', 'assets/showcase.css', 'assets/showcase.js'];
for (const track of tracks) {
  for (const key of ['student', 'title', 'file', 'duration']) if (!track[key]) throw new Error(`Отсутствует ${key}`);
  files.push(track.file);
  if (track.cover) files.push(track.cover);
}
for (const file of files) if (!fs.existsSync(path.join(root,file))) throw new Error(`Файл отсутствует: ${file}`);
new (require('node:vm').Script)(fs.readFileSync(path.join(root,'assets/showcase.js'),'utf8'));
const coverCount = tracks.filter((track) => track.cover).length;
console.log(`Статический сайт готов: ${tracks.length} треков, ${coverCount} обложек. Все подключённые файлы доступны.`);
