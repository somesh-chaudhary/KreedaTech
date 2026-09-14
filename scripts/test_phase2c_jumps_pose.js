const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', 'backend', '.env') });

const { processJumpPose } = require('../src/utils/jumpPoseEngine');
const TestScore = require('../backend/models/TestScore');

async function testPhase2CJumpsPose() {
  console.log('--- STARTING PHASE 2C REAL-TIME POSE DETECTION TEST (JUMPS ONLY) ---');

  // 1. Unit Test: Hysteresis Jump Cycle (GROUNDED -> AIRBORNE -> GROUNDED)
  let state = 'GROUNDED';
  let jumpCount = 0;
  let baselineY = 300;
  let peak = 0;

  // Frame 1: Standing Grounded (Y=300)
  const keypointsGrounded = { hip: { x: 150, y: 300 }, ankle: { x: 150, y: 420 } };
  let res1 = processJumpPose(keypointsGrounded, state, jumpCount, baselineY, peak);
  state = res1.newState;
  jumpCount = res1.newJumpCount;
  baselineY = res1.newBaselineY;
  peak = res1.newPeak;
  console.log(`1. Frame 1 (Standing Grounded Y=300): State=${state}, Jumps=${jumpCount}, Elevation=${res1.currentDisplacementInches} in, Status="${res1.formStatus}"`);

  // Frame 2: Airborne Peak (Y=245, Delta = 55px ~ 27.5 inches)
  const keypointsAirborne = { hip: { x: 150, y: 245 }, ankle: { x: 150, y: 365 } };
  let res2 = processJumpPose(keypointsAirborne, state, jumpCount, baselineY, peak);
  state = res2.newState;
  jumpCount = res2.newJumpCount;
  baselineY = res2.newBaselineY;
  peak = res2.newPeak;
  console.log(`2. Frame 2 (Airborne Peak Y=245): State=${state}, Jumps=${jumpCount}, Elevation=${res2.currentDisplacementInches} in, Status="${res2.formStatus}"`);

  // Frame 3: Landed Back Grounded (Y=300)
  let res3 = processJumpPose(keypointsGrounded, state, jumpCount, baselineY, peak);
  state = res3.newState;
  jumpCount = res3.newJumpCount;
  baselineY = res3.newBaselineY;
  peak = res3.newPeak;
  console.log(`3. Frame 3 (Landed Grounded Y=300): State=${state}, Jumps=${jumpCount}, Elevation=${res3.currentDisplacementInches} in, Status="${res3.formStatus}"`);

  const enginePass = jumpCount === 1 && peak === 27.5 && state === 'GROUNDED';
  console.log(`Jump Pose Engine Unit Test Result: ${enginePass ? 'PASS' : 'FAIL'}\n`);

  // 2. Live MongoDB Atlas End-to-End Submission Test
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000 });
  console.log('4. Connected to MongoDB Atlas.');

  const db = mongoose.connection.db;
  const testScoresCol = db.collection('testscores');
  const initialCount = await testScoresCol.countDocuments();

  const measuredDisplacement = peak || 27.5; // 27.5 inches equivalent 2D displacement
  const calculatedScore = Math.max(600, Math.min(990, Math.round(550 + (measuredDisplacement * 12)))); // 880 pts

  const testId = `tscore_jump_phase2c_${Date.now()}`;
  const jumpTestPayload = {
    _id: testId,
    userId: 'usr_0001',
    athleteName: 'Priya Sharma',
    testType: 'Jumps',
    score: calculatedScore,
    percentageScore: parseFloat((calculatedScore / 10).toFixed(1)),
    rawPerformanceValue: `${measuredDisplacement} in (2D Relative Peak)`,
    repetitions: jumpCount,
    durationSeconds: 15,
    xpEarned: Math.round(calculatedScore * 0.35),
    performanceCategory: 'Advanced',
    date: new Date().toISOString().split('T')[0],
    createdAt: new Date()
  };

  const newScore = new TestScore(jumpTestPayload);
  await newScore.save();
  console.log(`5. Saved Phase 2C Jumps Pose score document ID: ${newScore._id}`);

  const postCount = await testScoresCol.countDocuments();
  const savedDoc = await testScoresCol.findOne({ _id: testId });

  // 3. API Endpoints Verification
  const testRoutes = require('../backend/routes/testRoutes');
  const app = express();
  app.use(express.json());
  app.use('/api/tests', testRoutes);
  app.use('/api/leaderboard', testRoutes);
  app.use('/api/analytics', testRoutes);

  const server = app.listen(5005, async () => {
    const http = require('http');

    function getJson(urlPath) {
      return new Promise((resolve, reject) => {
        http.get(`http://localhost:5005${urlPath}`, (res) => {
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
    console.log(`PHASE 2C REAL-TIME JUMPS POSE DETECTION: ${isPass ? 'PASS (100% VERIFIED)' : 'FAIL'}`);
    console.log('=========================================================');

    // Clean up test document
    await TestScore.deleteOne({ _id: testId });
    console.log('Cleaned up test document.');

    server.close();
    await mongoose.disconnect();
    process.exit(0);
  });
}

testPhase2CJumpsPose();
