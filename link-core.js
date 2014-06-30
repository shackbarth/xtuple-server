var _ = require('lodash'),
  path = require('path'),
  glob = require('glob'),
  log = require('npmlog'),
  fs = require('fs');

process.chdir(__dirname);

var workspace = require('./workspace');
var pkg = require('./package');

_.each(workspace.linkExports, function (_target, _source) {
  //var split = _target.split(path.sep);
  //var target = path.resolve(path.dirname(require.resolve(split[0])), split.slice(1).join(path.sep));
  var target = path.resolve(_target);
  var files = glob.sync(path.resolve(_source));
  console.log('target dir: '+ target);

  _.each(files, function (file) {
    var targetfile = path.resolve(target, path.basename(file));

    if (!fs.existsSync(targetfile) && fs.existsSync(file)) {
      log.info('nex', 'installing '+ file + ' -> ' + targetfile);
      fs.symlinkSync(file, targetfile);
    }
  });
});
log.info('nex', 'linkExports', 'done');
