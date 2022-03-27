// var debug = require('debug');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const { getConfig } = require('./lib/config');

app.locals.syntaxHighlight = function syntaxHighlight(json) {
  json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
    let cls = 'number';
    if (/^"/.test(match)) {
      if (/:$/.test(match)) {
        cls = 'key';
      } else {
        cls = 'string';
      }
    } else if (/true|false/.test(match)) {
      cls = 'boolean';
    } else if (/null/.test(match)) {
      cls = 'null';
    }
    return '<span class="' + cls + '">' + match + '</span>';
  });
}

// add properties to app for using in routes
app.config = getConfig();
app.localdev = false;
app.tunnel = {
  "left": null,
  "right": null
}

// Set template engine
app.set('view engine', 'ejs');

// support parsing of application/x-www-form-urlencoded post data
app.use(bodyParser.urlencoded({ extended: true }));
// serving the static files. (CSS, JS, Images)
app.use(express.static(__dirname + '/public'));
app.use(function (req, res, next) {
  if (req.method === 'GET') {
    res.append('Content-Language', 'en');
  }
  next();
});

// require the route
const index = require('./routes/index');
const connect = require('./routes/connect');
const help = require('./routes/help');

// setup the routes
app.use('/', index);
app.use('/', connect);
app.use('/', help);

// handle .php requests (internal call)
app.use('*.php', function(req, res, next) {
  const exec = require('child_process').exec;
  const host = req.query.host;
  const key = req.query.key;

//debug
  console.log("LOG: PHP-API -> Sending request to: %s", host); // e.g. host.docker.internal:3001
  exec(`php php/memcached.php ${host} ${key}`, function(error, stdout, stderr) {
//debug
//      console.log('LOG: PHP-API -> Response ↓');
//      console.log(stdout);
//      process.exit();
    res.write(stdout);
    res.end();
  });
});

// Bind the app to a specified port
const port = process.env.PORT || 3000;
const environment = process.env.NODE_ENV || 'production';

// setup environment
if (environment !== 'production') {
  app.localdev = true;
}

// Start web server
const server = app.listen(port, () => console.log(`Visualise igbinary serialized values for Memcache/Memcached listening on port: ${port}`));

['SIGINT', 'SIGTERM', 'SIGQUIT'].forEach(signal => process.on(signal, () => {
  server.close();
  console.log('Web server terminated! Bye bye...');
  process.exit();
}));
