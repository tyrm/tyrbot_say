// Load Config
var config = require('./config');

// Load Modules
var amqp   = require('amqplib/callback_api'),
    fs     = require('fs'),
    Ivona  = require('ivona-node'),
    log4js = require('log4js'),
    md5    = require('md5'),
    os     = require('os'),
    player = require('./player'),
    redis  = require('redis'),
    TDB    = require('./tdb');

// Init Logging
log4js.configure('', config.l4j);
var log    = log4js.getLogger();
var rdsLog = log4js.getLogger();

// Connect to DB
var tdb = new TDB(config.pg, log4js);

// init Redis
var redisClient = redis.createClient(config.redis.options);
redisClient.auth(config.redis.pass);

redisClient.on('error',function(err){rdsLog.error(err)});

// Global Variabales
var ivona; // Ivona Connection

redisClient.hgetall('config:ivona', function (err, result) {
  log.debug(result);

  ivona = new Ivona(result);
  say("Initializing.");

  connectAMQP();
});

function doKeepAlive() {
  var d = new Date();
  redisClient.hmset("keepalive:say", ['timestamp', d, 'host', os.hostname()], function (err, reply) {
    if (err) rdsLog.error(err);
    if (reply != 'OK') rdsLog.info(reply);
  });
}

doKeepAlive();
setInterval(doKeepAlive, 30000);

function say(text) {
  voiceHash(text, config.voice.name, function (vhash) {
    // create filename
    var file = config.cache_dir + '/' + vhash + '.mp3';

    fs.stat(file, function (err, stat) {
      if (err == null) {
        player.playFile(file);
      } else if (err.code == 'ENOENT') {
        log.info('retrieving file.');
        ivonaGetFile(text, config.voice, file, function (response) {
          player.playFile(response.file);
        });
      } else {
        log.error(err);
      }
    });
  });
}

function voiceHash(text, voiceName, cb) {
  cb(md5(voiceName + '|' + text));
}

function ivonaGetFile(text, voiceObj, file, cb) {
  log.debug('retrieving voice into file %s', file);
  ivona.createVoice(text, {
    body: {
      voice: voiceObj
    }
  }).pipe(
    fs.createWriteStream(file)
  ).on('finish', function (result) {
      var response = {
        text: text,
        file: file
      };
      cb(response)
    }
  );
}

function handleMessage(msg) {
  var sayReq = {};

  try {
    sayReq = JSON.parse(msg);
  } catch (e) {
    log.error('JSON packet [%s] is malformed', msg)
  }

  if (sayReq.say) {
    say(sayReq.say);
  }
}

function connectAMQP() {
  amqp.connect(config.amqp, function (err, conn) {
    say('Queue connected.');
    conn.createChannel(function (err, ch) {
      var q = 'say';

      ch.assertQueue(q, {durable: false});
      ch.consume(q, function (msg) {
        var message = msg.content.toString();
        handleMessage(message);
      }, {noAck: true});
    });
  });
}