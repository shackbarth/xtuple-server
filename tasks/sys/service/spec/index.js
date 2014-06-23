var xtupled = require('../cli'),
  forever = require('forever'),
  assert = require('chai');

exports.afterExecute = function (options) {

  before(function () {
    forever.load(require('/usr/local/xtuple/.forever/config'));
  });

  it('should list the web server as a running process', function (done) {
    forever.list(false, function (err, data) {
      console.dir(data);

      assert.operator(data.length, '>', 0);

      done();
    });
  });

};
