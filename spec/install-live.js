var _ = require('lodash'),
  path = require('path'),
  planner = require('xtuple-server'),
  spec = require('xtuple-server/spec/planner');

describe('install-live', function () {
  this.planObject = require('../plans')['install-live'];
  this.options = {
    planName: 'install-live',
    plan: this.planObject.plan,
    type: 'live',
    requiresRoot: true,
    xt: {
      name: 'xtservtest',
      version: process.env.XT_VERSION,
      demo: true
    },
    pg: {
      version: '9.3',
      capacity: 8
    }
  };
  planner.compileOptions(this.options.plan, this.options);
  planner.verifyOptions(this.options.plan, this.options);

  spec.describe(this);
});
