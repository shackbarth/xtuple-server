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

var xtupled = module.exports = {

  start: function (descriptors) {
    _.each(descriptors, function (descriptor) {
      forever.startDaemon(descriptor.script, descriptor);
    });
  },

  stop: function (descriptors) {
    _.each(descriptors, function (descriptor) {
      try {
        forever.stop(descriptor.uid);
      }
      catch (e) {
        console.log(descriptor.uid + ' already stopped.');
      }
    });
  },

  restart: function (descriptors) {
    _.each(descriptors, function (descriptor) {
      xtupled.stop([ descriptor ]);
      xtupled.start([ descriptor ]);
    });
  },

  getInstanceProcesses: function (name, version) {
    var id = name + '-' + version;
    //var id = lib.util.$({ xt: { name: name, version: version }, type: '*' });
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
        _.each(data, function (row) {
          table.push([
            '' + row.uid,
            '' + row.spawnWith.SUDO_USER,
            '' + row.spawnWith.NODE_VERSION,
            '' + row.spawnWith.PG_PORT,
            '' + row.pid,
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
    colWidths: [ 48, 16, 8, 16, 8, 8 ]
  });

  program.parse(process.argv);
}
