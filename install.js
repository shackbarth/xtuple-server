var path = require('path');
var cp = require('cp');
var proc = require('child_process').execSync;
var log = require('npmlog');
var github = require('nex-github');
var pkg = require('./package');
var repository = pkg.repository;

log.heading = 'nex-github';
repository.version = pkg.version;

github.getRelease(repository)
  .then(function (tarball) {
    cp.sync(tarball, path.resolve(process.cwd()));
    proc.exec('npm install '+ tarball);
  },
  function () {
    log.error('Failed to download xtuple-server-commercial. Please try again');
    process.exit(1);
  });
