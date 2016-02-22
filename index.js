// Load Config
var config = require('./config');

// Load Modules
var fs     = require('fs'),
    Ivona  = require('ivona-node'),
    log4js = require('log4js'),
    md5    = require('md5'),
    Player = require('player'),
    TDB    = require('./tdb');

// Init Logging
log4js.configure('', config.l4j);
var log    = log4js.getLogger(),
    tmLog  = log4js.getLogger('tyrmail');

// Connect to DB
var tdb = new TDB(config.pg, log4js);

var ivona;

tdb.reg.get('/config/ivona', function (err, result) {
  console.log(result);
  ivona = new Ivona(result);

  //ivona.listVoices().on('complete', function (voices) {
    //log.info(voices);
  //});

  say("Initializing.");

});

function say(text) {
  voiceHash(text, config.voice.name, function (vhash) {
    // create filename
    var file = config.cache_dir + '/' + vhash + '.mp3';

    fs.stat(file, function (err, stat) {
      if(err == null) {
        playFile(file);
      } else if(err.code == 'ENOENT') {
        ivonaGetFile(text, config.voice, file, function(response){
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
  log.debug('retrieving voice into file %s', file)
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

function playFile(file){
  var player = new Player(file);

  log.debug('playing file %s', file);

  player.on('error', function(err){
    log.error(err);
  });

  player.play(function(err, player){
    if (err) log.error(err);
    log.debug('finished playing file %s', file);
  });
}