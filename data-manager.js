const fs = require('fs');
const path = require('path');

function getDataFile() {
  const dir = require('electron').app.getPath('userData');
  return path.join(dir, 'data.json');
}

function getDefaultData() {
  return {
    adminPassword: 'admin123',
    adminEmail: '2041902160@qq.com',
    emailConfig: {
      publicKey: '',
      serviceId: '',
      templateId: '',
      fromName: '春·夏·秋·冬',
      fromEmail: '2041902160@qq.com'
    },
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

function loadData() {
  try {
    if (!fs.existsSync(getDataFile())) {
      const defaults = getDefaultData();
      const dir = path.dirname(getDataFile());
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(getDataFile(), JSON.stringify(defaults, null, 2), 'utf-8');
      return defaults;
    }
    const raw = fs.readFileSync(getDataFile(), 'utf-8');
    const parsed = JSON.parse(raw);
    const merged = Object.assign(getDefaultData(), parsed);
    merged.albums = parsed.albums || getDefaultData().albums;
    return merged;
  } catch (err) {
    console.error('Data load failed, resetting:', err.message);
    const defaults = getDefaultData();
    fs.writeFileSync(getDataFile(), JSON.stringify(defaults, null, 2), 'utf-8');
    return defaults;
  }
}

function saveData(data) {
  const dir = path.dirname(getDataFile());
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const tmp = getDataFile() + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tmp, getDataFile());
}

module.exports = { loadData, saveData, getDefaultData, getDataFile };
