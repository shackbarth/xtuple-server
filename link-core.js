var _ = require('lodash'),
  path = require('path'),
  glob = require('glob'),
  log = require('npmlog'),
  fs = require('fs');

log.heading = 'nex';

process.chdir(__dirname);

var pkg = require('./package');

_.each(pkg.symlinkExports, function (_target, _source) {
  //var split = _target.split(path.sep);
  //var target = path.resolve(path.dirname(require.resolve(split[0])), split.slice(1).join(path.sep));
  var target = path.resolve(_target);
  var files = glob.sync(path.resolve(_source));

  _.each(files, function (file) {
    var targetfile = path.resolve(target, path.basename(file));

    if (!fs.existsSync(targetfile) && fs.existsSync(file)) {
      log.info('symlinkExports', file, '->', targetfile);
      fs.symlinkSync(file, targetfile);
    }
  });
});
log.info('symlinkExports', 'done.');
