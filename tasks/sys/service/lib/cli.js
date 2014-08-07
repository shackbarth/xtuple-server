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
  xtupled = require('./xtupled'),
  config,
  table;

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
      xtupled.list(function (list) {
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
