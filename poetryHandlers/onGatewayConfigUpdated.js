import Poetry from 'poetry';


module.exports = function gatewayConfigUpdatedHandler(server) {


  Poetry.on('update:bledatalogger', {}, config => {

    function updateGatewayConfig(config) {
      Poetry.log.info('Gateway', config._id, ': Config updating');

      let configToSend = {
        config: {
          configNumber: config.configNumber,
          software: {
            version: config.softwareVersion

          },
          status: config.status,
          configUpdatedAt: config.timestamp,
          filter: {
            byMacByValue: config.filterByMacByValue,
            byMacByRangeMin: config.filterByMacByRangeMin,
            byMacByRangeMax: config.filterByMacByRangeMax,
            byUuidByValue: config.filterByUuidByValue,
            byUuidByRangeMin: config.filterByUuidByRangeMin,
            byUuidByRangeMax: config.filterByUuidByRangeMax

          },
          mqtt: {
            address: config.address,
            port: config.port

          },
          mode: {
            regularUse: {
              scaninterval: config.scaninterval,
              sendinterval: config.sendinterval

            }
          }
        }
      };

      if (!configToSend.config.filter.byMacByValue) configToSend.config.filter.byMacByValue = [];
      if (!configToSend.config.filter.byMacByRangeMin) configToSend.config.filter.byMacByRangeMin = "";
      if (!configToSend.config.filter.byMacByRangeMax) configToSend.config.filter.byMacByRangeMax = "";

      if (!configToSend.config.filter.byUuidByValue) configToSend.config.filter.byUuidByValue = [];
      if (!configToSend.config.filter.byUuidByRangeMin) configToSend.config.filter.byUuidByRangeMin = "";
      if (!configToSend.config.filter.byUuidByRangeMax) configToSend.config.filter.byUuidByRangeMax = "";


      let configMessage = {
        topic: config._id,
        payload: JSON.stringify(configToSend),
        qos: 1, // 0, 1, or 2
        retain: false

      };

      Poetry.log.info('Sending config :\n', JSON.stringify(configMessage));

      server.publish(configMessage, () => {
        Poetry.log.info('Config sent');
      });
    }

    updateGatewayConfig(config);
  });
};
