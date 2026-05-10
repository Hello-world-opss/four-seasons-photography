const fs = require('fs');
const path = require('path');
const os = require('os');

const PHOTOS_DIR = path.join(os.homedir(), 'Pictures', 'FourSeasons', 'photos');

function ensureDir() {
  if (!fs.existsSync(PHOTOS_DIR)) {
    fs.mkdirSync(PHOTOS_DIR, { recursive: true });
  }
}

function dataUrlToBuffer(dataUrl) {
  const matches = dataUrl.match(/^data:image\/(\w+);base64,(.+)$/);
  if (!matches) throw new Error('Invalid dataUrl format');
  return {
    buffer: Buffer.from(matches[2], 'base64'),
    extension: matches[1] === 'jpeg' ? 'jpg' : matches[1]
  };
}

function saveImage(photoId, dataUrl) {
  ensureDir();
  const { buffer, extension } = dataUrlToBuffer(dataUrl);
  const filename = photoId + '.' + extension;
  const filePath = path.join(PHOTOS_DIR, filename);
  fs.writeFileSync(filePath, buffer);
  return 'local-img:///' + filePath.replace(/\\/g, '/');
}

function getImageDataUrl(photoId) {
  ensureDir();
  for (const ext of ['jpg', 'jpeg', 'png', 'webp', 'bmp']) {
    const filePath = path.join(PHOTOS_DIR, photoId + '.' + ext);
    if (fs.existsSync(filePath)) {
      const buf = fs.readFileSync(filePath);
      const mime = ext === 'jpg' ? 'jpeg' : ext;
      return 'data:image/' + mime + ';base64,' + buf.toString('base64');
    }
  }
  return null;
}

function deleteImage(photoId) {
  for (const ext of ['jpg', 'jpeg', 'png', 'webp', 'bmp']) {
    const filePath = path.join(PHOTOS_DIR, photoId + '.' + ext);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}

function pathFromUrl(url) {
  const cleaned = url.replace('local-img:///', '').replace('local-img://', '');
  return decodeURIComponent(cleaned);
}

module.exports = { saveImage, getImageDataUrl, deleteImage, PHOTOS_DIR, pathFromUrl };
