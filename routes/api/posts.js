const express = require('express');
const router = express.Router();
const passport = require('passport');
const Post = require('../../models/Post');
const Profile = require('../../models/Profile');
const validatePostInput = require('../../validation/post');


// @route   GET api/posts/test
// @desc    Tests post route
// @access  Public
router.get('/test', (req, res) => res.json({ msg: "Posts works" })
);


// @route   GET api/posts
// @desc    Get post by id
// @access  Public
router.get("/:id", (req, res) => {
  Post.findById(req.params.id)
    .then(post => res.json(post))
    .catch(err => res.status(404).json({ nopostfound: 'No post found with that id'}));
});


// @route   GET api/posts/:id
// @desc    View posts
// @access  Public
router.get("/", (req, res) => {
  Post.find()
    .sort({ date: -1 })
    .then(posts => res.json(posts))
    .catch(err => res.status(404).json({ nopostsfound: 'No posts found' }));
});


// @route   POST api/posts
// @desc    Create a post
// @access  Private
router.post('/', passport.authenticate('jwt', { session: false }), (req, res) => {

  // Validate post
  const { errors, isValid} = validatePostInput(req.body);
  if(!isValid){
    return res.status(400).json(errors);
  }

  const newPost = new Post({
    text: req.body.text,
    name: req.body.name,
    avatar: req.body.avatar,
    user: req.user.id
  });

  newPost.save().then(post => res.json(post));
});


// @route   DELETE api/posts/:id
// @desc    Delete a post
// @access  Private
router.delete('/:id', passport.authenticate('jwt', { session: false }), (req, res) => {
  Profile.findOne({ user: req.user.id })
    .then(profile => {
      Post.findById(req.params.id)
        .then(post => {
          // Check that the post belongs to the logged in user
          if (post.user.toString() !== req.user.id) {
            return (res.status(401).json({ notauthorized: 'User not authorized to delete this post '}));
          }

          post.remove().then(_ => res.json({ success: true }));
        })
        .catch(err => res.status(404).json({ postnotfound: 'The post you are trying to delete could not be found'}))
    })
})


module.exports = router;