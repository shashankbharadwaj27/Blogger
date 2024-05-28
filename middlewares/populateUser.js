require('dotenv').config();

const User=require('../models/user')
const jwt=require('jsonwebtoken');

const secret=process.env.secret;

const populateUser= async(req,res,next)=>{
    const token=req.cookies.token;

    if(!token){
        return next();
    }
    try{
        const decoded=jwt.verify(token,secret);
        const user= await User.findById(decoded._id).select('-password -salt');
        if(!user){
            return next();
        }
        req.user=user;
        next();
    }
    catch(error){}
}
module.exports=populateUser;