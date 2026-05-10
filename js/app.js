// =========================== DATA LAYER ===========================
function getDefaultData() {
  return {
    adminPassword: 'admin123',
    adminEmail: '2041902160@qq.com',
    emailConfig: { publicKey: '', serviceId: '', templateId: '', fromName: '春·夏·秋·冬', fromEmail: '2041902160@qq.com' },
    submissions: [],
    albums: [
      { id: 'album-spring', name: '春 · 万物生', season: 'spring', cover: 'photos/sample-spring-1.svg', bgm: '', photos: [
        { id: 'sample-spring-1', title: '晨光·龙门山', url: 'photos/sample-spring-1.svg', season: 'spring', addedAt: '2026-05-10T00:00:00.000Z' },
        { id: 'sample-spring-2', title: '樱花·洛河畔', url: 'photos/sample-spring-2.svg', season: 'spring', addedAt: '2026-05-10T00:00:00.000Z' },
        { id: 'sample-spring-3', title: '新绿·生命序章', url: 'photos/sample-spring-3.svg', season: 'spring', addedAt: '2026-05-10T00:00:00.000Z' }
      ]},
      { id: 'album-summer', name: '夏 · 炽热诗', season: 'summer', cover: 'photos/sample-summer-1.svg', bgm: '', photos: [
        { id: 'sample-summer-1', title: '暮色·天堂明堂', url: 'photos/sample-summer-1.svg', season: 'summer', addedAt: '2026-05-10T00:00:00.000Z' },
        { id: 'sample-summer-2', title: '金晖·应天门', url: 'photos/sample-summer-2.svg', season: 'summer', addedAt: '2026-05-10T00:00:00.000Z' },
        { id: 'sample-summer-3', title: '浓影·古城墙', url: 'photos/sample-summer-3.svg', season: 'summer', addedAt: '2026-05-10T00:00:00.000Z' }
      ]},
      { id: 'album-autumn', name: '秋 · 落叶赋', season: 'autumn', cover: 'photos/sample-autumn-1.svg', bgm: '', photos: [
        { id: 'sample-autumn-1', title: '银杏·白马寺', url: 'photos/sample-autumn-1.svg', season: 'autumn', addedAt: '2026-05-10T00:00:00.000Z' },
        { id: 'sample-autumn-2', title: '梧桐·老城巷', url: 'photos/sample-autumn-2.svg', season: 'autumn', addedAt: '2026-05-10T00:00:00.000Z' },
        { id: 'sample-autumn-3', title: '红叶·禅意', url: 'photos/sample-autumn-3.svg', season: 'autumn', addedAt: '2026-05-10T00:00:00.000Z' }
      ]},
      { id: 'album-winter', name: '冬 · 寂静歌', season: 'winter', cover: 'photos/sample-winter-1.svg', bgm: '', photos: [
        { id: 'sample-winter-1', title: '雪落·龙门石窟', url: 'photos/sample-winter-1.svg', season: 'winter', addedAt: '2026-05-10T00:00:00.000Z' },
        { id: 'sample-winter-2', title: '冰封·洛河', url: 'photos/sample-winter-2.svg', season: 'winter', addedAt: '2026-05-10T00:00:00.000Z' },
        { id: 'sample-winter-3', title: '寂静·古都', url: 'photos/sample-winter-3.svg', season: 'winter', addedAt: '2026-05-10T00:00:00.000Z' }
      ]}
    ],
    spreadImages: { spring: 'photos/sample-spring-1.svg', summer: 'photos/sample-summer-1.svg', autumn: 'photos/sample-autumn-1.svg', winter: 'photos/sample-winter-1.svg' },
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

var APP_DATA = getDefaultData();
var _saveTimer = null;
var _dirty = false;

// ── Unified API: auto-detects Electron vs Browser ──
var isElectron = !!(window.electronAPI && window.electronAPI.getAppData);

var api = {
  getData: function () {
    if (isElectron) {
      return window.electronAPI.getAppData();
    }
    return fetch('/api/data').then(function (r) { return r.json(); });
  },
  saveData: function (data) {
    if (isElectron) {
      return window.electronAPI.saveAppData(data);
    }
    return fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(function (r) { return r.json(); });
  },
  saveImage: function (id, dataUrl) {
    if (isElectron) {
      return window.electronAPI.saveImage(id, dataUrl);
    }
    return fetch('/api/image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: id, dataUrl: dataUrl })
    }).then(function (r) { return r.json(); });
  },
  deleteImage: function (id) {
    if (isElectron) {
      return window.electronAPI.deleteImage(id);
    }
    return fetch('/api/image/' + id, { method: 'DELETE' }).then(function (r) { return r.json(); });
  },
  exportBackup: function (data) {
    if (isElectron) {
      return window.electronAPI.exportBackup(data);
    }
    // For web: POST data to get base64-embedded backup, then download
    return fetch('/api/backup/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(function (r) { return r.json(); }).then(function (exportData) {
      var blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'fourSeasons_backup_' + new Date().toISOString().slice(0, 10) + '.json';
      a.click();
      return true;
    });
  },
  importBackup: function () {
    if (isElectron) {
      return window.electronAPI.importBackup();
    }
    // For web: use file input
    return new Promise(function (resolve) {
      var input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = function (e) {
        var file = e.target.files[0];
        if (!file) { resolve(null); return; }
        var reader = new FileReader();
        reader.onload = function (re) {
          try {
            var data = JSON.parse(re.target.result);
            fetch('/api/backup/import', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data)
            }).then(function (r) { return r.json(); }).then(resolve);
          } catch (err) { resolve(null); }
        };
        reader.readAsText(file);
      };
      input.click();
    });
  }
};

// Debounced persist - safe to call as often as you want.
function persist() {
  _dirty = true;
  if (_saveTimer) return;
  _saveTimer = setTimeout(function () {
    _saveTimer = null;
    if (!_dirty) return;
    _dirty = false;
    api.saveData(APP_DATA).then(function () {
      console.log('[AutoSave] Data saved');
    }).catch(function (e) {
      console.error('[AutoSave] Failed:', e);
    });
  }, 300);
}

// Force immediate save
function persistNow() {
  if (_saveTimer) { clearTimeout(_saveTimer); _saveTimer = null; }
  _dirty = false;
  return api.saveData(APP_DATA).catch(function (e) {
    console.error('[persistNow] Failed:', e);
  });
}

// Auto-save on page unload
window.addEventListener('beforeunload', function () {
  if (_dirty) {
    if (_saveTimer) { clearTimeout(_saveTimer); _saveTimer = null; }
    _dirty = false;
    api.saveData(APP_DATA).catch(function () {});
  }
});

function initEmailJS() {
  if (APP_DATA.emailConfig.publicKey) {
    try { emailjs.init(APP_DATA.emailConfig.publicKey); } catch (e) { }
  }
}

async function initSite() {
  try {
    APP_DATA = await api.getData();
  } catch (err) {
    console.error('Failed to load app data, using defaults:', err);
    APP_DATA = getDefaultData();
  }

  try {
    renderSpreadsFromData();
    renderGalleryFromData();
    initEmailJS();
    if (window.location.hash && window.location.hash.startsWith('#/album/')) {
      handleHashChange();
    }
    console.log('[App] Init complete (' + (isElectron ? 'Electron' : 'Web') + ')');
  } catch (err) {
    console.error('[App] Render init failed:', err);
  }
}

// initSite() is called from the inline script at the end of index.html
