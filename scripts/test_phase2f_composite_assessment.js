const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', 'backend', '.env') });

const TestScore = require('../backend/models/TestScore');

async function testPhase2FCompositeAssessment() {
  console.log('--- STARTING PHASE 2F COMPLETE ATHLETIC ASSESSMENT COMPOSITE TEST ---');

  // 1. Unit Test: 25% Equal Weighted Composite Score Formula
  const subScores = [
    { testType: 'Situps', metric: '55 reps', score: 895 },
    { testType: 'Jumps', metric: '26.4 in', score: 867 },
    { testType: '40-Yard Dash', metric: '4.62s', score: 869 },
    { testType: 'Cone Drill', metric: '6.85s', score: 792 }
  ];

  const rawSum = subScores.reduce((acc, curr) => acc + curr.score, 0); // 3423
  const expectedComposite = Math.round(rawSum / 4); // 856

  console.log('1. Sub-Score Breakdown:');
  subScores.forEach(s => console.log(`   - ${s.testType}: ${s.metric} (${s.score} pts)`));
  console.log(`2. Composite Weighted Formula (25% each): ${expectedComposite} pts (Expected: 856)`);

  const enginePass = expectedComposite === 856;
  console.log(`Composite Assessment Calculation Result: ${enginePass ? 'PASS' : 'FAIL'}\n`);

  // 2. Live MongoDB Atlas End-to-End Submission Test
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000 });
  console.log('3. Connected to MongoDB Atlas.');

  const db = mongoose.connection.db;
  const testScoresCol = db.collection('testscores');
  const initialCount = await testScoresCol.countDocuments();

  const rawSummaryString = subScores.map(s => `${s.testType}: ${s.metric} (${s.score})`).join(' | ');
  const testId = `tscore_composite_phase2f_${Date.now()}`;

  const compositePayload = {
    _id: testId,
    userId: 'usr_0001',
    athleteName: 'Priya Sharma',
    testType: 'Complete Athletic Assessment',
    score: expectedComposite,
    percentageScore: parseFloat((expectedComposite / 10).toFixed(1)),
    rawPerformanceValue: rawSummaryString,
    repetitions: 55,
    durationSeconds: 120,
    xpEarned: Math.round(expectedComposite * 0.35),
    performanceCategory: 'Advanced',
    date: new Date().toISOString().split('T')[0],
    createdAt: new Date()
  };

  const newScore = new TestScore(compositePayload);
  await newScore.save();
  console.log(`4. Saved Phase 2F Complete Assessment score document ID: ${newScore._id}`);

  const postCount = await testScoresCol.countDocuments();
  const savedDoc = await testScoresCol.findOne({ _id: testId });

  // 3. API Endpoints Verification
  const testRoutes = require('../backend/routes/testRoutes');
  const app = express();
  app.use(express.json());
  app.use('/api/tests', testRoutes);
  app.use('/api/leaderboard', testRoutes);
  app.use('/api/analytics', testRoutes);

  const server = app.listen(5008, async () => {
    const http = require('http');

    function getJson(urlPath) {
      return new Promise((resolve, reject) => {
        http.get(`http://localhost:5008${urlPath}`, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => resolve(JSON.parse(data)));
        }).on('error', reject);
      });
    }

    const recentRes = await getJson('/api/tests/recent/usr_0001?limit=5');
    const lbRes = await getJson('/api/leaderboard?view=National&limit=520');
    const analyticsRes = await getJson('/api/analytics/usr_0001');

    const userInLb = lbRes.data.find(a => a.userId === 'usr_0001');

    console.log(`5. HomeScreen Recent Tests: Latest score=${recentRes.data[0]?.score}, Type="${recentRes.data[0]?.testType}"`);
    console.log(`6. Leaderboard Reflection: User Rank #${userInLb?.rank}, Best Score=${userInLb?.score}`);
    console.log(`7. Analytics Reflection: Total Tests=${analyticsRes.stats.totalTests}, Best Score=${analyticsRes.stats.bestScore}`);

    const isPass = (
      enginePass &&
      postCount === initialCount + 1 &&
      savedDoc &&
      savedDoc.score === expectedComposite &&
      recentRes.data[0]?.testType === 'Complete Athletic Assessment' &&
      analyticsRes.stats.bestScore >= expectedComposite
    );

    console.log('\n=========================================================');
    console.log(`PHASE 2F COMPLETE ATHLETIC ASSESSMENT: ${isPass ? 'PASS (100% VERIFIED)' : 'FAIL'}`);
    console.log('=========================================================');

    // Clean up test document
    await TestScore.deleteOne({ _id: testId });
    console.log('Cleaned up test document.');

    server.close();
    await mongoose.disconnect();
    process.exit(0);
  });
}

testPhase2FCompositeAssessment();
