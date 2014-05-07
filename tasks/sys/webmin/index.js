(function () {
  'use strict';

  /**
   * Install and configure webmin
   */
  var webmin = exports;

  var lib = require('../../../lib'),
    format = require('string-format'),
    _ = require('lodash'),
    path = require('path'),
    mkdirp = require('mkdirp'),
    rimraf = require('rimraf'),
    exec = require('execSync').exec,
    fs = require('fs');

  _.extend(webmin, lib.task, /** @exports webmin */ {

    /** @override */
    beforeInstall: function (options) {
      mkdirp.sync('/srv/ssl');

      options.nginx.outkey = path.resolve('/srv/ssl/xtremote.key');
      options.nginx.outcrt = path.resolve('/srv/ssl/xtremote.crt');
      options.nginx.domain = 'localhost';

      options.sys.etcWebmin = path.resolve('/etc/webmin');
      options.sys.webminConfigFile = path.resolve(options.sys.etcWebmin, 'config');
      options.sys.webminCustomPath = path.resolve(options.sys.etcWebmin, 'custom');
      options.sys.webminCustomConfigFile = path.resolve(options.sys.webminCustomPath, 'config');
      options.sys.webminXtuplePath = path.resolve(options.sys.etcWebmin, 'xtuple');

      //options.pg.version = process.env.XT_PG_VERSION || '9.3';
    },

    /** @override */
    beforeTask: function (options) {
      mkdirp.sync(options.sys.webminXtuplePath);
    },

    /** @override */
    executeTask: function (options) {
      var debFile = 'webmin_1.680_all.deb';
      // TODO if debian
      if (!fs.existsSync(path.resolve(debFile))) {
        exec('wget https://s3.amazonaws.com/com.xtuple.deploy-assets/'+ debFile);
      }
      exec('dpkg --install '+ debFile);
      exec('npm install ansi2html -g');

      webmin.deleteUnusedModules(options);
      webmin.writeConfiguration(options);
      webmin.installCustomCommands(options);
      webmin.installNginxSite(options);
    },

    /** @override */
    afterTask: function (options) {
      exec('service nginx reload');
      exec('service webmin restart');
    },

    /** @override */
    uninstall: function (options) {
      fs.unlinkSync(path.resolve(options.sys.webminXtuplePath, 'editions.menu'));
      fs.unlinkSync(path.resolve(options.sys.webminCustomPath, '1001.cmd'));
      fs.unlinkSync(path.resolve(options.sys.webminCustomPath, '1001.html'));
    },

    writeConfiguration: function (options) {
      fs.appendFileSync(options.sys.webminConfigFile, [
        'webprefix=/_manage',
        'webprefixnoredir=1',
        'referer=1'
      ].join('\n').trim());

      fs.writeFileSync(options.sys.webminCustomConfigFile, [
        'display_mode=1',
        'columns=1',
        'params_cmd=0',
        'params_file=0',
        'sort=desc',
        'height=',
        'width=',
        'wrap='
      ].join('\n').trim());
    },

    installCustomCommands: function (options) {
      options.xt.version = require('../../../package').version;

      fs.writeFileSync(
        path.resolve(options.sys.webminXtuplePath, 'editions.menu'),
        fs.readFileSync(path.resolve(__dirname, 'editions.menu'))
      );

      fs.writeFileSync(
        path.resolve(options.sys.webminCustomPath, '1001.cmd'),
        fs.readFileSync(path.resolve(__dirname, 'server-install.cmd')).toString().format(options)
      );
      fs.writeFileSync(
        path.resolve(options.sys.webminCustomPath, '1001.html'),
        fs.readFileSync(path.resolve(__dirname, 'server-install.html')).toString().format(options)
      );

      fs.writeFileSync(
        path.resolve(options.sys.webminCustomPath, '1002.cmd'),
        fs.readFileSync(path.resolve(__dirname, 'service-restart.cmd')).toString().format(options)
      );
      fs.writeFileSync(
        path.resolve(options.sys.webminCustomPath, '1002.html'),
        fs.readFileSync(path.resolve(__dirname, 'service-restart.html')).toString().format(options)
      );

      fs.writeFileSync(
        path.resolve(options.sys.webminCustomPath, '1003.cmd'),
        fs.readFileSync(path.resolve(__dirname, 'service-status.cmd')).toString().format(options)
      );
      fs.writeFileSync(
        path.resolve(options.sys.webminCustomPath, '1003.html'),
        fs.readFileSync(path.resolve(__dirname, 'service-status.html')).toString().format(options)
      );
    },

    installNginxSite: function (options) {
      if (!fs.existsSync(options.nginx.outcrt)) {
        require('../../nginx').ssl.generate(options);
      }

      // write site file
      options.nginx.availableSite = path.resolve('/etc/nginx/sites-available/webmin-site');
      options.nginx.enabledSite = path.resolve('/etc/nginx/sites-enabled/webmin-site');
      options.nginx.siteTemplateFile = path.resolve(__dirname, 'webmin-site');
      require('../../nginx').site.writeSiteConfig(options);
    },

    deleteUnusedModules: function (options) {
      var mod = '/usr/share/webmin';

      rimraf.sync(path.resolve(mod, 'bind8'));
      rimraf.sync(path.resolve(mod, 'burner'));
      rimraf.sync(path.resolve(mod, 'pserver'));
      rimraf.sync(path.resolve(mod, 'exim'));
      rimraf.sync(path.resolve(mod, 'fetchmail'));
      rimraf.sync(path.resolve(mod, 'file'));
      rimraf.sync(path.resolve(mod, 'grub'));
      rimraf.sync(path.resolve(mod, 'jabber'));
      rimraf.sync(path.resolve(mod, 'krb5'));
      rimraf.sync(path.resolve(mod, 'ldap-client'));
      rimraf.sync(path.resolve(mod, 'ldap-server'));
      rimraf.sync(path.resolve(mod, 'ldap-useradmin'));
      rimraf.sync(path.resolve(mod, 'mysql'));
      rimraf.sync(path.resolve(mod, 'postfix'));
      rimraf.sync(path.resolve(mod, 'qmailadmin'));
      rimraf.sync(path.resolve(mod, 'iscsi-client'));
      rimraf.sync(path.resolve(mod, 'iscsi-server'));
      rimraf.sync(path.resolve(mod, 'iscsi-target'));
      rimraf.sync(path.resolve(mod, 'ajaxterm'));
      rimraf.sync(path.resolve(mod, 'adsl-client'));
      rimraf.sync(path.resolve(mod, 'apache'));
      rimraf.sync(path.resolve(mod, 'htaccess-htpasswd'));
      rimraf.sync(path.resolve(mod, 'cpan'));
      rimraf.sync(path.resolve(mod, 'pap'));
      rimraf.sync(path.resolve(mod, 'ppp-client'));
    }
  });
})();

