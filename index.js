// Load Config
var config = require('./config');

// Load Modules
var fs     = require('fs'),
    Ivona  = require('ivona-node'),
    log4js = require('log4js'),
    md5    = require('md5'),
    TDB    = require('./tdb');

// Connect to DB
var tdb = new TDB(config.pg, log4js);

var ivona;

tdb.reg.get('/config/ivona', function (err, result) {
  console.log(result);
  ivona = new Ivona(result);

  ivona.listVoices()
    .on('complete', function(voices) {
      console.log(voices);
    });

  ivona.createVoice('This is the text that will be spoken.', {
        body: {
            voice: {
                name: 'Raveena',
                language: 'en-IN',
                gender: 'Female'
            }
        }
    }).pipe(fs.createWriteStream('text.mp3')).on('finish', function (err, result) {
      console.log(result);
    });

});


