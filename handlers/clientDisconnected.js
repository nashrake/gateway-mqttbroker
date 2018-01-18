import Poetry from 'poetry';

/**
 * Fired when a client just disconnected
 * @param client disconnected
 * @return void
 */
module.exports = function clientDisconnectedHandlerBuilder(server) {
    return function clientDisconnected(client) {
        Poetry.log.info('Gateway', client.id, 'is disconnected');
    };
};
