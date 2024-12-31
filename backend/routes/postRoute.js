import express from "express"
import { protectRoute } from "../middleware/protectRoute.js";
import { commentOnPost, createPost, deletePost, getAllPosts, getFollowingPosts, getLikedPosts, getUserPosts, likeUnlikePost } from "../controllers/postController.js";
const router=express.Router();

router.post('/create/post',protectRoute,createPost)
router.post('/comment/:id',protectRoute,commentOnPost)
router.post('/like/:id',protectRoute,likeUnlikePost)
router.delete('post/delete/:id',protectRoute,deletePost)
router.get('/posts/all',protectRoute,getAllPosts)
router.get('/likes/:id',protectRoute,getLikedPosts)
router.get("/following",protectRoute,getFollowingPosts)
router.get("/user/:username",protectRoute,getUserPosts)


export default router;