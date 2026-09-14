// backend/routes/profileRoutes.js (create a new file)
const express = require('express');
const UserProfile = require('../models/UserProfile'); // Use the new model

const router = express.Router();

router.post('/create-profile', async (req, res) => {
  try {
    const { name, dateOfBirth, gender, mobile, email, state, district, city, levelPlayed, representedTeam, height, weight, profilePicture } = req.body;

    // Optional: Add validation logic here (e.g., check if all required fields are present)

    const newProfile = new UserProfile({
      name,
      dateOfBirth,
      gender,
      mobile,
      email,
      state,
      district,
      city,
      levelPlayed,
      representedTeam,
      height,
      weight,
      profilePicture
    });

    await newProfile.save();
    res.status(201).json({ msg: 'Profile created successfully!' });

  } catch (err) {
    console.error(err.message);
    // Handle specific errors like duplicate emails
    if (err.code === 11000) {
      return res.status(400).json({ msg: 'Email or Mobile number already exists.' });
    }
    res.status(500).send('Server Error');
  }
});

module.exports = router;