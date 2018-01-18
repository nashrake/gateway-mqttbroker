import Poetry from 'poetry';
import Joi from 'joi';
import {
    Measurements,
    Dataloggers,
    Devices
} from 'poetry/models';

const bleDataloggerlogs = require( '../utils/bleDataloggerLogs.js' );

// Joi data message schema
const dataMessageSchema = ( {
    action: Joi.string()
        .description( 'Action Message' )
        .required(),

    version: Joi.number()
        .description( 'Version of the request format' )
        .default( 1 ),

    datalogger: Joi.object( {
            id: Joi.string()
                .description( 'Identifier of the datalogger' )
                .required(),
            type: Joi.string()
                .description( 'Type of the datalogger' ),
            network: Joi.string()
                .description( 'Network used for data emissions' ),
            protocol: Joi.string()
                .description( 'Protocol used for data emissions' )
        } )
        .required(),

    dataset: Joi.array()
        .description( 'Every device beacons received by the datalogger' )
        .required()
        .items( Joi.object( {
                device: Joi.object( {
                    id: Joi.string()
                        .description( 'Identifier of the device' )
                        .required(),
                    type: Joi.string()
                        .description( 'Device type' )
                } ),
                payload: Joi.string()
                    .description( 'Device payload containing the data' )
                    .required(),
                network: Joi.object( {
                    protocol: Joi.string()
                        .description( 'Device protocol communication' ),
                    name: Joi.string()
                        .description( 'Name of the device protocol communication' ),
                    signal: Joi.object( {
                        rssi: Joi.number()
                            .description( 'Signal power' )
                    } )
                } ),
                timestamp: Joi.number()
                    .description( 'Timestamp when the datalogger received the beacon' ),
                starttime: Joi.number()
                    .description( 'Timestamp when the datalogger see the beacon first time' )
            } )
            .description( 'One device beacon data received by the dataloger' ) )

} );

// Joi config message schema
const configMessageSchema = ( {
    action: Joi.string()
        .description( 'Action Message' )
        .required(),

    firstconnection: Joi.boolean()
        .description( 'True if the gateway just switched on' )
        .required(),

    datalogger: Joi.object( {
            id: Joi.string()
                .description( 'Identifier of the datalogger' )
                .required(),
            wifi: Joi.object( {
                    ip: Joi.string()
                        .description( 'Ip address' )
                        .required(),
                    quality: Joi.string()
                        .description( 'Wifi Quality' )
                        .required()
                } )
                .description( 'Wifi settings' )
                .required()
        } )
        .required(),

    config: Joi.object( {
            configNumber: Joi.number()
                .required(),
            mode: Joi.object( {
                    regularuse: Joi.object( {
                        scaninterval: Joi.number()
                            .description( 'Scan interval' )
                            .required(),
                        sendinterval: Joi.number()
                            .description( 'Send interval' )
                            .required()
                    } )
                } )
                .description( 'Modes configurations' )
                .required(),

            mqtt: Joi.object( {
                    address: Joi.string()
                        .description( 'Server Address' )
                        .required(),
                    port: Joi.number()
                        .description( 'Server Port' )
                        .required()
                } )
                .description( 'Server Config' )
                .required(),

            status: Joi.string()
                .description( 'New or Active' )
                .required(),

            configUpdatedAt: Joi.string()
                .description( 'Last config updated received from server' )
                .required(),

            firstPhoneConfigDone: Joi.string()
                .description( 'First config done or not' )
                .required(),

            software: Joi.object( {
                    version: Joi.string()
                        .description( 'Current software version of the datalogger' )
                        .required()

                } )
                .description( 'Software status' )
                .required()
        } )
        .required(),

    filter: Joi.object( {
            byMac: Joi.object( {
                    byRange: Joi.object( {
                            max: Joi.string()
                                .description( 'Filter By Mac By Range Max' )
                                .allow( '' ),
                            min: Joi.string()
                                .description( 'Filter By Mac By Range Min' )
                                .allow( '' )
                        } )
                        .description( 'Filter By Mac By Range' )
                        .required(),
                    byValue: Joi.array()
                        .description( 'Filter By Mac By Value' )
                        .items(
                            Joi.string()
                            .allow( '' )
                        )
                } )
                .description( 'Filter By Mac' )
                .required(),
            byUuid: Joi.object( {
                    byRange: Joi.object( {
                            max: Joi.string()
                                .description( 'Filter By Uuid By Range Max' )
                                .allow( '' ),
                            min: Joi.string()
                                .description( 'Filter By Uuid By Range Min' )
                                .allow( '' ),
                        } )
                        .description( 'Filter By Uuid By Range' )
                        .required(),
                    byValue: Joi.array()
                        .description( 'Filter By Uuid By Value' )
                        .items(
                            Joi.string()
                            .allow( '' )
                        )
                } )
                .description( 'Filter By Uuid' )
                .required()
        } )
        .description( 'Datalogger Device Filter' )
        .required()

} );



/**
 * Fired when a message is received
 * @return void
 */
module.exports = function publishedHandlerBuilder( server ) {
    /**
     * Create a json object from an json string
     * @param  {String} jsonString json string to convert
     * @return {JSONObject} return the json object created
     * or 0 if the convertion is impossible
     */
    function createJSON( jsonString ) {
        // Try to create the JSON object
        Poetry.log.info( 'Message received :', jsonString );
        try {
            return JSON.parse( jsonString );
        } catch ( e ) {
            return 0;
        }
    }

    /**
     * Check the json format with the 'joi schema'
     * @param  {JSONObject} jsonObject to check
     * @return {JSONObject} return the JSONObject or 0 if the
     * jsonObject is not adapted to the schema
     */
    function joiCheck( jsonObject ) {
        let joiReturn = Joi.validate( jsonObject, Joi.alternatives()
            .try(
                configMessageSchema,
                dataMessageSchema
            ), {
                stripUnknown: true
            } );

        if ( joiReturn.error ) return 0;

        return joiReturn;
    }

    /**
     * Save devices data in the db
     * @param  {JSONObject} JSONObject contain all data linked with dataloger and devices
     * @return {void}
     */
    function saveData( joiResultObject ) {
        // For each data in the dataset
        let measurementsNumber = joiResultObject.dataset.length;
        for ( let i = 0; i < measurementsNumber; i++ ) {
            let jsonData = joiResultObject.dataset[ i ];

            // Timestamp adding
            if ( !jsonData.hasOwnProperty( 'timestamp' ) ) {
                jsonData[ 'timestamp' ] = Date.now();
            } else {
                jsonData[ 'timestamp' ] = new Date( jsonData[ 'timestamp' ] );
            }

            //Datalogger added in the devices data
            jsonData.device.datalogger = joiResultObject.datalogger;

            //Little print to see what we want to save
            Poetry.log.info( 'Saving data : ' + JSON.stringify( jsonData ) );

            // Create if necessary the device and insert the measurement
            Devices.findOne( {
                    _id: jsonData.device.id
                } )
                .then( ( dbDevice ) => {
                    if ( !dbDevice ) {
                        jsonData.device.type = 'btgeneric';

                    } else {
                        jsonData.device.type = dbDevice.type;

                    }
                    // Save measurement
                    Measurements.insert( jsonData )
                        .then( () => {
                            Poetry.log.info( 'Data saved' );

                        } )
                        .catch( () => {
                            Poetry.log.error( 'Error to save data' );

                        } );
                } );
        }

        // Add ble datalogger log and new datalogger timestamp
        let message = '';
        let status = '';
        let receptionTimeStamp = new Date();
        if ( measurementsNumber > 1 ) {
            status = 'Sent measurements';
            message = measurementsNumber + ' measurements saved';

        } else {
            status = 'Sent measurement';
            message = measurementsNumber + ' measurement saved';

        }
        bleDataloggerlogs( joiResultObject.datalogger.id, status, message, receptionTimeStamp )
            .then( () => {
                Poetry.log.info( 'Datalogger received data logs added' );

            } );

    }



    function sendConfigToDatalogger( receivedDataloggerConfig ) {
        Dataloggers.findOne( {
                _id: receivedDataloggerConfig.datalogger.id
            } )
            .then( dbDataloggerConfig => {
                Poetry.log.info( JSON.stringify( dbDataloggerConfig, null, '' ) );

                if ( receivedDataloggerConfig.config.configNumber < dbDataloggerConfig.configNumber ) {
                    Poetry.emit(
                        'update:bledatalogger',
                        dbDataloggerConfig
                    );
                } else {
                    Poetry.log.info( 'BLE Datalogger already updated' );
                }
            } )
    }

    /**
     * Save the datalogger server config and send the configuration to the datalogger
     * @param  {JSON} joiResultObject config to save
     */
    function saveConfigOnDbAndSendItToDatalogger( configReceived ) {
        // Config to save in db received from ble datalogger
        let newConfig = {
            address: configReceived.config.mqtt.address,
            port: configReceived.config.mqtt.port,
            currentConfigTimestamp: new Date(),
            currentSoftwareVersion: configReceived.config.software.version
        }

        // Update datalogger server config
        Dataloggers.findAndModify( {
                query: {
                    _id: configReceived.datalogger.id

                },
                update: {
                    '$set': newConfig

                }
            } )
            .then( dbDataloggerConfig => {
                // Add connected logs
                let message = 'Wifi IP Address : ' + configReceived.datalogger.wifi.ip + ', Wifi Quality : ' + configReceived.datalogger.wifi.quality;
                let status;
                // If it is the first connection after a reboot
                if ( configReceived.firstconnection ) {
                    status = 'First connection after reboot';
                } else {
                    status = 'Connected';
                }
                bleDataloggerlogs( configReceived.datalogger.id, status, message )
                    .then( () => {
                        Poetry.log.info( 'Log', status, ' as status for datalogger', configReceived.datalogger.id, 'added!' );
                        sendConfigToDatalogger( configReceived );

                    } );

            } )
            .catch( Poetry.log.error );
    }


    /**
     * Decrypt, parse, verif, and insert values in the BDD
     * @param  {[type]} packet [description]
     * @param  {[type]} client [description]
     * @return {[type]}        [description]
     */
    return function publishedHandler( packet, client ) {
        let messageRecv;
        let jsonObjectRecv;
        let messageRecvJoiResult;

        // Decrypt message
        messageRecv = packet.payload.toString( 'utf-8' );

        // JSON Creation
        jsonObjectRecv = createJSON( messageRecv );
        if ( !jsonObjectRecv ) return;


        // JOI check
        messageRecvJoiResult = joiCheck( jsonObjectRecv );
        if ( !messageRecvJoiResult ) return;



        switch ( messageRecvJoiResult.value.action ) {
            case 'data':
                saveData( messageRecvJoiResult.value );
                break;
            case 'config':
                Poetry.log.info( 'It is a config' );
                saveConfigOnDbAndSendItToDatalogger( messageRecvJoiResult.value );
                break;
            default:
                Poetry.log.error( 'Unknown action ${messageRecvJoiResult.value.action}' )

        }
    };
};
