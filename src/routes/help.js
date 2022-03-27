'use strict';

const express = require('express');
const router = express.Router();

/* Help Page. */
router.get('/help', function (req, res) {
  const config = req.app.config;

  res.render('help', {
    environment: config.env,
    tunnel: config.tunnel
  });
});

module.exports = router;