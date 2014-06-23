var planner = require('xtuple-server');

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
      version: process.env.XT_PG_VERSION,
      capacity: 8
    }
  };

  it('should run uninstall', function () {
    planner.compileOptions(options.plan, options);
    planner.verifyOptions(options.plan, options);
    planner.uninstall(options);
  });
});
