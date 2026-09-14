const http = require('http');
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', 'backend', '.env') });

async function verifyFrontendIntegration() {
  console.log('--- TESTING FRONTEND API INTEGRATION ---');

  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000 });
  console.log('MongoDB Atlas Connected.');

  const testRoutes = require('../backend/routes/testRoutes');
  const app = express();
  app.use(express.json());
  app.use('/api/tests', testRoutes);
  app.use('/api/leaderboard', testRoutes);
  app.use('/api/analytics', testRoutes);

  const server = app.listen(5000, async () => {
    console.log('Express Backend Server listening on http://localhost:5000\n');

    function fetchUrl(urlPath) {
      return new Promise((resolve, reject) => {
        http.get(`http://localhost:5000${urlPath}`, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try {
              resolve({ status: res.statusCode, body: JSON.parse(data) });
            } catch (e) {
              resolve({ status: res.statusCode, body: data });
            }
          });
        }).on('error', reject);
      });
    }

    try {
      // 1. HomeScreen API Test
      console.log('1. Testing HomeScreen API Call (/api/tests/recent/usr_0001)...');
      const homeRes = await fetchUrl('/api/tests/recent/usr_0001?limit=5');
      console.log(`Status: ${homeRes.status} | Returned ${homeRes.body.count || 0} recent tests.`);
      const homePass = homeRes.status === 200 && Array.isArray(homeRes.body.data) && homeRes.body.data.length > 0;
      console.log(`HomeScreen API Status: ${homePass ? 'PASS' : 'FAIL'}\n`);

      // 2. Leaderboard Screen API Test (National)
      console.log('2. Testing Leaderboard Screen API Call (/api/leaderboard?view=National)...');
      const lbNatRes = await fetchUrl('/api/leaderboard?view=National&limit=20');
      console.log(`Status: ${lbNatRes.status} | Total Athletes: ${lbNatRes.body.totalCount}`);
      console.log(`Rank 1 Athlete: ${lbNatRes.body.data?.[0]?.name} (${lbNatRes.body.data?.[0]?.score} pts)`);
      const lbNatPass = lbNatRes.status === 200 && Array.isArray(lbNatRes.body.data) && lbNatRes.body.data.length > 0;
      console.log(`Leaderboard National API Status: ${lbNatPass ? 'PASS' : 'FAIL'}\n`);

      // 3. Leaderboard Screen API Test (Local)
      console.log('3. Testing Leaderboard Screen API Call (/api/leaderboard?view=Local)...');
      const lbLocRes = await fetchUrl('/api/leaderboard?view=Local&city=Bangalore&limit=20');
      console.log(`Status: ${lbLocRes.status} | Filtered Local Count: ${lbLocRes.body.totalCount}`);
      const lbLocPass = lbLocRes.status === 200 && Array.isArray(lbLocRes.body.data);
      console.log(`Leaderboard Local API Status: ${lbLocPass ? 'PASS' : 'FAIL'}\n`);

      // 4. Analytics Screen API Test (/api/analytics/usr_0001)
      console.log('4. Testing Analytics Screen API Call (/api/analytics/usr_0001)...');
      const analyticsRes = await fetchUrl('/api/analytics/usr_0001');
      console.log(`Status: ${analyticsRes.status} | Athlete Name: ${analyticsRes.body.userProfile?.name}`);
      console.log(`Total Tests: ${analyticsRes.body.stats?.totalTests} | Best Score: ${analyticsRes.body.stats?.bestScore}`);
      console.log(`Chart Labels (${analyticsRes.body.chartData?.labels?.length}):`, analyticsRes.body.chartData?.labels);
      const analyticsPass = analyticsRes.status === 200 && analyticsRes.body.stats?.totalTests > 0;
      console.log(`Analytics Screen API Status: ${analyticsPass ? 'PASS' : 'FAIL'}\n`);

      const allPass = homePass && lbNatPass && lbLocPass && analyticsPass;
      console.log('=========================================================');
      console.log(`FRONTEND API INTEGRATION VERIFICATION: ${allPass ? 'PASS (100% VERIFIED)' : 'FAIL'}`);
      console.log('=========================================================');

      server.close();
      await mongoose.disconnect();
      process.exit(0);
    } catch (err) {
      console.error('Integration test error:', err);
      server.close();
      await mongoose.disconnect();
      process.exit(1);
    }
  });
}

verifyFrontendIntegration();
