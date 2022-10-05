const UIDGenerator = require('uid-generator');
const uidgen = new UIDGenerator();
const dotenv = require('dotenv');
const multiparty = require('multiparty');
const fs = require('fs');

dotenv.config();

// require utils
const { connectDb } = require('../utils/db');
const { encrypt } = require('../utils/encrypt');
const { genSessionId } = require('../utils/genSessionId');
const { genEncryptKey } = require('../utils/genEncryptKey');
const { decrypt } = require('../utils/decrypt');
const { upload } = require('../utils/upload');


const db = connectDb();

// route /user/:uid
exports.fetchByUid = async function(req, res) {
    const { uid } = req.params;
    
    // determine if uid is a session id or a user id
    var session = await db.collection('sessions').findOne({
        sessionId: uid
    });
    if (session) {
        // uid is a session id
        var user = await db.collection('users').findOne({
            uid: session.userId
        });
        var decryptKey = decrypt(user.encryptKey, process.env.MASTER_ENCRYPT_KEY);
        if (user.profilePicture) {
            pfp = user.profilePicture.location
        } else {
            pfp = null
        }
        return res.status(200).json({
            user: {
                uid: user.uid,
                email: user.email,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
                firstName: decrypt(user.firstName, decryptKey),
                lastName: decrypt(user.lastName, decryptKey),
                username: decrypt(user.username, decryptKey),
                avatar: pfp
            }
        });
    }
    // uid is a user id
    var user = await db.collection('users').findOne({
        userId: uid
    });
    return res.status(200).json({
        user: user
    });
}

// route /user/:uid/update/profile-picture
exports.updateProfilePicture = async function(req, res) {

    // get the uid from the url
    const { uid } = req.params;

    // determine if uid is a session id or a user id
    var session = await db.collection('sessions').findOne({
        sessionId: uid
    });
    if (session) {
        // uid is a session id
        var user = await db.collection('users').findOne({
            uid: session.userId
        });
    }

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
            const fileName = `pfp/${user.uid}/${timestamp}-lg`;
            const data = await upload(buffer, fileName);
            
            // update the user's profile picture
            var encryptKey = decrypt(user.encryptKey, process.env.MASTER_ENCRYPT_KEY);
            await db.collection('users').updateOne({
                uid: user.uid
            }, {
                $set: {
                    profilePicture: {
                        location: data.Location,
                        key: encrypt(data.Key, encryptKey),
                        bucket: encrypt(data.Bucket, encryptKey),
                    },
                    updatedAt: new Date().toISOString()
                }
            });
            return res.status(200).send({
                message: 'PFP updated successfully',
                data: data
            });

            } catch (error) {
                console.log(error);
            return res.status(500).send(error);
        }
    });


}

// route /user/:uid/update/:field
exports.updateField = async function(req, res) {

    // get the variables from the url
    const { uid, field } = req.params;

    // determine if uid is a session id or a user id
    var session = await db.collection('sessions').findOne({
        sessionId: uid
    });
    if (session) {
        // uid is a session id
        var user = await db.collection('users').findOne({
            uid: session.userId
        });
    } else {
        // uid is a user id
        var user = await db.collection('users').findOne({
            uid: uid
        });
    }

    // get the value from the body
    const { value } = req.body;

    // update the user's field
    var encryptKey = decrypt(user.encryptKey, process.env.MASTER_ENCRYPT_KEY);

    if (field == 'email') {
        await db.collection('users').updateOne({
            uid: user.uid
        }, {
            $set: {
                email: value,
                updatedAt: new Date().toISOString()
            }
        });
    } else {
        await db.collection('users').updateOne({
            uid: user.uid
        }, {
            $set: {
                [field]: encrypt(value, encryptKey),
                updatedAt: new Date().toISOString()
            }
        });
    }

    return res.status(200).send({
        message: 'Field updated successfully'
    });

}