"use strict"

const XmlHttpRequest = function () {
}

XmlHttpRequest.prototype.open = function(verb, path, async) {
   this.path = path
}

XmlHttpRequest.prototype.send = function() {
  var file = require('path').join(__dirname, '..', this.path)
  this.responseText = require('fs').readFileSync(file).toString()
}

module.exports = XmlHttpRequest;

