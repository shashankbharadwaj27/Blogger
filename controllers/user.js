require('dotenv').config();

const { Router } = require('express');
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const path = require('path');
const multer = require('multer');
const { createUserToken } = require('../services/authentication');
const { restrictToLoggedinUserOnly } = require('../middlewares/authentication');
const Blog = require('../models/blog');
const cloudinary = require('../config/cloudinary');
const sharp = require('sharp');

const router = Router();


function handleGetUserSignin(req, res) {
    try {
        res.render('signin');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error loading this page');
    } 
}

async function handlePostUserSignin(req, res) {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).render('signin', { error: 'User not found' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).render('signin', { error: 'Incorrect password' });
        }
        const token = createUserToken(user);
        res.cookie('token', token).redirect('/');
    } catch (error) {
        console.error(error);
        res.status(500).render('signin', { error: 'An error occurred' });
    }
}

function handleGetUserSignup(req, res) {
    try {
        res.render('signup');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error loading this page');
    }
}

async function handlePostUserSignup(req, res) {
    try {
        const { firstName, email, password, username } = req.body;
        key = process.env.EMAIL_VALIDATION_KEY;
        const url = `https://api.emailvalidation.io/v1/info?apikey=${key}&email=${email}`;
        let response = await fetch(url);
        let result = await response.json();
        if (result.smtp_check === false) {
            return res.status(400).render('signup', { message: 'Invalid email address. Please use a valid email' });
        }
        await User.create({ firstName, email, password, username });
        return res.redirect('/user/signin');
    } catch (error) {
        console.error(error);
        if (error.code === 11000 && error.keyPattern.username) {
            return res.status(400).render('signup', { error: 'Username is already taken' });
        }
        if (error.code === 11000 && error.keyPattern.email) {
            return res.status(400).render('signup', { error: 'Entered Email is already in use' });
        }
        res.status(500).render('signup', { error: 'An error occurred while signing up' });
    }
}

function handleUserLogout(req, res) {
    try {
        res.cookie('token', '', { maxAge: 1 });
        res.redirect('/user/signin');
    } catch (error) {
        console.error(error);
        res.status(500).render('home', { error: 'An error occurred while logging out' });
    }
}

async function handleGetUserSettings(req, res) {
    try {
        const user = await User.findOne({ username: req.user.username });
        if (!user) {
            return res.status(404).render('error', { status: 404, message: 'User not found', currentUser: req.user });
        }
        res.render('settings', {
            currentUser: user
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error loading this page');
    }
}

async function handlePostUserSettings(req, res) {
    try {
        const { username, firstName, surname, mobile, description, email, country, state, deleteProfileImage } = req.body;
        const currentUser = await User.findById(req.user._id);

        if (!currentUser) {
            return res.status(404).render('error', { status: 404, message: 'User not found', currentUser: req.user });
        }

        if (req.file) {
            const buffer = await sharp(req.file.buffer)
                    .resize({ width: 1200 })
                    .jpeg({ quality: 80 })
                    .toBuffer();
            
            const uploadResult = await new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    { folder: 'profile-photos' },
                    (error, result) => {
                        if (error) return reject(error);
                        resolve(result);
                    }
                );
                stream.end(buffer);
            });

            currentUser.profileImageUrl = uploadResult.secure_url;
            currentUser.profileImageId = uploadResult.public_id
        }
        if (deleteProfileImage && currentUser.profileImageId) {
            await cloudinary.uploader.destroy(currentUser.profileImageId);
            currentUser.profileImageId = null;
            currentUser.profileImageUrl = '/images/avatar.png';
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
        req.user = currentUser;
        res.redirect(`/user/${currentUser.username}`);
    } catch (error) {
        console.error(error);
        res.status(500).render('settings', { error: 'An error occurred', currentUser: req.user });
    }
}

async function handleGetUserProfile(req, res) {
    try {
        const { username } = req.params;
        const user = await User.findOne({ username });

        if (!user) {
            return res.status(404).render('error', { status: 404, message: 'User not found', currentUser: req.user });
        }

        const allBlogs = await Blog.find({ createdBy: user._id });

        if (!allBlogs || allBlogs.length === 0) {
            return res.render('profile', { user, allBlogs: [], message: 'No blogs yet', currentUser: req.user });
        }

        res.render('profile', {
            user,
            allBlogs,
            currentUser: req.user
        });
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { status: 500, message: 'An error occurred', currentUser: req.user });
    }
}

async function handlePostFollowRequest(req, res) {
    try {
        const userToFollow = await User.findOne({ username: req.params.username });
        if (!userToFollow) {
            return res.status(404).render('error', { status: 404, message: 'User not found', currentUser: req.user });
        }

        const currentUser = await User.findById(req.user._id);
        if (!currentUser) {
            return res.status(404).render('error', { status: 404, message: 'Current user not found', currentUser: req.user });
        }

        if (!userToFollow.followers.includes(currentUser._id)) {
            currentUser.following.push(userToFollow._id);
            userToFollow.followers.push(currentUser._id);

            await userToFollow.save();
            await currentUser.save();
        }
        res.redirect(`/user/${userToFollow.username}`);
    } catch (error) {
        console.error(error);
        res.status(500).render('profile', { error: 'An error occurred while following the user', currentUser: req.user });
    }
}

async function handlePostUnfollowRequest(req, res) {
    try {
        const userToUnfollow = await User.findOne({ username: req.params.username });
        if (!userToUnfollow) {
            return res.status(404).render('error', { status: 404, message: 'User not found', currentUser: req.user });
        }

        const currentUser = await User.findOne({ username: req.user.username });
        if (!currentUser) {
            return res.status(404).render('error', { status: 404, message: 'Current user not found', currentUser: req.user });
        }

        if (userToUnfollow.followers.includes(req.user._id)) {
            userToUnfollow.followers = userToUnfollow.followers.filter(followerId => !followerId.equals(currentUser._id));
            currentUser.following = currentUser.following.filter(followingId => !followingId.equals(userToUnfollow._id));

            await userToUnfollow.save();
            await currentUser.save();
        }

        res.redirect(`/user/${userToUnfollow.username}`);
    } catch (error) {
        console.error(error);
        res.status(500).redirect('/');
    }
}

module.exports = {
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
};
