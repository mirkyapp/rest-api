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

    const { sessionId, propName, companyName, website, industry, companySize } = req.body;

    // validate session
    var session = await db.collection('sessions').findOne({
        sessionId: sessionId
    });
    if (!session) {
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

    const { sessionId } = req.body;

    // validate session
    var session = await db.collection('sessions').findOne({
        sessionId: sessionId
    });
    if (!session) {
        return res.status(403).json({
            error: 'Invalid session'
        });
    }

    var uid = session.userId;

    // fetch properties
    var properties = await db.collection('properties').find({ members: uid }).toArray();

    // return properties
    return res.status(200).json({
        properties: properties
    });
}