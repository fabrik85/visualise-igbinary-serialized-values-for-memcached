'use strict';

const express = require('express');
const router = express.Router();
const bent = require('bent')

// Wrap async handlers in a function that handles errors
const awaitHandlerFactory = (middleware) => {
  return async (req, res, next) => {
    try {
      await middleware(req, res, next)
    } catch (err) {
      next(err)
    }
  }
}

/* GET home page. */
router.get('/', awaitHandlerFactory(async (req, res) => {
  // Home page (query for memcached data) cannot be used till we don't have a connection.
  if (req.app.tunnel.left === null) {
    res.redirect('/connect');
    return;
  }

  if (!req.query.mckey) {
    res.render('index', {tunnel: req.app.config.tunnel});
  // Memcached key provided.
  } else {
    const requests = [];
    const tunnelProperties = Object.keys(req.app.tunnel);

    for (let i = 0; i < tunnelProperties.length; i++) {
      if (req.app.tunnel[tunnelProperties[i]]) {
        requests[i] = {
          panel: tunnelProperties[i],
          host:  "host.docker.internal",
          port:  req.app.tunnel[tunnelProperties[i]].port,
          key:   req.app.tunnel[tunnelProperties[i]].ns + req.query.mckey
        };
//debug
        console.log("LOG: requestData %s ↓", i);
        console.log(requests[i]);
      }
    }

    // @todo Implement once we need it.
    // if (!req.app.localdev) {}

    const response = {};
    for (const request of requests) {
      // Invoke myself (nodejs app) which will trigger PHP API
      const getStream = bent(`http://localhost:3000`);
      // Use PHP CLI script as an API request (JSON)
      const stream = await getStream(`/api.php?host=${request.host}:${request.port}&key=${request.key}`);
      // Prepare data to the view.
      if (stream.status === 200) {
        response[request.panel] = await stream.json();
      }
    }

    res.render('index', {
      responseData: response,
      tunnel: req.app.config.tunnel
    });
  }
}));

module.exports = router;
