var fs = require('fs'),
  path = require('path'),
  assert = require('assert');

exports.afterExecute = function (options) {

  describe('crontab', function () {

    it('should contain cron entry in crontab file', function () {
      var content = fs.readFileSync(path.resolve('/var/spool/cron/crontabs', options.xt.name)).toString();
      console.log(content);
    });

  });
};
