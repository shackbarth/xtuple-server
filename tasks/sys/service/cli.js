#! /usr/bin/env node

var _ = require('lodash'),
  program = require('commander'),
  forever = require('forever'),
  glob = require('glob'),
  colors = require('colors'),
  Table = require('cli-table'),
  lib = require('xtuple-server-lib'),
  path = require('path'),
  fs = require('fs'),
  config,
  table;

log.heading = 'xtupled';

var xtupled = module.exports = {

  start: function (descriptors) {
    _.each(descriptors, function (descriptor) {
      forever.startDaemon(descriptor.script, descriptor);
    });
  },

  stop: function (descriptors) {
    _.each(descriptors, function (descriptor) {
      var proc = forever.stop(descriptor.uid);
      proc.on('stop', function (err) {
        log.info('stopped', descriptor.uid);
      });
    });
  },

  restart: function (descriptors) {
    _.each(descriptors, function (descriptor) {
      var proc = forever.restart(descriptor.uid);
      proc.on('restart', function (err) {
        log.info('restarted', descriptor.uid);
      });
    });
  },

  getInstanceProcesses: function (name, version) {
    var id = name + '-' + version;
    return _.map(glob.sync('/etc/xtuple/' + id + '/processes/*'), function (file) {
      return require(file);
    });
  },

  getAccountProcesses: function (name) {
    return _.map(glob.sync('/etc/xtuple/' + name + '-*/processes/*'), function (file) {
      return require(file);
    });
  },

  getAllProcesses: function () {
    return _.map(glob.sync('/etc/xtuple/*/processes/*'), function (file) {
      console.log(file);
      return require(file);
    });
  }
};

var commands = {

  start: program
    .command('start [name] [version]')
    .action(function (name, version) {
      if (_.isString(name) && _.isString(version)) {
        xtupled.start(xtupled.getInstanceProcesses(name, version));
      }
      else if (_.isString(name)) {
        xtupled.start(xtupled.getAccountProcesses(name));
      }
      else {
        xtupled.start(xtupled.getAllProcesses());
      }
    }),

  stop: program
    .command('stop [name] [version]')
    .action(function (name, version) {
      if (_.isString(name) && _.isString(version)) {
        xtupled.stop(xtupled.getInstanceProcesses(name, version));
      }
      else if (_.isString(name)) {
        xtupled.stop(xtupled.getAccountProcesses(name));
      }
      else {
        xtupled.stop(xtupled.getAllProcesses());
      }
    }),

  restart: program
    .command('restart [name] [version]')
    .action(function (name, version) {
      if (_.isString(name) && _.isString(version)) {
        xtupled.restart(xtupled.getInstanceProcesses(name, version));
      }
      else if (_.isString(name)) {
        xtupled.restart(xtupled.getAccountProcesses(name));
      }
      else {
        xtupled.restart(xtupled.getAllProcesses());
      }
    }),

  status: program
    .command('status [name] [version]')
    .action(function (name, version) {
      forever.list(false, function (err, data) {
        if (err) return log.warn(err.message);

        _.each(data, function (row) {
          table.push([
            '' + row.uid,
            '' + row.spawnWith.SUDO_USER,
            '' + row.spawnWith.NODE_VERSION,
            '' + row.spawnWith.PG_PORT,
            '' + row.pid,
            // TODO format with moment
            '' + Math.round((Date.now().valueOf() - row.ctime) / 1000) + 's'
          ]);
        });
        console.log(table.toString());
      });
    })
};

if (require.main === module) {
  var home = '/usr/local/xtuple';
  process.env.HOME = home;
  process.chdir(process.env.HOME);
  forever.load({
    root: path.resolve(home, '.forever'),
    pidPath: path.resolve(home, '.forever', 'pids')
  });
  config = require(path.resolve(process.env.HOME, '.forever/config'));
  table = new Table({
    head: [
      'process'.cyan,
      'user'.cyan,
      'node'.cyan,
      'pg port'.cyan,
      'pid'.cyan,
      'uptime'.cyan
    ],
    colWidths: [ 48, 16, 8, 16, 8, 16 ]
  });

  program.parse(process.argv);
}
