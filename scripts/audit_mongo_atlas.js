const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.join(__dirname, '..', 'backend', '.env') });

const uri = process.env.MONGO_URI;

async function runAudit() {
  console.log('--- READ-ONLY MONGODB ATLAS AUDIT ---');
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log('MongoDB Atlas Connected Successfully!');

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log(`Existing Collections Count in 'kreedatech': ${collections.length}`);

    const collectionDetails = [];
    for (const col of collections) {
      const count = await db.collection(col.name).countDocuments();
      collectionDetails.push({ name: col.name, docCount: count });
      console.log(`Collection: ${col.name} | Documents: ${count}`);
    }

    // Inspect Dataset Files
    const datasetDir = path.join(__dirname, '..', 'dataset');
    const usersJson = JSON.parse(fs.readFileSync(path.join(datasetDir, 'users.json'), 'utf8'));
    const profilesJson = JSON.parse(fs.readFileSync(path.join(datasetDir, 'profiles.json'), 'utf8'));
    const testScoresJson = JSON.parse(fs.readFileSync(path.join(datasetDir, 'test_scores.json'), 'utf8'));
    const combinedJson = JSON.parse(fs.readFileSync(path.join(datasetDir, 'athletes_combined.json'), 'utf8'));

    console.log('\n--- DATASET FILES SUMMARY ---');
    console.log(`users.json: ${usersJson.length} items`);
    console.log(`profiles.json: ${profilesJson.length} items`);
    console.log(`test_scores.json: ${testScoresJson.length} items`);
    console.log(`athletes_combined.json: ${combinedJson.length} items`);

    await mongoose.disconnect();
  } catch (err) {
    console.error('Audit Error:', err.message);
  }
}

runAudit();
