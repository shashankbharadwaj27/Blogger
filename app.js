require('dotenv').config();

const express=require('express');
const path=require('path');
const userRoute=require('./routes/user');
const blogRoute=require('./routes/blog')
const searchRoute=require('./routes/search');
const mongoose=require('mongoose');
const cookieParser=require('cookie-parser');
const {checkForCookieValue,restrictToLoggedinUserOnly}=require('./middlewares/authentication');
const User=require('./models/user');
const Blog=require('./models/blog');
const populateUser=require('./middlewares/populateUser');

const app=express();
const PORT=process.env.PORT || 8000;

mongoose.connect(process.env.MONGO_URL)
.then(console.log('MongoDB Connected')).catch(err=>console.log(err))

app.set('view engine','ejs');
app.set('views',path.resolve('./views')); 
app.use(express.urlencoded({extended:false})); 
app.use(express.static(path.resolve('./public')))
app.use(cookieParser());
app.use(checkForCookieValue('token'));
app.use(populateUser);

app.use('/user',userRoute)
app.use('/blog',blogRoute)
app.use('/search',searchRoute)
app.get('/',async(req,res)=>{
    if(!req.user){
        return res.render('home')
    }
    try {
        let blogs;
        const user = await User.findById(req.user._id).populate('following');

        if(user.following.length===0){
            return res.render('home',{currentUser:req.user})
        }

        if (user.following.length > 0) {
            blogs = await Blog.find({ createdBy: { $in: user.following } });
        }
        res.render('home',{
            currentUser:req.user,
            blogs:blogs
        })
    }
    catch(error){
        console.error(error);
        res.render('home',{error:'Error loading the blogs'});
    }
})

app.listen(PORT,()=>console.log(`server started at: http://localhost:${PORT}`));
