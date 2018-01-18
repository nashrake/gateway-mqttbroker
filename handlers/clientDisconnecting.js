import Poetry from 'poetry';

/**
 * Fired when a client is disconnecting
 * @param  client who disconnecting
 * @return void
 */
module.exports = function clientDisconnectingHandlerBuilder(server) {
    return function clientDisconnecting(client) {
        Poetry.log.info('Gateway', client.id, 'disconnecting');
    };
};
