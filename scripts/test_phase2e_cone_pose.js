const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', 'backend', '.env') });

const { processConePose } = require('../src/utils/conePoseEngine');
const TestScore = require('../backend/models/TestScore');

async function testPhase2EConePose() {
  console.log('--- STARTING PHASE 2E REAL-TIME CONE DRILL AGILITY ENGINE TEST ---');

  // 1. Unit Test: Cone Agility Directional State Engine
  let state = 'READY';
  let turns = 0;
  let startMs = 0;
  const t0 = 100000;

  // Frame 1: Ready at Start Cone (X=100)
  const keypointsStart = { hip: { x: 100, y: 300 }, ankle: { x: 100, y: 420 } };
  let res1 = processConePose(keypointsStart, state, turns, startMs, t0);
  state = res1.newState;
  turns = res1.newTurns;
  startMs = res1.newStartTimeMs;
  console.log(`1. Frame 1 (Ready at Start Cone X=100): State=${state}, Turns=${turns}, Status="${res1.formStatus}"`);

  // Frame 2: Outbound Sprint (X=175)
  const t1 = t0 + 500;
  const keypointsOutbound = { hip: { x: 175, y: 300 }, ankle: { x: 175, y: 420 } };
  let res2 = processConePose(keypointsOutbound, state, turns, startMs, t1);
  state = res2.newState;
  turns = res2.newTurns;
  startMs = res2.newStartTimeMs;
  console.log(`2. Frame 2 (Outbound Sprint X=175): State=${state}, Turns=${turns}, Status="${res2.formStatus}"`);

  // Frame 3: Turnaround at Cone 1 (X=265 >= 250px)
  const t2 = startMs + 3200;
  const keypointsTurn = { hip: { x: 265, y: 300 }, ankle: { x: 265, y: 420 } };
  let res3 = processConePose(keypointsTurn, state, turns, startMs, t2);
  state = res3.newState;
  turns = res3.newTurns;
  console.log(`3. Frame 3 (Turn 1 Executed X=265): State=${state}, Turns=${turns}, Status="${res3.formStatus}"`);

  // Frame 4: Return Sprint (X=200)
  const t3 = startMs + 4500;
  const keypointsReturn = { hip: { x: 200, y: 300 }, ankle: { x: 200, y: 420 } };
  let res4 = processConePose(keypointsReturn, state, turns, startMs, t3);
  state = res4.newState;
  turns = res4.newTurns;
  console.log(`4. Frame 4 (Return Sprint X=200): State=${state}, Turns=${turns}, Status="${res4.formStatus}"`);

  // Frame 5: Return Finish Pass (X=110 <= 120px after 6.85 seconds)
  const t4 = startMs + 6850;
  let res5 = processConePose(keypointsStart, state, turns, startMs, t4);
  state = res5.newState;
  turns = res5.newTurns;
  console.log(`5. Frame 5 (Finish Gate Pass X=110): State=${state}, Turns=${turns}, Time=${res5.drillDurationSeconds}s, Status="${res5.formStatus}"`);

  const enginePass = res5.drillDurationSeconds === 6.85 && turns === 2 && state === 'FINISH' && res5.isDrillFinished;
  console.log(`Cone Drill Agility Engine Unit Test Result: ${enginePass ? 'PASS' : 'FAIL'}\n`);

  // 2. Live MongoDB Atlas End-to-End Submission Test
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000 });
  console.log('6. Connected to MongoDB Atlas.');

  const db = mongoose.connection.db;
  const testScoresCol = db.collection('testscores');
  const initialCount = await testScoresCol.countDocuments();

  const drillTime = 6.85; // 6.85 seconds measured by optical agility gate
  const calculatedScore = Math.max(600, Math.min(980, Math.round(1100 - (drillTime * 45)))); // 792 pts

  const testId = `tscore_cone_phase2e_${Date.now()}`;
  const coneTestPayload = {
    _id: testId,
    userId: 'usr_0001',
    athleteName: 'Priya Sharma',
    testType: 'Cone Drill',
    score: calculatedScore,
    percentageScore: parseFloat((calculatedScore / 10).toFixed(1)),
    rawPerformanceValue: `${drillTime}s (Optical Agility Drill Time)`,
    repetitions: null,
    durationSeconds: drillTime,
    xpEarned: Math.round(calculatedScore * 0.35),
    performanceCategory: 'Intermediate',
    date: new Date().toISOString().split('T')[0],
    createdAt: new Date()
  };

  const newScore = new TestScore(coneTestPayload);
  await newScore.save();
  console.log(`7. Saved Phase 2E Cone Pose score document ID: ${newScore._id}`);

  const postCount = await testScoresCol.countDocuments();
  const savedDoc = await testScoresCol.findOne({ _id: testId });

  // 3. API Endpoints Verification
  const testRoutes = require('../backend/routes/testRoutes');
  const app = express();
  app.use(express.json());
  app.use('/api/tests', testRoutes);
  app.use('/api/leaderboard', testRoutes);
  app.use('/api/analytics', testRoutes);

  const server = app.listen(5007, async () => {
    const http = require('http');

    function getJson(urlPath) {
      return new Promise((resolve, reject) => {
        http.get(`http://localhost:5007${urlPath}`, (res) => {
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

    console.log(`8. HomeScreen Recent Tests: Latest score=${recentRes.data[0]?.score}, Metric="${recentRes.data[0]?.rawPerformanceValue}"`);
    console.log(`9. Leaderboard Reflection: User Rank #${userInLb?.rank}, Best Score=${userInLb?.score}`);
    console.log(`10. Analytics Reflection: Total Tests=${analyticsRes.stats.totalTests}, Best Score=${analyticsRes.stats.bestScore}`);

    const isPass = (
      enginePass &&
      postCount === initialCount + 1 &&
      savedDoc &&
      savedDoc.score === calculatedScore &&
      recentRes.data[0]?.score === calculatedScore &&
      analyticsRes.stats.bestScore >= calculatedScore
    );

    console.log('\n=========================================================');
    console.log(`PHASE 2E CONE DRILL AGILITY ENGINE: ${isPass ? 'PASS (100% VERIFIED)' : 'FAIL'}`);
    console.log('=========================================================');

    // Clean up test document
    await TestScore.deleteOne({ _id: testId });
    console.log('Cleaned up test document.');

    server.close();
    await mongoose.disconnect();
    process.exit(0);
  });
}

testPhase2EConePose();
