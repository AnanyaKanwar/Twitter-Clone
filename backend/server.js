import express from "express"
import dotenv from "dotenv";
import authRoute from "./routes/authRoute.js"
import userRoute from './routes/userRoute.js'
import postRoute from './routes/postRoute.js'
import notificationRoute from "./routes/notificationRoute.js";
import connectMongoDB from './db/connectMongoDB.js'
import cookieParser from "cookie-parser";
import cloudinary from "cloudinary";

dotenv.config();
cloudinary.config({
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET
});

const app=express();
// console.log(process.env.MONGO_URI)
app.use(express.json())
app.use(cookieParser())
// parses cookies and puts the cookie information on req object in the middleware.
app.use('/',authRoute)
app.use('/',userRoute)
app.use('/',postRoute)
app.use('/',notificationRoute)
const PORT=process.env.PORT || 8000;

app.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`)
    connectMongoDB();

})
