const Blog = require('../models/blog');
const Comments = require('../models/comments');

function handleGetAddBlog(req,res){
    try{
        res.render('addBlog', { currentUser: req.user });
    }
    catch(error){
        res.send('Error loading this page');
    }
}

async function handlePostNewBlog(req,res){
    try {
        const { title,preview, body } = req.body;
        if (!title || !body) {
            return res.render('addBlog',{currentUser:req.user,message: 'Title and body are required' });
        }
        let coverImageUrl = '';
        if (req.file) {
            coverImageUrl = `/uploads/${req.file.filename}`;
        }
        const blog = await Blog.create({
            title,
            preview,
            body,
            coverImage: coverImageUrl,
            createdBy: req.user._id
        });
        return res.redirect(`/blog/${blog._id}`);
    } catch (error) {
        res.render('addBlog',{currentUser:req.user,error:'An error occurred while creating the blog post'})
    }
}

async function handleGetBlog(req,res){
    try {
        const blog = await Blog.findById(req.params.id).populate('createdBy');
        const comments = await Comments.find({ blogId: req.params.id }).populate('createdBy');
        res.render('blog', {
            currentUser: req.user,
            blog,
            comments,
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
}

async function handlePostComment(req,res){
    try {
        await Comments.create({
            content: req.body.content,
            blogId: req.params.blogId,
            createdBy: req.user._id,
        });
        return res.redirect(`/blog/${req.params.blogId}`);
    } catch (error) {
        res.redirect(`/blog/${req.params.blogId}`);
    }
}
async function handlePostLikeBlog(req,res){
    try {
        const blogId = req.params.id;
        const userId = req.user._id;
        const blog = await Blog.findById(blogId);

        if (!blog) {
            return res.status(404).send({ error: 'Blog not found' });
        }

        const userIndex = blog.likes.indexOf(userId);

        if (userIndex === -1) {
            blog.likes.push(userId);
            liked = true; // Like the blog
        } else {
            blog.likes.splice(userIndex, 1);
            liked = false; // Unlike the blog
        }

        await blog.save();

        res.json({ liked, likesCount: blog.likes.length });
    } catch (error) {
        res.status(500).send({ error: 'Error liking the blog' });
    }
}

module.exports={
    handleGetAddBlog,
    handlePostNewBlog,
    handleGetBlog,
    handlePostComment,
    handlePostLikeBlog,
}