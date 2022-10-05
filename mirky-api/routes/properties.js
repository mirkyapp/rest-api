const UIDGenerator = require('uid-generator');
const uidgen = new UIDGenerator();

// require utils
const { connectDb } = require('../utils/db');
const { encrypt } = require('../utils/encrypt');
const { genSessionId } = require('../utils/genSessionId');
const { genEncryptKey } = require('../utils/genEncryptKey');
const { decrypt } = require('../utils/decrypt');

const db = connectDb();

// route /property/create
exports.create = async function(req, res) {

    // get session id from auth header
    const b64auth = (req.headers.authorization || '').split(' ')[1] || ''
    const [sessionId, password] = Buffer.from(b64auth, 'base64').toString().split(':')

    const { propName, companyName, website, industry, companySize } = req.body;

    // validate session
    var session = await db.collection('sessions').findOne({
        sessionId: sessionId
    });
    if (session.userId == null) {
        return res.status(403).json({
            error: 'Invalid session'
        });
    }

    // create property
    const uid = uidgen.generateSync(10);
    const newProperty = {
        propId: uid,
        members: [
            session.userId
        ],
        propName: propName,
        companyName: companyName,
        website: website,
        industry: industry,
        companySize: companySize,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    await db.collection('properties').insertOne(newProperty);

    // return property
    return res.status(200).json({
        message: 'Property created',
        property: newProperty
    });
}

// fetch properties by uid
exports.fetchByUid = async function(req, res) {
    
    const { uid } = req.params;

    // determine if the uid is a session id or a user id
    var session = await db.collection('sessions').findOne({
        sessionId: uid
    });
    if (session) {
        // uid is a session id
        if (session.userId == null) {
            return res.status(403).json({
                error: 'Invalid session'
            });
        }
        var properties = await db.collection('properties').find({
            members: session.userId
        }).toArray();
        return res.status(200).json({
            properties: properties
        });
    } else {
        // uid is a user id
        var properties = await db.collection('properties').find({
            members: uid
        }).toArray();
        return res.status(200).json({
            properties: properties
        });
    }
}