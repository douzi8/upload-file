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
  var upload = new Upload({
    maxNumberOfFiles: 10,
    // Byte unit
    maxFileSize: 1000 * 1024,
    acceptFileTypes: /(\.|\/)(gif|jpe?g|png|css)$/i,
    dest: 'uploads/path',
    minNumberOfFiles: 0
  });

  upload.on('end', function(fields, files) {
    console.log(fields);
    console.log(files);

    if (!fields.channel) {
      this.cleanup();
      this.error('Channel can not be empty');
      return;
    }

    res.send('ok')
  });

  upload.on('error', function(err) {
    res.send(err);
  });

  upload.parse(req);
});

var server = app.listen(8000, function () {
  var host = server.address().address
  var port = server.address().port
  console.log('Example app listening at http://%s:%s', host, port)
});