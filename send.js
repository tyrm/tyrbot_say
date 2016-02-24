#!/usr/bin/node

var config = require('./config');

var amqp = require('amqplib/callback_api');

var message = process.argv.slice(2).join([separator = ' ']);
console.log('\'' + message + '\'');

if (message == '') {
  message = 'Good evening Tyr.';
}

amqp.connect(config.amqp, function (err, conn) {
  conn.createChannel(function (err, ch) {
    var q = 'say';

    var sayObj = {
      say: message
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
