var x = describe('(v'+ require('../package').version + ') xtuple-server-commercial', function () {
  describe('sanity', function () {

  });
  describe('plans', function () {
    require('./uninstall-live');
    require('./install-live');
  });
});
