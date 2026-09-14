const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.join(__dirname, '..', 'backend', '.env') });

const uri = process.env.MONGO_URI;

async function runTestScoreImport() {
  console.log('--- STARTING SAFE TESTSCORES DATASET IMPORT ---');
  let previousCount = 0;
  let insertedCount = 0;
  let duplicateCount = 0;
  let invalidUserIdCount = 0;
  let missingFieldCount = 0;

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log('Connected to MongoDB Atlas successfully.');

    const db = mongoose.connection.db;
    const testScoresCol = db.collection('testscores');
    const usersCol = db.collection('users');

    // 1. Previous Count Check
    previousCount = await testScoresCol.countDocuments();
    console.log(`Previous 'testscores' collection count: ${previousCount}`);

    // Load dataset file
    const datasetPath = path.join(__dirname, '..', 'dataset', 'test_scores.json');
    const testScoresData = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));
    console.log(`Loaded ${testScoresData.length} records from dataset/test_scores.json.`);

    // Convert date string to Date objects
    const docsToInsert = testScoresData.map(doc => ({
      ...doc,
      createdAt: doc.createdAt ? new Date(doc.createdAt) : new Date()
    }));

    // 2. Safe Import
    if (previousCount === 0) {
      console.log(`Inserting all ${docsToInsert.length} records into 'testscores'...`);
      const insertRes = await testScoresCol.insertMany(docsToInsert, { ordered: false });
      insertedCount = insertRes.insertedCount;
      console.log(`Successfully inserted ${insertedCount} test score documents.`);
    } else {
      console.log('Collection already has records. Checking for duplicates...');
      try {
        const insertRes = await testScoresCol.insertMany(docsToInsert, { ordered: false });
        insertedCount = insertRes.insertedCount;
      } catch (err) {
        if (err.insertedCount !== undefined) {
          insertedCount = err.insertedCount;
          duplicateCount = docsToInsert.length - insertedCount;
          console.log(`Inserted ${insertedCount} new test scores. Detected ${duplicateCount} duplicate skips.`);
        } else {
          throw err;
        }
      }
    }

    // 3. Final Count & Detailed Verification
    console.log('\n--- VERIFICATION CHECKS ---');
    const finalCount = await testScoresCol.countDocuments();
    console.log(`Final 'testscores' collection count: ${finalCount}`);

    // Fetch all user IDs for FK verification
    const allUsers = await usersCol.find({}, { projection: { _id: 1 } }).toArray();
    const validUserIds = new Set(allUsers.map(u => u._id));

    // Fetch all test scores for thorough audit
    const allTestScores = await testScoresCol.find({}).toArray();

    const validTestTypes = new Set([
      '40-Yard Dash',
      'Cone Drill',
      'Jumps',
      'Situps',
      'Complete Athletic Assessment'
    ]);

    const seenIds = new Set();
    let invalidTestTypes = 0;

    allTestScores.forEach(t => {
      // Check ID uniqueness
      if (seenIds.has(t._id)) duplicateCount++;
      seenIds.add(t._id);

      // Check User ID validity
      if (!t.userId || !validUserIds.has(t.userId)) {
        invalidUserIdCount++;
      }

      // Check required fields
      if (!t.athleteName || !t.testType || t.score === undefined || !t.date) {
        missingFieldCount++;
      }

      // Check valid test types
      if (!validTestTypes.has(t.testType)) {
        invalidTestTypes++;
      }
    });

    const isPass = (
      finalCount === 2340 &&
      invalidUserIdCount === 0 &&
      missingFieldCount === 0 &&
      invalidTestTypes === 0 &&
      duplicateCount === 0
    );

    console.log(`Previous TestScores Count: ${previousCount}`);
    console.log(`Records Inserted: ${insertedCount}`);
    console.log(`Final TestScores Count: ${finalCount}`);
    console.log(`Duplicate Count: ${duplicateCount}`);
    console.log(`Invalid UserId Count: ${invalidUserIdCount}`);
    console.log(`Missing Required Field Count: ${missingFieldCount}`);
    console.log(`Invalid Test Types Count: ${invalidTestTypes}`);
    console.log(`OVERALL VERIFICATION: ${isPass ? 'PASS' : 'FAIL'}`);

    await mongoose.disconnect();
  } catch (err) {
    console.error('CRITICAL IMPORT ERROR:', err.message);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
}

runTestScoreImport();
