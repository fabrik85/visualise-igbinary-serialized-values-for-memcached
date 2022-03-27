'use strict';

const express = require('express');
const router = express.Router();
const { initTunnelOnHost, closeTunnelOnHost } = require('../lib/tunnel');

router.get('/connect', function (req, res) {
  const config = req.app.config;

  // Dynamic selection live/stage/dev
  res.render('connect', {
    environment: config.env,
    tunnel: config.tunnel,
    missingUser: !config.sshUser
  });
});

// Based on this port list (config.tunnels) we can: close all the ports at the end of the program, avoid opening 1 port multiple times,
router.post('/connect', (req, res) => {
  const environment = req.body.environment;
  const node = req.body.node;
  const panel = req.body.panel;
  const config = req.app.config;
  const remoteHost = config.env[environment][node].host;
  const remotePort = config.env[environment][node].port;
  const remoteNS = config.env[environment][node].ns;

  const localPort = (panel === 'left' ? config.localPort.left : config.localPort.right);
  const numberOfTunnels = Object.keys(config.tunnel).length;

  // Handle changes
  if (environment !== 'dev' && (numberOfTunnels !== 2 || config.tunnel[panel].host !== remoteHost)) {
    const tunnelConfig = {
      apiPort: config.apiPort,
      localPort: localPort,
      remotePort: remotePort,
      remoteHost: remoteHost
    };

//debug
console.log("LOG: tunnelConfig ↓");
console.log(tunnelConfig);

    if (req.app.tunnel[panel] && req.app.tunnel[panel].port === localPort) {
      closeTunnelOnHost(tunnelConfig)
          .then((response) => {
//debug
              console.log("LOG: Tunnel closed on host port=%s", localPort);
              if (response) {
                  req.app.tunnel[panel] = null;
                  delete config.tunnel[panel];
              } else {
                  res.statusCode = 500;
                  res.end('Error: SSH tunnel cannot be closed!');
              }
          })
          .catch((error) => {
              res.statusCode = 500;
              res.end(error.message);
          });
    }

    Promise.race([
      initTunnelOnHost(tunnelConfig),
      new Promise(function (resolve, reject) {
        setTimeout(() => reject(new Error(`SSH request timeout! Please check VPN / YubiKey / You have permission to ${remoteHost} / etc...`)), 15000)
      })
    ]).then((response) => {
//debug
console.log("LOG: initTunnelOnHost() finished!");
console.log("LOG: Response obj_↓");
console.log(response);

      if (response.result === false) {
        res.statusCode = 500;
        res.end('Error: SSH tunnel cannot be opened!');
      } else {
        config.tunnel[panel] = {
          "host": remoteHost,
          "port": localPort
        }
        req.app.config = config;
        req.app.tunnel[panel] = {
          port: localPort,
          ns: remoteNS,
        };

        res.render('connect', {
          environment: config.env,
          tunnel: config.tunnel,
          missingUser: !config.sshUser
        });
      }
    }).catch((error) => {
      res.statusCode = 500;
      res.end(error.message);
    });
    // Local Development
  } else if (environment === 'dev' && (!req.app.tunnel[panel] || req.app.tunnel[panel].port !== remotePort)) {
    // Update config
    config.tunnel[panel] = {
      "host": remoteHost,
      "port": remotePort
    }
    req.app.config = config;
    // Update tunnel
    req.app.tunnel[panel] = {
      port: remotePort,
      ns: remoteNS,
    };
    res.render('connect', {
      environment: config.env,
      tunnel: config.tunnel,
      missingUser: !config.sshUser
    });
  }
});

router.get('/close', function (req, res) {
  const config = req.app.config;
  const panel = req.query.panel;
  const page = (req.query.page ? req.query.page : "connect");
  const localPort = (panel === 'left' ? config.localPort.left : config.localPort.right);

  if (req.app.tunnel[panel] && req.app.tunnel[panel].port === localPort) {
//debug
    console.log("Closing SSH tunnel on port: %s...", req.app.tunnel[panel].port);

    closeTunnelOnHost({
      apiPort: config.apiPort,
      localPort: localPort
    }).then((response) => {
//debug
        console.log("LOG: Tunnel closed response=%s", response);

        if (response) {
          req.app.tunnel[panel] = null;
          delete config.tunnel[panel];
          (page === 'index' ? res.redirect("/") : res.redirect(`/${page}`))
        } else {
          res.statusCode = 500;
          res.end('Error: SSH tunnel cannot be closed!');
        }
      })
      .catch((error) => {
        res.statusCode = 500;
        res.end(error.message);
      });
  } else {
    res.render('connect', {
      environment: config.env,
      tunnel: config.tunnel,
      missingUser: !config.sshUser
    });
  }
});

module.exports = router;
