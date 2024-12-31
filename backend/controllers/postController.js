import User from '../models/userModel.js'
import Post from '../models/postModel.js'
import cloudinary from 'cloudinary'
import notificationModel from '../models/notificationModel.js';

export const createPost=async (req,res)=>{
    try {
        const { text, img } = req.body;
        const userId=req.user._id.toString();

        const user=await User.findById(userId)
        if(!user) return res.status(404).json({message:"User not found"})
        if(!text && !img) {
            return res.status(404).json({error:"Post must have text or image"})
        }
        if(img){
            const uploadedResponse=await cloudinary.uploader.upload(img)
            img=uploadedResponse.secure_url
        }

        const newPost=new Post({
            user:userId,
            // user: The ID of the user creating the post.
            text,
            img
        })
        await newPost.save()
        res.status(201).json(newPost)
    } catch (error) {
        res.status(500).json({error:"Internal Server error"})
        console.log("Error in createPost controller: ",error)
        
    }
}

// export const deletePost=async (req,res)=>{
//     try {
//         const post=await Post.findById(req.params.id)
//         console.log("Trying to find post with ID:", req.params.id);

//         // req.params.id accesses the id parameter from the URL.
//         // This is typically used in routes like /posts/:id, where :id is a route parameter, and req.params.id would be the specific ID passed in the request URL. 
//         if(!post){
//             return res.status(400).json({error:"Post not found"})
//         }

//         if(post.user.toString() !== req.user._id.toString()){
//             // The code you provided is intended to check if the user requesting an action (like deletion) is the author of the post.
//             return res.status(401).json({error:"You are not authorized to delete this post"})
//         }

//         if (post.img) {
//             const imgId = post.img.split('/').pop().split('.')[0]; // Extract the image ID
//             await cloudinary.uploader.destroy(imgId); // Delete the image from Cloudinary
//         }
//         await Post.findByIdAndDelete(req.params.id)
//         res.status(200).json({message:"Post deleted successfully"})
//     } catch (error) {
//         console.log("Error in delete Post controller: ",error)
//         res.status(500).json({error:"Internal server error"})
//     }
// }


export const deletePost = async (req, res) => {
    try {
        console.log("Received request to delete post with ID:", req.params.id);
        
        const post = await Post.findById(req.params.id);
        console.log("Found post:", post);

        if (!post) {
            console.log("Post not found with ID:", req.params.id);
            return res.status(404).json({ error: "Post not found" });
        }

        if (post.user.toString() !== req.user._id.toString()) {
            console.log("User not authorized to delete this post");
            return res.status(401).json({ error: "You are not authorized to delete this post" });
        }

        if (post.img) {
            const imgId = post.img.split('/').pop().split('.')[0]; // Extract the image ID
            console.log("Deleting image from Cloudinary with ID:", imgId);
            await cloudinary.uploader.destroy(imgId); // Delete the image from Cloudinary
            console.log("Image deleted successfully from Cloudinary");
        }

        await Post.findByIdAndDelete(req.params.id);
        console.log("Post deleted successfully");
        
        res.status(200).json({ message: "Post deleted successfully" });
    } catch (error) {
        console.log("Error in deletePost controller:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};


export const commentOnPost=async(req,res)=>{
    try {
        const {text}=req.body
        const postId=req.params.id;
        const userId=req.user._id;

        if(!text){
            return res.status(400).json({ error: "Text field is required" });
        }
        const post=await Post.findById(postId)
        if(!post){
            return res.status(404).json({ error: "Post not found" });

        }

        const comment={user:userId,text}
        post.comments.push(comment)
        await post.save();
        res.status(200).json(post)
    } catch (error) {
        console.log("Error in commentOnPost controller: ",error)
        res.status(500).json({error:"Internal server error"})
        
    }
}

export const likeUnlikePost = async (req, res) => {
    try {
        const userId=req.user._id;
        const {id:postId}=req.params
        const post=await Post.findById(postId)
        if(!post){
            return res.status(404).json({error:"Post not found"})
        }
        const userLikedPost=post.likes.includes(userId)
        if(userLikedPost){
            // unlike post
            await Post.updateOne({_id:postId},{$pull:{likes:userId}})
            await User.updateOne({_id:userId},{$pull:{likedPosts:postId}})
            //  performs the "unlike" action.
            res.status(200).json({message:"Post unliked successfully"})
        }else{
            // Like post
            post.likes.push(userId);
            await User.updateOne({_id:userId},{$pull:{likedPosts:postId}})
            await post.save();

            const notification=new notificationModel({
                from:userId,
                to:post.user,
                type:"like"
                // watch video from 2.11
            });
            await notification.save();
            res.status(200).json({message:"Post liked successfully"})
        }
    } catch (error) {
        console.log("Error in likeUnlikePost controller: ",error)
        res.status(500).json({error:"Internal server error"})
        
    }
}


export const getAllPosts=async(req,res)=>{
    try {
        const posts=await Post.find().sort({createdAt:-1}).populate({
            path:"user",
            // populate allow you to get all info about the current user
            select:"-password"
        })
        .populate({
            path:"comments.user",
            select:"-password"

        })
        // this find() function finds all the id and sort it according to created date and (-1) sort it according to the lastest
        if(posts.length===0){
            console.log("No posts found.");
            return res.status(200).json([])}
            console.log("Posts retrieved successfully:", posts.length, "posts found.");

        res.status(200).json(posts);
    } catch (error) {
        console.log("Error in getAllPosts controller: ",error);
        res.status(500).json({error:"Internal server error"})
    }
}

export const getLikedPosts = async (req, res) => {
    const userId = req.params.id;
    try {
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: "User not found" });

        console.log("Liked Posts IDs:", user.likedPosts); // Log likedPosts array

        const likedPosts = await Post.find({ _id: { $in: user.likedPosts } })
            .populate({
                path: "user",
                select: "-password"
            })
            .populate({
                path: "comments.user",
                select: "-password"
            });

        res.status(200).json(likedPosts);
    } catch (error) {
        console.log("Error in getLikedPosts controller: ", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const getFollowingPosts = async (req, res) => {
	try {
		const userId = req.user._id;
		const user = await User.findById(userId); 

		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

		const following = user.following;
		const feedPosts = await Post.find({ user: { $in: following } })
			.sort({ createdAt: -1 })
			.populate({
				path: "user",
				select: "-password",
			})
			.populate({
				path: "comments.user",
				select: "-password",
			});

		res.status(200).json(feedPosts);
	} catch (error) {
		console.log("Error in getFollowingPosts controller: ", error);
		res.status(500).json({ error: "Internal server error" });
	}
};


export const getUserPosts = async (req, res) => {
	try {
		const { username } = req.params;

		const user = await User.findOne({ username });
		if (!user) return res.status(404).json({ error: "User not found" });

		const posts = await Post.find({ user: user._id })
			.sort({ createdAt: -1 })
			.populate({
				path: "user",
				select: "-password",
			})
			.populate({
				path: "comments.user",
				select: "-password",
			});

		res.status(200).json(posts);
	} catch (error) {
		console.log("Error in getUserPosts controller: ", error);
		res.status(500).json({ error: "Internal server error" });
	}
};