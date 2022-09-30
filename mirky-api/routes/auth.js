const UIDGenerator = require('uid-generator');
const uidgen = new UIDGenerator();

// get utils
const { connectDb } = require('../utils/db');
const { encrypt } = require('../utils/encrypt');
const { genSessionId } = require('../utils/genSessionId');
const { genEncryptKey } = require('../utils/genEncryptKey');
const { decrypt } = require('../utils/decrypt');

const db = connectDb();

// Route /auth/anonSession
exports.anonSession = async function(req, res) {
    // Generate session id
    var sessionId = genSessionId();
    // Encrypt session id
    var encryptedSessionId = encrypt(sessionId, process.env.MASTER_ENCRYPT_KEY);
    // Set session id in db
    await db.collection('sessions').insertOne({
        sessionId: sessionId,
        userId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()

    });
    // Return session id
    return res.status(200).json({
        sessionId: sessionId
    });
}

// Route /auth/signup
exports.signup = async function(req, res) {

    const { username, password, email, firstName, lastName, sessionId } = req.body;

    // Validate session
    var session = await db.collection('sessions').findOne({
        sessionId: sessionId
    });
    if (!session) {
        return res.status(403).json({
            error: 'Invalid session'
        });
    }

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
    await db.collection('sessions').insertOne({ 
        sessionId: newSessionId,
        userId: uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    });

    // Respond
    return res.status(200).json({
        message: 'User created, session replaced',
        sessionId: newSessionId
    });

}

// Route /auth/login
exports.login = async function(req, res) {
    
    const { email, password, sessionId } = req.body;

    // Validate session
    var session = await db.collection('sessions').findOne({
        sessionId: sessionId
    });
    if (!session) {
        return res.status(403).json({
            error: 'Invalid session'
        });
    }

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
    await db.collection('sessions').insertOne({ 
        sessionId: newSessionId,
        userId: user.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    });

    // Respond
    return res.status(200).json({
        message: 'User logged in, session replaced',
        sessionId: newSessionId
    });

}