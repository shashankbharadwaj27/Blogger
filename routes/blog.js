const { Router } = require('express');
const Blog = require('../models/blog');
const Comments = require('../models/comments');
const multer = require('multer');
const path = require('path');
const { restrictToLoggedinUserOnly } = require('../middlewares/authentication');
const { handleGetAddBlog, handleGetBlog, handlePostComment, handlePostNewBlog, handleLikeBlog, handleDeleteBlog }=require('../controllers/blog')

const router = new Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.get('/add-blog', restrictToLoggedinUserOnly, handleGetAddBlog);

router.post('/:id/like',restrictToLoggedinUserOnly,handleLikeBlog);

router.post('/delete/:id',restrictToLoggedinUserOnly,handleDeleteBlog);

router.post('/', restrictToLoggedinUserOnly, upload.single('coverImage'),handlePostNewBlog);

router.get('/:id', restrictToLoggedinUserOnly, handleGetBlog);

router.post('/comment/:blogId', restrictToLoggedinUserOnly, handlePostComment);

module.exports = router;
