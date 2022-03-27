const path = require('path');

const getConfig = () => {
  const config = require(path.join(__dirname, '../', 'settings.json'));
  if (!config.tunnel) {
    config.tunnel = {};
  }

  return config;
}

module.exports = {
  getConfig
};