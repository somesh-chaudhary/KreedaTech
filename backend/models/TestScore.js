const mongoose = require('mongoose');

const testScoreSchema = new mongoose.Schema({
  _id: {
    type: String
  },
  userId: {
    type: String,
    required: true
  },
  athleteName: {
    type: String,
    required: true
  },
  testType: {
    type: String,
    required: true
  },
  score: {
    type: Number,
    required: true
  },
  percentageScore: {
    type: Number
  },
  rawPerformanceValue: {
    type: String
  },
  repetitions: {
    type: Number,
    default: null
  },
  durationSeconds: {
    type: Number,
    default: null
  },
  xpEarned: {
    type: Number,
    default: 0
  },
  performanceCategory: {
    type: String
  },
  date: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('TestScore', testScoreSchema, 'testscores');
