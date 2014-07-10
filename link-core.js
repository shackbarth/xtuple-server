var _ = require('lodash'),
  path = require('path'),
  glob = require('glob'),
  rimraf = require('rimraf'),
  log = require('npmlog'),
  fs = require('fs');

log.heading = 'nex';

process.chdir(__dirname);

var pkg = require('./package');

_.each(pkg.symlinks, function (_target, _source) {
  var target = path.resolve(_target);
  var files = glob.sync(path.resolve(_source));

  _.each(files, function (file) {
    var targetfile = path.resolve(target, path.basename(file));

    if (fs.existsSync(targetfile)) {
      rimraf.sync(targetfile);
    }

    if (fs.existsSync(file)) {
      log.info('symlinks', file, '->', targetfile);
      fs.symlinkSync(file, targetfile);
    }
  });
});
log.info('symlinks', 'done.');
