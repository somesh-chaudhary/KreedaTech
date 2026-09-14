const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({ path: path.join(__dirname, '..', 'backend', '.env') });

console.log('--- MONGO ENVIRONMENT CHECK ---');
console.log('process.env.MONGO_URI defined:', !!process.env.MONGO_URI);

const mongoUri = process.env.MONGO_URI;

if (!mongoUri) {
  console.log('Status: NO_CONFIGURED_MONGO_URI');
  process.exit(0);
}

const isAtlas = mongoUri.startsWith('mongodb+srv://');
const isLocal = mongoUri.includes('127.0.0.1') || mongoUri.includes('localhost');

console.log('Detected Type:', isAtlas ? 'MongoDB Atlas' : (isLocal ? 'Local MongoDB' : 'Custom Remote MongoDB'));

mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 })
  .then(() => {
    console.log('Connection Result: SUCCESS');
    mongoose.disconnect();
  })
  .catch(err => {
    console.log('Connection Result: FAILED');
    console.log('Error message:', err.message);
  });
