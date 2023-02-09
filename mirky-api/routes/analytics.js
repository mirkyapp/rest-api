// This route is publicly accessible, any user can create annon requests
// This route is responsible for handling all incoming analytics post requests
// This route will recieve HEAVY traffic and should be optimized as much as possible

// Import the required modules
const { connectDb } = require('../utils/db');
const { encrypt } = require('../utils/encrypt');
const { genSessionId } = require('../utils/genSessionId');
const { genEncryptKey } = require('../utils/genEncryptKey');
const { decrypt } = require('../utils/decrypt');
const { upload } = require('../utils/upload');
// const { io } = require('../handler');

// Connect to the db
const db = connectDb();

// Verify prop ids
exports.verifyPropId = async function(req, res) {

    const { propId } = req.params;
    
    // Find the property
    let prop = await db.collection('properties').findOne({
        propId: propId
    })

    // If the property exists, return true
    if (prop) {
        return res.status(200).json({
            message: 'Property exists',
            exists: true
        });
    }

    // If the property does not exist, return false
    return res.status(404).json({
        message: 'Property does not exist',
        exists: false
    });
}

// Handle page view events
exports.pageView = async function(req, res) {

    // Get the prop id
    const { propId } = req.params;

    // Get the data
    const data = req.body;

    // Find the property
    let prop = await db.collection('properties').findOne({
        propId: propId
    })

    // If the property exists, add the data to the analytics collection
    if (prop) {
        // add the data object to prop.analytics.presetEvents[0].counts array
        await db.collection('properties').updateOne({
            propId: propId
        }, {
            $push: {
                'analytics.presetEvents.0.counts': data
            }
        });

        // Return success
        return res.status(200).json({
            message: 'Page view event added',
        });
    }

    // If the property does not exist, return false
    return res.status(404).json({
        message: 'Property does not exist'
    });
}

// // User connects/disconnects
// io.on('connection', (socket) => {
//     const propId = socket.handshake.query.propId;

//     // Add a user to the analytics collection
//     db.collection('properties').updateOne({
//         propId: propId
//     }, {
//         $push: {
//             'analytics.presetEvents.1.counts': {
//                 value: 1,
//                 socketId: socket.id,
//                 timestamp: Date.now()
//             }
//         }
//     });

//     // When a user disconnects, remove them from the analytics collection
//     socket.on('disconnect', () => {
//         db.collection('properties').updateOne({
//             propId: propId
//         }, {
//             $pull: {
//                 'analytics.presetEvents.1.counts': {
//                     socketId: socket.id
//                 }
//             }
//         });
//     })
// });

// Websocket connect handler
exports.connectHandler = async (event, context) => {

    // Get the prop id
    const propId = event.propId

    // get the socket id
    const socketId = event.socketId

    // Find the property
    let prop = await db.collection('properties').findOne({
        propId: propId
    })

    // If the property exists, add the data to the analytics collection
    if (prop) {
        // add the data object to prop.analytics.presetEvents[1].counts array
        await db.collection('properties').updateOne({
            propId: propId
        }, {
            $push: {
                'analytics.presetEvents.1.counts': {
                    value: 1,
                    socketId: socketId,
                }
            }
        });

        // Return success
        return {
            statusCode: 200,
        }
    
    } else {
        // If the property does not exist, return false
        return {
            statusCode: 404,
        }
    }

};

// Websocket disconnect handler
exports.disconnectHandler = async (event, context) => {
    
        // Get the prop id
        const propId = event.propId
    
        // get the socket id
        const socketId = event.socketId
    
        // Find the property
        let prop = await db.collection('properties').findOne({
            propId: propId
        })

        // If the property exists, add the data to the analytics collection
        if (prop) {
            // add the data object to prop.analytics.presetEvents[1].counts array
            await db.collection('properties').updateOne({
                propId: propId
            }, {
                $pull: {
                    'analytics.presetEvents.1.counts': {
                        socketId: socketId
                    }
                }
            });
    
            // Return success
            return {
                statusCode: 200,
            }
        
        } else {
            // If the property does not exist, return false
            return {
                statusCode: 404,
            }
        }
}