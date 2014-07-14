/**
 * Install and configure webmin
 */
var webmin = exports;

var lib = require('xtuple-server-lib'),
  _ = require('lodash'),
  path = require('path'),
  mkdirp = require('mkdirp'),
  rimraf = require('rimraf'),
  glob = require('glob'),
  cp = require('cp'),
  ssl = require('xtuple-server-nginx-ssl'),
  site = require('xtuple-server-nginx-site'),
  exec = require('child_process').execSync,
  fs = require('fs');

_.extend(webmin, lib.task, /** @exports xtuple-server-sys-webmin */ {

  options: {
    webmindomain: {
      optional: '[domain]',
      description: 'The domain name that will point to webmin',
      value: 'localhost'
    },
    webmincrt: {
      optional: '[file]',
      description: 'Path to webmin SSL certificate (.crt)'
    },
    webminkey: {
      optional: '[file]',
      description: 'Path to webmin SSL private key (.key)'
    }
  },

  /** @override */
  beforeInstall: function (options) {
    mkdirp.sync('/srv/ssl');

    options.nginx || (options.nginx = { });

    options.nginx.inkey = options.sys.webminkey;
    options.nginx.incrt = options.sys.webmincrt;
    options.nginx.outkey = path.resolve('/srv/ssl/webmin.key');
    options.nginx.outcrt = path.resolve('/srv/ssl/webmin.crt');
    options.nginx.domain = options.sys.webmindomain;

    options.sys.etcWebmin = '/etc/webmin';
    options.sys.webminConfigFile = path.resolve(options.sys.etcWebmin, 'config');
    options.sys.webminMiniservConfigFile = path.resolve(options.sys.etcWebmin, 'miniserv.conf');
    options.sys.webminCustomPath = path.resolve(options.sys.etcWebmin, 'custom');
    options.sys.webminCustomConfigFile = path.resolve(options.sys.webminCustomPath, 'config');
    options.sys.webminXtuplePath = path.resolve(options.sys.etcWebmin, 'xtuple');

    try {
      exec('killall /usr/bin/perl');
    }
    catch (e) {
      log.info('sys-webmin', 'No previous webmin servers running. This is ok/good.');
    }

    if (fs.existsSync(options.sys.etcWebmin)) {
      log.warn('sys-webmin', 'Webmin seems to already be installed. It is going to be replaced.');

      rimraf.sync('/etc/webmin');
      rimraf.sync('/usr/share/webmin');
      rimraf.sync('/usr/local/webmin');
      rimraf.sync('/etc/nginx/sites-available/webmin-site');
      rimraf.sync('/etc/nginx/sites-enabled/webmin-site');
    }
    if (fs.existsSync('/etc/usermin')) {
      log.warn('sys-webmin', 'Usermin seems to already be installed. It is going to be replaced.');

      rimraf.sync('/etc/usermin');
      rimraf.sync('/usr/share/usermin');
      rimraf.sync('/usr/local/usermin');
    }
  },

  /** @override */
  executeTask: function (options) {
    var bin = path.resolve(__dirname, 'node_modules/.bin');
    try {
      var installWebmin = exec([
        'sudo node', path.resolve(bin, 'webmin'), 'install',
        '--username xtremote',
        '--password', options.sys.policy.remotePassword,
        '--port 10000'
      ].join(' '), { stdio: 'inherit' });

      log.verbose('sys-webmin', installWebmin);
    }
    catch (e) {
      log.warn('sys-webmin', e.message.trim());
    }

    try {
      var installUsermin = exec([
        'sudo node', path.resolve(bin, 'usermin'), 'install',
        '--username xtremote',
        '--password', options.sys.policy.remotePassword,
        '--port 10001'
      ].join(' '), { stdio: 'inherit' });

      log.verbose('sys-webmin', installUsermin);
    }
    catch (e) {
      log.warn('sys-webmin', e.message.trim());
    }

    webmin.installCustomCommands(options);
    webmin.writeConfiguration(options);
    webmin.installUsers(options);
    webmin.installNginxSite(options);
    webmin.removeUnusedModules(options);
    webmin.installService(options);
  },

  /** @override */
  afterTask: function (options) {
    exec('service nginx restart');
  },

  /** @override */
  afterInstall: function (options) {
    if (!_.isEmpty(options.sys.policy.remotePassword)) {
      options.report['Remote Management Access'] = {
        'Webmin URL': '/webmin',
        'Webmin Username': 'xtremote',
        'Webmin Password': options.sys.policy.remotePassword
      };
    }
  },

  writeConfiguration: function (options) {
    fs.appendFileSync(options.sys.webminConfigFile, [
      'referer=1',
      'webprefix=/webmin',
      'webprefixnoredir=1'
    ].join('\n').trim());

    fs.appendFileSync(options.sys.webminMiniservConfigFile, [
      'bind=127.0.0.1',
      'sockets=',
      'ssl_redirect=0'
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

    fs.appendFileSync('/etc/usermin/config', [
      'referer=1',
      'webprefix=/usermin',
      'webprefixnoredir=1'
    ].join('\n'));

    cp.sync('/etc/webmin/miniserv.users', '/etc/usermin/miniserv.users');
    cp.sync('/etc/webmin/miniserv.conf', '/etc/usermin/miniserv.conf');
  },

  installService: function (options) {
    try {
      exec('update-rc.d -f webmin remove');
    }   
    catch (e) {
      log.warn(e);
      //log.verbose('sys-service', 'xtuple service h
    }   

    cp.sync(path.resolve(__dirname, 'service.sh'), '/etc/init.d/webmin');

    try {
      // create upstart service 'xtuple'
      exec('update-rc.d webmin defaults');
      exec('chmod +x /etc/init.d/webmin');
    }   
    catch (e) {
      log.warn(e);
    }   
  },

  installCustomCommands: function (options) {
    mkdirp.sync('/etc/webmin/custom');
    mkdirp.sync(options.sys.webminXtuplePath);

    // copy commands
    _.each(glob.sync(path.resolve(__dirname, '*.cmd')), function (file, i) {
      cp.sync(file, path.resolve(options.sys.webminCustomPath, (i + 1000) + '.cmd'));
    });

    // copy menus
    _.each(glob.sync(path.resolve(__dirname, '*.menu')), function (file) {
      cp.sync(file, path.resolve(options.sys.webminXtuplePath, path.basename(file)));
    });
  },

  installUsers: function (options) {
    // TODO https://github.com/xtuple/xtuple-server/issues/188
  },

  installNginxSite: function (options) {
    if (!fs.existsSync(options.nginx.outcrt)) {
      ssl.generate(options);
    }

    // write site file
    options.nginx.availableSite = path.resolve('/etc/nginx/sites-available/webmin-site');
    options.nginx.enabledSite = path.resolve('/etc/nginx/sites-enabled/webmin-site');
    options.nginx.siteTemplateFile = path.resolve(__dirname, 'webmin-site');
    site.writeSiteConfig(options);
  },

  removeUnusedModules: function (options) {
    var uninstall = [
      'bind8', 'burner', 'pserver', 'exim', 'fetchmail', 'file', 'grub', 'jabber', 'krb5',
      'ldap-client', 'ldap-server', 'ldap-useradmin', 'mysql', 'postfix', 'qmailadmin',
      'iscsi-client', 'iscsi-server', 'iscsi-target', 'ajaxterm', 'adsl-client', 'apache',
      'cpan', 'pap', 'ppp-client', 'pptp-client', 'pptp-server', 'phpini', 'samba', 'frox',
      'spam', 'openslp', 'shorewall', 'shorewall6', 'pserver'
    ];

    _.each(uninstall, function (mod) {
      rimraf.sync(path.resolve('/usr/share/webmin', mod));
    });
  }

});
