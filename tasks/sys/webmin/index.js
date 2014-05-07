(function () {
  'use strict';

  /**
   * Install and configure webmin
   */
  var webmin = exports;

  var lib = require('../../lib'),
    format = require('string-format'),
    _ = require('lodash'),
    path = require('path'),
    mkdirp = require('mkdirp'),
    exec = require('execSync').exec,
    fs = require('fs');

  _.extend(webmin, lib.task, /** @exports webmin */ {

    /** @override */
    beforeInstall: function (options) {
      options.sys.webminConfigPath = path.resolve('/etc/webmin');
      options.sys.webminCustomPath = path.resolve(options.sys.webminConfigPath, 'custom');
      options.sys.webminXtuplePath = path.resolve(options.sys.webminConfigPath, 'xtuple');
    },

    /** @override */
    beforeTask: function (options) {
      mkdirp(options.nginx.webminXtuplePath);
    },

    /** @override */
    doTask: function (options) {
      var debFile = 'webmin_1.680_all.deb';
      // TODO if debian
      if (!fs.existsSync(path.resolve(debFile))) {
        exec('wget https://s3.amazonaws.com/com.xtuple.deploy-assets/'+ debFile);
      }
      exec('dpkg --install '+ debFile);

      webmin.installCustomCommands(options);
      webmin.installNginxSite(options);
    },

    /** @override */
    afterTask: function (options) {
      exec('service nginx reload');
    },

    installCustomCommands: function (options) {
      fs.writeFileSync(
        path.resolve(options.sys.webminXtuplePath, 'editions.menu'),
        fs.readFileSync(path.resolve(__dirname, 'editions.menu'))
      );
      fs.writeFileSync(
        path.resolve(options.sys.webminCustomPath, '1001.cmd'),
        fs.readFileSync(path.resolve(__dirname, 'server-install-file.cmd'))
      );
      fs.writeFileSync(
        path.resolve(options.sys.webminCustomPath, '1002.cmd'),
        fs.readFileSync(path.resolve(__dirname, 'server-install-upload.cmd'))
      );
    },

    installNginxSite: function (options) {
      options.nginx || (options.nginx = { });
      options.nginx.outkey = path.resolve('/srv/ssl/xtremote.key');
      options.nginx.outcrt = path.resolve('/srv/ssl/xtremote.crt');

      if (!fs.existsSync(options.nginx.outcrt)) {
        require('../nginx/ssl').generate(options);
      }

      // write site file
      options.nginx.availableSite = path.resolve('/etc/nginx/sites-available/webmin-site');
      options.nginx.enabledSite = path.resolve('/etc/nginx/sites-enabled/webmin-site');
      options.nginx.siteTemplateFile = path.resolve(__dirname, 'webmin-site');
      require('../nginx/site').writeSiteConfig(options);
    }
  });

})();

