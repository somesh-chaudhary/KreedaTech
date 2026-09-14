# KreedaTech 🏃‍♂️

KreedaTech is an AI-powered sports analytics and performance-tracking mobile application built with React Native. It uses computer vision and pose detection to analyze athletic movements during fitness drills and provide performance insights.

## ✨ Features

- **AI-Based Pose Detection**  
  Uses camera-based pose detection to track athlete movements during fitness drills.

- **Automated Drill Analysis**  
  Custom pose analysis engines evaluate athletic activities such as sprinting, jumping, sit-ups, and cone drills.

- **Performance Tracking**  
  Records test results and provides athletes with performance metrics and progress information.

- **Analytics Dashboard**  
  Displays athlete performance data through visual charts and statistics.

- **Leaderboard**  
  Allows athletes to compare their performance and rankings with other users.

- **Athlete Profiles**  
  Stores user profiles, test history, scores, and performance information.

- **Full-Stack Architecture**  
  Uses a Node.js and Express.js backend with MongoDB for storing and managing application data.

---

## 🛠️ Tech Stack

### Mobile Application

- **Framework:** React Native
- **Language:** JavaScript / JSX
- **Navigation:** React Navigation
- **Camera:** React Native Vision Camera
- **Pose Detection:** Vision Camera Pose Detector
- **Charts:** React Native Chart Kit
- **Icons:** Lucide React Native

### Backend

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB
- **ODM:** Mongoose
- **Authentication:** bcryptjs
- **API Communication:** REST API
- **Configuration:** dotenv
- **Cross-Origin Support:** CORS

### Development Tools

- Git & GitHub
- Android Studio
- Xcode
- npm

---

## 📁 Project Structure

```text
KreedaTech/
│
├── android/                  # Android native project
├── ios/                      # iOS native project
│
├── backend/                  # Node.js / Express backend
│   ├── models/               # Mongoose data models
│   ├── routes/               # REST API routes
│   ├── server.js             # Backend entry point
│   └── .env                  # Environment variables (not committed)
│
├── dataset/                  # Athlete and test datasets
│
├── scripts/                  # Utility and testing scripts
│
├── src/
│   ├── config/               # Application configuration
│   ├── screens/              # Application screens
│   ├── utils/                # Pose analysis and utility logic
│   └── Assests/              # Application assets
│
├── App.jsx                   # Main React Native component
├── index.js                  # Application entry point
├── package.json              # Frontend dependencies
├── package-lock.json         # Dependency lock file
└── README.md                 # Project documentation
```

---

## 🚀 Getting Started

Follow the steps below to run KreedaTech locally.

### Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/)
- npm
- [Android Studio](https://developer.android.com/studio) for Android development
- [React Native development environment](https://reactnative.dev/docs/set-up-your-environment)
- MongoDB or a MongoDB Atlas database

---

## 1. Clone the Repository

```bash
git clone https://github.com/somesh-chaudhary/KreedaTech.git
cd KreedaTech
```

---

## 2. Install Frontend Dependencies

From the project root:

```bash
npm install
```

---

## 3. Configure the Backend

Navigate to the backend directory:

```bash
cd backend
npm install
```

Create a `.env` file inside the `backend/` directory:

```env
MONGO_URI=your_mongodb_connection_string
PORT=5000
```

Then start the backend:

```bash
node server.js
```

Keep this terminal running.

> **Note:** Never commit your `.env` file or database credentials to GitHub.

---

## 4. Start the Mobile Application

Open a new terminal and return to the project root:

```bash
cd KreedaTech
```

Start the Metro Bundler:

```bash
npm start
```

---

## 5. Run on Android

Make sure an Android emulator is running or an Android device is connected.

Then run:

```bash
npm run android
```

---

## 📱 Application Flow

The application follows a simple athlete workflow:

```text
User Registration
       ↓
Athlete Profile
       ↓
Select Fitness Test
       ↓
Perform Drill
       ↓
Camera / Pose Detection
       ↓
Movement Analysis
       ↓
Score & Performance Metrics
       ↓
Analytics & Leaderboard
```

---

## 🤖 AI & Computer Vision

KreedaTech uses camera-based pose detection to analyze athlete movements.

The project includes custom analysis modules for different activities:

- `situpPoseEngine.js`
- `jumpPoseEngine.js`
- `dashPoseEngine.js`
- `conePoseEngine.js`

These modules process pose information and use movement-related measurements to evaluate athletic performance.

---

## 📊 Performance Analytics

The application provides performance information such as:

- Test scores
- Sprint performance
- Drill results
- Athlete progress
- Leaderboard rankings
- Historical test data

This allows athletes to track their performance over multiple assessments.

---

## 🔐 Security

The backend uses:

- `bcryptjs` for password hashing
- Environment variables for sensitive configuration
- CORS for API access control

Sensitive credentials such as MongoDB connection strings should always be stored in `.env` files and excluded from version control.

---

## 🔮 Future Improvements

Potential improvements include:

- More advanced pose estimation models
- Additional sports and fitness drills
- Improved real-time movement feedback
- More detailed athlete performance reports
- Cloud-based deployment
- Advanced athlete comparison and recommendations

---

## 📄 License

This project is licensed under the MIT License.
