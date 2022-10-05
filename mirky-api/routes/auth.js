const UIDGenerator = require('uid-generator');
const uidgen = new UIDGenerator();
const dotenv = require('dotenv');

dotenv.config();

// get utils
const { connectDb } = require('../utils/db');
const { encrypt } = require('../utils/encrypt');
const { genSessionId } = require('../utils/genSessionId');
const { genEncryptKey } = require('../utils/genEncryptKey');
const { decrypt } = require('../utils/decrypt');

const db = connectDb();

// Route /auth/anon-session
exports.anonSession = async function(req, res) {
    // Generate session id
    var sessionId = genSessionId();
    // create session pass
    var sessionPass = genEncryptKey();
    
    // Set session id in db
    await db.collection('sessions').insertOne({
        sessionId: sessionId,
        sessionPass: encrypt(sessionPass, process.env.MASTER_ENCRYPT_KEY),
        userId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()

    });
    // Return session id
    return res.status(200).json({
        sessionData: {
            id: sessionId,
            password: encrypt(sessionPass, process.env.MASTER_ENCRYPT_KEY)
        }
    });
}

// Route /auth/signup
exports.signup = async function(req, res) {

    // get session id from auth header
    const b64auth = (req.headers.authorization || '').split(' ')[1] || ''
    const [sessionId] = Buffer.from(b64auth, 'base64').toString().split(':')

    const { username, password, email, firstName, lastName } = req.body;

    // Check if email is taken
    const emailTaken = await db.collection('users').findOne({ email: email });
    if (emailTaken) {
        return res.status(400).json({
            message: 'Email is already taken'
        });
    }

    // Create User
    const encryptKey = genEncryptKey();
    const uid = uidgen.generateSync();
    const newUser = {
        uid: uid,
        username: encrypt(username, encryptKey),
        password: encrypt(password, encryptKey),
        email: email,
        firstName: encrypt(firstName, encryptKey),
        lastName: encrypt(lastName, encryptKey),
        encryptKey: encrypt(encryptKey, process.env.MASTER_ENCRYPT_KEY),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    // Insert user into db
    const user = await db.collection('users').insertOne(newUser);

    // Replace session
    await db.collection('sessions').deleteOne({ sessionId: sessionId });
    var newSessionId = genSessionId();
    var newSessionPass = genEncryptKey();
    await db.collection('sessions').insertOne({ 
        sessionId: newSessionId,
        sessionPass: encrypt(newSessionPass, process.env.MASTER_ENCRYPT_KEY),
        userId: uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    });

    // Respond
    return res.status(200).json({
        message: 'User created, session replaced',
        session: {
            id: newSessionId,
            password: encrypt(newSessionPass, process.env.MASTER_ENCRYPT_KEY)
        }
    });

}

// Route /auth/login
exports.login = async function(req, res) {

    // get session id from auth header
    const b64auth = (req.headers.authorization || '').split(' ')[1] || ''
    const [sessionId] = Buffer.from(b64auth, 'base64').toString().split(':')
    
    const { email, password } = req.body;

    // Find user
    const user = await db.collection('users').findOne({ email: email });
    if (!user) {
        return res.status(404).json({
            message: 'User not found'
        });
    }

    // Check password
    if (decrypt(user.password, decrypt(user.encryptKey, process.env.MASTER_ENCRYPT_KEY)) !== password) {
        return res.status(403).json({
            message: 'Incorrect password'
        });
    }

    // Replace session
    await db.collection('sessions').deleteOne({ sessionId: sessionId });
    var newSessionId = genSessionId();
    var newSessionPass = genEncryptKey();
    await db.collection('sessions').insertOne({ 
        sessionId: newSessionId,
        sessionPass: encrypt(newSessionPass, process.env.MASTER_ENCRYPT_KEY),
        userId: user.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    });

    // Respond
    return res.status(200).json({
        message: 'User logged in, session replaced',
        session: {
            id: newSessionId,
            password: encrypt(newSessionPass, process.env.MASTER_ENCRYPT_KEY)
        }
    });

}