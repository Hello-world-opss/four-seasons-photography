// =========================== ROUTER & NAV ===========================
function scrollToSection(id) {
  showMainSite();
  setTimeout(function () {
    var el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }, 100);
  if (window.innerWidth <= 1024) closeMobileNav();
}

function toggleMobileNav() { document.getElementById('nav').classList.toggle('mobile-open'); }
function closeMobileNav() { document.getElementById('nav').classList.remove('mobile-open'); }

function handleHashChange() {
  var hash = window.location.hash;
  if (hash.startsWith('#/album/')) {
    var albumId = hash.replace('#/album/', '');
    showAlbumPage(albumId);
  } else if (!hash || hash === '#/' || hash === '#') {
    showMainSite();
  }
}

window.addEventListener('hashchange', handleHashChange);

// Nav scroll observer
(function () {
  var nav = document.getElementById('nav');
  var hero = document.querySelector('.hero');
  if (hero) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) {
          nav.style.background = 'rgba(250,248,245,.95)';
          nav.style.backdropFilter = 'blur(20px)';
          nav.style.mixBlendMode = 'normal';
          nav.style.borderBottom = '1px solid rgba(0,0,0,.06)';
          nav.querySelectorAll('a,.nav-brand').forEach(function (el) { el.style.color = '#1a1a1a'; });
          nav.querySelectorAll('.nav-toggle span').forEach(function (el) { el.style.background = '#1a1a1a'; });
        } else {
          nav.style.background = 'transparent';
          nav.style.backdropFilter = 'none';
          nav.style.mixBlendMode = 'difference';
          nav.style.borderBottom = 'none';
          nav.querySelectorAll('a,.nav-brand').forEach(function (el) { el.style.color = '#fff'; });
          nav.querySelectorAll('.nav-toggle span').forEach(function (el) { el.style.background = '#fff'; });
        }
      });
    }, { threshold: 0.3 });
    observer.observe(hero);
  }
})();
