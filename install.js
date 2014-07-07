var targz = require('tar.gz');
var path = require('path');
var proc = require('child_process');
var rimraf = require('rimraf');
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

    new targz().extract(tarball, path.resolve(__dirname, 'extract'), function (err) {
      if (err) return log.error('extract', err);

      log.info('tarball', 'extracted');

      proc.execSync([ 'cp -r', path.resolve('extract', packageName, '*'), __dirname ].join(' '));
      rimraf.sync(path.resolve(__dirname, 'extract'));
      rimraf.sync(path.resolve(__dirname, packageName + '.tar.gz'));
    });
  },
  function () {
    log.error('Failed to download xtuple-server-commercial. Please try again');
    process.exit(1);
  });
