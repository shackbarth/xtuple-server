var lib = require('xtuple-server-lib'),
  _ = require('lodash'),
  exec = require('sync-exec'),
  mkdirp = require('mkdirp'),
  cp = require('cp'),
  fs = require('fs'),
  xtupled = require('./cli'),
  path = require('path');

_.extend(exports, lib.task, /** @exports xtuple-server-sys-service */ {

  /** @override */
  beforeInstall: function (options) {
    if (options.planName === 'setup') {
      mkdirp.sync(path.resolve('/usr/local/xtuple/.forever'));
      fs.writeFileSync(
        path.resolve('/usr/local/xtuple/.forever/config.json'),
        JSON.stringify(exports.createForeverConfig(options), null, 2)
      );
    }
    else {
      options.sys.cronfile = path.resolve('/var/spool/cron/crontabs', options.xt.name);
      if (!fs.existsSync(options.sys.cronfile)) {
        fs.openSync(options.sys.cronfile, 'w');
      }
    }
  },

  /** @override */
  beforeTask: function (options) {
    options.sys.initd = path.resolve('/etc/init.d/xtuple');
    options.xt.processdir = path.resolve(options.xt.configdir, 'processes');
    exec('chown -R {xt.name}:{xt.name} {xt.processdir}'.format(options));
    mkdirp.sync(options.xt.processdir);
  },

  /** @override */
  executeTask: function (options) {
    if (options.planName === 'setup') {
      exports.setupServiceManager(options);
    }
    else {
      exports.preparePermissions(options);
      exports.installService(options);
    }
  },

  /** @override */
  afterInstall: function (options) {
    if (/^install/.test(options.planName)) {
      xtupled.start(xtupled.getInstanceProcesses(options.xt.name, options.xt.version));
    }
  },

  /** @override */
  uninstall: function (options) {
    var backup = path.resolve(options.xt.userconfig, 'backup');
    mkdirp.sync(backup);
    if (fs.existsSync(options.xt.configdir) && !fs.existsSync(backup)) {
      fs.renameSync(options.xt.configdir, path.resolve(backup, lib.util.$(options)));
    }
  },

  /**
   * Perform initial setup of the service management system.
   */
  setupServiceManager: function (options) {
    if (fs.existsSync(options.sys.initd)) {
      exec('update-rc.d -f xtuple remove');
    }

    cp.sync(path.resolve(__dirname, 'service.sh'), options.sys.initd);

    // create upstart service 'xtuple'
    exec('update-rc.d xtuple defaults');
  },

  preparePermissions: function (options) {
    // FIXME hackery
    try {
      exec('chown -R '+ options.xt.name + ' ' + options.xt.logdir);
      exec('chmod -R +rwx ' + options.xt.logdir);
      exec('chown -R '+ options.xt.name + ' ' + options.xt.configdir);
      exec('chmod -R u=rx '+ options.xt.configdir + '/ssl');
    }
    catch (e) {
      log.silly('preparePermissions', e);
    }
  },

  /**
   * Install a particular account into the service manager
   */
  installService: function (options) {
    fs.writeFileSync(path.resolve(options.xt.processdir, 'web-server.json'), JSON.stringify({
      uid: 'web-server-' + options.pg.cluster.name,

      // invocation attributes
      command: 'sudo -u '+ options.xt.name + ' ' + options.n.use,
      script: 'node-datasource/main.js',
      options: [
        '-c', options.xt.configfile
      ],
      root: options.xt.homedir,
      pidPath: options.xt.statedir,
      sourceDir: options.xt.coredir,
      cwd: options.xt.coredir,

      // process env vars
      spawnWith: {
        NODE_ENV: 'production',
        NODE_VERSION: options.n.version,
        SUDO_USER: options.xt.name,
        USER: options.xt.name,
        USERNAME: options.xt.name,
        HOME: options.xt.userhome,
        PG_PORT: options.pg.cluster.port
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

  createForeverConfig: function (options) {
    return {
      root: options.xt.homedir,
      pidPath: options.xt.statedir,
      sockPath: options.xt.statedir,
      loglength: 100,
      logstream: false,
      columns: [
        'uid',
        'command',
        'pid',
        'uptime'
      ]
    };
  }
});
