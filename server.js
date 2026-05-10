const express = require('express');
const path = require('path');
const fs = require('fs');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 3000;

// Shared storage paths (same as Electron app)
const DATA_FILE = path.join(process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'), 'four-seasons-photography', 'data.json');
const PHOTOS_DIR = path.join(os.homedir(), 'Pictures', 'FourSeasons', 'photos');

// Ensure directories exist
const dataDir = path.dirname(DATA_FILE);
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(PHOTOS_DIR)) fs.mkdirSync(PHOTOS_DIR, { recursive: true });

app.use(express.json({ limit: '100mb' }));

// Serve static files from root (but NOT index.html — that's from src/)
app.use(express.static(__dirname, { index: false }));

// Serve images from shared photos directory (must come before src/ to take priority)
app.use('/photos', express.static(PHOTOS_DIR));

// Serve static files from src/ (Electron + Web unified version)
app.use(express.static(path.join(__dirname, 'src')));

// ── Data API ──
app.get('/api/data', (req, res) => {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      return res.json(getDefaultData());
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const data = JSON.parse(raw);
    // Convert local-img:// paths to /photos/ paths for web
    const webData = convertImagesForWeb(data);
    res.json(webData);
  } catch (err) {
    console.error('GET /api/data error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/data', (req, res) => {
  try {
    const data = convertImagesForStorage(req.body);
    const tmp = DATA_FILE + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tmp, DATA_FILE);
    res.json({ success: true });
  } catch (err) {
    console.error('POST /api/data error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Image API ──
app.post('/api/image', (req, res) => {
  try {
    const { id, dataUrl } = req.body;
    if (!id || !dataUrl) return res.status(400).json({ error: 'Missing id or dataUrl' });

    const matches = dataUrl.match(/^data:image\/([\w+-]+);base64,(.+)$/);
    if (!matches) return res.status(400).json({ error: 'Invalid dataUrl' });

    const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
    const buffer = Buffer.from(matches[2], 'base64');
    const filename = id + '.' + ext;
    fs.writeFileSync(path.join(PHOTOS_DIR, filename), buffer);

    res.json({ success: true, filePath: '/photos/' + filename, url: '/photos/' + filename });
  } catch (err) {
    console.error('POST /api/image error:', err.message);
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

// ── Backup API ──
app.post('/api/backup/export', (req, res) => {
  try {
    const data = req.body;
    // Convert /photos/ paths to base64 for portable export
    const exportData = JSON.parse(JSON.stringify(data));
    for (const album of exportData.albums || []) {
      for (const photo of album.photos || []) {
        if (photo.url && photo.url.startsWith('/photos/')) {
          const fp = path.join(PHOTOS_DIR, path.basename(photo.url));
          if (fs.existsSync(fp)) {
            const buf = fs.readFileSync(fp);
            const ext = path.extname(fp).slice(1).toLowerCase();
            const mimeMap = { jpg: 'jpeg', jpeg: 'jpeg', png: 'png', webp: 'webp', svg: 'svg+xml' };
            photo.url = 'data:image/' + (mimeMap[ext] || 'jpeg') + ';base64,' + buf.toString('base64');
          }
        }
      }
      if (album.cover && album.cover.startsWith('/photos/')) {
        const fp = path.join(PHOTOS_DIR, path.basename(album.cover));
        if (fs.existsSync(fp)) {
          const buf = fs.readFileSync(fp);
          const ext = path.extname(fp).slice(1).toLowerCase();
          const mimeMap = { jpg: 'jpeg', jpeg: 'jpeg', png: 'png', webp: 'webp', svg: 'svg+xml' };
          album.cover = 'data:image/' + (mimeMap[ext] || 'jpeg') + ';base64,' + buf.toString('base64');
        }
      }
    }
    res.json(exportData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/backup/import', (req, res) => {
  try {
    const data = req.body;
    for (const album of data.albums || []) {
      for (const photo of album.photos || []) {
        if (photo.url && photo.url.startsWith('data:image/')) {
          const matches = photo.url.match(/^data:image\/([\w+-]+);base64,(.+)$/);
          if (matches) {
            const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
            const buffer = Buffer.from(matches[2], 'base64');
            const filename = photo.id + '.' + ext;
            fs.writeFileSync(path.join(PHOTOS_DIR, filename), buffer);
            photo.url = '/photos/' + filename;
          }
        }
      }
      if (album.cover && album.cover.startsWith('data:image/')) {
        const matches = album.cover.match(/^data:image\/([\w+-]+);base64,(.+)$/);
        if (matches) {
          const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
          const buffer = Buffer.from(matches[2], 'base64');
          const filename = album.id + '-cover.' + ext;
          fs.writeFileSync(path.join(PHOTOS_DIR, filename), buffer);
          album.cover = '/photos/' + filename;
        }
      }
    }
    // Save imported data
    const tmp = DATA_FILE + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tmp, DATA_FILE);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fallback to src/index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'index.html'));
});

// ── Helpers ──
function getDefaultData() {
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

function convertImagesForWeb(data) {
  // Convert local-img:// paths to /photos/ URLs for web display
  const d = JSON.parse(JSON.stringify(data));
  for (const album of d.albums || []) {
    for (const photo of album.photos || []) {
      if (photo.url && photo.url.includes('local-img://')) {
        const filename = path.basename(decodeURIComponent(photo.url.replace('local-img:///', '').replace('local-img://', '')));
        photo.url = '/photos/' + filename;
      }
    }
    if (album.cover && album.cover.includes('local-img://')) {
      const filename = path.basename(decodeURIComponent(album.cover.replace('local-img:///', '').replace('local-img://', '')));
      album.cover = '/photos/' + filename;
    }
  }
  for (const s of ['spring', 'summer', 'autumn', 'winter']) {
    if (d.spreadImages && d.spreadImages[s] && d.spreadImages[s].includes('local-img://')) {
      const filename = path.basename(decodeURIComponent(d.spreadImages[s].replace('local-img:///', '').replace('local-img://', '')));
      d.spreadImages[s] = '/photos/' + filename;
    }
  }
  return d;
}

function convertImagesForStorage(data) {
  // Convert /photos/ URLs back to local-img:// paths for Electron
  const d = JSON.parse(JSON.stringify(data));
  for (const album of d.albums || []) {
    for (const photo of album.photos || []) {
      if (photo.url && photo.url.startsWith('/photos/')) {
        const fp = path.join(PHOTOS_DIR, path.basename(photo.url));
        photo.url = 'local-img:///' + fp.replace(/\\/g, '/');
      }
    }
    if (album.cover && album.cover.startsWith('/photos/')) {
      const fp = path.join(PHOTOS_DIR, path.basename(album.cover));
      album.cover = 'local-img:///' + fp.replace(/\\/g, '/');
    }
  }
  for (const s of ['spring', 'summer', 'autumn', 'winter']) {
    if (d.spreadImages && d.spreadImages[s] && d.spreadImages[s].startsWith('/photos/')) {
      const fp = path.join(PHOTOS_DIR, path.basename(d.spreadImages[s]));
      d.spreadImages[s] = 'local-img:///' + fp.replace(/\\/g, '/');
    }
  }
  return d;
}

app.listen(PORT, () => {
  const interfaces = os.networkInterfaces();
  console.log('\n  ✦ 春·夏·秋·冬 — 王仁强摄影 ✦\n');
  console.log('  本地访问:');
  console.log(`    http://localhost:${PORT}\n`);

  Object.keys(interfaces).forEach(name => {
    interfaces[name].forEach(iface => {
      if (iface.family === 'IPv4' && !iface.internal) {
        console.log('  局域网访问:');
        console.log(`    http://${iface.address}:${PORT}\n`);
      }
    });
  });

  console.log('  共享数据文件: ' + DATA_FILE);
  console.log('  共享图片目录: ' + PHOTOS_DIR);
  console.log('\n  按 Ctrl+C 停止服务器\n');
});
