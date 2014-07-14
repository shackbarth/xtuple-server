var fs = require('fs'),
  path = require('path'),
  proc = require('child_process'),
  assert = require('assert');

exports.beforeExecute = function (options) {
  options.pg || (options.pg = { });
  options.pg.snapenable = true;
};

exports.afterExecute = function (options) {

  describe('crontab', function () {

    it('should contain cron entry in crontab file', function () {
      //var content = fs.readFileSync(path.resolve('/var/spool/cron/crontabs', options.xt.name)).toString();
      var content = proc.execSync('sudo -u '+ options.xt.name + ' crontab -l').toString().trim();

      console.log(content);
      assert(/sudo xtuple\-server backup\-database/.test(content));
      assert(/^0 2 \* \* \*/.test(content));
    });

  });
};
