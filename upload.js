var util = require('utils-extend');
var fs = require('file-system');
var path = require('path');
var StreamSearch = require('streamsearch');
var EventEmitter = require('events').EventEmitter;

// Some options borrow from jQuery.fileupload
function Upload(options) {
  this.options = util.extend({
    dest: '',
    minFileSize: 0,
    maxFileSize: Infinity,
    maxNumberOfFiles: Infinity,
    minNumberOfFiles: 1,
    messages: {
      maxNumberOfFiles: 'Maximum number of files exceeded',
      minNumberOfFiles: 'Less than minimum number of files',
      acceptFileTypes: 'File type not allowed',
      maxFileSize: 'File is too large',
      minFileSize: 'File is too small',
      invalidRequest: 'Invalid request'
    }
    /*
    // The regular expression for allowed file types, matches
    // against either file type or file name:
    acceptFileTypes: /(\.|\/)(gif|jpe?g|png)$/i,
    */
  }, options);
  this._isError = false;
  this._chunks = [];
  this.files = {};
  this.fields = {};
  this._writed = 0;
  
  fs.mkdirSync(this.options.dest);
}

util.inherits(Upload, EventEmitter);

/**
 * @description
 * Parse the http request
 */
Upload.prototype.parse = function(req) {
  var self = this;
  var contentType = req.headers['content-type'];
  if (!contentType) {
    return this.emit('error', this.options.messages.invalidRequest);
  }
  var boundary = '\r\n--' + getBoundary(contentType);

  this.search = new StreamSearch(new Buffer(boundary));
  this.search.on('info', this._oninfo.bind(this));

  // handle request object
  req
    .on('data', function(chunk) {
      self._chunks.push(chunk);
    })
    .on('end', function() {
      var buffer = Buffer.concat(self._chunks);
      var files = buffer.toString().match(/Content-Disposition:.+?filename="([^"]+)"/g);

      files = files ? files.length : 0;
      self._filesNumber = files;

      if (files > self.options.maxNumberOfFiles) {
        return self.error(self.options.messages.maxNumberOfFiles);
      }

      if (files < self.options.minNumberOfFiles) {
        return self.error(self.options.messages.minNumberOfFiles);
      }

      self.search.push(buffer);

      if (isNoneFiles(self.files)) {
        self.emit('end', self.fields, self.files);
      }
    });
};

Upload.prototype.error = function(msg) {
  if (this._isError) return;

  this._isError = true;
  this.emit('error', msg);
};

/**
 * @description
 * If the form is invalid, you can invoke this method for clear unnecessary file
 */
Upload.prototype.cleanup = function() {
  var files = this.files;

  for (var i in files) {
    var file = files[i];
    if (Array.isArray(file)) {
      file.forEach(function(item) {
        if (item.filename) {
          fs.unlink(item.path, util.noop);
        }
      });
    } else if (file.filename) {
      fs.unlink(file.path, util.noop);
    }
  }
};

Upload.prototype._oninfo = function(isMatch, data, start, end) {
  if (!data || !isMatch) return;

  var result = data.slice(start, end);

  this._parsePart(result);
};

Upload.prototype._parsePart = function(data) {
  var result = splitHeaderBody(data);
  var header = result.header.toString();
  var disposition = header.match(/Content-Disposition:.+/);
  var options = this.options;

  if (!disposition) {
    return this.error(options.messages.invalidRequest);
  }

  disposition = disposition[0];
  var name = disposition.match(/name="([^"]+)"/);

  if (!name) {
    return this.error(options.messages.invalidRequest);
  }

  name = name[1];

  var filename = disposition.match(/filename="([^"]*)"/);
  
  if (!filename) {
    this._parseValue(this.fields, name, result.body.toString());
    return;
  }

  filename = filename[1];
  var type = header.match(/Content-Type:\s*(.+)/);
  var file = {
    filename: filename,
    path: path.join(options.dest, filename),
    type: type ? type[1] : '',
    size: result.body.length
  };

  this._parseValue(this.files, name, file);

  // empty input file
  if (!filename) return;

  // Rename file
  if (util.isFunction(options.rename)) {
    file.filename = options.rename.call(this, name, file);
  }

  if (!this.validate(file)) return;

  this._write(file.filename, result.body);
};

// Value is array, like key[]=1&key[]=2, and key=1&key=2
Upload.prototype._parseValue = function(obj, name, value) {
  var isArray = /\[\]$/.test(name);

  if (isArray) {
    name = name.replace(/\[\]$/, '');
  }

  if (util.isUndefined(obj[name])) {
    if (isArray) {
      obj[name] = [value];
    } else {
      obj[name] = value;
    }
  } else {
    if (Array.isArray(obj[name])) {
      obj[name].push(value);
    } else {
      obj[name] = [obj[name], value];
    }
  }
};

Upload.prototype._write = function(filename, body) {
  var filepath = path.join(this.options.dest, filename);

  // upload folder
  if (path.dirname(filename) !== '.') {
    fs.mkdirSync(path.dirname(filepath));
  }

  // upload file
  var part = fs.createWriteStream(filepath);
  var self = this;

  part.on('finish', function() {
    self._writed++;
    if (self._writed >= self._filesNumber) {
      self.emit('end', self.fields, self.files);
    }
  });

  part.on('error', function(err) {
    self.error(err);
  });

  part.write(body);
  part.end();
};


// Validate the name, type, max size and min size of each file
Upload.prototype.validate = function(file) {
  var options = this.options;

  if (options.acceptFileTypes && 
      !(options.acceptFileTypes.test(file.type) ||
        options.acceptFileTypes.test(file.name))) {
    this.error(options.messages.acceptFileTypes);
    return false;
  } else if (file.size > options.maxFileSize) {
    this.error(options.messages.maxFileSize);
    return false;
  } else if (file.size < options.minFileSize) {
    this.error(options.messages.minFileSize);
    return false;
  }

  return true;
};

// RFC2046
function getBoundary(contentType) {
  contentType = contentType.split(/;\s*/);

  if (contentType) {
    return contentType[1].replace('boundary=', '');
  }

  return '';
}

function splitHeaderBody(data) {
  // CRLF
  var CR = 13;
  var LF = 10;
  var item;
  var start;
  
  for (var i = 0, l = data.length - 3; i < l; i++) {
    item = data[i];

    if (item === CR) {
      if (data[i + 1] === LF && data[i + 2] === CR && data[i + 3] === LF) {
        start = i;
        break;
      }
    }
  }

  if (start) {
    return {
      header: data.slice(0, start),
      body: data.slice(start + 4)
    };
  } else {
    return {
      header: {
        data: data,
        body: new Buffer(0)
      }
    };
  }
}

function isNoneFiles(files) {
  for (var i in files) {
    if (Array.isArray(files[i])) {
      var l = files[i].length;

      while (l--) {
        if (files[i][l].filename) {
          return false;
        }
      }

    } else if (files[i].filename) {
      return false;
    }
  }

  return true;
}

module.exports = Upload;