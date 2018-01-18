import Poetry from 'poetry';

/**
 * Fired when the mqtt server is ready
 * @return void
 */
module.exports = function readyHandlerBuilder(server) {
    return function ready() {
        setup();
    };
};
/**
 * Setup function
 * @return void
 */
function setup() {
    Poetry.log.info('Mosca server is up and running');
}
