const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Data directory — Railway mounts persistent volumes here
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'cloud-data');
const DATA_FILE = path.join(DATA_DIR, 'data.json');
const PHOTOS_DIR = path.join(DATA_DIR, 'photos');

function ensureDirs() {
  [DATA_DIR, PHOTOS_DIR].forEach(d => {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  });
}
ensureDirs();

app.use(express.json({ limit: '100mb' }));

// CORS — allow local Electron and any web client
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Serve photos — cloud-data first (uploads), then pre-packaged samples
app.use('/photos', express.static(PHOTOS_DIR));
app.use('/photos', express.static(path.join(__dirname, 'photos')));
// Serve all other static files from project root
app.use(express.static(__dirname));

// ── Seed data with sample photos ──
function getSeedData() {
  return {
    adminPassword: 'admin123',
    adminEmail: '2041902160@qq.com',
    emailConfig: { publicKey: '', serviceId: '', templateId: '', fromName: '春·夏·秋·冬', fromEmail: '2041902160@qq.com' },
    submissions: [],
    albums: [
      { id: 'album-spring', name: '春 · 万物生', season: 'spring', cover: '', bgm: '', photos: [] },
      { id: 'album-summer', name: '夏 · 炽热诗', season: 'summer', cover: '', bgm: '', photos: [] },
      { id: 'album-autumn', name: '秋 · 落叶赋', season: 'autumn', cover: '', bgm: '', photos: [] },
      { id: 'album-winter', name: '冬 · 寂静歌', season: 'winter', cover: '', bgm: '', photos: [] }
    ],
    spreadImages: { spring: '', summer: '', autumn: '', winter: '' },
    spreadDescriptions: {
      spring: '万物复苏，光影在嫩绿间流转。洛阳的春天从龙门山的第一缕晨光开始，到洛河畔的樱花雨落下。每一帧都是生命的序章，每一次快门都是与自然的低语。',
      summer: '烈日下的浓影，暮色中的金色时刻。洛阳的夏日，是天堂明堂在夕阳下的剪影，是应天门广场的热浪蒸腾。镜头里的夏天，炽热而纯粹。',
      autumn: '层林尽染，洛阳城在金黄与深红中沉醉。白马寺的银杏铺满庭院，老城的青石板路落满梧桐。秋天是摄影师最钟情的季节，每一片落叶都是构图的诗篇。',
      winter: '雪落无声，千年古都在纯白中归于沉静。龙门石窟的佛面覆上薄雪，洛河冰封如镜。冬日的镜头语言是留白，是极简，是万籁俱寂中的力量。'
    },
    users: [],
    adminSettings: { siteTitle: '春·夏·秋·冬', photographerName: '王仁强' }
  };
}

function createSampleSVG(season, index, photoId) {
  const palettes = {
    spring: [['#c5d8c5','#7a9e7e','#e8c4c4','#f0e0e0'], ['#d4e8d0','#8db894','#f5d5d5','#e0f0e0'], ['#e0ecd8','#a0c5a0','#eed5d5','#d5ead5']],
    summer: [['#f5e6c8','#c49a3c','#e07a5f','#f0d8c0'], ['#f0ddb8','#d4a84c','#f0a060','#e8d0a8'], ['#f8ecd0','#ba8e30','#d06848','#f5e0c0']],
    autumn: [['#f0d5c0','#c1703c','#8b3a3a','#e0c0a8'], ['#e8c8b0','#d08050','#a05030','#f0d0b8'], ['#f5ddd0','#b06030','#9b4040','#e8c8b0']],
    winter: [['#d4e0e8','#6b8ba4','#ffffff','#c0d4e0'], ['#e0e8f0','#80a0b8','#f8f8ff','#d0dce8'], ['#c8d8e4','#5a7a94','#f0f0ff','#b8c8d8']]
  };
  const [bgTop, bgBot, sun, accent] = palettes[season][index % 3];
  const uid = photoId.replace(/[^a-zA-Z0-9]/g, '_');
  const w = 800, h = 600;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<defs>
  <linearGradient id="sky-${uid}" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="${bgTop}"/><stop offset="60%" stop-color="${bgBot}"/><stop offset="100%" stop-color="${bgTop}"/>
  </linearGradient>
  <radialGradient id="sun-${uid}" cx="70%" cy="25%" r="35%">
    <stop offset="0%" stop-color="${sun}" stop-opacity="0.35"/><stop offset="100%" stop-color="${sun}" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="acc-${uid}" cx="25%" cy="70%" r="40%">
    <stop offset="0%" stop-color="${accent}" stop-opacity="0.3"/><stop offset="100%" stop-color="${accent}" stop-opacity="0"/>
  </radialGradient>
</defs>
<rect width="${w}" height="${h}" fill="url(#sky-${uid})"/>
<rect width="${w}" height="${h}" fill="url(#sun-${uid})"/>
<rect width="${w}" height="${h}" fill="url(#acc-${uid})"/>
<path d="M0 ${h} L120 380 L280 420 L450 320 L600 400 L750 340 L800 480 L800 ${h} Z" fill="${bgTop}" opacity="0.35"/>
<path d="M0 ${h} L200 450 L350 480 L520 400 L680 460 L800 420 L800 ${h} Z" fill="${bgBot}" opacity="0.2"/>
<rect x="0" y="480" width="${w}" height="120" fill="${bgBot}" opacity="0.1"/>
</svg>`;
}

const sampleTitles = {
  spring: ['晨光·龙门山', '樱花·洛河畔', '新绿·生命序章'],
  summer: ['暮色·天堂明堂', '金晖·应天门', '浓影·古城墙'],
  autumn: ['银杏·白马寺', '梧桐·老城巷', '红叶·禅意'],
  winter: ['雪落·龙门石窟', '冰封·洛河', '寂静·古都']
};

function seedSamplePhotos(data) {
  let changed = false;
  for (const season of ['spring', 'summer', 'autumn', 'winter']) {
    const album = data.albums.find(a => a.season === season);
    if (!album) continue;
    const existing = album.photos.filter(p => p.id && p.id.startsWith('sample-'));
    if (existing.length === 3) continue; // Already seeded

    sampleTitles[season].forEach((title, i) => {
      const photoId = 'sample-' + season + '-' + (i + 1);
      if (album.photos.find(p => p.id === photoId)) return;
      const svg = createSampleSVG(season, i, photoId);
      const filePath = path.join(PHOTOS_DIR, photoId + '.svg');
      fs.writeFileSync(filePath, svg, 'utf-8');
      album.photos.push({
        id: photoId, title: title,
        url: '/photos/' + photoId + '.svg',
        season: season, addedAt: new Date().toISOString()
      });
      changed = true;
    });
    if (!album.cover || !album.cover.startsWith('/photos/')) {
      const first = album.photos.find(p => p.id && p.id.startsWith('sample-'));
      if (first) album.cover = first.url;
    }
  }
  // Set spread images
  for (const s of ['spring', 'summer', 'autumn', 'winter']) {
    if (!data.spreadImages[s] || !data.spreadImages[s].startsWith('/photos/')) {
      const album = data.albums.find(a => a.season === s);
      if (album && album.photos.length > 0) {
        data.spreadImages[s] = album.photos[0].url;
      }
    }
  }
  return changed;
}

function loadData() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      const data = getSeedData();
      seedSamplePhotos(data);
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
      console.log('[Data] Initialized seed data');
      return data;
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const data = JSON.parse(raw);
    if (seedSamplePhotos(data)) {
      const tmp = DATA_FILE + '.tmp';
      fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
      fs.renameSync(tmp, DATA_FILE);
    }
    return data;
  } catch (err) {
    console.error('[Data] Load failed:', err.message);
    return getSeedData();
  }
}

function saveData(data) {
  const tmp = DATA_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tmp, DATA_FILE);
}

// ── API Routes ──
app.get('/api/data', (req, res) => {
  try { res.json(loadData()); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/data', (req, res) => {
  try {
    saveData(req.body);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/image', (req, res) => {
  try {
    const { id, dataUrl } = req.body;
    if (!id || !dataUrl) return res.status(400).json({ error: 'Missing id or dataUrl' });
    const matches = dataUrl.match(/^data:image\/([\w+-]+);base64,(.+)$/);
    if (!matches) return res.status(400).json({ error: 'Invalid dataUrl' });
    const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1] === 'svg+xml' ? 'svg' : matches[1];
    const buffer = Buffer.from(matches[2], 'base64');
    const filename = id + '.' + ext;
    const filePath = path.join(PHOTOS_DIR, filename);
    if (ext === 'svg') {
      fs.writeFileSync(filePath, buffer.toString('utf-8'), 'utf-8');
    } else {
      fs.writeFileSync(filePath, buffer);
    }
    res.json({ success: true, url: '/photos/' + filename });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/image/:id', (req, res) => {
  try {
    const id = req.params.id;
    for (const ext of ['jpg', 'jpeg', 'png', 'webp', 'bmp', 'svg']) {
      const fp = path.join(PHOTOS_DIR, id + '.' + ext);
      if (fs.existsSync(fp)) fs.unlinkSync(fp);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Health check
app.get('/api/health', (req, res) => res.json({ ok: true, ts: Date.now() }));

// Fallback to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n  ✦ 春·夏·秋·冬 Cloud Server ✦`);
  console.log(`  Port: ${PORT}`);
  console.log(`  Data: ${DATA_FILE}`);
  console.log(`  Photos: ${PHOTOS_DIR}\n`);
});
