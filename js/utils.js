// =========================== UTILITIES ===========================
function escHtml(s) { return s ? String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;') : ''; }
function seasonLabel(s) { return ({ spring: '春', summer: '夏', autumn: '秋', winter: '冬', other: '其他' })[s] || s; }
function statusLabel(s) { return ({ pending: '待审核', approved: '已通过', rejected: '已拒绝' })[s] || s; }
function roleLabel(r) { return ({ member: '会员', coadmin: '协助管理员', admin: '超级管理员' })[r] || r; }
function fmtDate(iso) { if (!iso) return '-'; const d = new Date(iso); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }

function showToast(msg) {
  const t = document.getElementById('toast'); t.textContent = msg; t.classList.add('show');
  setTimeout(function () { t.classList.remove('show'); }, 3000);
}
