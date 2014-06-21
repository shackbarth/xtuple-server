var lib = require('xtuple-server-lib'),
  fs = require('fs'),
  os = require('os'),
  cron = require('cron-parser'),
  crontab = require('crontab'),
  mkdirp = require('mkdirp'),
  forever = require('forever-monitor'),
  exec = require('execSync').exec,
  path = require('path'),
  _ = require('lodash');

/**
 * Schedule backups of a postgres cluster.
 */
_.extend(exports, lib.task, /** @exports xtuple-server-pg-snapshotmgr */ {

  options: {
    enablesnapshots: {
      optional: '[boolean]',
      description: 'Enable the snapshot manager',
      value: false
    },
    snapschedule: {
      optional: '[cron]',
      description: 'crontab entry for snapshot schedule [0 0 * * *] (daily)',
      value: '0 0 * * *'
    },
    snapshotcount: {
      optional: '[integer]',
      description: 'The number of backup snapshots to retain',
      value: 7
    }
  },

  /** @override */
  beforeInstall: function (options) {
    cron.parseExpressionSync(options.pg.snapschedule);
    mkdirp.sync(options.pg.snapshotdir);
    exec(('chown {xt.name}:{xt.name} '+ options.pg.snapshotdir).format(options));
  },

  /** @override */
  executeTask: function (options) {
    if (!options.pg.enablesnapshots) { return; }

    exports.installService(options);

  },

  /** @override */
  afterTask: function (options) {
    exec('service xtuple {xt.version} {xt.name} restart'.format(options));
  },

  installService: function (options) {
    fs.writeFileSync(path.resolve(options.xt.processdir, 'auto-backup.json'), JSON.stringify({
      uid: 'auto-backup-' + options.pg.cluster.name,

      // invocation attributes
      command: 'sudo -u '+ options.xt.name + ' node',
      script: 'node-datasource/main.js',
      options: [
        '-c', options.xt.configfile
      ],  
      root: options.xt.homedir,
      pidPath: options.xt.statedir,
      sourceDir: options.xt.usersrc,
      cwd: options.xt.usersrc,
      pidFile: path.resolve(options.xt.rundir, 'auto-snapshot.pid'),

      // process env
      env: {
        SUDO_USER: options.xt.name,
        USER: options.xt.name,
        NODE_ENV: 'production',
        HOME: options.xt.userhome
      },  

      // process mgmt options
      minUptime: 10000,
      spinSleepTime: 10000,
      killTree: true,
      max: 100,
      watch: true,
      watchIgnoreDotFiles: true,
      watchDirectory: options.xt.configdir,

      // log files
      logFile: path.resolve(options.xt.logdir, 'web-server-forever.log'),
      errFile: path.resolve(options.xt.logdir, 'web-server-error.log'),
      outFile: path.resolve(options.xt.logdir, 'web-server-access.log')
    }, null, 2));
  },

  /**
   * Rotate local snapshots; This function will either delete old snapshots
   * or do nothing.
   *
   * @public
   */
  rotateSnapshot: function (options) {
    var maxlen = options.pg.snapshotcount,
      name = options.xt.name,
      version = options.xt.version,
      ls = fs.readdirSync(options.pg.snapshotdir),
      db_groups = _.groupBy(
        _.map(ls, function (file) {
          return snapshotmgr.parseFilename(file);
        }),
        'dbname'
      ),
      expired = _.flatten(_.map(db_groups, function (snapshots, name) {
        return _.first(_.sortBy(snapshots, 'ts'), (snapshots.length - maxlen));
      }));

    return _.map(expired, function (file) {
      fs.unlinkSync(path.resolve(options.pg.snapshotdir, file.original));
      return file;
    });
  }
});
