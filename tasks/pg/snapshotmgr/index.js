var lib = require('xtuple-server-lib'),
  log = require('npmlog'),
  fs = require('fs'),
  os = require('os'),
  crontab = require('cron-tab'),
  mkdirp = require('mkdirp'),
  exec = require('sync-exec'),
  path = require('path'),
  _ = require('lodash');

/**
 * Schedule backups of a postgres cluster.
 */
var task = _.extend(exports, lib.task, /** @exports xtuple-server-pg-snapshotmgr */ {
  name: 'pg-snapshotmgr',
  options: {
    snapenable: {
      optional: '[boolean]',
      description: 'Enable the snapshot manager',
      value: false
    },
    snapschedule: {
      optional: '[cron]',
      description: 'crontab entry for snapshot schedule [daily at 2am]',
      value: '0 2 * * *',
      validate: function (value, options) {
        if (!_.isEmpty(value)) {
          var tab = crontab.load.sync();
          var job = tab.create('ls', value);

          if (!job.isValid()) {
            throw new TypeError('cannot parse cron expression: '+ value);
          }
        }

        return value;
      }
    },
    snapcount: {
      optional: '[integer]',
      description: 'The number of backup snapshots to retain',
      value: 7
    }
  },

  /** @override */
  beforeInstall: function (options) {
    mkdirp.sync(options.pg.snapshotdir);
    exec(('chown {xt.name}:{xt.name} '+ options.pg.snapshotdir).format(options));
  },

  /** @override */
  executeTask: function (options) {
    if (options.pg.snapenable) {
      exports.installService(options);
    }
  },

  installService: function (options) {
    var dbs = require(options.xt.configfile).datasource.databases;
    log.verbose(task.name, dbs);
    _.each(dbs, function (db) {
      lib.util.createJob('backup-database', options.type, options.pg.snapschedule, [
        '--xt-name',    options.xt.name,
        '--xt-version', options.xt.version,
        '--pg-dbname',  db
      ], options);
    });
  },

  /**
   * Rotate local snapshots; This function will either delete old snapshots
   * or do nothing.
   *
   * @public
   */
  rotateSnapshot: function (options) {
    var maxlen = options.pg.snapcount,
      name = options.xt.name,
      version = options.xt.version,
      ls = fs.readdirSync(options.pg.snapshotdir),
      db_groups = _.groupBy(
        _.map(ls, function (file) {
          return exports.parseFilename(file);
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
