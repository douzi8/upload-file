var express = require('express')
var app = express()
var Upload = require('./upload');
var path = require('path');
var serveStatic = require('serve-static');

app.use(serveStatic('assets', { index: false }));

app.set('view engine', 'jade');

app.get('/', function (req, res) {
  res.render('index');
});

app.post('/upload', function(req, res) {
  new Upload(req, {
    headers: req.headers,
    maxNumberOfFiles: 3,
    // Byte unit
    maxFileSize: 100 * 1024,
    acceptFileTypes: /(\.|\/)(gif|jpe?g|png|css)$/i,
    dest: 'uploads/path',
    rename: function(filename) {
      var d = Date.now();
      return d + path.extname(filename);
    },
    done: function(err, files) {
      console.log(files);
      res.send(err || 'File uploaded successfully');
    }
  });
});

var server = app.listen(8000, function () {
  var host = server.address().address
  var port = server.address().port
  console.log('Example app listening at http://%s:%s', host, port)
});