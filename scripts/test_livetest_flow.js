const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', 'backend', '.env') });

const TestScore = require('../backend/models/TestScore');
const UserProfile = require('../backend/models/UserProfile');

async function testLiveTestFlow() {
  console.log('--- STARTING LIVETEST END-TO-END FLOW VERIFICATION ---');

  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000 });
  console.log('Connected to MongoDB Atlas.');

  const db = mongoose.connection.db;
  const testScoresCol = db.collection('testscores');

  const initialCount = await testScoresCol.countDocuments();
  console.log(`Initial 'testscores' collection count: ${initialCount}`);

  // Simulate LiveTest execution payload for 40-Yard Dash
  const testId = `tscore_live_${Date.now()}`;
  const livePayload = {
    _id: testId,
    userId: 'usr_0001',
    athleteName: 'Priya Sharma',
    testType: '40-Yard Dash',
    score: 965,
    percentageScore: 96.5,
    rawPerformanceValue: '4.4s',
    repetitions: null,
    durationSeconds: 8,
    xpEarned: 338,
    performanceCategory: 'Elite',
    date: new Date().toISOString().split('T')[0],
    createdAt: new Date()
  };

  console.log('\n1. Submitting LiveTest result to MongoDB Atlas...');
  const newScore = new TestScore(livePayload);
  await newScore.save();
  console.log(`Saved LiveTest score document ID: ${newScore._id}`);

  // 2. Verify MongoDB Document
  const postCount = await testScoresCol.countDocuments();
  console.log(`Updated 'testscores' collection count: ${postCount}`);

  const savedDoc = await testScoresCol.findOne({ _id: testId });
  console.log('Saved Document Verification:', {
    _id: savedDoc._id,
    athleteName: savedDoc.athleteName,
    testType: savedDoc.testType,
    score: savedDoc.score,
    rawPerformanceValue: savedDoc.rawPerformanceValue,
    category: savedDoc.performanceCategory
  });

  // 3. Verify API Reflection across HomeScreen, Leaderboard, Analytics
  const testRoutes = require('../backend/routes/testRoutes');
  const app = express();
  app.use(express.json());
  app.use('/api/tests', testRoutes);
  app.use('/api/leaderboard', testRoutes);
  app.use('/api/analytics', testRoutes);

  const server = app.listen(5002, async () => {
    const http = require('http');

    function getJson(urlPath) {
      return new Promise((resolve, reject) => {
        http.get(`http://localhost:5002${urlPath}`, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => resolve(JSON.parse(data)));
        }).on('error', reject);
      });
    }

    // Recent Tests Check
    const recentRes = await getJson('/api/tests/recent/usr_0001?limit=5');
    console.log('\n2. HomeScreen Recent Tests Verification:');
    console.log('Latest Recent Test:', recentRes.data[0]?.testType, 'Score:', recentRes.data[0]?.score);

    // Leaderboard Check
    const lbRes = await getJson('/api/leaderboard?view=National&limit=520');
    console.log('\n3. Leaderboard Reflection Verification:');
    const userInLb = lbRes.data.find(a => a.userId === 'usr_0001');
    console.log('User Leaderboard Rank:', userInLb?.rank, 'Name:', userInLb?.name, 'Score:', userInLb?.score);

    // Analytics Check
    const analyticsRes = await getJson('/api/analytics/usr_0001');
    console.log('\n4. Analytics Reflection Verification:');
    console.log('Updated Stats:', analyticsRes.stats);

    const flowPass = (
      postCount === initialCount + 1 &&
      savedDoc &&
      recentRes.data[0]?.score === 965 &&
      userInLb &&
      userInLb.score === 965 &&
      analyticsRes.stats.bestScore === 965
    );

    console.log('\n=========================================================');
    console.log(`LIVETEST PHASE 1 END-TO-END FLOW: ${flowPass ? 'PASS (100% VERIFIED)' : 'FAIL'}`);
    console.log('=========================================================');

    // Clean up test document
    await TestScore.deleteOne({ _id: testId });
    console.log('Cleaned up test document.');

    server.close();
    await mongoose.disconnect();
    process.exit(0);
  });
}

testLiveTestFlow();
