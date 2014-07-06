/* jshint node: true */
'use strict';

var assert = require('assert');

var githubLatest = require('github-latest');
var lib = require('xtuple-server-lib');
var plans = require('../plans');
var planner = require('../');
var specPlanner = require('xtuple-server/spec/planner');
var semver = require('semver');
var pkg = require('../package');
var fs = require('fs');
var path = require('path');
var n = require('n-api');
var proc = require('child_process');
var xtupleVersion = '';

global.log = require('npmlog');

process.on('exit', function () {
  log.info('test', 'Test result details in xtuple-server-test.log');
  fs.appendFileSync('xtuple-server-test.log', JSON.stringify(log.record, null, 2));

  n(process.version);
});

describe('xTuple Server Commercial', function () {

  before(function (done) {
    githubLatest('xtuple', 'xtuple', function (e, tag) {
      xtupleVersion = tag;
      done();
    });
  });

  beforeEach(function () {
    log.heading = 'xtuple-server-test';
    log.level = 'verbose';
  });

  describe('@cli', function () {

    afterEach(function () { log.silly(this.child); });

    it('should be run with node '+ pkg.engines.node, function () {
      assert(semver.satisfies(process.version, pkg.engines.node));
    });
    it('"xtupled" should be installed globally', function () {
      var stdout = proc.execSync('command -v xtupled');
      assert(/xtupled\n$/.test(stdout));
    });

  });

  describe('plans', function () {

    describe('@uninstall-live', function () {
      var planObject = require('../plans')['uninstall-live'];
      var options = {
        planName: 'uninstall-live',
        plan: planObject.plan,
        type: 'live',
        requiresRoot: true,
        xt: {
          name: 'xtservtest',
          version: xtupleVersion
        }
      };

      before(function () {
        planner.compileOptions(options.plan, options);
        planner.verifyOptions(options.plan, options);
      });

      specPlanner.describe({ planObject: planObject, options: options });
    });

    describe('@install-live', function () {
      var planObject = require('../plans')['install-live'];
      var options = {
        planName: 'install-live',
        plan: planObject.plan,
        type: 'live',
        xt: {
          name: 'xtservtest',
          version: xtupleVersion,
          demo: true,
          edition: 'manufacturing'
        }
      };

      before(function () {
        planner.compileOptions(options.plan, options);
        planner.verifyOptions(options.plan, options);
      });

      specPlanner.describe({ planObject: planObject, options: options });
    });

    describe.skip('@setup', function () {
      var planObject = require('../plans').setup;
      var options = {
        planName: 'setup',
        plan: planObject.plan,
      };

      before(function () {
        planner.compileOptions(options.plan, options);
        planner.verifyOptions(options.plan, options);
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
          name: 'xtservtest',
          version: xtupleVersion
        },
        pg: {
          dbname: 'demo_live'
        }
      };

      before(function () {


        options.pg.infile = lib.util.getSnapshotPath(options, true);
        planner.compileOptions(options.plan, options);
        planner.verifyOptions(options.plan, options);
      });

      specPlanner.describe({ planObject: planObject, options: options });
    });

  });
});
