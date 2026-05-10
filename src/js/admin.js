// =========================== ADMIN PANEL ===========================
var adminAuthenticated = false;
var adminRole = '';
var adminTab = 'tab-dashboard';

function getSidebarForRole() {
  var links = [
    { tab: 'tab-dashboard', icon: '●', label: '仪表盘', roles: ['admin', 'coadmin'] },
    { tab: 'tab-submissions', icon: '✎', label: '投稿管理', roles: ['admin', 'coadmin'] },
    { tab: 'tab-photos', icon: '📷', label: '照片库', roles: ['admin', 'coadmin'] },
    { tab: 'tab-albums', icon: '📑', label: '图集管理', roles: ['admin'] },
    { tab: 'tab-gallery', icon: '🖼', label: '网站展示', roles: ['admin'] },
    { tab: 'tab-users', icon: '👥', label: '用户管理', roles: ['admin'] },
    { tab: 'tab-email', icon: '✉', label: '邮箱设置', roles: ['admin'] },
    { tab: 'tab-settings', icon: '⚙', label: '系统设置', roles: ['admin'] },
  ];
  return links.filter(function (l) { return l.roles.indexOf(adminRole) !== -1; });
}

function renderAdminSidebar() {
  var sidebar = document.getElementById('adminSidebar');
  var links = getSidebarForRole();
  sidebar.innerHTML = links.map(function (l) {
    return '<a class="' + (adminTab === l.tab ? 'active' : '') + '" data-tab="' + l.tab + '"><span>' + l.icon + '</span> ' + l.label + '</a>';
  }).join('');
  sidebar.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () {
      adminTab = this.dataset.tab;
      renderAdminSidebar();
      renderAdminTab();
    });
  });
}

function openAdmin() {
  if (adminAuthenticated) {
    document.getElementById('adminOverlay').classList.add('active');
    document.body.style.overflow = 'hidden';
    renderAdminSidebar();
    renderAdminTab();
  } else {
    document.getElementById('adminLoginOverlay').classList.add('active');
    document.body.style.overflow = 'hidden';
    document.getElementById('adminLoginEmail').value = '';
    document.getElementById('adminLoginPassword').value = '';
  }
  closeMobileNav();
}

function closeAdmin() {
  document.getElementById('adminOverlay').classList.remove('active');
  document.getElementById('adminLoginOverlay').classList.remove('active');
  document.body.style.overflow = '';
  initSite();
}

function adminLogin(e) {
  e.preventDefault();
  var email = document.getElementById('adminLoginEmail').value.trim();
  var pw = document.getElementById('adminLoginPassword').value;

  if (email === APP_DATA.adminEmail && pw === APP_DATA.adminPassword) {
    adminAuthenticated = true; adminRole = 'admin';
    document.getElementById('adminLoginOverlay').classList.remove('active');
    document.getElementById('adminOverlay').classList.add('active');
    document.getElementById('adminUserLabel').textContent = '王仁强 · 超级管理员';
    renderAdminSidebar(); renderAdminTab();
  } else {
    var coAdmin = APP_DATA.users.find(function (u) { return u.email === email && u.password === pw && u.role === 'coadmin'; });
    if (coAdmin) {
      adminAuthenticated = true; adminRole = 'coadmin';
      document.getElementById('adminLoginOverlay').classList.remove('active');
      document.getElementById('adminOverlay').classList.add('active');
      document.getElementById('adminUserLabel').textContent = coAdmin.name + ' · 协助管理员';
      renderAdminSidebar(); renderAdminTab();
    } else {
      showToast('账号或密码错误，或无管理权限');
    }
  }
}

function renderAdminTab() {
  var content = document.getElementById('adminContent');
  switch (adminTab) {
    case 'tab-dashboard': content.innerHTML = renderDashboard(); break;
    case 'tab-submissions': content.innerHTML = renderSubmissions(); break;
    case 'tab-photos': content.innerHTML = renderPhotosManager(); break;
    case 'tab-albums': content.innerHTML = renderAlbumsManager(); break;
    case 'tab-gallery': content.innerHTML = renderGalleryManager(); break;
    case 'tab-users': content.innerHTML = renderUsersManager(); break;
    case 'tab-email': content.innerHTML = renderEmailSettings(); break;
    case 'tab-settings': content.innerHTML = renderSettings(); break;
  }
  setTimeout(bindAdminEvents, 100);
}

// =========================== DASHBOARD ===========================
function renderDashboard() {
  var totalPhotos = APP_DATA.albums.reduce(function (s, a) { return s + a.photos.length; }, 0);
  var pendingSubs = APP_DATA.submissions.filter(function (s) { return s.status === 'pending'; }).length;
  var totalUsers = APP_DATA.users.length;
  var totalAlbums = APP_DATA.albums.length;
  var emailReady = APP_DATA.emailConfig.publicKey && APP_DATA.emailConfig.serviceId && APP_DATA.emailConfig.templateId;
  return '<h3>仪表盘</h3><p class="tab-desc">数据概览</p>' +
    '<div class="stats-row">' +
      '<div class="stat-card"><div class="stat-num">' + totalAlbums + '</div><div class="stat-label">图集</div></div>' +
      '<div class="stat-card"><div class="stat-num">' + totalPhotos + '</div><div class="stat-label">照片</div></div>' +
      '<div class="stat-card"><div class="stat-num">' + pendingSubs + '</div><div class="stat-label">待审投稿</div></div>' +
      '<div class="stat-card"><div class="stat-num">' + totalUsers + '</div><div class="stat-label">会员</div></div>' +
    '</div>' +
    '<div class="admin-card"><h4>邮箱状态</h4>' +
      '<p style="font-size:.85rem;color:' + (emailReady ? 'var(--success)' : 'var(--danger)') + ';">' + (emailReady ? '已配置 — 自动发送欢迎邮件' : '未配置 — 请设置EmailJS') + '</p>' +
    '</div>';
}

// =========================== SUBMISSIONS ===========================
function renderSubmissions() {
  return '<h3>投稿管理</h3><p class="tab-desc">审核用户投稿</p>' +
    '<div class="admin-card">' +
      '<div style="display:flex;gap:.5rem;margin-bottom:1rem;">' +
        '<button class="btn btn-sm btn-outline" onclick="filterSubmissions(\'all\')">全部</button>' +
        '<button class="btn btn-sm btn-outline" onclick="filterSubmissions(\'pending\')">待审核</button>' +
        '<button class="btn btn-sm btn-outline" onclick="filterSubmissions(\'approved\')">已通过</button>' +
        '<button class="btn btn-sm btn-outline" onclick="filterSubmissions(\'rejected\')">已拒绝</button>' +
      '</div>' +
      '<div id="submissionsTable"></div>' +
    '</div>';
}

function filterSubmissions(status) {
  var subs = status === 'all' ? APP_DATA.submissions : APP_DATA.submissions.filter(function (s) { return s.status === status; });
  var html = subs.length === 0 ? '<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--ink-muted);">暂无</td></tr>'
    : subs.slice().reverse().map(function (s) { return '<tr>' +
      '<td>' + escHtml(s.name) + '</td><td>' + escHtml(s.email) + '</td><td>' + seasonLabel(s.season) + '</td>' +
      '<td><a href="' + escHtml(s.link) + '" target="_blank">查看</a></td>' +
      '<td>' + escHtml(s.description || '').substring(0, 30) + '...</td>' +
      '<td><span class="badge badge-' + s.status + '">' + statusLabel(s.status) + '</span></td>' +
      '<td>' + (s.status === 'pending' ? '<button class="btn btn-sm btn-success" onclick="updateSubmission(\'' + s.id + '\',\'approved\')">通过</button> <button class="btn btn-sm btn-danger" onclick="updateSubmission(\'' + s.id + '\',\'rejected\')">拒绝</button>' : '<button class="btn btn-sm btn-outline" onclick="updateSubmission(\'' + s.id + '\',\'pending\')">重置</button>') + '</td>' +
    '</tr>'; }).join('');
  document.getElementById('submissionsTable').innerHTML = '<table class="admin-table"><thead><tr><th>作者</th><th>邮箱</th><th>主题</th><th>链接</th><th>说明</th><th>状态</th><th>操作</th></tr></thead><tbody>' + html + '</tbody></table>';
}

function updateSubmission(id, status) {
  var s = APP_DATA.submissions.find(function (x) { return x.id === id; });
  if (s) { s.status = status; persist(); showToast(status === 'approved' ? '已通过' : '已' + statusLabel(status)); }
  renderAdminTab();
}

// =========================== PHOTOS MANAGER ===========================
var pendingUploads = [];

function renderPhotosManager() {
  var albums = APP_DATA.albums;
  var html = '<h3>照片库</h3><p class="tab-desc">拖放或粘贴图片上传，管理所有照片</p>' +
    '<div class="admin-card">' +
      '<h4>上传照片</h4>' +
      '<div class="admin-form-row">' +
        '<div class="form-group"><label>目标图集</label><select id="photoAlbum">' + albums.map(function (a) { return '<option value="' + a.id + '">' + escHtml(a.name) + '</option>'; }).join('') + '</select></div>' +
        '<div class="form-group"><label>照片标题</label><input type="text" id="photoTitle" placeholder="照片标题"></div>' +
        '<div class="form-group"><label>季节标签</label><select id="photoSeason"><option value="spring">春</option><option value="summer">夏</option><option value="autumn">秋</option><option value="winter">冬</option></select></div>' +
      '</div>' +
      '<div class="upload-zone" id="uploadZone">' +
        '<div class="upload-icon">&#128247;</div>' +
        '<p>拖放图片到此处，或 <strong>点击选择</strong></p>' +
        '<p class="upload-hint">也支持 Ctrl+V 粘贴剪贴板中的图片</p>' +
        '<input type="file" id="fileInput" accept="image/*" multiple style="display:none;">' +
      '</div>' +
      '<div class="upload-preview" id="uploadPreview"></div>' +
      '<button class="btn btn-primary btn-sm" onclick="uploadPendingPhotos()" id="uploadBtn" disabled style="margin-top:.5rem;">确认上传</button>' +
    '</div>';

  APP_DATA.albums.forEach(function (album) {
    html += '<div class="admin-card"><h4>' + escHtml(album.name) + ' <span style="font-weight:400;font-size:.75rem;color:var(--ink-muted);">(' + album.photos.length + '张)</span></h4>';
    if (album.photos.length === 0) {
      html += '<p style="font-size:.8rem;color:var(--ink-muted);">暂无照片</p>';
    } else {
      html += '<div class="admin-photo-grid">';
      album.photos.forEach(function (p) {
        var otherAlbums = APP_DATA.albums.filter(function (a) { return a.id !== album.id; });
        html += '<div class="admin-photo-card">' +
          '<div class="thumb" style="background-image:url(' + p.url + ');' + (!p.url ? 'background:var(--paper-dark);' : '') + '"></div>' +
          '<div class="info"><div class="title">' + escHtml(p.title) + '</div><div class="season">' + seasonLabel(p.season) + ' · ' + fmtDate(p.addedAt) + '</div></div>' +
          '<div class="actions">' +
            (otherAlbums.length > 0 ? '<select onchange="movePhoto(\'' + p.id + '\',\'' + album.id + '\',this.value);this.value=\'\';" style="flex:1;font-size:.65rem;padding:.3rem;"><option value="">移至...</option>' + otherAlbums.map(function (a) { return '<option value="' + a.id + '">' + escHtml(a.name) + '</option>'; }).join('') + '</select>' : '') +
            '<button class="danger" onclick="deletePhoto(\'' + album.id + '\',\'' + p.id + '\')">删除</button>' +
          '</div></div>';
      });
      html += '</div>';
    }
    html += '</div>';
  });
  return html;
}

function bindAdminEvents() {
  var zone = document.getElementById('uploadZone');
  var fileInput = document.getElementById('fileInput');
  if (!zone || !fileInput) return;

  zone.onclick = function () { fileInput.click(); };
  fileInput.onchange = function (e) { if (e.target.files) handleFiles(e.target.files); };

  zone.ondragover = function (e) { e.preventDefault(); zone.classList.add('drag-over'); };
  zone.ondragleave = function () { zone.classList.remove('drag-over'); };
  zone.ondrop = function (e) { e.preventDefault(); zone.classList.remove('drag-over'); if (e.dataTransfer.files) handleFiles(e.dataTransfer.files); };

  document.onpaste = function (e) {
    if (!adminAuthenticated || adminTab !== 'tab-photos') return;
    var items = e.clipboardData && e.clipboardData.items;
    if (!items) return;
    var imageItems = [];
    for (var i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image/') === 0) imageItems.push(items[i].getAsFile());
    }
    if (imageItems.length > 0) { e.preventDefault(); handleFiles(imageItems); showToast('已捕获剪贴板图片'); }
  };
}

function handleFiles(files) {
  Array.from(files).forEach(function (file) {
    if (file.type.indexOf('image/') !== 0) return;
    var reader = new FileReader();
    reader.onload = function (e) {
      pendingUploads.push({ dataUrl: e.target.result, title: file.name.replace(/\.[^.]+$/, ''), season: (document.getElementById('photoSeason') || { value: 'spring' }).value });
      renderUploadPreview();
    };
    reader.readAsDataURL(file);
  });
}

function renderUploadPreview() {
  var preview = document.getElementById('uploadPreview');
  var btn = document.getElementById('uploadBtn');
  if (!preview || !btn) return;
  preview.innerHTML = pendingUploads.map(function (p, i) {
    return '<div class="preview-item" style="background-image:url(' + p.dataUrl + ');"><button class="remove" onclick="removePending(' + i + ')">&times;</button></div>';
  }).join('');
  btn.disabled = pendingUploads.length === 0;
}

function removePending(i) { pendingUploads.splice(i, 1); renderUploadPreview(); }

async function uploadPendingPhotos() {
  if (pendingUploads.length === 0) return;
  var albumId = document.getElementById('photoAlbum').value;
  var album = APP_DATA.albums.find(function (a) { return a.id === albumId; });
  if (!album) return;

  for (var i = 0; i < pendingUploads.length; i++) {
    var p = pendingUploads[i];
    var photoId = 'photo-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
    var result = await api.saveImage(photoId, p.dataUrl);
    if (!result.success) { showToast('图片保存失败: ' + result.error); continue; }
    album.photos.push({
      id: photoId,
      title: document.getElementById('photoTitle').value.trim() || p.title,
      url: (result.filePath || result.url),
      season: p.season,
      addedAt: new Date().toISOString()
    });
    if (!album.cover) album.cover = (result.filePath || result.url);
  }
  var count = pendingUploads.length;
  pendingUploads = [];
  await persist();
  renderAdminTab();
  renderUploadPreview();
  showToast('已上传 ' + count + ' 张照片到「' + album.name + '」');
}

async function deletePhoto(albumId, photoId) {
  var album = APP_DATA.albums.find(function (a) { return a.id === albumId; });
  if (!album) return;
  album.photos = album.photos.filter(function (p) { return p.id !== photoId; });
  if (album.cover && !album.photos.find(function (p) { return p.url === album.cover; })) album.cover = album.photos[0] && album.photos[0].url || '';
  await api.deleteImage(photoId);
  await persist();
  renderAdminTab();
  showToast('已删除');
}

function movePhoto(photoId, fromAlbumId, toAlbumId) {
  var from = APP_DATA.albums.find(function (a) { return a.id === fromAlbumId; });
  var to = APP_DATA.albums.find(function (a) { return a.id === toAlbumId; });
  if (!from || !to) return;
  var idx = from.photos.findIndex(function (p) { return p.id === photoId; });
  if (idx === -1) return;
  var photo = from.photos.splice(idx, 1)[0];
  to.photos.push(photo);
  if (from.cover && !from.photos.find(function (p) { return p.url === from.cover; })) from.cover = from.photos[0] && from.photos[0].url || '';
  if (!to.cover) to.cover = photo.url;
  persist(); renderAdminTab(); showToast('已移动');
}

// =========================== ALBUMS MANAGER ===========================
function renderAlbumsManager() {
  if (adminRole !== 'admin') return '<h3>无权限</h3><p>仅超级管理员可管理图集</p>';
  return '<h3>图集管理</h3><p class="tab-desc">创建与编辑图集</p>' +
    '<div class="admin-card"><h4>新建图集</h4>' +
      '<div class="admin-form-row">' +
        '<div class="form-group"><label>名称</label><input type="text" id="newAlbumName" placeholder="图集名称"></div>' +
        '<div class="form-group"><label>季节</label><select id="newAlbumSeason"><option value="spring">春</option><option value="summer">夏</option><option value="autumn">秋</option><option value="winter">冬</option></select></div>' +
        '<button class="btn btn-primary btn-sm" onclick="createAlbum()">创建</button>' +
      '</div>' +
    '</div>' +
    '<div class="admin-card"><h4>图集列表</h4>' +
      '<table class="admin-table"><thead><tr><th>名称</th><th>季节</th><th>照片数</th><th>BGM</th><th>操作</th></tr></thead><tbody>' +
        APP_DATA.albums.map(function (a) { return '<tr><td><strong>' + escHtml(a.name) + '</strong></td><td>' + seasonLabel(a.season) + '</td><td>' + a.photos.length + '</td>' +
          '<td>' + (a.bgm ? '<span style="color:var(--success);">已设置</span>' : '<span style="color:var(--ink-muted);">无</span>') + '</td>' +
          '<td>' +
            '<button class="btn btn-sm btn-outline" onclick="editAlbumBGM(\'' + a.id + '\')">BGM</button>' +
            '<button class="btn btn-sm btn-outline" onclick="deleteAlbum(\'' + a.id + '\')" ' + (APP_DATA.albums.length <= 1 ? 'disabled' : '') + '>删除</button>' +
          '</td></tr>'; }).join('') +
      '</tbody></table>' +
      '<div id="bgmEditArea"></div>' +
    '</div>';
}

function createAlbum() {
  var name = document.getElementById('newAlbumName').value.trim();
  var season = document.getElementById('newAlbumSeason').value;
  if (!name) { showToast('请输入名称'); return; }
  APP_DATA.albums.push({ id: 'album-' + Date.now(), name: name, season: season, cover: '', bgm: '', photos: [] });
  persist(); renderAdminTab(); showToast('图集已创建');
}

function deleteAlbum(id) {
  if (APP_DATA.albums.length <= 1) { showToast('至少保留一个'); return; }
  APP_DATA.albums = APP_DATA.albums.filter(function (a) { return a.id !== id; });
  persist(); renderAdminTab(); showToast('已删除');
}

function editAlbumBGM(id) {
  var album = APP_DATA.albums.find(function (a) { return a.id === id; });
  if (!album) return;
  var area = document.getElementById('bgmEditArea');
  if (!area) return;
  area.innerHTML = '<div class="admin-card" style="margin-top:1rem;"><h4>设置BGM — ' + escHtml(album.name) + '</h4>' +
    '<p style="font-size:.8rem;color:var(--ink-muted);margin-bottom:.5rem;">填入BGM音频文件的URL链接（支持mp3/ogg等格式），当用户打开该图集独立页面时将自动播放</p>' +
    '<div class="admin-form-row">' +
      '<div class="form-group"><label>BGM URL</label><input type="text" id="bgmUrl_' + id + '" value="' + escHtml(album.bgm || '') + '" placeholder="https://... 或相对路径"></div>' +
      '<button class="btn btn-primary btn-sm" onclick="saveBGM(\'' + id + '\')">保存</button>' +
      (album.bgm ? '<button class="btn btn-sm btn-outline" onclick="clearBGM(\'' + id + '\')">清除</button>' : '') +
    '</div>' +
    '<p style="font-size:.7rem;color:var(--ink-muted);">建议使用无版权音乐或自有版权音乐。推荐来源：<a href="https://pixabay.com/music/" target="_blank">Pixabay Music</a></p>' +
    (album.bgm ? '<audio controls src="' + escHtml(album.bgm) + '" style="width:100%;margin-top:.5rem;"></audio>' : '') +
  '</div>';
}

function saveBGM(id) {
  var album = APP_DATA.albums.find(function (a) { return a.id === id; });
  if (!album) return;
  album.bgm = document.getElementById('bgmUrl_' + id).value.trim();
  persist(); renderAdminTab(); showToast('BGM已保存');
}

function clearBGM(id) {
  var album = APP_DATA.albums.find(function (a) { return a.id === id; });
  if (!album) return;
  album.bgm = '';
  persist(); renderAdminTab(); showToast('BGM已清除');
}

// =========================== GALLERY MANAGER ===========================
function renderGalleryManager() {
  if (adminRole !== 'admin') return '<h3>无权限</h3><p>仅超级管理员可管理网站展示</p>';
  var seasons = ['spring', 'summer', 'autumn', 'winter'];
  return '<h3>网站展示管理</h3><p class="tab-desc">编辑文字会实时预览到主页，点击保存后写入磁盘</p>' +
    '<div class="admin-card">' +
      seasons.map(function (s) { return '<div style="margin-bottom:1.5rem;padding-bottom:1.5rem;border-bottom:1px solid var(--border);">' +
        '<h4>' + seasonLabel(s) + ' 跨页 <span style="font-weight:400;font-size:.7rem;color:var(--success);">● 实时预览中</span></h4>' +
        '<div class="admin-form-row">' +
          '<div class="form-group"><label>背景图片URL</label><input type="text" id="spreadUrl_' + s + '" value="' + escHtml(APP_DATA.spreadImages[s] || '') + '" placeholder="留空使用默认" oninput="previewSpread(\'' + s + '\')"></div>' +
          '<button class="btn btn-sm btn-primary" onclick="saveSpread(\'' + s + '\')">保存到磁盘</button>' +
          (APP_DATA.spreadImages[s] ? '<button class="btn btn-sm btn-danger" onclick="clearSpread(\'' + s + '\')">清除</button>' : '') +
        '</div>' +
        '<div class="form-group" style="margin-top:.5rem;"><label>描述文字 <small style="color:var(--ink-muted);">（编辑时实时预览，点击保存后永久生效）</small></label><textarea id="spreadDesc_' + s + '" style="min-height:60px;" oninput="previewSpread(\'' + s + '\')">' + escHtml(APP_DATA.spreadDescriptions[s] || '') + '</textarea></div>' +
      '</div>'; }).join('') +
    '</div>';
}

function previewSpread(s) {
  // Real-time preview: update the live page without saving to disk
  var url = document.getElementById('spreadUrl_' + s);
  var desc = document.getElementById('spreadDesc_' + s);
  if (!url || !desc) return;
  APP_DATA.spreadImages[s] = url.value.trim();
  APP_DATA.spreadDescriptions[s] = desc.value.trim();
  // Refresh the live spread section
  var cap = s.charAt(0).toUpperCase() + s.slice(1);
  var imgEl = document.getElementById('spreadImage' + cap);
  var descEl = document.getElementById('spreadDesc' + cap);
  if (descEl) descEl.textContent = APP_DATA.spreadDescriptions[s] || '';
  if (imgEl) {
    var existing = imgEl.querySelector('.spread-bg-img');
    if (APP_DATA.spreadImages[s]) {
      if (existing) existing.style.backgroundImage = 'url(' + APP_DATA.spreadImages[s] + ')';
      else {
        var bg = document.createElement('div'); bg.className = 'spread-bg-img';
        bg.style.backgroundImage = 'url(' + APP_DATA.spreadImages[s] + ')';
        imgEl.appendChild(bg);
      }
    } else if (existing) {
      existing.remove();
    }
  }
}

function saveSpread(s) {
  APP_DATA.spreadImages[s] = document.getElementById('spreadUrl_' + s).value.trim();
  APP_DATA.spreadDescriptions[s] = document.getElementById('spreadDesc_' + s).value.trim();
  persist(); showToast('已保存到磁盘。页面实时预览已生效。');
}

function clearSpread(s) {
  APP_DATA.spreadImages[s] = '';
  APP_DATA.spreadDescriptions[s] = '';
  document.getElementById('spreadUrl_' + s).value = '';
  document.getElementById('spreadDesc_' + s).value = '';
  previewSpread(s);
  persist(); showToast('已清除');
}

// =========================== USERS MANAGER ===========================
function renderUsersManager() {
  if (adminRole !== 'admin') return '<h3>无权限</h3><p>仅超级管理员可管理用户</p>';
  return '<h3>用户管理</h3><p class="tab-desc">管理会员角色与权限</p>' +
    '<div class="admin-card">' +
      '<table class="admin-table"><thead><tr><th>姓名</th><th>邮箱</th><th>手机</th><th>角色</th><th>注册时间</th><th>操作</th></tr></thead><tbody>' +
        (APP_DATA.users.length === 0 ? '<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--ink-muted);">暂无用户</td></tr>'
          : APP_DATA.users.slice().reverse().map(function (u) { return '<tr>' +
            '<td>' + escHtml(u.name) + '</td><td>' + escHtml(u.email) + '</td><td>' + escHtml(u.phone || '-') + '</td>' +
            '<td><span class="badge badge-' + u.role + '">' + roleLabel(u.role) + '</span></td>' +
            '<td>' + fmtDate(u.registeredAt) + '</td>' +
            '<td>' +
              (u.role === 'member'
                ? '<button class="btn btn-sm btn-outline" onclick="setUserRole(\'' + u.email + '\',\'coadmin\')">设为协助管理员</button>'
                : u.role === 'coadmin'
                ? '<button class="btn btn-sm btn-outline" onclick="setUserRole(\'' + u.email + '\',\'member\')">取消协助管理员</button>'
                : '—') +
            '</td></tr>'; }).join('')) +
      '</tbody></table>' +
      '<p style="font-size:.75rem;color:var(--ink-muted);margin-top:.5rem;">协助管理员可以：审核投稿、上传与管理照片。不可以：管理图集、修改网站展示、管理用户、修改系统设置。</p>' +
    '</div>';
}

function setUserRole(email, role) {
  var user = APP_DATA.users.find(function (u) { return u.email === email; });
  if (!user) return;
  user.role = role;
  persist();
  renderAdminTab();
  showToast(role === 'coadmin' ? '已设为协助管理员' : '已取消协助管理员权限');
}

// =========================== EMAIL SETTINGS ===========================
function renderEmailSettings() {
  if (adminRole !== 'admin') return '<h3>无权限</h3>';
  var cfg = APP_DATA.emailConfig;
  var ready = cfg.publicKey && cfg.serviceId && cfg.templateId;
  return '<h3>邮箱设置</h3><p class="tab-desc">配置EmailJS自动发送欢迎邮件</p>' +
    '<div class="admin-card">' +
      '<ol style="font-size:.85rem;line-height:2;padding-left:1.2rem;color:var(--ink-light);">' +
        '<li>前往 <a href="https://www.emailjs.com/" target="_blank">EmailJS.com</a> 注册（每月200封免费）</li>' +
        '<li>添加Email Service（绑定QQ邮箱 2041902160@qq.com 或其它）</li>' +
        '<li>创建模板，变量：<code>to_name</code> <code>to_email</code> <code>from_name</code> <code>message</code></li>' +
        '<li>将 Public Key、Service ID、Template ID 填入下方</li>' +
      '</ol>' +
    '</div>' +
    '<div class="admin-card">' +
      '<div class="form-group"><label>Public Key</label><input type="text" id="cfgPublicKey" value="' + escHtml(cfg.publicKey) + '"></div>' +
      '<div class="form-group"><label>Service ID</label><input type="text" id="cfgServiceId" value="' + escHtml(cfg.serviceId) + '"></div>' +
      '<div class="form-group"><label>Template ID</label><input type="text" id="cfgTemplateId" value="' + escHtml(cfg.templateId) + '"></div>' +
      '<div class="form-group"><label>发件人名称</label><input type="text" id="cfgFromName" value="' + escHtml(cfg.fromName) + '"></div>' +
      '<button class="btn btn-primary" onclick="saveEmailConfig()">保存</button>' +
      '<button class="btn btn-outline" onclick="testEmail()" style="margin-left:.5rem;" ' + (!ready ? 'disabled' : '') + '>发送测试邮件</button>' +
      '<p style="margin-top:1rem;font-size:.8rem;color:' + (ready ? 'var(--success)' : 'var(--danger)') + ';">' + (ready ? '已就绪' : '请完成配置') + '</p>' +
    '</div>';
}

function saveEmailConfig() {
  APP_DATA.emailConfig.publicKey = document.getElementById('cfgPublicKey').value.trim();
  APP_DATA.emailConfig.serviceId = document.getElementById('cfgServiceId').value.trim();
  APP_DATA.emailConfig.templateId = document.getElementById('cfgTemplateId').value.trim();
  APP_DATA.emailConfig.fromName = document.getElementById('cfgFromName').value.trim();
  persist(); initEmailJS(); renderAdminTab(); showToast('已保存');
}

function testEmail() {
  var cfg = APP_DATA.emailConfig;
  if (!cfg.publicKey || !cfg.serviceId || !cfg.templateId) { showToast('请先完成配置'); return; }
  try {
    emailjs.init(cfg.publicKey);
    emailjs.send(cfg.serviceId, cfg.templateId, {
      to_name: '测试', to_email: cfg.fromEmail, from_name: cfg.fromName, reply_to: cfg.fromEmail,
      message: '这是一封测试邮件。'
    }).then(function () { showToast('测试邮件已发送'); }).catch(function (e) { showToast('失败：' + e.text); });
  } catch (e) { showToast('异常：' + e.message); }
}

// =========================== SETTINGS ===========================
function renderSettings() {
  if (adminRole !== 'admin') return '<h3>无权限</h3>';
  return '<h3>系统设置</h3><p class="tab-desc">密码、数据与备份</p>' +
    '<div class="admin-card"><h4>修改管理员密码</h4>' +
      '<div class="admin-form-row">' +
        '<div class="form-group"><label>当前密码</label><input type="password" id="oldPassword"></div>' +
        '<div class="form-group"><label>新密码</label><input type="password" id="newPassword" placeholder="至少6位"></div>' +
        '<button class="btn btn-primary btn-sm" onclick="changePassword()">修改</button>' +
      '</div>' +
    '</div>' +
    '<div class="admin-card"><h4>数据备份</h4>' +
      '<p style="font-size:.8rem;color:var(--ink-muted);margin-bottom:1rem;">导出网站数据为JSON文件（含图片），或从备份恢复</p>' +
      '<button class="btn btn-outline btn-sm" onclick="exportData()">导出JSON备份</button>' +
      '<button class="btn btn-outline btn-sm" onclick="importData()" style="margin-left:.5rem;">导入恢复</button>' +
    '</div>' +
    '<div class="admin-card"><h4>危险操作</h4>' +
      '<button class="btn btn-danger btn-sm" onclick="resetAllData()">重置所有数据</button>' +
    '</div>';
}

function changePassword() {
  var old = document.getElementById('oldPassword').value;
  var neu = document.getElementById('newPassword').value;
  if (old !== APP_DATA.adminPassword) { showToast('密码错误'); return; }
  if (neu.length < 6) { showToast('至少6位'); return; }
  APP_DATA.adminPassword = neu; persist(); showToast('密码已修改');
}

async function exportData() {
  var success = await api.exportBackup(APP_DATA);
  if (success) showToast('备份已导出');
}

async function importData() {
  var data = await api.importBackup();
  if (data) {
    APP_DATA = data;
    await persist();
    initSite();
    renderAdminTab();
    showToast('数据已导入恢复');
  }
}

function resetAllData() {
  if (!confirm('确定重置所有数据？不可恢复！')) return;
  if (!confirm('再次确认？')) return;
  var pw = APP_DATA.adminPassword; var em = APP_DATA.adminEmail;
  APP_DATA = getDefaultData(); APP_DATA.adminPassword = pw; APP_DATA.adminEmail = em;
  persist(); initSite(); renderAdminTab(); showToast('已重置');
}
