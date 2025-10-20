require('dotenv').config();

const JWT=require('jsonwebtoken');

const secret=process.env.SESSION_SECRET;

function createUserToken(user){
    const payload={
        _id:user._id,
        username:user.username,
        firstName:user.firstName,
        surname:user.surname,
        email:user.email,
        mobile:user.mobile,
        country:user.country,
        state:user.state,
        description:user.description,
        role:user.role,
        profileImageUrl:user.profileImageUrl
    }
    const token=JWT.sign(payload,secret);
    return token;
}

function validateToken(token){
    const payload=JWT.verify(token,secret);
    return payload;
}

module.exports={
    createUserToken,
    validateToken
}