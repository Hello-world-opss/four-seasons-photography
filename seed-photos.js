// Regenerate sample photos with unique SVG gradient IDs
const fs = require('fs');
const path = require('path');
const os = require('os');

const PHOTOS_DIR = path.join(os.homedir(), 'Pictures', 'FourSeasons', 'photos');
const DATA_FILE = path.join(process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'), 'four-seasons-photography', 'data.json');

if (!fs.existsSync(PHOTOS_DIR)) fs.mkdirSync(PHOTOS_DIR, { recursive: true });

function createSeasonImage(season, index, photoId) {
  const palettes = {
    spring: [
      ['#c5d8c5', '#7a9e7e', '#e8c4c4', '#f0e0e0'],
      ['#d4e8d0', '#8db894', '#f5d5d5', '#e0f0e0'],
      ['#e0ecd8', '#a0c5a0', '#eed5d5', '#d5ead5']
    ],
    summer: [
      ['#f5e6c8', '#c49a3c', '#e07a5f', '#f0d8c0'],
      ['#f0ddb8', '#d4a84c', '#f0a060', '#e8d0a8'],
      ['#f8ecd0', '#ba8e30', '#d06848', '#f5e0c0']
    ],
    autumn: [
      ['#f0d5c0', '#c1703c', '#8b3a3a', '#e0c0a8'],
      ['#e8c8b0', '#d08050', '#a05030', '#f0d0b8'],
      ['#f5ddd0', '#b06030', '#9b4040', '#e8c8b0']
    ],
    winter: [
      ['#d4e0e8', '#6b8ba4', '#ffffff', '#c0d4e0'],
      ['#e0e8f0', '#80a0b8', '#f8f8ff', '#d0dce8'],
      ['#c8d8e4', '#5a7a94', '#f0f0ff', '#b8c8d8']
    ]
  };

  const [bgTop, bgBot, sun, accent] = palettes[season][index % 3];
  const w = 800, h = 600;
  // Unique IDs per photo to avoid SVG collisions
  const uid = photoId.replace(/[^a-zA-Z0-9]/g, '_');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<defs>
  <linearGradient id="sky-${uid}" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="${bgTop}"/>
    <stop offset="60%" stop-color="${bgBot}"/>
    <stop offset="100%" stop-color="${bgTop}"/>
  </linearGradient>
  <radialGradient id="sun-${uid}" cx="70%" cy="25%" r="35%">
    <stop offset="0%" stop-color="${sun}" stop-opacity="0.35"/>
    <stop offset="100%" stop-color="${sun}" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="acc-${uid}" cx="25%" cy="70%" r="40%">
    <stop offset="0%" stop-color="${accent}" stop-opacity="0.3"/>
    <stop offset="100%" stop-color="${accent}" stop-opacity="0"/>
  </radialGradient>
</defs>
<rect width="${w}" height="${h}" fill="url(#sky-${uid})"/>
<rect width="${w}" height="${h}" fill="url(#sun-${uid})"/>
<rect width="${w}" height="${h}" fill="url(#acc-${uid})"/>
<path d="M0 ${h} L120 380 L280 420 L450 320 L600 400 L750 340 L800 480 L800 ${h} Z" fill="${bgTop}" opacity="0.35"/>
<path d="M0 ${h} L200 450 L350 480 L520 400 L680 460 L800 420 L800 ${h} Z" fill="${bgBot}" opacity="0.2"/>
<rect x="0" y="480" width="${w}" height="120" fill="${bgBot}" opacity="0.1"/>
</svg>`;

  return 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
}

function saveImage(photoId, dataUrl) {
  const matches = dataUrl.match(/^data:image\/([\w+-]+);base64,(.+)$/);
  const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1] === 'svg+xml' ? 'svg' : matches[1];
  const filename = photoId + '.' + ext;
  const filePath = path.join(PHOTOS_DIR, filename);
  if (ext === 'svg') {
    fs.writeFileSync(filePath, Buffer.from(matches[2], 'base64').toString('utf-8'), 'utf-8');
  } else {
    fs.writeFileSync(filePath, Buffer.from(matches[2], 'base64'));
  }
  return 'local-img:///' + filePath.replace(/\\/g, '/');
}

// Also try to recover orphaned photos (files without data records)
function recoverOrphanedPhotos(data) {
  const knownIds = new Set();
  data.albums.forEach(a => a.photos.forEach(p => knownIds.add(p.id)));

  const files = fs.readdirSync(PHOTOS_DIR);
  const orphaned = files.filter(f => {
    const id = path.parse(f).name;
    return !id.startsWith('sample-') && !knownIds.has(id);
  });

  if (orphaned.length > 0) {
    console.log('\nRecovering orphaned photos:');
    const springAlbum = data.albums.find(a => a.season === 'spring');
    orphaned.forEach(f => {
      const id = path.parse(f).name;
      const filePath = 'local-img:///' + path.join(PHOTOS_DIR, f).replace(/\\/g, '/');
      springAlbum.photos.push({
        id: id,
        title: f.replace(/\.[^.]+$/, ''),
        url: filePath,
        season: 'spring',
        addedAt: new Date().toISOString()
      });
      if (!springAlbum.cover) springAlbum.cover = filePath;
      knownIds.add(id);
      console.log('  Recovered: ' + f);
    });
  }
  return data;
}

const titles = {
  spring: ['晨光·龙门', '樱花雨·洛河畔', '新绿·万物生'],
  summer: ['暮色·天堂明堂', '金晖·应天门', '浓影·古城墙'],
  autumn: ['银杏·白马寺', '梧桐·老城巷', '红叶·禅意'],
  winter: ['雪落·龙门石窟', '冰封·洛河', '寂静·古都']
};

let data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));

console.log('Regenerating sample photos with unique SVG IDs...\n');

// Remove old sample photos from data and disk
data.albums.forEach(album => {
  album.photos = album.photos.filter(p => {
    if (p.id && p.id.startsWith('sample-')) {
      // Delete old file
      for (const ext of ['svg', 'jpg', 'png']) {
        const fp = path.join(PHOTOS_DIR, p.id + '.' + ext);
        if (fs.existsSync(fp)) { fs.unlinkSync(fp); console.log('  Deleted old: ' + p.id + '.' + ext); }
      }
      return false;
    }
    return true;
  });
  if (album.cover && album.cover.includes('sample-')) album.cover = '';
});

// Regenerate
Object.keys(titles).forEach(season => {
  const album = data.albums.find(a => a.season === season);
  if (!album) return;

  titles[season].forEach((title, i) => {
    const photoId = 'sample-' + season + '-' + (i + 1);
    const dataUrl = createSeasonImage(season, i, photoId);
    const filePath = saveImage(photoId, dataUrl);

    album.photos.push({
      id: photoId,
      title: title,
      url: filePath,
      season: season,
      addedAt: new Date().toISOString()
    });

    if (!album.cover) album.cover = filePath;
    console.log('  Added: ' + title);
  });
});

// Try to recover orphaned photos
data = recoverOrphanedPhotos(data);

// Set spread images
['spring', 'summer', 'autumn', 'winter'].forEach(s => {
  const album = data.albums.find(a => a.season === s);
  if (album && album.photos.length > 0) {
    data.spreadImages[s] = album.photos[0].url;
  }
});

const tmp = DATA_FILE + '.tmp';
fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8');
fs.renameSync(tmp, DATA_FILE);

console.log('\nDone! All photos regenerated with unique IDs.');
console.log('Total photos: ' + data.albums.reduce((s, a) => s + a.photos.length, 0));
