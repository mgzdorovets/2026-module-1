'use strict';

const audio = document.querySelector('#audio');
const grid = document.querySelector('#tracks');
const status = document.querySelector('#status');
const playIcon = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 2.5 13.5 8l-9 5.5z"/></svg>';
const pauseIcon = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 2.5h3.5v11H3.5zm5.5 0h3.5v11H9z"/></svg>';

let tracks = [];
let activeIndex = -1;
let playRequest = 0;

const formatTime = (seconds) => Number.isFinite(seconds)
  ? `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`
  : '0:00';

function pluralizeRu(count, one, few, many) {
  const absolute = Math.abs(count) % 100;
  const lastDigit = absolute % 10;
  if (absolute >= 11 && absolute <= 14) return many;
  if (lastDigit === 1) return one;
  if (lastDigit >= 2 && lastDigit <= 4) return few;
  return many;
}

const countPhrase = (count, one, few, many) => `${count} ${pluralizeRu(count, one, few, many)}`;

function makeElement(tag, className, text) {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function updateCards() {
  const isPlaying = !audio.paused && !audio.ended;
  grid.querySelectorAll('.track-card').forEach((card, index) => {
    const isActive = index === activeIndex;
    const button = card.querySelector('.play-button');
    card.classList.toggle('active', isActive);
    card.classList.toggle('playing', isActive && isPlaying);
    button.innerHTML = isActive && isPlaying ? pauseIcon : playIcon;
    button.setAttribute('aria-pressed', String(isActive && isPlaying));
    button.setAttribute('aria-label', `${isActive && isPlaying ? 'Пауза' : 'Воспроизвести'}: ${tracks[index].title} — ${tracks[index].student}`);
  });
}

function updateProgress() {
  if (activeIndex < 0) return;
  const card = grid.children[activeIndex];
  const progress = card.querySelector('.progress');
  const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
  const percent = duration ? audio.currentTime / duration * 100 : 0;
  progress.value = percent;
  progress.style.setProperty('--progress', `${percent}%`);
  progress.setAttribute('aria-valuetext', `${formatTime(audio.currentTime)} из ${formatTime(duration)}`);
  card.querySelector('.duration').textContent = formatTime(duration);
}

function setMediaMetadata(track) {
  if (!('mediaSession' in navigator) || !('MediaMetadata' in window)) return;
  const metadata = {
    title: track.title,
    artist: track.student,
    album: 'Музыкальная ДНК — Модуль 01',
  };
  if (track.cover) metadata.artwork = [{ src: new URL(track.cover, window.location.href).href }];
  navigator.mediaSession.metadata = new MediaMetadata(metadata);
}

async function toggleTrack(index) {
  const request = ++playRequest;
  status.textContent = '';
  if (activeIndex === index && !audio.paused) {
    audio.pause();
    return;
  }
  if (activeIndex !== index) {
    audio.pause();
    if (activeIndex >= 0) {
      const previous = grid.children[activeIndex].querySelector('.progress');
      previous.value = 0;
      previous.style.setProperty('--progress', '0%');
    }
    activeIndex = index;
    audio.src = tracks[index].file;
    setMediaMetadata(tracks[index]);
  }
  updateCards();
  try {
    await audio.play();
  } catch (error) {
    if (request === playRequest && error.name !== 'AbortError') status.textContent = 'Не удалось воспроизвести трек. Попробуйте ещё раз.';
  }
  updateCards();
}

function seekTrack(index, value) {
  const seek = () => {
    if (Number.isFinite(audio.duration)) audio.currentTime = Number(value) / 100 * audio.duration;
  };
  if (activeIndex !== index) toggleTrack(index).then(seek);
  else seek();
}

function createTrackCard(track, index) {
  const card = makeElement('article', 'track-card');
  const coverWrap = makeElement('div', 'cover-wrap');
  if (track.cover) {
    const image = makeElement('img', 'cover');
    image.src = track.cover;
    image.alt = `Обложка композиции «${track.title}»`;
    image.loading = index < 2 ? 'eager' : 'lazy';
    image.decoding = 'async';
    image.width = 512;
    image.height = 512;
    coverWrap.append(image);
  } else {
    coverWrap.classList.add('cover-missing');
    coverWrap.setAttribute('role', 'img');
    coverWrap.setAttribute('aria-label', `Обложка композиции «${track.title}» пока не добавлена`);
  }
  const controls = makeElement('div', 'track-controls');
  const button = makeElement('button', 'play-button');
  button.type = 'button';
  button.innerHTML = playIcon;
  button.addEventListener('click', () => toggleTrack(index));
  const progress = makeElement('input', 'progress');
  progress.type = 'range';
  progress.min = '0';
  progress.max = '100';
  progress.step = '.1';
  progress.value = '0';
  progress.setAttribute('aria-label', `Позиция: ${track.title}`);
  progress.addEventListener('input', (event) => seekTrack(index, event.target.value));
  const duration = makeElement('span', 'duration', track.duration || '0:00');
  controls.append(button, progress, duration);
  const info = makeElement('div', 'track-info');
  info.append(makeElement('h3', '', track.student), makeElement('p', '', track.title));
  card.append(coverWrap, controls, info);
  return card;
}

for (const event of ['play', 'pause', 'ended', 'emptied']) audio.addEventListener(event, updateCards);
audio.addEventListener('timeupdate', updateProgress);
audio.addEventListener('loadedmetadata', updateProgress);
audio.addEventListener('error', () => {
  status.textContent = 'Аудиофайл недоступен. Выберите другой трек или попробуйте позже.';
  updateCards();
});

if ('mediaSession' in navigator) {
  navigator.mediaSession.setActionHandler('play', () => { if (activeIndex >= 0) toggleTrack(activeIndex); });
  navigator.mediaSession.setActionHandler('pause', () => audio.pause());
  navigator.mediaSession.setActionHandler('seekto', (details) => {
    if (Number.isFinite(details.seekTime)) audio.currentTime = details.seekTime;
  });
}

async function init() {
  try {
    const response = await fetch('collection.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    tracks = await response.json();
    tracks.forEach((track, index) => grid.append(createTrackCard(track, index)));
    const count = tracks.length;
    const students = countPhrase(count, 'ученик', 'ученика', 'учеников');
    const dna = countPhrase(count, 'уникальная музыкальная ДНК', 'уникальные музыкальные ДНК', 'уникальных музыкальных ДНК');
    const trackCount = countPhrase(count, 'трек', 'трека', 'треков');
    document.querySelector('#track-count').innerHTML = `${trackCount}<br> первого модуля`;
    document.querySelector('#hero-track-count').textContent = `${students}. ${dna}.`;
    updateCards();
  } catch (error) {
    status.textContent = 'Не удалось загрузить коллекцию. Обновите страницу, чтобы попробовать снова.';
  } finally {
    grid.setAttribute('aria-busy', 'false');
  }
}

init();
