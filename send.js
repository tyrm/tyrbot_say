var config = require('./config');

var amqp = require('amqplib/callback_api');

amqp.connect(config.amqp, function (err, conn) {
  conn.createChannel(function (err, ch) {
    var q = 'say';

    var sayObj = {
      say: 'Good evening Tyr.'
    };

    ch.assertQueue(q, {durable: false});
    ch.sendToQueue(q, new Buffer(JSON.stringify(sayObj)));
    console.log(" [x] Sent 'Hello World!'");
  });
  setTimeout(function () {
    conn.close();
    process.exit(0)
  }, 500);
});
