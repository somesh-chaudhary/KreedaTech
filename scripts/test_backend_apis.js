const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', 'backend', '.env') });

const TestScore = require('../backend/models/TestScore');
const UserProfile = require('../backend/models/UserProfile');

async function testBackendAPIs() {
  console.log('--- STARTING BACKEND API VERIFICATION TESTS ---');

  try {
    // Connect to MongoDB Atlas with 15s timeout
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000 });
    console.log('Connected to MongoDB Atlas for verification tests.\n');

    const testRoutes = require('../backend/routes/testRoutes');
    const app = express();
    app.use(express.json());
    app.use('/api/tests', testRoutes);
    app.use('/api/leaderboard', testRoutes);
    app.use('/api/analytics', testRoutes);

    const server = app.listen(5001, async () => {
      console.log('Test Express server started on port 5001.\n');

      try {
        const http = require('http');

        function makeRequest(method, reqPath, body = null) {
          return new Promise((resolve, reject) => {
            const options = {
              hostname: 'localhost',
              port: 5001,
              path: reqPath,
              method: method,
              headers: {
                'Content-Type': 'application/json'
              }
            };

            const req = http.request(options, (res) => {
              let data = '';
              res.on('data', chunk => data += chunk);
              res.on('end', () => {
                try {
                  resolve({ statusCode: res.statusCode, body: JSON.parse(data) });
                } catch (e) {
                  resolve({ statusCode: res.statusCode, body: data });
                }
              });
            });

            req.on('error', reject);
            if (body) req.write(JSON.stringify(body));
            req.end();
          });
        }

        // 1. Test POST /api/tests/submit
        console.log('1. Testing POST /api/tests/submit...');
        const submitPayload = {
          userId: 'usr_0001',
          athleteName: 'Anirudh Singh',
          testType: 'Situps',
          score: 920,
          percentageScore: 92.0,
          rawPerformanceValue: '62 reps',
          repetitions: 62,
          durationSeconds: 60,
          xpEarned: 350,
          performanceCategory: 'Elite',
          date: new Date().toISOString().split('T')[0]
        };
        const submitRes = await makeRequest('POST', '/api/tests/submit', submitPayload);
        console.log(`POST /api/tests/submit Status: ${submitRes.statusCode}`);
        console.log('Submitted Data ID:', submitRes.body.data?._id);
        const submitPass = submitRes.statusCode === 201 && submitRes.body.data?.score === 920;
        console.log(`Result: ${submitPass ? 'PASS' : 'FAIL'}\n`);

        // 2. Test GET /api/tests/recent/:userId
        console.log('2. Testing GET /api/tests/recent/usr_0001...');
        const recentRes = await makeRequest('GET', '/api/tests/recent/usr_0001?limit=5');
        console.log(`GET /api/tests/recent/usr_0001 Status: ${recentRes.statusCode}`);
        console.log(`Returned ${recentRes.body.count || 0} recent tests.`);
        const recentPass = recentRes.statusCode === 200 && Array.isArray(recentRes.body.data) && recentRes.body.data.length > 0;
        console.log(`Result: ${recentPass ? 'PASS' : 'FAIL'}\n`);

        // 3. Test GET /api/leaderboard (National View)
        console.log('3. Testing GET /api/leaderboard (National View)...');
        const nationalLbRes = await makeRequest('GET', '/api/leaderboard?view=National&limit=5');
        console.log(`GET /api/leaderboard Status: ${nationalLbRes.statusCode}`);
        console.log('Top Athlete #1:', nationalLbRes.body.data?.[0]?.name, 'Score:', nationalLbRes.body.data?.[0]?.score);
        const nationalPass = nationalLbRes.statusCode === 200 && nationalLbRes.body.data?.[0]?.rank === 1;
        console.log(`Result: ${nationalPass ? 'PASS' : 'FAIL'}\n`);

        // 4. Test GET /api/leaderboard (Local View - Bangalore)
        console.log('4. Testing GET /api/leaderboard (Local View - Bangalore)...');
        const localLbRes = await makeRequest('GET', '/api/leaderboard?view=Local&city=Bangalore&limit=5');
        console.log(`GET /api/leaderboard (Local) Status: ${localLbRes.statusCode}`);
        console.log('Local Top Athlete #1:', localLbRes.body.data?.[0]?.name, 'City:', localLbRes.body.data?.[0]?.city);
        const localPass = localLbRes.statusCode === 200 && Array.isArray(localLbRes.body.data);
        console.log(`Result: ${localPass ? 'PASS' : 'FAIL'}\n`);

        // 5. Test GET /api/analytics/:userId
        console.log('5. Testing GET /api/analytics/usr_0001...');
        const analyticsRes = await makeRequest('GET', '/api/analytics/usr_0001');
        console.log(`GET /api/analytics/usr_0001 Status: ${analyticsRes.statusCode}`);
        console.log('User Stats:', analyticsRes.body.stats);
        console.log('Chart Labels:', analyticsRes.body.chartData?.labels);
        const analyticsPass = analyticsRes.statusCode === 200 && analyticsRes.body.stats?.totalTests > 0;
        console.log(`Result: ${analyticsPass ? 'PASS' : 'FAIL'}\n`);

        const allPass = submitPass && recentPass && nationalPass && localPass && analyticsPass;
        console.log('---------------------------------------------------------');
        console.log(`ALL API TESTS VERIFICATION: ${allPass ? 'PASS (100% WORKING)' : 'FAIL'}`);
        console.log('---------------------------------------------------------');

        // Cleanup test submission
        if (submitRes.body.data?._id) {
          await TestScore.deleteOne({ _id: submitRes.body.data._id });
          console.log('Cleaned up verification test submission document.');
        }

        server.close();
        await mongoose.disconnect();
        process.exit(0);
      } catch (e) {
        console.error('Test execution error:', e);
        server.close();
        await mongoose.disconnect();
        process.exit(1);
      }
    });
  } catch (err) {
    console.error('Mongoose Connection Error:', err.message);
    process.exit(1);
  }
}

testBackendAPIs();
