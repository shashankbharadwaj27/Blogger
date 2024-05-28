const { Router } = require('express');
const Blog = require('../models/blog');
const Comments = require('../models/comments');
const multer = require('multer');
const path = require('path');
const { restrictToLoggedinUserOnly } = require('../middlewares/authentication');
const { handleGetAddBlog, handleGetBlog, handlePostComment, handlePostNewBlog, handlePostLikeBlog }=require('../controllers/blog')

const router = new Router();

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.resolve(`./public/uploads`));
    },
    filename: function (req, file, cb) {
        const fileName = `${Date.now()}-${file.originalname}`;
        cb(null, fileName);
    }
});

const upload = multer({ storage: storage });

router.get('/add-blog', restrictToLoggedinUserOnly, handleGetAddBlog);

router.post('/:id/like',restrictToLoggedinUserOnly,handlePostLikeBlog);

router.post('/', restrictToLoggedinUserOnly, upload.single('coverImage'),handlePostNewBlog);

router.get('/:id', restrictToLoggedinUserOnly, handleGetBlog);

router.post('/comment/:blogId', restrictToLoggedinUserOnly, handlePostComment);

module.exports = router;
