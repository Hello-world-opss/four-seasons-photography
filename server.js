const express = require('express');
const path = require('path');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(__dirname));

// Fallback to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

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

  console.log('  按 Ctrl+C 停止服务器\n');
});
