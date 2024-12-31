import { generateTokenaAndSetCookie } from "../lib/utils/generateTokens.js";
import User from "../models/userModel.js"
import bcrypt from 'bcryptjs'

export const signup = async (req, res) => {

    return res.status(200).json({
        message:"hiiiii"
    })
    try {
        // return res.json({
        //     message:"inside signup server"
        // })
        const { fullname, username, email, password } = req.body;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^s@]+$/;

        // Check if email is invalid
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: "Invalid email format" });
        }

        const existingUser=await User.findOne({username});
            if(existingUser){
                return res.status(400).json({error:"Username is already taken"})
            }

        
        const existingEmail=await User.findOne({email});
            if(existingEmail){
                return res.status(400).json({error:"Email is already taken"})
            }

        if(password.length <6){
            return res.status(400).json({error:"Password must be atleast 6 characters long"})
        }

        // hash password
        /*
        1-create salt-a salt is a random value added to a password before it’s hashed.
        2-genSalt is a method provided by bcrypt to create a salt, a random string added to the password before hashing.
        3-bcrypt performs several rounds of hashing on the password combined with the salt.


         */
        const salt=await bcrypt.genSalt(10);
        const hashedPassword=await bcrypt.hash(password,salt)
        const newUser=new User(
            {
                fullname:fullname,
                username:username,
                email:email,
                password:hashedPassword

            }
        )


        if(newUser){
            // generate token
            generateTokenaAndSetCookie(newUser._id,res)
            await newUser.save();
            res.status(201).json({
                _id:newUser._id,
                fullname:newUser.fullname,
                username:newUser.username,
                email:newUser.email,
                followers:newUser.followers,
                following:newUser.following,
                profileImg:newUser.profileImg,
                coverImg:newUser.coverImg
            })
        }
        else{
            res.status(400).json({error:"Invalid user data"})
        }



    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
};

export const login = async (req, res) => {
    try {
        const {username,password}=req.body;
        const user=await User.findOne({username});
        const isPasswordValid=user && (await bcrypt.compare(password,user?.password || ""))
        if(!user || !isPasswordValid){
            return res.status(400).json({error:"Invalid username or password"})
        }

        generateTokenaAndSetCookie(user._id,res)
        
        res.status(200).json({
            _id: user._id,
            fullname: user.fullname,
            username: user.username,
            email: user.email,
            followers: user.followers,
            following: user.following,
            profileImg: user.profileImg,
            coverImg: user.coverImg
        });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
  
};

export const logout = async (req, res) => {
    try {
        res.cookie("jwt","",{
            maxAge:0
        })
        res.status(200).json({message:"Logged out successfully"})
    } catch (error) {
        res.status(500).json({error:"Internal Server Error"})
        
    }
};

export const getMe=async(req,res)=>{
    try {
        const user=await User.findById(req.user._id).select("-password")
        res.status(200).json(user)
    } catch (error) {
        console.log("getme",error.message)
        res.status(500).json({error:"Internal Server Error"})
        
        
    }
}
