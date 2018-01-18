import Poetry from 'poetry';
import Boom from 'boom';
import Mosca from 'mosca';
import FS from 'fs';

const SECURE_KEY = './secure/iotfactory_certified.PRIVATE.key';
const SECURE_CERT = './secure/ab13bd5cbdb4ee4a.crt';

// Mosca settings
const settings = {
  port: 8989
  // logger : {
  //   name: 'test',
  //   level :40
  // },
  // secure: {
  //   port: 8989,
  //   keyPath: SECURE_KEY,
  //   certPath: SECURE_CERT
  // }
};

// Here we start mosca
const server = new Mosca.Server(settings);

// Datalogger updated handler
const dataloggerConfigUpdated = require('./poetryHandlers/onGatewayConfigUpdated.js')(server);

/**
 * Mosca server handlers setting
 * @type {[type]}
 */
FS.readdir('./handlers', function(err, files) {
  if (err) {
    throw err;
  }
  files.forEach(function(file) {
    let fileName = file + '';
    let handlerName = fileName.split('.')[0];
    Poetry.log.info('Set handler :', handlerName);
    server.on(handlerName, require('./handlers/' + fileName)(server));
  });
});
