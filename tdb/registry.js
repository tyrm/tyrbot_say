var async = require("async");

function Registry(db, log) {
  log.info("registry started");

  // Common Queries
  var getQuery = "SELECT reg_paths.path, reg_paths.type, reg_values.value \
                   FROM reg_paths \
                   LEFT JOIN ( SELECT v1.* \
                                 FROM reg_values as v1 \
                                 LEFT JOIN reg_values AS v2 \
                                 ON v1.path_id = v2.path_id AND v1.timestamp < v2.timestamp \
                                 WHERE v2.path_id IS NULL ) as reg_values \
                   ON reg_paths.id=reg_values.path_id \
                   WHERE reg_paths.path LIKE $1;";

  this.get = function (path, cb) {
    db.query(getQuery, [path.toString() + '%'], function (err, result) {
      if (err) log.error(err);

      if (result.rowCount == 1) {
        // Return Single Item
        parseResponse(result.rows[0].type, result.rows[0].value, cb)
      } else if (result.rowCount > 1) {
        // Return Object
        async.reduce(result.rows, {},
          function (memo, item, cb2) {
            parseResponse(item.type, item.value, function (err, res) {
              var p   = item.path.replace(path + '/', '');
              memo[p] = res;
              cb2(null, memo);
            })
          }, cb);
      } else {
        // Return Error
        cb(404, null)
      }
    });

    function parseResponse(t, v, cb) {
      var res;

      switch (t) {
        case 'boolean':
          if (v == 'true') {
            res = true;
          } else {
            res = false;
          }
          break;
        case 'float':
          res = parseFloat(v);
          break;
        case 'integer':
          res = parseInt(v);
          break;
        case 'string':
          res = v.toString();
          break;
        default:
          res = v;
      }

      cb(null, res)
    }
  };

  this.set = function (path, value) {
  };
}

module.exports = Registry;

