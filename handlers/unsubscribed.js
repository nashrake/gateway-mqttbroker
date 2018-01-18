import Poetry from 'poetry';
const bleDataloggerlogs = require('../utils/bleDataloggerLogs.js');

/**
 * Fired when a client unsubscribes from a topic
 * @param  topic  which is the topic that the client want to unsubscribe from
 * @param  client who want to unsubscribe
 * @return void
 */
module.exports = function unsubscribedHandlerBuilder(server) {
  return function unsubscribed(topic, client) {
    Poetry.log.info('Gateway unsubscribed from the topic : ', topic);
    bleDataloggerlogs(topic, 'Disconnected')
      .then(() => {
        Poetry.log.info('Log \'disconnected\' for', topic, 'added!');
      });
  };
};
