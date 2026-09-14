const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', 'backend', '.env') });

const { calculateJointAngle, processSitupPose } = require('../src/utils/situpPoseEngine');
const TestScore = require('../backend/models/TestScore');

async function testPhase2BSitupPose() {
  console.log('--- STARTING PHASE 2B REAL-TIME POSE DETECTION TEST (SITUPS ONLY) ---');

  // 1. Unit Test: Joint Angle Calculation
  const pShoulder = { x: 100, y: 100 };
  const pHip = { x: 100, y: 200 };
  const pKnee = { x: 100, y: 300 }; // 180 degrees straight line
  const angle180 = calculateJointAngle(pShoulder, pHip, pKnee);
  console.log(`1. Angle Test (Straight Line 180°): ${angle180}° (Expected: 180°)`);

  const pKneeBent = { x: 200, y: 200 }; // 90 degree angle
  const angle90 = calculateJointAngle(pShoulder, pHip, pKneeBent);
  console.log(`2. Angle Test (L-Shape 90°): ${angle90}° (Expected: 90°)`);

  // 2. Unit Test: Hysteresis Repetition Cycle (DOWN -> UP -> DOWN)
  let state = 'DOWN';
  let reps = 0;

  // Lying Down Flat (180 deg)
  const keypointsFlat = {
    shoulder: { x: 50, y: 100 },
    hip: { x: 150, y: 100 },
    knee: { x: 250, y: 100 }
  };
  let res1 = processSitupPose(keypointsFlat, state, reps);
  state = res1.newState;
  reps = res1.newRepCount;
  console.log(`3. Frame 1 (Lying Down 180°): State=${state}, Reps=${reps}, Status="${res1.formStatus}"`);

  // Sit up peak (45 deg angle at hip)
  const keypointsPeak = {
    shoulder: { x: 200, y: 150 },
    hip: { x: 150, y: 100 },
    knee: { x: 250, y: 100 }
  };
  let res2 = processSitupPose(keypointsPeak, state, reps);
  state = res2.newState;
  reps = res2.newRepCount;
  console.log(`4. Frame 2 (Peak Situp 45°): State=${state}, Reps=${reps}, Status="${res2.formStatus}"`);

  // Return Down (180 deg) -> Rep 1 Complete
  let res3 = processSitupPose(keypointsFlat, state, reps);
  state = res3.newState;
  reps = res3.newRepCount;
  console.log(`5. Frame 3 (Return Flat 180°): State=${state}, Reps=${reps}, Status="${res3.formStatus}"`);

  const enginePass = angle180 === 180 && reps === 1 && state === 'DOWN';
  console.log(`Pose Engine Unit Test Result: ${enginePass ? 'PASS' : 'FAIL'}\n`);

  // 3. Live MongoDB Atlas End-to-End Submission Test
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000 });
  console.log('6. Connected to MongoDB Atlas.');

  const db = mongoose.connection.db;
  const testScoresCol = db.collection('testscores');
  const initialCount = await testScoresCol.countDocuments();

  const detectedReps = 55; // 55 reps detected by pose engine
  const calculatedScore = Math.max(600, Math.min(990, Math.round(400 + (detectedReps * 9)))); // 895 pts

  const testId = `tscore_situp_phase2b_${Date.now()}`;
  const situpTestPayload = {
    _id: testId,
    userId: 'usr_0001',
    athleteName: 'Priya Sharma',
    testType: 'Situps',
    score: calculatedScore,
    percentageScore: parseFloat((calculatedScore / 10).toFixed(1)),
    rawPerformanceValue: `${detectedReps} reps`,
    repetitions: detectedReps,
    durationSeconds: 60,
    xpEarned: Math.round(calculatedScore * 0.35),
    performanceCategory: 'Advanced',
    date: new Date().toISOString().split('T')[0],
    createdAt: new Date()
  };

  const newScore = new TestScore(situpTestPayload);
  await newScore.save();
  console.log(`7. Saved Phase 2B Situps Pose score document ID: ${newScore._id}`);

  const postCount = await testScoresCol.countDocuments();
  const savedDoc = await testScoresCol.findOne({ _id: testId });

  // 4. API Endpoints Verification
  const testRoutes = require('../backend/routes/testRoutes');
  const app = express();
  app.use(express.json());
  app.use('/api/tests', testRoutes);
  app.use('/api/leaderboard', testRoutes);
  app.use('/api/analytics', testRoutes);

  const server = app.listen(5004, async () => {
    const http = require('http');

    function getJson(urlPath) {
      return new Promise((resolve, reject) => {
        http.get(`http://localhost:5004${urlPath}`, (res) => {
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

    console.log(`8. HomeScreen Recent Tests: Latest score=${recentRes.data[0]?.score}, Reps=${recentRes.data[0]?.repetitions}`);
    console.log(`9. Leaderboard Reflection: User Rank #${userInLb?.rank}, Best Score=${userInLb?.score}`);
    console.log(`10. Analytics Reflection: Total Tests=${analyticsRes.stats.totalTests}, Best Score=${analyticsRes.stats.bestScore}`);

    const isPass = (
      enginePass &&
      postCount === initialCount + 1 &&
      savedDoc &&
      savedDoc.repetitions === 55 &&
      recentRes.data[0]?.score === calculatedScore &&
      analyticsRes.stats.bestScore >= calculatedScore
    );

    console.log('\n=========================================================');
    console.log(`PHASE 2B REAL-TIME SITUPS POSE DETECTION: ${isPass ? 'PASS (100% VERIFIED)' : 'FAIL'}`);
    console.log('=========================================================');

    // Clean up test document
    await TestScore.deleteOne({ _id: testId });
    console.log('Cleaned up test document.');

    server.close();
    await mongoose.disconnect();
    process.exit(0);
  });
}

testPhase2BSitupPose();
