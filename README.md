upload-file - Simplified file upload
===========

Some options is borrowed from [jquery.upload](https://github.com/blueimp/jQuery-File-Upload)

```js
var Upload = require('upload-file');
```

### install
```
npm install upload-file --save
```

### express demo
```js
app.post('/upload', function(req, res) {
  new Upload(req, {
    dest: 'dest/path',
    maxFileSize: 100 * 1024,
    rename: function(filename) {
      return filename;
    },
    done: function(err, files) {
      console.log(files);
      res.send(err || 'File uploaded successfully.');
    }
  });
});
```

## API
### constructor
* {object} ``req`` required  
  The request object
* {object} ``options`` required
  * {string} ``options.dest`` required  
    Upload path
  * {RegExp} ``options.acceptFileTypes``  
    The regular expression for allowed file types, matches against either file type or file name
  * {number} ``[options.maxNumberOfFiles=Infinity]``
    The limit of files to be uploaded
  * {number} ``[options.maxFileSize=Infinity]``  
    The maximum allowed file size in bytes
  * {number} ``[options.minFileSize=0]``  
    The minimum allowed file size in bytes
  * {object} ``options.messages``  
    Error and info messages
    * message.maxNumberOfFiles
    * message.acceptFileTypes
    * message.maxFileSize
    * message.minFileSize
    * message.fileWriteFailed
    * message.invalidRequest
  * {function} ``[options.done=noop]``  
    The callback for upload

## How to run upload demo
 1. cd ``upload-file`` modules path
 1. npm install
 1. node express.js