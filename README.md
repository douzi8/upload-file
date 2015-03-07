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
  var upload = new Upload({
    dest: 'dest/path',
    maxFileSize: 100 * 1024,
    acceptFileTypes: /(\.|\/)(gif|jpe?g|png)$/i,
    rename: function(name, file) {
      console.log(this.fields);
      return file.filename;
    }
  });

  upload.on('end', function(fields, files) {
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
```

## API
### constructor(options)
* {object} ``options`` required
  * {string} ``options.dest`` required  
    Upload path
  * {RegExp} ``options.acceptFileTypes``  
    The regular expression for allowed file types, matches against either file type or file name
  * {function} ``options.rename(name, file)``  
    Return filename for change the filename or path, name is the input file name, and file is a object
  * {number} ``[options.maxNumberOfFiles=Infinity]``  
    The limit of files to be uploaded
  * {number} ``[options.minNumberOfFiles=1]``  
    The minimum of files to be uploaded
  * {number} ``[options.maxFileSize=Infinity]``  
    The maximum allowed file size in bytes
  * {number} ``[options.minFileSize=0]``  
    The minimum allowed file size in bytes
  * {object} ``options.messages``  
    Error and info messages
    * message.maxNumberOfFiles
    * message.minNumberOfFiles
    * message.acceptFileTypes
    * message.maxFileSize
    * message.minFileSize
    * message.invalidRequest

### upload.on(event, listener)
Inherit from node's EventEmitter

### upload.parse(req)
Parse the http request

### upload.cleanup()
If the form is invalid, you can invoke this method for clear unnecessary file

### upload.error(msg)
Emit error event with msg

### upload.fields
The fields of form, it's a object
```js
{
  name: 'value',
  city: ['1', '2']
}
```

### upload.files
The files of form, it's a obejct
```js
{
  file: {
    filename: 'index.css',
    path: 'upload/path/index.css',
    type: 'text/css',
    size: 100
  },
  files: [{...}, {...}] 
}

// If the file.filename is empty string, 
// it's means that user do not upload file with this file input
```

## How to run upload demo
 1. cd ``upload-file`` modules path
 1. npm install
 1. node express.js