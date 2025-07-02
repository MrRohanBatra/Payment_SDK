const admin = require('firebase-admin');
require('dotenv').config();
const ServiceAccount = JSON.parse(process.env.firebaseConfig);
admin.initializeApp({
credential: admin.credential.cert(ServiceAccount),
});
module.exports = admin;