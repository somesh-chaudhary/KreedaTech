const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '..', 'backend', '.env') });
const TestScore = require('../backend/models/TestScore');

async function debugLb() {
  await mongoose.connect(process.env.MONGO_URI);
  const found = await TestScore.find({ userId: 'usr_0001' });
  console.log('TestScores for usr_0001 count:', found.length);
  if (found.length > 0) {
    console.log('Sample for usr_0001:', found[0]);
  }
  await mongoose.disconnect();
}
debugLb();
