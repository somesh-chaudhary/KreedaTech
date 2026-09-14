const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const testRoutes = require('./routes/testRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json()); // To parse JSON data from requests
app.use((req, res, next) => {
  console.log(`[HTTP] ${new Date().toLocaleTimeString()} ${req.method} ${req.originalUrl || req.url}`);
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/leaderboard', testRoutes);
app.use('/api/analytics', testRoutes);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 3000 })
  .then(() => console.log('MongoDB connected successfully!'))
  .catch(err => console.error('MongoDB connection notice (will use in-memory cache if offline):', err.message));

// Routes
app.get('/', (req, res) => {
  res.send('Server is running!');
});

// Start the server on all network interfaces
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://0.0.0.0:${PORT} (port ${PORT})`);
});