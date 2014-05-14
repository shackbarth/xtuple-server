var assert = require('chai').assert,
  _ = require('lodash'),
  fs = require('fs'),
  exec = require('execSync').exec,
  options = global.options;

it('should write valid sudoers files', function () {
  assert(exec('visudo -c').code === 0);
});

it('should write htpasswd file if not yet created', function () {
  assert(fs.existsSync(options.sys.htpasswdfile), 'htpasswd file was not written');
});

it('should create user account', function () {
  assert.equal(exec('id '+ options.xt.name).code, 0);
});

