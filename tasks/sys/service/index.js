var lib = require('xtuple-server-lib'),
  _ = require('lodash'),
  exec = require('child_process').execSync,
  mkdirp = require('mkdirp'),
  rimraf = require('rimraf'),
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
    if (!_.isEmpty(options.xt.configdir)) {
      options.sys.initd = path.resolve('/etc/init.d/xtuple');
      options.xt.processdir = path.resolve(options.xt.configdir, 'processes');
      try {
        mkdirp.sync(options.xt.processdir);
        exec('chown -R {xt.name}:{xt.name} {xt.processdir}'.format(options));
      }
      catch (e) {

      }
    }
  },

  /** @override */
  executeTask: function (options) {
    if (/^setup/.test(options.planName)) {
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
      xtupled.start(xtupled.getInstanceProcesses(options.xt.name, options.xt.version, options.type));
    }
  },

  /** @override */
  uninstall: function (options) {
    xtupled.stop(xtupled.getInstanceProcesses(options.xt.name, options.xt.version, options.type));
    if (fs.existsSync(options.xt.configdir)) {
      rimraf.sync(path.resolve(options.xt.configdir, 'processes'));
    }
  },

  /**
   * Perform initial setup of the service management system.
   */
  setupServiceManager: function (options) {
    try {
      exec('update-rc.d -f xtuple remove');
    }
    catch (e) {
      log.warn(e);
    }

    cp.sync(path.resolve(__dirname, 'service.sh'), '/etc/init.d/xtuple');

    try {
      // create upstart service 'xtuple'
      exec('update-rc.d xtuple defaults');
      exec('chmod +x /etc/init.d/xtuple');
    }
    catch (e) {
      log.warn(e);
    }
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
      max: 30,  // try for 5 minutes
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
