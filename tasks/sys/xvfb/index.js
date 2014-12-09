var lib  = require('xtuple-server-lib'),
    exec = require('child_process').execSync,
    fs   = require('fs'),
    _    = require('lodash'),
    path = require('path');

_.extend(exports, lib.task,
/** @exports xtuple-server-sys-xvfb */
{
  service: 'xt-xvfb',

  /** @override */
  beforeInstall: function (options) {
    if (! options.xvfb ) {
      options.xvfb = {};
    }
    options.xvfb.serviceFile = path.resolve('/etc/init.d', exports.service);
    options.xvfb.processName = 'Xvfb';
    options.xvfb.serviceName = exports.service;
    options.xvfb.display     = ':17'; // TODO: cmd line arg to pass DISPLAY?
  },

  /** @override */
  install: function (options) {
    var serviceFilename = options.xvfb.serviceFile;
    if (! fs.existsSync(serviceFilename)) {
      fs.writeFileSync(serviceFilename,
                       fs.readFileSync(path.resolve(__dirname, 'service.sh'))
                         .toString().format(options).trim());
    }
    exec('chmod +x '    + options.xvfb.serviceFile);
    exec('update-rc.d ' + exports.service + ' defaults 55');
    exec('service '     + exports.service + ' restart ' +
                          (options.xvfb.display || ''));
  },

  afterInstall: function (options) {
    if (!_.isEmpty(options.xvfb.display)) {
      options.report['Reporting'] = {
        'OpenRPT DISPLAY': options.xvfb.display
      };
    }
  },

  /** @override */
  executeTask: function (options) {
    exports.install(options);
  },

  /** @override */
  /* this should be part of unsetup, not uninstall
  uninstall: function (options) {
    exec('service '     + exports.service + ' stop');
    exec('update-rc.d ' + exports.service + ' remove');
  },
  */

});
