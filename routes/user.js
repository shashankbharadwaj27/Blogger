const { Router } = require('express');
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const path = require('path');
const multer = require('multer');
const { createUserToken } = require('../services/authentication');
const { restrictToLoggedinUserOnly } = require('../middlewares/authentication');
const Blog = require('../models/blog');
const { handleGetUserSignin, handleGetUserSignup, handlePostUserSignup, handlePostUserSignin, handleUserLogout, handleGetUserSettings, handlePostUserSettings, handleGetUserProfile, handlePostUnfollowRequest, handlePostFollowRequest }=require('../controllers/user');

const router = Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.get('/signin',handleGetUserSignin);

router.get('/signup',handleGetUserSignup);

router.post('/signup', handlePostUserSignup);

router.post('/signin',handlePostUserSignin);

router.get('/logout', handleUserLogout);

router.get('/settings', restrictToLoggedinUserOnly, handleGetUserSettings);

router.post('/settings', restrictToLoggedinUserOnly, upload.single('profileImage'), handlePostUserSettings);

router.get('/:username', restrictToLoggedinUserOnly, handleGetUserProfile);

router.post('/follow/:username',restrictToLoggedinUserOnly,handlePostFollowRequest);

router.post('/unfollow/:username', restrictToLoggedinUserOnly, handlePostUnfollowRequest);



module.exports = router;
