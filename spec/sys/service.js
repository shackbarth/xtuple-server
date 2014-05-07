var assert = require('chai').assert,
  _ = require('lodash'),
  fs = require('fs'),
  exec = require('execSync').exec,
  options = global.options;

it('should install pm2 binaries', function () {
  assert.equal(exec('which pm2').code, 0, 'pm2 binary not properly installed');
});

it('all pm2 services accounted for (server, healthfeed, snapshotmgr)', function () {
  var pm2config = JSON.parse(fs.readFileSync(options.sys.pm2.configfile).toString());
  assert.lengthOf(pm2config, 3);
});

describe('service xtuple <version> status (pm2 jlist)', function () {
  it('xtuple web server is running', function () {
    var jlist = JSON.parse(exec('pm2 jlist').stdout),
      serverProcessName = 'xtuple-server-' + options.xt.version + '-' + options.xt.name,
      serverProcess = _.findWhere(jlist.processes, { name: serverProcessName });

    assert.equal(serverProcess.status, 'online', 'xTuple web server is down');
  });
  it('health monitor is running', function () {
    var jlist = JSON.parse(exec('pm2 jlist').stdout),
      healthProcessName = 'xtuple-healthfeed-' + options.xt.version + '-' + options.xt.name,
      healthProcess = _.findWhere(jlist.processes, { name: healthProcessName });

    assert.equal(healthProcess.status, 'online', 'xTuple Health Feed is down');
  });
});
