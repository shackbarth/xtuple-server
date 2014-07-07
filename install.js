var targz = require('tar.gz');
var path = require('path');
var cp = require('cp');
var proc = require('child_process');
var log = require('npmlog');
var github = require('nex-github');
var pkg = require('./package');
var repository = pkg.repository;
var packageName = pkg.name + '-' + pkg.version;

log.heading = 'nex-github';
repository.version = pkg.version;

github.getRelease(repository)
  .then(function (tarball) {
    log.info('tarball', 'extracting', tarball);

    process.chdir(path.resolve(process.cwd(), 'node_modules', pkg.name));
    log.info('this file directory', __dirname);
    log.info('cwd', process.cwd());
    new targz().extract(tarball, path.resolve(process.cwd(), 'extract'), function (err) {
      if (err) return log.error('extract', err);

      log.info('copying', path.resolve('extract', packageName, '*'), 'to', process.cwd());

      proc.execSync([ 'cp -r', path.resolve('extract', packageName, '*'), process.cwd() ].join(' '));
    });
  },
  function () {
    log.error('Failed to download xtuple-server-commercial. Please try again');
    process.exit(1);
  });
