describe('xtuple-server-commercial', function () {

  describe('Core', function (done) {
    this.timeout(1800 * 1000); // 30 minutes
    require('xtuple-server/spec');
  });

  describe('sanity', function () {

  });

  describe('plans', function () {
    require('./uninstall-live');
    require('./install-live');
  });

});
