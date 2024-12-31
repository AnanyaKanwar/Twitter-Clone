import notification from "../models/notificationModel.js";
import User from "../models/userModel.js"
import bcrypt from 'bcryptjs'
import cloudinary from 'cloudinary'
export const getUserProfile=async(req,res)=>{
    const {username}=req.params;
    
    try {
        const user=await User.findOne({username}).select("-password")
        
            if(!user){
                return res.status(404).json({message:"User not found"})
            }
        res.status(200).json(user)
        
    } catch (error) {
        res.status(500).json({error:error.message})
        console.log("Error in get user profile :",error.message)
        
    }
}


export const followUnfollowUser = async (req, res) => {
    try {
        const { id } = req.params; // Get the user ID from the request parameters
        console.log("User ID from params:", id); // Log the user ID from params
        console.log("Current User ID:", req.user._id); // Log the current user ID

        const userToModify = await User.findById(id); // Find the user to modify
        const currentUser = await User.findById(req.user._id); // Find the currently authenticated user

        // Check if the user is trying to follow/unfollow themselves
        if (id === req.user._id.toString()) {
            return res.status(400).json({ error: "You can't follow/unfollow yourself" });
        }

        // Check if both users exist
        if (!userToModify || !currentUser) {
            console.log("User to modify or current user not found"); // Log if either user is not found
            return res.status(404).json({ error: "User not found" });
        }

        const isFollowing = currentUser.following.includes(id); // Check if current user is already following the user to modify

        if (isFollowing) {
            // Unfollow the user
            await User.findByIdAndUpdate(id, { $pull: { followers: req.user._id } });
            await User.findByIdAndUpdate(req.user._id, { $pull: { following: id } });
            return res.status(200).json({ message: "User unfollowed successfully" });
        } else {
            // Follow the user
            await User.findByIdAndUpdate(id, { $push: { followers: req.user._id } });
            await User.findByIdAndUpdate(req.user._id, { $push: { following: id } });

            const newNotification=new notification({
                type:'follow',
                from:req.user._id,
                to:userToModify._id

            })

            await newNotification.save();
            return res.status(200).json({ message: "User followed successfully" });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
        console.log("Error in follow/unfollow user:", error.message);
    }
};

export const getSuggestedUsers=async(req,res)=>{
    try {
        // exclude current user and also those users that we already follow
        const userId=req.user._id
        const usersFollowedByMe=await User.findById(userId).select('following');
        const users=await User.aggregate([
            {
                $match:{
                    _id:{$ne:userId}
                }
            },
            {$sample:{size:10}}
        ])

        // filter out the user that i am already following
        const filteredUsers=users.filter(user=>!usersFollowedByMe.following.includes(user._id))
        const suggestedUsers=filteredUsers.slice(0,4)
        suggestedUsers.forEach((user=>user.password=null))
        res.status(200).json(suggestedUsers);

    } catch (error) {
        console.log('Error in getSuggestedUsers: ',error.message);
        res.status(500).json({error:error.message})
        
    }
}

export const updateUserProfile=async(req,res)=>{
    const {fullname,email,username,currentPassword,newPassword,bio,link,profileImg, coverImg }=req.body;
    const userId=req.user._id;
    try{
        const user=await User.findById(userId);
        if(!user) return res.status(404).json({message:"User not found"})


        if((!newPassword && currentPassword) || (!currentPassword && newPassword)){
            return res.status(400).json({error:"Please provide both current and new password"})
        }

        if(currentPassword && newPassword){
            const isMatch=await bcrypt.compare(currentPassword,user.password)

            if(!isMatch) return res.status(400).json({error:"Current Password is incorrect"})
            if(newPassword.length<6){
                return res.status(400).json({error:"Password must be atleast 6 characters long"})
            }

            const salt=await bcrypt.genSalt(10);
            user.password=await bcrypt.hash(newPassword,salt)
        }

        if(profileImg){
            if (user.profileImg) {
                // Extract the public ID from the URL to delete the old image
                const publicId = user.profileImg.split('/').pop().split('.')[0];
                await cloudinary.uploader.destroy(publicId);
            }


            const uploadedResponse=await cloudinary.uploader.upload(profileImg)
            profileImg=uploadedResponse.secure_url;

        }
        if(coverImg){

            if (user.coverImg) {
                // Extract the public ID from the URL to delete the old image
                const publicId = user.coverImg.split('/').pop().split('.')[0];
                await cloudinary.uploader.destroy(publicId);
            }
            const uploadedResponse=await cloudinary.uploader.upload(coverImg)
            coverImg=uploadedResponse.secure_url;

        }

                // Update other profile fields
                user.fullname = fullname || user.fullname;
                user.email = email || user.email;
                user.username = username || user.username;
                user.bio = bio || user.bio;
                user.link = link || user.link;
                user.profileImg = profileImg || user.profileImg;
                user.coverImg = coverImg || user.coverImg;
        
                // Save updated user data
                await user.save();

                user.password=null;
                
                
                res.status(200).json({ message: "Profile updated successfully", user });
            } catch (error) {
                console.log("Error in updateUserProfile:", error.message);
                res.status(500).json({ error: error.message });
            }
}
