const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', 'backend', '.env') });

const uri = process.env.MONGO_URI;

console.log('Testing Mongoose connect to Atlas...');

mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 })
  .then(() => {
    console.log('STATUS: SUCCESS');
    mongoose.disconnect();
  })
  .catch(err => {
    console.log('STATUS: FAILED');
    console.log('Error Code:', err.code);
    console.log('Error Name:', err.name);
    console.log('Error Message:', err.message);
  });
