var lib = require('xtuple-server-lib'),
  fs = require('fs'),
  os = require('os'),
  cron = require('cron-parser'),
  crontab = require('node-crontab'),
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

  },

  /** @override */
  afterTask: function (options) {
    exec('service xtuple {xt.version} {xt.name} restart'.format(options));
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
