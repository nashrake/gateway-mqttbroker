import Poetry from 'poetry';
import {
  Dataloggers,
  Dataloggerlogs,
  ObjectId
} from 'poetry/models';



// Function to update logs and datalogger timestamp
module.exports = function insertBleDataloggerlogs(datalogger, status, message, timestamp) {

  let log = {
    datalogger: datalogger,
    status: status,
  };

  // If message
  if (message) log.message = message;

  // If timestamp, if not, create it
  if (timestamp) log.timestamp = timestamp;
  else log.timestamp = new Date();

  Poetry.log.info(JSON.stringify(datalogger), ', adding log :', JSON.stringify(log));

  return new Promise((resolve, reject) => {

    // Update datalogger logs
    Dataloggerlogs.insert(log)
      .then(() => {
        
        // Update datalogger timestamp
        Dataloggers.findAndModify({
            query: {
              _id: datalogger

            },
            update: {
              '$set': {
                timestamp: log.timestamp

              }
            }
          })
          .then(() => resolve());
      })
      .catch(() => reject());
  });
};
