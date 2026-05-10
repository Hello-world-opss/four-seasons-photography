// =========================== MODALS ===========================
function openModal(type) {
  var map = { register: 'registerModal', submit: 'submitModal', login: 'loginModal' };
  var id = map[type];
  if (id) { document.getElementById(id).classList.add('active'); document.body.style.overflow = 'hidden'; }
  closeMobileNav();
}

function closeModal(type) {
  var map = { register: 'registerModal', submit: 'submitModal', login: 'loginModal' };
  var id = map[type];
  if (id) { document.getElementById(id).classList.remove('active'); document.body.style.overflow = ''; }
}

function switchModal(from, to) { closeModal(from); setTimeout(function () { openModal(to); }, 300); }

document.querySelectorAll('.modal-overlay').forEach(function (ov) {
  ov.addEventListener('click', function (e) { if (e.target === this) { this.classList.remove('active'); document.body.style.overflow = ''; } });
});

document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.active').forEach(function (o) { o.classList.remove('active'); });
    document.querySelectorAll('.lightbox.active').forEach(function (o) { o.classList.remove('active'); });
    document.body.style.overflow = '';
  }
});

// =========================== AUTH ===========================
function handleRegister(e) {
  e.preventDefault();
  var name = document.getElementById('regName').value.trim();
  var email = document.getElementById('regEmail').value.trim();
  var phone = document.getElementById('regPhone').value.trim();
  var password = document.getElementById('regPassword').value;
  if (APP_DATA.users.find(function (u) { return u.email === email; })) { showToast('该邮箱已注册'); return; }
  APP_DATA.users.push({ name: name, email: email, phone: phone, password: password, role: 'member', registeredAt: new Date().toISOString() });
  persist();
  document.getElementById('registerForm').reset();
  closeModal('register');
  showToast('注册成功！欢迎加入。');
  sendWelcomeEmail(name, email);
}

function sendWelcomeEmail(name, email) {
  var cfg = APP_DATA.emailConfig;
  if (!cfg.publicKey || !cfg.serviceId || !cfg.templateId) return;
  try {
    emailjs.init(cfg.publicKey);
    emailjs.send(cfg.serviceId, cfg.templateId, {
      to_name: name, to_email: email, from_name: cfg.fromName, reply_to: cfg.fromEmail,
      message: '欢迎加入春·夏·秋·冬摄影社区！\n\n—— 王仁强'
    }).then(function () { console.log('[Email] 欢迎邮件已发送'); }).catch(function () { });
  } catch (e) { }
}

function handleLogin(e) {
  e.preventDefault();
  var email = document.getElementById('loginEmail').value.trim();
  var pw = document.getElementById('loginPassword').value;
  var user = APP_DATA.users.find(function (u) { return u.email === email && u.password === pw; });
  if (user) {
    document.getElementById('loginForm').reset();
    closeModal('login');
    showToast('登录成功！欢迎回来，' + user.name + '。');
  } else { showToast('邮箱或密码错误'); }
}

function handleSubmit(e) {
  e.preventDefault();
  APP_DATA.submissions.push({
    id: 'sub-' + Date.now(), name: document.getElementById('subName').value.trim(),
    email: document.getElementById('subEmail').value.trim(),
    season: document.getElementById('subSeason').value,
    link: document.getElementById('subLink').value.trim(),
    description: document.getElementById('subDesc').value.trim(),
    status: 'pending', createdAt: new Date().toISOString()
  });
  persist();
  document.getElementById('submitForm').reset();
  closeModal('submit');
  showToast('投稿已成功提交！');
}
