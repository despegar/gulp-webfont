var through = require('through2');
var gutil = require('gulp-util');
var PluginError = gutil.PluginError;
var File = gutil.File;
var sources = {}; // store the source file paths
var crypto = require('crypto');
var createFont = require('./lib/createFont').createFont;
var _ = require('lodash');
var fs = require('fs');

// Consts
const PLUGIN_NAME = 'gulp-webfont';

// -------------------------------------------------------
var bufferContents = function(folder) {
  return function(file, enc, cb) {
    if (file.isNull()) {
      return cb();
    }

    if (file.isStream()) {
      cb(new gutil.PluginError(PLUGIN_NAME, 'Streaming not supported'));
      return;
    }
    else if (file.isBuffer()) {
      sources[folder].push(file.path);
    }
    cb();
  }
}
// -------------------------------------------------------
var endStream = function(opts){
  return function (cb) {
    // all the input files are in, now convert them
    var that = this;

    createFont(opts, sources[opts.folder], function(o) {
      // all the fontforge magic is done.
      // the generated files are in the temp folder now
      _.map(o.types, function(type) {
        var fn = o.full.file + '.' + type;
        var f = new File({path: o.fontFilename + "." + type});
        f.contents = fs.createReadStream(fn);
        that.push(f)
      })
      cb();
    });
  }
}
function gulpWebfont(o) {
  var options = o || {};
  if(o.folder){
    sources[o.folder] = [];
  }
  // Creating a stream through which each file will pass
  return through.obj(bufferContents(o.folder), endStream(options));
}

// Exporting the plugin main function
module.exports = gulpWebfont;
