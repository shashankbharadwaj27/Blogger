const {Schema,model}=require('mongoose');

const blogSchema=new Schema({
    title:{
        type:String,
        required:true,
    },
    preview:{
        type:String,
    },
    body:{
        type:String,
        required:true,
    },
    coverImage:{
        type:String,
        required:false,
    },
    likes: {
        type: [{
            type: Schema.Types.ObjectId,
            ref: "User"
        }],
        unique: true
    },
    createdBy:{
        type:Schema.Types.ObjectId,
        ref:'user',
        required:true,
    }
},{timestamps:true});

const Blog=model('blog',blogSchema);

module.exports=Blog;