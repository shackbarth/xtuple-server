/* jshint node: true */
'use strict';

var assert = require('assert');

var githubLatest = require('github-latest');
var lib = require('xtuple-server-lib');
var plans = require('../plans');
var planner = require('xtuple-server-core');
var specPlanner = require('xtuple-server-core/spec/planner');
var semver = require('semver');
var pkg = require('../package');
var fs = require('fs');
var path = require('path');
var n = require('n-api');
var proc = require('child_process');
var logfile = require('npmlog-file');
var xtupleVersion = '';

global.log = require('npmlog');
log.heading = 'xtuple-server-test';

process.on('exit', function () {
  log.info('test', 'Test result details in xtuple-server-test.log');
  logfile.write(log, 'xtuple-server-test.log');

  n(process.version);
});

describe('xTuple Server Commercial', function () {

  before(function (done) {
    githubLatest('xtuple', 'xtuple', function (e, tag) {
      if (e) assert.fail('could not determine xtuple version');

      //xtupleVersion = tag.replace(/^v/, '');
      xtupleVersion = '4.7.0';
      log.info('xtuple', 'using version', xtupleVersion);
      done();
    });
  });

  beforeEach(function () {
    log.heading = 'xtuple-server-test';
    log.level = 'verbose';
  });

  it('node version range must equal that of xtuple-server core edition', function () {
    assert.equal(require('xtuple-server-core/package').engines.node, pkg.engines.node);
  });

  describe('@cli', function () {
    this.timeout(600 * 10000); // 10 minutes

    afterEach(function () { log.silly(this.child); });

    it('should be run with node '+ pkg.engines.node, function () {
      assert(semver.satisfies(process.version, pkg.engines.node));
    });
    it('"xtupled" should be installed globally', function () {
      var stdout = proc.execSync('command -v xtupled');
      assert(/xtupled\n$/.test(stdout));
    });

    it('@uninstall-live', function () {
      this.child = proc.execSync(
        'xtuple-server uninstall-live --xt-name xtservtest --xt-version '+ xtupleVersion + ' --verbose'
      );
    });

  });

  describe('plans', function () {

    describe('@install-live', function () {
      // skipping because this test is failing in a way that suggests
      // our auth with github in the secure yml variable isn't working
      // TODO: get it to work and unskip this test
      describe.skip('@manufacturing edition', function () {
        var planObject = require('../plans')['install-live'];
        var options = {
          planName: 'install-live',
          plan: planObject.plan,
          type: 'live',
          xt: {
            name: 'xtmochamfg',
            demo: true,
            edition: 'manufacturing',
            ghuser: process.env.GITHUB_USERNAME,
            ghpass: process.env.GITHUB_PASSWORD
          }
        };

        before(function () {
          options.xt.version = xtupleVersion;
        });

        specPlanner.describe({ planObject: planObject, options: options });
      });
      describe('@postbooks edition', function () {
        var planObject = require('../plans')['install-live'];
        var options = {
          planName: 'install-live',
          plan: planObject.plan,
          type: 'live',
          xt: {
            name: 'xtmochapostbooks',
            demo: true,
            edition: 'core'
          }
        };

        before(function () {
          options.xt.version = xtupleVersion;
        });

        specPlanner.describe({ planObject: planObject, options: options });
      });
    });

    describe.skip('@setup', function () {
      var planObject = require('../plans').setup;
      var options = {
        planName: 'setup',
        plan: planObject.plan,
      };

      before(function () {
        options.xt.version = xtupleVersion;
      });

      specPlanner.describe({ planObject: planObject, options: options });
    });

    describe.skip('@import-users', function () {
      var planObject = require('../plans')['import-users'];
      var options = {
        planName: 'import-users',
        plan: planObject.plan,
        type: 'live',
        xt: {
          name: 'xtservtest'
        },
        pg: {
          dbname: 'demo_live'
        }
      };

      before(function () {
        options.xt.version = xtupleVersion;
        options.pg.infile = lib.util.getSnapshotPath(options, true);
      });

      specPlanner.describe({ planObject: planObject, options: options });
    });

  });
});
