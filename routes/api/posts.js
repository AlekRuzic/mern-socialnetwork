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
          // You need to change the reference ID to a string because it is of type ObjectID
          if (post.user.toString() !== req.user.id) {
            return (res.status(401).json({ notauthorized: 'User not authorized to delete this post '}));
          }

          post.remove().then(_ => res.json({ success: true }));
        })
        .catch(err => res.status(404).json({ postnotfound: 'Post not be found'}))
    })
})


// @route   POST api/posts/like/:id
// @desc    Like a post
// @access  Private
router.post('/like/:id', passport.authenticate('jwt', { session: false }), (req, res) => {
  Profile.findOne({ user: req.user.id })
    .then(profile => {
      Post.findById(req.params.id)
        .then(post => {
          // Check if the current user has already liked the post
          if(post.likes.filter(like => like.user.toString() === req.user.id).length > 0) {
            return res.status(400).json({ alreadyliked: 'User already liked this post'})
          }
          // Add user id to likes
          post.likes.unshift({ user: req.user.id })
          // Update database
          post.save().then(post => res.json(post));
        })
        .catch(err => res.status(404).json({ postnotfound: 'Post not found' }))
    })
})


// @route   POST api/posts/unlike/:id
// @desc    Unlike a post
// @access  Private
router.post('/unlike/:id', passport.authenticate('jwt', { session: false }), (req, res) => {
  Profile.findOne({ user: req.user.id })
    .then(profile => {
      Post.findById(req.params.id)
        .then(post => {
          // Check if the current user has already liked the post
          if (post.likes.filter(like => like.user.toString() === req.user.id).length === 0) {
            return res.status(400).json({ havenotliked: 'User has not liked this post' })
          }

          // Get the remove index
          const removeIndex = post.likes.map(item => item.user.toString()).indexOf(req.user.id);
          // Splice remove index out of array
          post.likes.splice(removeIndex, 1)
          // Update the database
          post.save().then(post => res.json(post));
        })
        .catch(err => res.status(404).json({ postnotfound: 'Post not found' }))
    })
})


module.exports = router;