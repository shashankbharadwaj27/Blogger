const {Router}=require('express');
const User=require('../models/user');
const Blog=require('../models/blog');
const {restrictToLoggedinUserOnly}=require('../middlewares/authentication')
const router=Router();

router.get('/',restrictToLoggedinUserOnly,async (req,res)=>{
    const {q}=req.query;
    if(!q){
        return res.render('search',{error:'Please enter a valid input',currentUser:req.user});
    }
    try{

        const users=await User.find({
            $or:[
                {firstName:{$regex:q,$options:'i'}},
                {surname:{$regex:q,$options:'i'}}
            ]
        }).select('-password, -salt');
    
        const blogs= await Blog.find({
            title:{$regex:q,$options:'i'},
        })
    
        res.render('search',{blogs,users,currentUser:req.user});
    }
    catch(error){};
})

module.exports=router