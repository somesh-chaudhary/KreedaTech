const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.join(__dirname, '..', 'backend', '.env') });

const uri = process.env.MONGO_URI;

async function runImport() {
  console.log('--- STARTING SAFE MONGODB ATLAS DATASET IMPORT ---');
  let usersImported = 0;
  let profilesImported = 0;
  let errorCount = 0;

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log('Connected to MongoDB Atlas successfully.');

    const db = mongoose.connection.db;

    // Load dataset files
    const datasetDir = path.join(__dirname, '..', 'dataset');
    const usersData = JSON.parse(fs.readFileSync(path.join(datasetDir, 'users.json'), 'utf8'));
    const profilesData = JSON.parse(fs.readFileSync(path.join(datasetDir, 'profiles.json'), 'utf8'));

    const usersCol = db.collection('users');
    const profilesCol = db.collection('userprofiles');

    // 1. Safe Import Users (using ordered: false to skip any pre-existing duplicates safely)
    console.log(`Importing ${usersData.length} records into 'users' collection...`);
    try {
      const userRes = await usersCol.insertMany(usersData, { ordered: false });
      usersImported = userRes.insertedCount;
      console.log(`Successfully inserted ${usersImported} users.`);
    } catch (err) {
      if (err.insertedCount !== undefined) {
        usersImported = err.insertedCount;
        errorCount += (usersData.length - usersImported);
        console.log(`Inserted ${usersImported} users with ${usersData.length - usersImported} duplicate/error skips.`);
      } else {
        throw err;
      }
    }

    // 2. Safe Import Profiles
    console.log(`Importing ${profilesData.length} records into 'userprofiles' collection...`);
    try {
      const profRes = await profilesCol.insertMany(profilesData, { ordered: false });
      profilesImported = profRes.insertedCount;
      console.log(`Successfully inserted ${profilesImported} profiles.`);
    } catch (err) {
      if (err.insertedCount !== undefined) {
        profilesImported = err.insertedCount;
        errorCount += (profilesData.length - profilesImported);
        console.log(`Inserted ${profilesImported} profiles with ${profilesData.length - profilesImported} duplicate/error skips.`);
      } else {
        throw err;
      }
    }

    // 3. Post-Import Verification
    console.log('\n--- POST-IMPORT VERIFICATION ---');
    const finalUsersCount = await usersCol.countDocuments();
    const finalProfilesCount = await profilesCol.countDocuments();

    // Verify Relationship: every profile email matches a user email
    const allUsers = await usersCol.find({}, { projection: { email: 1, _id: 1 } }).toArray();
    const userEmailSet = new Set(allUsers.map(u => u.email));
    const allProfiles = await profilesCol.find({}, { projection: { email: 1, userId: 1 } }).toArray();

    let unmappedProfiles = 0;
    allProfiles.forEach(p => {
      if (!userEmailSet.has(p.email)) {
        unmappedProfiles++;
      }
    });

    console.log(`Final Users Collection Count: ${finalUsersCount}`);
    console.log(`Final UserProfiles Collection Count: ${finalProfilesCount}`);
    console.log(`Users Imported: ${usersImported}`);
    console.log(`Profiles Imported: ${profilesImported}`);
    console.log(`Duplicate / Error Skips: ${errorCount}`);
    console.log(`Profile-User Email Mismatches: ${unmappedProfiles}`);
    console.log(`Relationship Verification: ${unmappedProfiles === 0 ? 'ALL MATCH (100%)' : 'MISMATCH DETECTED'}`);

    await mongoose.disconnect();
  } catch (err) {
    console.error('CRITICAL IMPORT ERROR:', err.message);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
}

runImport();
