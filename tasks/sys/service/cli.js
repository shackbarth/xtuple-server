#! /usr/bin/env node

var _ = require('lodash'),
  program = require('commander'),
  forever = require('forever'),
  glob = require('glob'),
  lib = require('xtuple-server-lib'),
  path = require('path'),
  fs = require('fs');

var config = require(path.resolve(process.env.HOME, '.forever/config'),
  table = new Table({
    // uid, command, pid, uptime
    head: config.columns,
    colWidths: [ 8, 32, 8, 8 ]
  });

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

program
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
  });

program
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
  });

program
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
  });

program
  .command('status [name] [version]')
  .action(function (name, version) {
    forever.list(false, function (err, data) {
      table.push(data);
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
