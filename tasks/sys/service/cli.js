#! /usr/bin/env node

var _ = require('lodash'),
  program = require('commander'),
  forever = require('forever'),
  glob = require('glob'),
  lib = require('xtuple-server-lib'),
  path = require('path'),
  fs = require('fs');

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

  getInstanceProcesses: function (version, name) {
    var id = lib.util.$({ xt: { name: name, version: version }, type: '*' });
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

program
  .command('start [version] <name>')
  .action(function (version, name) {
    xtupled.start(xtupled.getInstanceProcesses(version, name));
  });

program
  .command('startall')
  .action(function () {
    xtupled.start(xtupled.getAllProcesses());
  });

program
  .command('stop [version] <name>')
  .action(function (version, name) {
    xtupled.stop(xtupled.getInstanceProcesses(version, name));
  });

program
  .command('stopall')
  .action(function () {
    xtupled.stop(xtupled.getAllProcesses());
  });

program
  .command('restart [version] <name>')
  .action(function (version, name) {
    xtupled.restart(xtupled.getInstanceProcesses(version, name));
  });

program
  .command('restartall')
  .action(function () {
    xtupled.restart(xtupled.getAllProcesses());
  });

program
  .command('status [version] <name>')
  .action(function (version, name) {
    forever.list(false, function (err, data) {
      console.dir(data);
    });
  });

program
  .command('statusall')
  .action(function () {
    forever.list(false, function (err, data) {
      console.dir(data);
    });
  });

if (require.main === module) {
  var home = '/usr/local/xtuple';
  process.env.HOME = home;
  process.chdir(process.env.HOME);
  forever.load({
    root: path.resolve(home, '.forever'),
    pidPath: path.resolve(home, '.forever', 'pids')
  });
  program.parse(process.argv);
}
