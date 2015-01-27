function d(str) {
  console.log(str);
}

$('#fileupload').fileupload({
  // Uncomment the following to send cross-domain cookies:
  //xhrFields: {withCredentials: true},
  singleFileUploads: false,
  forceIframeTransport: false,
  url: '/upload',
  acceptFileTypes: /(\.|\/)(gif|jpe?g|png|html|css)$/i,
  progressInterval: 10,
  progressall: function(e, data) {
    d(data);
  },
  fail: function(e, data) {
    d('fail');
  },
  done: function(e, data) {
    d('success');
  }
});