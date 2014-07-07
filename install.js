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

    process.chdir(__dirname);
    new targz().extract(tarball, 'extract', function (err) {
      if (err) return log.error('extract', err);

      proc.execSync([ 'cp -r', path.resolve('extract', packageName, '*'), '.' ].join(' '));
    });
  },
  function () {
    log.error('Failed to download xtuple-server-commercial. Please try again');
    process.exit(1);
  });
