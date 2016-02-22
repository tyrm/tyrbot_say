// Load Config
var config = require('./config');

// Load Modules
var fs     = require('fs'),
    Ivona  = require('ivona-node'),
    log4js = require('log4js'),
    md5    = require('md5'),
    player = require('play-sound')(opts = {}),
    TDB = require('./tdb');

// Init Logging
log4js.configure('', config.l4j);
var log = log4js.getLogger();

// Connect to DB
var tdb = new TDB(config.pg, log4js);

// Global Variabales
var ivona; // Ivona Connection

tdb.reg.get('/config/ivona', function (err, result) {
  ivona = new Ivona(result);
  say("Initializing the application.");
  say("Attempting to connect to queue.");

});

function say(text) {
  voiceHash(text, config.voice.name, function (vhash) {
    // create filename
    var file = config.cache_dir + '/' + vhash + '.mp3';

    fs.stat(file, function (err, stat) {
      if (err == null) {
        playFile(file);
      } else if (err.code == 'ENOENT') {
        ivonaGetFile(text, config.voice, file, function (response) {
          playFile(response.file);
        });
        log.info('File does not exist');
      } else {
        log.error(err);
      }
    });
  });
}

function voiceHash(text, voiceName, cb) {
  var voiceHash = md5(voiceName + '|' + text);
  log.trace({
    text: text,
    voice: voiceName,
    hash: voiceHash
  });
  cb(voiceHash);
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
      cb(response);
    });
}

var playing = false; // Variable
var playQueue = [];

function playFile(file) {
  playQueue.push(file);

  if (!playing) {
    playing = true;

    function _playNext(err) {
      if (err) log.error(err);
      if (playQueue.length > 0) {
        var playFile = playQueue.shift();

        player.play(playFile, _playNext);
      } else {
        playing = false;
      }
    }

    _playNext();
  }
}
