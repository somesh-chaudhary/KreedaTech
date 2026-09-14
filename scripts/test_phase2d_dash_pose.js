const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', 'backend', '.env') });

const { processDashPose } = require('../src/utils/dashPoseEngine');
const TestScore = require('../backend/models/TestScore');

async function testPhase2DDashPose() {
  console.log('--- STARTING PHASE 2D REAL-TIME SPRINT TIMER TEST (40-YARD DASH ONLY) ---');

  // 1. Unit Test: Dash Optical Timer Engine (STANCE_SET -> RUNNING -> FINISHED)
  let state = 'STANCE_SET';
  let startMs = 0;
  const t0 = 100000;

  // Frame 1: Stance Set Crouch (X=100)
  const keypointsStance = { shoulder: { x: 100, y: 200 }, hip: { x: 100, y: 300 } };
  let res1 = processDashPose(keypointsStance, state, startMs, t0, 100);
  state = res1.newState;
  startMs = res1.newStartTimeMs;
  console.log(`1. Frame 1 (3-Point Stance Crouch X=100): State=${state}, Status="${res1.formStatus}"`);

  // Frame 2: Takeoff Motion (X=160, +60px explosion)
  const t1 = t0 + 100;
  const keypointsTakeoff = { shoulder: { x: 160, y: 200 }, hip: { x: 160, y: 300 } };
  let res2 = processDashPose(keypointsTakeoff, state, startMs, t1, 100);
  state = res2.newState;
  startMs = res2.newStartTimeMs;
  console.log(`2. Frame 2 (Takeoff Explosion X=160): State=${state}, Status="${res2.formStatus}"`);

  // Frame 3: Finish Gate Crossing (X=295 >= 280px threshold after 4.62 seconds)
  const t2 = startMs + 4620; // 4.62 seconds later
  const keypointsFinish = { shoulder: { x: 295, y: 200 }, hip: { x: 295, y: 300 } };
  let res3 = processDashPose(keypointsFinish, state, startMs, t2, 100);
  state = res3.newState;
  console.log(`3. Frame 3 (Finish Gate Crossing X=295): State=${state}, Time=${res3.sprintDurationSeconds}s, Status="${res3.formStatus}"`);

  const enginePass = res3.sprintDurationSeconds === 4.62 && state === 'FINISHED' && res3.isSprintFinished;
  console.log(`Dash Optical Timer Unit Test Result: ${enginePass ? 'PASS' : 'FAIL'}\n`);

  // 2. Live MongoDB Atlas End-to-End Submission Test
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000 });
  console.log('4. Connected to MongoDB Atlas.');

  const db = mongoose.connection.db;
  const testScoresCol = db.collection('testscores');
  const initialCount = await testScoresCol.countDocuments();

  const sprintTime = 4.62; // 4.62 seconds measured by optical gate
  const calculatedScore = Math.max(600, Math.min(990, Math.round(1100 - (sprintTime * 50)))); // 869 pts

  const testId = `tscore_dash_phase2d_${Date.now()}`;
  const dashTestPayload = {
    _id: testId,
    userId: 'usr_0001',
    athleteName: 'Priya Sharma',
    testType: '40-Yard Dash',
    score: calculatedScore,
    percentageScore: parseFloat((calculatedScore / 10).toFixed(1)),
    rawPerformanceValue: `${sprintTime}s (Optical Gate Time)`,
    repetitions: null,
    durationSeconds: sprintTime,
    xpEarned: Math.round(calculatedScore * 0.35),
    performanceCategory: 'Advanced',
    date: new Date().toISOString().split('T')[0],
    createdAt: new Date()
  };

  const newScore = new TestScore(dashTestPayload);
  await newScore.save();
  console.log(`5. Saved Phase 2D Dash Pose score document ID: ${newScore._id}`);

  const postCount = await testScoresCol.countDocuments();
  const savedDoc = await testScoresCol.findOne({ _id: testId });

  // 3. API Endpoints Verification
  const testRoutes = require('../backend/routes/testRoutes');
  const app = express();
  app.use(express.json());
  app.use('/api/tests', testRoutes);
  app.use('/api/leaderboard', testRoutes);
  app.use('/api/analytics', testRoutes);

  const server = app.listen(5006, async () => {
    const http = require('http');

    function getJson(urlPath) {
      return new Promise((resolve, reject) => {
        http.get(`http://localhost:5006${urlPath}`, (res) => {
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

    console.log(`6. HomeScreen Recent Tests: Latest score=${recentRes.data[0]?.score}, Metric="${recentRes.data[0]?.rawPerformanceValue}"`);
    console.log(`7. Leaderboard Reflection: User Rank #${userInLb?.rank}, Best Score=${userInLb?.score}`);
    console.log(`8. Analytics Reflection: Total Tests=${analyticsRes.stats.totalTests}, Best Score=${analyticsRes.stats.bestScore}`);

    const isPass = (
      enginePass &&
      postCount === initialCount + 1 &&
      savedDoc &&
      savedDoc.score === calculatedScore &&
      recentRes.data[0]?.score === calculatedScore &&
      analyticsRes.stats.bestScore >= calculatedScore
    );

    console.log('\n=========================================================');
    console.log(`PHASE 2D 40-YARD DASH OPTICAL SPRINT TIMER: ${isPass ? 'PASS (100% VERIFIED)' : 'FAIL'}`);
    console.log('=========================================================');

    // Clean up test document
    await TestScore.deleteOne({ _id: testId });
    console.log('Cleaned up test document.');

    server.close();
    await mongoose.disconnect();
    process.exit(0);
  });
}

testPhase2DDashPose();
