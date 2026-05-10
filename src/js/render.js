// =========================== SPREADS ===========================
function renderSpreadsFromData() {
  ['spring', 'summer', 'autumn', 'winter'].forEach(function (s) {
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
      }
    }
  });
}

// =========================== GALLERY ===========================
var currentAlbumFilter = 'all';
var galleryVisibleCount = 12;

function renderGalleryFromData(filterSeason, resetCount) {
  var grid = document.getElementById('galleryGrid');
  var tabs = document.getElementById('albumTabs');
  if (!grid || !tabs) return;
  var season = filterSeason || currentAlbumFilter || 'all';
  currentAlbumFilter = season;
  if (resetCount !== false) galleryVisibleCount = 12;

  var photos = [];
  if (season === 'all') {
    APP_DATA.albums.forEach(function (a) { photos.push.apply(photos, a.photos.map(function (p) { return Object.assign({}, p, { albumSeason: a.season, albumId: a.id }); })); });
  } else {
    var album = APP_DATA.albums.find(function (a) { return a.season === season || a.id === season; });
    if (album) photos = album.photos.map(function (p) { return Object.assign({}, p, { albumSeason: album.season, albumId: album.id }); });
  }

  // Tabs
  var tabsHTML = '<button class="album-tab' + (season === 'all' ? ' active' : '') + '" onclick="renderGalleryFromData(\'all\')">全部作品</button>';
  APP_DATA.albums.forEach(function (a) {
    tabsHTML += '<button class="album-tab' + (season === a.season ? ' active' : '') + '" onclick="renderGalleryFromData(\'' + a.season + '\')">' + escHtml(a.name) + '</button>';
    tabsHTML += ' <a href="#/album/' + a.id + '" style="font-size:.7rem;color:var(--ink-muted);text-decoration:none;" title="打开独立图集页">&#8599;</a> ';
  });
  tabs.innerHTML = tabsHTML;

  if (photos.length === 0) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:4rem;color:var(--ink-muted);">该图集中暂无照片</div>';
    return;
  }

  // Show visible batch
  var visiblePhotos = photos.slice(0, galleryVisibleCount);
  var seasonClasses = ['spring-bg', 'summer-bg', 'autumn-bg', 'winter-bg'];

  grid.innerHTML = visiblePhotos.map(function (p, i) {
    var bgStyle = p.url ? 'background-image:url(' + p.url.replace(/"/g, '\\"') + ');' : '';
    var isFeatured = (i === 0 || i % 7 === 0) && visiblePhotos.length > 2;
    return '<div class="gallery-item ' + (isFeatured ? 'featured ' : '') + seasonClasses[i % 4] + '" onclick="openLightbox(\'' + escHtml(p.url || '') + '\',\'' + escHtml(p.title || '') + '\')"><div class="img-bg" style="' + bgStyle + '"></div><div class="overlay"><span>' + escHtml(p.title || '') + '</span></div></div>';
  }).join('');

  // Load More button
  if (galleryVisibleCount < photos.length) {
    grid.insertAdjacentHTML('afterend',
      '<div class="gallery-load-more" id="loadMoreWrap">' +
        '<button onclick="loadMorePhotos()">加载更多 (' + (photos.length - galleryVisibleCount) + ' 张剩余)</button>' +
        '<p style="margin-top:.5rem;font-size:.75rem;color:var(--ink-muted);">共 ' + photos.length + ' 张照片</p>' +
      '</div>');
  } else if (photos.length > 12) {
    grid.insertAdjacentHTML('afterend',
      '<div class="gallery-load-more" id="loadMoreWrap"><p style="font-size:.75rem;color:var(--ink-muted);">已展示全部 ' + photos.length + ' 张照片</p></div>');
  }
}

function loadMorePhotos() {
  galleryVisibleCount += 12;
  // Remove old load-more div
  var wrap = document.getElementById('loadMoreWrap');
  if (wrap) wrap.remove();
  renderGalleryFromData(null, false);
}

// =========================== LIGHTBOX ===========================
function openLightbox(url, title) {
  if (!url) return;
  document.getElementById('lbImg').src = url;
  document.getElementById('lbTitle').textContent = title || '';
  document.getElementById('lightbox').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  document.getElementById('lightbox').classList.remove('active');
  document.body.style.overflow = '';
}

// =========================== ALBUM PAGES ===========================
function showAlbumPage(albumId) {
  var album = APP_DATA.albums.find(function (a) { return a.id === albumId; });
  if (!album) { showMainSite(); return; }
  currentAlbumPage = albumId;

  document.getElementById('mainSite').style.display = 'none';
  document.getElementById('nav').style.display = 'none';
  document.getElementById('albumPages').style.display = 'block';

  var seasonColors = {
    spring: 'linear-gradient(135deg,#4a6741,#7a9e7e,#a8c5a8)',
    summer: 'linear-gradient(135deg,#8b6914,#c49a3c,#e6c864)',
    autumn: 'linear-gradient(135deg,#6b2f1a,#c1703c,#d4956b)',
    winter: 'linear-gradient(135deg,#3a5a70,#6b8ba4,#a0bcd0)'
  };

  document.getElementById('albumPages').innerHTML =
    '<div class="album-page active" id="albumPage_' + album.id + '">' +
      '<button class="back-btn" onclick="showMainSite()">&larr; 返回首页</button>' +
      '<div class="album-hero">' +
        '<div class="album-hero-bg" style="background:' + (seasonColors[album.season] || seasonColors.spring) + ';' + (album.cover ? 'background-image:url(' + album.cover + ');background-size:cover;' : '') + '"></div>' +
        '<div class="album-hero-overlay"></div>' +
        '<div class="album-hero-info">' +
          '<h1>' + escHtml(album.name) + '</h1>' +
          '<div class="album-count">' + album.photos.length + ' 张作品</div>' +
        '</div>' +
      '</div>' +
      '<div class="album-masonry">' +
        (album.photos.length === 0
          ? '<div style="text-align:center;padding:4rem;color:var(--ink-muted);grid-column:1/-1;">该图集暂无照片</div>'
          : album.photos.map(function (p) {
              return '<div class="masonry-item" onclick="openLightbox(\'' + escHtml(p.url || '') + '\',\'' + escHtml(p.title || '') + '\')">' +
                '<img src="' + escHtml(p.url || '') + '" alt="' + escHtml(p.title || '') + '" loading="lazy">' +
                '<div class="masonry-overlay"><span>' + escHtml(p.title || '') + '</span></div>' +
              '</div>';
            }).join('')
        ) +
      '</div>' +
    '</div>';

  // BGM
  if (album.bgm) {
    var audio = document.getElementById('bgmAudio');
    audio.src = album.bgm;
    audio.volume = 0.5;
    audio.play().catch(function () { });
    document.getElementById('bgmPlayer').classList.add('visible');
    document.getElementById('bgmInfo').textContent = 'BGM: ' + album.name;
    document.getElementById('bgmToggle').innerHTML = '&#9646;&#9646;';
  } else {
    stopBGM();
    document.getElementById('bgmPlayer').classList.remove('visible');
  }
  window.scrollTo(0, 0);
}

function showMainSite() {
  currentAlbumPage = null;
  document.getElementById('mainSite').style.display = '';
  document.getElementById('nav').style.display = '';
  document.getElementById('albumPages').style.display = 'none';
  document.getElementById('albumPages').innerHTML = '';
  stopBGM();
  document.getElementById('bgmPlayer').classList.remove('visible');
  renderGalleryFromData();
}
