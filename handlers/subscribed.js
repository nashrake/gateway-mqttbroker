import Poetry from 'poetry';
import {
  Dataloggers
} from 'poetry/models';

const bleDataloggerlogs = require('../utils/bleDataloggerLogs.js');

/**
 * Fired when a client subscribes to a topic
 * @param  topic  choosen by the client
 * @param  client subscribing to the topic
 * @return void
 */
module.exports = function subscribedHandlerBuilder(server) {

  return function subscribed(topic, client) {
    Poetry.log.info('Gateway subscribed to the topic : ', topic);

    Dataloggers.findOne({
        _id: topic
      })
      .then(dataloggerConfig => {
        // If the datalogger doesn't exist
        if (!dataloggerConfig && topic.length == 12) {
          let newDatalogger = {
            _id: topic,
            name: topic,
            team: "",
            status: "new",
            type: "ble",
            note: "New BLE Datalogger",
            configNumber: 0,
            timestamp: new Date()
          };

          Dataloggers.insert(newDatalogger)
            .then(() => {
              Poetry.log.info("New datalogger : ", newDatalogger._id);
            })
            .catch("New Datalogger error");
        }
      });
      // .catch(Poetry.log.info('This Datalogger doesn t exist'));

    // Add logs for the Datalogger
    // bleDataloggerlogs(topic, 'Connected')
    //   .then(() => {
    //     Poetry.log.info('Log \'connected\' for', topic, 'added!');
    //   })
  };
};
