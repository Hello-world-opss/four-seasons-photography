// =========================== BGM PLAYER ===========================
let currentAlbumPage = null;

function toggleBGM() {
  var audio = document.getElementById('bgmAudio');
  if (audio.paused) { audio.play().catch(function () { }); document.getElementById('bgmToggle').innerHTML = '&#9646;&#9646;'; }
  else { audio.pause(); document.getElementById('bgmToggle').innerHTML = '&#9654;'; }
}

function stopBGM() {
  var audio = document.getElementById('bgmAudio');
  audio.pause(); audio.src = '';
  document.getElementById('bgmToggle').innerHTML = '&#9654;';
}

function setBGMVolume(v) {
  document.getElementById('bgmAudio').volume = v / 100;
}
