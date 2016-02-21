var pg       = require('pg'),
    Registry = require('./registry');

function TDB(opts, l4j) {
  var log = l4j.getLogger('tdb');
  log.info("database started");

  var db = null;

  function connectDB() {
    var conString = opts.uri + "/" + opts.db + '?ssl=true';
    db            = new pg.Client(conString);

    db.on('error', function (error) {
      log.error(error);

      // Wait 5 seconds and reconnect
      setTimeout(connectDB, 5 * 1000);
    });
    db.on('notice', function (msg) {
      log.info(msg);
    });

    log.info('connecting to db: ' + opts.db);
    db.connect();
  }

  connectDB();

  this.reg  = new Registry(db, log);
}

module.exports = TDB;

