var _ = require('lodash'),
  path = require('path'),
  planner = require('xtuple-server-spec').planner;

describe('install-live', function () {
  this.options = {
    planName: 'install-live',
    requiresRoot: true,
    xt: {
      name: 'xtservtest',
      version: require(path.resolve(process.cwd(), 'node_modules', 'xtuple', 'package')).version,
      demo: true
    },
    pg: {
      version: process.env.XT_PG_VERSION,
      capacity: 8
    }
  };
  planner.describe(this);
});

