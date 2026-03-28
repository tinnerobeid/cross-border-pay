const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

module.exports = (async () => {
  const config = await getDefaultConfig(__dirname);

  // Restrict watch folders to the mobile app directory only.  When the
  // workspace contains a large backend/service folder (like in this repo),
  // Metro will otherwise spend a long time scanning and re-bundling on every
  // file change.  Limiting the watch list greatly speeds up reload times.
  config.watchFolders = [path.resolve(__dirname)];

  // Optionally bump the number of workers if you have a multi‑core CPU
  // config.maxWorkers = 4;

  return config;
})();
