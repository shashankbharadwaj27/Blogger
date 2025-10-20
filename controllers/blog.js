const Blog = require('../models/blog');
const Comments = require('../models/comments');
const mongoose = require('mongoose');
const cloudinary = require('../config/cloudinary');
const sharp = require('sharp');
const sanitizeHtml = require('sanitize-html');

const sanitizeOptions = {
    allowedTags: ['p', 'ul', 'ol', 'li', 'strong', 'em', 'br', 'a', 'h1', 'h2', 'h3'],
    allowedAttributes: {
        'a': ['href', 'target'], // only allow href and target for links
    },
    allowedSchemes: ['http', 'https'], // only safe URL schemes
};

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function handleGetAddBlog(req, res) {
    try {
        res.render('addBlog', { currentUser: req.user });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error loading this page');
    }
}

async function handlePostNewBlog(req, res) {
    try {
        const { title, preview, body } = req.body;
        
        if (!title || !body) {
            return res.status(400).render('addBlog', {
                currentUser: req.user,
                message: 'Title and body are required'
            });
        }

        const safeBody = sanitizeHtml(body, sanitizeOptions);

        let coverImageUrl = '';
        let coverImageId = '';
        if (req.file) {
            // Compress image
            const buffer = await sharp(req.file.buffer)
                .resize({ width: 1200 })
                .jpeg({ quality: 80 })
                .toBuffer();

            const uploadResult = await new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    { folder: 'blogs' },
                    (error, result) => {
                        if (error) return reject(error);
                        resolve(result);
                    }
                );
                stream.end(buffer);
            });

            coverImageUrl = uploadResult.secure_url;
            coverImageId = uploadResult.public_id;
        }

        const blog = await Blog.create({
            title,
            preview,
            body : safeBody,
            coverImage: coverImageUrl,
            coverImageId: coverImageId,
            createdBy: req.user._id
        });

        return res.redirect(`/blog/${blog._id}`);
    } catch (error) {
        console.error(error);
        res.status(500).render('addBlog', {
            currentUser: req.user,
            error: 'An error occurred while creating the blog post'
        });
    }
}

async function handleGetBlog(req, res) {
    try {
        if(!isValidObjectId(req.params.id )){
            return res.status(400).render('error', {
                status: 400,
                message: 'Invalid Blog Id format',
                currentUser: req.user
            });
        }
        const blog = await Blog.findById(req.params.id).populate('createdBy');
        if (!blog) {
            return res.status(404).render('error', {
                status: 404,
                message: 'Blog not found',
                currentUser: req.user
            });
        }

        const comments = await Comments.find({ blogId: req.params.id }).populate('createdBy');
        res.render('blog', {
            currentUser: req.user,
            blog,
            comments
        });
    } catch (error) {
        console.error(error);
        res.status(500).render('error', {
            status: 500,
            message: 'Internal Server Error',
            currentUser: req.user
        });
    }
}

async function handlePostComment(req, res) {
    try {
        const blog = await Blog.findById(req.params.blogId);
        if (!blog) {
            return res.status(404).render('error', {
                status: 404,
                message: 'Cannot comment on a non-existing blog',
                currentUser: req.user
            });
        }

        if (!req.body.content || req.body.content.trim() === '') {
            return res.redirect(`/blog/${req.params.blogId}`);
        }

        await Comments.create({
            content: req.body.content,
            blogId: req.params.blogId,
            createdBy: req.user._id
        });

        return res.redirect(`/blog/${req.params.blogId}`);
    } catch (error) {
        console.error(error);
        res.status(500).redirect(`/blog/${req.params.blogId}`);
    }
}

async function handleLikeBlog(req, res) {
    try {
        const blogId = req.params.id;
        const userId = req.user._id;

        const blog = await Blog.findById(blogId);
        if (!blog) {
            return res.status(404).json({ error: 'Blog not found' });
        }

        const update = blog.likes.includes(userId)
            ? { $pull: { likes: userId } }
            : { $addToSet: { likes: userId } };

        const updatedBlog = await Blog.findByIdAndUpdate(blogId, update, { new: true });
        if (!updatedBlog) {
            return res.status(404).json({ error: 'Failed to update blog likes' });
        }

        const liked = updatedBlog.likes.includes(userId);
        res.json({ liked, likesCount: updatedBlog.likes.length });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Something went wrong' });
    }
}

async function handleDeleteBlog(req, res) {
    try {
        const blogId = req.params.id;
        const blog = await Blog.findById(blogId);

        if (!blog) {
            return res.status(404).render('error', {
                status: 404,
                message: 'Invalid Blog ID',
                currentUser: req.user
            });
        }

        if (blog.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).render('error', {
                status: 403,
                message: 'You are not authorized to delete this blog',
                currentUser: req.user
            });
        }

        // Delete cover image from Cloudinary
        if (blog.coverImageId) {
            await cloudinary.uploader.destroy(blog.coverImageId);
        }

        await Blog.deleteOne({ _id: blogId });
        res.redirect(`/user/${req.user.username}`);
        
    } catch (err) {
        console.error(err);
        res.status(500).render('error', {
            status: 500,
            message: 'An error occurred while deleting the blog',
            currentUser: req.user
        });
    }
}

module.exports = {
    handleGetAddBlog,
    handlePostNewBlog,
    handleGetBlog,
    handlePostComment,
    handleLikeBlog,
    handleDeleteBlog
};
