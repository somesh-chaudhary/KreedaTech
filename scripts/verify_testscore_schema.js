const fs = require('fs');
const path = require('path');
const TestScore = require('../backend/models/TestScore');

const datasetPath = path.join(__dirname, '..', 'dataset', 'test_scores.json');
const testScoresData = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));

console.log('--- TESTSCORE SCHEMA VERIFICATION ---');
console.log(`Loaded ${testScoresData.length} records from dataset/test_scores.json.`);

const schemaPaths = Object.keys(TestScore.schema.paths);
console.log('TestScore Schema Paths:', schemaPaths);

// Check sample document keys
const sampleDoc = testScoresData[0];
const sampleKeys = Object.keys(sampleDoc);
console.log('Sample Record Keys:', sampleKeys);

let allKeysMatch = true;
sampleKeys.forEach(key => {
  if (key === '_id') return;
  const isPresent = schemaPaths.includes(key);
  if (!isPresent) {
    console.log(`Missing field in schema: ${key}`);
    allKeysMatch = false;
  }
});

console.log(`Schema Field Compatibility: ${allKeysMatch ? '100% COMPATIBLE (MATCH)' : 'MISMATCH DETECTED'}`);
