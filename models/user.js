const {Schema,model}=require('mongoose');
const bcrypt = require('bcryptjs');  

const userSchema=new Schema({
    username:{
        type:String,
        required:true,
        unique:true,
    },
    firstName:{
        type:String,
        required:true,
    },
    surname:{
        type:String,
        default:'',
    },
    email:{
        type:String,
        required:true,
        unique:true,
    },
    salt:{
        type:String,
    },
    password:{
        type:String,
        required:true,
    },
    profileImage:{
        type:String,
        default:'/images/avatar.png'
    },
    country:{
        type:String,
        default:'',
    },
    state:{
        type:String,
        default:'',
    },
    description:{
        type:String,
        default:'',
    },
    mobile:{
        type:String,
        default:'',
    },
    role:{
        type:String,
        enum:['USER','ADMIN'],
        default:'USER',
    },
    followers:[{
        type:Schema.Types.ObjectId,
        ref:'user',
    }],
    following:[{
        type:Schema.Types.ObjectId,
        ref:'user',
    }],
},{timestamps:true})


userSchema.pre('save',async function (next){
    const user=this;

    if(!user.isModified('password')) 
        return next();

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(user.password, salt);

    user.password = hashedPassword;
    user.salt = salt;
    
    next(); 
})

const user=model('user',userSchema);

module.exports=user;