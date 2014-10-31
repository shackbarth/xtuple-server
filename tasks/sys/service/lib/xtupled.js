var _ = require('lodash'),
  program = require('commander'),
  forever = require('forever'),
  glob = require('glob'),
  colors = require('colors'),
  Table = require('cli-table'),
  lib = require('xtuple-server-lib'),
  child = require('child_process'),
  moment = require('moment'),
  path = require('path'),
  log = require('npmlog'),
  pgrep = require('pgrep'),
  fs = require('fs');

var xtupled = module.exports = {
  list: function (cb) {
    forever.list(false, function (err, data) {
      if (err) return log.warn(err.message);
      if (_.isFunction(cb)) cb(data);
    });
  },

  start: function (descriptors) {
    xtupled.list(function (current) {
      var nascent = _.difference(_.pluck(descriptors, 'uid'), _.pluck(current, 'uid'));
      var extant = _.difference(_.pluck(current, 'uid'), _.pluck(descriptors, 'uid'));

      // start new processes
      _.each(nascent, function (uid) {
        var descriptor = _.find(descriptors, { uid: uid });
        if (!descriptor) return;

        var proc = forever.startDaemon(descriptor.script, descriptor);
        proc.on('error', function (err) {
          log.error(err);
          process.exit(1);
        });
        proc.on('start', function () {
          log.info('started', descriptor.uid);
        });
      });

      // restart existing processes
      xtupled.restart(_.compact(_.map(extant, function (uid) {
        return _.find(descriptors, { uid: uid });
      })));
    });
  },

  stop: function (_descriptors) {
    xtupled.list(function (list) {
      var descriptors = _.map(_descriptors, function (descriptor) {
        return _.extend({ }, descriptor, _.find(list, { uid: descriptor.uid }));
      });
      _.each(descriptors, function (descriptor) {
        var pkill = pgrep.exec({ parent: descriptor.pid }).then(function (pids) {
          log.info('stopping pids', pids);
          var proc = forever.stop(descriptor.uid);
          proc.on('stop', function (err) {
            if (err) return log.error(err);

            _.each(pids, function (pid) {
              child.execSync('kill -9 '+ pid);
              log.info('stopped', descriptor.uid);
            });
          });
          proc.on('error', function (err) {
            //log.error(err);
            log.info('already stopped', descriptor.uid);
          });
        });
      });
      child.spawnSync('service', [ 'nginx', 'reload' ]);
      log.info('nginx', 'reloaded');
    });
  },

  restart: function (descriptors) {
    _.each(descriptors, function (descriptor) {
      var proc = forever.restart(descriptor.uid);
      proc.on('restart', function (err) {
        log.info('restarted', descriptor.uid);
      });
      proc.on('error', function (err) {
        xtupled.start([ descriptor ]);
      });
    });
    child.spawnSync('service', [ 'nginx', 'reload' ]);
    log.info('nginx', 'reloaded');
  },

  getInstanceProcesses: function (name, version, type) {
    if (!_.isString(type)) {
      log.error('start', 'if you provide the name and version, then type is also required');
      return;
    }
    var id = lib.util.$({
      xt: { name: name, version: version },
      type: type
    });
    log.info('name', name);
    log.info('version', version);
    log.info('type', type);
    return _.map(glob.sync(path.resolve('/etc/xtuple', id, 'processes/*')), function (file) {
      return require(file);
    });
  },

  getAccountProcesses: function (name) {
    log.info('name', name);
    return _.map(glob.sync(path.resolve('/etc/xtuple', name + '-*', 'processes/*')), function (file) {
      return require(file);
    });
  },

  getAllProcesses: function () {
    return _.map(glob.sync('/etc/xtuple/*/processes/*'), function (file) {
      return require(file);
    });
  }
};
