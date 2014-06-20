#! /usr/bin/env node

var exec = require('execSync').exec,
  _ = require('lodash'),
  program = require('commander'),
  forever = require('forever');
  path = require('path'),
  glob = require('glob'),
  fs = require('fs');

function getInstanceProcesses (version, name) {
  return _.map(glob.sync('/etc/xtuple' + version + '/' + name + '/processes/*'), function (file) {
    return require(file);
  });
}

function getAccountProcesses (name) {
  return _.map(glob.sync('/etc/xtuple/*/' + name + '/processes/*'), function (file) {
    return require(file);
  });
}

function getAllProcesses () {
  return _.map(glob.sync('/etc/xtuple/*/*/processes/*'), function (file) {
    return require(file);
  });
}

function start (descriptors) {
  _.each(descriptors, function (descriptor) {
    forever.startDaemon(descriptor.script, descriptor);
  });
}

function stop (descriptors) {
  _.each(getAllProcesses(), function (descriptor) {
    forever.stop(descriptor.uid);
  });
}

function restart (descriptors) {
  _.each(descriptors, function (descriptor) {
    forever.stop(descriptor.uid);
    forever.startDaemon(descriptor.script, descriptor);
  });
}

program
  .command('start [version] <name>')
  .action(function (version, name) {
    start(getInstanceProcesses(version, name));
  });

program
  .command('startall')
  .action(function () {
    start(getAllProcesses());
  });

program
  .command('stop [version] <name>')
  .action(function (version, name) {
    stop(getInstanceProcesses(version, name));
  });

program
  .command('stopall')
  .action(function () {
    stop(getAllProcesses());
  });

program
  .command('restart [version] <name>')
  .action(function (version, name) {
    restart(getInstanceProcesses(version, name));
  });

program
  .command('restartall')
  .action(function () {
    restart(getAllProcesses());
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

forever.load(require('/usr/local/xtuple/.forever/config'));
program.parse(process.argv);
