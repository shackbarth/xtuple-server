#! /usr/bin/env node

var _ = require('lodash'),
  program = require('commander'),
  forever = require('forever');
  glob = require('glob'),
  fs = require('fs');

var xtupled = module.exports = {

  start: function (descriptors) {
    _.each(descriptors, function (descriptor) {
      //console.log('starting: '+ descriptor.script);
      //console.log('starting: '+ descriptor.command);
      forever.startDaemon(descriptor.script, descriptor);
      //console.dir(descriptor);
    });
  },

  stop: function (descriptors) {
    _.each(descriptors, function (descriptor) {
      forever.stop(descriptor.uid);
    });
  },

  restart: function (descriptors) {
    _.each(descriptors, function (descriptor) {
      forever.stop(descriptor.uid);
      forever.startDaemon(descriptor.script, descriptor);
    });
  },

  getInstanceProcesses: function (version, name) {
    return _.map(glob.sync('/etc/xtuple' + version + '/' + name + '/processes/*'), function (file) {
      return require(file);
    });
  },

  getAccountProcesses: function (name) {
    return _.map(glob.sync('/etc/xtuple/*/' + name + '/processes/*'), function (file) {
      return require(file);
    });
  },

  getAllProcesses: function () {
    return _.map(glob.sync('/etc/xtuple/*/*/processes/*'), function (file) {
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
  console.log('loading config');
  forever.load(require('/usr/local/xtuple/.forever/config'));
  program.parse(process.argv);
}
