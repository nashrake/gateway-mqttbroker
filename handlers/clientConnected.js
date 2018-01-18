import Poetry from 'poetry';



/**
 * Fired when a client just connected
 * @param client connected
 * @return void
 */
module.exports = function clientConnectedHandlerBuilder(server) {
  return function clientConnected(client) {
    Poetry.log.info('Gateway', client.id, 'connected');

  };
};
