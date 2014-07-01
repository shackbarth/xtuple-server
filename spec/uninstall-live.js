var planner = require('xtuple-server'),
  assert = require('chai').assert;

describe('uninstall-live', function () {
  var planObject = require('../plans')['uninstall-live'];
  var options = {
    planName: 'uninstall-live',
    plan: planObject.plan,
    type: 'live',
    requiresRoot: true,
    xt: {
      name: 'xtservtest',
      version: process.env.XT_VERSION
    },
    pg: {
      version: '9.3',
      capacity: 8
    }
  };

  it('should run uninstall', function () {
    this.timeout(30000);
    planner.compileOptions(options.plan, options);
    planner.verifyOptions(options.plan, options);
    planner.execute(options.plan, options);
  });
});
