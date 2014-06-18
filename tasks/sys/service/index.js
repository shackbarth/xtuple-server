var lib = require('xtuple-server-lib'),
  format = require('string-format'),
  _ = require('lodash'),
  exec = require('execSync').exec,
  forever = require('forever-monitor'),
  fs = require('fs'),
  path = require('path');

/**
 * Create a process manager service
 */
_.extend(exports, lib.task, /** @exports service */ {

  /** @override */
  beforeInstall: function (options) {
    options.sys.initd = path.resolve('/etc/init.d/xtuple');
  },

  /** @override */
  beforeTask: function (options) {
    if (fs.existsSync(path.resolve(options.sys.sbindir, 'main.js'))) {
      fs.unlinkSync(path.resolve(options.sys.sbindir, 'main.js'));
    }
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
  uninstall: function (options) {
    fs.unlinkSync(path.resolve(options.sys.sbindir, 'main.js'));
    /*
    exec('sudo -Ei HOME={xt.userhome} xtupled delete {sys.pm2.configfile}'.format(options));
    exec('sudo -Ei HOME={xt.userhome} xtupled dump'.format(options));
    */
  },

  /**
   * Perform initial setup of the service management system.
   */
  setupServiceManager: function (options) {
    if (fs.existsSync(options.sys.initd)) {
      exec('update-rc.d -f xtuple remove');
    }
    /*
    exec('chmod a+x {xt.userhome}'.format(options));
    exec('chmod a+x {xt.userhome}/{xt.version}'.format(options));
    exec('chmod a+x {xt.usersrc}'.format(options));
    exec('chmod a+x {xt.usersrc}/node-datasource'.format(options));


    // create upstart service "xtuple"
    exec('cp {sys.pm2.initscript} {sys.initd}'.format(options));
    exec('update-rc.d xtuple defaults');
    exec('sudo -Ei HOME={xt.userhome} xtupled kill'.format(options));
    */
  },

  /**
   * Install a particular account into the service manager
   */
  installService: function (options) {
    fs.symlinkSync(
      path.resolve(options.xt.usersrc, 'node-datasource/main.js'),
      path.resolve(options.sys.sbindir, 'main.js')
    );

    forever.start('main.js', {
      uid: 'web-server-' + options.pg.cluster.name,

      // invocation attributes
      options: [
        '-c', options.xt.configfile
      ],
      sourceDir: options.sys.sbindir,
      pidFile: path.resolve(options.xt.rundir, 'web-server.pid'),
      cwd: options.xt.usersrc,

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
      watchDirectory: options.xt.configfile,

      // log files
      logFile: path.resolve(options.xt.logdir, 'web-server-forever.log'),
      errFile: path.resolve(options.xt.logdir, 'web-server-error.log'),
      outFile: path.resolve(options.xt.logdir, 'web-server-access.log'),
    });
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
