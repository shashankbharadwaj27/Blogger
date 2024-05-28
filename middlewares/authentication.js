const {validateToken}=require('../services/authentication');

function checkForCookieValue(cookieName){
    return (req,res,next)=>{
        tokenCookieValue=req.cookies[cookieName];
        if(!tokenCookieValue){
            return next();
        }
        try{
            const userPayload=validateToken(tokenCookieValue);
            req.user=userPayload;
        }
        catch(error){}
        return next();
    }
}

async function restrictToLoggedinUserOnly(req, res, next) {
    const token = req.cookies?.token;
  
    if (!token)
      return res.render("home",{message:'Login to create blogs & access these features'});
  
    const user = await validateToken(token);
  
    if (!user) 
      return res.redirect("/");

    req.user = user;
    next();
}


module.exports={checkForCookieValue,restrictToLoggedinUserOnly};