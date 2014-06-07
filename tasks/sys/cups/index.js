var lib = require('xtuple-server-lib'),
  _ = require('lodash'),
  path = require('path'),
  exec = require('execSync').exec,
  fs = require('fs');

/**
 * Configure the cups server needed for automated printing
 */
_.extend(exports, lib.task, /** @exports xtuple-server-sys-cups */ {

  conf_path: path.resolve('/etc/cups/cupsd.conf'),

  /** @override */
  executeTask: function (options) {
    var cups_conf = fs.readFileSync(cups.conf_path).toString(),
      new_conf = cups_conf.replace(/^Browsing Off/g, 'Browsing On');

    // write backup
    fs.writeFileSync(exports.conf_path + '.bak', cups_conf);

    // write new conf file
    fs.writeFileSync(exports.conf_path, new_conf);

    // TODO autodetect with lpstat -v
    // TODO write selection to config.js

    exec('service cups restart');
  }
});
