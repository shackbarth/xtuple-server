/**
 * Install and configure webmin
 */
var webmin = exports;

var lib = require('xtuple-server-lib'),
  _ = require('lodash'),
  path = require('path'),
  mkdirp = require('mkdirp'),
  glob = require('glob'),
  cp = require('cp'),
  ssl = require('xtuple-server-nginx-ssl'),
  site = require('xtuple-server-nginx-site'),
  exec = require('execSync').exec,
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

    if (fs.existsSync(options.sys.etcWebmin)) {
      throw new Error('Webmin seems to already be installed. Please uninstall it and try again');
    }
    if (fs.existsSync('/etc/usermin')) {
      throw new Error('Usermin seems to already be installed. Please uninstall it and try again');
    }
  },

  /** @override */
  beforeTask: function (options) {
    mkdirp.sync(options.sys.webminXtuplePath);
  },

  /** @override */
  executeTask: function (options) {
    var bin = path.resolve(__dirname, 'node_modules/.bin');
    var installWebmin = exec([
      'sudo node ', path.resolve(bin, 'webmin'), 'install',
      '--username xtremote',
      '--password', options.sys.policy.remotePassword,
    ].join(' '));

    var installUsermin = exec([
      'sudo node ', path.resolve(bin, 'usermin'), 'install',
      '--username xtremote',
      '--password', options.sys.policy.remotePassword,
      '--port 10001'
    ].join(' '));

    console.log(installWebmin.stdout);
    console.log(installUsermin.stdout);

    webmin.installCustomCommands(options);
    //webmin.setupPermissions(options);
    webmin.writeConfiguration(options);
    webmin.installUsers(options);
    webmin.installNginxSite(options);
  },

  /** @override */
  afterTask: function (options) {
    exec('service nginx reload');
  },

  setupPermissions: function (options) {
    fs.chmodSync(options.sys.etcWebmin, '775');
    fs.chmodSync(options.sys.webminCustomPath, '775');
    fs.chmodSync(options.sys.webminXtuplePath, '775');
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

    fs.symlinkSync(options.sys.webminCustomPath, path.resolve('/etc/usermin/custom'));
    fs.symlinkSync(options.sys.webminXtuplePath, path.resolve('/etc/usermin/xtuple'));
    if (fs.existsSync('/etc/usermin/miniserv.conf')) {
      fs.unlinkSync('/etc/usermin/miniserv.conf');
    }
    fs.symlinkSync(options.sys.webminMiniservConfigFile, path.resolve('/etc/usermin/miniserv.conf'));

    // replace usermin users file
    cp.sync('/etc/webmin/miniserv.users', '/etc/usermin/miniserv.users');
  },

  installCustomCommands: function (options) {
    mkdirp.sync('/etc/webmin/custom');
    mkdirp.sync('/etc/usermin/custom');
    // copy commands
    _.each(glob.sync(path.resolve(__dirname, '*.cmd')), function (file, i) {
      cp.sync(file, path.resolve(options.sys.webminXtuplePath, (i + 1000) + '.cmd'));
    });

    // copy menus
    _.each(glob.sync(path.resolve(__dirname, '*.menu')), function (file) {
      cp.sync(file, path.resolve(options.sys.webminCustomPath, path.basename(file)));
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
  }

});
