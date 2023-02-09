const UIDGenerator = require('uid-generator');
const uidgen = new UIDGenerator();
const multiparty = require('multiparty');
const fs = require('fs');

// require utils
const { connectDb } = require('../utils/db');
const { encrypt } = require('../utils/encrypt');
const { genSessionId } = require('../utils/genSessionId');
const { genEncryptKey } = require('../utils/genEncryptKey');
const { decrypt } = require('../utils/decrypt');
const { upload } = require('../utils/upload');

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
        logo: {
            location: null,
            key: null,
            bucket: null
        },
        encryptionKey: encrypt(genEncryptKey(), process.env.MASTER_ENCRYPT_KEY),
        analytics: {
            presetEvents: [
                {
                    name: 'Page View',
                    eId: 'page-view',
                    description: 'A page view event',
                    counts: []
                },
                {
                    name: 'Real Time Visitor',
                    eId: 'real-time-visitor',
                    description: 'A real time visitor event',
                    counts: []
                }
            ],
            customEvents: []
        },
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

// fetch property by propId
exports.fetchByPropId = async function(req, res) {
        
    const { propId } = req.params;
    
    var property = await db.collection('properties').findOne({
        propId: propId
    });
    if (property) {
        return res.status(200).json({
            property: property
        });
    } else {
        return res.status(404).json({
            error: 'Property not found'
        });
    }
}

// update property logo
exports.updateLogo = async function(req, res) {
    // get the propId from the url
    const { propId } = req.params;

    const form = new multiparty.Form();

    form.parse(req, async (error, fields, files) => {
        if (error) {
            console.log(error);
          return res.status(500).send(error);
        };
        try {
            const path = files.file[0].path;
            const buffer = fs.readFileSync(path);
            const timestamp = Date.now().toString();
            const fileName = `propLogo/${propId}/${timestamp}-lg`;
            const data = await upload(buffer, fileName);
            
            // update the property profile picture
            await db.collection('properties').updateOne({
                propId: propId
            }, {
                $set: {
                    logo: {
                        location: data.Location,
                        key: data.Key,
                        bucket: data.Bucket,
                    },
                    updatedAt: new Date().toISOString()
                }
            });
            return res.status(200).send({
                message: 'Picture updated successfully',
                data: data
            });

            } catch (error) {
                console.log(error);
            return res.status(500).send(error);
        }
    });
}