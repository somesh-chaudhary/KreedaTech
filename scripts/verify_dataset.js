const fs = require('fs');
const path = require('path');

const datasetDir = path.join(__dirname, '..', 'dataset');

const users = JSON.parse(fs.readFileSync(path.join(datasetDir, 'users.json'), 'utf8'));
const profiles = JSON.parse(fs.readFileSync(path.join(datasetDir, 'profiles.json'), 'utf8'));
const testScores = JSON.parse(fs.readFileSync(path.join(datasetDir, 'test_scores.json'), 'utf8'));
const combined = JSON.parse(fs.readFileSync(path.join(datasetDir, 'athletes_combined.json'), 'utf8'));

const userEmails = new Set(users.map(u => u.email));
const userIds = new Set(users.map(u => u._id));

let profileEmailMismatch = 0;
let profileMissingFields = 0;
let duplicateEmails = 0;
const seenEmails = new Set();

profiles.forEach(p => {
  if (!userEmails.has(p.email)) profileEmailMismatch++;
  if (seenEmails.has(p.email)) duplicateEmails++;
  seenEmails.add(p.email);
  if (!p.name || !p.email || !p.mobile || !p.dateOfBirth || !p.gender || !p.state || !p.district || !p.city) {
    profileMissingFields++;
  }
});

let orphanTestScores = 0;
let invalidTestTypes = 0;
const validTestTypes = new Set(['40-Yard Dash', 'Cone Drill', 'Jumps', 'Situps', 'Complete Athletic Assessment']);

testScores.forEach(t => {
  if (!userIds.has(t.userId)) orphanTestScores++;
  if (!validTestTypes.has(t.testType)) invalidTestTypes++;
});

let bcryptCompatPasswords = 0;
users.forEach(u => {
  if (u.password && u.password.startsWith('$2a$')) bcryptCompatPasswords++;
});

console.log('--- VERIFICATION SUMMARY ---');
console.log(`Users Count: ${users.length} (Expected: 520) - ${users.length === 520 ? 'PASS' : 'FAIL'}`);
console.log(`Profiles Count: ${profiles.length} (Expected: 520) - ${profiles.length === 520 ? 'PASS' : 'FAIL'}`);
console.log(`Test Scores Count: ${testScores.length} (Expected: 2340) - ${testScores.length === 2340 ? 'PASS' : 'FAIL'}`);
console.log(`Combined Athletes Count: ${combined.length} (Expected: 520) - ${combined.length === 520 ? 'PASS' : 'FAIL'}`);
console.log(`Profile Email Matches User Email: ${profileEmailMismatch === 0 ? 'PASS' : 'FAIL'}`);
console.log(`Test Scores Map to Valid Athletes: ${orphanTestScores === 0 ? 'PASS' : 'FAIL'}`);
console.log(`No Duplicate Emails: ${duplicateEmails === 0 ? 'PASS' : 'FAIL'}`);
console.log(`No Missing Required Fields: ${profileMissingFields === 0 ? 'PASS' : 'FAIL'}`);
console.log(`Bcrypt Compatible Passwords: ${bcryptCompatPasswords === users.length ? 'PASS' : 'FAIL'}`);
console.log(`Valid Test Types: ${invalidTestTypes === 0 ? 'PASS' : 'FAIL'}`);
