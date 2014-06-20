var _ = require('lodash'),
  path = require('path'),
  glob = require('glob'),
  fs = require('fs');

process.chdir(__dirname);

var workspace = require('./workspace');

// target = me
_.each(workspace.linkImports, function (_target, _source) {
  var split = _source.split(path.sep);
  var target = path.resolve(_target);
  var files = glob.sync(
    path.resolve(path.dirname(require.resolve(split[0])), split.slice(1).join(path.sep))
  );

  _.each(files, function (file) {
    var targetfile = path.resolve(target, path.basename(file));

    if (!fs.existsSync(targetfile)) {
      fs.symlinkSync(file, targetfile);
    }
  });
  console.log('linkImports: done');
});

// source = me
_.each(workspace.linkExports, function (_target, _source) {
  //var split = _target.split(path.sep);
  //var target = path.resolve(path.dirname(require.resolve(split[0])), split.slice(1).join(path.sep));
  var target = path.resolve(_target);
  var files = glob.sync(path.resolve(_source));
  console.log('target dir: '+ target);

  _.each(files, function (file) {
    var targetfile = path.resolve(target, path.basename(file));

    if (/*!fs.lstatSync(file).isSymbolicLink() && */!fs.existsSync(targetfile)) {
      console.log(targetfile);
      fs.symlinkSync(file, targetfile);
    }
  });
});
console.log('linkExports: done');
