var lib = require('xtuple-server-lib'),
  _ = require('lodash'),
  exec = require('execSync').exec,
  mkdirp = require('mkdirp'),
  cp = require('cp'),
  forever = require('forever'),
  fs = require('fs'),
  path = require('path');

_.extend(exports, lib.task, /** @exports xtuple-server-sys-service */ {

  /** @override */
  beforeInstall: function (options) {
    options.sys.initd = path.resolve('/etc/init.d/xtuple');
    options.xt.processdir = path.resolve(options.xt.configdir, 'processes');
    mkdirp.sync(options.xt.processdir);
  },

  /** @override */
  executeTask: function (options) {
    if (options.planName === 'setup') {
      exports.setupServiceManager(options);
    }
    else {
      exports.installService(options);
    }
  },

  /** @override */
  afterInstall: function (options) {
    var server = 'node-datasource/main.js';
    forever.startDaemon(server, require(path.resolve(options.xt.processdir, 'web-server')));
  },

  /** @override */
  uninstall: function (options) {
    forever.cleanUp();
  },

  /**
   * Perform initial setup of the service management system.
   */
  setupServiceManager: function (options) {
    if (fs.existsSync(options.sys.initd)) {
      exec('update-rc.d -f xtuple remove');
    }

    mkdirp.sync(path.resolve(options.xt.homedir, '.forever'));
    fs.writeFileSync(
      path.resolve(options.xt.homedir, '.forever', 'config.json'),
      JSON.stringify(exports.createForeverConfig(options), null, 2)
    );

    cp.sync(path.resolve(__dirname, 'service.sh'), options.sys.initd);

    // create upstart service 'xtuple'
    exec('update-rc.d xtuple defaults');
  },

  /**
   * Install a particular account into the service manager
   */
  installService: function (options) {
    /*
    fs.symlinkSync(
      path.resolve(options.xt.usersrc, 'node-datasource/main.js'),
      path.resolve(options.sys.sbindir, 'main.js')
    );
    */

    fs.writeFileSync(path.resolve(options.xt.processdir, 'web-server.json'), JSON.stringify({
      uid: 'web-server-' + options.pg.cluster.name,

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
      pidFile: path.resolve(options.xt.rundir, 'web-server.pid'),

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
      outFile: path.resolve(options.xt.logdir, 'web-server-access.log'),
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
    /*
    // link the executable
    fs.symlinkSync(
      path.resolve(options.xt.usersrc, 'node-datasource/main.js'),
      path.resolve(options.sys.sbindir, 'main.js')
    );

    // write service config files
    fs.writeFileSync(options.sys.pm2.configfile, options.sys.pm2.template.format(options));

    var start = exec('sudo -Ei HOME={xt.userhome} xtupled start {sys.pm2.configfile}'.format(options));

    if (start.code !== 0) {
      throw new Error(JSON.stringify(start));
    }

    exec('sudo -Ei HOME={xt.userhome} xtupled dump'.format(options));
    exec('service xtuple {xt.version} {xt.name} restart'.format(options));
  }
  */
});
