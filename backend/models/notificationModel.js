import mongoose from "mongoose";
const notificationSchema=new mongoose.Schema({
    from:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    to:{
        
            type:mongoose.Schema.Types.ObjectId,
            // mongoose.Schema.Types.ObjectId is a special type in Mongoose used to store an ID that refers to another document. Mongoose and MongoDB use this type to store references to other documents.
            ref:"User",
            required:true
        
    },

    type:{
        type:String,
        required:true,
        enum:['follow','like']
    },
    read:{
        type:Boolean,
        default:false

    }
},{timestamps:true})

const notification=mongoose.model('Notification',notificationSchema)

export default notification;