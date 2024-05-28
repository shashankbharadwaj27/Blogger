require('dotenv').config();

const { Router } = require('express');
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const path = require('path');
const multer = require('multer');
const { createUserToken } = require('../services/authentication');
const { restrictToLoggedinUserOnly } = require('../middlewares/authentication');
const Blog = require('../models/blog');

const router = Router();


function handleGetUserSignin(req,res){
    try{
        res.render('signin');
    }
    catch(error) {
        res.send('Error loading this page')
    }
}

async function handlePostUserSignin(req,res){
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user) {
            return res.render('signin', { error: 'User not found' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.render('signin', { error: 'Incorrect password' });
        }
        const token = createUserToken(user);
        res.cookie('token', token).redirect('/');
    } catch(error) {
        console.error(error);
        res.render('signin', { error: 'An error occurred' });
    }
}

function handleGetUserSignup(req,res){
    try{
        res.render('signup');
    }
    catch(error){
        res.send('Error loading this page');
    }
}

async function handlePostUserSignup(req,res){
    try{
        const { firstName, email, password, username } = req.body;
        key=process.env.apiKey;
        const url=`https://api.emailvalidation.io/v1/info?apikey=${key}&email=${email}`
        let response = await fetch(url)
        let result= await response.json();
        if (result.smtp_check === false) {
            // Email did not pass verification
            return res.render('signup', { message: 'Invalid email address. Please use a valid email'});
        }
        await User.create({ firstName, email, password, username });
        return res.redirect('/user/signin');
    }
    catch(error){
        if (error.code === 11000 && error.keyPattern.username) {
            return res.render('signup', { error: 'Username is already taken' });
        }
        if (error.code === 11000 && error.keyPattern.email) {
            return res.render('signup', { error: 'Entered Email is already in use' });
        }
    }  
}

function handleUserLogout(req,res){
    try{
        res.cookie('token', '', { maxAge: 1 });
        res.redirect('/user/signin');
    }
    catch(error){
        res.render('/',{error:'An error occured while logging out'});
    }
}

function handleGetUserSettings(req,res){
    try{
        res.render('settings', {
            currentUser: req.user
        });
    }
    catch(error){
        res.send('Error loading this page');
    }
}

async function handlePostUserSettings(req,res){
    try {
        const { username, firstName, surname, mobile, description, email, country, state } = req.body;
        const currentUser = await User.findById(req.user._id);

        if (req.file) {
            currentUser.profileImage = `/uploads/${req.file.filename}`;
        }
        if (username && username !== currentUser.username) {
            currentUser.username = username;
        }
        if (firstName && firstName !== currentUser.firstName) {
            currentUser.firstName = firstName;
        }
        if (surname && surname !== currentUser.surname) {
            currentUser.surname = surname;
        }
        if (description && description !== currentUser.description) {
            currentUser.description = description;
        }
        if (mobile && mobile !== currentUser.mobile) {
            currentUser.mobile = mobile;
        }
        if (email && email !== currentUser.email) {
            currentUser.email = email;
        }
        if (country && country !== currentUser.country) {
            currentUser.country = country;
        }
        if (state && state !== currentUser.state) {
            currentUser.state = state;
        }

        await currentUser.save();
        res.redirect(`/user/${currentUser.username}`);
    } catch (error) {
        console.error(error);
        res.render('settings', { error: 'An error occurred', currentUser: req.user });
    }
}

async function handleGetUserProfile(req,res){
    try {
        const { username } = req.params;
        const user = await User.findOne({ username });

        if (!user) {
            return res.render('profile', { error: 'User not found', currentUser: req.user });
        }

        const allBlogs = await Blog.find({ createdBy: user._id });
        res.render('profile', {
            user,
            allBlogs,
            currentUser: req.user
        });
    } catch (error) {
        console.error(error);
        res.render('profile', { error: 'An error occurred', currentUser: req.user });
    }
}

async function handlePostFollowRequest(req,res){
    try{
        const userToFollow=await User.findOne({username:req.params.username});
        const currentUser=await User.findById(req.user._id);
    
        if(!userToFollow.followers.includes(currentUser._id)){
            currentUser.following.push(userToFollow._id);
            userToFollow.followers.push(currentUser._id);
    
            await userToFollow.save();
            await currentUser.save();
        }
        res.redirect(`/user/${userToFollow.username}`);
    }
    catch(error){
        res.render('profile',{error:'An error occured while following the user'});
    }
}

async function handlePostUnfollowRequest(req,res){
    try {
        const userToUnfollow = await User.findOne({username:req.params.username});
        const currentUser = await User.findOne({username:req.user.username});

        if (userToUnfollow.followers.includes(req.user._id)) {
            userToUnfollow.followers = userToUnfollow.followers.filter(followerId => !followerId.equals(currentUser._id));
            currentUser.following = currentUser.following.filter(followingId => !followingId.equals(userToUnfollow._id));

            await userToUnfollow.save();
            await currentUser.save();
        }

        res.redirect(`/user/${userToUnfollow.username}`);
    } catch (error) {
        console.error(error);
        res.redirect('/');
    }
}

module.exports={
    handleGetUserSignin,
    handlePostUserSignin,
    handleGetUserSignup,
    handlePostUserSignup,
    handleUserLogout,
    handleGetUserSettings,
    handlePostUserSettings,
    handleGetUserProfile,
    handlePostFollowRequest,
    handlePostUnfollowRequest,
}