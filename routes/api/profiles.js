// Deals with profile info such as bio, education, etc.
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const passport = require('passport');

// Load Profile model
const Profile = require('../../models/Profile');
// Load User profile
const User = require('../../models/User');


// @route   GET api/profile/test
// @desc    Tests profiles route
// @access  Public
router.get('/test', (req, res) => res.json({ msg: "Profile works" }));


// @route   GET api/profile
// @desc    Get current users profile
// @access  Private
router.get('/', passport.authenticate('jwt', { session: false}), (req, res) => {
  const errors = {};

  Profile.findOne({ user: req.user.id }) // Find profile based on logged in user's ID
    .then(profile => {
      if (!profile) {
        errors.noprofile = 'There is no profile for this user'
        return res.status(404).json(errors);
      }
      res.json(profile);
    })
    .catch(err => res.status(404).json(err));
})


// @route   POST api/profile
// @desc    Create or edit user profile
// @access  Private
router.post( '/',
  passport.authenticate('jwt', {session: false}),
  (req, res) => {

    // Get fields
    const profileFields = {};
    profileFields.user = req.user.id;
    if(req.body.handle) profileFields.handle = req.body.handle;
    if(req.body.company) profileFields.company = req.body.company;
    if(req.body.website) profileFields.website = req.body.website;
    if(req.body.location) profileFields.location = req.body.location;
    if(req.body.bio) profileFields.bio = req.body.bio;
    if(req.body.status) profileFields.status = req.body.status;
    if(req.body.githubusername) profileFields.githubusername = req.body.githubusername;

    // Skills - split into array
    if(typeof req.body.skills !== undefined) {
      profileFields.skills = req.body.skills.split(',');
    }

    // Social
    profileFields.social = {};
    if(req.body.youtube) profileFields.social.youtube = req.body.youtube;
    if(req.body.twitter) profileFields.social.twitter = req.body.twitter;
    if(req.body.facebook) profileFields.social.facebook = req.body.facebook;
    if(req.body.linkedin) profileFields.social.linkedin = req.body.linkedin;
    if(req.body.instagram) profileFields.social.instagram = req.body.instagram;

    Profile.findOne({ user: req.user.id })
    .then(profile => {
      if(profile) {
        // Update profile
        Profile.findOneAndUpdate(
          // Find the user with the current loggin in user's ID
          { user: req.user.id },
          // Update the profile fields object
          { $set: ProfileFields },
          // Specifies that the updated version of the object gets returned
          { new: true })
          .then(profile => res.json(profile));
      } else {
        // Create profile

        // Check if handle exists
        Profile.findOne({ handle: profileFields.handle })
        .then(profile => {
          if(profile) {
            errors.handle = 'That handle already exists';
            res.status(400).json(errors);
          }

          // Save profile
          new Profile(profileFields).save().then(profile => res.json(profile));
        })
      }
    })
  }
);

module.exports = router;