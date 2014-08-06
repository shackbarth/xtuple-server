process.env.HOME = '/usr/local/xtuple';
process.chdir(process.env.HOME);

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
  fs = require('fs'),
  config,
  table;

function list (cb) {
  forever.list(false, function (err, data) {
    if (err) return log.warn(err.message);
    if (_.isFunction(cb)) cb(data);
  });
}

var xtupled = module.exports = {

  start: function (descriptors) {
    list(function (current) {
      var nascent = _.difference(_.pluck(descriptors, 'uid'), _.pluck(current, 'uid'));
      var extant = _.difference(_.pluck(current, 'uid'), _.pluck(descriptors, 'uid'));

      // start new processes
      _.each(nascent, function (uid) {
        var descriptor = _.find(descriptors, { uid: uid });
        if (!descriptor) return;

        forever.startDaemon(descriptor.script, descriptor);
        log.info('started', descriptor.uid);
      });

      // restart existing processes
      xtupled.restart(_.compact(_.map(extant, function (uid) {
        return _.find(descriptors, { uid: uid });
      })));
    });
  },

  stop: function (descriptors) {
    _.each(descriptors, function (descriptor) {
      var proc = forever.stop(descriptor.uid);
      proc.on('stop', function (err) {
        log.info('stopped', descriptor.uid);
      });
      proc.on('error', function (err) {
        log.info('already stopped', descriptor.uid);
      });
    });
    child.spawnSync('service', [ 'nginx', 'reload' ]);
    log.info('nginx', 'reloaded');
  },

  restart: function (descriptors) {
    _.each(descriptors, function (descriptor) {
      var proc = forever.restart(descriptor.uid);
      proc.on('restart', function (err) {
        log.info('restarted', descriptor.uid);
      });
      proc.on('error', function (err) {
        forever.startDaemon(descriptor.script, descriptor);
        log.info('started', descriptor.uid);
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

var commands = {

  start: program
    .command('start [name] [version] [type]')
    .action(function (name, version, type) {
      if (_.isString(name) && _.isString(version)) {
        xtupled.start(xtupled.getInstanceProcesses(name, version, type));
      }
      else if (_.isString(name)) {
        xtupled.start(xtupled.getAccountProcesses(name));
      }
      else {
        xtupled.start(xtupled.getAllProcesses());
      }
    }),

  stop: program
    .command('stop [name] [version] [type]')
    .action(function (name, version, type) {
      if (_.isString(name) && _.isString(version)) {
        xtupled.stop(xtupled.getInstanceProcesses(name, version, type));
      }
      else if (_.isString(name)) {
        xtupled.stop(xtupled.getAccountProcesses(name));
      }
      else {
        xtupled.stop(xtupled.getAllProcesses());
      }
    }),

  restart: program
    .command('restart [name] [version] [type]')
    .action(function (name, version, type) {
      if (_.isString(name) && _.isString(version)) {
        xtupled.restart(xtupled.getInstanceProcesses(name, version, type));
      }
      else if (_.isString(name)) {
        xtupled.restart(xtupled.getAccountProcesses(name));
      }
      else {
        xtupled.restart(xtupled.getAllProcesses());
      }
    }),

  reload: program
    .command('reload [name] [version] [type]')
    .action(function (name, version, type) {
      if (_.isString(name) && _.isString(version)) {
        xtupled.restart(xtupled.getInstanceProcesses(name, version, type));
      }
      else if (_.isString(name)) {
        xtupled.restart(xtupled.getAccountProcesses(name));
      }
      else {
        xtupled.restart(xtupled.getAllProcesses());
      }
    }),

  status: program
    .command('status [name]')
    .action(function (name) {
      list(function (list) {
        var rows = _.filter(list, function (row) {
          return !_.isString(name) || row.spawnWith.SUDO_USER === name;
        });
        _.each(list, function (row) {
          table.push([
            '' + row.uid,
            '' + row.spawnWith.SUDO_USER,
            '' + row.spawnWith.NODE_VERSION,
            '' + row.spawnWith.PG_PORT,
            '' + row.running ? 'online'.green : 'offline'.red,
            '' + moment(row.ctime).fromNow(true),
            '' + row.pid
          ]);
        });
        console.log(table.toString());
      });
    })
};

log.heading = 'xtupled';

forever.load({
  root: path.resolve(process.cwd(), '.forever'),
  pidPath: path.resolve(process.cwd(), '.forever', 'pids')
});
config = require(path.resolve(process.env.HOME, '.forever/config'));
table = new Table({
  head: [
    'process'.cyan,
    'user'.cyan,
    'node'.cyan,
    'pg port'.cyan,
    'status'.cyan,
    'uptime'.cyan,
    'pid'.cyan
  ],
  colWidths: [ 40, 20, 10, 10, 10, 16, 8 ]
});

program.parse(process.argv);
