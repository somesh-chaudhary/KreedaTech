const mongoose = require('mongoose');

const userProfileSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  mobile: { type: String, required: true, unique: true },
  dateOfBirth: { type: String },
  gender: { type: String },
  state: { type: String },
  district: { type: String },
  city: { type: String },
  levelPlayed: { type: String },
  representedTeam: { type: String },
  height: { type: Number },
  weight: { type: Number },
  profilePicture: { type: String } // Storing the URI or a Base64 string
});

module.exports = mongoose.model('UserProfile', userProfileSchema);