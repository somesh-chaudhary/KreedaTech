/**
 * Standalone Synthetic Dataset Generator for KreedaTech
 * 
 * Generates 500+ realistic synthetic Indian athlete profiles, matching user accounts,
 * and multi-session athletic performance test histories.
 * 
 * DOES NOT connect to MongoDB or modify any existing codebase files.
 * Output files are saved in the `dataset/` directory in JSON and CSV formats.
 */

const fs = require('fs');
const path = require('path');

// Seeded PRNG for reproducible dataset generation
let seed = 42;
function random() {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

function randomInt(min, max) {
  return Math.floor(random() * (max - min + 1)) + min;
}

function randomChoice(arr) {
  return arr[Math.floor(random() * arr.length)];
}

function randomFloat(min, max, decimals = 2) {
  const val = random() * (max - min) + min;
  return parseFloat(val.toFixed(decimals));
}

// Data pools for Indian athletes
const MALE_FIRST_NAMES = [
  'Anirudh', 'Rohan', 'Ayush', 'Prasant', 'Arjun', 'Vikram', 'Dev', 'Karan', 'Siddharth', 'Varun',
  'Yash', 'Kabir', 'Manish', 'Rahul', 'Aman', 'Kunal', 'Tarun', 'Nikhil', 'Deepak', 'Suresh',
  'Amit', 'Rajesh', 'Vikas', 'Gaurav', 'Harsh', 'Alok', 'Neeraj', 'Suraj', 'Rishabh', 'Abhishek',
  'Praveen', 'Sanjay', 'Rohit', 'Sachin', 'Dinesh', 'Vivek', 'Kartik', 'Ishaan', 'Aarav', 'Dhruv',
  'Vihaan', 'Reyansh', 'Shaurya', 'Atharv', 'Ayaan', 'Krishna', 'Shiva', 'Aditya', 'Sameer', 'Chetan'
];

const FEMALE_FIRST_NAMES = [
  'Priya', 'Anya', 'Chahat', 'Kavya', 'Deepika', 'Ananya', 'Riya', 'Sneha', 'Pooja', 'Neha',
  'Shreya', 'Divya', 'Isha', 'Meera', 'Aditi', 'Kriti', 'Tanvi', 'Sakshi', 'Swati', 'Nisha',
  'Rashmi', 'Preeti', 'Simran', 'Payal', 'Richa', 'Sonam', 'Avani', 'Diya', 'Kiara', 'Myra',
  'Tara', 'Anushka', 'Shruti', 'Bhavna', 'Vandana', 'Geeta', 'Suman', 'Sunita', 'Anita', 'Rekha'
];

const LAST_NAMES = [
  'Singh', 'Sharma', 'Mehta', 'Verma', 'Kumar', 'Patel', 'Nair', 'Das', 'Yadav', 'Sen',
  'Joshi', 'Reddy', 'Gupta', 'Mishra', 'Pandey', 'Rao', 'Chowdhury', 'Mukherjee', 'Banerjee', 'Bhat',
  'Deshmukh', 'Kulkarni', 'Patil', 'Pawar', 'Nayak', 'Gowda', 'Shetty', 'Menon', 'Pillai', 'Tripathi',
  'Tiwari', 'Agarwal', 'Bhasin', 'Kapoor', 'Khanna', 'Chawla', 'Malhotra', 'Sethi', 'Bose', 'Dutta'
];

const LOCATION_HIERARCHY = [
  {
    state: 'Karnataka',
    districts: [
      { district: 'Bangalore', cities: ['Koramangala', 'Indiranagar', 'Whitefield', 'Electronic City', 'HSR Layout'] },
      { district: 'Mysore', cities: ['Gokulam', 'Jayalakshmipuram', 'Vijayanagar', 'Vontikoppal'] },
      { district: 'Hubli', cities: ['Vidya Nagar', 'Keshwapur', 'Gokul Road'] },
      { district: 'Mangalore', cities: ['Bejai', 'Kadri', 'Kodialbail'] }
    ]
  },
  {
    state: 'Maharashtra',
    districts: [
      { district: 'Mumbai', cities: ['Andheri', 'Bandra', 'Borivali', 'Powai', 'Thane'] },
      { district: 'Pune', cities: ['Kothrud', 'Viman Nagar', 'Baner', 'Hinjewadi', 'Shivaji Nagar'] },
      { district: 'Nagpur', cities: ['Dharampeth', 'Sadar', 'Wardha Road'] },
      { district: 'Nashik', cities: ['College Road', 'Indira Nagar', 'Panchavati'] }
    ]
  },
  {
    state: 'Tamil Nadu',
    districts: [
      { district: 'Chennai', cities: ['Anna Nagar', 'T. Nagar', 'Adyar', 'Velachery', 'Tambaram'] },
      { district: 'Coimbatore', cities: ['RS Puram', 'Peelamedu', 'Gandhipuram'] },
      { district: 'Madurai', cities: ['KK Nagar', 'Anna Nagar', 'Tallakulam'] }
    ]
  },
  {
    state: 'Uttar Pradesh',
    districts: [
      { district: 'Agra', cities: ['Taj Ganj', 'Dayalbagh', 'Sanjay Place', 'Shahganj'] },
      { district: 'Kanpur', cities: ['Swaroop Nagar', 'Civil Lines', 'Kidwai Nagar'] },
      { district: 'Lucknow', cities: ['Gomti Nagar', 'Hazratganj', 'Aliganj'] },
      { district: 'Varanasi', cities: ['Lanka', 'Sigra', 'Bhelupur'] }
    ]
  },
  {
    state: 'Delhi',
    districts: [
      { district: 'New Delhi', cities: ['Connaught Place', 'Dwarka', 'Rohini', 'Saket', 'Vasant Kunj'] },
      { district: 'Noida', cities: ['Sector 18', 'Sector 62', 'Sector 137', 'Greater Noida'] }
    ]
  },
  {
    state: 'West Bengal',
    districts: [
      { district: 'Kolkata', cities: ['Salt Lake', 'Park Street', 'New Town', 'Ballygunge', 'Alipore'] }
    ]
  },
  {
    state: 'Telangana',
    districts: [
      { district: 'Hyderabad', cities: ['Gachibowli', 'HITECH City', 'Banjara Hills', 'Jubilee Hills', 'Madhapur'] }
    ]
  },
  {
    state: 'Bihar',
    districts: [
      { district: 'Patna', cities: ['Boring Road', 'Kankarbagh', 'Rajendra Nagar'] }
    ]
  },
  {
    state: 'Punjab',
    districts: [
      { district: 'Ludhiana', cities: ['Model Town', 'Civil Lines', 'Sarabha Nagar'] },
      { district: 'Amritsar', cities: ['Ranjit Avenue', 'Mall Road'] }
    ]
  },
  {
    state: 'Haryana',
    districts: [
      { district: 'Gurugram', cities: ['DLF Phase 5', 'Golf Course Road', 'Sector 56'] }
    ]
  }
];

const LEVEL_OPTIONS = ['District', 'State', 'National', 'International'];

const TEAMS = [
  'Bengaluru Bulls Youth', 'Mumbai Warriors AC', 'UP Strikers', 'Delhi Capitals Academy',
  'Tamil Nadu Tigers', 'Maharashtra Athletics Club', 'Kolkata Runners', 'Punjab Lions FC',
  'Hyderabad Strikers', 'Rajasthan Royals Academy', 'Haryana Heroes', 'Gujarat Giants Youth',
  'Kerala Blasters Youth', 'Goa Athletics Association', 'North East United Academy'
];

const TEST_TYPES = [
  '40-Yard Dash',
  'Cone Drill',
  'Jumps',
  'Situps',
  'Complete Athletic Assessment'
];

// Generate 520 synthetic athletes
const TOTAL_ATHLETES = 520;

function generateDataset() {
  const users = [];
  const profiles = [];
  const testScores = [];
  const athletesCombined = [];

  for (let i = 1; i <= TOTAL_ATHLETES; i++) {
    const userId = `usr_${String(i).padStart(4, '0')}`;
    const athleteNum = String(i).padStart(3, '0');
    const email = `athlete${athleteNum}@demo.kreedatech.local`;
    
    // Demo hashed password (bcrypt equivalent placeholder)
    const hashedPassword = `$2a$10$e8.ZpXyK9zJ.3d.Wv4G.0u${String(i).padStart(10, '0')}`;

    const userObj = {
      _id: userId,
      email: email,
      password: hashedPassword,
      createdAt: new Date(Date.now() - randomInt(30, 365) * 86400000).toISOString()
    };
    users.push(userObj);

    const gender = random() > 0.35 ? 'male' : 'female';
    const firstName = gender === 'male' ? randomChoice(MALE_FIRST_NAMES) : randomChoice(FEMALE_FIRST_NAMES);
    const lastName = randomChoice(LAST_NAMES);
    const fullName = `${firstName} ${lastName}`;

    const mobilePrefix = randomChoice(['98', '97', '99', '94', '93', '88', '87', '70']);
    const mobile = `+91 ${mobilePrefix}${randomInt(10000000, 99999999)}`;

    // DOB between 1996 and 2008 (age 18-30)
    const birthYear = randomInt(1996, 2008);
    const birthMonth = String(randomInt(1, 12)).padStart(2, '0');
    const birthDay = String(randomInt(1, 28)).padStart(2, '0');
    const dob = `${birthYear}-${birthMonth}-${birthDay}`;

    const locState = randomChoice(LOCATION_HIERARCHY);
    const locDistrictObj = randomChoice(locState.districts);
    const locCity = randomChoice(locDistrictObj.cities);

    // Height/weight correlation
    const height = gender === 'male' ? randomInt(165, 192) : randomInt(154, 178);
    const weight = Math.round(height * (gender === 'male' ? randomFloat(0.38, 0.48) : randomFloat(0.32, 0.42)));

    // Level distribution: 45% District, 35% State, 15% National, 5% International
    const randLevel = random();
    let levelPlayed = 'District';
    if (randLevel > 0.95) levelPlayed = 'International';
    else if (randLevel > 0.80) levelPlayed = 'National';
    else if (randLevel > 0.45) levelPlayed = 'State';

    const representedTeam = randomChoice(TEAMS);
    const profilePic = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fullName)}`;

    const profileObj = {
      _id: `prof_${String(i).padStart(4, '0')}`,
      userId: userId,
      name: fullName,
      email: email,
      mobile: mobile,
      dateOfBirth: dob,
      gender: gender,
      state: locState.state,
      district: locDistrictObj.district,
      city: locCity,
      levelPlayed: levelPlayed,
      representedTeam: representedTeam,
      height: height,
      weight: weight,
      profilePicture: profilePic
    };
    profiles.push(profileObj);

    // Generate athletic test records (260 athletes with 4 tests, 260 with 5 tests = 2340 test records exactly)
    const numTests = (i % 2 === 0) ? 4 : 5;

    // Progression profile: 60% Improver, 25% Consistent, 15% Declining
    const randTrend = random();
    const trendType = randTrend < 0.60 ? 'improver' : (randTrend < 0.85 ? 'consistent' : 'declining');
    const athleteBaseSkill = randomFloat(0.60, 0.95);

    const athleteTests = [];
    const baseDate = new Date(2025, 0, 15).getTime();
    const dayInterval = randomInt(20, 50);

    for (let t = 0; t < numTests; t++) {
      const testDate = new Date(baseDate + t * dayInterval * 86400000 + randomInt(-3, 3) * 86400000).toISOString().split('T')[0];
      const testType = TEST_TYPES[t % TEST_TYPES.length];

      // Multiplier based on progression trend
      let trendFactor = 1.0;
      if (trendType === 'improver') {
        trendFactor = 0.88 + (t / numTests) * 0.22;
      } else if (trendType === 'declining') {
        trendFactor = 1.05 - (t / numTests) * 0.18;
      } else {
        trendFactor = 0.96 + randomFloat(-0.04, 0.04);
      }

      const effectiveSkill = Math.min(0.99, Math.max(0.40, athleteBaseSkill * trendFactor));

      let score = 0;
      let percentageScore = 0;
      let rawPerformanceValue = '';
      let reps = null;
      let durationSeconds = null;

      if (testType === '40-Yard Dash') {
        // Sprint time: 4.2s (elite) to 6.2s (beginner)
        durationSeconds = parseFloat((6.4 - effectiveSkill * 2.1 + randomFloat(-0.08, 0.08)).toFixed(2));
        rawPerformanceValue = `${durationSeconds}s`;
        score = Math.round(Math.min(990, Math.max(400, (6.5 - durationSeconds) * 260 + 400)));
        percentageScore = parseFloat((score / 10).toFixed(1));
      } else if (testType === 'Cone Drill') {
        // Agility time: 6.5s to 9.5s
        durationSeconds = parseFloat((9.6 - effectiveSkill * 2.9 + randomFloat(-0.1, 0.1)).toFixed(2));
        rawPerformanceValue = `${durationSeconds}s`;
        score = Math.round(Math.min(980, Math.max(420, (9.8 - durationSeconds) * 175 + 400)));
        percentageScore = parseFloat((score / 10).toFixed(1));
      } else if (testType === 'Situps') {
        // Reps in 60s: 25 to 65 reps
        reps = Math.round(25 + effectiveSkill * 38 + randomInt(-2, 2));
        durationSeconds = 60;
        rawPerformanceValue = `${reps} reps`;
        score = Math.round(Math.min(985, reps * 15.2));
        percentageScore = parseFloat((score / 10).toFixed(1));
      } else if (testType === 'Jumps') {
        // Vertical jump in inches: 18 to 36 inches
        const jumpInches = parseFloat((18 + effectiveSkill * 17.5 + randomFloat(-0.5, 0.5)).toFixed(1));
        reps = 3; // attempts
        rawPerformanceValue = `${jumpInches} in`;
        score = Math.round(Math.min(995, jumpInches * 27.2));
        percentageScore = parseFloat((score / 10).toFixed(1));
      } else {
        // Complete Athletic Assessment
        durationSeconds = 1500; // 25 min
        reps = 10;
        score = Math.round(520 + effectiveSkill * 440 + randomInt(-15, 15));
        score = Math.min(990, Math.max(450, score));
        percentageScore = parseFloat((score / 10).toFixed(1));
        rawPerformanceValue = `Overall Grade ${score >= 900 ? 'A+' : (score >= 800 ? 'A' : (score >= 700 ? 'B+' : 'B'))}`;
      }

      let performanceCategory = 'Beginner';
      if (score >= 900) performanceCategory = 'Elite';
      else if (score >= 800) performanceCategory = 'Advanced';
      else if (score >= 680) performanceCategory = 'Intermediate';

      const xpEarned = Math.round(score * 0.35 + randomInt(20, 50));

      const testScoreObj = {
        _id: `tscore_${String(i).padStart(4, '0')}_${t + 1}`,
        userId: userId,
        athleteName: fullName,
        testType: testType,
        score: score,
        percentageScore: percentageScore,
        rawPerformanceValue: rawPerformanceValue,
        repetitions: reps,
        durationSeconds: durationSeconds,
        xpEarned: xpEarned,
        performanceCategory: performanceCategory,
        date: testDate,
        createdAt: `${testDate}T10:30:00.000Z`
      };

      testScores.push(testScoreObj);
      athleteTests.push(testScoreObj);
    }

    athletesCombined.push({
      user: userObj,
      profile: profileObj,
      progressionTrend: trendType,
      testHistory: athleteTests
    });
  }

  return { users, profiles, testScores, athletesCombined };
}

// Run dataset generator
const { users, profiles, testScores, athletesCombined } = generateDataset();

// Create dataset directory
const datasetDir = path.join(__dirname, '..', 'dataset');
if (!fs.existsSync(datasetDir)) {
  fs.mkdirSync(datasetDir, { recursive: true });
}

// Write JSON files
fs.writeFileSync(path.join(datasetDir, 'users.json'), JSON.stringify(users, null, 2));
fs.writeFileSync(path.join(datasetDir, 'profiles.json'), JSON.stringify(profiles, null, 2));
fs.writeFileSync(path.join(datasetDir, 'test_scores.json'), JSON.stringify(testScores, null, 2));
fs.writeFileSync(path.join(datasetDir, 'athletes_combined.json'), JSON.stringify(athletesCombined, null, 2));

// Helper to convert array of objects to CSV
function jsonToCsv(items, headers) {
  const csvRows = [];
  csvRows.push(headers.join(','));

  for (const item of items) {
    const values = headers.map(header => {
      let val = item[header] === undefined || item[header] === null ? '' : item[header];
      if (typeof val === 'string' && (val.includes(',') || val.includes('"') || val.includes('\n'))) {
        val = `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    });
    csvRows.push(values.join(','));
  }
  return csvRows.join('\n');
}

// Write CSV files
const profileHeaders = ['_id', 'userId', 'name', 'email', 'mobile', 'dateOfBirth', 'gender', 'state', 'district', 'city', 'levelPlayed', 'representedTeam', 'height', 'weight', 'profilePicture'];
fs.writeFileSync(path.join(datasetDir, 'profiles.csv'), jsonToCsv(profiles, profileHeaders));

const testScoreHeaders = ['_id', 'userId', 'athleteName', 'testType', 'score', 'percentageScore', 'rawPerformanceValue', 'repetitions', 'durationSeconds', 'xpEarned', 'performanceCategory', 'date'];
fs.writeFileSync(path.join(datasetDir, 'test_scores.csv'), jsonToCsv(testScores, testScoreHeaders));

console.log('---------------------------------------------------------');
console.log(' KreedaTech Synthetic Dataset Generation Complete!');
console.log('---------------------------------------------------------');
console.log(` Athletes Generated : ${users.length}`);
console.log(` Profiles Generated : ${profiles.length}`);
console.log(` Test Records Generated : ${testScores.length}`);
console.log(` Dataset Directory  : ${path.resolve(datasetDir)}`);
console.log('---------------------------------------------------------');
